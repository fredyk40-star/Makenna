/**
 * CloudSyncService - Sync child accounts to Supabase for cross-device access
 * Provides seamless synchronization between localStorage and cloud storage
 */
import { supabase, isSupabaseConfigured } from './SupabaseService';
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';

const SYNC_QUEUE_KEY = 'makenna_sync_queue_v1';
const SYNC_STATUS_KEY = 'makenna_sync_status_v1';

export class CloudSyncService {
  /**
   * Initialize cloud sync
   */
  static init() {
    if (!isSupabaseConfigured() || !supabase) {
      return { enabled: false, reason: 'Supabase not configured' };
    }

    // Load sync status
    const status = StorageService.get(SYNC_STATUS_KEY, {
      lastSync: null,
      pendingChanges: false,
      lastError: null
    });

    return { enabled: true, status };
  }

  /**
   * Upload a child account to Supabase
   */
  static async uploadChildAccount(account) {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('child_accounts')
        .upsert({
          child_id: account.childId,
          full_name: account.fullName,
          pin_hash: account.pinHash,
          pin_set: account.pinSet,
          avatar: account.avatar,
          created_at: account.createdAt,
          last_login: account.lastLogin,
          progress: account.progress,
          settings: account.settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'child_id' });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download all child accounts from Supabase
   */
  static async downloadChildAccounts() {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured', accounts: [] };
    }

    try {
      const { data, error } = await supabase
        .from('child_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to local format
      const accounts = data.map(item => ({
        childId: item.child_id,
        fullName: item.full_name,
        pinHash: item.pin_hash,
        pinSet: item.pin_set,
        avatar: item.avatar,
        createdAt: item.created_at,
        lastLogin: item.last_login,
        progress: item.progress || {},
        settings: item.settings || {}
      }));

      return { success: true, accounts };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message, accounts: [] };
    }
  }

  /**
   * Sync all accounts from cloud to local
   */
  static async syncFromCloud() {
    const result = await this.downloadChildAccounts();
    
    if (result.success) {
      // Merge with local accounts
      const localAccounts = ChildAccountService.getAllAccounts();
      const merged = this.mergeAccounts(localAccounts, result.accounts);
      ChildAccountService.saveAllAccounts(merged);
      this.updateSyncStatus({ lastSync: new Date().toISOString(), lastError: null });
    } else {
      this.updateSyncStatus({ lastError: result.error });
    }

    return result;
  }

  /**
   * Sync all accounts from local to cloud
   */
  static async syncToCloud() {
    const accounts = ChildAccountService.getAllAccounts();
    
    for (const account of accounts) {
      await this.uploadChildAccount(account);
    }

    this.updateSyncStatus({ lastSync: new Date().toISOString(), lastError: null });
    return { success: true, count: accounts.length };
  }

  /**
   * Full sync (bi-directional)
   */
  static async fullSync() {
    const status = this.init();
    if (!status.enabled) {
      return status;
    }

    // Download from cloud first
    const cloudResult = await this.syncFromCloud();
    
    // Upload local changes
    const localResult = await this.syncToCloud();

    return {
      success: cloudResult.success && localResult.success,
      cloudAccounts: cloudResult.accounts?.length || 0,
      localAccounts: localResult.count || 0
    };
  }

  /**
   * Merge accounts (avoid duplicates)
   */
  static mergeAccounts(local, cloud) {
    const merged = [...local];
    
    for (const cloudAccount of cloud) {
      const existingIndex = merged.findIndex(
        a => a.childId.toLowerCase() === cloudAccount.childId.toLowerCase()
      );
      
      if (existingIndex === -1) {
        // New account from cloud
        merged.push(cloudAccount);
      } else {
        // Merge - prefer newer data
        const localUpdated = new Date(merged[existingIndex].updated_at || 0);
        const cloudUpdated = new Date(cloudAccount.updated_at || 0);
        
        if (cloudUpdated > localUpdated) {
          merged[existingIndex] = cloudAccount;
        }
      }
    }
    
    return merged;
  }

  /**
   * Update sync status
   */
  static updateSyncStatus(updates) {
    const status = StorageService.get(SYNC_STATUS_KEY, {});
    const newStatus = { ...status, ...updates };
    StorageService.set(SYNC_STATUS_KEY, newStatus);
    return newStatus;
  }

  /**
   * Get sync status
   */
  static getSyncStatus() {
    return StorageService.get(SYNC_STATUS_KEY, {
      lastSync: null,
      pendingChanges: false,
      lastError: null
    });
  }

  /**
   * Queue sync operation for offline
   */
  static queueSync(operation) {
    const queue = StorageService.get(SYNC_QUEUE_KEY, []);
    queue.push({
      ...operation,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    StorageService.set(SYNC_QUEUE_KEY, queue);
  }

  /**
   * Process sync queue when online
   */
  static async processQueue() {
    const queue = StorageService.get(SYNC_QUEUE_KEY, []);
    
    for (const item of queue) {
      // Process each queued operation
      switch (item.type) {
        case 'CREATE_ACCOUNT':
          await this.uploadChildAccount(item.account);
          break;
        case 'UPDATE_ACCOUNT':
          await this.uploadChildAccount(item.account);
          break;
        case 'DELETE_ACCOUNT':
          await this.deleteFromCloud(item.childId);
          break;
      }
    }
    
    // Clear processed queue
    StorageService.remove(SYNC_QUEUE_KEY);
  }

  /**
   * Delete account from cloud
   */
  static async deleteFromCloud(childId) {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('child_accounts')
        .delete()
        .eq('child_id', childId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable/disable cloud sync
   */
  static setEnabled(enabled) {
    StorageService.set('makenna_cloud_sync_enabled', enabled);
    return StorageService.get('makenna_cloud_sync_enabled', false);
  }

  /**
   * Check if cloud sync is enabled
   */
  static isEnabled() {
    return StorageService.get('makenna_cloud_sync_enabled', false);
  }
}