/**
 * Smart Lesson Scheduler - AI-powered lesson planning
 * Creates personalized daily/weekly learning schedules
 */
import { StorageService } from './StorageService';
import { AdaptiveLearningService } from './AdaptiveLearningService';
import { RevisionPlanner } from './RevisionPlanner';

const SCHEDULE_KEY = 'makenna_lesson_schedule';

const SUBJECT_PRIORITY = {
  'Alphabet': 1,
  'Numbers': 1,
  'Reading': 2,
  'Maths': 2,
  'Science': 3,
  'Shapes': 1,
  'Colours': 1
};

export class LessonScheduler {
  /**
   * Generate a personalized schedule for a child
   */
  static generateSchedule(childId, days = 7) {
    const schedule = {
      childId,
      days: [],
      generatedAt: new Date().toISOString()
    };

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      schedule.days.push({
        date: dateStr,
        day: date.toLocaleDateString('en', { weekday: 'long' }),
        lessons: this.generateDailyLessons(childId, dateStr, i)
      });
    }

    StorageService.set(`${SCHEDULE_KEY}_${childId}`, schedule);
    return schedule;
  }

  /**
   * Generate lessons for a specific day
   */
  static generateDailyLessons(childId, date, dayIndex) {
    const lessons = [];

    // Check for revision items first
    const revisionItems = RevisionPlanner.getDueForRepetition(childId);
    if (revisionItems.length > 0 && dayIndex % 2 === 0) {
      // Add revision lesson on alternating days
      lessons.push({
        subject: 'Revision',
        type: 'spaced-repetition',
        items: revisionItems.slice(0, 3),
        duration: '15 min',
        priority: 1
      });
    }

    // Detect weak areas
    const weakAreas = RevisionPlanner.detectForgottenLessons(childId);
    const weakSubjects = weakAreas.map(a => a.subject);

    // Add lessons based on priority
    const subjects = ['Alphabet', 'Numbers', 'Reading', 'Maths', 'Science'];
    const addedSubjects = new Set();

    // First add weak subjects
    weakSubjects.forEach(subject => {
      if (!addedSubjects.has(subject)) {
        lessons.push({
          subject,
          type: 'focus-review',
          items: [],
          duration: '20 min',
          priority: 1
        });
        addedSubjects.add(subject);
      }
    });

    // Then add balanced learning
    const remainingSlots = Math.max(3 - lessons.length, 0);
    for (const subject of subjects) {
      if (lessons.length >= 4) break;
      if (!addedSubjects.has(subject)) {
        lessons.push({
          subject,
          type: 'new-content',
          items: this.getSuggestedContent(subject, childId),
          duration: '25 min',
          priority: SUBJECT_PRIORITY[subject] || 2
        });
        addedSubjects.add(subject);
      }
    }

    return lessons.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get suggested content for a subject
   */
  static getSuggestedContent(subject, childId) {
    // Return placeholder content IDs based on subject
    const suggestions = {
      Alphabet: ['a', 'b', 'c'],
      Numbers: ['1', '2', '3'],
      Reading: ['sight-words-1', 'sight-words-2'],
      Maths: ['addition-easy', 'subtraction-easy'],
      Science: ['animals-1']
    };
    return suggestions[subject] || [];
  }

  /**
   * Get schedule for a child (entire schedule object)
   */
  static getFullSchedule(childId) {
    return StorageService.get(`${SCHEDULE_KEY}_${childId}`, {});
  }

  /**
   * Add lesson to schedule for a specific date
   */
  static addLesson(childId, dateStr, lesson) {
    const schedule = this.getFullSchedule(childId);
    if (!schedule[dateStr]) {
      schedule[dateStr] = [];
    }
    schedule[dateStr].push({ ...lesson, id: Date.now(), completed: false });
    StorageService.set(`${SCHEDULE_KEY}_${childId}`, schedule);
  }

  /**
   * Remove lesson from schedule for a specific date
   */
  static removeLesson(childId, dateStr, lessonId) {
    const schedule = this.getFullSchedule(childId);
    if (schedule[dateStr]) {
      schedule[dateStr] = schedule[dateStr].filter(lesson => lesson.id !== lessonId);
      StorageService.set(`${SCHEDULE_KEY}_${childId}`, schedule);
    }
  }

  /**
   * Get schedule for a specific date
   */
  static getScheduleForDate(childId, dateStr) {
    const schedule = this.getFullSchedule(childId);
    return schedule[dateStr] || [];
  }

  /**
   * Mark lesson as complete
   */
  static completeLesson(childId, dateStr, lessonId) {
    const schedule = this.getFullSchedule(childId);
    if (schedule[dateStr]) {
      const lessonIndex = schedule[dateStr].findIndex(lesson => lesson.id === lessonId);
      if (lessonIndex >= 0) {
        schedule[dateStr][lessonIndex].completed = true;
        StorageService.set(`${SCHEDULE_KEY}_${childId}`, schedule);
      }
    }
  }

  /**
   * Get available subjects for lessons
   */
  static getAvailableSubjects() {
    return ["Alphabet", "Numbers", "Maths", "Reading", "Science", "Shapes", "Colours"];
  }

  /**
   * Get available lesson types
   */
  static getLessonTypes() {
    return ["lesson", "game", "story", "assessment"];
  }

  /**
   * Get the week's schedule based on a starting date
   */
  static getWeekSchedule(childId, startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const schedule = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      schedule.push({
        date: day,
        dateStr,
        lessons: this.getScheduleForDate(childId, dateStr)
      });
    }
    return schedule;
  }
}