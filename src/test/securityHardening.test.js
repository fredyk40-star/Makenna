import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { clientState } = vi.hoisted(() => ({ clientState: { client: null } }));

vi.mock('../../api/_lib/supabase-server.js', () => ({
  getServerClient: () => clientState.client,
  requireServerClient: () => clientState.client,
}));

import { HttpError, MAX_BODY_BYTES, readBody } from '../../api/_lib/http.js';
import {
  createChildToken,
  hashCredential,
  hashCredentialStrong,
  hasVerifiedRecoveryRequest,
  requireActiveChild,
  verifyStoredCredential,
} from '../../api/_lib/child-auth.js';
import {
  consumeResetToken,
  createResetToken,
  recordResetToken,
} from '../../api/_lib/developer-auth.js';
import { checkRequestLimit } from '../../api/_lib/rate-limit.js';

const childId = 'kid12345678';

const tokenId = (token) => JSON.parse(
  Buffer.from(token.split('.')[0], 'base64url').toString('utf8'),
).jti;

const accountClient = (row) => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: row, error: null }),
      }),
    }),
  }),
});

beforeEach(() => {
  clientState.client = null;
  vi.stubEnv('CHILD_SESSION_SECRET', 'test-child-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API request size limits', () => {
  it('rejects oversized declared and actual bodies', () => {
    expect(() => readBody({
      headers: { 'content-length': String(MAX_BODY_BYTES + 1) },
      body: {},
    })).toThrow(HttpError);

    expect(() => readBody({
      body: { data: 'x'.repeat(MAX_BODY_BYTES) },
    })).toThrow(/too large/i);
  });

  it('accepts normal JSON bodies', () => {
    expect(readBody({ body: { action: 'login', childId } })).toEqual({
      action: 'login',
      childId,
    });
  });
});

describe('credential hash migration', () => {
  it('verifies legacy hashes and marks them for upgrade', () => {
    const legacy = hashCredential('1234');
    expect(verifyStoredCredential('1234', legacy)).toEqual({ valid: true, needsUpgrade: true });
    expect(verifyStoredCredential('9999', legacy).valid).toBe(false);
  });

  it('verifies new salted hashes without flagging an upgrade', () => {
    const strong = hashCredentialStrong('1234');
    expect(strong).not.toBe(hashCredentialStrong('1234'));
    expect(verifyStoredCredential('1234', strong)).toEqual({ valid: true, needsUpgrade: false });
    expect(verifyStoredCredential('9999', strong).valid).toBe(false);
  });
});

describe('child token revocation', () => {
  it('rejects devices signed out after the token was issued', async () => {
    const client = accountClient({
      child_id: childId,
      deleted_at: null,
      token_revoked_at: new Date().toISOString(),
    });
    await expect(requireActiveChild(client, createChildToken(childId), childId))
      .rejects.toMatchObject({ status: 401 });
  });

  it('rejects deleted accounts', async () => {
    const client = accountClient({
      child_id: childId,
      deleted_at: new Date().toISOString(),
      token_revoked_at: null,
    });
    await expect(requireActiveChild(client, createChildToken(childId), childId))
      .rejects.toMatchObject({ status: 403 });
  });
});

describe('single-use developer reset tokens', () => {
  it('consumes a local token only once', async () => {
    const token = createResetToken();
    expect(await recordResetToken(token)).toBe(true);
    expect(await consumeResetToken(token)).toBe(true);
    expect(await consumeResetToken(token)).toBe(false);
  });

  it('atomically consumes a database-backed token only once', async () => {
    const state = { row: null };
    clientState.client = {
      from: () => ({
        upsert: async (values) => {
          state.row = { ...values };
          return { error: null };
        },
        update: (values) => ({
          eq: (_field, value) => ({
            is: (_field, unused) => ({
              select: () => ({
                maybeSingle: async () => {
                  if (state.row?.jti === value && state.row.used_at === unused) {
                    state.row.used_at = values.used_at;
                    return { data: { jti: state.row.jti }, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          }),
        }),
      }),
    };

    const token = createResetToken();
    expect(tokenId(token)).toBeTruthy();
    expect(await recordResetToken(token)).toBe(true);
    expect(await consumeResetToken(token)).toBe(true);
    expect(await consumeResetToken(token)).toBe(false);
  });
});

describe('distributed request limits', () => {
  it('uses a shared counter and rejects once the configured maximum is reached', async () => {
    let count = 0;
    const windows = [];
    clientState.client = {
      rpc: async (_name, params) => {
        windows.push(params.p_window_seconds);
        count += 1;
        return { data: count, error: null };
      },
    };
    const req = { headers: { 'x-forwarded-for': '198.51.100.7' } };
    const options = { max: 2, windowMs: 60_000, message: 'Slow down.' };

    await expect(checkRequestLimit('tutor', req, childId, options, clientState.client))
      .resolves.toBeUndefined();
    await expect(checkRequestLimit('tutor', req, childId, options, clientState.client))
      .rejects.toMatchObject({ status: 429 });
    expect(windows[0]).toBe(60);
  });
});

describe('verified recovery prerequisites', () => {
  it('requires a recent, parent-verified support request', async () => {
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({
                  limit: async () => ({ data: [{ id: 'request-1' }], error: null }),
                }),
              }),
            }),
          }),
        }),
      }),
    };
    expect(await hasVerifiedRecoveryRequest(client, childId, 'parent@example.com')).toBe(true);
  });
});
