import { describe, expect, it } from 'vitest';
import DailyMissionService, { REWARD_STARS } from './DailyMissionService';
import { GamificationService } from './GamificationService';

const childId = 'mission-child';
const date = '2026-11-27';

describe('DailyMissionService', () => {
  it('builds a stable four-step mission with real routes', () => {
    const first = DailyMissionService.getMission(childId, date);
    const second = DailyMissionService.getMission(childId, date);

    expect(first.steps.map(step => step.id)).toEqual(['review', 'lesson', 'game', 'reward']);
    expect(second.steps).toEqual(first.steps);
    expect(first.steps.filter(step => step.id !== 'reward').every(step => step.path?.startsWith('/'))).toBe(true);
  });

  it('cannot claim the reward before finishing the learning steps', () => {
    const result = DailyMissionService.claimReward(childId, date);
    expect(result.success).toBe(false);
  });

  it('awards the reward once and keeps the streak', () => {
    ['review', 'lesson', 'game'].forEach(step => DailyMissionService.completeStep(childId, step, date));

    const summary = DailyMissionService.getSummary(childId, date);
    expect(summary.percent).toBe(100);
    expect(summary.canClaim).toBe(true);

    const before = GamificationService.getState(childId).stars;
    const claim = DailyMissionService.claimReward(childId, date);

    expect(claim.success).toBe(true);
    expect(claim.streak).toBe(1);
    expect(GamificationService.getState(childId).stars).toBe(before + REWARD_STARS);
    expect(DailyMissionService.claimReward(childId, date).success).toBe(false);
    expect(DailyMissionService.getStreak(childId)).toBe(1);
  });

  it('records an activity only for a matching subject', () => {
    const otherDate = '2026-11-26';
    const mission = DailyMissionService.getMission('other-child', otherDate);
    const lessonSubject = mission.steps.find(step => step.id === 'lesson').subject;

    const matched = DailyMissionService.recordActivity('other-child', {
      subject: lessonSubject, type: 'lesson', date: otherDate,
    });
    expect(matched.success).toBe(true);

    const unmatched = DailyMissionService.recordActivity('other-child', {
      subject: 'Not A Subject', type: 'lesson', date: otherDate,
    });
    expect(unmatched.success).toBe(false);
  });
});
