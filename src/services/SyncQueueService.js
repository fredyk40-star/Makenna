/**
 * SyncQueueService - durable, deduplicated offline operation queue.
 *
 * Operations survive reloads, failures keep their place with backoff, and a
 * newer write to the same child replaces an older pending write.
 */
import { StorageService } from './StorageService';

const QUEUE_KEY = 'makenna_sync_queue_v1';
const TOMBSTONE_KEY = 'makenna_sync_tombstones_v1';
const MAX_OPERATIONS = 200;
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

  static getQueue() {
    const queue = StorageService.get(QUEUE_KEY, []);
    return Array.isArray(queue) ? queue : [];
  }

  static getPendingCount() {
    return this.getQueue().length;
  }

  /**
   * Add an operation. Repeating the same write replaces the old queued write
   * instead of replaying stale state on reconnect.
   */
  static enqueue({ type, childId, payload = {} }) {
    if (!type) return this.getQueue();

    const operation = {
      id: makeId(),
      type,
      childId: childId || payload.childId || null,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0,
      lastError: null,
      nextAttemptAt: null,
    };

    const key = operationKey(operation);
    const queue = this.getQueue().filter(item => operationKey(item) !== key);
    queue.push(operation);

    const trimmed = queue.slice(-MAX_OPERATIONS);
    StorageService.set(QUEUE_KEY, trimmed);
    notify();
    return trimmed;
  }

  /**
   * Process due operations in order. Successful operations are removed by ID
   * from a freshly read queue so writes enqueued during a request are preserved.
   */
  static async flush(handler, { now = Date.now() } = {}) {
    const snapshot = this.getQueue();
    if (snapshot.length === 0) {
      return { success: true, processed: 0, failed: 0, skipped: 0, pending: 0 };
    }

    const processedIds = new Set();
    const droppedIds = new Set();
    const retries = new Map();
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const operation of snapshot) {
      if (operation.nextAttemptAt && Date.parse(operation.nextAttemptAt) > now) {
        skipped += 1;
        continue;
      }

      try {
        const result = await handler(operation);
        if (result?.success === false) {
          throw new Error(result.error || 'Sync operation failed');
        }
        processed += 1;
        processedIds.add(operation.id);
      } catch (error) {
        failed += 1;
        const attempts = (operation.attempts || 0) + 1;
        if (attempts >= MAX_ATTEMPTS) {
          console.warn(`[SyncQueue] Dropping operation after ${attempts} attempts (${operation.type}):`, error.message);
          droppedIds.add(operation.id);
          continue;
        }
        const delay = Math.min(BACKOFF_BASE_MS * (2 ** (attempts - 1)), BACKOFF_MAX_MS);
        retries.set(operation.id, {
          attempts,
          lastError: error.message,
          nextAttemptAt: new Date(now + delay).toISOString(),
        });
      }
    }

    // Re-read: progress made while an await was in flight must not be erased.
    const current = this.getQueue();
    const remaining = current
      .filter(operation => !processedIds.has(operation.id) && !droppedIds.has(operation.id))
      .map(operation => (retries.has(operation.id)
        ? { ...operation, ...retries.get(operation.id) }
        : operation));

    StorageService.set(QUEUE_KEY, remaining);
    notify();

    return {
      success: failed === 0,
      processed,
      failed,
      skipped,
      pending: remaining.length,
    };
  }

  static clear() {
    StorageService.remove(QUEUE_KEY);
    notify();
  }

  /** Drop stale writes for a child that has been deleted locally. */
  static removeForChild(childId) {
    const id = String(childId || '').toLowerCase();
    if (!id) return 0;
    const queue = this.getQueue();
    const kept = queue.filter(operation => String(operation.childId || '').toLowerCase() !== id);
    StorageService.set(QUEUE_KEY, kept);
    notify();
    return queue.length - kept.length;
  }

  /** Deletions need a timestamp so an older cloud row cannot resurrect them. */
  static recordDeletion(childId, deletedAt = new Date().toISOString()) {
    if (!childId) return;
    const tombstones = StorageService.get(TOMBSTONE_KEY, {});
    tombstones[childId] = { deletedAt };
    StorageService.set(TOMBSTONE_KEY, tombstones);
  }

  static clearDeletion(childId) {
    if (!childId) return;
    const tombstones = StorageService.get(TOMBSTONE_KEY, {});
    delete tombstones[childId];
    StorageService.set(TOMBSTONE_KEY, tombstones);
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
    StorageService.set(TOMBSTONE_KEY, kept);
    return Object.keys(kept).length;
  }
}

export default SyncQueueService;
