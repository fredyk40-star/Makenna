import { describe, expect, it } from 'vitest';
import { LearningAnalytics } from './LearningAnalytics';
import { RecommendationService } from './RecommendationService';
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';

const childId = 'analytics-child';

const track = (type, data, timestamp = new Date().toISOString()) => {
  const events = StorageService.get('makenna_analytics_events', []);
  events.push({ type, data, timestamp, childId });
  StorageService.set('makenna_analytics_events', events);
};

describe('LearningAnalytics', () => {
  it('derives real headline stats from events and gamification state', () => {
    const game = GamificationService.getState(childId);
    game.stars = 42;
    game.lessonsCompleted = 3;
    GamificationService.saveState(childId, game);

    track('lesson_complete', { subject: 'Numbers', score: 80, duration: 300 });
    track('lesson_complete', { subject: 'Numbers', score: 60, duration: 300 });
    track('answer', { correct: true });

    const stats = LearningAnalytics.getStats(childId);

    expect(stats.starsEarned).toBe(42);
    expect(stats.lessonsCompleted).toBe(2);
    expect(stats.mastery.Numbers).toBe(70);
    expect(stats.averageScore).toBe(100);
    expect(stats.daysActive).toBe(1);
  });

  it('returns usable chart data even with no events', () => {
    const trends = LearningAnalytics.getProgressTrends('empty-child', 7);
    expect(trends.progressTrend).toHaveLength(7);
    expect(trends.progressTrend[0]).toHaveProperty('date');
    expect(trends.progressTrend[0]).toHaveProperty('timeSpent');
  });
});

describe('RecommendationService', () => {
  it('returns a next activity with a real route', () => {
    const next = RecommendationService.getNextRecommendation(childId);

    expect(next.path).toMatch(/^\/(alphabet|numbers|maths|reading|science|stories|shapes)/);
    expect(next.title).toBeTruthy();
    expect(next.description).toBeTruthy();
  });
});

describe('StorageService cleanup', () => {
  it('removes only disposable caches, never child progress', () => {
    StorageService.set('makenna_analytics_events', [1, 2, 3]);
    StorageService.set('alphabet_progress', { A: { mastered: true } });
    StorageService.set('makenna_child_accounts_v2', [{ childId }]);

    StorageService.cleanupStorage();

    expect(StorageService.has('makenna_analytics_events')).toBe(false);
    expect(StorageService.get('alphabet_progress')).toEqual({ A: { mastered: true } });
    expect(StorageService.has('makenna_child_accounts_v2')).toBe(true);
  });
});
