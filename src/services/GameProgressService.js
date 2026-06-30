/**
 * Game Progress Service - Track game progress and achievements
 */

export class GameProgressService {
  constructor() {
    this.progress = {};
    this.achievements = {};
    this.stats = {};
    this.loadFromStorage();
  }

  /**
   * Load progress from localStorage
   */
  loadFromStorage() {
    try {
      const progress = localStorage.getItem('game_progress');
      if (progress) this.progress = JSON.parse(progress);
      
      const achievements = localStorage.getItem('game_achievements');
      if (achievements) this.achievements = JSON.parse(achievements);
      
      const stats = localStorage.getItem('game_stats');
      if (stats) this.stats = JSON.parse(stats);
    } catch (error) {
      console.warn('Failed to load game progress:', error);
    }
  }

  /**
   * Save progress to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('game_progress', JSON.stringify(this.progress));
      localStorage.setItem('game_achievements', JSON.stringify(this.achievements));
      localStorage.setItem('game_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save game progress:', error);
    }
  }

  /**
   * Record game progress
   */
  recordProgress(gameId, data) {
    if (!this.progress[gameId]) {
      this.progress[gameId] = {
        plays: 0,
        completed: 0,
        bestScore: 0,
        bestStars: 0,
        totalTime: 0,
        lastPlayed: null,
        levels: {}
      };
    }
    
    const game = this.progress[gameId];
    game.plays++;
    game.totalTime += data.time || 0;
    game.lastPlayed = new Date().toISOString();
    
    if (data.completed) {
      game.completed++;
    }
    
    if (data.score && data.score > game.bestScore) {
      game.bestScore = data.score;
    }
    
    if (data.stars && data.stars > game.bestStars) {
      game.bestStars = data.stars;
    }
    
    if (data.level) {
      if (!game.levels[data.level]) {
        game.levels[data.level] = { completed: false, bestScore: 0 };
      }
      if (data.completed) {
        game.levels[data.level].completed = true;
      }
      if (data.score && data.score > game.levels[data.level].bestScore) {
        game.levels[data.level].bestScore = data.score;
      }
    }
    
    this.saveToStorage();
    this.checkAchievements(gameId, data);
    this.updateStats(data);
  }

  /**
   * Check and unlock achievements
   */
  checkAchievements(gameId, data) {
    const achievements = {
      'first_game': {
        id: 'first_game',
        title: 'First Adventure!',
        description: 'Play your first game',
        icon: '🌟',
        unlocked: false
      },
      'perfect_score': {
        id: 'perfect_score',
        title: 'Perfect!',
        description: 'Get a perfect score in any game',
        icon: '⭐',
        unlocked: false
      },
      'star_collector': {
        id: 'star_collector',
        title: 'Star Collector',
        description: 'Collect 100 stars',
        icon: '✨',
        unlocked: false
      },
      'game_master': {
        id: 'game_master',
        title: 'Game Master',
        description: 'Complete 10 games',
        icon: '🏆',
        unlocked: false
      },
      'daily_player': {
        id: 'daily_player',
        title: 'Daily Player',
        description: 'Play games for 7 days in a row',
        icon: '📅',
        unlocked: false
      }
    };
    
    // Check conditions
    const totalPlays = this.getTotalPlays();
    const totalStars = this.getTotalStars();
    const completedGames = this.getCompletedGames();
    const streak = this.getStreak();
    
    if (totalPlays >= 1 && !this.achievements.first_game) {
      this.achievements.first_game = achievements.first_game;
      this.achievements.first_game.unlocked = true;
      this.achievements.first_game.unlockedAt = new Date().toISOString();
    }
    
    if (data.score === 100 && !this.achievements.perfect_score) {
      this.achievements.perfect_score = achievements.perfect_score;
      this.achievements.perfect_score.unlocked = true;
      this.achievements.perfect_score.unlockedAt = new Date().toISOString();
    }
    
    if (totalStars >= 100 && !this.achievements.star_collector) {
      this.achievements.star_collector = achievements.star_collector;
      this.achievements.star_collector.unlocked = true;
      this.achievements.star_collector.unlockedAt = new Date().toISOString();
    }
    
    if (completedGames >= 10 && !this.achievements.game_master) {
      this.achievements.game_master = achievements.game_master;
      this.achievements.game_master.unlocked = true;
      this.achievements.game_master.unlockedAt = new Date().toISOString();
    }
    
    if (streak >= 7 && !this.achievements.daily_player) {
      this.achievements.daily_player = achievements.daily_player;
      this.achievements.daily_player.unlocked = true;
      this.achievements.daily_player.unlockedAt = new Date().toISOString();
    }
    
    this.saveToStorage();
  }

  /**
   * Update global stats
   */
  updateStats(data) {
    if (!this.stats.totalGames) {
      this.stats = {
        totalGames: 0,
        totalStars: 0,
        totalScore: 0,
        totalTime: 0,
        bestGame: { gameId: null, score: 0 },
        lastPlayed: null,
        dailyStreak: 0,
        lastPlayDate: null
      };
    }
    
    this.stats.totalGames++;
    this.stats.totalStars += data.stars || 0;
    this.stats.totalScore += data.score || 0;
    this.stats.totalTime += data.time || 0;
    this.stats.lastPlayed = new Date().toISOString();
    
    // Check best game
    if (data.score && data.score > this.stats.bestGame.score) {
      this.stats.bestGame = { gameId: data.gameId, score: data.score };
    }
    
    // Update streak
    const today = new Date().toDateString();
    if (this.stats.lastPlayDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (this.stats.lastPlayDate === yesterdayStr) {
        this.stats.dailyStreak++;
      } else {
        this.stats.dailyStreak = 1;
      }
      this.stats.lastPlayDate = today;
    }
    
    this.saveToStorage();
  }

  /**
   * Get progress for a game
   */
  getGameProgress(gameId) {
    return this.progress[gameId] || null;
  }

  /**
   * Get all progress
   */
  getAllProgress() {
    return this.progress;
  }

  /**
   * Get unlocked achievements
   */
  getAchievements() {
    return Object.values(this.achievements).filter(a => a.unlocked);
  }

  /**
   * Get all achievements
   */
  getAllAchievements() {
    return this.achievements;
  }

  /**
   * Get stats
   */
  getStats() {
    return this.stats;
  }

  /**
   * Get total plays
   */
  getTotalPlays() {
    let total = 0;
    for (const gameId in this.progress) {
      total += this.progress[gameId].plays || 0;
    }
    return total;
  }

  /**
   * Get total stars
   */
  getTotalStars() {
    return this.stats.totalStars || 0;
  }

  /**
   * Get completed games count
   */
  getCompletedGames() {
    let completed = 0;
    for (const gameId in this.progress) {
      completed += this.progress[gameId].completed || 0;
    }
    return completed;
  }

  /**
   * Get streak
   */
  getStreak() {
    return this.stats.dailyStreak || 0;
  }

  /**
   * Reset progress for a game
   */
  resetGame(gameId) {
    delete this.progress[gameId];
    this.saveToStorage();
  }

  /**
   * Reset all progress
   */
  resetAll() {
    this.progress = {};
    this.achievements = {};
    this.stats = {};
    this.saveToStorage();
  }
}

// Singleton instance
const gameProgressService = new GameProgressService();
export default gameProgressService;