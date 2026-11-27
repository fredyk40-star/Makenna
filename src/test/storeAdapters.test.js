import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const adapterState = {
  supabaseResult: { data: null, error: null },
  rpcResult: 0,
  supabaseApi: null,
  queries: [],
  queryImpl: null,
};

import { createSupabaseStore } from '../../api/_lib/store-supabase.js';
import { createTiDBStore } from '../../api/_lib/store-tidb.js';
import { getStore, validOperationId } from '../../api/_lib/store.js';

const createFakeSupabaseClient = () => {
  const api = {
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    is: vi.fn(() => api),
    in: vi.fn(() => api),
    gte: vi.fn(() => api),
    limit: vi.fn(() => api),
    order: vi.fn(() => api),
    insert: vi.fn(() => api),
    update: vi.fn(() => api),
    upsert: vi.fn(() => api),
    delete: vi.fn(() => api),
    maybeSingle: vi.fn(async () => adapterState.supabaseResult),
    single: vi.fn(async () => adapterState.supabaseResult),
  };
  adapterState.supabaseApi = api;
  adapterState.supabaseClient = {
    from: vi.fn(() => api),
    rpc: vi.fn(async () => ({ data: adapterState.rpcResult, error: null })),
  };
  return adapterState.supabaseClient;
};

const recordQuery = (rows = []) => async (sql, params) => {
  adapterState.queries.push({ sql, params });
  if (/^\s*SELECT/i.test(sql)) return [rows, []];
  return [{ affectedRows: 1 }];
};

const clearTiDBEnv = () => {
  ['TIDB_HOST', 'TIDB_PORT', 'TIDB_DATABASE', 'TIDB_USER', 'TIDB_PASSWORD', 'TIDB_CA'].forEach(
    key => vi.stubEnv(key, ''),
  );
};

describe('data-store selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to Supabase when DATA_STORE is unset', () => {
    vi.stubEnv('DATA_STORE', '');
    expect(getStore().kind).toBe('supabase');
  });

  it('selects TiDB only when explicitly requested and configured', () => {
    vi.stubEnv('DATA_STORE', 'tidb');
    vi.stubEnv('TIDB_HOST', 'db.example.invalid');
    vi.stubEnv('TIDB_PORT', '4000');
    vi.stubEnv('TIDB_DATABASE', 'makenna');
    vi.stubEnv('TIDB_USER', 'makenna_app');
    vi.stubEnv('TIDB_PASSWORD', 'placeholder');
    expect(getStore().kind).toBe('tidb');

    clearTiDBEnv();
    try {
      getStore();
      throw new Error('Expected a configuration error');
    } catch (error) {
      expect(error.status).toBe(503);
      expect(error.message).toContain('credentials are missing');
    }
  });

  it('rejects unknown store modes', () => {
    vi.stubEnv('DATA_STORE', 'postgres');
    try {
      getStore();
      throw new Error('Expected an unsupported-store error');
    } catch (error) {
      expect(error.status).toBe(500);
    }
  });

  it('accepts only URL-safe operation ids as retry keys', () => {
    expect(validOperationId('op_abc-123')).toBe('op_abc-123');
    expect(validOperationId('bad id')).toBeNull();
    expect(validOperationId('a'.repeat(129))).toBeNull();
  });
});

describe('Supabase adapter', () => {
  beforeEach(() => {
    adapterState.supabaseResult = { data: null, error: null };
    adapterState.rpcResult = 0;
    createFakeSupabaseClient();
  });

  it('reads an account through the semantic contract', async () => {
    adapterState.supabaseResult = {
      data: { child_id: 'kid12345678', full_name: 'Ama' },
      error: null,
    };
    const store = createSupabaseStore(adapterState.supabaseClient);
    const row = await store.findAccount('kid12345678');

    expect(row.full_name).toBe('Ama');
  });

  it('uses the shared RPC for the atomic rate-limit counter', async () => {
    adapterState.rpcResult = 6;
    const store = createSupabaseStore(adapterState.supabaseClient);
    const count = await store.bumpRateLimit('login:test', 900);

    expect(count).toBe(6);
    expect(adapterState.supabaseClient.rpc).toHaveBeenCalledWith('bump_auth_failure', {
      p_key: 'login:test',
      p_window_seconds: 900,
    });
  });

  it('stores client operation ids without reusing record versions', async () => {
    const store = createSupabaseStore(adapterState.supabaseClient);
    await store.recordSyncOperation({
      child_id: 'kid12345678',
      operation_id: 'op_1',
      action: 'delete',
      response: { childId: 'kid12345678' },
      created_at: '2026-01-01T00:00:00.000Z',
    });

    expect(adapterState.supabaseClient.from).toHaveBeenCalledWith('sync_operations');
    expect(adapterState.supabaseApi.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ operation_id: 'op_1' }),
      { onConflict: 'child_id,operation_id' },
    );
  });
});

