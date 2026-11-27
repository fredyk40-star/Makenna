/**
 * SyncQueueService - durable, deduplicated offline operation queue.
 *
 * Operations survive reloads, failures keep their place with backoff, and a
 * newer write to the same child replaces an older pending write. Queue overflow
 * and exhausted operations are preserved in visible lists instead of being
 * silently discarded. The operation id is a client idempotency key; it is never
 * used as the server record version.
 */
import { StorageService } from './StorageService';

const QUEUE_KEY = 'makenna_sync_queue_v1';
const OVERFLOW_KEY = 'makenna_sync_queue_overflow_v1';
const FAILED_KEY = 'makenna_sync_failed_v1';
const TOMBSTONE_KEY = 'makenna_sync_tombstones_v1';
const MAX_OPERATIONS = 200;
const MAX_OVERFLOW_OPERATIONS = 200;
const MAX_FAILED_OPERATIONS = 100;
const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 60_000;

const listeners = new Set();

const makeId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// One pending write per child per operation type: the newest payload wins.
const operationKey = operation => `${operation.type}:${operation.childId || ''}`;

const notify = () => listeners.forEach(listener => {
  try {
    listener();
  } catch (error) {
    console.warn('Sync queue listener failed:', error);
  }
});

export class SyncQueueService {
  static subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  static _readArray(key) {
    const value = StorageService.get(key, []);
    return Array.isArray(value) ? value : [];
  }

  static _persist(key, value) {
    return StorageService.set(key, value);
  }

  static _normalize(operation) {
    if (!operation || typeof operation !== 'object') return null;
    return {
      ...operation,
      id: operation.id || makeId(),
      childId: operation.childId || operation.payload?.childId || null,
      timestamp: operation.timestamp || new Date().toISOString(),
      attempts: Math.max(0, Number(operation.attempts) || 0),
      lastError: operation.lastError || null,
      nextAttemptAt: operation.nextAttemptAt || null,
    };
  }

  static _dedupe(operations) {
    const byKey = new Map();
    for (const operation of operations) byKey.set(operationKey(operation), operation);
    return [...byKey.values()];
  }

  static getQueue() {
    const raw = this._readArray(QUEUE_KEY);
    const queue = this._dedupe(raw.map(operation => this._normalize(operation)).filter(Boolean));
    if (JSON.stringify(queue) !== JSON.stringify(raw)) this._persist(QUEUE_KEY, queue);
    return queue;
  }

  /** Older operations displaced by the active cap are kept for promotion. */
  static getOverflow() {
    const raw = this._readArray(OVERFLOW_KEY);
    const overflow = this._dedupe(raw.map(operation => this._normalize(operation)).filter(Boolean));
    if (JSON.stringify(overflow) !== JSON.stringify(raw)) this._persist(OVERFLOW_KEY, overflow);
    return overflow;
  }

  /** Exhausted operations are dead-lettered with their last error. */
  static getFailedOperations() {
    const raw = this._readArray(FAILED_KEY);
    const failed = raw.map(operation => this._normalize(operation)).filter(Boolean);
    if (JSON.stringify(failed) !== JSON.stringify(raw)) this._persist(FAILED_KEY, failed);
    return failed;
  }

  static getQueueStats() {
    const active = this.getQueue();
    const overflow = this.getOverflow();
    const failed = this.getFailedOperations();
    const now = Date.now();
    const isDue = operation => !operation.blocked
      && !operation.requiresAuth
      && (!operation.nextAttemptAt || Date.parse(operation.nextAttemptAt) <= now);
    const nextAttempts = active
      .map(operation => Date.parse(operation.nextAttemptAt))
      .filter(value => Number.isFinite(value) && value > now);
    const firstFailure = failed[0]?.lastError
      || active.find(operation => operation.lastError)?.lastError
      || null;

    return {
      pending: active.length + overflow.length,
      active: active.length,
      overflow: overflow.length,
      ready: active.filter(isDue).length,
      blocked: active.filter(operation => operation.blocked || operation.requiresAuth).length,
      failed: failed.length,
      droppedCount: failed.length,
      nextRetryAt: nextAttempts.length ? new Date(Math.min(...nextAttempts)).toISOString() : null,
      lastFailure: firstFailure,
    };
  }

