/**
 * Game Engine - Core game framework for all educational games
 * Reusable across Alphabet, Numbers, Animals, and more
 */

export class GameEngine {
  constructor(config = {}) {
    this.state = {
      score: 0,
      stars: 0,
      lives: config.lives || 3,
      level: 1,
      progress: 0,
      time: 0,
      isPaused: false,
      isComplete: false,
      attempts: 0,
      correct: 0,
      incorrect: 0,
      combo: 0,
      maxCombo: 0
    };
    
    this.settings = {
      difficulty: config.difficulty || 'medium',
      timerEnabled: config.timerEnabled || false,
      timeLimit: config.timeLimit || 60,
      hintsEnabled: config.hintsEnabled || true,
      adaptiveLearning: config.adaptiveLearning || true,
      soundEnabled: config.soundEnabled !== undefined ? config.soundEnabled : true,
      celebrationEnabled: config.celebrationEnabled !== undefined ? config.celebrationEnabled : true
    };
    
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.history = [];
    this.timer = null;
    this.listeners = new Map();
    this.mascotMessages = [];
    
    // Initialize mascot messages
    this.initMascotMessages();
  }

  /**
   * Initialize mascot messages
   */
  initMascotMessages() {
    this.mascotMessages = {
      correct: [
        "Fantastic! 🌟",
        "You're amazing! ⭐",
        "Great job! 🎉",
        "You did it! ✨",
        "Wonderful! 💫",
        "Excellent! 🏆",
        "Brilliant! 🌈",
        "You're a star! 🌟"
      ],
      incorrect: [
        "Good try! Keep going! 💪",
        "Almost there! Try again! 🤔",
        "You've got this! 🎯",
        "Practice makes perfect! 📚",
        "Don't give up! 🌟",
        "Let's try another one! 🔄"
      ],
      welcome: [
        "Let's play! 🎮",
        "Ready for an adventure! 🚀",
        "Learning is fun! 📚",
        "You can do it! 💪"
      ],
      complete: [
        "You're a champion! 🏆",
        "Amazing work! 🌟",
        "You're the best! ⭐",
        "Fantastic job! 🎉"
      ],
      hint: [
        "Try looking for the letter! 🔍",
        "Listen carefully! 👂",
        "You're close! Keep going! 🎯",
        "Think about the sound! 🔤"
      ]
    };
  }

  /**
   * Initialize game with questions
   */
  init(questions) {
    this.questions = this.shuffleArray([...questions]);
    this.currentQuestionIndex = 0;
    this.state.progress = 0;
    this.state.score = 0;
    this.state.attempts = 0;
    this.state.correct = 0;
    this.state.incorrect = 0;
    this.state.combo = 0;
    this.state.isComplete = false;
    this.history = [];
    
    this.emit('init', { questions: this.questions });
    this.startTimer();
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (this.currentQuestionIndex < this.questions.length) {
      return this.questions[this.currentQuestionIndex];
    }
    return null;
  }

  /**
   * Submit answer
   */
  submitAnswer(answer) {
    const question = this.getCurrentQuestion();
    if (!question) return null;

    const isCorrect = this.validateAnswer(question, answer);
    this.state.attempts++;
    
    if (isCorrect) {
      this.state.correct++;
      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }
      this.state.score += this.calculateScore(question);
      this.state.stars += this.calculateStars(question);
    } else {
      this.state.incorrect++;
      this.state.combo = 0;
      if (this.settings.adaptiveLearning) {
        this.adaptDifficulty(question);
      }
    }

    this.history.push({
      question: question.id || question.question,
      answer,
      isCorrect,
      time: this.state.time,
      timestamp: Date.now()
    });

    this.updateProgress();
    this.emit('answer', { isCorrect, question, answer, state: this.state });

    if (this.state.progress >= 100) {
      this.completeGame();
    }

