/**
 * Versioned local-storage migrations.
 * Keeps saved progress usable across app upgrades instead of silently breaking it.
 */
import { StorageService } from './StorageService';
import { resolveAvatarId } from '../data/rewardCatalog';

export const SCHEMA_VERSION_KEY = 'makenna_schema_version';
export const CURRENT_SCHEMA_VERSION = 2;

const GAMIFICATION_KEY = 'makenna_gamification_state';
const REWARDS_PREFIX = 'makenna_rewards_store_';
const SELECTED_AVATAR_KEY = 'makenna_selected_avatar';

const storageKeys = () => {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
};

const normalizeGamification = () => {
  const states = StorageService.get(GAMIFICATION_KEY, {});
  let changed = false;

  Object.entries(states).forEach(([childId, state]) => {
    if (!state || typeof state !== 'object') return;
    const next = { ...state };

    if (!Array.isArray(next.unlockedAvatars)) {
      next.unlockedAvatars = ['default'];
      changed = true;
    }
    if (!Array.isArray(next.badges)) { next.badges = []; changed = true; }
    if (!Array.isArray(next.dailyChallenges)) { next.dailyChallenges = []; changed = true; }
    if (!Array.isArray(next.weeklyMissions)) { next.weeklyMissions = []; changed = true; }
    if (typeof next.stars !== 'number') { next.stars = 0; changed = true; }
    if (typeof next.coins !== 'number') { next.coins = 0; changed = true; }

    if (changed) states[childId] = next;
  });

  if (changed) StorageService.set(GAMIFICATION_KEY, states);
};

const normalizePurchases = () => {
  storageKeys()
    .filter(key => key.startsWith(REWARDS_PREFIX))
    .forEach((key) => {
      const purchases = StorageService.get(key, []);
      if (!Array.isArray(purchases)) {
        StorageService.set(key, []);
        return;
      }
      const normalized = [...new Set(purchases.map(item => resolveAvatarId(item)))];
      if (normalized.length !== purchases.length || normalized.some((item, index) => item !== purchases[index])) {
        StorageService.set(key, normalized);
      }
    });
};

const normalizeAvatarIds = () => {
  const states = StorageService.get(GAMIFICATION_KEY, {});
  let statesChanged = false;

  Object.entries(states).forEach(([childId, state]) => {
    if (!state || !Array.isArray(state.unlockedAvatars)) return;
    const normalized = [...new Set(state.unlockedAvatars.map(id => resolveAvatarId(id)))];
    if (normalized.some((id, index) => id !== state.unlockedAvatars[index])) {
      states[childId] = { ...state, unlockedAvatars: normalized };
      statesChanged = true;
    }
  });

  if (statesChanged) StorageService.set(GAMIFICATION_KEY, states);

  const selected = StorageService.get(SELECTED_AVATAR_KEY, {});
  if (selected && typeof selected === 'object') {
    const normalizedSelected = Object.fromEntries(
      Object.entries(selected).map(([childId, avatarId]) => [childId, resolveAvatarId(avatarId)])
    );
    StorageService.set(SELECTED_AVATAR_KEY, normalizedSelected);
  }
};

// Each migration is idempotent and runs once, in order.
const MIGRATIONS = {
  1: () => {
    normalizeGamification();
    normalizePurchases();
  },
  2: () => {
    normalizeAvatarIds();
  },
};

export const getSchemaVersion = () => {
  const version = Number(StorageService.get(SCHEMA_VERSION_KEY, 0));
  return Number.isFinite(version) ? version : 0;
};

export const migrateStorage = () => {
  let from = getSchemaVersion();
  const applied = [];

  for (let version = from + 1; version <= CURRENT_SCHEMA_VERSION; version += 1) {
    try {
      MIGRATIONS[version]?.();
      applied.push(version);
      from = version;
      StorageService.set(SCHEMA_VERSION_KEY, version);
    } catch (error) {
      console.error(`Storage migration ${version} failed:`, error);
      break;
    }
  }

  return { from, to: getSchemaVersion(), applied };
};

export default migrateStorage;
