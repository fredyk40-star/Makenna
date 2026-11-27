import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/_lib/developer-auth.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verifyDeveloperPassword: vi.fn(async () => false),
    isDeveloperRateLimited: vi.fn(async () => false),
    recordDeveloperFailure: vi.fn(async () => {}),
    clearDeveloperFailures: vi.fn(async () => {}),
    createSessionToken: vi.fn(() => 'session-token'),
    createResetToken: vi.fn(() => 'reset-token'),
  };
});

const {
  verifyDeveloperPassword,
  isDeveloperRateLimited,
  recordDeveloperFailure,
  clearDeveloperFailures,
} = await import('../../api/_lib/developer-auth.js');
const handler = (await import('../../api/developer-auth.js')).default;

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

const req = (body) => ({
  method: 'POST',
  body,
  headers: { 'x-forwarded-for': '203.0.113.10' },
  socket: { remoteAddress: '203.0.113.10' },
});

beforeEach(() => {
  let failures = 0;
  verifyDeveloperPassword.mockReset().mockResolvedValue(false);
  isDeveloperRateLimited.mockReset().mockImplementation(async () => failures >= 10);
  recordDeveloperFailure.mockReset().mockImplementation(async () => { failures += 1; });
  clearDeveloperFailures.mockReset().mockImplementation(async () => { failures = 0; });
});

describe('developer auth rate limiting', () => {
  it('returns 429 once the shared throttle is tripped', async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = makeRes();
      await handler(req({ action: 'login', email: 'addaifrederick72@gmail.com', password: 'wrong' }), res);
      expect(res.statusCode).toBe(401);
    }

    const blocked = makeRes();
    await handler(req({ action: 'login', email: 'addaifrederick72@gmail.com', password: 'wrong' }), blocked);
    expect(blocked.statusCode).toBe(429);
    expect(verifyDeveloperPassword).toHaveBeenCalledTimes(10);
  });

  it('clears the throttle after a successful sign-in', async () => {
    // Trip it first, then authenticate successfully.
    await handler(req({ action: 'login', email: 'addaifrederick72@gmail.com', password: 'wrong' }), makeRes());
    verifyDeveloperPassword.mockResolvedValueOnce(true);

    const res = makeRes();
    await handler(req({ action: 'login', email: 'addaifrederick72@gmail.com', password: 'correct' }), res);
    expect(res.statusCode).toBe(200);
    expect(clearDeveloperFailures).toHaveBeenCalled();
  });
});
