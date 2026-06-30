/**
 * Story Engine - Core story reading and interaction logic
 */

export class StoryEngine {
  constructor() {
    this.currentStory = null;
    this.currentPage = 0;
    this.isReadingMode = 'read-to-me'; // 'read-to-me' or 'read-by-myself'
    this.isPlaying = false;
    this.isPaused = false;
    this.highlightedWord = '';
    this.progress = 0;
    this.interactions = [];
    this.comprehensionScores = {};
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('story_engine_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.comprehensionScores = parsed.comprehensionScores || {};
      }
    } catch (error) {
      console.warn('Failed to load story engine data:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        comprehensionScores: this.comprehensionScores
      };
      localStorage.setItem('story_engine_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save story engine data:', error);
    }
  }

  /**
   * Load a story
   */
  loadStory(story) {
    this.currentStory = story;
    this.currentPage = 0;
    this.progress = 0;
    this.interactions = [];
    this.highlightedWord = '';
    this.saveToStorage();
    return this.currentStory;
  }

  /**
   * Get current page
   */
  getCurrentPage() {
    if (!this.currentStory) return null;
    return this.currentStory.pages[this.currentPage] || null;
  }

  /**
   * Get total pages
   */
  getTotalPages() {
    if (!this.currentStory) return 0;
    return this.currentStory.pages.length;
  }

  /**
   * Go to next page
   */
  nextPage() {
    if (this.currentPage < this.getTotalPages() - 1) {
      this.currentPage++;
      this.updateProgress();
      return this.getCurrentPage();
    }
    return null;
  }

  /**
   * Go to previous page
   */
  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateProgress();
      return this.getCurrentPage();
    }
    return null;
  }

  /**
   * Go to specific page
   */
  goToPage(pageNumber) {
    if (pageNumber >= 0 && pageNumber < this.getTotalPages()) {
      this.currentPage = pageNumber;
      this.updateProgress();
      return this.getCurrentPage();
    }
    return null;
  }

  /**
   * Update reading progress
   */
  updateProgress() {
    this.progress = ((this.currentPage + 1) / this.getTotalPages()) * 100;
    this.saveToStorage();
  }

  /**
   * Set reading mode
   */
  setReadingMode(mode) {
    if (mode === 'read-to-me' || mode === 'read-by-myself') {
      this.isReadingMode = mode;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.isPaused = !this.isPaused;
    } else {
      this.isPlaying = true;
      this.isPaused = false;
    }
    return { isPlaying: this.isPlaying, isPaused: this.isPaused };
  }

  /**
   * Stop reading
   */
  stopReading() {
    this.isPlaying = false;
    this.isPaused = false;
    this.highlightedWord = '';
  }

  /**
   * Get highlighted word
   */
  getHighlightedWord() {
    return this.highlightedWord;
  }

  /**
   * Set highlighted word
   */
  setHighlightedWord(word) {
    this.highlightedWord = word;
  }

  /**
   * Record interaction
   */
  recordInteraction(type, data) {
    this.interactions.push({
      type,
      data,
      page: this.currentPage,
      timestamp: Date.now()
    });
    this.saveToStorage();
  }

  /**
   * Get interaction history
   */
  getInteractionHistory() {
    return this.interactions;
  }

  /**
   * Record comprehension score
   */
  recordComprehension(storyId, score) {
    this.comprehensionScores[storyId] = {
      score,
      attempts: (this.comprehensionScores[storyId]?.attempts || 0) + 1,
      lastAttempt: Date.now()
    };
    this.saveToStorage();
  }

  /**
   * Get comprehension score for a story
   */
  getComprehensionScore(storyId) {
    return this.comprehensionScores[storyId] || null;
  }

  /**
   * Get reading progress for a story
   */
  getStoryProgress(storyId) {
    // This would be expanded to track per-story progress
    return {
      completed: this.progress === 100,
      progress: this.progress,
      pagesRead: this.currentPage + 1,
      totalPages: this.getTotalPages()
    };
  }

  /**
   * Check if story is complete
   */
  isStoryComplete() {
    return this.progress === 100;
  }

  /**
   * Reset story
   */
  resetStory() {
    this.currentPage = 0;
    this.progress = 0;
    this.highlightedWord = '';
    this.interactions = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.saveToStorage();
  }

  /**
   * Get word position in text
   */
  getWordPositions(text) {
    const words = text.split(' ');
    let position = 0;
    return words.map((word) => {
      const start = position;
      const end = position + word.length;
      position = end + 1; // +1 for space
      return { word, start, end };
    });
  }

  /**
   * Get vocabulary words from story
   */
  getVocabulary() {
    if (!this.currentStory) return [];
    return this.currentStory.vocabulary || [];
  }

  /**
   * Get comprehension questions
   */
  getComprehensionQuestions() {
    if (!this.currentStory) return [];
    return this.currentStory.comprehension || [];
  }

  /**
   * Get sequencing events
   */
  getSequencingEvents() {
    if (!this.currentStory) return [];
    return this.currentStory.sequencing || [];
  }

  /**
   * Get characters
   */
  getCharacters() {
    if (!this.currentStory) return [];
    return this.currentStory.characters || [];
  }

  /**
   * Check if story has audio
   */
  hasAudio() {
    // In production, check if audio files exist
    return true;
  }

  /**
   * Get reading level
   */
  getReadingLevel() {
    if (!this.currentStory) return 1;
    return this.currentStory.level || 1;
  }
}

// Singleton instance
const storyEngine = new StoryEngine();
export default storyEngine;