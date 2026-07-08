/**
 * Revision Planner Service - Automatic spaced repetition scheduling
 * Detects forgotten lessons and generates weekly revision timetables
 */
import { StorageService } from './StorageService';
import AdaptiveLearningService from './AdaptiveLearningService';
import { ProfileService } from './ProfileService';

const REVISION_KEY = 'makenna_revision_plans';

// Spaced repetition intervals (days)
const SPACED_INTERVALS = [1, 3, 7, 14, 30];

export class RevisionPlanner {
  /**
   * Get revision plan for a child
   */
  static getPlan(childId) {
    const allPlans = StorageService.get(REVISION_KEY, {});
    if (!allPlans[childId]) {
      allPlans[childId] = {
        weeklyTimetable: this.generateWeeklyTimetable(childId),
        spacedRepetition: {},
        lastUpdated: new Date().toISOString()
      };
      StorageService.set(REVISION_KEY, allPlans);
    }
    return allPlans[childId];
  }

  /**
   * Save revision plan for a child
   */
  static savePlan(childId, plan) {
    const allPlans = StorageService.get(REVISION_KEY, {});
    allPlans[childId] = plan;
    StorageService.set(REVISION_KEY, allPlans);
  }

  /**
   * Detect forgotten lessons (items with low mastery and old last attempt)
   */
  static detectForgottenLessons(childId, thresholdDays = 7) {
    const allPlans = StorageService.get(REVISION_KEY, {});
    const items = [];
    
    // Check adaptive learning data
    for (const [itemId, record] of AdaptiveLearningService.performanceData) {
      const daysSince = (Date.now() - record.lastAttempt) / (1000 * 60 * 60 * 24);
      const mastery = AdaptiveLearningService.calculateMastery(itemId);
      
      // Item is forgotten if: low mastery AND not practiced in threshold days
      if (mastery < 50 && daysSince > thresholdDays) {
        items.push({
          itemId,
          subject: this.getItemSubject(itemId),
          daysSince: Math.round(daysSince),
          mastery,
          priority: this.calculatePriority(mastery, daysSince)
        });
      }
    }
    
    return items.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get subject from itemId
   */
  static getItemSubject(itemId) {
    const lower = itemId.toLowerCase();
    if (lower.includes('alph') || lower.includes('letter')) return 'Alphabet';
    if (lower.includes('num') || lower.includes('number')) return 'Numbers';
    if (lower.includes('read') || lower.includes('word') || lower.includes('phon')) return 'Reading';
    if (lower.includes('math') || lower.includes('add') || lower.includes('sub') || lower.includes('count')) return 'Maths';
    if (lower.includes('shape')) return 'Shapes';
    if (lower.includes('colour') || lower.includes('color')) return 'Colours';
    if (lower.includes('science')) return 'Science';
    return 'General';
  }

  /**
   * Calculate revision priority
   */
  static calculatePriority(mastery, daysSince) {
    // Lower mastery + longer time = higher priority
    return (100 - mastery) * 0.6 + Math.min(daysSince, 30) * 0.4;
  }

  /**
   * Generate weekly revision timetable
   */
  static generateWeeklyTimetable(childId) {
    const forgotten = this.detectForgottenLessons(childId);
    const timetable = [];
    
    // Generate timetable for 5 days (weekdays)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const subjects = ['Alphabet', 'Numbers', 'Reading', 'Maths', 'Science', 'Shapes', 'Colours'];
    
    forgotten.slice(0, 5).forEach((item, index) => {
      timetable.push({
        day: days[index] || days[days.length - 1],
        date: this.getDateForDay(index),
        subject: item.subject,
        itemId: item.itemId,
        topic: this.formatTopic(item.itemId),
        duration: '15 min',
        completed: false
      });
    });
    
    // Fill remaining days with general practice
    for (let i = timetable.length; i < 5; i++) {
      timetable.push({
        day: days[i],
        date: this.getDateForDay(i),
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        itemId: `general_${i}`,
        topic: 'General Practice',
        duration: '10 min',
        completed: false
      });
    }
    
    return timetable;
  }

  /**
   * Get date string for day offset
   */
  static getDateForDay(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + (dayOffset - date.getDay() + 1) % 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Format topic name from itemId
   */
  static formatTopic(itemId) {
    const parts = itemId.split('_');
    if (parts.length > 1) {
      return parts.slice(1).join(' ').replace(/-/g, ' ');
    }
    return itemId;
  }

  /**
   * Mark revision session as completed
   */
  static markCompleted(childId, dayIndex) {
    const plan = this.getPlan(childId);
    if (plan.weeklyTimetable[dayIndex]) {
      plan.weeklyTimetable[dayIndex].completed = true;
      this.savePlan(childId, plan);
    }
  }

  /**
   * Get today's revision items
   */
  static getTodaysRevision(childId) {
    const plan = this.getPlan(childId);
    const today = new Date().toISOString().split('T')[0];
    
    return plan.weeklyTimetable.filter(
      item => item.date === today && !item.completed
    );
  }

  /**
   * Update spaced repetition data
   */
  static updateSpacedRepetition(childId, itemId, mastered = true) {
    const plan = this.getPlan(childId);
    
    if (!plan.spacedRepetition[itemId]) {
      plan.spacedRepetition[itemId] = {
        intervals: [],
        nextReview: Date.now(),
        streak: 0
      };
    }
    
    const spaced = plan.spacedRepetition[itemId];
    
    if (mastered) {
      spaced.streak++;
      const nextInterval = SPACED_INTERVALS[Math.min(spaced.streak, SPACED_INTERVALS.length - 1)];
      spaced.nextReview = Date.now() + (nextInterval * 24 * 60 * 60 * 1000);
      spaced.intervals.push({ date: Date.now(), interval: nextInterval });
    } else {
      spaced.streak = 0;
      spaced.nextReview = Date.now() + (1 * 24 * 60 * 60 * 1000); // Review tomorrow
    }
    
    this.savePlan(childId, plan);
  }

  /**
   * Get items due for spaced repetition
   */
  static getDueForRepetition(childId) {
    const plan = this.getPlan(childId);
    const now = Date.now();
    
    return Object.entries(plan.spacedRepetition || {})
      .filter(([itemId, data]) => data.nextReview <= now)
      .map(([itemId]) => itemId);
  }

  /**
   * Get revision summary
   */
  static getSummary(childId) {
    const plan = this.getPlan(childId);
    const forgotten = this.detectForgottenLessons(childId);
    const dueForRepetition = this.getDueForRepetition(childId);
    const todaysRevision = this.getTodaysRevision(childId);
    
    return {
      totalForgotten: forgotten.length,
      totalDueForRepetition: dueForRepetition.length,
      todaysSessions: todaysRevision.length,
      weeklyCompletion: plan.weeklyTimetable.filter(t => t.completed).length,
      weeklyTotal: plan.weeklyTimetable.length,
      nextRevision: todaysRevision[0] || plan.weeklyTimetable.find(t => !t.completed)
    };
  }

  /**
   * Reset revision plan (e.g., for new week)
   */
  static resetPlan(childId) {
    const plan = this.getPlan(childId);
    plan.weeklyTimetable = this.generateWeeklyTimetable(childId);
    plan.lastUpdated = new Date().toISOString();
    this.savePlan(childId, plan);
  }
}