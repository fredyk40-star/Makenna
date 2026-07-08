/**
 * Backup Service - Export/Import profiles, progress, and reports
 * JSON format for future cloud compatibility
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';
import { AdaptiveLearningService } from './AdaptiveLearningService';
import { AnalyticsService } from './AnalyticsService';

const BACKUP_KEY = 'makenna_backups';
const BACKUP_LIMIT = 10;

export class BackupService {
  /**
   * Create a backup for a child
   */
  static createBackup(childId) {
    const backups = this.getBackups();
    const backup = {
      id: `backup_${Date.now()}`,
      childId,
      createdAt: new Date().toISOString(),
      version: 1,
      data: {
        gamification: GamificationService.getState(childId),
        adaptiveLearning: Object.fromEntries(AdaptiveLearningService.performanceData),
        analytics: AnalyticsService.exportData(),
        settings: StorageService.get('makenna_settings', {})
      }
    };
    
    backups.unshift(backup);
    
    // Keep only recent backups
    if (backups.length > BACKUP_LIMIT) {
      backups.splice(BACKUP_LIMIT);
    }
    
    StorageService.set(BACKUP_KEY, backups);
    return backup;
  }

  /**
   * Get all backups
   */
  static getBackups() {
    return StorageService.get(BACKUP_KEY, []);
  }

  /**
   * Get backup by ID
   */
  static getBackupById(id) {
    const backups = this.getBackups();
    return backups.find(b => b.id === id);
  }

  /**
   * Restore from backup
   */
  static restoreBackup(id) {
    const backup = this.getBackupById(id);
    if (!backup) return false;
    
    const { data } = backup;
    
    if (data.gamification) {
      const allStates = StorageService.get('makenna_gamification_state', {});
      allStates[backup.childId] = data.gamification;
      StorageService.set('makenna_gamification_state', allStates);
    }
    
    if (data.adaptiveLearning) {
      // Import to AdaptiveLearningService
      for (const [itemId, record] of Object.entries(data.adaptiveLearning)) {
        AdaptiveLearningService.performanceData.set(itemId, record);
      }
      AdaptiveLearningService.saveToStorage();
    }
    
    if (data.analytics) {
      AnalyticsService.importData(data.analytics);
    }
    
    return true;
  }

  /**
   * Delete a backup
   */
  static deleteBackup(id) {
    const backups = this.getBackups().filter(b => b.id !== id);
    StorageService.set(BACKUP_KEY, backups);
  }

  /**
   * Export backup as JSON
   */
  static exportBackup(id) {
    const backup = this.getBackupById(id);
    return backup ? JSON.stringify(backup, null, 2) : null;
  }

  /**
   * Import backup from JSON
   */
  static importBackup(json) {
    try {
      const backup = JSON.parse(json);
      if (backup.id && backup.data) {
        const backups = this.getBackups();
        backups.unshift({
          ...backup,
          id: `backup_${Date.now()}`,
          restoredAt: new Date().toISOString()
        });
        StorageService.set(BACKUP_KEY, backups);
        return backup;
      }
      return null;
    } catch (error) {
      console.error('Backup import error:', error);
      return null;
    }
  }

  /**
   * Get backup summary
   */
  static getSummary() {
    const backups = this.getBackups();
    const latest = backups[0];
    
    return {
      totalBackups: backups.length,
      latestBackup: latest?.createdAt || null,
      latestChildId: latest?.childId || null,
      backupSize: backups.reduce((sum, b) => sum + JSON.stringify(b).length, 0)
    };
  }
}