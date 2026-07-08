/**
 * DeveloperService - Hidden developer portal management
 * Only accessible via secret URL - not exposed in navigation
 */
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';

const DEVELOPER_KEY = 'makenna_developer_pin_hash_v1';
const DEVELOPER_SALT = 'makenna-developer-salt-v1';
const BACKUP_KEY = 'makenna_backup_data_v1';
const FEATURE_FLAGS_KEY = 'makenna_feature_flags_v1';

export class DeveloperService {
  /**
   * Hash developer PIN
   */
  static async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + DEVELOPER_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Set developer PIN (first time setup)
   */
  static async setDeveloperPin(pin) {
    if (!/^\d{4}$/.test(pin) && !/^\d{8}$/.test(pin)) {
      throw new Error('PIN must be 4 or 8 digits');
    }
    const hash = await this.hashPin(pin);
    StorageService.set(DEVELOPER_KEY, hash);
    return true;
  }

  /**
   * Verify developer PIN
   */
  static async verifyDeveloperPin(pin) {
    const storedHash = StorageService.get(DEVELOPER_KEY);
    if (!storedHash) return false;
    
    const pinHash = await this.hashPin(pin);
    return pinHash === storedHash;
  }

  /**
   * Check if developer PIN is set
   */
  static isDeveloperPinSet() {
    return !!StorageService.get(DEVELOPER_KEY);
  }

  /**
   * Change developer PIN
   */
  static async changeDeveloperPin(newPin) {
    if (!/^\d{4}$/.test(newPin) && !/^\d{8}$/.test(newPin)) {
      throw new Error('PIN must be 4 or 8 digits');
    }
    return this.setDeveloperPin(newPin);
  }

  /**
   * Get all children with extended data
   */
  static getAllChildren() {
    const accounts = ChildAccountService.getAllAccounts();
    return accounts.map(account => ({
      ...account,
      status: this.getChildStatus(account.childId),
      progressSummary: this.getProgressSummary(account.childId)
    }));
  }

  /**
   * Search children by name or ID
   */
  static searchChildren(query) {
    const accounts = ChildAccountService.getAllAccounts();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return this.getAllChildren();
    
    return accounts.filter(account => 
      account.fullName.toLowerCase().includes(normalizedQuery) ||
      account.childId.toLowerCase().includes(normalizedQuery)
    ).map(account => ({
      ...account,
      status: this.getChildStatus(account.childId),
      progressSummary: this.getProgressSummary(account.childId)
    }));
  }

  /**
   * Get child status (lock/suspend/ban)
   */
  static getChildStatus(childId) {
    const key = `makenna_child_status_${childId}`;
    return StorageService.get(key) || { 
      locked: false, 
      suspended: false, 
      banned: false 
    };
  }

  /**
   * Update child status
   */
  static updateChildStatus(childId, status) {
    const key = `makenna_child_status_${childId}`;
    StorageService.set(key, status);
  }

  /**
   * Reset child progress (various types)
   */
  static resetChildProgress(childId, type = 'all') {
    const account = ChildAccountService.getChild(childId);
    if (!account) return false;

    switch (type) {
      case 'all':
        account.progress = {};
        account.settings = {};
        break;
      case 'achievements':
        if (account.progress) {
          account.progress.achievements = {};
        }
        break;
      case 'stars':
        if (account.progress) {
          account.progress.stars = 0;
        }
        break;
      case 'certificates':
        if (account.progress) {
          account.progress.certificates = [];
        }
        break;
      case 'mastery':
        if (account.progress) {
          account.progress.mastery = {};
        }
        break;
      case 'history':
        if (account.progress) {
          account.progress.history = [];
        }
        break;
    }
    
    const accounts = ChildAccountService.getAllAccounts();
    const index = accounts.findIndex(a => a.childId.toLowerCase() === childId.toLowerCase());
    if (index !== -1) {
      accounts[index] = account;
      ChildAccountService.saveAllAccounts(accounts);
    }
    
    return true;
  }

  /**
   * Get progress summary for a child
   */
  static getProgressSummary(childId) {
    const account = ChildAccountService.getChild(childId);
    if (!account) return null;
    
    return {
      lettersMastered: Object.keys(account.progress?.alphabet || {}).length,
      numbersMastered: Object.keys(account.progress?.numbers || {}).length,
      totalTime: (account.progress?.totalTime || 0),
      achievements: Object.keys(account.progress?.achievements || {}).length
    };
  }

