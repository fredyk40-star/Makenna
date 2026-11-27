import { beforeEach, describe, expect, it } from 'vitest';
import { GamificationService } from './GamificationService';

beforeEach(() => {
  localStorage.clear();
});

describe('GamificationService', () => {
  it('keeps XP and badge rewards when completing a lesson', () => {
    const result = GamificationService.completeLesson('kid-1', 100);
    const state = GamificationService.getState('kid-1');

    expect(result.xpGained).toBe(100);
    expect(state.xp).toBe(300); // 100 lesson XP + 200 perfectionist badge XP
    expect(state.badges.map(badge => badge.id)).toContain('perfectionist');
    expect(state.coins).toBe(65); // level-up bonuses plus lesson coins
  });

  it('keeps badge XP when claiming a daily reward', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const state = GamificationService.getState('kid-1');
    state.lastDailyRewardDate = yesterday;
    state.currentStreak = 2;
    state.dailyRewardDay = 0;
    GamificationService.saveState('kid-1', state);

    GamificationService.claimDailyReward('kid-1');
    const updated = GamificationService.getState('kid-1');

    expect(updated.currentStreak).toBe(3);
    expect(updated.badges.map(badge => badge.id)).toContain('streak_3');
    expect(updated.xp).toBe(100 + 20 + 10); // streak badge + day-1 reward + streak bonus
  });

  it('normalizes child IDs so uppercase login does not split progress', () => {
    GamificationService.addXP('KID12345678', 50);
    expect(GamificationService.getState('kid12345678').xp).toBe(50);
  });
});
