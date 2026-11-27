import { beforeEach, describe, expect, it } from 'vitest';
import { collectSyncedLocalData, restoreSyncedLocalData } from './SyncedLocalData';
import { StorageService } from './StorageService';

beforeEach(() => {
  localStorage.clear();
});

describe('SyncedLocalData', () => {
  it('collects legacy progress keys but never credentials or unrelated data', () => {
    StorageService.set('game_progress', { m: 3 });
    StorageService.set('music_progress_kid1', { played: ['song-1'] });
    StorageService.set('makenna_gamification_state', { xp: 50 });
    StorageService.set('makenna_child_accounts_v2', [{ childId: 'kid1' }]);
    StorageService.set('unrelated_app_token', 'keep-me');

    const data = collectSyncedLocalData();

    expect(data.game_progress).toEqual({ m: 3 });
    expect(data.music_progress_kid1).toEqual({ played: ['song-1'] });
    expect(data.makenna_gamification_state).toEqual({ xp: 50 });
    expect(data.makenna_child_accounts_v2).toBeUndefined();
    expect(data.unrelated_app_token).toBeUndefined();
  });

  it('restores missing keys without overwriting newer local progress', () => {
    StorageService.set('game_progress', { local: true });
    const restored = restoreSyncedLocalData({
      game_progress: { cloud: true },
      reading_analytics: { days: 2 },
      unrelated_app_token: 'ignore-me',
    });

    expect(restored).toBe(1);
    expect(StorageService.get('game_progress')).toEqual({ local: true });
    expect(StorageService.get('reading_analytics')).toEqual({ days: 2 });
    expect(StorageService.get('unrelated_app_token')).toBeNull();
  });
});
