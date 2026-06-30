/**
 * Adaptive Learning Service - Tracks performance and adapts content
 */

export class AdaptiveLearningService {
  constructor() {
    this.performanceData = new Map();
    this.recommendations = new Map();
    this.difficultyMap = new Map();
    this.loadFromStorage();
  }

  /**
   * Load performance data from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('adaptive_learning_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.performanceData = new Map(Object.entries(parsed.performance || {}));
        this.recommendations = new Map(Object.entries(parsed.recommendations || {}));
        this.difficultyMap = new Map(Object.entries(parsed.difficulty || {}));
      }
    } catch (error) {
      console.warn('Failed to load adaptive learning data:', error);
    }
  }

  /**
   * Save performance data to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        performance: Object.fromEntries(this.performanceData),
        recommendations: Object.fromEntries(this.recommendations),
        difficulty: Object.fromEntries(this.difficultyMap)
      };
      localStorage.setItem('adaptive_learning_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save adaptive learning data:', error);
    }
  }

  /**
   * Record performance for a letter/game
   */
  recordPerformance(itemId, data) {
    const { correct, incorrect, time, difficulty } = data;
    
    if (!this.performanceData.has(itemId)) {
      this.performanceData.set(itemId, {
        attempts: 0,
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        lastAttempt: Date.now(),
        difficulty: difficulty || 'medium'
      });
    }
    
    const record = this.performanceData.get(itemId);
    record.attempts += (correct + incorrect);
    record.correct += correct;
    record.incorrect += incorrect;
    record.totalTime += time;
    record.lastAttempt = Date.now();
    
    // Calculate mastery level
    const mastery = this.calculateMastery(itemId);
    this.difficultyMap.set(itemId, this.getRecommendedDifficulty(mastery));
    this.recommendations.set(itemId, this.generateRecommendation(itemId));
    
    this.saveToStorage();
    return { mastery, difficulty: this.difficultyMap.get(itemId), recommendation: this.recommendations.get(itemId) };
  }

  /**
   * Calculate mastery level (0-100)
   */
  calculateMastery(itemId) {
    const record = this.performanceData.get(itemId);
    if (!record || record.attempts === 0) return 0;
    
    const accuracy = record.correct / record.attempts;
    const consistency = Math.min(1, record.attempts / 10);
    const speedScore = Math.max(0, 1 - (record.totalTime / (record.attempts * 5)));
    
    return Math.round((accuracy * 0.6 + consistency * 0.2 + speedScore * 0.2) * 100);
  }

  /**
   * Get recommended difficulty based on mastery
   */
  getRecommendedDifficulty(mastery) {
    if (mastery >= 80) return 'hard';
    if (mastery >= 50) return 'medium';
    return 'easy';
  }

  /**
   * Generate recommendation for item
   */
  generateRecommendation(itemId) {
    const record = this.performanceData.get(itemId);
    if (!record) return null;
    
    const mastery = this.calculateMastery(itemId);
    const accuracy = record.correct / Math.max(1, record.attempts);
    
    if (mastery >= 80) {
      return {
        action: 'advance',
        message: "You're doing great! Ready for more challenging content! 🚀",
        recommendedDifficulty: 'hard'
      };
    } else if (mastery >= 50) {
      return {
        action: 'practice',
        message: "Keep practicing! You're getting better every time! 💪",
        recommendedDifficulty: 'medium'
      };
    } else {
      return {
        action: 'review',
        message: "Let's take it slow and practice some more! You can do it! 🌟",
        recommendedDifficulty: 'easy'
      };
    }
  }

  /**
   * Get performance summary for an item
   */
  getPerformanceSummary(itemId) {
    const record = this.performanceData.get(itemId);
    if (!record) return null;
    
    return {
      itemId,
      attempts: record.attempts,
      correct: record.correct,
      incorrect: record.incorrect,
      accuracy: Math.round((record.correct / Math.max(1, record.attempts)) * 100),
      mastery: this.calculateMastery(itemId),
      difficulty: this.difficultyMap.get(itemId) || 'medium',
      recommendation: this.recommendations.get(itemId) || null,
      lastAttempt: new Date(record.lastAttempt).toLocaleDateString()
    };
  }

  /**
   * Get items that need review
   */
  getItemsNeedingReview(threshold = 50) {
    const items = [];
    for (const [itemId, record] of this.performanceData) {
      const mastery = this.calculateMastery(itemId);
      if (mastery < threshold) {
        items.push({
          itemId,
          mastery,
          record
        });
      }
    }
    return items.sort((a, b) => a.mastery - b.mastery);
  }

  /**
   * Get recommended practice items
   */
  getRecommendedPractice(limit = 5) {
    const items = [];
    for (const [itemId, record] of this.performanceData) {
      const mastery = this.calculateMastery(itemId);
      const lastAttempt = record.lastAttempt;
      const daysSinceLast = (Date.now() - lastAttempt) / (1000 * 60 * 60 * 24);
      
      // Prioritize items with low mastery or not practiced recently
      const priority = (100 - mastery) * 0.6 + Math.min(daysSinceLast, 30) * 0.4;
      items.push({
        itemId,
        priority,
        mastery,
        daysSinceLast: Math.round(daysSinceLast)
      });
    }
    
    return items
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  /**
   * Reset data for an item
   */
  resetItem(itemId) {
    this.performanceData.delete(itemId);
    this.recommendations.delete(itemId);
    this.difficultyMap.delete(itemId);
    this.saveToStorage();
  }

  /**
   * Reset all data
   */
  resetAll() {
    this.performanceData.clear();
    this.recommendations.clear();
    this.difficultyMap.clear();
    this.saveToStorage();
  }

  /**
   * Get overall statistics
   */
  getStatistics() {
    let totalAttempts = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let itemsMastered = 0;
    let itemsInProgress = 0;
    let itemsNeedingReview = 0;
    
    for (const [itemId, record] of this.performanceData) {
      totalAttempts += record.attempts;
      totalCorrect += record.correct;
      totalIncorrect += record.incorrect;
      
      const mastery = this.calculateMastery(itemId);
      if (mastery >= 80) itemsMastered++;
      else if (mastery >= 50) itemsInProgress++;
      else itemsNeedingReview++;
    }
    
    return {
      totalAttempts,
      totalCorrect,
      totalIncorrect,
      accuracy: Math.round((totalCorrect / Math.max(1, totalAttempts)) * 100),
      itemsMastered,
      itemsInProgress,
      itemsNeedingReview,
      totalItems: this.performanceData.size
    };
  }
}

// Singleton instance
const adaptiveLearningService = new AdaptiveLearningService();
export default adaptiveLearningService;