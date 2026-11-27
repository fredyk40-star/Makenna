import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authorizedChildIds,
  createChildToken,
  hashCredential,
  requireChildToken,
  safeEqual,
  syncPatch,
  toClientAccount,
  validateChildId,
  verifyChildToken,
} from '../../api/_lib/child-auth.js';
import { ChildAccountService } from '../services/ChildAccountService.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('server-side child credential helpers', () => {
  it('matches the historical browser hash so existing accounts still work', async () => {
    vi.stubEnv('CHILD_SESSION_SECRET', 'test-child-secret');
    expect(hashCredential('1234')).toBe(await ChildAccountService.hashPin('1234'));
    expect(hashCredential('1234')).not.toBe(hashCredential('1235'));
    expect(safeEqual(hashCredential('1234'), hashCredential('1234'))).toBe(true);
    expect(safeEqual(hashCredential('1234'), hashCredential('1235'))).toBe(false);
  });

  it('accepts new and legacy child IDs case-insensitively', () => {
    expect(validateChildId('KID12345678')).toBe(true);
    expect(validateChildId('kid-7')).toBe(true);
    expect(validateChildId('kid123')).toBe(false);
    expect(validateChildId('not-an-id')).toBe(false);
  });

  it('signs device tokens that cannot be forged or reused for another child', () => {
    vi.stubEnv('CHILD_SESSION_SECRET', 'test-child-secret');
    const childId = 'kid12345678';
    const token = createChildToken('KID12345678');

    expect(verifyChildToken(token)).toBe(childId);
    expect(verifyChildToken(`${token}tampered`)).toBeNull();
    expect(verifyChildToken(token.split('.')[0])).toBeNull();
    expect(authorizedChildIds({ [childId.toUpperCase()]: token })).toEqual([childId]);
    expect(authorizedChildIds({ kid87654321: token })).toEqual([]);
    expect(() => requireChildToken(token, 'kid87654321')).toThrow(/no longer authorised/i);
  });

  it('rejects expired device tokens', () => {
    vi.stubEnv('CHILD_SESSION_SECRET', 'test-child-secret');
    const expired = Buffer.from(JSON.stringify({
      type: 'child',
      childId: 'kid12345678',
      exp: Math.floor(Date.now() / 1000) - 10,
    })).toString('base64url');
    const signature = crypto.createHmac('sha256', 'test-child-secret')
      .update(expired)
      .digest('base64url');

    expect(verifyChildToken(`${expired}.${signature}`)).toBeNull();
  });

  it('never includes credential hashes in client-facing account or sync payloads', () => {
    const row = {
      child_id: 'kid12345678',
      full_name: 'Ama',
      pin_hash: 'pin-secret',
      password_hash: 'password-secret',
      temp_password_hash: 'temp-secret',
      parent_email: 'parent@example.com',
      pin_set: true,
      password_set: false,
      requires_credential_reset: false,
      updated_at: '2026-01-01T00:00:00.000Z',
    };

    const account = toClientAccount(row);
    expect(account.childId).toBe('kid12345678');
    expect(account.parentEmail).toBe('parent@example.com');
    expect(account).not.toHaveProperty('pin_hash');
    expect(account).not.toHaveProperty('pinHash');
    expect(account).not.toHaveProperty('password_hash');
    expect(account).not.toHaveProperty('temp_password_hash');

    const patch = syncPatch({
      fullName: 'Ama',
      progress: { letters: 1 },
      pinHash: 'pin-secret',
      passwordHash: 'password-secret',
      tempPasswordHash: 'temp-secret',
      updatedAt: row.updated_at,
    });
    expect(patch).toHaveProperty('full_name', 'Ama');
    expect(patch).toHaveProperty('progress', { letters: 1 });
    expect(patch).not.toHaveProperty('pinHash');
    expect(patch).not.toHaveProperty('passwordHash');
    expect(patch).not.toHaveProperty('tempPasswordHash');
  });
});
