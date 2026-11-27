/**
 * PortfolioService - durable per-child portfolio for drawings and tracing work.
 *
 * Images are stored as compact data URLs so the portfolio keeps working
 * offline and survives reloads. Entries are capped to protect local storage.
 */
import { StorageService } from './StorageService';

const PORTFOLIO_KEY = 'makenna_portfolio_v1';
const MAX_ENTRIES_PER_CHILD = 24;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('Portfolio listener failed:', error);
    }
  });
};

const readAll = () => {
  const data = StorageService.get(PORTFOLIO_KEY, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
};

const writeAll = (all) => {
  if (!StorageService.set(PORTFOLIO_KEY, all)) return false;
  notify();
  return true;
};

const randomId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class PortfolioService {
  static subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  static list(childId) {
    if (!childId) return [];
    const entries = readAll()[childId];
    if (!Array.isArray(entries)) return [];
    return [...entries].sort((a, b) => {
      const aTime = new Date(a?.createdAt).getTime() || 0;
      const bTime = new Date(b?.createdAt).getTime() || 0;
      return bTime - aTime;
    });
  }

  static listByKind(childId, kind) {
    return this.list(childId).filter((entry) => entry.kind === kind);
  }

  static get(childId, entryId) {
    return this.list(childId).find((entry) => entry.id === entryId) || null;
  }

  /**
   * Add or replace an entry. Returns the saved record, or null on storage failure.
   */
  static save(childId, entry) {
    if (!childId || !entry) return null;

    const record = {
      id: entry.id || randomId('work'),
      childId,
      kind: entry.kind === 'trace' ? 'trace' : 'drawing',
      title: String(entry.title || 'My work').slice(0, 80),
      createdAt: entry.createdAt || new Date().toISOString(),
      image: typeof entry.image === 'string' ? entry.image : '',
      guide: Array.isArray(entry.guide) ? entry.guide : [],
      letter: entry.letter || null,
      caseType: entry.caseType || null,
      accuracy: Number(entry.accuracy) || 0,
    };

    const all = readAll();
    const entries = Array.isArray(all[childId]) ? all[childId] : [];
    const next = [record, ...entries.filter((item) => item?.id !== record.id)]
      .slice(0, MAX_ENTRIES_PER_CHILD);

    return writeAll({ ...all, [childId]: next }) ? record : null;
  }

  static remove(childId, entryId) {
    if (!childId || !entryId) return false;
    const all = readAll();
    const entries = Array.isArray(all[childId]) ? all[childId] : [];
    const next = entries.filter((entry) => entry?.id !== entryId);
    if (next.length === entries.length) return false;
    return writeAll({ ...all, [childId]: next });
  }

  static clear(childId) {
    if (!childId) return false;
    const all = readAll();
    if (!Array.isArray(all[childId]) || all[childId].length === 0) return false;
    return writeAll({ ...all, [childId]: [] });
  }
}

export default PortfolioService;
