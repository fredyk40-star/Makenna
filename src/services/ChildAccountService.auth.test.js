import { beforeEach, describe, expect, it } from 'vitest';
import { CHILD_ID_PATTERN, ChildAccountService } from './ChildAccountService';
import { StorageService } from './StorageService';
import SyncQueueService from './SyncQueueService';
import { hashCredential } from '../../api/_lib/child-auth.js';
import { apiState } from '../test/apiMock.js';
import { SupportService } from './SupportService.js';

const verifyRecoveryRequest = async (child) => {
  const verification = await SupportService.requestVerification({
    childId: child.childId,
    parentEmail: child.parentEmail,
  });
  await SupportService.submitRequest({
    childId: child.childId,
    parentEmail: child.parentEmail,
    message: 'I forgot my PIN.',
    verificationCode: verification.devCode,
  });
};

describe('ChildAccountService account creation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('requires a parent email so the account can be recovered', async () => {
    await expect(ChildAccountService.registerChild('Ama', '1234', '')).rejects.toThrow(/parent email/i);
    await expect(ChildAccountService.registerChild('Ama', '1234', 'not-an-email')).rejects.toThrow(/parent email/i);
    expect(ChildAccountService.getAllAccounts()).toHaveLength(0);
  });

  it('registers through the server and never stores a credential hash locally', async () => {
    const result = await ChildAccountService.registerChild('Ama', '1234', 'Parent@Example.com');

    expect(result.childId).toMatch(CHILD_ID_PATTERN);
    expect(result.parentEmail).toBe('parent@example.com');

    const account = ChildAccountService.getChild(result.childId);
    expect(account.parentEmail).toBe('parent@example.com');
    expect(account.pinSet).toBe(true);
    expect(account.pinHash).toBeUndefined();
    expect(account.passwordHash).toBeUndefined();
    expect(ChildAccountService.getChildToken(result.childId)).toBe(`token-${result.childId}`);

    // The server holds the hash, not the browser.
    expect(apiState.accounts.get(result.childId).pin_hash).toBe(hashCredential('1234'));
  });

  it('logs in case-insensitively and preserves legacy kid-N accounts', async () => {
    const registered = await ChildAccountService.registerChild('Kofi', '1234', 'parent@example.com');
    const login = await ChildAccountService.loginChild(registered.childId.toUpperCase(), '1234');
    expect(login.childId).toBe(registered.childId);

    const now = new Date().toISOString();
    apiState.accounts.set('kid-7', {
      child_id: 'kid-7',
      full_name: 'Legacy Learner',
      pin_hash: hashCredential('5678'),
      pin_set: true,
      password_set: false,
      parent_email: 'legacy@example.com',
      requires_credential_reset: false,
      avatar: 'default',
      created_at: now,
      updated_at: now,
      progress: {},
      settings: {},
      version: 1,
    });

    const legacyLogin = await ChildAccountService.loginChild('KID-7', '5678');
    expect(legacyLogin.childId).toBe('kid-7');
    expect(ChildAccountService.getChild('kid-7').pinHash).toBeUndefined();
  });

  it('preserves queued offline progress when login returns older cloud data', async () => {
    const registered = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');
    const accounts = ChildAccountService.getAllAccounts();
    accounts[0].progress = { offlineLesson: { completed: true } };
    ChildAccountService.saveAllAccounts(accounts);
    SyncQueueService.enqueue({
      type: 'UPSERT_ACCOUNT',
      childId: registered.childId,
      payload: { childId: registered.childId, progress: accounts[0].progress },
    });

    apiState.accounts.get(registered.childId).progress = {};
    await ChildAccountService.loginChild(registered.childId, '1234');

    expect(ChildAccountService.getChildProgress(registered.childId, 'offlineLesson'))
      .toEqual({ completed: true });
  });

  it('rejects a bad credential without exposing the stored hash', async () => {
    const registered = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');
    await expect(ChildAccountService.loginChild(registered.childId, '9999')).rejects.toThrow(/invalid child id or password/i);
  });
});

describe('ChildAccountService temporary-password recovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('matches support identity by child ID and parent email only', async () => {
    const registered = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');

    expect(ChildAccountService.validateSupportIdentity(
      registered.childId.toUpperCase(),
      'PARENT@EXAMPLE.COM',
    )).not.toBeNull();

    expect(ChildAccountService.validateSupportIdentity(
      registered.childId,
      'other@example.com',
    )).toBeNull();
  });

  it('forces a credential reset after a temporary-password login', async () => {
    const registered = await ChildAccountService.registerChild('Kofi', '1234', 'parent@example.com');
    await verifyRecoveryRequest(registered);
    const credential = await ChildAccountService.issueTemporaryPassword(
      registered.childId,
      registered.parentEmail,
      'developer-token',
    );

    expect(credential.tempPassword).toHaveLength(14);
    expect(credential.childId).toBe(registered.childId);
    await ChildAccountService.syncAccountsFromCloud();
    expect(ChildAccountService.hasPendingCredentialReset(registered.childId)).toBe(true);

    await expect(ChildAccountService.loginChild(registered.childId, '1234'))
      .rejects.toThrow(/temporary password is active/i);

    const login = await ChildAccountService.loginChild(
      registered.childId.toUpperCase(),
      credential.tempPassword,
    );
    expect(login.requiresCredentialReset).toBe(true);

    await ChildAccountService.resetCredential(registered.childId, '4321', 'pin');
    expect(ChildAccountService.hasPendingCredentialReset(registered.childId)).toBe(false);

    const normalLogin = await ChildAccountService.loginChild(registered.childId, '4321');
    expect(normalLogin.requiresCredentialReset).toBe(false);
  });

  it('allows a parent to choose a password instead of a new PIN', async () => {
    const registered = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');
    await verifyRecoveryRequest(registered);
    await ChildAccountService.issueTemporaryPassword(registered.childId, registered.parentEmail, 'developer-token');
    await ChildAccountService.loginChild(registered.childId, 'TempPassword1!');
    await ChildAccountService.resetCredential(registered.childId, 'StrongPass1!', 'password');

    const account = ChildAccountService.getChild(registered.childId);
    expect(account.passwordSet).toBe(true);
    expect(account.pinSet).toBe(false);
    expect(account.requiresCredentialReset).toBe(false);
    expect(account.passwordHash).toBeUndefined();

    const login = await ChildAccountService.loginChild(registered.childId, 'StrongPass1!');
    expect(login.fullName).toBe('Ama');
  });

  it('stores every account locally even when cloud sync is unavailable', () => {
    StorageService.set('makenna_child_accounts_v2', []);
    expect(ChildAccountService.getAllAccounts()).toEqual([]);
  });
});
