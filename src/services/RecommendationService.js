/**
 * Recommendation Service - Personalized content suggestions
 * Provides adaptive recommendations for lessons, games, stories based on child's progress
 */
import { StorageService } from './StorageService';
import { LearningAnalytics } from './LearningAnalytics';
import { StoryEngine } from './StoryEngine'; // Assuming this exists for story data

const RECOMMENDATION_KEY = 'makenna_recommendations';
const FEEDBACK_KEY = 'makenna_recommendation_feedback';

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