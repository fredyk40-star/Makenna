/**
 * Learning Analytics Extension - Additional analytics methods
 * Extends AnalyticsService with graphs, trends, and metrics
 */
import { StorageService } from './StorageService';

const ANALYTICS_KEY = 'makenna_analytics_events';

export class LearningAnalytics {
  /**
   * Get daily graph data (last 7 days)
   */
  static getDailyGraph(childId, days = 7) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const graph = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = childEvents.filter(e => 
        e.timestamp.startsWith(dateStr)
      );
      
      const lessons = dayEvents.filter(e => e.type === 'lesson_complete').length;
      const answers = dayEvents.filter(e => e.type === 'answer');
      const accuracy = answers.length > 0 
        ? Math.round((answers.filter(a => a.data.correct).length / answers.length) * 100)
        : 0;
      
      graph.push({
        date: dateStr,
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        lessons,
        answers: answers.length,
        accuracy,
        xp: dayEvents.reduce((sum, e) => sum + (e.data.xp || 0), 0)
      });
    }
    
    return graph;
  }

  /**
   * Get weekly graph data (last 4 weeks)
   */
  static getWeeklyGraph(childId, weeks = 4) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const graph = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      end.setHours(0, 0, 0, 0);
      
      const weekEvents = childEvents.filter(e => {
        const t = new Date(e.timestamp);
        return t >= start && t < end;
      });
      
      const lessons = weekEvents.filter(e => e.type === 'lesson_complete').length;
      const answers = weekEvents.filter(e => e.type === 'answer');
      const accuracy = answers.length > 0
        ? Math.round((answers.filter(a => a.data.correct).length / answers.length) * 100)
        : 0;
      
      graph.push({
        week: `Week ${weeks - i}`,
        lessons,
        answers: answers.length,
        accuracy,
        badges: weekEvents.filter(e => e.type === 'badge_earned').length
      });
    }
    
    return graph;
  }

  /**
   * Get monthly graph data (last 12 months)
   */
  static getMonthlyGraph(childId, months = 12) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const graph = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7);
      
      const monthEvents = childEvents.filter(e => 
        e.timestamp.startsWith(monthStr)
      );
      
      const lessons = monthEvents.filter(e => e.type === 'lesson_complete').length;
      
      graph.push({
        month: date.toLocaleDateString('en', { month: 'short' }),
        lessons,
        accuracy: this.calculateMonthAccuracy(monthEvents)
      });
    }
    
    return graph;
  }

  static calculateMonthAccuracy(events) {
    const answers = events.filter(e => e.type === 'answer');
    return answers.length > 0
      ? Math.round((answers.filter(a => a.data.correct).length / answers.length) * 100)
      : 0;
  }

  static getReadingSpeedMetrics(childId) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const readingEvents = childEvents.filter(e => 
      e.type === 'lesson_complete' && e.data.subject === 'Reading'
    );
    
    const speeds = readingEvents.map(e => e.data.duration || 60);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    
    return {
      averageTime: Math.round(avgSpeed),
      storiesCompleted: readingEvents.length,
      fastestTime: speeds.length > 0 ? Math.min(...speeds) : 0,
      slowestTime: speeds.length > 0 ? Math.max(...speeds) : 0
    };
  }

  static getMathAccuracy(childId) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const mathEvents = childEvents.filter(e => 
      e.type === 'lesson_complete' && e.data.subject === 'Maths'
    );
    
    const scores = mathEvents.map(e => e.data.score || 0);
    const avgAccuracy = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
      : 0;
    
    return {
      accuracy: avgAccuracy,
      lessonsCompleted: mathEvents.length,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0
    };
  }

  static getFavoriteSubjects(childId, limit = 5) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const subjectTime = {};
    
    childEvents.forEach(e => {
      const subject = e.data.subject;
      if (subject) {
        subjectTime[subject] = (subjectTime[subject] || 0) + (e.data.duration || 0);
      }
    });
    
    return Object.entries(subjectTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([subject, time]) => ({ subject, time }));
  }

  static getWeakSubjects(childId, limit = 3) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const subjectAccuracy = {};
    const subjectCounts = {};
    
    childEvents.forEach(e => {
      const subject = e.data.subject;
      if (subject && e.type === 'lesson_complete') {
        subjectAccuracy[subject] = (subjectAccuracy[subject] || 0) + (e.data.score || 0);
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      }
    });
    
    return Object.entries(subjectAccuracy)
      .map(([subject, total]) => ({
        subject,
        accuracy: Math.round(total / (subjectCounts[subject] || 1))
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, limit);
  }

  static getLearningTrends(childId, days = 30) {
    const events = StorageService.get(ANALYTICS_KEY, []);
    const childEvents = events.filter(e => e.childId === childId);
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = childEvents.filter(e => e.timestamp.startsWith(dateStr));
      const lessons = dayEvents.filter(e => e.type === 'lesson_complete').length;
      const answers = dayEvents.filter(e => e.type === 'answer');
      
      trends.push({
        date: dateStr,
        lessons,
        answerRate: answers.length,
        active: lessons > 0 || answers.length > 0
      });
    }
    
    const recentAvg = trends.slice(-7).reduce((s, t) => s + t.lessons, 0) / 7;
    const earlierAvg = trends.slice(0, 23).reduce((s, t) => s + t.lessons, 0) / 23;
    
    return {
      trend: recentAvg > earlierAvg ? 'increasing' : recentAvg < earlierAvg ? 'decreasing' : 'stable',
      daily: trends
    };
  }
}