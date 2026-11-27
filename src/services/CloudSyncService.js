/**
 * CloudSyncService - offline-first child account sync through serverless APIs.
 *
 * Local storage remains the source of truth while offline. Writes are queued
 * and replayed on reconnect. All cloud reads/writes go through /api/child-sync
 * with a signed device token, so the browser never needs anon database access
 * and never downloads credential hashes.
 */
import { StorageService } from './StorageService';
import { ChildAccountService, postApi } from './ChildAccountService';
import { SyncQueueService } from './SyncQueueService';
import { collectSyncedLocalData, restoreSyncedLocalData } from './SyncedLocalData';

const SYNC_STATUS_KEY = 'makenna_sync_status_v1';
const ENABLED_KEY = 'makenna_cloud_sync_enabled';
const DEVELOPER_SESSION_KEY = 'makenna_dev_session_token_v1';

const DEFAULT_STATUS = {
  enabled: false,
  configured: true,
  reason: null,
  lastSync: null,
  lastError: null,
  lastResult: null,
  pendingCount: 0,
  pendingChanges: false,
  failedCount: 0,
  blockedCount: 0,
  overflowCount: 0,
  droppedCount: 0,
  nextRetryAt: null,
  lastFailure: null,
  syncing: false,
  online: true,
};

const AUTO_SYNC_DEBOUNCE_MS = 1200;
const AUTO_SYNC_INTERVAL_MS = 60_000;

const listeners = new Set();
const autoSync = {
  started: false,
  debounceTimer: null,
  intervalTimer: null,
  inFlight: null,
  reschedule: false,
  unsubscribeQueue: null,
};

const handleOnline = () => CloudSyncService.requestSync('online');
const handleOffline = () => CloudSyncService.updateSyncStatus({
  syncing: false,
  online: false,
  lastError: 'Offline — changes are queued',
});
const handleFocus = () => CloudSyncService.requestSync('focus');
const handleVisibility = () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    CloudSyncService.requestSync('visible');
  }
};

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

const isPlainObject = value => value && typeof value === 'object' && !Array.isArray(value);

const prefersAccount = (candidate, candidateRank, existing, existingRank) => {
  const candidateTime = timeOf(candidate);
  const existingTime = timeOf(existing);
  if (candidateTime !== existingTime) return candidateTime > existingTime;
  if (candidateRank !== existingRank) return candidateRank > existingRank;
  return stableString(candidate) > stableString(existing);
};

const envAllowsSync = () => {
  const flag = import.meta.env?.VITE_ENABLE_CLOUD_SYNC;
  return flag === undefined || flag === null || String(flag).toLowerCase() !== 'false';
};

export class CloudSyncService {
  /** Check configuration and refresh the stored status snapshot. */
  static init() {
    const stored = StorageService.get(ENABLED_KEY, true) !== false;
    const enabled = stored && envAllowsSync();
    const reason = !stored
      ? 'Cloud sync turned off in settings'
      : (!envAllowsSync() ? 'Cloud sync disabled by environment' : null);

    const status = this.updateSyncStatus({ enabled, configured: true, reason });
    return { enabled, configured: true, reason, status };
  }

  static subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /**
   * Automatic sync is event-driven, not click-driven:
   * - a local change queues an immediate debounced sync
   * - coming back online / focusing the tab triggers a sync
   * - a slow background poll picks up changes made on other devices
   */
  static startAutoSync() {
    if (typeof window === 'undefined') return;
    this.init();
    if (autoSync.started) return;
    autoSync.started = true;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    autoSync.unsubscribeQueue = SyncQueueService.subscribe(() => this.updateSyncStatus({}));
    autoSync.intervalTimer = setInterval(
      () => CloudSyncService.requestSync('interval'),
      AUTO_SYNC_INTERVAL_MS
    );
  }

