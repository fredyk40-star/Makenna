/**
 * UpdateService - Selective update rollout system for the learning platform
 * Allows developers to push updates to specific groups of users with preview workflow
 */
import { StorageService } from './StorageService';

const UPDATES_KEY = 'makenna_updates_v1';
const VERSION_KEY = 'makenna_app_version';
const PREVIEW_KEY = 'makenna_preview_updates';
const PREVIEW_EXPIRY_DAYS = 7;
const PREVIEW_CONFIG_URL = '/preview-config.json';

export class UpdateService {
  /**
   * Get current app version
   */
  static getCurrentVersion() {
    return StorageService.get(VERSION_KEY, '1.0.0');
  }

  /**
   * Set current app version
   */
  static setCurrentVersion(version) {
    StorageService.set(VERSION_KEY, version);
  }

  /**
   * Get all available updates
   */
  static getUpdates() {
    return StorageService.get(UPDATES_KEY, []);
  }

  /**
   * Fetch preview config from deployed file (cross-device persistence)
   */
  static async fetchPreviewConfig() {
    try {
      const response = await fetch(PREVIEW_CONFIG_URL, { cache: 'no-cache' });
      if (response.ok) {
        const config = await response.json();
        return config;
      }
      return { previewVersion: null, previewChildren: [], lastUpdated: null };
    } catch (error) {
      console.error('Failed to fetch preview config:', error);
      return { previewVersion: null, previewChildren: [], lastUpdated: null };
    }
  }

  /**
   * Sync preview config to localStorage for quick access
   */
  static async syncPreviewConfig() {
    const config = await this.fetchPreviewConfig();
    StorageService.set('makenna_preview_config', config);
    return config;
  }

  /**
   * Create a new update with preview workflow
   */
  static createUpdate(updateData) {
    const updates = this.getUpdates();
    const update = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      version: updateData.version,
      type: updateData.type || 'feature',
      target: updateData.target || 'all',
      targetIds: updateData.targetIds || [],
      changelog: updateData.changelog || '',
      status: 'preview',
      releasedBy: updateData.releasedBy || 'developer',
      previewChildren: [],
      promoted: false,
    };
    
