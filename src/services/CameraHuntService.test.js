import { describe, expect, it, vi } from 'vitest';
import { CameraHuntService, detectColor } from './CameraHuntService';
import { GamificationService } from './GamificationService';

describe('CameraHuntService', () => {
  it('matches a camera sample to the closest target colour', () => {
    const targets = CameraHuntService.getHunt('colours').targets;
    expect(detectColor([215, 60, 60], targets)?.id).toBe('red');
    expect(detectColor([50, 180, 70], targets)?.id).toBe('green');
    expect(detectColor([10, 10, 10], targets)).toBeNull();
  });

  it('stores found targets and awards stars only once on completion', () => {
    const childId = 'child-1';
    const hunt = CameraHuntService.getHunt('shapes');
    hunt.targets.slice(0, 2).forEach((target) => {
      const result = CameraHuntService.markFound(childId, hunt.id, target.id);
      expect(result.completed).toBe(false);
    });

    const final = CameraHuntService.markFound(childId, hunt.id, 'triangle');
    expect(final.completed).toBe(true);
    expect(final.starsAwarded).toBe(true);
    expect(GamificationService.getState(childId).stars).toBe(10);

    const duplicate = CameraHuntService.markFound(childId, hunt.id, 'triangle');
    expect(duplicate.unchanged).toBe(true);
    expect(GamificationService.getState(childId).stars).toBe(10);
  });

  it('ignores unknown hunts and targets and can reset progress', () => {
    expect(CameraHuntService.markFound('child-1', 'missing', 'x')).toBeNull();
    expect(CameraHuntService.markFound('child-1', 'shapes', 'not-a-shape')).toBeNull();
    CameraHuntService.markFound('child-1', 'shapes', 'circle');
    expect(CameraHuntService.reset('child-1', 'shapes')).toBe(true);
    expect(CameraHuntService.getProgress('child-1', 'shapes').found).toEqual([]);
  });

  it('notifies subscribers on progress changes', () => {
    const listener = vi.fn();
    const unsubscribe = CameraHuntService.subscribe(listener);
    CameraHuntService.markFound('child-1', 'shapes', 'circle');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    CameraHuntService.markFound('child-1', 'shapes', 'square');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
