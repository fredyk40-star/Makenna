import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEVELOPER_EMAIL,
  createResetToken,
  createSessionToken,
  validateStrongPassword,
  verifyDeveloperPassword,
  verifyResetToken,
  verifySessionToken,
} from '../../api/_lib/developer-auth.js';
import { DeveloperService } from './DeveloperService';

describe('developer authentication helpers', () => {
  beforeEach(() => {
    vi.stubEnv('DEVELOPER_JWT_SECRET', 'test-secret');
    vi.stubEnv('DEVELOPER_EMAIL', 'addaifrederick72@gmail.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('issues signed sessions that expire and cannot be reused as reset tokens', () => {
    const session = createSessionToken();
    expect(verifySessionToken(session)).not.toBeNull();
    expect(verifyResetToken(session)).toBeNull();
    expect(verifySessionToken(createResetToken())).toBeNull();
    expect(verifySessionToken(`${session}tampered`)).toBeNull();
  });

  it('only accepts strong passwords', () => {
    expect(validateStrongPassword('Short1!')).toBe(false);
    expect(validateStrongPassword('alllowercase1!')).toBe(false);
    expect(validateStrongPassword('StrongPass1!')).toBe(true);
  });

  it('restricts developer access to the configured Gmail address', async () => {
    expect(DEVELOPER_EMAIL).toBe('addaifrederick72@gmail.com');
    expect(DeveloperService.getDeveloperEmail()).toBe('addaifrederick72@gmail.com');
    expect(await verifyDeveloperPassword('other@example.com', 'StrongPass1!')).toBe(false);
    expect(await verifyDeveloperPassword(DEVELOPER_EMAIL, 'anything')).toBe(false);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(DeveloperService.requestPasswordReset('other@example.com')).resolves.toEqual({ success: true });
    expect(fetchSpy).not.toHaveBeenCalled();

    await DeveloperService.requestPasswordReset(DEVELOPER_EMAIL);
    expect(fetchSpy).toHaveBeenCalledWith('/api/developer-auth', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"action":"request-reset"'),
    }));
  });

  it('returns a manual fallback result when the mail endpoint is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Gmail is not configured' }),
    });

    const result = await DeveloperService.sendTemporaryPassword({
      childId: 'kid20345635',
      parentEmail: 'parent@example.com',
      tempPassword: 'TempPass1!',
    });

    expect(result).toEqual({ success: false, error: 'Gmail is not configured' });
  });
});
