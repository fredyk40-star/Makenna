import readingEngine from './ReadingEngine';

/**
 * Word Builder Service - Manages word building activities
 */

export class WordBuilderService {
  constructor() {
    this.activeBuilds = new Map();
    this.history = new Map();
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('word_builder_data');
      if (data) {
        const parsed = JSON.parse(data);
        this.history = new Map(Object.entries(parsed.history || {}));
      }
    } catch (error) {
      console.warn('Failed to load word builder data:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        history: Object.fromEntries(this.history)
      };
      localStorage.setItem('word_builder_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save word builder data:', error);
    }
  }

  /**
   * Create a new word building activity
   */
  createWordBuild(word, letters) {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Shuffle letters for the activity
    const shuffled = this.shuffleArray([...letters]);
    
    const build = {
      id,
      word,
      letters,
      shuffled,
      completed: false,
      attempts: 0,
      time: 0,
      hints: 0,
      startTime: Date.now(),
      history: []
    };
    
    this.activeBuilds.set(id, build);
    return build;
  }

  /**
   * Submit a letter placement
   */
  submitPlacement(buildId, letterIndex, position) {
    const build = this.activeBuilds.get(buildId);
    if (!build) return null;
    
    const result = {
      correct: false,
      message: '',
      progress: 0
    };
    
    // Check if the letter is in the correct position
    if (build.letters[position] === build.shuffled[letterIndex]) {
      result.correct = true;
      // Remove the placed letter
      build.shuffled[letterIndex] = null;
      
      // Check if all letters are placed
      if (build.shuffled.every(l => l === null)) {
        build.completed = true;
        result.message = 'Word completed! 🌟';
        result.progress = 100;
      } else {
        result.progress = ((build.letters.length - build.shuffled.filter(l => l !== null).length) / build.letters.length) * 100;
        result.message = 'Great placement! Keep going!';
      }
    } else {
      result.message = 'Try another spot! 🤔';
      // Keep current progress when placement is incorrect
      result.progress = ((build.letters.length - build.shuffled.filter(l => l !== null).length) / build.letters.length) * 100;
    }
    
    build.attempts++;
    build.history.push({
      letterIndex,
      position,
      correct: result.correct,
      timestamp: Date.now()
    });
    
    this.saveToStorage();
    return result;
  }

  /**
   * Get a hint for the current build
   */
  getHint(buildId) {
    const build = this.activeBuilds.get(buildId);
    if (!build) return null;
    
    build.hints++;
    
    // Find the first empty position
    const emptyPos = build.shuffled.findIndex(l => l === null);
    if (emptyPos === -1) return null;
    
    // Find the correct letter for this position
    const correctLetter = build.letters[emptyPos];
    const availableLetters = build.shuffled.filter(l => l !== null);
    
    return {
      position: emptyPos,
      letter: correctLetter,
      availableLetters: availableLetters,
      message: `Try putting '${correctLetter}' in position ${emptyPos + 1}!`
    };
  }

  /**
   * Reset a build
   */
  resetBuild(buildId) {
    const build = this.activeBuilds.get(buildId);
    if (!build) return null;
    
    build.shuffled = this.shuffleArray([...build.letters]);
    build.completed = false;
    build.attempts = 0;
    build.history = [];
    build.startTime = Date.now();
    
    this.saveToStorage();
    return build;
  }

  /**
   * Get build progress
   */
  getBuildProgress(buildId) {
    const build = this.activeBuilds.get(buildId);
    if (!build) return 0;
    
    const placed = build.letters.length - build.shuffled.filter(l => l !== null).length;
    return (placed / build.letters.length) * 100;
  }

  /**
   * Check if build is complete
   */
  isBuildComplete(buildId) {
    const build = this.activeBuilds.get(buildId);
    return build ? build.completed : false;
  }

  /**
   * Get build statistics
   */
  getBuildStats(buildId) {
    const build = this.activeBuilds.get(buildId);
    if (!build) return null;
    
    return {
      id: build.id,
      word: build.word,
      attempts: build.attempts,
      hints: build.hints,
      time: Math.floor((Date.now() - build.startTime) / 1000),
      completed: build.completed,
      history: build.history
    };
  }

  /**
   * Get word building history for a user
   */
  getHistory() {
    return Object.fromEntries(this.history);
  }

  /**
   * Record completed build
   */
  recordCompletion(buildId) {
    const build = this.activeBuilds.get(buildId);
    if (!build) return null;
    
    const stats = this.getBuildStats(buildId);
    if (!this.history.has(build.word)) {
      this.history.set(build.word, {
        word: build.word,
        attempts: 0,
        completions: 0,
        bestTime: Infinity,
        firstAttempt: Date.now()
      });
    }
    
    const record = this.history.get(build.word);
    record.attempts += build.attempts;
    record.completions++;
    if (stats.time < record.bestTime) {
      record.bestTime = stats.time;
    }
    
    this.saveToStorage();
    return stats;
  }

  /**
   * Utility: Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get recommended words for building
   */
  getRecommendedWords(level = 'easy') {
    const allWords = [];
    const families = Object.values(readingEngine.wordFamilies);
    
    for (const family of families) {
      for (const word of family.words) {
        const difficulty = readingEngine.getWordDifficulty(word);
        if (difficulty === level || level === 'all') {
          allWords.push(word);
        }
      }
    }
    
    return allWords.slice(0, 20);
  }
}

// Singleton instance
const wordBuilderService = new WordBuilderService();
export default wordBuilderService;