    return { isCorrect, state: this.state, message: this.getMascotMessage(isCorrect) };
  }

  /**
   * Validate answer (override in subclasses)
   */
  validateAnswer(question, answer) {
    return question.correctAnswer === answer;
  }

  /**
   * Calculate score for a question
   */
  calculateScore(question) {
    let baseScore = question.difficulty || 10;
    const comboBonus = Math.min(this.state.combo * 2, 20);
    const timeBonus = this.settings.timerEnabled ? Math.max(0, 10 - Math.floor(this.state.time / 10)) : 0;
    return baseScore + comboBonus + timeBonus;
  }

  /**
   * Calculate stars earned
   */
  calculateStars(question) {
    const difficulty = question.difficulty || 10;
    if (difficulty >= 20) return 3;
    if (difficulty >= 15) return 2;
    return 1;
  }

  /**
   * Update game progress
   */
  updateProgress() {
    this.state.progress = (this.currentQuestionIndex / this.questions.length) * 100;
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
    this.emit('progress', this.state.progress);
  }

  /**
   * Complete game
   */
  completeGame() {
    this.state.isComplete = true;
    this.state.progress = 100;
    this.stopTimer();
    this.emit('complete', { state: this.state, history: this.history });
    this.emit('celebrate', { 
      message: this.getMascotMessage('complete'),
      score: this.state.score,
      stars: this.state.stars
    });
  }

  /**
   * Adapt difficulty based on performance
   */
  adaptDifficulty(question) {
    const incorrectRate = this.state.incorrect / Math.max(1, this.state.attempts);
    
    if (incorrectRate > 0.6) {
      // Too difficult - move to easier questions
      this.settings.difficulty = 'easy';
      this.emit('difficultyChange', { difficulty: 'easy', reason: 'too difficult' });
    } else if (incorrectRate < 0.2 && this.state.attempts > 5) {
      // Too easy - increase difficulty
      if (this.settings.difficulty === 'easy') {
        this.settings.difficulty = 'medium';
      } else if (this.settings.difficulty === 'medium') {
        this.settings.difficulty = 'hard';
      }
      this.emit('difficultyChange', { difficulty: this.settings.difficulty, reason: 'too easy' });
    }
  }

  /**
   * Get mascot message
   */
  getMascotMessage(type) {
    const messages = this.mascotMessages[type] || this.mascotMessages.welcome;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Timer management
   */
  startTimer() {
    if (!this.settings.timerEnabled) return;
    this.stopTimer();
    this.state.time = 0;
    this.timer = setInterval(() => {
      if (!this.state.isPaused) {
        this.state.time++;
        this.emit('tick', this.state.time);
        
        if (this.state.time >= this.settings.timeLimit) {
          this.completeGame();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Pause game
   */
  pause() {
    this.state.isPaused = true;
    this.emit('pause', this.state);
  }

  /**
   * Resume game
   */
  resume() {
    this.state.isPaused = false;
    this.emit('resume', this.state);
  }

  /**
   * Restart game
   */
  restart() {
    this.stopTimer();
    this.state = {
      ...this.state,
      score: 0,
      stars: 0,
      progress: 0,
      time: 0,
      isPaused: false,
      isComplete: false,
      attempts: 0,
      correct: 0,
      incorrect: 0,
      combo: 0,
      maxCombo: 0
    };
    this.currentQuestionIndex = 0;
    this.history = [];
    this.questions = this.shuffleArray([...this.questions]);
    this.startTimer();
    this.emit('restart', this.state);
  }

  /**
   * Use hint
   */
  useHint() {
    if (!this.settings.hintsEnabled) return null;
    const question = this.getCurrentQuestion();
    if (!question) return null;
    
    const hint = question.hint || this.getMascotMessage('hint');
    this.state.score = Math.max(0, this.state.score - 5);
    this.emit('hint', { hint, score: this.state.score });
    return hint;
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Utility methods
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
   * Get game state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.emit('settingsUpdate', this.settings);
  }

  /**
   * Clean up
   */
  dispose() {
    this.stopTimer();
    this.listeners.clear();
  }
}