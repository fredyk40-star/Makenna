/**
 * Progress that older screens still keep outside the child account record.
 *
 * These keys are attached to the account's settings during cloud sync so a
 * second device does not lose games, music, rewards or analytics that never
 * travelled through ChildAccountService. Credentials and unrelated origin data
 * are deliberately excluded.
 */
import { StorageService } from './StorageService';

const SYNC_PATTERNS = [
  /^game_(progress|achievements|stats|favorites)$/,
  /^reading_(analytics|progress)$/,
  /^adaptive_learning_data$/,
  /^numbers_assessment_data$/,
  /^makenna_(gamification_state|rewards_store|achievements|daily_missions)$/,
  /^music_(progress_.+|game_favorites)$/,
  /^word_builder_data$/,
  /^story_engine_data$/,
];

const isSyncedKey = key => typeof key === 'string' && SYNC_PATTERNS.some(pattern => pattern.test(key));

export const collectSyncedLocalData = () => {
  if (typeof localStorage === 'undefined') return {};
  const data = {};
  Object.keys(localStorage).filter(isSyncedKey).forEach((key) => {
    const value = StorageService.get(key, null);
    if (value !== null && value !== undefined) data[key] = value;
  });
  return data;
};

/** Restore only keys missing locally; never overwrite newer on-device progress. */
export const restoreSyncedLocalData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 0;
  let restored = 0;
  Object.entries(data).forEach(([key, value]) => {
    if (!isSyncedKey(key) || value === null || value === undefined) return;
    if (StorageService.get(key, null) === null) {
      StorageService.set(key, value);
      restored += 1;
    }
  });
  return restored;
};

export default { collectSyncedLocalData, restoreSyncedLocalData };
