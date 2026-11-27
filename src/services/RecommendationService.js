/**
 * Recommendation Service - Personalized content suggestions
 * Provides adaptive recommendations for lessons, games, stories based on child's progress
 */
import { StorageService } from './StorageService';
import { LearningAnalytics } from './LearningAnalytics';
 // Assuming this exists for story data


const FEEDBACK_KEY = 'makenna_recommendation_feedback';

// Every recommendation must point at a real route in App.jsx.
const NEXT_ACTIVITY = {
  Alphabet: { title: 'Letter Adventure', description: 'Meet a new letter and practise tracing it.', path: '/alphabet', icon: '🔤' },
  Numbers: { title: 'Number Kingdom', description: 'Count, trace and recognise numbers.', path: '/numbers', icon: '🔢' },
  Maths: { title: 'Maths Mission', description: 'Practise counting and comparing.', path: '/maths', icon: '➕' },
  Reading: { title: 'Sight Words', description: 'Read words together out loud.', path: '/reading/sight-words', icon: '📖' },
  Science: { title: 'Science Lab', description: 'Explore how the world works.', path: '/science-lab', icon: '🔬' },
  Stories: { title: 'Story Time', description: 'Listen to a new story.', path: '/stories', icon: '📚' },
  Shapes: { title: 'Shape Detectives', description: 'Find shapes all around you.', path: '/shapes', icon: '🔷' },
};

export class RecommendationService {
  /**
   * Get personalized lesson recommendations
   */
  static getRecommendedLessons(childId) {
    const analytics = LearningAnalytics.getStats(childId);
    const recommendations = [];

    // Example: Recommend based on low mastery or next in sequence
    if (analytics.averageScore < 70) {
      recommendations.push({ type: 'revisit', subject: 'Maths', reason: 'Low average score' });
    }
    if (analytics.lessonsCompleted < 5) {
      recommendations.push({ type: 'new', subject: 'Alphabet', reason: 'Start new subject' });
    }

    // Prioritize lessons with negative feedback
    const feedback = this.getRecommendationFeedback(childId);
    for (const item of feedback) {
      if (item.feedback === 'dislike' && item.type === 'lesson') {
        recommendations.unshift({ type: 'revisit', subject: item.itemId, reason: 'Previous dislike' });
      }
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Get personalized game recommendations
   */
  static getRecommendedGames(childId) {
    const analytics = LearningAnalytics.getStats(childId);
    const recommendations = [];

    // Example: Recommend games related to current learning gaps
    if (analytics.mastery?.numbers < 50) {
      recommendations.push({ type: 'practice', game: 'CountingGame', reason: 'Numbers mastery low' });
    }
    if (analytics.gamesPlayed < 3) {
      recommendations.push({ type: 'new', game: 'MemoryMatch', reason: 'Explore games' });
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Get personalized story recommendations
   */
  static getRecommendedStories(childId) {
    const analytics = LearningAnalytics.getStats(childId);
    const recommendations = [];

    // Example: Recommend stories based on reading level or interests
    if (analytics.storiesRead < 2) {
      recommendations.push({ type: 'introduce', storyId: 'the-little-red-hen', reason: 'First stories' });
    }
    // Assume StoryEngine has a method to get stories by level
    // const advancedStories = StoryEngine.getStoriesByLevel(analytics.readingLevel + 1);
    // if (advancedStories.length > 0) {
    //   recommendations.push({ type: 'advance', storyId: advancedStories[0].id, reason: 'Next reading level' });
    // }

    return recommendations.slice(0, 3);
  }

  /**
   * One concrete, tappable next activity for the Home page.
   * Prefers weaker subjects, then falls back to the child's progress.
   */
  static getNextRecommendation(childId, childData = null) {
    const stats = LearningAnalytics.getStats(childId);
    const disliked = this.getRecommendationFeedback(childId)
      .filter(item => item.feedback === 'dislike')
      .map(item => item.itemId);

    const mastery = Object.entries(stats.mastery || {})
      .filter(([subject]) => NEXT_ACTIVITY[subject] && !disliked.includes(subject))
      .sort((a, b) => a[1] - b[1]);

    let subject;
    if (mastery.length > 0 && mastery[0][1] < 80) {
      subject = mastery[0][0];
    } else if (stats.lessonsCompleted < 5) {
      subject = 'Alphabet';
    } else {
      const progress = childData?.progress || {};
      const nextUnmastered = ['alphabet', 'numbers', 'reading', 'maths']
        .find(key => (progress[key] || 0) < 80);
      subject = {
        alphabet: 'Alphabet', numbers: 'Numbers', reading: 'Reading', maths: 'Maths',
      }[nextUnmastered] || 'Stories';
    }

    if (disliked.includes(subject)) subject = 'Stories';
    const activity = NEXT_ACTIVITY[subject] || NEXT_ACTIVITY.Alphabet;

    return {
      type: 'next',
      subject,
      icon: activity.icon,
      title: activity.title,
      description: activity.description,
      path: activity.path,
      reason: mastery.length > 0 && mastery[0][0] === subject
        ? 'A little more practice will help'
        : 'A great next step for you',
    };
  }

  /**
   * Get all recommendations (combines all types)
   */
  static getRecommendations(childId) {
    return [
      ...this.getRecommendedLessons(childId),
      ...this.getRecommendedGames(childId),
      ...this.getRecommendedStories(childId)
    ];
  }

  /**
   * Update user feedback for a recommendation
   * Feedback can be 'like', 'dislike', 'completed', 'skipped'
   */
  static updateRecommendationFeedback(childId, itemId, feedbackType) {
    const allFeedback = StorageService.get(FEEDBACK_KEY, {});
    if (!allFeedback[childId]) {
      allFeedback[childId] = [];
    }

    const existingFeedbackIndex = allFeedback[childId].findIndex(f => f.itemId === itemId);
    if (existingFeedbackIndex >= 0) {
      allFeedback[childId][existingFeedbackIndex].feedback = feedbackType;
      allFeedback[childId][existingFeedbackIndex].timestamp = new Date().toISOString();
    } else {
      allFeedback[childId].push({
        itemId,
        feedback: feedbackType,
        timestamp: new Date().toISOString()
      });
    }
    StorageService.set(FEEDBACK_KEY, allFeedback);
    return allFeedback[childId];
  }

  /**
   * Get all feedback for a child
   */
  static getRecommendationFeedback(childId) {
    const allFeedback = StorageService.get(FEEDBACK_KEY, {});
    return allFeedback[childId] || [];
  }

  /**
   * Clear all recommendation feedback for a child
   */
  static clearRecommendationFeedback(childId) {
    const allFeedback = StorageService.get(FEEDBACK_KEY, {});
    delete allFeedback[childId];
    StorageService.set(FEEDBACK_KEY, allFeedback);
  }
}