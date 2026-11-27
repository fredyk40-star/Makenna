/**
 * StickerBookService - persists sticker pages and placements per child.
 *
 * Ownership stays in RewardsStore (the unified catalog); this service only
 * stores where owned stickers have been placed in the child's book.
 */
import { StorageService } from './StorageService';

const STICKER_BOOK_KEY = 'makenna_sticker_book_v1';
const MAX_PLACEMENTS_PER_PAGE = 60;
const MAX_PAGES_PER_CHILD = 12;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('Sticker book listener failed:', error);
    }
  });
};

const readAll = () => {
  const data = StorageService.get(STICKER_BOOK_KEY, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
};

const writeAll = (all) => {
  if (!StorageService.set(STICKER_BOOK_KEY, all)) return false;
  notify();
  return true;
};

const randomId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createPage = () => ({
  id: randomId('page'),
  createdAt: new Date().toISOString(),
  placements: [],
});

const ensureBook = (all, childId) => {
  const existing = all[childId];
  const pages = Array.isArray(existing?.pages) ? existing.pages : [];
  if (pages.length === 0) pages.push(createPage());

  const activePageId = pages.some((page) => page.id === existing?.activePageId)
    ? existing.activePageId
    : pages[0].id;

  all[childId] = { pages, activePageId };
  return all[childId];
};

const clamp = (value) => Math.min(98, Math.max(2, Number(value) || 50));

export class StickerBookService {
  static subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  static getBook(childId) {
    if (!childId) return { pages: [], activePageId: null };
    const all = readAll();
    const before = all[childId];
    const book = ensureBook(all, childId);
    // Persist the default page once so page ids stay stable across reads.
    if (!before || !Array.isArray(before.pages) || before.pages.length === 0
      || before.activePageId !== book.activePageId) {
      StorageService.set(STICKER_BOOK_KEY, all);
    }
    return {
      pages: book.pages.map((page) => ({
        ...page,
        placements: Array.isArray(page.placements) ? page.placements : [],
      })),
      activePageId: book.activePageId,
    };
  }

  static addPage(childId) {
    if (!childId) return null;
    const all = readAll();
    const book = ensureBook(all, childId);
    if (book.pages.length >= MAX_PAGES_PER_CHILD) return null;

    const page = createPage();
    book.pages.push(page);
    book.activePageId = page.id;
    return writeAll(all) ? page : null;
  }

  static setActivePage(childId, pageId) {
    if (!childId || !pageId) return false;
    const all = readAll();
    const book = ensureBook(all, childId);
    if (!book.pages.some((page) => page.id === pageId)) return false;
    book.activePageId = pageId;
    return writeAll(all);
  }

  static placeSticker(childId, pageId, sticker) {
    if (!childId || !sticker?.packId) return null;
    const all = readAll();
    const book = ensureBook(all, childId);
    const page = book.pages.find((item) => item.id === pageId) || book.pages[0];
    if (!page || page.placements.length >= MAX_PLACEMENTS_PER_PAGE) return null;

    const placement = {
      id: randomId('sticker'),
      packId: String(sticker.packId),
      stickerIndex: Math.max(0, Number(sticker.stickerIndex) || 0),
      x: clamp(sticker.x),
      y: clamp(sticker.y),
      placedAt: new Date().toISOString(),
    };

    page.placements.push(placement);
    return writeAll(all) ? placement : null;
  }

  static removePlacement(childId, pageId, placementId) {
    if (!childId || !placementId) return false;
    const all = readAll();
    const book = ensureBook(all, childId);
    const page = book.pages.find((item) => item.id === pageId) || book.pages[0];
    if (!page) return false;

    const next = page.placements.filter((placement) => placement.id !== placementId);
    if (next.length === page.placements.length) return false;
    page.placements = next;
    return writeAll(all);
  }

  static removePage(childId, pageId) {
    if (!childId || !pageId) return false;
    const all = readAll();
    const book = ensureBook(all, childId);
    if (book.pages.length <= 1 || !book.pages.some((page) => page.id === pageId)) return false;

    book.pages = book.pages.filter((page) => page.id !== pageId);
    if (book.activePageId === pageId) book.activePageId = book.pages[0].id;
    return writeAll(all);
  }

  static clearPage(childId, pageId) {
    if (!childId || !pageId) return false;
    const all = readAll();
    const book = ensureBook(all, childId);
    const page = book.pages.find((item) => item.id === pageId);
    if (!page || page.placements.length === 0) return false;
    page.placements = [];
    return writeAll(all);
  }
}

export default StickerBookService;
