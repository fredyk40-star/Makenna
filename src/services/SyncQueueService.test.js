import { beforeEach, describe, expect, it, vi } from 'vitest';
import SyncQueueService from './SyncQueueService';

beforeEach(() => {
  localStorage.clear();
});

describe('SyncQueueService', () => {
  it('deduplicates repeated writes and keeps the newest payload', () => {
    SyncQueueService.enqueue({
      type: 'UPSERT_ACCOUNT',
      childId: 'kid-1',
      payload: { childId: 'kid-1', progress: { letters: 1 } },
    });
    SyncQueueService.enqueue({
      type: 'UPSERT_ACCOUNT',
      childId: 'kid-1',
      payload: { childId: 'kid-1', progress: { letters: 2 } },
    });

    const queue = SyncQueueService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.progress.letters).toBe(2);
  });

  it('removes only successful operations and backs off failures', async () => {
    const now = Date.parse('2026-01-05T00:00:00.000Z');
    SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: 'kid-1', payload: { childId: 'kid-1' } });
    SyncQueueService.enqueue({ type: 'DELETE_ACCOUNT', childId: 'kid-2', payload: {} });

    const result = await SyncQueueService.flush(async operation => (
      operation.type === 'UPSERT_ACCOUNT'
        ? { success: true }
        : { success: false, error: 'Network unavailable' }
    ), { now });

    const queue = SyncQueueService.getQueue();
    expect(result.success).toBe(false);
    expect(result.processed).toBe(1);
    expect(queue).toHaveLength(1);
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].lastError).toBe('Network unavailable');
    expect(Date.parse(queue[0].nextAttemptAt)).toBe(now + 2000);
  });

  it('does not retry a backed-off operation before it is due', async () => {
    const now = Date.parse('2026-01-05T00:00:00.000Z');
    SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: 'kid-1', payload: {} });
    await SyncQueueService.flush(async () => ({ success: false, error: 'Offline' }), { now });

    const handler = vi.fn(async () => ({ success: true }));
    const beforeDue = await SyncQueueService.flush(handler, { now: now + 1000 });

    expect(beforeDue.skipped).toBe(1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('preserves operations enqueued while a sync is in flight', async () => {
    SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: 'kid-1', payload: {} });
    let resolveFirst;
    const firstCall = new Promise(resolve => { resolveFirst = resolve; });
    let calls = 0;

    const flush = SyncQueueService.flush(async () => {
      calls += 1;
      if (calls === 1) {
        SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: 'kid-2', payload: {} });
        await firstCall;
      }
      return { success: true };
    });

    resolveFirst();
    await flush;

    const queue = SyncQueueService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].childId).toBe('kid-2');
  });

  it('stores deletion tombstones with a timestamp', () => {
    SyncQueueService.recordDeletion('kid-3', '2026-01-05T00:00:00.000Z');
    expect(SyncQueueService.getTombstones()['kid-3'].deletedAt).toBe('2026-01-05T00:00:00.000Z');
  });

  it('drops operations that exceed MAX_ATTEMPTS to prevent infinite retry loops', async () => {
    SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: 'kid-retry', payload: {} });
    const start = Date.parse('2026-01-05T00:00:00.000Z');
    for (let i = 0; i < 5; i += 1) {
      await SyncQueueService.flush(
        async () => ({ success: false, error: 'Persistent server error' }),
        { now: start + (i * 60_000) },
      );
    }
    expect(SyncQueueService.getQueue()).toHaveLength(0);
  });

  it('keeps unauthorised deletes queued so cloud erasure can be retried', async () => {
    SyncQueueService.enqueue({ type: 'DELETE_ACCOUNT', childId: 'kid-unauth', payload: {} });
    const result = await SyncQueueService.flush(
      async () => ({ success: false, error: 'This device is no longer authorised for that child' }),
      { now: Date.parse('2026-01-05T00:00:00.000Z') },
    );

    expect(result.success).toBe(false);
    expect(SyncQueueService.getQueue()).toHaveLength(1);
  });
});