  static stopAutoSync() {
    if (!autoSync.started) return;
    if (autoSync.debounceTimer) clearTimeout(autoSync.debounceTimer);
    if (autoSync.intervalTimer) clearInterval(autoSync.intervalTimer);
    if (autoSync.unsubscribeQueue) autoSync.unsubscribeQueue();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    }
    autoSync.debounceTimer = null;
    autoSync.intervalTimer = null;
    autoSync.unsubscribeQueue = null;
    autoSync.inFlight = null;
    autoSync.reschedule = false;
    autoSync.started = false;
  }

  static clearScheduledSync() {
    if (autoSync.debounceTimer) {
      clearTimeout(autoSync.debounceTimer);
      autoSync.debounceTimer = null;
    }
  }

  /** Request a full sync without letting overlapping requests pile up. */
  static requestSync(reason = 'auto') {
    if (!this.isEnabled()) return Promise.resolve(false);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.updateSyncStatus({ syncing: false, lastError: 'Offline — changes are queued' });
      return Promise.resolve(false);
    }

    this.clearScheduledSync();

    if (autoSync.inFlight) {
      // An event happened while a sync was already running. One follow-up is
      // enough; it runs after the current request settles.
      if (reason !== 'interval') autoSync.reschedule = true;
      return autoSync.inFlight;
    }

    autoSync.inFlight = this.syncNow()
      .catch(error => {
        console.warn('Automatic sync failed:', error.message);
        return { success: false, error: error.message };
      })
      .finally(() => {
        autoSync.inFlight = null;
        if (autoSync.reschedule) {
          autoSync.reschedule = false;
          this.scheduleAutoSync(250);
        }
      });

    return autoSync.inFlight;
  }

  /** Schedule a debounced sync after the newest local change. */
  static scheduleAutoSync(delay = AUTO_SYNC_DEBOUNCE_MS) {
    if (!this.isEnabled()) return;
    this.startAutoSync();

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.updateSyncStatus({ syncing: false, lastError: 'Offline — changes are queued' });
      return;
    }

    if (autoSync.inFlight) {
      autoSync.reschedule = true;
      return;
    }

    this.clearScheduledSync();
    autoSync.debounceTimer = setTimeout(() => {
      autoSync.debounceTimer = null;
      this.requestSync('queued-change');
    }, delay);
  }

  static getSyncStatus() {
    const stored = StorageService.get(SYNC_STATUS_KEY, {});
    const stats = SyncQueueService.getQueueStats();
    return {
      ...DEFAULT_STATUS,
      ...stored,
      pendingCount: stats.pending,
      pendingChanges: stats.pending > 0,
      failedCount: stats.failed,
      blockedCount: stats.blocked,
      overflowCount: stats.overflow,
      droppedCount: stats.droppedCount,
      nextRetryAt: stats.nextRetryAt,
      lastFailure: stats.lastFailure,
      online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    };
  }

  static updateSyncStatus(updates = {}) {
    const next = {
      ...this.getSyncStatus(),
      ...updates,
    };
    const stats = SyncQueueService.getQueueStats();
    next.pendingCount = stats.pending;
    next.pendingChanges = stats.pending > 0;
    next.failedCount = stats.failed;
    next.blockedCount = stats.blocked;
    next.overflowCount = stats.overflow;
    next.droppedCount = stats.droppedCount;
    next.nextRetryAt = stats.nextRetryAt;
    next.lastFailure = stats.lastFailure;
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
      && StorageService.get(ENABLED_KEY, true) !== false;
  }

  static setEnabled(enabled) {
    StorageService.set(ENABLED_KEY, !!enabled);
    const result = this.init();
    if (result.enabled) {
      this.startAutoSync();
      this.requestSync('enabled');
    } else {
      this.stopAutoSync();
    }
    return result;
  }

  /** Public fields only — hashes stay on the server. */
  static toSyncPayload(account) {
    return {
      childId: account.childId,
      fullName: account.fullName,
      parentEmail: account.parentEmail || null,
      avatar: account.avatar,
      createdAt: account.createdAt,
      lastLogin: account.lastLogin,
      progress: account.progress || {},
      settings: {
        ...(account.settings || {}),
        // Legacy screens keep progress outside the account record. Carry it
        // in settings so it survives a restore on another device.
        __localData: collectSyncedLocalData(),
      },
      updatedAt: account.updatedAt || account.createdAt || new Date().toISOString(),
      version: Number(account.version || 0),
    };
  }

  static queueAccountChange(type, account, childId = null, token = null) {
    if (type === 'DELETE_ACCOUNT') {
      const id = childId || account?.childId;
      // A child removed locally must not be re-uploaded by an older queued write.
      SyncQueueService.removeForChild(id);
      SyncQueueService.recordDeletion(id);
      SyncQueueService.enqueue({ type, childId: id, payload: { childId: id, token } });
    } else {
      const payload = this.toSyncPayload(account);
      SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: payload.childId, payload });
    }

    this.updateSyncStatus({ lastError: null });
    // Every local child write is followed by an automatic cloud flush. The
    // short debounce collapses rapid progress updates into one request.
    this.scheduleAutoSync();
    return this.getSyncStatus();
  }

  static async uploadChildAccount(account, operationId = null) {
    const payload = this.toSyncPayload(account);
    try {
      const result = await postApi('child-sync', {
        action: 'push',
        tokens: ChildAccountService.getChildTokens(),
        accounts: [payload],
        // Client retry key. The server owns version/updatedAt independently.
        ...(operationId ? { operationId } : {}),
      });
      const failure = result.failures?.[0];
      if (failure) return { success: false, error: failure.error };
      return { success: true, childId: payload.childId };
    } catch (error) {
      const failure = error.data?.failures?.find(item => item.childId === payload.childId)
        || error.data?.failures?.[0];
      const message = failure?.error || error.message;
      console.error('Cloud upload failed:', { childId: payload.childId, message });
      return { success: false, error: message };
    }
  }

  static async downloadChildAccounts() {
    try {
      const result = await postApi('child-sync', {
        action: 'pull',
        tokens: ChildAccountService.getChildTokens(),
      });
      return { success: true, accounts: result.accounts || [] };
    } catch (error) {
      console.error('Cloud download failed:', error.message);
      return { success: false, error: error.message, accounts: [] };
    }
  }

  /**
   * Deterministic merge: scalar fields come from the newer account, while
   * progress/settings keys contributed by only one side are preserved. This
   * avoids losing an offline edit on one device when another device syncs a
   * newer but otherwise unrelated change.
   */
  static mergeAccounts(local, cloud, tombstones = SyncQueueService.getTombstones()) {
    const byId = (accounts, sourceRank) => {
      const map = new Map();
      (Array.isArray(accounts) ? accounts : []).forEach(account => {
        if (!account?.childId) return;
        const id = String(account.childId).toLowerCase();
        const existing = map.get(id);
        if (!existing || prefersAccount(account, sourceRank, existing.account, existing.rank)) {
          map.set(id, { account, rank: sourceRank });
        }
      });
      return map;
    };

    const localById = byId(local, 0);
    const cloudById = byId(cloud, 1);
    const ids = new Set([...localById.keys(), ...cloudById.keys()]);
    const result = new Map();

    ids.forEach(id => {
      const localEntry = localById.get(id);
      const cloudEntry = cloudById.get(id);

      if (!localEntry || !cloudEntry) {
        const entry = localEntry || cloudEntry;
        const account = entry.account;
        result.set(id, {
          ...account,
          childId: account.childId,
          updatedAt: account.updatedAt || account.createdAt || null,
        });
        return;
      }

      const winnerEntry = prefersAccount(cloudEntry.account, cloudEntry.rank, localEntry.account, localEntry.rank)
        ? cloudEntry
        : localEntry;
      const loserEntry = winnerEntry === cloudEntry ? localEntry : cloudEntry;
      const winner = winnerEntry.account;
      const loser = loserEntry.account;

      const mergeSection = (key) => {
        const winnerValue = winner[key];
        const loserValue = loser[key];
        if (!isPlainObject(winnerValue) || !isPlainObject(loserValue)) {
          return winnerValue ?? loserValue ?? {};
        }
        const merged = { ...loserValue, ...winnerValue };
        // Keep one nested level from the loser: multi-device progress often
        // diverges inside a shared key, not only between top-level keys.
        Object.keys(loserValue).forEach(childKey => {
          if (isPlainObject(loserValue[childKey]) && isPlainObject(winnerValue[childKey])) {
            merged[childKey] = { ...loserValue[childKey], ...winnerValue[childKey] };
          }
        });
        return merged;
      };

      const account = {
        ...winner,
        childId: winner.childId,
        progress: mergeSection('progress'),
        settings: mergeSection('settings'),
        updatedAt: winner.updatedAt || winner.createdAt || null,
        version: Math.max(Number(winner.version || 0), Number(loser.version || 0)),
      };

      const progressChanged = stableString(account.progress) !== stableString(winner.progress || {});
      const settingsChanged = stableString(account.settings) !== stableString(winner.settings || {});
      if (progressChanged || settingsChanged) {
        // Ensure the merged key set is newer than the cloud row so a push is
        // accepted instead of skipped by the server's timestamp guard.
        account.updatedAt = new Date(Math.max(Date.now(), timeOf(winner)) + 1).toISOString();
        account.version += 1;
      }

      result.set(id, account);
    });

    Object.entries(tombstones || {}).forEach(([childId, tombstone]) => {
      const id = String(childId).toLowerCase();
      const existing = result.get(id);
      if (existing && new Date(tombstone.deletedAt).getTime() >= timeOf(existing)) {
        result.delete(id);
      }
    });

    return Array.from(result.values());
  }

  static async syncFromCloud() {
    const { enabled, reason } = this.init();
    if (!enabled) return { success: false, error: reason, accounts: [] };

    const result = await this.downloadChildAccounts();
    if (result.success) {
      const merged = this.mergeAccounts(ChildAccountService.getAllAccounts(), result.accounts);
      ChildAccountService.saveAllAccounts(merged);
      merged.forEach(account => restoreSyncedLocalData(account.settings?.__localData));
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
      if (operation.type === 'DELETE_ACCOUNT') {
        return this.deleteFromCloud(
          operation.childId,
          operation.payload?.token,
          operation.id,
        );
      }
      if (operation.type === 'UPSERT_ACCOUNT') {
        return this.uploadChildAccount(operation.payload, operation.id);
      }
      return { success: false, error: `Unknown operation: ${operation.type}` };
    });

    const stats = SyncQueueService.getQueueStats();
    const firstFailure = stats.lastFailure;
    const details = [];
    if (result.dropped) details.push(`${result.dropped} failed change(s) need review`);
    if (stats.blocked) details.push(`${stats.blocked} change(s) need authorisation`);
    if (result.failed && !result.dropped) details.push(`${result.failed} queued change(s) still pending`);
    this.updateSyncStatus({
      lastResult: { direction: 'queue', ...result, ...stats },
      lastError: result.success && !stats.failed && !stats.blocked
        ? null
        : `${details.join('; ') || 'Sync needs attention'}${firstFailure ? `: ${firstFailure}` : ''}`,
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
      const firstError = SyncQueueService.getQueueStats().lastFailure
        || pull.error
        || push.failures?.[0]?.error
        || 'Sync finished with pending issues';

      this.updateSyncStatus({
        syncing: false,
        lastSync: success ? new Date().toISOString() : undefined,
        lastError: success ? null : firstError,
        lastResult: { direction: 'full', success, queue, pulled: pull.accounts?.length || 0, pushed: push.count || 0 },
      });

      return {
        success,
        queued: queue.pending,
        pulled: pull.accounts?.length || 0,
        pushed: push.count || 0,
        error: success ? null : firstError,
      };
    } catch (error) {
      this.updateSyncStatus({ syncing: false, lastError: error.message });
      return { success: false, error: error.message };
    }
  }

  static async deleteFromCloud(childId, token = null, operationId = null) {
    try {
      const normalized = ChildAccountService.normalizeChildId(childId);
      const tokens = ChildAccountService.getChildTokens();
      if (token) tokens[normalized] = token;
      const childToken = tokens[normalized] || tokens[childId];
      const developerToken = StorageService.get(DEVELOPER_SESSION_KEY, null);

      if (!childToken && !developerToken) {
        // Without a device token or developer session this device cannot prove
        // it may delete the cloud row. Keep the operation queued for retry.
        return {
          success: false,
          childId,
          skippedCloud: true,
          requiresAuth: true,
          error: 'Cloud deletion needs a signed child or developer session.',
        };
      }

      await postApi('child-sync', {
        action: 'delete',
        childId,
        tokens,
        // A developer removing an account may not have the child's device
        // token, so the signed developer session is an alternate authority.
        developerToken,
        ...(operationId ? { operationId } : {}),
      });
      return { success: true, childId };
    } catch (error) {
      console.warn('Cloud delete failed:', error.message);
      const isAuthError = error.message?.includes('no longer authorised')
        || error.message?.includes('unauthorised')
        || error.message?.includes('unauthorized')
        || error.message?.includes('Developer session is invalid')
        || error.message?.includes('401');
      if (isAuthError) {
        return {
          success: false,
          childId,
          unauthenticated: true,
          requiresAuth: true,
          error: 'This device is no longer authorised to delete that cloud account.',
        };
      }
      return { success: false, error: error.message };
    }
  }

  static getStatus() {
    return this.getSyncStatus();
  }
}

export default CloudSyncService;
