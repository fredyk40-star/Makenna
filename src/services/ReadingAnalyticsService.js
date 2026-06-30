/**
 * Reading Analytics Service - Tracks reading progress and achievements
 */

export class ReadingAnalyticsService {
  constructor() {
    this.stats = {
      storiesCompleted: 0,
      minutesRead: 0,
      wordsLearned: [],
      questionsAnswered: 0,
      correctAnswers: 0,
      readingStreak: 0,
      lastReadDate: null,
      favoriteStories: [],
      readingLevel: 1
    };
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('reading_analytics');
      if (data) {
        this.stats = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load reading analytics:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('reading_analytics', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save reading analytics:', error);
    }
  }

  /**
   * Record story completion
   */
  recordStoryCompletion(storyId) {
    this.stats.storiesCompleted++;
    
    // Update streak
    const today = new Date().toDateString();
    if (this.stats.lastReadDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (this.stats.lastReadDate === yesterdayStr) {
        this.stats.readingStreak++;
      } else {
        this.stats.readingStreak = 1;
      }
      this.stats.lastReadDate = today;
    }
    
    // Update reading level (every 5 stories)
    this.stats.readingLevel = Math.floor(this.stats.storiesCompleted / 5) + 1;
    
    this.saveToStorage();
  }

  /**
   * Record reading time
   */
  recordReadingTime(minutes) {
    this.stats.minutesRead += minutes;
    this.saveToStorage();
  }

  /**
   * Record vocabulary learned
   */
  recordVocabulary(word) {
    if (!this.stats.wordsLearned.includes(word)) {
      this.stats.wordsLearned.push(word);
      this.saveToStorage();
    }
  }

  /**
   * Record question answer
   */
  recordQuestionAnswer(correct) {
    this.stats.questionsAnswered++;
    if (correct) {
      this.stats.correctAnswers++;
    }
    this.saveToStorage();
  }

  /**
   * Add favorite story
   */
  addFavoriteStory(storyId) {
    if (!this.stats.favoriteStories.includes(storyId)) {
      this.stats.favoriteStories.push(storyId);
      this.saveToStorage();
    }
  }

  /**
   * Remove favorite story
   */
  removeFavoriteStory(storyId) {
    this.stats.favoriteStories = this.stats.favoriteStories.filter(id => id !== storyId);
    this.saveToStorage();
  }

  /**
   * Check if story is favorite
   */
  isFavoriteStory(storyId) {
    return this.stats.favoriteStories.includes(storyId);
  }

  /**
   * Get stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get comprehension accuracy
   */
  getComprehensionAccuracy() {
    if (this.stats.questionsAnswered === 0) return 0;
    return Math.round((this.stats.correctAnswers / this.stats.questionsAnswered) * 100);
  }

  /**
   * Get reading level label
   */
  getReadingLevelLabel() {
    const level = this.stats.readingLevel;
    if (level <= 1) return 'Emerging Reader 🌱';
    if (level <= 2) return 'Beginning Reader 📖';
    if (level <= 3) return 'Growing Reader 🌟';
    if (level <= 4) return 'Confident Reader 📚';
    return 'Advanced Reader 🏆';
  }

  /**
   * Get achievement badges
   */
  getAchievements() {
    const achievements = [];
    
    if (this.stats.storiesCompleted >= 1) {
      achievements.push({ id: 'first-story', name: 'First Story', icon: '🌟' });
    }
    if (this.stats.storiesCompleted >= 5) {
      achievements.push({ id: 'story-collector', name: 'Story Collector', icon: '📚' });
    }
    if (this.stats.storiesCompleted >= 10) {
      achievements.push({ id: 'bookworm', name: 'Bookworm', icon: '🐛' });
    }
    if (this.stats.minutesRead >= 60) {
      achievements.push({ id: 'reading-60', name: 'One Hour Read', icon: '⏰' });
    }
    if (this.stats.minutesRead >= 300) {
      achievements.push({ id: 'reading-300', name: 'Reading Champion', icon: '🏆' });
    }
    if (this.stats.wordsLearned.length >= 10) {
      achievements.push({ id: 'vocabulary-10', name: 'Vocabulary Builder', icon: '💪' });
    }
    if (this.stats.wordsLearned.length >= 50) {
      achievements.push({ id: 'vocabulary-50', name: 'Word Wizard', icon: '🔮' });
    }
    if (this.stats.readingStreak >= 7) {
      achievements.push({ id: 'streak-7', name: 'Week Streak', icon: '🔥' });
    }
    if (this.stats.readingStreak >= 30) {
      achievements.push({ id: 'streak-30', name: 'Month Streak', icon: '🌙' });
    }
    
    return achievements;
  }

  /**
   * Reset all data
   */
  resetAll() {
    this.stats = {
      storiesCompleted: 0,
      minutesRead: 0,
      wordsLearned: [],
      questionsAnswered: 0,
      correctAnswers: 0,
      readingStreak: 0,
      lastReadDate: null,
      favoriteStories: [],
      readingLevel: 1
    };
    this.saveToStorage();
  }
}

// Singleton instance
const readingAnalyticsService = new ReadingAnalyticsService();
export default readingAnalyticsService;