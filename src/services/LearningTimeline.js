/**
 * Learning Timeline Service - Visual learning journey tracking
 * Shows activity history and progress milestones
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';

const TIMELINE_KEY = 'makenna_learning_timeline';

export class LearningTimeline {
  /**
   * Add activity to timeline
   */
  static addActivity(childId, activity) {
    const timeline = this.getTimeline(childId);
    timeline.activities.unshift({
      ...activity,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    });
    StorageService.set(`${TIMELINE_KEY}_${childId}`, timeline);
    return timeline;
  }

  /**
   * Get timeline for child
   */
  static getTimeline(childId) {
    return StorageService.get(`${TIMELINE_KEY}_${childId}`, {
      activities: [],
      milestones: [],
      streaks: { current: 0, best: 0 }
    });
  }

  /**
   * Get activities grouped by date
   */
  static getActivitiesByDate(childId, days = 7) {
    const timeline = this.getTimeline(childId);
    const grouped = {};

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    timeline.activities
      .filter(a => new Date(a.timestamp) >= cutoff)
      .forEach(activity => {
        const date = activity.timestamp.split('T')[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(activity);
      });

    return grouped;
  }

  /**
   * Get milestones achieved
   */
  static getMilestones(childId) {
    const timeline = this.getTimeline(childId);
    return timeline.milestones;
  }

  /**
   * Add milestone
   */
  static addMilestone(childId, milestone) {
    const timeline = this.getTimeline(childId);
    timeline.milestones.push({
      ...milestone,
      date: new Date().toISOString()
    });
    StorageService.set(`${TIMELINE_KEY}_${childId}`, timeline);
  }

  /**
   * Get streak information
   */
  static getStreaks(childId) {
    const timeline = this.getTimeline(childId);
    return timeline.streaks;
  }

  /**
   * Update streak
   */
  static updateStreak(childId, completedToday = true) {
    const timeline = this.getTimeline(childId);
    if (completedToday) {
      timeline.streaks.current += 1;
      if (timeline.streaks.current > timeline.streaks.best) {
        timeline.streaks.best = timeline.streaks.current;
      }
    } else {
      timeline.streaks.current = 0;
    }
    StorageService.set(`${TIMELINE_KEY}_${childId}`, timeline);
    return timeline.streaks;
  }

  /**
   * Get summary statistics
   */
  static getSummary(childId) {
    const timeline = this.getTimeline(childId);
    const totalActivities = timeline.activities.length;
    const totalTime = timeline.activities.reduce(
      (sum, a) => sum + (a.duration || 0), 0
    );

    return {
      totalActivities,
      totalTime: `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`,
      currentStreak: timeline.streaks.current,
      bestStreak: timeline.streaks.best,
      milestoneCount: timeline.milestones.length
    };
  }
}