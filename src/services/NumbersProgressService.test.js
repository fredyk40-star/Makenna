import { describe, expect, it } from 'vitest';
import {
  CORE_NUMBER_SKILLS,
  MASTERY_NUMBER_SKILLS,
  getNumberSkillCount,
  getSkillCompletionPercentage,
  isNumberCompletedBySkills,
  isNumberMasteredBySkills,
  isSkillComplete,
  markSkillInProgress,
  normalizeNumbersProgress,
  readStoredNumbersProgress,
  recordGameResult,
  recordStoryCompletion,
  toSkillName,
  withCoreCompletion,
  withMasteryCompletion,
} from './NumbersProgressService';
import { StorageService } from './StorageService';

describe('NumbersProgressService', () => {
  it('normalizes legacy arrays, favorites and boolean skills without losing data', () => {
    const progress = normalizeNumbersProgress({
      opened: ['1', '2', 'not-a-number'],
      completed: ['1', 'count-mangoes'],
      mastered: [],
      favorites: ['1'],
      favoriteNumbers: ['2'],
      timeSpent: { 1: 12, junk: 99 },
      skills: { 1: { recognition: true, counting: 2 } },
    });

    expect(progress.opened).toEqual(['1', '2']);
    expect(progress.completed).toEqual(['1']);
    expect(progress.favorites).toEqual(['1', '2']);
    expect(progress.timeSpent).toEqual({ 1: 12 });
    expect(isSkillComplete(progress, '1', 'recognition')).toBe(true);
    expect(isSkillComplete(progress, '1', 'counting')).toBe(true);
    expect(getNumberSkillCount(progress, '1')).toBe(2);
  });

  it('increments attempts and keeps the best accuracy for a skill', () => {
    let progress = markSkillInProgress(undefined, '3', 'counting', { accuracy: 80 });
    progress = markSkillInProgress(progress, '3', 'counting', { accuracy: 60 });

    expect(progress.skills['3'].counting).toEqual(expect.objectContaining({
      completed: true,
      attempts: 2,
      accuracy: 80,
    }));
    expect(progress.lastSkill).toEqual(expect.objectContaining({
      numberId: '3',
      skill: 'counting',
    }));
  });

  it('does not count a wrong practice answer as a learned skill', () => {
    const progress = markSkillInProgress(undefined, '2', 'counting', {
      completed: false,
      accuracy: 0,
      attempts: 1,
    });

    expect(isSkillComplete(progress, '2', 'counting')).toBe(false);
    expect(progress.skills['2'].counting.attempts).toBe(1);
  });

  it('completes a number once core skills are practiced', () => {
    let progress = normalizeNumbersProgress();
    CORE_NUMBER_SKILLS.forEach(skill => {
      progress = markSkillInProgress(progress, '4', skill);
    });

    expect(isNumberCompletedBySkills(progress, '4')).toBe(true);
    expect(withCoreCompletion(progress, '4').completed).toContain('4');
    expect(withCoreCompletion(progress, '4').recentLessons[0]).toBe('4');
    expect(getSkillCompletionPercentage(progress)).toBeGreaterThan(0);
  });

  it('requires writing before mastery and records story practice separately', () => {
    let progress = normalizeNumbersProgress();
    CORE_NUMBER_SKILLS.forEach(skill => {
      progress = markSkillInProgress(progress, '5', skill);
    });
    expect(isNumberMasteredBySkills(progress, '5')).toBe(false);

    progress = markSkillInProgress(progress, '5', 'writing', { accuracy: 92 });
    expect(isNumberMasteredBySkills(progress, '5')).toBe(true);
    expect(withMasteryCompletion(progress, '5').mastered).toContain('5');

    const withStory = recordStoryCompletion(progress, 'story-5', '5');
    expect(withStory.stories).toContain('story-5');
    expect(isSkillComplete(withStory, '5', 'story')).toBe(true);
  });

  it('keeps games and favorites out of numeric completion arrays', () => {
    let progress = recordGameResult(undefined, 'count-mangoes', { score: 90, stars: 4 });
    expect(progress.games['count-mangoes']).toEqual(expect.objectContaining({
      attempts: 1,
      bestScore: 90,
      bestStars: 4,
    }));
    expect(progress.completed).toEqual([]);
    expect(MASTERY_NUMBER_SKILLS).toContain('writing');
  });

  it('maps lesson activity names to canonical skills', () => {
    expect(toSkillName('word-match')).toBe('word');
    expect(toSkillName('trace')).toBe('writing');
    expect(toSkillName('listen')).toBe('listening');
    expect(toSkillName('unknown')).toBeNull();
  });

  it('reads progress from the active child account record case-insensitively', () => {
    StorageService.set('makenna_child_accounts_v2', [{
      childId: 'kid00000001',
      progress: {
        numbers_progress: { skills: { 2: { counting: true } } },
      },
    }]);

    const progress = readStoredNumbersProgress('KID00000001');
    expect(isSkillComplete(progress, '2', 'counting')).toBe(true);
  });
});
