import { describe, expect, it, vi } from 'vitest';
import { StickerBookService } from './StickerBookService';

describe('StickerBookService', () => {
  it('creates a default page with placements that clamp into the page', () => {
    const book = StickerBookService.getBook('child-1');
    expect(book.pages).toHaveLength(1);

    const placement = StickerBookService.placeSticker('child-1', book.activePageId, {
      packId: 'fun1',
      stickerIndex: 3,
      x: 150,
      y: -20,
    });

    expect(placement.x).toBe(98);
    expect(placement.y).toBe(2);
    expect(StickerBookService.getBook('child-1').pages[0].placements).toEqual([placement]);
  });

  it('adds and removes pages while keeping one active page', () => {
    const first = StickerBookService.getBook('child-1');
    const second = StickerBookService.addPage('child-1');

    expect(StickerBookService.getBook('child-1').pages).toHaveLength(2);
    expect(StickerBookService.getBook('child-1').activePageId).toBe(second.id);
    expect(StickerBookService.removePage('child-1', second.id)).toBe(true);
    expect(StickerBookService.getBook('child-1').activePageId).toBe(first.activePageId);
    expect(StickerBookService.removePage('child-1', first.activePageId)).toBe(false);
  });

  it('removes placements and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = StickerBookService.subscribe(listener);
    const book = StickerBookService.getBook('child-1');
    const placement = StickerBookService.placeSticker('child-1', book.activePageId, {
      packId: 'stars',
      stickerIndex: 0,
      x: 50,
      y: 50,
    });

    expect(listener).toHaveBeenCalled();
    expect(StickerBookService.removePlacement('child-1', book.activePageId, placement.id)).toBe(true);
    expect(StickerBookService.getBook('child-1').pages[0].placements).toEqual([]);

    unsubscribe();
    StickerBookService.placeSticker('child-1', book.activePageId, { packId: 'stars', x: 50, y: 50 });
    const callsAfterUnsubscribe = listener.mock.calls.length;
    StickerBookService.placeSticker('child-1', book.activePageId, { packId: 'stars', x: 60, y: 60 });
    expect(listener).toHaveBeenCalledTimes(callsAfterUnsubscribe);
  });
});
