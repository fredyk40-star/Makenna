/**
 * PrivacyService - user-controlled export and erasure of locally stored data.
 */
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';
import SchoolDataExchangeService from './SchoolDataExchangeService';

export const PRIVACY_NOTICE = [
  'Makenna stores learning progress, drawings and child profiles on this device so the app works offline.',
  'Child PINs are stored only as salted hashes. Cloud sync is optional and can be turned off in Sync & offline data.',
  'We do not show ads. The camera and microphone are used only when you start a camera hunt or voice activity.',
  'You can export everything as a JSON bundle or permanently erase all app data from this device.',
];

export class PrivacyService {
  static exportBundle() {
    return SchoolDataExchangeService.exportBundle();
  }

  static downloadBundle() {
    return SchoolDataExchangeService.download();
  }

  static getDeletionPreview() {
    const keys = Object.keys(localStorage);
    return {
      keys: keys.length,
      bytes: keys.reduce((total, key) => total + (localStorage.getItem(key)?.length || 0), 0),
      children: (ChildAccountService.getAllAccounts() || []).length,
    };
  }

  /** Remove cloud rows first, then every local key. This is irreversible. */
  static async deleteAll({ includeCloud = true } = {}) {
    const accounts = ChildAccountService.getAllAccounts() || [];
    let cloudDeleted = 0;

    if (includeCloud) {
      try {
        const { CloudSyncService } = await import('./CloudSyncService');
        for (const account of accounts) {
          const result = await CloudSyncService.deleteFromCloud(account.childId);
          if (result.success) cloudDeleted += 1;
        }
      } catch (error) {
        console.warn('Cloud deletion was skipped; local erasure continues:', error);
      }
    }

    const keys = Object.keys(localStorage);
    keys.forEach(key => StorageService.remove(key));
    return { success: true, keysDeleted: keys.length, cloudDeleted, children: accounts.length };
  }
}

export default PrivacyService;