    updates.push(update);
    StorageService.set(UPDATES_KEY, updates);
    return update.id;
  }

  /**
   * Get updates for a specific child (including preview updates from config)
   */
  static async getUpdatesForChild(childId, childData = {}) {
    // First, check preview-config.json for remote preview status
    const config = await this.fetchPreviewConfig();
    
    // Check if child is in remote preview list
    if (config.previewChildren && config.previewChildren.includes(childId) && config.previewVersion) {
      // Return a synthetic update for the preview version
      const syntheticUpdate = {
        id: 'remote-preview',
        version: config.previewVersion,
        type: 'preview',
        changelog: config.changelog || 'Preview features available!',
        status: 'preview',
        previewChildren: config.previewChildren,
        fromConfig: true
      };
      return [syntheticUpdate];
    }
    
    // Fall back to localStorage updates
    const updates = this.getUpdates();
    const currentVersion = this.getCurrentVersion();
    
    return updates.filter(update => {
      if (update.status === 'preview' || update.status === 'pending') {
        if (update.previewChildren && update.previewChildren.includes(childId)) {
          return true;
        }
      }
      
      if (update.status !== 'active') return false;
      if (update.version <= currentVersion) return false;

      switch (update.target) {
        case 'all':
          return true;
        case 'children':
          return update.targetIds.includes(childId);
        case 'classes':
          return childData.classId && update.targetIds.includes(childData.classId);
        case 'schools':
          return childData.schoolId && update.targetIds.includes(childData.schoolId);
        case 'regions':
          return childData.region && update.targetIds.includes(childData.region);
        case 'devices':
          return update.targetIds.includes(navigator.userAgent);
        case 'selected':
          return update.targetIds.includes(childId);
        default:
          return false;
      }
    });
  }

  /**
   * Add children to preview list for an update (localStorage)
   */
  static addPreviewChildren(updateId, childIds) {
    const updates = this.getUpdates();
    const update = updates.find(u => u.id === updateId);
    if (update && update.status === 'preview') {
      update.previewChildren = [...new Set([...(update.previewChildren || []), ...childIds])];
      StorageService.set(UPDATES_KEY, updates);
      
      const previewAccess = StorageService.get(PREVIEW_KEY, {});
      childIds.forEach(childId => {
        previewAccess[childId] = {
          updateId,
          addedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + PREVIEW_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        };
      });
      StorageService.set(PREVIEW_KEY, previewAccess);
      return true;
    }
    return false;
  }

  /**
   * Generate download config for preview-config.json
   */
  static generateDownloadConfig(previewChildren, version, changelog, features) {
    return {
      previewVersion: version || null,
      previewChildren: previewChildren || [],
      lastUpdated: new Date().toISOString(),
      changelog: changelog || '',
      features: features || []
    };
  }

  /**
   * Promote preview update to pending (ready for staged rollout)
   */
  static promoteUpdate(updateId) {
    const updates = this.getUpdates();
    const update = updates.find(u => u.id === updateId);
    if (update && update.status === 'preview') {
      update.status = 'pending';
      update.promoted = true;
      update.promotedAt = new Date().toISOString();
      StorageService.set(UPDATES_KEY, updates);
      return true;
    }
    return false;
  }

  /**
   * Activate an update publicly
   */
  static activateUpdate(updateId) {
    const updates = this.getUpdates();
    const update = updates.find(u => u.id === updateId);
    if (update) {
      update.status = 'active';
      update.activatedAt = new Date().toISOString();
      StorageService.set(UPDATES_KEY, updates);
      return true;
    }
    return false;
  }

  /**
   * Rollback an update
   */
  static rollbackUpdate(updateId) {
    const updates = this.getUpdates();
    const update = updates.find(u => u.id === updateId);
    if (update && update.status === 'active') {
      update.status = 'rolled_back';
      update.rolledBackAt = new Date().toISOString();
      StorageService.set(PREVIEW_KEY, {});
      StorageService.set(UPDATES_KEY, updates);
      return true;
    }
    return false;
  }

  /**
   * Get update history
   */
  static getUpdateHistory() {
    return this.getUpdates().sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  /**
   * Check if child has preview access
   */
  static async hasPreviewAccess(childId) {
    // Check remote config first
    const config = await this.fetchPreviewConfig();
    if (config.previewChildren && config.previewChildren.includes(childId)) {
      return config.previewVersion || 'remote-preview';
    }
    
    // Fall back to localStorage
    const previewAccess = StorageService.get(PREVIEW_KEY, {});
    const access = previewAccess[childId];
    if (access && new Date(access.expiresAt) > new Date()) {
      return access.updateId;
    }
    if (access) {
      delete previewAccess[childId];
      StorageService.set(PREVIEW_KEY, previewAccess);
    }
    return null;
  }

  /**
   * Check if child needs update
   */
  static async checkForUpdates(childId, childData = {}) {
    const pendingUpdates = await this.getUpdatesForChild(childId, childData);
    return pendingUpdates.length > 0 ? pendingUpdates : null;
  }

  /**
   * Record update installation
   */
  static installUpdate(childId, updateId) {
    const key = `makenna_installed_updates_${childId}`;
    const installed = StorageService.get(key, []);
    installed.push({ updateId, installedAt: new Date().toISOString() });
    StorageService.set(key, installed);
  }

  /**
   * Get update statistics
   */
  static getUpdateStats() {
    const updates = this.getUpdates();
    return {
      total: updates.length,
      active: updates.filter(u => u.status === 'active').length,
      preview: updates.filter(u => u.status === 'preview').length,
      pending: updates.filter(u => u.status === 'pending').length,
      rolledBack: updates.filter(u => u.status === 'rolled_back').length,
      latest: updates[0] || null
    };
  }

  /**
   * Clean up expired preview access
   */
  static cleanupExpiredPreviews() {
    const previewAccess = StorageService.get(PREVIEW_KEY, {});
    const now = new Date();
    let updated = false;
    
    Object.entries(previewAccess).forEach(([childId, access]) => {
      if (new Date(access.expiresAt) <= now) {
        delete previewAccess[childId];
        updated = true;
      }
    });
    
    if (updated) {
      StorageService.set(PREVIEW_KEY, previewAccess);
    }
    
    return previewAccess;
  }
}