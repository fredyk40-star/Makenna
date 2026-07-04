/**
 * GamificationService - XP, levels, coins, badges, streaks, and rewards
 */
import { StorageService } from './StorageService';

const GAMIFICATION_KEY = 'makenna_gamification_state';

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000,
  5000, 6200, 7500, 9000, 11000, 13000, 15500, 18000, 21000, 25000,
];

const DAILY_REWARDS = [
  { day: 1, coins: 10, xp: 20 },
  { day: 2, coins: 15, xp: 30 },
  { day: 3, coins: 20, xp: 40 },
  { day: 4, coins: 25, xp: 50 },
  { day: 5, coins: 30, xp: 60 },
  { day: 6, coins: 35, xp: 70 },
  { day: 7, coins: 100, xp: 200 }, // Weekly bonus
];

export const BADGE_DEFINITIONS = [
  { id: 'first_lesson', name: 'First Lesson', icon: '🌟', description: 'Complete your first lesson', xpReward: 50 },
  { id: 'star_learner', name: 'Star Learner', icon: '⭐', description: 'Get 10 correct answers in a row', xpReward: 100 },
  { id: 'math_whiz', name: 'Math Whiz', icon: '🧮', description: 'Complete 5 math lessons', xpReward: 150 },
  { id: 'reading_buddy', name: 'Reading Buddy', icon: '📖', description: 'Read 3 stories', xpReward: 150 },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', description: 'Log in for 3 days in a row', xpReward: 100 },
  { id: 'streak_7', name: '7-Day Streak', icon: '🔥', description: 'Log in for 7 days in a row', xpReward: 300 },
  { id: 'streak_30', name: 'Monthly Warrior', icon: '💪', description: 'Log in for 30 days in a row', xpReward: 1000 },
  { id: 'perfectionist', name: 'Perfectionist', icon: '💯', description: 'Get 100% on any lesson', xpReward: 200 },
  { id: 'explorer', name: 'Explorer', icon: '🗺️', description: 'Visit all learning areas', xpReward: 250 },
  { id: 'game_champion', name: 'Game Champion', icon: '🏆', description: 'Win 10 games', xpReward: 200 },
  { id: 'tracing_master', name: 'Tracing Master', icon: '✏️', description: 'Complete all tracing activities', xpReward: 300 },
  { id: 'alphabet_squad', name: 'Alphabet Squad', icon: '🔤', description: 'Learn all letters', xpReward: 400 },
  { id: 'number_ninja', name: 'Number Ninja', icon: '🔢', description: 'Master numbers 1-20', xpReward: 400 },
  { id: 'coloring_artist', name: 'Coloring Artist', icon: '🎨', description: 'Complete all colour lessons', xpReward: 200 },
  { id: 'shape_sorter', name: 'Shape Sorter', icon: '🔷', description: 'Identify all shapes', xpReward: 200 },
  { id: 'bible_scholar', name: 'Bible Scholar', icon: '📜', description: 'Read 5 Bible stories', xpReward: 300 },
  { id: 'ghana_explorer', name: 'Ghana Explorer', icon: '🇬🇭', description: 'Complete Ghana exploration', xpReward: 350 },
  { id: 'science_fan', name: 'Science Fan', icon: '🔬', description: 'Complete all science experiments', xpReward: 300 },
  { id: 'quick_learner', name: 'Quick Learner', icon: '⚡', description: 'Complete a lesson in under 2 minutes', xpReward: 100 },
  { id: 'helpful_friend', name: 'Helpful Friend', icon: '🤝', description: 'Use voice guide to help someone', xpReward: 50 },
];

