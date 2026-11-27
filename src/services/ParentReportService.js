/**
 * Parent Report Service - builds a real, printable progress report.
 * Every number comes from stored activity, never from random data.
 */
import { LearningAnalytics } from './LearningAnalytics';
import { GamificationService } from './GamificationService';
import { SafeModeService } from './SafeModeService';
import DailyMissionService from './DailyMissionService';
import gameProgressService from './GameProgressService';
import { ChildAccountService } from './ChildAccountService';
import {
  getCompletionCount as getNumbersCompletionCount,
  getMasteryCount as getNumbersMasteryCount,
} from './NumbersProgressService';

const SUMMARY_WORDS = {
  Alphabet: 'letters and their sounds',
  Numbers: 'counting and number recognition',
  Maths: 'adding, subtracting and comparing',
  Reading: 'sight words and early reading',
  Stories: 'listening comprehension',
  Shapes: 'shapes and colours',
  Science: 'the world around them',
};

export class ParentReportService {
  static getReport(child, generatedAt = new Date()) {
    const childId = child?.childId || '';
    const stats = LearningAnalytics.getStats(childId);
    const daily = LearningAnalytics.getDailyGraph(childId, 7);
    const weekly = LearningAnalytics.getWeeklyGraph(childId, 4);
    const alphabet = ChildAccountService.getChildProgress(childId, 'alphabet_progress', {});
    const numbers = ChildAccountService.getChildProgress(childId, 'numbers_progress', {});
    const gamification = GamificationService.getState(childId);

    const weeklyLessons = daily.reduce((sum, day) => sum + day.lessons, 0);
    const weeklyMinutes = Math.round(daily.reduce((sum, day) => sum + day.answers, 0) * 0.5);
    const practiced = [...new Set(
      LearningAnalytics.getChildEvents(childId)
        .filter(event => event.type === 'lesson_complete' && event.data?.subject)
        .map(event => event.data.subject)
    )];

    return {
      generatedAt: generatedAt.toISOString(),
      child: {
        id: childId,
        name: child?.fullName || child?.name || 'Child',
        level: stats.level,
        stars: stats.starsEarned,
        streak: stats.currentStreak,
      },
      summary: {
        weeklyLessons,
        weeklyMinutes,
        totalLessons: stats.lessonsCompleted,
        averageScore: stats.averageScore,
        daysActive: stats.daysActive,
        missionStreak: childId ? (DailyMissionService.getMission(childId)?.streak || 0) : 0,
        learnedText: this.buildLearnedText(practiced),
        practiced,
      },
      mastery: {
        alphabet: (alphabet.completed || alphabet.mastered || []).length,
        // Numbers are derived from skill records so a written/story skill does
        // not inflate completion, and legacy arrays remain compatible.
        numbers: getNumbersMasteryCount(numbers),
        numbersCompleted: getNumbersCompletionCount(numbers),
        bySubject: stats.mastery || {},
      },
      charts: { daily, weekly },
      achievements: [
        ...gamification.badges.map(badge => ({
          id: typeof badge === 'string' ? badge : badge.id,
          name: typeof badge === 'string' ? badge : (badge.title || badge.name || badge.id),
          earned: true,
        })),
        ...gameProgressService.getAchievements().map(achievement => ({
          id: achievement.id,
          name: achievement.title,
          earned: true,
        })),
      ],
      settings: {
        safeMode: SafeModeService.getSettings(childId),
        soundEffects: gamification.soundEffectsEnabled !== false,
        confetti: gamification.confettiEnabled !== false,
      },
    };
  }

  static buildLearnedText(subjects) {
    if (subjects.length === 0) {
      return 'No completed lessons yet. Tap an activity to begin!';
    }
    const phrases = subjects.map(subject => SUMMARY_WORDS[subject] || subject.toLowerCase());
    return `This week Makenna practised ${phrases.join(', ')}.`;
  }

  static toJson(report) {
    return JSON.stringify(report, null, 2);
  }
}

export default ParentReportService;
