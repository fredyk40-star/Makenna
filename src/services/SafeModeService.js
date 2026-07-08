/**
 * Child Safe UI Mode Service - Restricts features for safer child experience
 * Limits time, disables certain actions, protects settings
 */
import { StorageService } from './StorageService';

const SAFE_MODE_KEY = 'makenna_safe_mode_settings';
const TIME_LIMIT_KEY = 'makenna_time_limits';

const DEFAULT_SETTINGS = {
  enabled: false,
  dailyLimit: 30, // minutes
  breakInterval: 15, // minutes
  restrictedFeatures: ['settings', 'developer', 'parent-zone'],
  allowedDomains: [],
  safeSearch: true,
  parentalLock: false
};

export class SafeModeService {
  /**
   * Get safe mode settings for a child
   */
  static getSettings(childId) {
    return StorageService.get(`${SAFE_MODE_KEY}_${childId}`, { ...DEFAULT_SETTINGS });
  }

  /**
   * Update settings
   */
  static updateSettings(childId, settings) {
    StorageService.set(`${SAFE_MODE_KEY}_${childId}`, settings);
    return this.getSettings(childId);
  }

  /**
   * Toggle safe mode
   */
  static toggleSafeMode(childId, enabled) {
    const settings = this.getSettings(childId);
    settings.enabled = enabled;
    return this.updateSettings(childId, settings);
  }

  /**
   * Get time limits
   */
  static getTimeLimits(childId) {
    return StorageService.get(`${TIME_LIMIT_KEY}_${childId}`, {
      usedToday: 0,
      lastUsed: new Date().toISOString()
    });
  }

  /**
   * Record usage time
   */
  static recordUsage(childId, minutes) {
    const limits = this.getTimeLimits(childId);
    const today = new Date().toISOString().split('T')[0];
    const lastUsed = limits.lastUsed?.split('T')[0];

    if (lastUsed !== today) {
      limits.usedToday = 0;
    }

    limits.usedToday += minutes;
    limits.lastUsed = new Date().toISOString();
    StorageService.set(`${TIME_LIMIT_KEY}_${childId}`, limits);
    return limits;
  }

  /**
   * Check if time limit exceeded
   */
  static isTimeLimitExceeded(childId) {
    const settings = this.getSettings(childId);
    const limits = this.getTimeLimits(childId);
    
    if (!settings.enabled) return false;
    return limits.usedToday >= settings.dailyLimit;
  }

  /**
   * Get remaining time
   */
  static getRemainingTime(childId) {
    const settings = this.getSettings(childId);
    const limits = this.getTimeLimits(childId);
    
    if (!settings.enabled) return Infinity;
    return Math.max(0, settings.dailyLimit - limits.usedToday);
  }

  /**
   * Check if feature is allowed
   */
  static isFeatureAllowed(childId, feature) {
    const settings = this.getSettings(childId);
    
    if (!settings.enabled) return true;
    return !settings.restrictedFeatures.includes(feature);
  }

  /**
   * Get all restricted features
   */
  static getRestrictedFeatures() {
    return [
      { id: 'settings', name: 'Settings' },
      { id: 'developer', name: 'Developer Portal' },
      { id: 'parent-zone', name: 'Parent Zone' },
      { id: 'premium-content', name: 'Premium Content' }
    ];
  }

  /**
   * Set time limit
   */
  static setTimeLimit(childId, minutes) {
    const settings = this.getSettings(childId);
    settings.dailyLimit = minutes;
    this.updateSettings(childId, settings);
  }

  /**
   * Check if break is needed
   */
  static needsBreak(childId) {
    const limits = this.getTimeLimits(childId);
    const settings = this.getSettings(childId);

    if (!settings.enabled) return false;
    return limits.usedToday >= settings.breakInterval;
  }

  /**
   * Reset daily counter (called at midnight)
   */
  static resetDailyCounters(childId) {
    StorageService.set(`${TIME_LIMIT_KEY}_${childId}`, {
      usedToday: 0,
      lastUsed: new Date().toISOString()
    });
  }
}