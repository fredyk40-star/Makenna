/**
 * CloudSyncService - offline-first child account sync.
 *
 * Local storage is always the source of truth while offline. Writes are
 * queued, replayed on reconnect, and merged with cloud rows using preserved
 * timestamps so the newer record wins deterministically.
 */
import { supabase, isSupabaseConfigured } from './SupabaseService';
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';
import { SyncQueueService } from './SyncQueueService';

const SYNC_STATUS_KEY = 'makenna_sync_status_v1';
const ENABLED_KEY = 'makenna_cloud_sync_enabled';

const DEFAULT_STATUS = {
  enabled: false,
  configured: false,
  reason: null,
  lastSync: null,
  lastError: null,
  lastResult: null,
  pendingCount: 0,
  pendingChanges: false,
  syncing: false,
  online: true,
};

const listeners = new Set();

const timeOf = (account) => {
  const value = account?.updatedAt || account?.updated_at || account?.createdAt || 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const stableString = (value) => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableString).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableString(value[key])}`).join(',')}}`;
};

const envAllowsSync = () => {
  const flag = import.meta.env?.VITE_ENABLE_CLOUD_SYNC;
  return flag === undefined || flag === null || String(flag).toLowerCase() !== 'false';
};

export class CloudSyncService {
  /** Check configuration and refresh the stored status snapshot. */
  static init() {
    const configured = isSupabaseConfigured() && !!supabase;
    const stored = StorageService.get(ENABLED_KEY, true) !== false;
    const enabled = configured && stored && envAllowsSync();
    const reason = !configured
      ? 'Supabase not configured'
      : (!stored ? 'Cloud sync turned off in settings' : (!envAllowsSync() ? 'Cloud sync disabled by environment' : null));

    const status = this.updateSyncStatus({ enabled, configured, reason });
    return { enabled, configured, reason, status };
  }

  static subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /** Current reactive status, including live queue and connectivity state. */
  static getSyncStatus() {
    const stored = StorageService.get(SYNC_STATUS_KEY, {});
    const pendingCount = SyncQueueService.getPendingCount();
    return {
      ...DEFAULT_STATUS,
      ...stored,
      pendingCount,
      pendingChanges: pendingCount > 0,
      online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    };
  }

  static updateSyncStatus(updates = {}) {
    const next = {
      ...this.getSyncStatus(),
      ...updates,
    };
    next.pendingCount = SyncQueueService.getPendingCount();
    next.pendingChanges = next.pendingCount > 0;
    StorageService.set(SYNC_STATUS_KEY, next);
    listeners.forEach(listener => {
      try {
        listener(next);
      } catch (error) {
        console.warn('Sync status listener failed:', error);
      }
    });
    return next;
  }

  static isEnabled() {
    return envAllowsSync()
      && StorageService.get(ENABLED_KEY, true) !== false
      && isSupabaseConfigured();
  }

  static setEnabled(enabled) {
    StorageService.set(ENABLED_KEY, !!enabled);
    return this.init();
  }

  static toSyncPayload(account) {
    return {
      childId: account.childId,
      fullName: account.fullName,
      pinHash: account.pinHash,
      pinSet: account.pinSet,
      passwordHash: account.passwordHash || null,
      passwordSet: account.passwordSet || false,
      parentEmail: account.parentEmail || null,
      tempPasswordHash: account.tempPasswordHash || null,
      tempPasswordExpiresAt: account.tempPasswordExpiresAt || null,
      requiresCredentialReset: account.requiresCredentialReset || false,
      avatar: account.avatar,
      createdAt: account.createdAt,
      lastLogin: account.lastLogin,
      progress: account.progress || {},
      settings: account.settings || {},
      updatedAt: account.updatedAt || account.updated_at || account.createdAt || new Date().toISOString(),
      version: Number(account.version || 0),
    };
  }

