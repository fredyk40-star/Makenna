/**
 * Rewards Store Service - one catalog, one currency (stars).
 */
import { StorageService } from './StorageService';
import { AvatarService } from './AvatarService';
import { GamificationService } from './GamificationService';
import { getAllRewards, findReward, resolveAvatarId } from '../data/rewardCatalog';

const REWARDS_KEY = 'makenna_rewards_store';

export class RewardsStore {
  static getAllRewards() {
    return getAllRewards();
  }

  static getPurchasedItems(childId) {
    return StorageService.get(`${REWARDS_KEY}_${childId}`, []);
  }

  static purchaseItem(childId, itemId) {
    const reward = findReward(itemId);
    if (!reward) return { success: false, message: 'Item not found' };

    const itemIdCanonical = resolveAvatarId(itemId);
    const purchases = this.getPurchasedItems(childId);
    if (purchases.includes(itemIdCanonical)) {
      return { success: false, message: 'You already own this item' };
    }

    const gamState = GamificationService.getState(childId);
    const stars = gamState.stars || 0;
    if (stars < reward.price) {
      return { success: false, message: 'Not enough stars' };
    }

    gamState.stars = stars - reward.price;
    GamificationService.saveState(childId, gamState);

    purchases.push(itemIdCanonical);
    StorageService.set(`${REWARDS_KEY}_${childId}`, purchases);

    if (reward.type === 'avatar') {
      const unlock = AvatarService.unlockAvatar(childId, itemIdCanonical);
      if (!unlock?.success) {
        console.warn('Avatar unlock failed:', unlock?.reason || 'unknown reason');
      }
    }

    return { success: true, message: 'Purchase successful!', item: reward };
  }

  static findReward(itemId) {
    return findReward(itemId);
  }

  static getSummary(childId) {
    const gamState = GamificationService.getState(childId);
    const purchases = this.getPurchasedItems(childId);

    return {
      stars: gamState.stars || 0,
      coins: gamState.coins || 0,
      totalPurchased: purchases.length,
      categories: Object.keys(getAllRewards()),
    };
  }
}
