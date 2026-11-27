/**
 * Offline school data exchange.
 *
 * Exports every locally stored learning record a school needs to move a class
 * between devices, without requiring a network connection or cloud account.
 */
import { StorageService } from './StorageService';
import { BUNDLE_DATA_KEYS, isAppStorageKey, listAppStorageKeys } from './AppStorageKeys';

export const BUNDLE_FORMAT = 'makenna-school-bundle';
export const BUNDLE_VERSION = 1;

export { BUNDLE_DATA_KEYS as DATA_KEYS };

const isPlainObject = value => value && typeof value === 'object' && !Array.isArray(value);

const mergeValue = (existing, incoming) => {
  if (isPlainObject(existing) && isPlainObject(incoming)) {
    return { ...existing, ...incoming };
  }
  if (Array.isArray(existing) && Array.isArray(incoming)) {
    const byId = new Map();
    [...existing, ...incoming].forEach(item => {
      const id = item?.childId || item?.id || JSON.stringify(item);
      byId.set(id, item);
    });
    return Array.from(byId.values());
  }
  return incoming;
};

export class SchoolDataExchangeService {
  static exportBundle() {
    const data = {};
    listAppStorageKeys().forEach(key => {
      const value = StorageService.get(key, null);
      if (value !== null && value !== undefined) data[key] = value;
    });

    return {
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  static toJson(bundle = this.exportBundle()) {
    return JSON.stringify(bundle, null, 2);
  }

  static download() {
    const bundle = this.exportBundle();
    const blob = new Blob([this.toJson(bundle)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `makenna-school-bundle-${bundle.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return bundle;
  }

  static parseBundle(text) {
    const bundle = JSON.parse(text);
    if (bundle?.format !== BUNDLE_FORMAT) {
      throw new Error('This is not a Makenna school bundle.');
    }
    if (Number(bundle.version) > BUNDLE_VERSION) {
      throw new Error('This bundle was created by a newer version of Makenna.');
    }
    if (!isPlainObject(bundle.data)) {
      throw new Error('The bundle is missing its data section.');
    }
    return bundle;
  }

  /** Restore a bundle. Merge lets imported records win; replace overwrites. */
  static importBundle(text, { mode = 'merge' } = {}) {
    const bundle = this.parseBundle(text);
    const imported = [];

    Object.entries(bundle.data).forEach(([key, incoming]) => {
      if (!isAppStorageKey(key)) return;
      const next = mode === 'replace'
        ? incoming
        : mergeValue(StorageService.get(key, null), incoming);
      StorageService.set(key, next);
      imported.push(key);
    });

    return { success: true, mode, imported, exportedAt: bundle.exportedAt };
  }

  static readFile(file) {
    if (!file) return Promise.reject(new Error('No file selected.'));
    return file.text();
  }
}

export default SchoolDataExchangeService;
