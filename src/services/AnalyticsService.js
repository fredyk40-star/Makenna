/**
 * AnalyticsService - Records learning interactions for parent dashboard
 * Stores events locally with schema designed for future remote backend migration
 */
import { StorageService } from './StorageService';

const ANALYTICS_KEY = 'makenna_analytics_events';
const ANALYTICS_CONFIG_KEY = 'makenna_analytics_config';

export class AnalyticsService {
  static MAX_EVENTS = 5000; // Prevent localStorage overflow

  /**
   * Initialize analytics config
   */
  static initialize() {
    if (!StorageService.get(ANALYTICS_CONFIG_KEY)) {
      StorageService.set(ANALYTICS_CONFIG_KEY, {
        version: 2,
        enabled: true,
        lastSync: null,
        sessionId: this._generateSessionId(),
      });
    }
  }

  /**
   * Generate a unique session ID
   */
  static _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  static getSessionId() {
    const config = StorageService.get(ANALYTICS_CONFIG_KEY, {});
    return config.sessionId;
  }

  /**
   * Record an analytics event
   */
  static track(eventType, data = {}) {
    try {
      const config = StorageService.get(ANALYTICS_CONFIG_KEY, {});
      if (config.enabled === false) return;

      const events = this.getEvents();
      const event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: eventType,
        timestamp: new Date().toISOString(),
        sessionId: config.sessionId,
        childId: StorageService.get('makenna_active_child_id'),
        data,
      };

      events.push(event);

      // Trim if over limit
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS);
      }

      StorageService.set(ANALYTICS_KEY, events);
      return event;
    } catch (error) {
      console.warn('Analytics tracking error:', error);
    }
  }

  /**
   * Get all tracked events
   */
  static getEvents() {
    return StorageService.get(ANALYTICS_KEY, []);
  }

  /**
   * Get events filtered by type
   */
  static getEventsByType(type) {
    return this.getEvents().filter(e => e.type === type);
  }

  /**
   * Get events for a specific child
   */
  static getEventsByChild(childId) {
    return this.getEvents().filter(e => e.childId === childId);
  }

  /**
   * Get events in a date range
   */
  static getEventsInRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return this.getEvents().filter(e => {
      const t = new Date(e.timestamp).getTime();
      return t >= start && t <= end;
    });
  }

  /**
   * Clear all events
   */
  static clearEvents() {
    StorageService.remove(ANALYTICS_KEY);
  }

  /**
   * Enable/disable analytics
   */
  static setEnabled(enabled) {
    const config = StorageService.get(ANALYTICS_CONFIG_KEY, {});
    config.enabled = enabled;
    StorageService.set(ANALYTICS_CONFIG_KEY, config);
  }

  /**
   * Track a lesson start
   */
  static trackLessonStart(subject, lessonId) {
    return this.track('lesson_start', { subject, lessonId });
  }

  /**
   * Track a lesson completion
   */
  static trackLessonComplete(subject, lessonId, score, duration) {
    return this.track('lesson_complete', { subject, lessonId, score, duration });
  }

  /**
   * Track a game action
   */
  static trackGameAction(gameId, action, details = {}) {
    return this.track('game_action', { gameId, action, ...details });
  }

  /**
   * Track an answer (correct/incorrect)
   */
  static trackAnswer(questionId, correct, subject) {
    return this.track('answer', { questionId, correct, subject });
  }

  /**
   * Track badge earned
   */
  static trackBadgeEarned(badgeId, badgeName) {
    return this.track('badge_earned', { badgeId, badgeName });
  }

  /**
   * Track login
   */
  static trackLogin() {
    return this.track('login', {});
  }

  /**
   * Track logout
   */
  static trackLogout() {
    return this.track('logout', {});
  }

  /**
   * Track session duration
   */
  static trackSessionEnd(durationMinutes) {
    return this.track('session_end', { durationMinutes });
  }

  /**
   * Track retry on a question/activity
   */
  static trackRetry(activityId, subject) {
    return this.track('retry', { activityId, subject });
  }

  /**
   * Get aggregated analytics for parent dashboard
   */
  static getAggregatedAnalytics(childId) {
    const childEvents = this.getEventsByChild(childId);

    // Total sessions
    const logins = childEvents.filter(e => e.type === 'login').length;

    // Total lessons completed
    const lessonsCompleted = childEvents.filter(e => e.type === 'lesson_complete').length;

    // Total answers
    const answers = childEvents.filter(e => e.type === 'answer');
    const correctAnswers = answers.filter(a => a.data.correct).length;
    const totalAnswers = answers.length;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Badges earned
    const badgesEarned = childEvents.filter(e => e.type === 'badge_earned').length;

    // Subject breakdown
    const subjectBreakdown = {};
    childEvents.filter(e => e.type === 'lesson_complete').forEach(e => {
      const subject = e.data.subject || 'unknown';
      if (!subjectBreakdown[subject]) {
        subjectBreakdown[subject] = { completed: 0, totalScore: 0 };
      }
      subjectBreakdown[subject].completed++;
      subjectBreakdown[subject].totalScore += e.data.score || 0;
    });

    // Retry count
    const retries = childEvents.filter(e => e.type === 'retry').length;

    // Session times
    const sessionEnds = childEvents.filter(e => e.type === 'session_end');
    const totalMinutes = sessionEnds.reduce((sum, e) => sum + (e.data.durationMinutes || 0), 0);

    return {
      totalSessions: logins,
      lessonsCompleted,
      totalAnswers,
      correctAnswers,
      accuracy,
      badgesEarned,
      subjectBreakdown,
      retries,
      totalMinutes,
    };
  }

  /**
   * Get learning streak data
   */
  static getStreakData(childId) {
    const childEvents = this.getEventsByChild(childId);
    const loginDays = new Set();

    childEvents.filter(e => e.type === 'login').forEach(e => {
      const day = new Date(e.timestamp).toISOString().split('T')[0];
      loginDays.add(day);
    });

    const sortedDays = Array.from(loginDays).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    // Calculate current streak
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const day = sortedDays[i];
      const expected = new Date();
      expected.setDate(expected.getDate() - (sortedDays.length - 1 - i));
      const expectedDay = expected.toISOString().split('T')[0];
      if (day === expectedDay) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let tempStreak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalDays: loginDays.size,
      todayActive: loginDays.has(today),
    };
  }

  /**
   * Export analytics data (for future cloud sync)
   */
  static exportData() {
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      events: this.getEvents(),
      config: StorageService.get(ANALYTICS_CONFIG_KEY),
    };
  }

  /**
   * Import analytics data (for migration)
   */
  static importData(data) {
    if (data && data.version && data.events) {
      StorageService.set(ANALYTICS_KEY, data.events);
      if (data.config) {
        StorageService.set(ANALYTICS_CONFIG_KEY, data.config);
      }
      return true;
    }
    return false;
  }
}