import { describe, expect, it } from 'vitest';
import {
  CORE_ALPHABET_SKILLS,
  getLetterSkillCount,
  getSkillCompletionPercentage,
  isLetterMastered,
  isSkillComplete,
  markSkillInProgress,
  normalizeAlphabetProgress,
  readStoredAlphabetProgress,
  toSkillName,
  withCoreCompletion,
} from './AlphabetProgressService';
import { StorageService } from './StorageService';

describe('AlphabetProgressService', () => {
  it('normalizes legacy boolean skills without losing opened or favorite data', () => {
    const progress = normalizeAlphabetProgress({
      opened: ['a'],
      completed: [],
      favorites: { letters: ['a'], words: ['a:Apple'] },
      skills: { a: { letter: true, sound: true } },
    });

    expect(progress.opened).toEqual(['a']);
    expect(progress.favorites.letters).toEqual(['a']);
    expect(progress.favorites.words).toEqual(['a:Apple']);
    expect(isSkillComplete(progress, 'a', 'letter')).toBe(true);
    expect(getLetterSkillCount(progress, 'a')).toBe(2);
    expect(isLetterMastered(progress, 'a')).toBe(false);
  });

  it('increments attempts and keeps the best accuracy for a skill', () => {
    let progress = markSkillInProgress(undefined, 'a', 'letter', { accuracy: 80 });
    progress = markSkillInProgress(progress, 'a', 'letter', { accuracy: 60 });

    expect(progress.skills.a.letter).toEqual(expect.objectContaining({
      completed: true,
      attempts: 2,
      accuracy: 80,
    }));
    expect(progress.lastSkill).toEqual(expect.objectContaining({
      letterId: 'a',
      skill: 'letter',
    }));
  });

  it('completes a letter once all core skills are practiced', () => {
    let progress = normalizeAlphabetProgress();
    CORE_ALPHABET_SKILLS.forEach(skill => {
      progress = markSkillInProgress(progress, 'b', skill);
    });

    expect(isLetterMastered(progress, 'b')).toBe(true);
    expect(withCoreCompletion(progress, 'b').completed).toContain('b');
    expect(withCoreCompletion(progress, 'b').recentLessons[0]).toBe('b');
    expect(getSkillCompletionPercentage(progress)).toBeGreaterThan(0);
  });

  it('tracks listening and tracing without completing the core lesson', () => {
    let progress = markSkillInProgress(undefined, 'c', 'trace', { accuracy: 92 });
    progress = markSkillInProgress(progress, 'c', 'listening', { accuracy: 100 });

    expect(isSkillComplete(progress, 'c', 'trace')).toBe(true);
    expect(isSkillComplete(progress, 'c', 'listening')).toBe(true);
    expect(isLetterMastered(progress, 'c')).toBe(false);
    expect(withCoreCompletion(progress, 'c').completed).toEqual([]);
  });

  it('maps phonics mode names to progress skills', () => {
    expect(toSkillName('word-with-sound')).toBe('wordWithSound');
    expect(toSkillName('word_with_sound')).toBe('wordWithSound');
    expect(toSkillName('unknown')).toBeNull();
  });

  it('reads progress from the active child account record', () => {
    StorageService.set('makenna_child_accounts_v2', [{
      childId: 'kid00000001',
      progress: {
        alphabet_progress: { skills: { a: { sound: true } } },
      },
    }]);

    const progress = readStoredAlphabetProgress('KID00000001');
    expect(isSkillComplete(progress, 'a', 'sound')).toBe(true);
  });
});
