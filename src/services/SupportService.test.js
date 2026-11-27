import { beforeEach, describe, expect, it } from 'vitest';
import { ChildAccountService } from './ChildAccountService';
import { SupportService } from './SupportService';
import { StorageService } from './StorageService';

const SUPPORT_KEY = 'makenna_support_requests_v1';
const SESSION_TOKEN_KEY = 'makenna_dev_session_token_v1';

describe('SupportService', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.set(SESSION_TOKEN_KEY, 'developer-token');
  });

  it('stores a parent message from a verified child ID and email pair', async () => {
    const child = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');
    const verification = await SupportService.requestVerification({
      childId: child.childId,
      parentEmail: child.parentEmail,
    });

    const request = await SupportService.submitRequest({
      childId: child.childId.toUpperCase(),
      parentEmail: 'PARENT@EXAMPLE.COM',
      message: 'I forgot my PIN.',
      verificationCode: verification.devCode,
    });

    expect(request.status).toBe('open');
    expect(request.childId).toBe(child.childId);
    expect(StorageService.get(SUPPORT_KEY)).toHaveLength(1);
    expect(SupportService.getOpenCount()).toBe(1);
  });

  it('allows the developer to review and resolve a request', async () => {
    const child = await ChildAccountService.registerChild('Kofi', '1234', 'parent@example.com');
    const verification = await SupportService.requestVerification({
      childId: child.childId,
      parentEmail: child.parentEmail,
    });
    const request = await SupportService.submitRequest({
      childId: child.childId,
      parentEmail: child.parentEmail,
      message: 'Please help me log in.',
      verificationCode: verification.devCode,
    });

    const reviewed = await SupportService.markStatus(request.id, 'reviewing', 'Identity checked.');
    expect(reviewed.status).toBe('reviewing');
    expect(reviewed.developerNote).toBe('Identity checked.');
    expect(SupportService.getOpenCount()).toBe(0);

    const resolved = await SupportService.markStatus(request.id, 'resolved');
    expect(resolved.status).toBe('resolved');
  });

  it('does not reveal whether an unknown account exists', async () => {
    // A non-matching identity has no issued code, so it gets the same generic
    // error as a wrong code rather than an account-not-found response.
    await expect(SupportService.submitRequest({
      childId: 'kid00000000',
      parentEmail: 'parent@example.com',
      message: 'This account does not exist.',
      verificationCode: '123456',
    })).rejects.toThrow(/verification code/i);
    expect(StorageService.get(SUPPORT_KEY, [])).toHaveLength(0);
  });

  it('rejects an invalid verification code', async () => {
    const child = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');
    await SupportService.requestVerification({ childId: child.childId, parentEmail: child.parentEmail });

    await expect(SupportService.submitRequest({
      childId: child.childId,
      parentEmail: child.parentEmail,
      message: 'I forgot my PIN.',
      verificationCode: '000000',
    })).rejects.toThrow(/verification code/i);
  });

  it('validates the message length', async () => {
    const child = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');

    await expect(SupportService.submitRequest({
      childId: child.childId,
      parentEmail: child.parentEmail,
      message: 'no',
    })).rejects.toThrow(/5-1000/i);
  });
});
