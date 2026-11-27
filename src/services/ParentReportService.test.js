import { describe, expect, it } from 'vitest';
import ParentReportService from './ParentReportService';
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';

const child = { childId: 'parent-child', fullName: 'Ama Test' };

describe('ParentReportService', () => {
  it('builds a report from stored activity and progress', () => {
    StorageService.set('makenna_child_accounts_v2', [{
      ...child,
      progress: {
        alphabet_progress: { completed: ['a', 'b'] },
        numbers_progress: {
          completed: ['1'],
          skills: {
            1: {
              recognition: { completed: true, attempts: 1 },
              counting: { completed: true, attempts: 1 },
              word: { completed: true, attempts: 1 },
              writing: { completed: true, attempts: 1 },
            },
          },
        },
      },
    }]);

    const state = GamificationService.getState(child.childId);
    state.stars = 75;
    GamificationService.saveState(child.childId, state);

    StorageService.set('makenna_analytics_events', [
      {
        type: 'lesson_complete',
        childId: child.childId,
        timestamp: new Date().toISOString(),
        data: { subject: 'Alphabet', score: 90, duration: 300 },
      },
    ]);

    const report = ParentReportService.getReport(child);

    expect(report.child.name).toBe('Ama Test');
    expect(report.child.stars).toBe(75);
    expect(report.summary.weeklyLessons).toBe(1);
    expect(report.summary.learnedText).toContain('letters and their sounds');
    expect(report.mastery.alphabet).toBe(2);
    expect(report.mastery.numbers).toBe(1);
    expect(report.mastery.numbersCompleted).toBe(1);
    expect(report.charts.daily).toHaveLength(7);
    expect(report.charts.weekly).toHaveLength(4);
    expect(() => JSON.parse(ParentReportService.toJson(report))).not.toThrow();
  });

  it('does not count game or story records as number mastery', () => {
    StorageService.set('makenna_child_accounts_v2', [{
      ...child,
      progress: {
        numbers_progress: {
          completed: ['count-mangoes', 'story-1'],
          mastered: ['count-mangoes', 'story-1'],
          skills: {
            1: { story: { completed: true, attempts: 1 } },
          },
        },
      },
    }]);

    const report = ParentReportService.getReport(child);
    expect(report.mastery.numbers).toBe(0);
    expect(report.mastery.numbersCompleted).toBe(0);
  });

  it('gives a friendly message when there are no lessons', () => {
    expect(ParentReportService.buildLearnedText([])).toContain('No completed lessons');
  });
});
