import { describe, expect, it, vi } from 'vitest';
import { PortfolioService } from './PortfolioService';

describe('PortfolioService', () => {
  it('saves drawings and traces per child with stable metadata', () => {
    const drawing = PortfolioService.save('child-1', {
      kind: 'drawing',
      title: 'My rainbow',
      image: 'data:image/png;base64,AAA',
    });
    const trace = PortfolioService.save('child-1', {
      kind: 'trace',
      title: 'Letter A',
      image: 'data:image/png;base64,BBB',
      guide: [{ points: [{ x: 10, y: 10 }, { x: 90, y: 90 }] }],
      letter: 'A',
      caseType: 'uppercase',
      accuracy: 91,
    });

    expect(drawing.kind).toBe('drawing');
    expect(PortfolioService.list('child-1')).toHaveLength(2);
    expect(PortfolioService.listByKind('child-1', 'trace')).toEqual([expect.objectContaining({
      id: trace.id,
      letter: 'A',
      accuracy: 91,
    })]);
    expect(PortfolioService.list('child-2')).toEqual([]);
  });

  it('replaces an entry with the same id instead of duplicating it', () => {
    const original = PortfolioService.save('child-1', { kind: 'drawing', title: 'First', image: 'a' });
    PortfolioService.save('child-1', { ...original, title: 'Updated', image: 'b' });

    const entries = PortfolioService.list('child-1');
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Updated');
  });

  it('notifies subscribers and removes entries', () => {
    const listener = vi.fn();
    const unsubscribe = PortfolioService.subscribe(listener);
    const entry = PortfolioService.save('child-1', { kind: 'drawing', title: 'Temporary', image: 'a' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(PortfolioService.remove('child-1', entry.id)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(PortfolioService.get('child-1', entry.id)).toBeNull();

    unsubscribe();
    PortfolioService.save('child-1', { kind: 'drawing', title: 'Quiet', image: 'a' });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
