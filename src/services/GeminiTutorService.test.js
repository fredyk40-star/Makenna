import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChildAccountService } from './ChildAccountService';
import { GeminiTutorService } from './GeminiTutorService';

const localResult = {
  matched: true,
  text: 'Local lesson answer',
  unit: {
    title: 'Vowels',
    content: 'The vowel sounds are A, E, I, O, U.',
    level: 'KG1',
    subject: 'english',
  },
};

describe('GeminiTutorService', () => {
  beforeEach(() => {
    vi.spyOn(ChildAccountService, 'getChildToken').mockReturnValue('signed-child-token');
  });

  it('uses the local answer when offline or the result is not a curriculum match', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    await expect(GeminiTutorService.answer(
      'kid12345678',
      'vowels',
      localResult,
      '',
      true,
    )).resolves.toBe(localResult);
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });

    await expect(GeminiTutorService.answer(
      'kid12345678',
      'joke',
      { ...localResult, matched: false },
      '',
      true,
    )).resolves.toEqual({ ...localResult, matched: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not send questions containing personal details to the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(GeminiTutorService.answer(
      'kid12345678',
      'My name is Ama and I like vowels',
      localResult,
      'Ama Mensah',
      true,
    )).resolves.toBe(localResult);
    await expect(GeminiTutorService.answer(
      'kid12345678',
      'Email me at ama@example.com about vowels',
      localResult,
      '',
      true,
    )).resolves.toBe(localResult);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends only the question and lesson, and keeps local content if the API fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, text: 'A, E, I, O, and U are vowels.' }),
      })
      .mockResolvedValueOnce({ ok: false });

    await expect(GeminiTutorService.answer(
      'kid12345678',
      'What are vowels?',
      localResult,
      'Ama Mensah',
      true,
    )).resolves.toEqual({
      ...localResult,
      text: 'A, E, I, O, and U are vowels.',
    });

    const request = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/tutor');
    expect(request).toMatchObject({
      childId: 'kid12345678',
      token: 'signed-child-token',
      question: 'What are vowels?',
      unit: localResult.unit,
    });
    expect(JSON.stringify(request)).not.toContain('Ama Mensah');

    await expect(GeminiTutorService.answer(
      'kid12345678',
      'What are vowels?',
      localResult,
      '',
      true,
    )).resolves.toEqual({
      ...localResult,
      onlineError: 'The online tutor is unavailable. I used your lesson instead.',
    });
  });

  it('does not contact Gemini unless a parent enabled online answers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(GeminiTutorService.answer(
      'kid12345678',
      'What are vowels?',
      localResult,
    )).resolves.toBe(localResult);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