  /**
   * Add an operation. Repeating the same write replaces the old queued write
   * instead of replaying stale state on reconnect. New writes get a new stable
   * client operation id; retries keep the id already persisted in the queue.
   */
  static enqueue({ type, childId, payload = {}, id = null }) {
    if (!type) return this.getQueue();

    const operation = this._normalize({
      id: id || makeId(),
      type,
      childId: childId || payload.childId || null,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0,
      lastError: null,
      nextAttemptAt: null,
    });

    const key = operationKey(operation);
    const active = this.getQueue().filter(item => operationKey(item) !== key);
    const overflow = this.getOverflow().filter(item => operationKey(item) !== key);
    active.push(operation);

    const evicted = active.length > MAX_OPERATIONS
      ? active.slice(0, active.length - MAX_OPERATIONS)
      : [];
    const trimmedActive = active.slice(-MAX_OPERATIONS);
    const combinedOverflow = this._dedupe([...overflow, ...evicted]).slice(-MAX_OVERFLOW_OPERATIONS);

    this._persist(QUEUE_KEY, trimmedActive);
    this._persist(OVERFLOW_KEY, combinedOverflow);
    notify();
    return trimmedActive;
  }

  /** Move oldest overflow operations back into the active queue when space frees. */
  static _promoteOverflow() {
    const active = this.getQueue();
    const overflow = this.getOverflow();
    const activeKeys = new Set(active.map(operationKey));
    const candidates = overflow.filter(operation => !activeKeys.has(operationKey(operation)));
    const room = MAX_OPERATIONS - active.length;
    const promoted = room > 0 ? candidates.slice(0, room) : [];
    const remaining = candidates.slice(promoted.length);

    if (promoted.length || remaining.length !== overflow.length) {
      this._persist(QUEUE_KEY, [...promoted, ...active]);
      this._persist(OVERFLOW_KEY, remaining);
      notify();
    }
    return [...promoted, ...active];
  }

  /**
   * Process due operations in order. Successful operations are removed by ID
   * from a freshly read queue so writes enqueued during a request are preserved.
   */
  static async flush(handler, { now = Date.now() } = {}) {
    const snapshot = this._promoteOverflow();
    if (snapshot.length === 0) {
      return {
        success: true, processed: 0, failed: 0, skipped: 0, blocked: 0,
        dropped: 0, pending: this.getOverflow().length, storageError: null,
      };
    }

    const processedIds = new Set();
    const droppedIds = new Set();
    const retries = new Map();
    const newlyFailed = [];
    let processed = 0;
    let failed = 0;
    let skipped = 0;
    let blocked = 0;
    let dropped = 0;

    for (const operation of snapshot) {
      if (operation.blocked || operation.requiresAuth) {
        blocked += 1;
        continue;
      }
      if (operation.nextAttemptAt && Date.parse(operation.nextAttemptAt) > now) {
        skipped += 1;
        continue;
      }

      try {
        const result = await handler(operation);
        if (result?.success === false) {
          const error = new Error(result.error || 'Sync operation failed');
          error.requiresAuth = !!(result.requiresAuth || result.unauthenticated || result.skippedCloud);
          throw error;
        }
        processed += 1;
        processedIds.add(operation.id);
      } catch (error) {
        failed += 1;
        const attempts = (operation.attempts || 0) + 1;
        if (error.requiresAuth) {
          blocked += 1;
          retries.set(operation.id, {
            attempts,
            lastError: error.message,
            nextAttemptAt: null,
            blocked: true,
            requiresAuth: true,
          });
        } else if (attempts >= MAX_ATTEMPTS) {
          dropped += 1;
          droppedIds.add(operation.id);
          newlyFailed.push({
            ...operation,
            attempts,
            lastError: error.message,
            failedAt: new Date(now).toISOString(),
            reason: 'Maximum retry attempts reached',
          });
        } else {
          const delay = Math.min(BACKOFF_BASE_MS * (2 ** (attempts - 1)), BACKOFF_MAX_MS);
          retries.set(operation.id, {
            attempts,
            lastError: error.message,
            nextAttemptAt: new Date(now + delay).toISOString(),
          });
        }
      }
    }

    // Re-read: progress made while an await was in flight must not be erased.
    const current = this.getQueue();
    const remaining = current
      .filter(operation => !processedIds.has(operation.id) && !droppedIds.has(operation.id))
      .map(operation => (retries.has(operation.id)
        ? { ...operation, ...retries.get(operation.id) }
        : operation));

    const failedStore = [...newlyFailed, ...this.getFailedOperations()].slice(0, MAX_FAILED_OPERATIONS);
    const queueSaved = this._persist(QUEUE_KEY, remaining);
    const failedSaved = !newlyFailed.length || this._persist(FAILED_KEY, failedStore);
    const storageError = (!queueSaved || !failedSaved)
      ? 'Could not save sync queue state on this device.' : null;
    notify();

    return {
      success: failed === 0 && !storageError,
      processed,
      failed,
      skipped,
      blocked,
      dropped,
      pending: this.getQueue().length + this.getOverflow().length,
      storageError,
    };
  }