  /**
   * Record a local change. Account writes are always queued so every created
   * account is persisted to the cloud as soon as Supabase is configured.
   */
  static queueAccountChange(type, account, childId = null) {
    if (type === 'DELETE_ACCOUNT') {
      const id = childId || account?.childId;
      SyncQueueService.recordDeletion(id);
      SyncQueueService.enqueue({ type, childId: id, payload: { childId: id } });
    } else {
      const payload = this.toSyncPayload(account);
      SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: payload.childId, payload });
    }

    return this.updateSyncStatus({ lastError: null });
  }

  /** Upload one account. Never reports success when Supabase rejects a write. */
  static async uploadChildAccount(account) {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    const payload = this.toSyncPayload(account);
    try {
      const { error } = await supabase
        .from('child_accounts')
        .upsert({
          child_id: payload.childId,
          full_name: payload.fullName,
          pin_hash: payload.pinHash,
          pin_set: payload.pinSet,
          password_hash: payload.passwordHash,
          password_set: payload.passwordSet,
          parent_email: payload.parentEmail,
          temp_password_hash: payload.tempPasswordHash,
          temp_password_expires_at: payload.tempPasswordExpiresAt,
          requires_credential_reset: payload.requiresCredentialReset,
          avatar: payload.avatar,
          created_at: payload.createdAt,
          last_login: payload.lastLogin,
          progress: payload.progress,
          settings: payload.settings,
          updated_at: payload.updatedAt,
        }, { onConflict: 'child_id' });

      if (error) throw error;
      return { success: true, childId: payload.childId };
    } catch (error) {
      console.error('Cloud upload failed:', error);
      return { success: false, error: error.message };
    }
  }

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

      const accounts = (data || []).map(item => ({
        childId: item.child_id,
        fullName: item.full_name,
        pinHash: item.pin_hash,
        pinSet: item.pin_set,
        passwordHash: item.password_hash || null,
        passwordSet: item.password_set || false,
        parentEmail: item.parent_email || null,
        tempPasswordHash: item.temp_password_hash || null,
        tempPasswordExpiresAt: item.temp_password_expires_at || null,
        requiresCredentialReset: item.requires_credential_reset || false,
        avatar: item.avatar,
        createdAt: item.created_at,
        lastLogin: item.last_login,
        progress: item.progress || {},
        settings: item.settings || {},
        updatedAt: item.updated_at || item.created_at,
        deletedAt: item.deleted_at || null,
        parentId: item.parent_id || null,
      }));

      return { success: true, accounts };
    } catch (error) {
      console.error('Cloud download failed:', error);
      return { success: false, error: error.message, accounts: [] };
    }
  }

  /**
   * Deterministic merge: newer timestamp wins; equal timestamps use source
   * rank (cloud over local) then a stable fingerprint as the final tie-break.
   */
  static mergeAccounts(local, cloud, tombstones = SyncQueueService.getTombstones()) {
    const merged = new Map();

    const consider = (account, sourceRank) => {
      if (!account?.childId) return;
      const id = String(account.childId).toLowerCase();
      const existing = merged.get(id);
      if (!existing) {
        merged.set(id, {
          ...account,
          childId: account.childId,
          updatedAt: account.updatedAt || account.createdAt || null,
          __sourceRank: sourceRank,
        });
        return;
      }

      const candidateTime = timeOf(account);
      const existingTime = timeOf(existing);
      let useCandidate = candidateTime > existingTime;

      if (candidateTime === existingTime) {
        if (sourceRank !== existing.__sourceRank) {
          useCandidate = sourceRank > existing.__sourceRank;
        } else {
          useCandidate = stableString(account) > stableString(existing);
        }
      }

      if (useCandidate) {
        merged.set(id, {
          ...account,
          childId: account.childId,
          updatedAt: account.updatedAt || account.createdAt || new Date(candidateTime).toISOString(),
          __sourceRank: sourceRank,
        });
      }
    };

    (Array.isArray(local) ? local : []).forEach(account => consider(account, 0));
    (Array.isArray(cloud) ? cloud : []).forEach(account => consider(account, 1));

    Object.entries(tombstones || {}).forEach(([childId, tombstone]) => {
      const id = String(childId).toLowerCase();
      const existing = merged.get(id);
      if (existing && new Date(tombstone.deletedAt).getTime() >= timeOf(existing)) {
        merged.delete(id);
      }
    });

    return Array.from(merged.values()).map(({ __sourceRank, ...account }) => account);
  }

  static async syncFromCloud() {
    const { enabled, reason } = this.init();
    if (!enabled) return { success: false, error: reason, accounts: [] };

    const result = await this.downloadChildAccounts();
    if (result.success) {
      const merged = this.mergeAccounts(ChildAccountService.getAllAccounts(), result.accounts);
      ChildAccountService.saveAllAccounts(merged);
      this.updateSyncStatus({ lastSync: new Date().toISOString(), lastError: null });
    } else {
      this.updateSyncStatus({ lastError: result.error });
    }

    return result;
  }

  static async syncToCloud() {
    const { enabled, reason } = this.init();
    if (!enabled) return { success: false, error: reason, count: 0 };

    const accounts = ChildAccountService.getAllAccounts();
    const failures = [];

    for (const account of accounts) {
      const result = await this.uploadChildAccount(account);
      if (!result.success) {
        failures.push({ childId: account.childId, error: result.error });
      }
    }

    const success = failures.length === 0;
    this.updateSyncStatus({
      lastSync: success ? new Date().toISOString() : undefined,
      lastError: success ? null : `${failures.length} account(s) failed to upload`,
      lastResult: { direction: 'push', success, count: accounts.length, failures },
    });

    return { success, count: accounts.length, failures };
  }

  /** Replay queued writes; failed operations stay queued with retry counts. */
  static async flushQueue() {
    const result = await SyncQueueService.flush(async operation => {
      if (operation.type === 'DELETE_ACCOUNT') return this.deleteFromCloud(operation.childId);
      if (operation.type === 'UPSERT_ACCOUNT') return this.uploadChildAccount(operation.payload);
      return { success: false, error: `Unknown operation: ${operation.type}` };
    });

    this.updateSyncStatus({
      lastResult: { direction: 'queue', ...result },
      lastError: result.success ? null : `${result.failed} queued change(s) still pending`,
    });
    return result;
  }

  static async processQueue() {
    return this.flushQueue();
  }

  /** Pull, merge and push the merged state — the main "Sync now" operation. */
  static async syncNow() {
    const { enabled, reason } = this.init();
    if (!enabled) return { success: false, error: reason };

    this.updateSyncStatus({ syncing: true, lastError: null });

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.updateSyncStatus({ syncing: false, lastError: 'Offline — changes are queued' });
      return { success: false, error: 'Offline — changes are queued', queued: true };
    }

    try {
      const queue = await this.flushQueue();
      const pull = await this.syncFromCloud();
      const push = pull.success ? await this.syncToCloud() : { success: false, count: 0, failures: [] };
      const success = queue.success && pull.success && push.success;

      this.updateSyncStatus({
        syncing: false,
        lastSync: success ? new Date().toISOString() : undefined,
        lastError: success ? null : 'Sync finished with pending issues',
        lastResult: { direction: 'full', success, queue, pulled: pull.accounts?.length || 0, pushed: push.count || 0 },
      });

      return {
        success,
        queued: queue.pending,
        pulled: pull.accounts?.length || 0,
        pushed: push.count || 0,
        error: success ? null : 'Sync finished with pending issues',
      };
    } catch (error) {
      this.updateSyncStatus({ syncing: false, lastError: error.message });
      return { success: false, error: error.message };
    }
  }

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
      return { success: true, childId };
    } catch (error) {
      console.error('Cloud delete failed:', error);
      return { success: false, error: error.message };
    }
  }

  static getStatus() {
    return this.getSyncStatus();
  }
}

export default CloudSyncService;
