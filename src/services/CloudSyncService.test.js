import { beforeEach, describe, expect, it } from 'vitest';
import { CloudSyncService } from './CloudSyncService';
import SyncQueueService from './SyncQueueService';
import { StorageService } from './StorageService';

beforeEach(() => {
  localStorage.clear();
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
});
