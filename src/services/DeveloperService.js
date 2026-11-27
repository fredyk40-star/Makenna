/**
 * DeveloperService - Hidden developer portal management
 * Only accessible via secret URL - not exposed in navigation
 */
import { StorageService } from './StorageService';
import { ChildAccountService, postApi } from './ChildAccountService';
import { SyncQueueService } from './SyncQueueService';
import { UpdateService } from './UpdateService';

const DEVELOPER_KEY = 'makenna_developer_pin_hash_v1';
const DEVELOPER_SALT = 'makenna-developer-salt-v1';
const BACKUP_KEY = 'makenna_backup_data_v1';
const FEATURE_FLAGS_KEY = 'makenna_feature_flags_v1';
const FAILED_ATTEMPTS_KEY = 'makenna_dev_failed_attempts_v1';
const LOCKOUT_UNTIL_KEY = 'makenna_dev_lockout_until_v1';
const SESSION_TOKEN_KEY = 'makenna_dev_session_v1';
const SESSION_EXPIRY_KEY = 'makenna_dev_session_expiry_v1';
const SESSION_TOKEN_KEY_V2 = 'makenna_dev_session_token_v1';
const DEVELOPER_EMAIL_KEY = 'makenna_developer_email_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/** Developer sign-in is restricted to this mailbox. */
export const DEVELOPER_EMAIL = import.meta.env?.VITE_DEVELOPER_EMAIL || 'addaifrederick72@gmail.com';

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

  // =====================
  // Email + Password Access (restricted developer)
  // =====================

  static getDeveloperEmail() {
    return DEVELOPER_EMAIL;
  }

  static validateStrongPassword(password) {
    return typeof password === 'string'
      && password.length >= 12
      && /[a-z]/.test(password)
      && /[A-Z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password);
  }

  static getSessionToken() {
    return StorageService.get(SESSION_TOKEN_KEY_V2) || null;
  }

  static async _postApi(endpoint, body) {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error('The server returned an invalid response.');
    }
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Request failed. Please try again.');
    }
    return data;
  }

  /** Exchange the developer email/password for a short-lived signed session. */
  static async loginWithPassword(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedEmail !== DEVELOPER_EMAIL.toLowerCase()) {
      throw new Error(`Developer access is restricted to ${DEVELOPER_EMAIL}.`);
    }
    if (!password) throw new Error('Please enter your developer password.');

    const result = await this._postApi('developer-auth', {
      action: 'login',
      email: normalizedEmail,
      password,
    });

    StorageService.set(DEVELOPER_EMAIL_KEY, normalizedEmail);
    StorageService.set(SESSION_TOKEN_KEY_V2, result.token);
    this.createSession(result.token, normalizedEmail);
    return result;
  }

  /** Reset links are only ever sent to the configured developer mailbox. */
  static async requestPasswordReset(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedEmail !== DEVELOPER_EMAIL.toLowerCase()) {
      // Same generic response as a valid request; no mail is sent.
      return { success: true };
    }
    return this._postApi('developer-auth', { action: 'request-reset', email: normalizedEmail });
  }

  static async resetPassword(token, newPassword) {
    if (!this.validateStrongPassword(newPassword)) {
      throw new Error('Use at least 12 characters with upper case, lower case, a number and a symbol.');
    }
    return this._postApi('developer-auth', {
      action: 'reset',
      token,
      newPassword,
    });
  }

  static async verifySessionToken() {
    const token = this.getSessionToken();
    if (!token) return false;
    try {
      const result = await this._postApi('developer-auth', { action: 'verify', token });
      return !!result.valid;
    } catch (error) {
      return false;
    }
  }

  /** Send a one-time password to a parent's verified recovery email. */
  static async sendTemporaryPassword({ childId, parentEmail, tempPassword }) {
    try {
      return await this._postApi('mail', {
        action: 'send_temp_password',
        childId,
        parentEmail,
        tempPassword,
        sessionToken: this.getSessionToken(),
        email: StorageService.get(DEVELOPER_EMAIL_KEY),
      });
    } catch (error) {
      // The portal can show the generated password as a manual fallback.
      return { success: false, error: error.message };
    }
  }

  /**
   * Change developer PIN
   */
  static async changeDeveloperPin(newPin) {
    if (!/^\d{4}$/.test(newPin) && !/^\d{8}$/.test(newPin)) {
      throw new Error('PIN must be 4 or 8 digits');
    }
    // Developer credentials are verified server-side; this local PIN is only
    // used by legacy offline tooling and is never uploaded.
    return this.setDeveloperPin(newPin);
  }

  // =====================
  // Brute Force Protection
  // =====================

  /**
   * Check if developer is locked out due to too many failed attempts
   */
  static isLockedOut() {
    const lockoutUntil = StorageService.get(LOCKOUT_UNTIL_KEY);
    if (!lockoutUntil) return false;
    return Date.now() < lockoutUntil;
  }

  /**
   * Get remaining lockout time in seconds (0 if not locked out)
   */
  static getLockoutRemainingSeconds() {
    const lockoutUntil = StorageService.get(LOCKOUT_UNTIL_KEY);
    if (!lockoutUntil) return 0;
    const remaining = lockoutUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Record a failed PIN attempt. Locks out after MAX_FAILED_ATTEMPTS.
   */
  static recordFailedAttempt() {
    const attempts = (StorageService.get(FAILED_ATTEMPTS_KEY) || 0) + 1;
    StorageService.set(FAILED_ATTEMPTS_KEY, attempts);
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      StorageService.set(LOCKOUT_UNTIL_KEY, Date.now() + LOCKOUT_DURATION_MS);
      StorageService.set(FAILED_ATTEMPTS_KEY, 0);
      this.logAction('DEV_LOCKOUT', { attempts });
    }
    return attempts;
  }

  /**
   * Clear failed attempts (on successful login)
   */
  static clearFailedAttempts() {
    StorageService.remove(FAILED_ATTEMPTS_KEY);
    StorageService.remove(LOCKOUT_UNTIL_KEY);
  }

  // =====================
  // Secure Session Management
  // =====================

  /**
   * Generate a cryptographically secure session token
   */
  static _generateSessionToken() {
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(36)).join('');
  }

  /**
   * Create a secure developer session
   */
  static createSession(apiToken = null, email = null) {
    const token = this._generateSessionToken();
    const expiry = Date.now() + SESSION_DURATION_MS;
    StorageService.set(SESSION_TOKEN_KEY, token);
    StorageService.set(SESSION_EXPIRY_KEY, expiry);
    if (apiToken) StorageService.set(SESSION_TOKEN_KEY_V2, apiToken);
    if (email) StorageService.set(DEVELOPER_EMAIL_KEY, email);
    this.clearFailedAttempts();
    this.logAction('DEV_LOGIN', { tokenPrefix: token.substring(0, 8), email: email || DEVELOPER_EMAIL });
    return token;
  }

  /**
   * Validate the current session (returns true if valid)
   */
  static validateSession() {
    const token = StorageService.get(SESSION_TOKEN_KEY);
    const expiry = StorageService.get(SESSION_EXPIRY_KEY);
    if (!token || !expiry) return false;
    if (Date.now() > expiry) {
      this.clearSession();
      return false;
    }
    return true;
  }

  /**
   * Clear the session (logout)
   */
  static clearSession() {
    StorageService.remove(SESSION_TOKEN_KEY);
    StorageService.remove(SESSION_EXPIRY_KEY);
    StorageService.remove(SESSION_TOKEN_KEY_V2);
    StorageService.remove(DEVELOPER_EMAIL_KEY);
    this.logAction('DEV_LOGOUT', {});
  }

  /**
   * Extend the session expiry (called on user activity)
   */
  static extendSession() {
    const token = StorageService.get(SESSION_TOKEN_KEY);
    if (!token) return false;
    StorageService.set(SESSION_EXPIRY_KEY, Date.now() + SESSION_DURATION_MS);
    return true;
  }

  // =====================
  // Supabase Cloud Sync for Children
  // =====================

  /**
   * Sync all child accounts from Supabase cloud to localStorage.
   * Returns { success, count, error } so the UI can show results.
   */
  static async syncChildrenFromCloud() {
    try {
      const result = await postApi('child-sync', {
        action: 'admin_list',
        developerToken: this.getSessionToken(),
      });
      ChildAccountService.saveAllAccounts(result.accounts || []);
      const totalCount = ChildAccountService.getAllAccounts().length;
      this.logAction('DEV_CLOUD_SYNC_CHILDREN', { count: totalCount });
      return { success: true, count: totalCount, error: null };
    } catch (err) {
      console.warn('Sync children from cloud failed:', err.message);
      return { success: false, count: 0, error: err.message };
    }
  }

  /**
   * Get last cloud sync timestamp
   */
  static getLastSyncTime() {
    return StorageService.get('makenna_sync_status_v1')?.lastSync || null;
  }

  // =====================
  // Supabase Cloud Sync for Features & Updates
  // =====================

  /**
   * Sync feature flags to Supabase (upload)
   */
  static async _syncFeaturesToCloud() {
    try {
      await postApi('developer-data', {
        action: 'flags_push',
        developerToken: this.getSessionToken(),
        flags: this.getFeatureFlags(),
      });
      return true;
    } catch (err) {
      console.warn('Feature flags sync skipped:', err.message);
      return false;
    }
  }

  /**
   * Pull feature flags from Supabase and merge into localStorage
   */
  static async syncFeaturesFromCloud() {
    try {
      const result = await postApi('developer-data', {
        action: 'flags_pull',
        developerToken: this.getSessionToken(),
      });
      // Merge cloud flags with local (cloud takes priority)
      const merged = { ...this.getFeatureFlags(), ...(result.flags || {}) };
      this.updateFeatureFlags(merged);
      this.logAction('DEV_SYNC_FEATURES', { count: Object.keys(merged).length });
      return { success: true, flags: merged };
    } catch (err) {
      console.warn('Feature flags pull failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sync updates to Supabase (upload all)
   */
  static async _syncUpdatesToCloud() {
    try {
      const { UpdateService } = await import('./UpdateService');
      const updates = UpdateService.getUpdateHistory();
      if (!updates.length) return true;
      await postApi('developer-data', {
        action: 'updates_push',
        developerToken: this.getSessionToken(),
        updates,
      });
      return true;
    } catch (err) {
      console.warn('Updates sync skipped:', err.message);
      return false;
    }
  }

  /**
   * Pull updates from Supabase and merge into localStorage
   */
  static async syncUpdatesFromCloud() {
    try {
      const result = await postApi('developer-data', {
        action: 'updates_pull',
        developerToken: this.getSessionToken(),
      });
      // Merge: cloud updates overwrite local ones with the same ID.
      const localUpdates = UpdateService.getUpdateHistory();
      const mergedIds = new Set();
      const merged = [];
      for (const item of (result.updates || [])) {
        merged.push(item);
        mergedIds.add(item.id);
      }
      for (const local of localUpdates) {
        if (!mergedIds.has(local.id)) merged.push(local);
      }
      StorageService.set('makenna_updates_v1', merged);
      this.logAction('DEV_SYNC_UPDATES', { count: merged.length });
      return { success: true, count: merged.length, updates: merged };
    } catch (err) {
      console.warn('Updates pull failed:', err.message);
      return { success: false, error: err.message, count: 0 };
    }
  }

  // =====================
  // Supabase Cloud Sync for PIN
  // =====================

  /**
   * Legacy local PIN fallback. Developer credentials are now verified by
   * api/developer-auth.js using a server-stored scrypt hash.
   */
  static async verifyWithCloudFallback(pin) {
    return this.verifyDeveloperPin(pin);
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

    const progress = { ...(account.progress || {}) };
    const settings = { ...(account.settings || {}) };

    switch (type) {
      case 'all':
        return !!ChildAccountService.updateChild(childId, { progress: {}, settings: {} });
      case 'achievements':
        progress.achievements = {};
        break;
      case 'stars':
        progress.stars = 0;
        break;
      case 'certificates':
        progress.certificates = [];
        break;
      case 'mastery':
        progress.mastery = {};
        break;
      case 'history':
        progress.history = [];
        break;
      default:
        return false;
    }

    // updateChild stamps updatedAt/version and queues the cloud upsert.
    return !!ChildAccountService.updateChild(childId, { progress, settings });
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
   * Delete child account (moves to local trash + syncs to cloud trash)
   */
  static async deleteChild(childId) {
    const account = ChildAccountService.getChild(childId);
    if (!account) return false;
    
    // Store in trash before deletion
    const trash = StorageService.get('makenna_trash_bin', []);
    const trashEntry = {
      ...account,
      deletedAt: new Date().toISOString()
    };
    trash.push(trashEntry);
    StorageService.set('makenna_trash_bin', trash);
    
    ChildAccountService.deleteChild(childId);
    
    // Sync to Supabase cloud trash
    await this._syncTrashToCloud(trashEntry);
    
    return true;
  }

  /**
   * Get trash bin (deleted accounts)
   */
  static getTrashBin() {
    return StorageService.get('makenna_trash_bin', []);
  }

  /**
   * Restore deleted account (from local trash + remove from cloud trash)
   */
  static async restoreChild(childId) {
    const trash = this.getTrashBin();
    const index = trash.findIndex(a => a.childId.toLowerCase() === childId.toLowerCase());

    if (index === -1) return false;

    const { CloudSyncService } = await import('./CloudSyncService');
    const account = ChildAccountService.sanitize({ ...trash[index] });
    delete account.deletedAt;
    account.updatedAt = new Date().toISOString();
    account.version = Number(account.version || 0) + 1;

    // Clear the server-side soft delete first so the restored child can log in
    // and normal pulls can see it again.
    await postApi('child-sync', {
      action: 'restore',
      childId,
      developerToken: this.getSessionToken(),
      account: CloudSyncService.toSyncPayload(account),
    });

    const accounts = ChildAccountService.getAllAccounts();
    const exists = accounts.some(a => a.childId?.toLowerCase() === account.childId?.toLowerCase());
    if (!exists) accounts.push(account);
    ChildAccountService.saveAllAccounts(accounts);
    // A restore must cancel any queued cloud deletion; otherwise the delete
    // could replay after the restore and erase the returned account again.
    SyncQueueService.removeForChild(account.childId);
    SyncQueueService.clearDeletion(account.childId);

    trash.splice(index, 1);
    StorageService.set('makenna_trash_bin', trash);

    // Remove from the developer trash mirror as well.
    await this._deleteFromCloudTrash(childId);

    return true;
  }

  /**
   * Sync trash items to/from Supabase
   */
  static async _syncTrashToCloud(trashEntry) {
    try {
      await postApi('developer-data', {
        action: 'trash_push',
        developerToken: this.getSessionToken(),
        entry: trashEntry,
      });
      return true;
    } catch (err) {
      console.warn('Trash cloud sync skipped:', err.message);
      return false;
    }
  }

  static async _deleteFromCloudTrash(childId) {
    try {
      await postApi('developer-data', {
        action: 'trash_delete',
        developerToken: this.getSessionToken(),
        childId,
      });
      return true;
    } catch (err) {
      console.warn('Trash cloud delete skipped:', err.message);
      return false;
    }
  }

  static async syncTrashFromCloud() {
    try {
      const result = await postApi('developer-data', {
        action: 'trash_pull',
        developerToken: this.getSessionToken(),
      });
      // Merge: cloud entries take priority, avoid duplicates.
      const localTrash = this.getTrashBin();
      const seen = new Set();
      const merged = [];
      for (const entry of [...(result.entries || []), ...localTrash]) {
        if (!seen.has(entry.childId)) {
          seen.add(entry.childId);
          merged.push(entry);
        }
      }
      StorageService.set('makenna_trash_bin', merged);
      this.logAction('DEV_SYNC_TRASH', { count: merged.length });
      return { success: true, count: merged.length, items: merged };
    } catch (err) {
      console.warn('Trash pull failed:', err.message);
      return { success: false, error: err.message, items: [] };
    }
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
   * Permanently delete child from trash (local + cloud)
   */
  static async deletePermanently(childId) {
    const trash = this.getTrashBin();
    const index = trash.findIndex(a => a.childId.toLowerCase() === childId.toLowerCase());
    
    if (index === -1) return false;
    
    trash.splice(index, 1);
    StorageService.set('makenna_trash_bin', trash);
    
    // Also delete from Supabase cloud trash
    await this._deleteFromCloudTrash(childId);
    
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
