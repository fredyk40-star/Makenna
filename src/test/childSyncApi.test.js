import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { syncState } = vi.hoisted(() => ({ syncState: { operations: new Map() } }));

const fakeStore = () => ({
  kind: 'test',
  isConfigured: () => true,
  describeConfig: () => 'the test store',
  findAccount: vi.fn(async childId => syncState.account[childId] || null),
  updateAccount: vi.fn(async () => {}),
  findSyncOperation: vi.fn(async (childId, operationId) => (
    syncState.operations.get(`${childId}:${operationId}`) || null
  )),
  recordSyncOperation: vi.fn(async (row) => {
    syncState.operations.set(`${row.child_id}:${row.operation_id}`, row);
  }),
});

vi.mock('../../api/_lib/store.js', () => ({
  getStore: () => fakeStore(),
  requireStore: () => syncState.store,
  storeForClient: () => syncState.store,
  validOperationId: value => (
    typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null
  ),
}));

import childSyncHandler from '../../api/child-sync.js';
import { createChildToken } from '../../api/_lib/child-auth.js';

const childId = 'kid12345678';
const token = () => createChildToken(childId);

const invoke = async (body) => {
  const req = { method: 'POST', body, headers: {} };
  const res = {
    statusCode: null,
    payload: null,
    setHeader: vi.fn(),
    status(status) {
      this.statusCode = status;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  await childSyncHandler(req, res);
  return res;
};

const accountRow = (overrides = {}) => ({
  child_id: childId,
  full_name: 'Ama',
  avatar: 'default',
  progress: {},
  settings: {},
  parent_email: 'parent@example.com',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  version: 1,
  deleted_at: null,
  token_revoked_at: null,
  ...overrides,
});

const pushBody = (updatedAt) => ({
  action: 'push',
  tokens: { [childId]: token() },
  accounts: [{
    childId,
    fullName: 'Ama',
    progress: { books: 1 },
    settings: {},
    updatedAt,
    version: 2,
  }],
});

describe('child-sync API idempotency', () => {
  beforeEach(() => {
    syncState.operations.clear();
    syncState.account = { [childId]: accountRow() };
    syncState.store = fakeStore();
    vi.stubEnv('CHILD_SESSION_SECRET', 'test-child-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('applies a queued push once and returns the stored response on replay', async () => {
    const body = { ...pushBody('2026-01-02T00:00:00.000Z'), operationId: 'op_push_1' };

    const first = await invoke(body);
    expect(first.statusCode).toBe(200);
    expect(first.payload).toMatchObject({ success: true, count: 1, skipped: 0 });
    expect(syncState.store.updateAccount).toHaveBeenCalledTimes(1);

    const replay = await invoke(body);
    expect(replay.statusCode).toBe(200);
    expect(replay.payload).toMatchObject({ success: true, count: 1, replayed: true });
    expect(syncState.store.updateAccount).toHaveBeenCalledTimes(1);
    expect(syncState.store.recordSyncOperation).toHaveBeenCalledTimes(1);
  });

  it('skips a push that is older than the cloud row', async () => {
    const response = await invoke(pushBody('2025-12-31T00:00:00.000Z'));

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({ success: true, count: 0, skipped: 1 });
    expect(syncState.store.updateAccount).not.toHaveBeenCalled();
  });

  it('does not apply a delete twice for the same queued operation', async () => {
    const body = {
      action: 'delete',
      childId,
      tokens: { [childId]: token() },
      operationId: 'op_delete_1',
    };

    const first = await invoke(body);
    expect(first.statusCode).toBe(200);
    expect(first.payload.success).toBe(true);
    expect(syncState.store.updateAccount).toHaveBeenCalledTimes(1);

    const replay = await invoke(body);
    expect(replay.statusCode).toBe(200);
    expect(replay.payload.replayed).toBe(true);
    expect(syncState.store.updateAccount).toHaveBeenCalledTimes(1);
  });

  it('rejects the whole batch before writing when one token is invalid', async () => {
    syncState.account.kid87654321 = accountRow({ child_id: 'kid87654321' });
    const response = await invoke({
      action: 'push',
      tokens: { [childId]: token() },
      accounts: [
        pushBody('2026-01-02T00:00:00.000Z').accounts[0],
        { childId: 'kid87654321', updatedAt: '2026-01-02T00:00:00.000Z' },
      ],
    });

    expect(response.statusCode).toBe(401);
    expect(syncState.store.updateAccount).not.toHaveBeenCalled();
  });
});
