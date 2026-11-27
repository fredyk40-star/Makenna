import { describe, expect, it } from 'vitest';
import { StorageService } from './StorageService';
import migrateStorage, { CURRENT_SCHEMA_VERSION, getSchemaVersion } from './StorageMigrationService';

describe('StorageMigrationService', () => {
  it('normalizes legacy data and is safe to run repeatedly', () => {
    StorageService.set('makenna_gamification_state', {
      childA: { stars: 25, unlockedAvatars: ['default', 'ghanaian'], level: 3 },
    });
    StorageService.set('makenna_rewards_store_childA', ['ghanaian', 'lion']);
    StorageService.set('makenna_selected_avatar', { childA: 'star' });

    const first = migrateStorage();
    expect(first.applied).toEqual([1, 2]);
    expect(getSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);

    const gamification = StorageService.get('makenna_gamification_state');
    expect(gamification.childA.unlockedAvatars).toEqual(['default', 'ghanaian-child']);
    expect(gamification.childA.badges).toEqual([]);
    expect(gamification.childA.coins).toBe(0);
    expect(StorageService.get('makenna_rewards_store_childA')).toEqual(['ghanaian-child', 'lion']);
    expect(StorageService.get('makenna_selected_avatar')).toEqual({ childA: 'default' });

    const second = migrateStorage();
    expect(second.applied).toEqual([]);
    expect(getSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
  });
});
