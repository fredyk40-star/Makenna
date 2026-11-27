/**
 * PrivacyService - user-controlled export and erasure of locally stored data.
 */
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';
import SchoolDataExchangeService from './SchoolDataExchangeService';
import { listAppStorageKeys } from './AppStorageKeys';

export const PRIVACY_NOTICE = [
  'Makenna stores learning progress, drawings and child profiles on this device so the app works offline.',
  'Child credentials are verified by the server; credential hashes are never stored in the browser.',
  'Cloud sync is optional and can be turned off in Sync & offline data.',
  'We do not show ads. The camera and microphone are used only when you start a camera hunt or voice activity.',
  'You can export everything as a JSON bundle or permanently erase Makenna data from this device.',
];

export class PrivacyService {
  static exportBundle() {
    return SchoolDataExchangeService.exportBundle();
  }

  static downloadBundle() {
    return SchoolDataExchangeService.download();
  }

  static getDeletionPreview() {
    const keys = listAppStorageKeys();
    return {
      keys: keys.length,
      bytes: keys.reduce((total, key) => total + (localStorage.getItem(key)?.length || 0), 0),
      children: (ChildAccountService.getAllAccounts() || []).length,
    };
  }

  /** Remove cloud rows first, then Makenna-owned local keys. This is irreversible. */
  static async deleteAll({ includeCloud = true } = {}) {
    const accounts = ChildAccountService.getAllAccounts() || [];
    let cloudDeleted = 0;
    const cloudFailures = [];

    if (includeCloud) {
      try {
        const { CloudSyncService } = await import('./CloudSyncService');
        for (const account of accounts) {
          const result = await CloudSyncService.deleteFromCloud(account.childId);
          if (result.success) cloudDeleted += 1;
          else cloudFailures.push({ childId: account.childId, error: result.error });
        }
      } catch (error) {
        cloudFailures.push({ childId: null, error: error.message });
      }
    }

    const keys = listAppStorageKeys();
    keys.forEach(key => StorageService.remove(key));
    return {
      success: true,
      keysDeleted: keys.length,
      cloudDeleted,
      cloudFailed: cloudFailures.length,
      cloudFailures,
      children: accounts.length,
    };
  }
}

export default PrivacyService;
