/**
 * GamificationService - XP, levels, coins, badges, streaks, and rewards
 */
import { StorageService } from './StorageService';
import { findReward, resolveAvatarId } from '../data/rewardCatalog';

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
  // Music Badges
  { id: 'first_song', name: 'First Song', icon: '🎵', description: 'Listen to your first song', xpReward: 50 },
  { id: 'singer_star', name: 'Singer Star', icon: '🎤', description: 'Sing 5 songs', xpReward: 100 },
  { id: 'karaoke_king', name: 'Karaoke King', icon: '👑', description: 'Complete karaoke for 3 songs', xpReward: 150 },
  { id: 'recording_artist', name: 'Recording Artist', icon: '🎙️', description: 'Record your voice singing', xpReward: 75 },
  { id: 'music_collector', name: 'Music Collector', icon: '📚', description: 'Listen to 10 different songs', xpReward: 200 },
  { id: 'daily_singer', name: 'Daily Singer', icon: '📅', description: 'Sing for 7 days in a row', xpReward: 300 },
  { id: 'vocab_star', name: 'Vocabulary Star', icon: '📖', description: 'Learn 20 words from songs', xpReward: 150 },
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
  static normalizeChildId(childId) {
    return String(childId ?? '').trim().toLowerCase();
  }

  /** Load, mutate once, and save once so helper rewards are never overwritten. */
  static _apply(childId, mutator) {
    const id = this.normalizeChildId(childId);
    const state = this.getState(id);
    const result = mutator(state);
    this.saveState(id, state);
    return { state, result };
  }

  static _awardXP(state, amount) {
    state.xp += amount;
    const newLevel = this.getLevel(state.xp);
    const leveledUp = newLevel > state.level;
    state.level = newLevel;
    if (leveledUp) state.coins += newLevel * 10;
    return { leveledUp, newLevel, totalXP: state.xp };
  }

  static _awardCoins(state, amount) {
    state.coins += amount;
    return state.coins;
  }

  static _awardBadge(state, badgeId) {
    if (state.badges.find(b => b.id === badgeId)) return false;
    const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!badgeDef) return false;

    state.badges.push({ id: badgeId, earnedAt: new Date().toISOString() });
    this._awardXP(state, badgeDef.xpReward);
    return true;
  }

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

  static getState(childId) {
    const id = this.normalizeChildId(childId);
    const allStates = StorageService.get(GAMIFICATION_KEY, {});
    if (!allStates[id]) {
      allStates[id] = this.getDefaultState();
      StorageService.set(GAMIFICATION_KEY, allStates);
    }
    return allStates[id];
  }

  static saveState(childId, state) {
    const id = this.normalizeChildId(childId);
    const allStates = StorageService.get(GAMIFICATION_KEY, {});
    allStates[id] = state;
    StorageService.set(GAMIFICATION_KEY, allStates);
  }

  static getLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
      if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  }

  static getXPForNextLevel(level) {
    if (level >= LEVEL_THRESHOLDS.length) return Infinity;
    return LEVEL_THRESHOLDS[level];
  }

  static getLevelProgress(xp) {
    const level = this.getLevel(xp);
    const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXP = LEVEL_THRESHOLDS[level] || currentLevelXP + 1000;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  static addXP(childId, amount, _reason = '') {
    return this._apply(childId, state => this._awardXP(state, amount)).result;
  }

  static addCoins(childId, amount) {
    return this._apply(childId, state => this._awardCoins(state, amount)).result;
  }

  static spendCoins(childId, amount) {
    const id = this.normalizeChildId(childId);
    const state = this.getState(id);
    if (state.coins < amount) return false;
    state.coins -= amount;
    this.saveState(id, state);
    return true;
  }

  static addBadge(childId, badgeId) {
    return this._apply(childId, state => this._awardBadge(state, badgeId)).result;
  }

  static recordCorrectAnswer(childId) {
    this._apply(childId, state => {
      state.totalCorrectAnswers += 1;
      state.totalAnswers += 1;
      state.stars += 1;
      this._awardXP(state, 10);
    });
  }

  static recordIncorrectAnswer(childId) {
    this._apply(childId, state => {
      state.totalAnswers += 1;
      this._awardXP(state, 2);
    });
  }

  static completeLesson(childId, score) {
    const xpGained = Math.round(50 + (score / 100) * 50);
    const coinsGained = Math.round(5 + (score / 100) * 10);
    const { state } = this._apply(childId, current => {
      current.lessonsCompleted += 1;
      this._awardXP(current, xpGained);
      if (score === 100) this._awardBadge(current, 'perfectionist');
      this._awardCoins(current, coinsGained);
    });
    return { xpGained, lessonsCompleted: state.lessonsCompleted };
  }

  static playGame(childId) {
    const { state } = this._apply(childId, current => {
      current.gamesPlayed += 1;
      this._awardXP(current, 20);
      this._awardCoins(current, 5);
      if (current.gamesPlayed >= 10) this._awardBadge(current, 'game_champion');
    });
    return state.gamesPlayed;
  }

  static claimDailyReward(childId) {
    const today = new Date().toISOString().split('T')[0];
    return this._apply(childId, state => {
      if (state.lastDailyRewardDate) {
        const diff = (new Date(today) - new Date(state.lastDailyRewardDate)) / (1000 * 60 * 60 * 24);
        if (diff > 1) {
          state.dailyRewardDay = 0;
          state.currentStreak = 0;
        }
      }

      state.dailyRewardDay = (state.dailyRewardDay % 7) + 1;
      const reward = DAILY_REWARDS.find(r => r.day === state.dailyRewardDay) || DAILY_REWARDS[0];
      const xpGained = reward.xp + state.currentStreak * 5;
      state.coins += reward.coins;
      state.lastDailyRewardDate = today;
      state.dailyRewardClaimed = true;
      state.currentStreak += 1;
      if (state.currentStreak > state.longestStreak) state.longestStreak = state.currentStreak;

      if (state.currentStreak >= 3) this._awardBadge(state, 'streak_3');
      if (state.currentStreak >= 7) this._awardBadge(state, 'streak_7');
      if (state.currentStreak >= 30) this._awardBadge(state, 'streak_30');
      this._awardXP(state, xpGained);

      return { day: state.dailyRewardDay, coins: reward.coins, xp: xpGained, streak: state.currentStreak };
    }).result;
  }

  static unlockAvatar(childId, avatarId) {
    const reward = findReward(avatarId);
    if (!reward || reward.type !== 'avatar') return { success: false, reason: 'Invalid avatar' };

    const id = resolveAvatarId(avatarId);
    return this._apply(childId, state => {
      const unlocked = Array.isArray(state.unlockedAvatars) ? state.unlockedAvatars : [];
      if (unlocked.includes(id)) return { success: false, reason: 'Already unlocked' };
      state.unlockedAvatars = [...unlocked, id];
      return { success: true, id };
    }).result;
  }

  static generateDailyChallenges() {
    return [
      { id: 'dc_1', description: 'Answer 5 questions correctly', icon: '✅', target: 5, progress: 0, xpReward: 50 },
      { id: 'dc_2', description: 'Complete 2 lessons', icon: '📚', target: 2, progress: 0, xpReward: 80 },
      { id: 'dc_3', description: 'Play 1 game', icon: '🎮', target: 1, progress: 0, xpReward: 30 },
      { id: 'dc_4', description: 'Read 1 story', icon: '📖', target: 1, progress: 0, xpReward: 60 },
    ];
  }

  static generateWeeklyMissions() {
    return [
      { id: 'wm_1', description: 'Complete 10 lessons this week', icon: '🏅', target: 10, progress: 0, xpReward: 300, coinsReward: 100 },
      { id: 'wm_2', description: 'Earn 3 badges', icon: '🎖️', target: 3, progress: 0, xpReward: 200, coinsReward: 50 },
      { id: 'wm_3', description: 'Maintain a 5-day streak', icon: '🔥', target: 5, progress: 0, xpReward: 500, coinsReward: 200 },
    ];
  }

  static updateDailyChallenge(childId, challengeId, increment = 1) {
    return this._apply(childId, state => {
      const challenge = state.dailyChallenges.find(c => c.id === challengeId);
      if (!challenge || challenge.progress >= challenge.target) return null;
      challenge.progress = Math.min(challenge.target, challenge.progress + increment);
      if (challenge.progress >= challenge.target) {
        this._awardXP(state, challenge.xpReward);
        this._awardCoins(state, Math.round(challenge.xpReward / 2));
      }
      return challenge;
    }).result;
  }

  static updateWeeklyMission(childId, missionId, increment = 1) {
    return this._apply(childId, state => {
      const mission = state.weeklyMissions.find(m => m.id === missionId);
      if (!mission || mission.progress >= mission.target) return null;
      mission.progress = Math.min(mission.target, mission.progress + increment);
      if (mission.progress >= mission.target) {
        this._awardXP(state, mission.xpReward);
        this._awardCoins(state, mission.coinsReward);
      }
      return mission;
    }).result;
  }

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

  static checkDailyReset(childId) {
    const id = this.normalizeChildId(childId);
    const state = this.getState(id);
    const today = new Date().toISOString().split('T')[0];
    if (state.lastDailyRewardDate !== today) {
      state.dailyRewardClaimed = false;
      state.dailyChallenges = this.generateDailyChallenges();
      this.saveState(id, state);
    }
    return state;
  }

  static toggleConfetti(childId) {
    return this._apply(childId, state => {
      state.confettiEnabled = !state.confettiEnabled;
      return state.confettiEnabled;
    }).result;
  }

  static toggleSoundEffects(childId) {
    return this._apply(childId, state => {
      state.soundEffectsEnabled = !state.soundEffectsEnabled;
      return state.soundEffectsEnabled;
    }).result;
  }
}

export default GamificationService;
