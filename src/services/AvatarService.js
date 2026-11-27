/**
 * Avatar Service - Avatar selection and management system.
 * Catalog data lives in rewardCatalog.js so the store and selector agree.
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';
import { REWARD_CATALOG, resolveAvatarId } from '../data/rewardCatalog';

const AVATAR_STORAGE_KEY = 'makenna_selected_avatar';

export const AVATAR_DEFINITIONS = REWARD_CATALOG.avatars;

export class AvatarService {
  static getAllAvatars() {
    return AVATAR_DEFINITIONS;
  }

  static getUnlockedAvatars(childId) {
    const state = GamificationService.getState(childId);
    const stars = state?.stars || 0;
    const purchased = Array.isArray(state?.unlockedAvatars) ? state.unlockedAvatars : [];

    return AVATAR_DEFINITIONS
      .filter(avatar => avatar.unlocked || avatar.starsRequired <= stars
        || purchased.includes(avatar.id) || avatar.legacyIds?.some(id => purchased.includes(id)))
      .map(avatar => avatar.id);
  }

  static getSelectedAvatar(childId) {
    const allAvatars = StorageService.get(AVATAR_STORAGE_KEY, {});
    return resolveAvatarId(allAvatars[childId]) || 'default';
  }

  static setSelectedAvatar(childId, avatarId) {
    const allAvatars = StorageService.get(AVATAR_STORAGE_KEY, {});
    allAvatars[childId] = resolveAvatarId(avatarId);
    StorageService.set(AVATAR_STORAGE_KEY, allAvatars);
  }

  static getAvailableAvatars(childId) {
    const state = GamificationService.getState(childId);
    const stars = state?.stars || 0;
    const purchased = Array.isArray(state?.unlockedAvatars) ? state.unlockedAvatars : [];

    return AVATAR_DEFINITIONS.map(avatar => ({
      ...avatar,
      unlocked: avatar.unlocked || avatar.starsRequired <= stars
        || purchased.includes(avatar.id) || avatar.legacyIds?.some(id => purchased.includes(id)),
    }));
  }

  /**
   * Record an avatar purchase. Currency is deducted by RewardsStore only.
   */
  static unlockAvatar(childId, avatarId) {
    if (!childId) return { success: false, reason: 'No child selected' };

    const resolvedId = resolveAvatarId(avatarId);
    const avatar = AVATAR_DEFINITIONS.find(entry => entry.id === resolvedId);
    if (!avatar) return { success: false, reason: 'Invalid avatar' };

    const state = GamificationService.getState(childId);
    const unlocked = Array.isArray(state.unlockedAvatars) ? state.unlockedAvatars : [];

    if (!unlocked.includes(resolvedId)) {
      state.unlockedAvatars = [...unlocked, resolvedId];
      GamificationService.saveState(childId, state);
    }

    return { success: true, id: resolvedId };
  }

  static getAvatarById(avatarId) {
    const resolvedId = resolveAvatarId(avatarId);
    return AVATAR_DEFINITIONS.find(avatar => avatar.id === resolvedId) || AVATAR_DEFINITIONS[0];
  }
}
