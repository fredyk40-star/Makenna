import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChildAccountService } from './ChildAccountService';
import { DeveloperService } from './DeveloperService';
import { StorageService } from './StorageService';

const BACKUP_KEY = 'makenna_backup_data_v1';

describe('DeveloperService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects incomplete backups without replacing account data', () => {
    const saveAccounts = vi.spyOn(ChildAccountService, 'saveAllAccounts');
    localStorage.setItem(BACKUP_KEY, JSON.stringify([{
      timestamp: 'invalid-backup',
      data: { childAccounts: {}, trashBin: [] },
    }]));

    expect(DeveloperService.restoreBackup('invalid-backup')).toBe(false);
    expect(saveAccounts).not.toHaveBeenCalled();
  });

  it('restores account and trash arrays from a valid backup', () => {
    const childAccounts = [{ childId: 'kid20345635' }];
    const trashBin = [{ childId: 'kid98765432' }];
    const saveAccounts = vi.spyOn(ChildAccountService, 'saveAllAccounts').mockReturnValue(true);
    localStorage.setItem(BACKUP_KEY, JSON.stringify([{
      timestamp: 'valid-backup',
      data: { childAccounts, trashBin },
    }]));

    expect(DeveloperService.restoreBackup('valid-backup')).toBe(true);
    expect(saveAccounts).toHaveBeenCalledWith(childAccounts);
    expect(JSON.parse(localStorage.getItem('makenna_trash_bin'))).toEqual(trashBin);
  });

  it('rolls back account data if restoring the trash bin fails', () => {
    const childAccounts = [{ childId: 'kid20345635' }];
    const trashBin = [{ childId: 'kid98765432' }];
    const currentTrash = [{ childId: 'kid11111111' }];
    const saveAccounts = vi.spyOn(ChildAccountService, 'saveAllAccounts').mockReturnValue(true);
    let trashWrites = 0;
    vi.spyOn(StorageService, 'set').mockImplementation((key) => {
      if (key === 'makenna_trash_bin' && trashWrites++ === 0) return false;
      return true;
    });
    localStorage.setItem('makenna_trash_bin', JSON.stringify(currentTrash));
    localStorage.setItem(BACKUP_KEY, JSON.stringify([{
      timestamp: 'partial-failure-backup',
      data: { childAccounts, trashBin },
    }]));

    expect(DeveloperService.restoreBackup('partial-failure-backup')).toBe(false);
    expect(saveAccounts).toHaveBeenNthCalledWith(1, childAccounts);
    expect(saveAccounts).toHaveBeenNthCalledWith(2, []);
    expect(JSON.parse(localStorage.getItem('makenna_trash_bin'))).toEqual(currentTrash);
  });

  it('records sync time without dropping existing sync status', () => {
    localStorage.setItem('makenna_sync_status_v1', JSON.stringify({
      enabled: true,
      pendingCount: 2,
      lastError: 'previous error',
    }));

    DeveloperService.setLastSyncTime('2026-11-27T15:00:00.000Z');

    expect(JSON.parse(localStorage.getItem('makenna_sync_status_v1'))).toMatchObject({
      enabled: true,
      pendingCount: 2,
      lastError: 'previous error',
      lastSync: '2026-11-27T15:00:00.000Z',
    });
  });
});
