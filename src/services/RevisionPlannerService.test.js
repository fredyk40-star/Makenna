import { describe, expect, it, vi } from 'vitest';
import { RevisionPlannerService } from './RevisionPlannerService';

const cards = [
  { id: 'letter-a', subject: 'alphabet', topic: 'A', prompt: 'What sound does A make?', answer: 'a' },
  { id: 'number-3', subject: 'numbers', topic: '3', prompt: 'How many?', answer: '3' },
];

describe('RevisionPlannerService', () => {
  it('seeds cards once and lists them per child', () => {
    expect(RevisionPlannerService.seed('child-1', cards)).toBe(2);
    expect(RevisionPlannerService.seed('child-1', cards)).toBe(0);
    expect(RevisionPlannerService.list('child-1')).toHaveLength(2);
    expect(RevisionPlannerService.list('child-2')).toEqual([]);
  });

  it('grades a review and schedules the next interval', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    try {
      RevisionPlannerService.seed('child-1', cards);
      const first = RevisionPlannerService.review('child-1', 'letter-a', 5);

      expect(first.repetitions).toBe(1);
      expect(first.intervalDays).toBe(1);
      expect(new Date(first.dueAt).getTime()).toBe(Date.now() + 24 * 60 * 60 * 1000);

      const second = RevisionPlannerService.review('child-1', 'letter-a', 4);
      expect(second.repetitions).toBe(2);
      expect(second.intervalDays).toBe(6);

      const failed = RevisionPlannerService.review('child-1', 'letter-a', 1);
      expect(failed.repetitions).toBe(0);
      expect(failed.intervalDays).toBe(1);
      expect(failed.history).toHaveLength(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('builds a due-only revision plan and exposes a summary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    try {
      RevisionPlannerService.seed('child-1', cards);
      RevisionPlannerService.snooze('child-1', 'number-3', 3);

      const plan = RevisionPlannerService.buildPlan('child-1', { minutes: 5 });
      expect(plan).toHaveLength(1);
      expect(plan[0].id).toBe('letter-a');
      expect(plan[0].order).toBe(1);

      expect(RevisionPlannerService.getSummary('child-1')).toEqual({
        total: 2,
        due: 1,
        upcoming: 1,
        mastered: 0,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('notifies subscribers on writes', () => {
    const listener = vi.fn();
    const unsubscribe = RevisionPlannerService.subscribe(listener);
    RevisionPlannerService.seed('child-1', cards);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    RevisionPlannerService.review('child-1', 'letter-a', 5);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
