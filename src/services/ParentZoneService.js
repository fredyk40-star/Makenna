/**
 * Parent Zone Service - Parent dashboard and controls
 * Child progress monitoring, settings management
 */
import { StorageService } from './StorageService';

const PARENT_KEY = 'makenna_parent_data';

export class ParentZoneService {
  /**
   * Get parent profile
   */
  static getParentProfile(parentId) {
    return StorageService.get(`${PARENT_KEY}_${parentId}`, {
      id: parentId,
      name: 'Parent',
      email: '',
      children: []
    });
  }

  /**
   * Add child to parent profile
   */
  static addChild(parentId, childId) {
    const profile = this.getParentProfile(parentId);
    if (!profile.children.includes(childId)) {
      profile.children.push(childId);
      StorageService.set(`${PARENT_KEY}_${parentId}`, profile);
    }
    return profile;
  }

  /**
   * Remove child from parent profile
   */
  static removeChild(parentId, childId) {
    const profile = this.getParentProfile(parentId);
    profile.children = profile.children.filter(id => id !== childId);
    StorageService.set(`${PARENT_KEY}_${parentId}`, profile);
    return profile;
  }

  /**
   * Get all children progress for parent
   */
  static getChildrenProgress(parentId) {
    const profile = this.getParentProfile(parentId);
    return profile.children.map(childId => ({
      childId,
      lastActive: StorageService.get(`makenna_progress_${childId}`)?.lastActive || null
    }));
  }

  /**
   * Update parent settings
   */
  static updateSettings(parentId, settings) {
    const profile = this.getParentProfile(parentId);
    profile.settings = { ...profile.settings, ...settings };
    StorageService.set(`${PARENT_KEY}_${parentId}`, profile);
    return profile.settings;
  }

  /**
   * Get parent settings
   */
  static getSettings(parentId) {
    const profile = this.getParentProfile(parentId);
    return profile.settings || {
      dailyLimit: 60,
      notifications: true,
      safeSearch: true
    };
  }

  /**
   * Get weekly report for all children
   */
  static getWeeklyReport(parentId) {
    const profile = this.getParentProfile(parentId);
    const report = {};

    profile.children.forEach(childId => {
      const progress = StorageService.get(`makenna_progress_${childId}`, {});
      report[childId] = {
        totalTime: progress.totalTime || 0,
        lessonsCompleted: Object.keys(progress.lessons || {}).length,
        starsEarned: progress.totalStars || 0
      };
    });

    return report;
  }
}