export const AVATAR_UNLOCKS = [
  { id: 'star', name: 'Star Avatar', icon: '⭐', levelRequired: 2, coinsRequired: 50 },
  { id: 'rocket', name: 'Rocket Avatar', icon: '🚀', levelRequired: 3, coinsRequired: 100 },
  { id: 'unicorn', name: 'Unicorn Avatar', icon: '🦄', levelRequired: 5, coinsRequired: 200 },
  { id: 'dragon', name: 'Dragon Avatar', icon: '🐉', levelRequired: 8, coinsRequired: 500 },
  { id: 'wizard', name: 'Wizard Avatar', icon: '🧙', levelRequired: 10, coinsRequired: 800 },
  { id: 'ninja', name: 'Ninja Avatar', icon: '🥷', levelRequired: 12, coinsRequired: 1200 },
  { id: 'pirate', name: 'Pirate Avatar', icon: '🏴‍☠️', levelRequired: 15, coinsRequired: 2000 },
  { id: 'princess', name: 'Princess Avatar', icon: '👸', levelRequired: 18, coinsRequired: 3000 },
];

export class GamificationService {
  /**
   * Get default state for a new child
   */
  static getDefaultState() {
    return {
      xp: 0,
      coins: 0,
      stars: 0,
      level: 1,
      badges: [],
      unlockedAvatars: ['default'],
      dailyRewardClaimed: false,
      dailyRewardDay: 0,
      lastDailyRewardDate: null,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalCorrectAnswers: 0,
      totalAnswers: 0,
      lessonsCompleted: 0,
      gamesPlayed: 0,
      treasureChestOpened: false,
      weeklyMissions: this.generateWeeklyMissions(),
      dailyChallenges: this.generateDailyChallenges(),
      confettiEnabled: true,
      soundEffectsEnabled: true,
    };
  }

  /**
   * Get gamification state for a child
   */
  static getState(childId) {
    const allStates = StorageService.get(GAMIFICATION_KEY, {});
    if (!allStates[childId]) {
      allStates[childId] = this.getDefaultState();
      StorageService.set(GAMIFICATION_KEY, allStates);
    }
    return allStates[childId];
  }

  /**
   * Save gamification state for a child
   */
  static saveState(childId, state) {
    const allStates = StorageService.get(GAMIFICATION_KEY, {});
    allStates[childId] = state;
    StorageService.set(GAMIFICATION_KEY, allStates);
  }

