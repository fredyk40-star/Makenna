import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/_lib/developer-auth.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verifyDeveloperPassword: vi.fn(async () => false),
    createSessionToken: vi.fn(() => 'session-token'),
    createResetToken: vi.fn(() => 'reset-token'),
  };
});

const { checkDeveloperAuthRateLimit, resetDeveloperAuthRateLimit } = await import('../../api/_lib/developer-auth.js');
const { verifyDeveloperPassword } = await import('../../api/_lib/developer-auth.js');
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
  verifyDeveloperPassword.mockClear();
  resetDeveloperAuthRateLimit('login:203.0.113.10');
  resetDeveloperAuthRateLimit('reset:203.0.113.10');
});

describe('developer auth rate limiting', () => {
  it('returns 429 after too many failed sign-in attempts', async () => {
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
    checkDeveloperAuthRateLimit('login:203.0.113.10');
    verifyDeveloperPassword.mockResolvedValueOnce(true);

    const res = makeRes();
    await handler(req({ action: 'login', email: 'addaifrederick72@gmail.com', password: 'correct' }), res);
    expect(res.statusCode).toBe(200);
    expect(checkDeveloperAuthRateLimit('login:203.0.113.10')).toBe(true);
  });
});
