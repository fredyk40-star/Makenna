/**
 * SyncQueueService - durable, deduplicated offline operation queue.
 *
 * Operations survive reloads, failures keep their place, and a newer write to
 * the same child replaces an older pending write (last write wins).
 */
import { StorageService } from './StorageService';

const QUEUE_KEY = 'makenna_sync_queue_v1';
const TOMBSTONE_KEY = 'makenna_sync_tombstones_v1';
const MAX_OPERATIONS = 200;
const MAX_ATTEMPTS = 5;

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
   * Process operations in order. Only successful operations are removed.
   */
  static async flush(handler) {
    const queue = this.getQueue();
    if (queue.length === 0) {
      return { success: true, processed: 0, failed: 0, pending: 0 };
    }

    const remaining = [];
    let processed = 0;
    let failed = 0;

    for (const operation of queue) {
      try {
        const result = await handler(operation);
        if (result?.success === false) {
          throw new Error(result.error || 'Sync operation failed');
        }
        processed += 1;
      } catch (error) {
        failed += 1;
        remaining.push({
          ...operation,
          attempts: (operation.attempts || 0) + 1,
          lastError: error.message,
          giveUp: (operation.attempts || 0) + 1 >= MAX_ATTEMPTS,
        });
      }
    }

    StorageService.set(QUEUE_KEY, remaining);
    notify();

    return {
      success: failed === 0,
      processed,
      failed,
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