  /**
   * Calculate level from XP
   */
  static getLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  }

  /**
   * Get XP needed for next level
   */
  static getXPForNextLevel(level) {
    if (level >= LEVEL_THRESHOLDS.length) return Infinity;
    return LEVEL_THRESHOLDS[level];
  }

  /**
   * Get XP progress within current level
   */
  static getLevelProgress(xp) {
    const level = this.getLevel(xp);
    const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXP = LEVEL_THRESHOLDS[level] || currentLevelXP + 1000;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Add XP to a child
   */
  static addXP(childId, amount, reason = '') {
    const state = this.getState(childId);
    state.xp += amount;
    const newLevel = this.getLevel(state.xp);
    const leveledUp = newLevel > state.level;
    state.level = newLevel;

    if (leveledUp) {
      state.coins += newLevel * 10; // Bonus coins on level up
    }

    this.saveState(childId, state);
    return { leveledUp, newLevel, totalXP: state.xp };
  }

  /**
   * Add coins to a child
   */
  static addCoins(childId, amount) {
    const state = this.getState(childId);
    state.coins += amount;
    this.saveState(childId, state);
    return state.coins;
  }

  /**
   * Spend coins (e.g., on avatar unlocks)
   */
  static spendCoins(childId, amount) {
    const state = this.getState(childId);
    if (state.coins < amount) return false;
    state.coins -= amount;
    this.saveState(childId, state);
    return true;
  }

  /**
   * Add a badge to a child
   */
  static addBadge(childId, badgeId) {
    const state = this.getState(childId);
    if (state.badges.find(b => b.id === badgeId)) return false;

    const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!badgeDef) return false;

    state.badges.push({
      id: badgeId,
      earnedAt: new Date().toISOString(),
    });

    // XP reward for earning badge
    this.addXP(childId, badgeDef.xpReward, `Badge: ${badgeDef.name}`);

    this.saveState(childId, state);
    return true;
  }

  /**
   * Record a correct answer
   */
  static recordCorrectAnswer(childId) {
    const state = this.getState(childId);
    state.totalCorrectAnswers++;
    state.totalAnswers++;
    state.stars += 1;
    this.addXP(childId, 10, 'Correct answer');
    this.saveState(childId, state);
  }

  /**
   * Record an incorrect answer
   */
  static recordIncorrectAnswer(childId) {
    const state = this.getState(childId);
    state.totalAnswers++;
    this.addXP(childId, 2, 'Attempted answer');
    this.saveState(childId, state);
  }

  /**
   * Complete a lesson
   */
  static completeLesson(childId, score) {
    const state = this.getState(childId);
    state.lessonsCompleted++;
    const xpGained = Math.round(50 + (score / 100) * 50);
    this.addXP(childId, xpGained, 'Lesson completed');

    if (score === 100) {
      this.addBadge(childId, 'perfectionist');
    }

    this.addCoins(childId, Math.round(5 + (score / 100) * 10));
    this.saveState(childId, state);
    return { xpGained, lessonsCompleted: state.lessonsCompleted };
  }

  /**
   * Play a game
   */
  static playGame(childId) {
    const state = this.getState(childId);
    state.gamesPlayed++;
    this.addXP(childId, 20, 'Game played');
    this.addCoins(childId, 5);
    this.saveState(childId, state);

    if (state.gamesPlayed >= 10) {
      this.addBadge(childId, 'game_champion');
    }
  }

  /**
   * Claim daily reward
   */
  static claimDailyReward(childId) {
    const state = this.getState(childId);
    const today = new Date().toISOString().split('T')[0];
    const lastDate = state.lastDailyRewardDate;

    // Reset streak if a day was missed
    if (lastDate) {
      const diff = (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
      if (diff > 1) {
        state.dailyRewardDay = 0;
        state.currentStreak = 0;
      }
    }

    state.dailyRewardDay = (state.dailyRewardDay % 7) + 1;
    const reward = DAILY_REWARDS.find(r => r.day === state.dailyRewardDay) || DAILY_REWARDS[0];
    state.coins += reward.coins;
    state.lastDailyRewardDate = today;
    state.dailyRewardClaimed = true;
    state.currentStreak++;

    if (state.currentStreak > state.longestStreak) {
      state.longestStreak = state.currentStreak;
    }

    // Streak badges
    if (state.currentStreak >= 3) this.addBadge(childId, 'streak_3');
    if (state.currentStreak >= 7) this.addBadge(childId, 'streak_7');
    if (state.currentStreak >= 30) this.addBadge(childId, 'streak_30');

    const xpGained = this.addXP(childId, reward.xp + state.currentStreak * 5, 'Daily reward');
    this.saveState(childId, state);

    return { day: state.dailyRewardDay, coins: reward.coins, xp: reward.xp + state.currentStreak * 5, streak: state.currentStreak };
  }

  /**
   * Unlock avatar
   */
  static unlockAvatar(childId, avatarId) {
    const state = this.getState(childId);
    const avatar = AVATAR_UNLOCKS.find(a => a.id === avatarId);
    if (!avatar) return { success: false, reason: 'Invalid avatar' };
    if (state.unlockedAvatars.includes(avatarId)) return { success: false, reason: 'Already unlocked' };
    if (state.level < avatar.levelRequired) return { success: false, reason: 'Level too low' };
    if (state.coins < avatar.coinsRequired) return { success: false, reason: 'Not enough coins' };

    state.coins -= avatar.coinsRequired;
    state.unlockedAvatars.push(avatarId);
    this.saveState(childId, state);
    return { success: true };
  }

  /**
   * Generate daily challenges
   */
  static generateDailyChallenges() {
    const challenges = [
      { id: 'dc_1', description: 'Answer 5 questions correctly', icon: '✅', target: 5, progress: 0, xpReward: 50 },
      { id: 'dc_2', description: 'Complete 2 lessons', icon: '📚', target: 2, progress: 0, xpReward: 80 },
      { id: 'dc_3', description: 'Play 1 game', icon: '🎮', target: 1, progress: 0, xpReward: 30 },
      { id: 'dc_4', description: 'Read 1 story', icon: '📖', target: 1, progress: 0, xpReward: 60 },
    ];
    return challenges;
  }

  /**
   * Generate weekly missions
   */
  static generateWeeklyMissions() {
    const missions = [
      { id: 'wm_1', description: 'Complete 10 lessons this week', icon: '🏅', target: 10, progress: 0, xpReward: 300, coinsReward: 100 },
      { id: 'wm_2', description: 'Earn 3 badges', icon: '🎖️', target: 3, progress: 0, xpReward: 200, coinsReward: 50 },
      { id: 'wm_3', description: 'Maintain a 5-day streak', icon: '🔥', target: 5, progress: 0, xpReward: 500, coinsReward: 200 },
    ];
    return missions;
  }

  /**
   * Update daily challenge progress
   */
  static updateDailyChallenge(childId, challengeId, increment = 1) {
    const state = this.getState(childId);
    const challenge = state.dailyChallenges.find(c => c.id === challengeId);
    if (challenge && challenge.progress < challenge.target) {
      challenge.progress = Math.min(challenge.target, challenge.progress + increment);
      if (challenge.progress >= challenge.target) {
        this.addXP(childId, challenge.xpReward, `Daily challenge: ${challenge.description}`);
        this.addCoins(childId, Math.round(challenge.xpReward / 2));
      }
      this.saveState(childId, state);
      return challenge;
    }
    return null;
  }

  /**
   * Update weekly mission progress
   */
  static updateWeeklyMission(childId, missionId, increment = 1) {
    const state = this.getState(childId);
    const mission = state.weeklyMissions.find(m => m.id === missionId);
    if (mission && mission.progress < mission.target) {
      mission.progress = Math.min(mission.target, mission.progress + increment);
      if (mission.progress >= mission.target) {
        this.addXP(childId, mission.xpReward, `Weekly mission: ${mission.description}`);
        this.addCoins(childId, mission.coinsReward);
      }
      this.saveState(childId, state);
      return mission;
    }
    return null;
  }

  /**
   * Get full gamification summary for display
   */
  static getSummary(childId) {
    const state = this.getState(childId);
    return {
      xp: state.xp,
      coins: state.coins,
      stars: state.stars,
      level: state.level,
      levelProgress: this.getLevelProgress(state.xp),
      xpForNext: this.getXPForNextLevel(state.level),
      badges: state.badges.map(b => {
        const def = BADGE_DEFINITIONS.find(bd => bd.id === b.id);
        return { ...b, name: def?.name || b.id, icon: def?.icon || '🏅', description: def?.description || '' };
      }),
      unlockedAvatars: state.unlockedAvatars.map(id => AVATAR_UNLOCKS.find(a => a.id === id)).filter(Boolean),
      dailyRewardClaimed: state.dailyRewardClaimed,
      dailyRewardDay: state.dailyRewardDay,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lessonsCompleted: state.lessonsCompleted,
      gamesPlayed: state.gamesPlayed,
      dailyChallenges: state.dailyChallenges,
      weeklyMissions: state.weeklyMissions,
      confettiEnabled: state.confettiEnabled,
      soundEffectsEnabled: state.soundEffectsEnabled,
    };
  }

  /**
   * Reset daily claims at midnight
   */
  static checkDailyReset(childId) {
    const state = this.getState(childId);
    const today = new Date().toISOString().split('T')[0];
    const lastDate = state.lastDailyRewardDate;

    if (lastDate !== today) {
      state.dailyRewardClaimed = false;
      // Reset daily challenges
      state.dailyChallenges = this.generateDailyChallenges();
      this.saveState(childId, state);
    }
    return state;
  }

  /**
   * Toggle confetti
   */
  static toggleConfetti(childId) {
    const state = this.getState(childId);
    state.confettiEnabled = !state.confettiEnabled;
    this.saveState(childId, state);
    return state.confettiEnabled;
  }

  /**
   * Toggle sound effects
   */
  static toggleSoundEffects(childId) {
    const state = this.getState(childId);
    state.soundEffectsEnabled = !state.soundEffectsEnabled;
    this.saveState(childId, state);
    return state.soundEffectsEnabled;
  }
}