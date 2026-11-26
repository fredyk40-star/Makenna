/**
 * Avatar Service - Avatar selection and management system
 * Children choose avatars, unlocked with stars/coins
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';

const AVATAR_STORAGE_KEY = 'makenna_selected_avatar';

// The rewards store uses a few shorter ids than the avatar catalog.
const AVATAR_ID_ALIASES = {
  star: 'default',
  ghanaian: 'ghanaian-child',
};

const resolveAvatarId = (avatarId) => AVATAR_ID_ALIASES[avatarId] || avatarId;

// Avatar definitions
export const AVATAR_DEFINITIONS = [
  { id: 'default', name: 'Star', icon: '⭐', category: 'free', starsRequired: 0, unlocked: true },
  { id: 'boy', name: 'Boy', icon: '👦', category: 'free', starsRequired: 0, unlocked: true },
  { id: 'girl', name: 'Girl', icon: '👧', category: 'free', starsRequired: 0, unlocked: true },
  { id: 'ghanaian-child', name: 'Ghanaian Child', icon: '🇬🇭', category: 'cultural', starsRequired: 50, unlocked: false },
  { id: 'lion', name: 'Lion', icon: '🦁', category: 'animals', starsRequired: 100, unlocked: false },
  { id: 'elephant', name: 'Elephant', icon: '🐘', category: 'animals', starsRequired: 150, unlocked: false },
  { id: 'monkey', name: 'Monkey', icon: '🐵', category: 'animals', starsRequired: 120, unlocked: false },
  { id: 'bird', name: 'Bird', icon: '🐦', category: 'animals', starsRequired: 80, unlocked: false },
  { id: 'robot', name: 'Robot', icon: '🤖', category: 'futuristic', starsRequired: 200, unlocked: false },
  { id: 'unicorn', name: 'Unicorn', icon: '🦄', category: 'fantasy', starsRequired: 300, unlocked: false },
  { id: 'dragon', name: 'Dragon', icon: '🐉', category: 'fantasy', starsRequired: 500, unlocked: false },
  { id: 'wizard', name: 'Wizard', icon: '🧙', category: 'fantasy', starsRequired: 400, unlocked: false },
  { id: 'pirate', name: 'Pirate', icon: '🏴☠️', category: 'fantasy', starsRequired: 250, unlocked: false },
  { id: 'princess', name: 'Princess', icon: '👸', category: 'fantasy', starsRequired: 220, unlocked: false }
];

export class AvatarService {
  /**
   * Get all available avatar definitions
   */
  static getAllAvatars() {
    return AVATAR_DEFINITIONS;
  }

  /**
   * Get unlocked avatars for a child (based on stars)
   */
  static getUnlockedAvatars(childId) {
    const state = GamificationService.getState(childId);
    const stars = state?.stars || 0;
    const purchased = Array.isArray(state?.unlockedAvatars) ? state.unlockedAvatars : [];
    
    return AVATAR_DEFINITIONS
      .filter(avatar => avatar.unlocked || avatar.starsRequired <= stars || purchased.includes(avatar.id))
      .map(avatar => avatar.id);
  }

  /**
   * Get selected avatar for a child
   */
  static getSelectedAvatar(childId) {
    const allAvatars = StorageService.get(AVATAR_STORAGE_KEY, {});
    return allAvatars[childId] || 'default';
  }

  /**
   * Set selected avatar for a child
   */
  static setSelectedAvatar(childId, avatarId) {
    const allAvatars = StorageService.get(AVATAR_STORAGE_KEY, {});
    allAvatars[childId] = avatarId;
    StorageService.set(AVATAR_STORAGE_KEY, allAvatars);
  }

  /**
   * Get available avatars for a child (based on stars or purchases)
   */
  static getAvailableAvatars(childId) {
    const state = GamificationService.getState(childId);
    const stars = state?.stars || 0;
    const purchased = Array.isArray(state?.unlockedAvatars) ? state.unlockedAvatars : [];
    
    return AVATAR_DEFINITIONS.map(avatar => ({
      ...avatar,
      unlocked: avatar.unlocked || avatar.starsRequired <= stars || purchased.includes(avatar.id)
    }));
  }

  /**
   * Mark an avatar as unlocked after a store purchase.
   * The currency is already deducted by RewardsStore, so this only records ownership.
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

  /**
   * Get avatar definition by ID
   */
  static getAvatarById(avatarId) {
    return AVATAR_DEFINITIONS.find(a => a.id === avatarId) || AVATAR_DEFINITIONS[0];
  }
}