  /**
   * Delete child account
   */
  static deleteChild(childId) {
    const account = ChildAccountService.getChild(childId);
    if (!account) return false;
    
    // Store in trash before deletion
    const trash = StorageService.get('makenna_trash_bin', []);
    trash.push({
      ...account,
      deletedAt: new Date().toISOString()
    });
    StorageService.set('makenna_trash_bin', trash);
    
    ChildAccountService.deleteChild(childId);
    return true;
  }

  /**
   * Get trash bin (deleted accounts)
   */
  static getTrashBin() {
    return StorageService.get('makenna_trash_bin', []);
  }

  /**
   * Restore deleted account
   */
  static restoreChild(childId) {
    const trash = this.getTrashBin();
    const index = trash.findIndex(a => a.childId.toLowerCase() === childId.toLowerCase());
    
    if (index === -1) return false;
    
    const account = trash[index];
    const accounts = ChildAccountService.getAllAccounts();
    accounts.push(account);
    ChildAccountService.saveAllAccounts(accounts);
    
    trash.splice(index, 1);
    StorageService.set('makenna_trash_bin', trash);
    
    return true;
  }

  /**
   * Create backup of all data
   */
  static createBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        childAccounts: ChildAccountService.getAllAccounts(),
        trashBin: this.getTrashBin()
      }
    };
    
    const backups = StorageService.get(BACKUP_KEY, []);
    backups.push(backup);
    StorageService.set(BACKUP_KEY, backups);
    
    return backup.timestamp;
  }

  /**
   * Get all backups
   */
  static getBackups() {
    return StorageService.get(BACKUP_KEY, []);
  }

  /**
   * Restore from backup
   */
  static restoreBackup(timestamp) {
    const backups = this.getBackups();
    const backup = backups.find(b => b.timestamp === timestamp);
    
    if (!backup) return false;
    
    ChildAccountService.saveAllAccounts(backup.data.childAccounts);
    StorageService.set('makenna_trash_bin', backup.data.trashBin);
    
    return true;
  }

  /**
   * Export child data
   */
  static exportChildData(childId) {
    const account = ChildAccountService.getChild(childId);
    if (!account) return null;
    
    return JSON.stringify(account, null, 2);
  }

  /**
   * Import child data
   */
  static async importChildData(jsonData) {
    try {
      const account = JSON.parse(jsonData);
      // Validate account structure
      if (!account.childId || !account.fullName) {
        throw new Error('Invalid child data format');
      }
      
      const accounts = ChildAccountService.getAllAccounts();
      const existing = accounts.find(a => a.childId.toLowerCase() === account.childId.toLowerCase());
      
      if (existing) {
        Object.assign(existing, account);
      } else {
        accounts.push(account);
      }
      
      ChildAccountService.saveAllAccounts(accounts);
      return true;
    } catch (error) {
      throw new Error('Failed to import child data: ' + error.message);
    }
  }

  /**
   * Feature flags management
   */
  static getFeatureFlags() {
    return StorageService.get(FEATURE_FLAGS_KEY, {
      experimentalFeatures: false,
      newLessons: true,
      offlineMode: true
    });
  }

  static updateFeatureFlags(flags) {
    StorageService.set(FEATURE_FLAGS_KEY, flags);
  }

  /**
   * Clear all offline cache
   */
  static clearOfflineCache() {
    localStorage.removeItem('makenna_offline_cache');
    localStorage.removeItem('makenna_story_cache');
    return true;
  }

  /**
   * Log system event
   */
  static logAction(action, details = {}) {
    const logs = StorageService.get('makenna_system_logs_v1', []);
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
      userAgent: navigator.userAgent
    };
    logs.unshift(logEntry);
    // Keep only the last 500 logs
    if (logs.length > 500) {
      logs.splice(500);
    }
    StorageService.set('makenna_system_logs_v1', logs);
    return logEntry;
  }

  /**
   * Get system logs
   */
  static getLogs(filters = {}) {
    const logs = StorageService.get('makenna_system_logs_v1', []);
    
    if (!filters.action && !filters.startDate && !filters.endDate) {
      return logs;
    }

    return logs.filter(log => {
      if (filters.action && log.action !== filters.action) return false;
      if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
      return true;
    });
  }

  /**
   * Clear all logs
   */
  static clearLogs() {
    StorageService.remove('makenna_system_logs_v1');
    return true;
  }

  /**
   * Permanently delete child from trash
   */
  static deletePermanently(childId) {
    const trash = this.getTrashBin();
    const index = trash.findIndex(a => a.childId.toLowerCase() === childId.toLowerCase());
    
    if (index === -1) return false;
    
    trash.splice(index, 1);
    StorageService.set('makenna_trash_bin', trash);
    this.logAction('PERMANENT_DELETE', { childId });
    return true;
  }

  /**
   * Empty entire trash bin
   */
  static emptyTrashBin() {
    const trash = this.getTrashBin();
    const count = trash.length;
    StorageService.remove('makenna_trash_bin');
    this.logAction('EMPTY_TRASH', { deletedCount: count });
    return count;
  }

  // =====================
  // AI Assistant Management
  // =====================

  /**
   * Get AI configuration
   */
  static getAIConfig() {
    return StorageService.get('makenna_ai_config_v1', {
      voiceSettings: {
        rate: 0.9,
        pitch: 1.1,
        volume: 0.8,
        preferredVoice: null
      },
      messageCategories: {
        greeting: true,
        praise: true,
        improvement: true,
        revision: true,
        suggestion: true,
        hint: true
      },
      interactiveMode: true,
      autoSpeak: true,
      welcomeDelay: 2000
    });
  }

  /**
   * Update AI configuration
   */
  static updateAIConfig(config) {
    StorageService.set('makenna_ai_config_v1', config);
    this.logAction('AI_CONFIG_UPDATE', { updatedKeys: Object.keys(config) });
    return true;
  }

  /**
   * Get AI voice commands
   */
  static getAIVoiceCommands() {
    return StorageService.get('makenna_ai_voice_commands_v1', [
      { id: 1, phrase: 'help me', response: 'I can help! What do you need?', category: 'help' },
      { id: 2, phrase: 'tell me a fact', response: 'Learning is like an adventure!', category: 'fun' },
      { id: 3, phrase: 'what can i do', response: 'You can learn letters, numbers, play games, or read stories!', category: 'info' }
    ]);
  }

  /**
   * Add AI voice command
   */
  static addAIVoiceCommand(command) {
    const commands = this.getAIVoiceCommands();
    const newCommand = {
      id: Date.now(),
      phrase: command.phrase || '',
      response: command.response || '',
      category: command.category || 'custom'
    };
    commands.push(newCommand);
    StorageService.set('makenna_ai_voice_commands_v1', commands);
    this.logAction('AI_VOICE_COMMAND_ADD', { phrase: newCommand.phrase });
    return newCommand;
  }

  /**
   * Delete AI voice command
   */
  static deleteAIVoiceCommand(commandId) {
    const commands = this.getAIVoiceCommands();
    const filtered = commands.filter(c => c.id !== commandId);
    StorageService.set('makenna_ai_voice_commands_v1', filtered);
    this.logAction('AI_VOICE_COMMAND_DELETE', { commandId });
    return true;
  }

  /**
   * Get AI interaction statistics
   */
  static getAIStatistics() {
    const interactions = StorageService.get('makenna_ai_interactions_v1', []);
    const stats = {
      totalInteractions: interactions.length,
      byType: {},
      bySubject: {},
      byChild: {},
      recentActivity: interactions.slice(-100)
    };

    interactions.forEach(interaction => {
      // Count by type
      stats.byType[interaction.type] = (stats.byType[interaction.type] || 0) + 1;
      
      // Count by subject if available
      if (interaction.subject) {
        stats.bySubject[interaction.subject] = (stats.bySubject[interaction.subject] || 0) + 1;
      }
      
      // Count by child
      if (interaction.childId) {
        stats.byChild[interaction.childId] = (stats.byChild[interaction.childId] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear AI interaction history
   */
  static clearAIInteractions() {
    StorageService.remove('makenna_ai_interactions_v1');
    this.logAction('AI_INTERACTIONS_CLEAR', {});
    return true;
  }

  /**
   * Get AI knowledge base (read-only view)
   */
  static getAIKnowledgeBase() {
    return {
      alphabet: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      numbers: Array.from({ length: 20 }, (_, i) => i.toString()),
      colors: ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white'],
      shapes: ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'heart', 'star']
    };
  }
}