describe('TiDB adapter SQL generation', () => {
  beforeEach(() => {
    adapterState.queries = [];
    adapterState.queryImpl = recordQuery();
  });

  const store = () => createTiDBStore({ query: adapterState.queryImpl });

  it('uses bound parameters and parses JSON/date values on reads', async () => {
    adapterState.queryImpl = recordQuery([{
      child_id: 'kid12345678',
      progress: '{"books":3}',
      settings: null,
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    }]);
    const row = await store().findAccount('kid12345678');
    const { sql, params } = adapterState.queries[0];

    expect(sql).toContain('SELECT * FROM ?? WHERE ?? = ? LIMIT ?');
    expect(params).toEqual(['child_accounts', 'child_id', 'kid12345678', 1]);
    expect(row.progress).toEqual({ books: 3 });
    expect(row.updated_at).toBe('2026-01-01T00:00:00.000Z');
    expect(sql).not.toContain('kid12345678');
  });

  it('keeps JSON payloads and hostile strings out of the SQL text', async () => {
    await store().updateAccount('kid12345678', {
      full_name: "Ama'); DROP TABLE child_accounts; --",
      progress: { books: 3 },
    });
    const { sql, params } = adapterState.queries[0];

    expect(sql).toContain('UPDATE ?? SET ?? = ?, ?? = ? WHERE ?? = ?');
    expect(params).toContain(JSON.stringify({ books: 3 }));
    expect(params).toContain("Ama'); DROP TABLE child_accounts; --");
    expect(sql).not.toContain('DROP TABLE');
    expect(sql).not.toContain('{"books":3}');
  });

  it('uses an atomic upsert for the shared rate limit', async () => {
    adapterState.queryImpl = async (sql, params) => {
      adapterState.queries.push({ sql, params });
      if (/^\s*SELECT/i.test(sql)) return [[{ count: '4' }], []];
      return [{ affectedRows: 1 }];
    };
    const count = await store().bumpRateLimit('login:test', 900);
    const upsert = adapterState.queries[0];

    expect(count).toBe(4);
    expect(upsert.sql).toContain('INSERT INTO ??');
    expect(upsert.sql).toContain('ON DUPLICATE KEY UPDATE');
    expect(upsert.params).toContain('login:test');
    expect(upsert.params).toContain(900);
  });

  it('makes reset-token consumption single-use in one statement', async () => {
    const consumed = await store().consumeResetToken('jti-1', '2026-01-01T00:00:00.000Z');
    const { sql, params } = adapterState.queries[0];

    expect(consumed).toBe(true);
    expect(sql).toContain('WHERE ?? = ? AND ?? IS NULL');
    expect(params).toEqual([
      'developer_reset_tokens', 'used_at', '2026-01-01T00:00:00.000Z',
      'jti', 'jti-1', 'used_at',
    ]);
  });

  it('records sync operations as idempotency keys, not versions', async () => {
    adapterState.queryImpl = recordQuery([{
      child_id: 'kid12345678',
      operation_id: 'op_1',
      action: 'delete',
      response: '{"childId":"kid12345678"}',
    }]);
    const activeStore = store();
    await activeStore.recordSyncOperation({
      child_id: 'kid12345678',
      operation_id: 'op_1',
      action: 'delete',
      response: { childId: 'kid12345678' },
      created_at: '2026-01-01T00:00:00.000Z',
    });
    const replay = await activeStore.findSyncOperation('kid12345678', 'op_1');

    expect(adapterState.queries[0].sql).toContain('ON DUPLICATE KEY UPDATE');
    expect(adapterState.queries[0].params).toContain('{"childId":"kid12345678"}');
    expect(replay.response).toEqual({ childId: 'kid12345678' });
  });
});
