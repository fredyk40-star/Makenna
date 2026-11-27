import { beforeEach, describe, expect, it } from 'vitest';
import { ChildAccountService } from './ChildAccountService';
import { SupportService } from './SupportService';
import { StorageService } from './StorageService';

const SUPPORT_KEY = 'makenna_support_requests_v1';

describe('SupportService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores a parent message from a verified child ID and email pair', async () => {
    const child = await ChildAccountService.registerChild('Ama', '1234', 'parent@example.com');

    const request = await SupportService.submitRequest({
      childId: child.childId.toUpperCase(),
      parentEmail: 'PARENT@EXAMPLE.COM',
      message: 'I forgot my PIN.',
    });

    expect(request.status).toBe('open');
    expect(request.childId).toBe(child.childId);
    expect(StorageService.get(SUPPORT_KEY)).toHaveLength(1);
    expect(SupportService.getOpenCount()).toBe(1);
  });

  it('allows the developer to review and resolve a request', async () => {
    const child = await ChildAccountService.registerChild('Kofi', '1234', 'parent@example.com');
    const request = await SupportService.submitRequest({
      childId: child.childId,
      parentEmail: child.parentEmail,
      message: 'Please help me log in.',
    });

    const reviewed = SupportService.markStatus(request.id, 'reviewing', 'Identity checked.');
    expect(reviewed.status).toBe('reviewing');
    expect(reviewed.developerNote).toBe('Identity checked.');
    expect(SupportService.getOpenCount()).toBe(0);

    const resolved = SupportService.markStatus(request.id, 'resolved');
    expect(resolved.status).toBe('resolved');
  });

  it('rejects requests that do not match an account', async () => {
    await expect(SupportService.submitRequest({
      childId: 'kid00000000',
      parentEmail: 'parent@example.com',
      message: 'This account does not exist.',
    })).rejects.toThrow(/No account was found/i);
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
