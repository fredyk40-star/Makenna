import { beforeEach, describe, expect, it } from 'vitest';
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

  it('removes only successful operations and records failures', async () => {
    SyncQueueService.enqueue({ type: 'UPSERT_ACCOUNT', childId: 'kid-1', payload: { childId: 'kid-1' } });
    SyncQueueService.enqueue({ type: 'DELETE_ACCOUNT', childId: 'kid-2', payload: {} });

    const result = await SyncQueueService.flush(async operation => (
      operation.type === 'UPSERT_ACCOUNT'
        ? { success: true }
        : { success: false, error: 'Network unavailable' }
    ));

    const queue = SyncQueueService.getQueue();
    expect(result.success).toBe(false);
    expect(result.processed).toBe(1);
    expect(queue).toHaveLength(1);
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].lastError).toBe('Network unavailable');
  });

  it('stores deletion tombstones with a timestamp', () => {
    SyncQueueService.recordDeletion('kid-3', '2026-01-05T00:00:00.000Z');
    expect(SyncQueueService.getTombstones()['kid-3'].deletedAt).toBe('2026-01-05T00:00:00.000Z');
  });
});
