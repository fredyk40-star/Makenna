import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { consentState, fakeStore } = vi.hoisted(() => {
  const state = { enabled: true, allowOnlineAI: true, deletedAt: null };
  return {
    consentState: state,
    fakeStore: () => ({
      kind: 'test',
      isConfigured: () => true,
      describeConfig: () => 'the test store',
      findAccount: async () => ({
        child_id: 'kid12345678',
        deleted_at: state.deletedAt,
        settings: { tutor: { enabled: state.enabled, allowOnlineAI: state.allowOnlineAI } },
      }),
      findRateLimit: async () => null,
      bumpRateLimit: async () => 1,
      deleteRateLimit: async () => {},
    }),
  };
});

vi.mock('../../api/_lib/store.js', () => ({
  getStore: () => fakeStore(),
  storeForClient: () => fakeStore(),
  requireStore: () => fakeStore(),
  validOperationId: value => (
    typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null
  ),
}));

import tutorHandler from '../../api/tutor.js';
import { createChildToken } from '../../api/_lib/child-auth.js';

const childId = 'kid12345678';

const validUnit = {
  id: 't1',
  source: 'english:e1',
  title: 'Vowels',
  content: 'The vowel sounds are A, E, I, O, U.',
  level: 'KG1',
  subject: 'english',
};

const invoke = async (body) => {
  const req = { method: 'POST', body };
  const res = {
    statusCode: null,
    status(status) {
      this.statusCode = status;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  await tutorHandler(req, res);
  return res;
};

describe('Gemini tutor API', () => {
  beforeEach(() => {
    consentState.enabled = true;
    consentState.allowOnlineAI = true;
    consentState.deletedAt = null;
    vi.stubEnv('CHILD_SESSION_SECRET', 'test-child-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('requires a valid child token before calling Gemini', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await invoke({
      childId,
      token: 'invalid',
      question: 'What are vowels?',
      unit: validUnit,
    });

    expect(response.statusCode).toBe(401);
    expect(response.payload.success).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses requests when the parent has not opted in online tutoring', async () => {
    consentState.allowOnlineAI = false;
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await invoke({
      childId,
      token: createChildToken(childId),
      question: 'What are vowels?',
      unit: validUnit,
    });

    expect(response.statusCode).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses units that are not from the bundled curriculum', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await invoke({
      childId,
      token: createChildToken(childId),
      question: 'What are vowels?',
      unit: { ...validUnit, source: 'unknown:xyz', subject: 'history' },
    });

    expect(response.statusCode).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends only the child question and selected lesson to Gemini', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'A, E, I, O, and U are vowels.' }] } }],
      }),
    });

    const response = await invoke({
      childId,
      token: createChildToken(childId),
      question: 'What are vowels?',
      unit: validUnit,
    });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true, text: 'A, E, I, O, and U are vowels.' });
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/models/gemini-2.5-flash:generateContent');
    expect(url).not.toContain('test-api-key');
    expect(options.headers['x-goog-api-key']).toBe('test-api-key');
    const request = JSON.parse(options.body);
    const prompt = request.contents[0].parts[0].text;
    expect(prompt).toContain('What are vowels?');
    expect(prompt).toContain('The vowel sounds are A, E, I, O, U.');
    expect(prompt).not.toContain(childId);
  });
});
