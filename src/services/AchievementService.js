/**
 * Achievement System 2.0 - Extended gamification and badges
 * Tracks achievements beyond basic stars
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';

const ACHIEVEMENTS_KEY = 'makenna_achievements';

const ACHIEVEMENT_TYPES = {
  LEARNING: 'learning',
  MASTERY: 'mastery',
  CONSISTENCY: 'consistency',
  EXPLORER: 'explorer',
  SOCIAL: 'social',
  CREATIVE: 'creative'
};

const BADGES = [
  { id: 'first-letter', name: 'First Letter', type: ACHIEVEMENT_TYPES.LEARNING, icon: '🔤', requirement: { letters: 1 } },
  { id: 'alphabet-master', name: 'Alphabet Master', type: ACHIEVEMENT_TYPES.MASTERY, icon: '🏆', requirement: { lettersMastered: 26 } },
  { id: 'number-wizard', name: 'Number Wizard', type: ACHIEVEMENT_TYPES.MASTERY, icon: '🔢', requirement: { numbersMastered: 10 } },
  { id: 'streak-3', name: '3 Day Streak', type: ACHIEVEMENT_TYPES.CONSISTENCY, icon: '🔥', requirement: { streak: 3 } },
  { id: 'streak-7', name: 'Week Warrior', type: ACHIEVEMENT_TYPES.CONSISTENCY, icon: '⚡', requirement: { streak: 7 } },
  { id: 'streak-30', name: 'Monthly Star', type: ACHIEVEMENT_TYPES.CONSISTENCY, icon: '⭐', requirement: { streak: 30 } },
  { id: 'story-reader', name: 'Story Reader', type: ACHIEVEMENT_TYPES.EXPLORER, icon: '📖', requirement: { storiesRead: 5 } },
  { id: 'game-champion', name: 'Game Champion', type: ACHIEVEMENT_TYPES.SOCIAL, icon: '🎮', requirement: { gamesPlayed: 10 } },
  { id: 'perfect-score', name: 'Perfect Score', type: ACHIEVEMENT_TYPES.CREATIVE, icon: '💯', requirement: { perfectScores: 5 } },
  { id: 'creative-draw', name: 'Creative Drawer', type: ACHIEVEMENT_TYPES.CREATIVE, icon: '🎨', requirement: { drawings: 10 } }
];

export class AchievementService {
  /**
   * Get all available badges
   */
  static getAllBadges() {
    return BADGES;
  }

  /**
   * Get earned badges for child
   */
  static getEarnedBadges(childId) {
    return StorageService.get(`${ACHIEVEMENTS_KEY}_${childId}`, []);
  }

  /**
   * Check for new achievements
   */
  static checkAchievements(childId, progress) {
    const earned = this.getEarnedBadges(childId);
    const newAchievements = [];

    BADGES.forEach(badge => {
      if (earned.includes(badge.id)) return;

      const req = badge.requirement;
      let unlocked = false;

      if (req.letters && progress.lettersMastered >= req.letters) unlocked = true;
      if (req.lettersMastered && progress.lettersMastered >= req.lettersMastered) unlocked = true;
      if (req.numbersMastered && progress.numbersMastered >= req.numbersMastered) unlocked = true;
      if (req.streak && progress.streaks?.current >= req.streak) unlocked = true;
      if (req.storiesRead && progress.storiesRead >= req.storiesRead) unlocked = true;
      if (req.gamesPlayed && progress.gamesPlayed >= req.gamesPlayed) unlocked = true;
      if (req.perfectScores && progress.perfectScores >= req.perfectScores) unlocked = true;
      if (req.drawings && progress.drawings >= req.drawings) unlocked = true;

      if (unlocked) {
        earned.push(badge.id);
        newAchievements.push(badge);
      }
    });

    StorageService.set(`${ACHIEVEMENTS_KEY}_${childId}`, earned);
    return newAchievements;
  }

  /**
   * Get badge by ID
   */
  static getBadge(badgeId) {
    return BADGES.find(b => b.id === badgeId);
  }

  /**
   * Get badges by type
   */
  static getBadgesByType(type) {
    return BADGES.filter(b => b.type === type);
  }

  /**
   * Get achievement progress for all badges
   */
  static getProgress(childId, progress) {
    const earned = this.getEarnedBadges(childId);
    return BADGES.map(badge => ({
      ...badge,
      earned: earned.includes(badge.id),
      progress: this.calculateBadgeProgress(badge, progress)
    }));
  }

  /**
   * Calculate progress percentage for a badge
   */
  static calculateBadgeProgress(badge, progress) {
    const req = badge.requirement;
    let current = 0;
    let target = 1;

    if (req.letters) { current = progress.lettersMastered; target = req.letters; }
    if (req.lettersMastered) { current = progress.lettersMastered; target = req.lettersMastered; }
    if (req.numbersMastered) { current = progress.numbersMastered; target = req.numbersMastered; }
    if (req.streak) { current = progress.streaks?.current || 0; target = req.streak; }

    return Math.min(100, Math.round((current / target) * 100));
  }

  /**
   * Get total achievement stats
   */
  static getStats(childId) {
    const earned = this.getEarnedBadges(childId);
    return {
      total: BADGES.length,
      earned: earned.length,
      percentage: Math.round((earned.length / BADGES.length) * 100)
    };
  }
}