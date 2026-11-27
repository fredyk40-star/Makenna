/**
 * CameraHuntService - privacy-safe local scavenger hunts.
 *
 * Only the checklist and earned reward are stored. Camera frames are sampled
 * in memory by the page and are never uploaded or written to storage.
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';

const HUNT_KEY = 'makenna_camera_hunt_v1';
const HUNT_REWARD_STARS = 10;

export const HUNTS = [
  {
    id: 'colours',
    title: 'Colour Scout',
    icon: '🎨',
    instruction: 'Point the camera at something red, blue, green or yellow, then tap "I found it!".',
    detection: 'colour',
    targets: [
      { id: 'red', label: 'Something red', visual: '🔴', rgb: [210, 55, 55], tolerance: 80 },
      { id: 'blue', label: 'Something blue', visual: '🔵', rgb: [55, 110, 220], tolerance: 80 },
      { id: 'green', label: 'Something green', visual: '🟢', rgb: [60, 175, 80], tolerance: 80 },
      { id: 'yellow', label: 'Something yellow', visual: '🟡', rgb: [235, 205, 60], tolerance: 80 },
    ],
  },
  {
    id: 'shapes',
    title: 'Shape Scout',
    icon: '🔺',
    instruction: 'Find a circle, a square and a triangle near you. Tap confirm when you can see one.',
    detection: 'manual',
    targets: [
      { id: 'circle', label: 'A circle', visual: '⭕' },
      { id: 'square', label: 'A square', visual: '🟦' },
      { id: 'triangle', label: 'A triangle', visual: '🔺' },
    ],
  },
  {
    id: 'ghana',
    title: 'Ghana Treasure Hunt',
    icon: '🇬🇭',
    instruction: 'Find the flag, a kente pattern and an Adinkra symbol around you or in your home.',
    detection: 'manual',
    targets: [
      { id: 'flag', label: 'The Ghana flag', visual: '🇬🇭' },
      { id: 'kente', label: 'A kente pattern', visual: '🧵' },
      { id: 'adinkra', label: 'An Adinkra symbol', visual: '⬢' },
    ],
  },
];

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('Camera hunt listener failed:', error);
    }
  });
};

const readAll = () => {
  const data = StorageService.get(HUNT_KEY, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
};

const writeAll = (all) => {
  if (!StorageService.set(HUNT_KEY, all)) return false;
  notify();
  return true;
};

const defaultProgress = () => ({ found: [], completed: false, starsAwarded: false });

/** Compare an averaged camera sample with the hunt's reference colours. */
export const detectColor = (rgb = [], targets = []) => {
  if (!Array.isArray(rgb) || rgb.length < 3) return null;
  let best = null;
  let bestDistance = Infinity;

  targets.forEach((target) => {
    if (!Array.isArray(target.rgb) || target.rgb.length < 3) return;
    const distance = Math.hypot(
      rgb[0] - target.rgb[0],
      rgb[1] - target.rgb[1],
      rgb[2] - target.rgb[2],
    );
    if (distance < bestDistance && distance <= (target.tolerance || 80)) {
      best = target;
      bestDistance = distance;
    }
  });

  return best;
};

export class CameraHuntService {
  static subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  static getHunts() {
    return HUNTS;
  }

  static getHunt(huntId) {
    return HUNTS.find((hunt) => hunt.id === huntId) || null;
  }

  static getProgress(childId, huntId) {
    if (!childId || !huntId) return defaultProgress();
    const record = readAll()[childId]?.[huntId];
    return { ...defaultProgress(), ...(record || {}) };
  }

  static markFound(childId, huntId, targetId) {
    const hunt = this.getHunt(huntId);
    if (!childId || !hunt || !hunt.targets.some((target) => target.id === targetId)) return null;

    const all = readAll();
    const childHunts = all[childId] || {};
    const progress = { ...defaultProgress(), ...(childHunts[huntId] || {}) };
    if (progress.found.includes(targetId)) return { ...progress, unchanged: true };

    const found = [...progress.found, targetId];
    let completed = progress.completed;
    let starsAwarded = progress.starsAwarded;

    if (found.length >= hunt.targets.length && !completed) {
      completed = true;
      const state = GamificationService.getState(childId);
      state.stars = (state.stars || 0) + HUNT_REWARD_STARS;
      GamificationService.saveState(childId, state);
      starsAwarded = true;
      if (hunt.id === 'ghana') GamificationService.addBadge(childId, 'ghana_explorer');
    }

    const next = { found, completed, starsAwarded };
    childHunts[huntId] = next;
    all[childId] = childHunts;
    return writeAll(all) ? { ...next } : null;
  }

  static reset(childId, huntId) {
    if (!childId || !huntId) return false;
    const all = readAll();
    const childHunts = all[childId] || {};
    childHunts[huntId] = defaultProgress();
    all[childId] = childHunts;
    return writeAll(all);
  }
}

export default CameraHuntService;
