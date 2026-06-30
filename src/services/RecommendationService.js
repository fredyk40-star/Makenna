/**
 * Recommendation Service - Provides learning recommendations
 */

export class RecommendationService {
  constructor() {
    this.letterData = {};
    this.progressData = {};
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('recommendation_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.letterData = parsed.letterData || {};
        this.progressData = parsed.progressData || {};
      }
    } catch (error) {
      console.warn('Failed to load recommendation data:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        letterData: this.letterData,
        progressData: this.progressData
      };
      localStorage.setItem('recommendation_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save recommendation data:', error);
    }
  }

  /**
   * Update letter data
   */
  updateLetterData(letter, data) {
    this.letterData[letter] = {
      ...this.letterData[letter],
      ...data,
      lastUpdated: Date.now()
    };
    this.saveToStorage();
  }

  /**
   * Update progress data
   */
  updateProgressData(data) {
    this.progressData = { ...this.progressData, ...data };
    this.saveToStorage();
  }

  /**
   * Get recommendations for a child
   */
  getRecommendations() {
    const recommendations = [];
    
    // Analyze letter mastery
    const letters = Object.keys(this.letterData);
    const strugglingLetters = [];
    const masteredLetters = [];
    
    for (const letter of letters) {
      const data = this.letterData[letter];
      const mastery = data.mastery || 0;
      
      if (mastery < 60) {
        strugglingLetters.push({ letter, data });
      } else if (mastery >= 80) {
        masteredLetters.push({ letter, data });
      }
    }
    
    // Sort struggling letters by mastery
    strugglingLetters.sort((a, b) => a.data.mastery - b.data.mastery);
    
    // Generate recommendations
    if (strugglingLetters.length > 0) {
      const topStruggles = strugglingLetters.slice(0, 3);
      recommendations.push({
        type: 'review',
        title: 'Letters to Review',
        description: `Practice these letters more: ${topStruggles.map(s => s.letter).join(', ')}`,
        letters: topStruggles.map(s => s.letter),
        priority: 'high'
      });
    }
    
    if (masteredLetters.length > 0) {
      recommendations.push({
        type: 'advance',
        title: 'Ready for More!',
        description: `You've mastered ${masteredLetters.length} letters! Great job!`,
        count: masteredLetters.length,
        priority: 'medium'
      });
    }
    
    // Check overall progress
    const totalLetters = 26;
    const completed = masteredLetters.length;
    const progress = Math.round((completed / totalLetters) * 100);
    
    if (progress < 100) {
      const remaining = totalLetters - completed;
      recommendations.push({
        type: 'progress',
        title: 'Keep Going!',
        description: `You've completed ${completed} of ${totalLetters} letters. ${remaining} more to go!`,
        progress,
        remaining,
        priority: 'medium'
      });
    } else {
      recommendations.push({
        type: 'complete',
        title: '🎉 You Did It!',
        description: 'You\'ve completed all 26 letters! Ready for the next adventure?',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Get specific letter recommendations
   */
  getLetterRecommendation(letter) {
    const data = this.letterData[letter];
    if (!data) return null;
    
    const mastery = data.mastery || 0;
    
    if (mastery < 40) {
      return {
        action: 'review',
        suggestion: 'Start with letter recognition and tracing',
        activities: ['Letter Hunt', 'Trace Letter', 'Watch Letter Animation'],
        priority: 'high'
      };
    } else if (mastery < 60) {
      return {
        action: 'practice',
        suggestion: 'Practice letter sounds and vocabulary',
        activities: ['Phonics Practice', 'Vocabulary Cards', 'Sound Match'],
        priority: 'medium'
      };
    } else if (mastery < 80) {
      return {
        action: 'reinforce',
        suggestion: 'Reinforce with word building and reading',
        activities: ['Word Builder', 'Reading Practice', 'Story Time'],
        priority: 'low'
      };
    } else {
      return {
        action: 'celebrate',
        suggestion: 'Excellent work on this letter!',
        activities: ['Review', 'Games', 'Challenge'],
        priority: 'low'
      };
    }
  }

  /**
   * Get next suggested activity
   */
  getNextActivity() {
    const recommendations = this.getRecommendations();
    const highPriority = recommendations.filter(r => r.priority === 'high');
    
    if (highPriority.length > 0) {
      return highPriority[0];
    }
    
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');
    if (mediumPriority.length > 0) {
      return mediumPriority[0];
    }
    
    return recommendations[0] || null;
  }

  /**
   * Get progress summary
   */
  getProgressSummary() {
    const letters = Object.keys(this.letterData);
    const totalLetters = 26;
    const mastered = letters.filter(l => (this.letterData[l]?.mastery || 0) >= 80).length;
    const inProgress = letters.filter(l => {
      const m = this.letterData[l]?.mastery || 0;
      return m >= 40 && m < 80;
    }).length;
    const needsWork = letters.filter(l => (this.letterData[l]?.mastery || 0) < 40).length;
    const notStarted = totalLetters - letters.length;
    
    return {
      total: totalLetters,
      mastered,
      inProgress,
      needsWork,
      notStarted,
      progress: Math.round((mastered / totalLetters) * 100)
    };
  }

  /**
   * Reset recommendation data
   */
  reset() {
    this.letterData = {};
    this.progressData = {};
    this.saveToStorage();
  }
}

// Singleton instance
const recommendationService = new RecommendationService();
export default recommendationService;