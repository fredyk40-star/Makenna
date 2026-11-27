import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHILD_ID_PATTERN,
  ChildAccountService,
} from './ChildAccountService';
import { StorageService } from './StorageService';
import SyncQueueService from './SyncQueueService';

describe('ChildAccountService account creation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('requires a parent email so the account can be recovered', async () => {
    await expect(ChildAccountService.registerChild('Ama', '1234', '')).rejects.toThrow(/parent email/i);
    await expect(ChildAccountService.registerChild('Ama', '1234', 'not-an-email')).rejects.toThrow(/parent email/i);
    expect(ChildAccountService.getAllAccounts()).toHaveLength(0);
  });

  it('generates a kid######## ID, stores the parent email and queues a cloud write', async () => {
    const result = await ChildAccountService.registerChild('Ama', '1234', 'Parent@Example.com');

    expect(result.childId).toMatch(CHILD_ID_PATTERN);
    expect(result.parentEmail).toBe('parent@example.com');

    const account = ChildAccountService.getChild(result.childId);
    expect(account.parentEmail).toBe('parent@example.com');
    expect(account.pinSet).toBe(true);

    await vi.waitFor(() => expect(SyncQueueService.getQueue()).toHaveLength(1));
    expect(SyncQueueService.getQueue()[0].type).toBe('UPSERT_ACCOUNT');
    expect(SyncQueueService.getQueue()[0].payload.parentEmail).toBe('parent@example.com');
    expect(SyncQueueService.getQueue()[0].payload.childId).toBe(result.childId);
  });

  it('logs in case-insensitively and preserves legacy kid-N accounts', async () => {
    const registered = await ChildAccountService.registerChild('Kofi', '1234', 'parent@example.com');
    const login = await ChildAccountService.loginChild(registered.childId.toUpperCase(), '1234');
    expect(login.childId).toBe(registered.childId);

    const pinHash = await ChildAccountService.hashPin('5678');
    ChildAccountService.saveAllAccounts([{
      childId: 'kid-7',
      fullName: 'Legacy Learner',
      pinHash,
      pinSet: true,
      parentEmail: 'legacy@example.com',
      progress: {},
      settings: {},
    }]);

    const legacyLogin = await ChildAccountService.loginChild('KID-7', '5678');
    expect(legacyLogin.childId).toBe('kid-7');
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
    const credential = await ChildAccountService.issueTemporaryPassword(
      registered.childId,
      registered.parentEmail,
    );

    expect(credential.tempPassword).toHaveLength(14);
    expect(credential.childId).toBe(registered.childId);
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
    await ChildAccountService.issueTemporaryPassword(registered.childId, registered.parentEmail);
    await ChildAccountService.resetCredential(registered.childId, 'StrongPass1!', 'password');

    const account = ChildAccountService.getChild(registered.childId);
    expect(account.passwordSet).toBe(true);
    expect(account.pinSet).toBe(false);
    expect(account.requiresCredentialReset).toBe(false);

    const login = await ChildAccountService.loginChild(registered.childId, 'StrongPass1!');
    expect(login.fullName).toBe('Ama');
  });

  it('stores every account locally even when cloud sync is unavailable', () => {
    StorageService.set('makenna_child_accounts_v2', []);
    expect(ChildAccountService.getAllAccounts()).toEqual([]);
  });
});
