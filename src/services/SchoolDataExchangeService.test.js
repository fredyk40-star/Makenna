import { beforeEach, describe, expect, it } from 'vitest';
import SchoolDataExchangeService from './SchoolDataExchangeService';
import { StorageService } from './StorageService';

beforeEach(() => {
  localStorage.clear();
});

describe('SchoolDataExchangeService', () => {
  it('exports and restores school data offline', () => {
    StorageService.set('makenna_child_accounts_v2', [{ childId: 'kid-1', fullName: 'Ama' }]);
    StorageService.set('makenna_classes_v1', [{ id: 'class-1', name: 'KG1 A' }]);

    const json = SchoolDataExchangeService.toJson();
    localStorage.clear();

    const result = SchoolDataExchangeService.importBundle(json, { mode: 'replace' });

    expect(result.success).toBe(true);
    expect(result.imported).toContain('makenna_child_accounts_v2');
    expect(StorageService.get('makenna_child_accounts_v2')[0].fullName).toBe('Ama');
    expect(StorageService.get('makenna_classes_v1')[0].name).toBe('KG1 A');
  });

  it('rejects files that are not Makenna bundles', () => {
    expect(() => SchoolDataExchangeService.importBundle('{"hello":true}')).toThrow('Makenna school bundle');
  });

  it('merges child accounts by id instead of creating duplicates', () => {
    StorageService.set('makenna_child_accounts_v2', [{ childId: 'kid-1', fullName: 'Local' }]);
    const bundle = {
      format: 'makenna-school-bundle',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { makenna_child_accounts_v2: [{ childId: 'kid-1', fullName: 'Imported' }] },
    };

    SchoolDataExchangeService.importBundle(JSON.stringify(bundle), { mode: 'merge' });

    const accounts = StorageService.get('makenna_child_accounts_v2');
    expect(accounts).toHaveLength(1);
    expect(accounts[0].fullName).toBe('Imported');
  });
});
