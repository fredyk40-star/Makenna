import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CloudSyncService } from './CloudSyncService';
import SyncQueueService from './SyncQueueService';
import { StorageService } from './StorageService';
import { apiState, resetApiMock } from '../test/apiMock.js';

beforeEach(() => {
  localStorage.clear();
  resetApiMock();
});

afterEach(() => {
  CloudSyncService.stopAutoSync();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CloudSyncService conflict resolution', () => {
  it('lets the newer timestamp win regardless of array order', () => {
    const local = [{
      childId: 'kid-1',
      fullName: 'Local name',
      updatedAt: '2026-01-02T00:00:00.000Z',
      progress: { letters: 4 },
    }];
    const cloud = [{
      childId: 'KID-1',
      fullName: 'Cloud name',
      updatedAt: '2026-01-03T00:00:00.000Z',
      progress: { letters: 9 },
    }];

    const merged = CloudSyncService.mergeAccounts(local, cloud, {});

    expect(merged).toHaveLength(1);
    expect(merged[0].fullName).toBe('Cloud name');
    expect(merged[0].progress.letters).toBe(9);
  });

  it('preserves progress keys that exist on only one side', () => {
    const merged = CloudSyncService.mergeAccounts(
      [{
        childId: 'kid-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
        progress: { letters: 4, offlineShapeLesson: { completed: true } },
      }],
      [{
        childId: 'kid-1',
        updatedAt: '2026-01-03T00:00:00.000Z',
        progress: { letters: 9 },
      }],
      {},
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].progress.letters).toBe(9);
    expect(merged[0].progress.offlineShapeLesson).toEqual({ completed: true });
  });

  it('breaks equal timestamps deterministically in favour of cloud', () => {
    const timestamp = '2026-01-02T00:00:00.000Z';
    const merged = CloudSyncService.mergeAccounts(
      [{ childId: 'kid-1', fullName: 'Local', updatedAt: timestamp }],
      [{ childId: 'kid-1', fullName: 'Cloud', updatedAt: timestamp }],
      {},
    );

    expect(merged[0].fullName).toBe('Cloud');
  });

  it('does not resurrect deleted children from an older cloud row', () => {
    const merged = CloudSyncService.mergeAccounts(
      [],
      [{ childId: 'kid-1', fullName: 'Cloud', updatedAt: '2026-01-01T00:00:00.000Z' }],
      { 'kid-1': { deletedAt: '2026-01-02T00:00:00.000Z' } },
    );

    expect(merged).toHaveLength(0);
  });
});

describe('CloudSyncService queue integration', () => {
  it('queues local account changes and reports the pending count in status', () => {
    StorageService.set('makenna_cloud_sync_enabled', true);

    CloudSyncService.queueAccountChange('UPSERT_ACCOUNT', {
      childId: 'kid-4',
      fullName: 'Ama',
      updatedAt: new Date().toISOString(),
    });

    const status = CloudSyncService.getSyncStatus();
    expect(status.pendingCount).toBe(1);
    expect(status.pendingChanges).toBe(true);
    expect(SyncQueueService.getQueue()[0].type).toBe('UPSERT_ACCOUNT');
  });

  it('keeps the device token for a queued delete and drops stale writes', () => {
    StorageService.set('makenna_sync_queue_v1', [{
      id: 'old-write',
      type: 'UPSERT_ACCOUNT',
      childId: 'kid-4',
      payload: { childId: 'kid-4' },
      attempts: 0,
      lastError: null,
    }]);

    CloudSyncService.queueAccountChange(
      'DELETE_ACCOUNT',
      { childId: 'kid-4' },
      'kid-4',
      'token-kid-4',
    );

    const queue = SyncQueueService.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('DELETE_ACCOUNT');
    expect(queue[0].payload).toEqual({ childId: 'kid-4', token: 'token-kid-4' });
  });

  it('reports an unauthorized cloud deletion instead of silently marking it done', async () => {
    apiState.accounts.set('kid-no-token', { child_id: 'kid-no-token', full_name: 'Ama' });

    const result = await CloudSyncService.deleteFromCloud('kid-no-token');

    expect(result.success).toBe(false);
    expect(result.skippedCloud).toBe(true);
    expect(apiState.accounts.has('kid-no-token')).toBe(true);
  });

  it('deletes from the cloud with a developer session after the device token is gone', async () => {
    apiState.accounts.set('kid-5', { child_id: 'kid-5', full_name: 'Ama' });
    StorageService.set('makenna_dev_session_token_v1', 'developer-token');

    const result = await CloudSyncService.deleteFromCloud('kid-5');

    expect(result.success).toBe(true);
    expect(apiState.accounts.get('kid-5').deleted_at).toBeTruthy();
  });
});

describe('CloudSyncService automatic sync', () => {
  it('flushes a queued change automatically after a short debounce', async () => {
    vi.useFakeTimers();
    StorageService.set('makenna_cloud_sync_enabled', true);
    const syncNow = vi.spyOn(CloudSyncService, 'syncNow').mockResolvedValue({ success: true });

    CloudSyncService.queueAccountChange('UPSERT_ACCOUNT', {
      childId: 'kid-auto',
      fullName: 'Ama',
      updatedAt: new Date().toISOString(),
    });

    expect(syncNow).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1200);
    expect(syncNow).toHaveBeenCalledTimes(1);
  });

  it('does not schedule automatic sync when cloud sync is turned off', async () => {
    vi.useFakeTimers();
    StorageService.set('makenna_cloud_sync_enabled', false);
    const syncNow = vi.spyOn(CloudSyncService, 'syncNow').mockResolvedValue({ success: true });

    CloudSyncService.queueAccountChange('UPSERT_ACCOUNT', {
      childId: 'kid-off',
      fullName: 'Ama',
      updatedAt: new Date().toISOString(),
    });

    await vi.advanceTimersByTimeAsync(5000);
    expect(syncNow).not.toHaveBeenCalled();
  });

  it('coalesces overlapping sync requests', async () => {
    StorageService.set('makenna_cloud_sync_enabled', true);
    let resolveSync;
    const pending = new Promise(resolve => { resolveSync = resolve; });
    const syncNow = vi.spyOn(CloudSyncService, 'syncNow').mockReturnValue(pending);

    const first = CloudSyncService.requestSync('queued-change');
    const second = CloudSyncService.requestSync('focus');

    expect(syncNow).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);

    resolveSync({ success: true });
    await first;
  });
});