  static clear() {
    this._persist(QUEUE_KEY, []);
    this._persist(OVERFLOW_KEY, []);
    this._persist(FAILED_KEY, []);
    notify();
  }

  /** Drop stale writes for a child that has been deleted locally. */
  static removeForChild(childId) {
    const id = String(childId || '').toLowerCase();
    if (!id) return 0;
    const matches = operation => String(operation.childId || '').toLowerCase() === id;
    const queue = this.getQueue();
    const overflow = this.getOverflow();
    const failed = this.getFailedOperations();
    const kept = queue.filter(operation => !matches(operation));
    const keptOverflow = overflow.filter(operation => !matches(operation));
    const keptFailed = failed.filter(operation => !matches(operation));
    const removed = queue.length - kept.length + overflow.length - keptOverflow.length;
    this._persist(QUEUE_KEY, kept);
    this._persist(OVERFLOW_KEY, keptOverflow);
    if (failed.length !== keptFailed.length) this._persist(FAILED_KEY, keptFailed);
    notify();
    return removed;
  }

  /** Move a dead-lettered operation back into the active queue for another try. */
  static retryFailed(id) {
    const failed = this.getFailedOperations();
    const target = failed.find(operation => operation.id === id);
    if (!target) return false;
    const queue = this.getQueue().filter(operation => operation.id !== id);
    queue.push({
      ...target,
      attempts: 0,
      lastError: null,
      nextAttemptAt: null,
      blocked: false,
      requiresAuth: false,
      failedAt: null,
      reason: null,
    });
    this._persist(QUEUE_KEY, queue.slice(-MAX_OPERATIONS));
    this._persist(FAILED_KEY, failed.filter(operation => operation.id !== id));
    notify();
    return true;
  }

  static clearFailed() {
    this._persist(FAILED_KEY, []);
    notify();
  }

  /** Deletions need a timestamp so an older cloud row cannot resurrect them. */
  static recordDeletion(childId, deletedAt = new Date().toISOString()) {
    if (!childId) return;
    const tombstones = StorageService.get(TOMBSTONE_KEY, {});
    tombstones[childId] = { deletedAt };
    this._persist(TOMBSTONE_KEY, tombstones);
    notify();
  }

  static clearDeletion(childId) {
    if (!childId) return;
    const tombstones = StorageService.get(TOMBSTONE_KEY, {});
    delete tombstones[childId];
    this._persist(TOMBSTONE_KEY, tombstones);
    notify();
  }

  static getTombstones() {
    const tombstones = StorageService.get(TOMBSTONE_KEY, {});
    return tombstones && typeof tombstones === 'object' ? tombstones : {};
  }

  static pruneTombstones(days = 30) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const tombstones = this.getTombstones();
    const kept = Object.fromEntries(
      Object.entries(tombstones).filter(([, value]) => new Date(value.deletedAt).getTime() > cutoff)
    );
    this._persist(TOMBSTONE_KEY, kept);
    notify();
    return Object.keys(kept).length;
  }
}

export default SyncQueueService;
