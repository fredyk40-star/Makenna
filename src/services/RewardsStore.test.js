import { describe, expect, it } from 'vitest';
import { RewardsStore } from './RewardsStore';
import { AvatarService } from './AvatarService';
import { GamificationService } from './GamificationService';

const giveStars = (childId, stars) => {
  const state = GamificationService.getState(childId);
  state.stars = stars;
  GamificationService.saveState(childId, state);
};

describe('RewardsStore', () => {
  it('purchases an avatar once, deducts stars once, and unlocks it in the selector', () => {
    giveStars('child-1', 1000);

    const result = RewardsStore.purchaseItem('child-1', 'lion');

    expect(result.success).toBe(true);
    expect(GamificationService.getState('child-1').stars).toBe(850);
    expect(RewardsStore.getPurchasedItems('child-1')).toContain('lion');
    expect(AvatarService.getUnlockedAvatars('child-1')).toContain('lion');
    expect(AvatarService.getAvailableAvatars('child-1').find(item => item.id === 'lion').unlocked).toBe(true);
  });

  it('refuses duplicate purchases without charging again', () => {
    giveStars('child-2', 1000);
    RewardsStore.purchaseItem('child-2', 'lion');

    const duplicate = RewardsStore.purchaseItem('child-2', 'lion');

    expect(duplicate.success).toBe(false);
    expect(GamificationService.getState('child-2').stars).toBe(850);
  });

  it('refuses purchases when the child does not have enough stars', () => {
    giveStars('child-3', 10);

    const result = RewardsStore.purchaseItem('child-3', 'dragon');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Not enough stars');
    expect(RewardsStore.getPurchasedItems('child-3')).not.toContain('dragon');
  });

  it('normalizes legacy avatar ids to the canonical catalog id', () => {
    giveStars('child-4', 500);

    expect(RewardsStore.purchaseItem('child-4', 'ghanaian').success).toBe(true);
    expect(RewardsStore.getPurchasedItems('child-4')).toContain('ghanaian-child');
    expect(AvatarService.getSelectedAvatar('child-4')).toBe('default');
  });
});
