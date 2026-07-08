/**
 * Rewards Store Service - Smart shop for digital rewards
 * Purchase avatars, themes, stickers with coins/stars
 */
import { StorageService } from './StorageService';
import { AvatarService } from './AvatarService';
import { GamificationService } from './GamificationService';

const REWARDS_KEY = 'makenna_rewards_store';

const REWARDS = {
  avatars: [
    { id: 'star', type: 'avatar', name: 'Star', price: 50, icon: '⭐', color: '#fbbf24' },
    { id: 'boy', type: 'avatar', name: 'Boy', price: 0, icon: '👦', color: '#60a5fa' },
    { id: 'girl', type: 'avatar', name: 'Girl', price: 0, icon: '👧', color: '#f472b6' },
    { id: 'ghanaian', type: 'avatar', name: 'Ghanaian Child', price: 100, icon: '🧒', color: '#10b981' },
    { id: 'lion', type: 'avatar', name: 'Lion', price: 150, icon: '🦁', color: '#f97316' },
    { id: 'elephant', type: 'avatar', name: 'Elephant', price: 150, icon: '🐘', color: '#6b7280' },
    { id: 'monkey', type: 'avatar', name: 'Monkey', price: 200, icon: '🐵', color: '#a3e635' },
    { id: 'bird', type: 'avatar', name: 'Bird', price: 100, icon: '🐦', color: '#38bdf8' },
    { id: 'robot', type: 'avatar', name: 'Robot', price: 300, icon: '🤖', color: '#8b5cf6' },
    { id: 'unicorn', type: 'avatar', name: 'Unicorn', price: 500, icon: '🦄', color: '#ec4899' },
    { id: 'dragon', type: 'avatar', name: 'Dragon', price: 500, icon: '🐉', color: '#ef4444' },
    { id: 'wizard', type: 'avatar', name: 'Wizard', price: 400, icon: '🧙', color: '#8b5cf6' },
    { id: 'pirate', type: 'avatar', name: 'Pirate', price: 300, icon: '🏴‍☠️', color: '#f97316' },
    { id: 'princess', type: 'avatar', name: 'Princess', price: 400, icon: '👸', color: '#ec4899' }
  ],
  themes: [
    { id: 'ocean', type: 'theme', name: 'Ocean Theme', price: 200, description: 'Blue water backgrounds' },
    { id: 'space', type: 'theme', name: 'Space Theme', price: 200, description: 'Galaxy backgrounds' },
    { id: 'forest', type: 'theme', name: 'Forest Theme', price: 150, description: 'Green nature backgrounds' },
    { id: 'rainbow', type: 'theme', name: 'Rainbow Theme', price: 300, description: 'Colorful gradients' },
    { id: 'golden', type: 'theme', name: 'Golden Theme', price: 500, description: 'Premium golden UI' }
  ],
  stickers: [
    { id: 'fun1', type: 'sticker', name: 'Fun Sticker Pack 1', price: 25, count: 10 },
    { id: 'fun2', type: 'sticker', name: 'Fun Sticker Pack 2', price: 25, count: 10 },
    { id: 'animals', type: 'sticker', name: 'Animal Stickers', price: 50, count: 15 },
    { id: 'stars', type: 'sticker', name: 'Star Stickers', price: 50, count: 10 }
  ]
};

export class RewardsStore {
  /**
   * Get all available rewards
   */
  static getAllRewards() {
    return REWARDS;
  }

  /**
   * Get purchased items for a child
   */
  static getPurchasedItems(childId) {
    const purchases = StorageService.get(`${REWARDS_KEY}_${childId}`, []);
    return purchases;
  }

  /**
   * Purchase an item
   */
  static purchaseItem(childId, itemId, itemType = 'stars') {
    const reward = this.findReward(itemId);
    if (!reward) return { success: false, message: 'Item not found' };

    const gamState = GamificationService.getState(childId);
    const currency = itemType === 'coins' ? gamState.coins : gamState.stars;

    if (currency < reward.price) {
      return { success: false, message: 'Not enough currency' };
    }

    // Deduct currency
    if (itemType === 'coins') {
      gamState.coins -= reward.price;
    } else {
      gamState.stars -= reward.price;
    }
    GamificationService.saveState(childId, gamState);

    // Add to purchased items
    const purchases = this.getPurchasedItems(childId);
    if (!purchases.includes(itemId)) {
      purchases.push(itemId);
      StorageService.set(`${REWARDS_KEY}_${childId}`, purchases);
    }

    // Unlock avatar if applicable
    if (reward.type === 'avatar') {
      AvatarService.unlockAvatar(childId, itemId);
    }

    return { success: true, message: 'Purchase successful!', item: reward };
  }

  /**
   * Find reward by ID
   */
  static findReward(itemId) {
    for (const category of Object.values(REWARDS)) {
      const found = category.find(r => r.id === itemId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Get store summary
   */
  static getSummary(childId) {
    const gamState = GamificationService.getState(childId);
    const purchases = this.getPurchasedItems(childId);
    
    return {
      coins: gamState.coins,
      stars: gamState.stars,
      totalPurchased: purchases.length,
      categories: Object.keys(REWARDS)
    };
  }
}