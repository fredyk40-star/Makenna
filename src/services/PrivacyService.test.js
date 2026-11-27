import { describe, expect, it } from 'vitest';
import PrivacyService from './PrivacyService';
import { StorageService } from './StorageService';

describe('PrivacyService', () => {
  it('exports a bundle before erasure', () => {
    StorageService.set('makenna_child_accounts_v2', [{ childId: 'kid-1', fullName: 'Ama' }]);
    const bundle = PrivacyService.exportBundle();
    expect(bundle.format).toBe('makenna-school-bundle');
    expect(bundle.data.makenna_child_accounts_v2[0].fullName).toBe('Ama');
  });

  it('erases Makenna data but preserves unrelated origin data', async () => {
    StorageService.set('makenna_child_accounts_v2', [{ childId: 'kid-1', fullName: 'Ama' }]);
    StorageService.set('drawing_gallery', [{ id: 'drawing-1' }]);
    StorageService.set('makenna_rewards_store', { purchased: [] });
    StorageService.set('unrelated_app_token', 'keep-me');

    const preview = PrivacyService.getDeletionPreview();
    expect(preview.children).toBe(1);

    const result = await PrivacyService.deleteAll({ includeCloud: false });

    expect(result.success).toBe(true);
    expect(result.keysDeleted).toBeGreaterThanOrEqual(3);
    expect(StorageService.get('makenna_child_accounts_v2', null)).toBeNull();
    expect(StorageService.get('unrelated_app_token')).toBe('keep-me');
  });
});
