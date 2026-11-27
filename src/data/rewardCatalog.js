/**
 * Single source of truth for rewards, avatars and their legacy ids.
 * Every service that sells, unlocks or displays a reward uses this catalog.
 */

export const AVATAR_ALIASES = {
  star: 'default',
  ghanaian: 'ghanaian-child',
};

export const resolveAvatarId = (avatarId) => AVATAR_ALIASES[avatarId] || avatarId;

export const REWARD_CATALOG = {
  avatars: [
    { id: 'default', legacyIds: ['star'], type: 'avatar', name: 'Star', icon: '⭐', color: '#fbbf24', price: 0, starsRequired: 0, category: 'free', unlocked: true },
    { id: 'boy', type: 'avatar', name: 'Boy', icon: '👦', color: '#60a5fa', price: 0, starsRequired: 0, category: 'free', unlocked: true },
    { id: 'girl', type: 'avatar', name: 'Girl', icon: '👧', color: '#f472b6', price: 0, starsRequired: 0, category: 'free', unlocked: true },
    { id: 'ghanaian-child', legacyIds: ['ghanaian'], type: 'avatar', name: 'Ghanaian Child', icon: '🇬🇭', color: '#10b981', price: 100, starsRequired: 100, category: 'cultural' },
    { id: 'lion', type: 'avatar', name: 'Lion', icon: '🦁', color: '#f97316', price: 150, starsRequired: 150, category: 'animals' },
    { id: 'elephant', type: 'avatar', name: 'Elephant', icon: '🐘', color: '#6b7280', price: 150, starsRequired: 150, category: 'animals' },
    { id: 'monkey', type: 'avatar', name: 'Monkey', icon: '🐵', color: '#a3e635', price: 200, starsRequired: 200, category: 'animals' },
    { id: 'bird', type: 'avatar', name: 'Bird', icon: '🐦', color: '#38bdf8', price: 100, starsRequired: 100, category: 'animals' },
    { id: 'robot', type: 'avatar', name: 'Robot', icon: '🤖', color: '#8b5cf6', price: 300, starsRequired: 300, category: 'futuristic' },
    { id: 'unicorn', type: 'avatar', name: 'Unicorn', icon: '🦄', color: '#ec4899', price: 500, starsRequired: 500, category: 'fantasy' },
    { id: 'dragon', type: 'avatar', name: 'Dragon', icon: '🐉', color: '#ef4444', price: 500, starsRequired: 500, category: 'fantasy' },
    { id: 'wizard', type: 'avatar', name: 'Wizard', icon: '🧙', color: '#8b5cf6', price: 400, starsRequired: 400, category: 'fantasy' },
    { id: 'pirate', type: 'avatar', name: 'Pirate', icon: '🏴‍☠️', color: '#f97316', price: 300, starsRequired: 300, category: 'fantasy' },
    { id: 'princess', type: 'avatar', name: 'Princess', icon: '👸', color: '#ec4899', price: 400, starsRequired: 400, category: 'fantasy' },
  ],
  themes: [
    { id: 'ocean', type: 'theme', name: 'Ocean Theme', icon: '🌊', color: '#0ea5e9', price: 200, description: 'Blue water backgrounds' },
    { id: 'space', type: 'theme', name: 'Space Theme', icon: '🚀', color: '#6366f1', price: 200, description: 'Galaxy backgrounds' },
    { id: 'forest', type: 'theme', name: 'Forest Theme', icon: '🌲', color: '#22c55e', price: 150, description: 'Green nature backgrounds' },
    { id: 'rainbow', type: 'theme', name: 'Rainbow Theme', icon: '🌈', color: '#f43f5e', price: 300, description: 'Colorful gradients' },
    { id: 'golden', type: 'theme', name: 'Golden Theme', icon: '👑', color: '#eab308', price: 500, description: 'Premium golden UI' },
  ],
  stickers: [
    { id: 'fun1', type: 'sticker', name: 'Fun Sticker Pack 1', icon: '✨', color: '#a78bfa', price: 25, count: 10 },
    { id: 'fun2', type: 'sticker', name: 'Fun Sticker Pack 2', icon: '🎈', color: '#f472b6', price: 25, count: 10 },
    { id: 'animals', type: 'sticker', name: 'Animal Stickers', icon: '🐾', color: '#34d399', price: 50, count: 15 },
    { id: 'stars', type: 'sticker', name: 'Star Stickers', icon: '🌟', color: '#fbbf24', price: 50, count: 10 },
  ],
};

export const findReward = (itemId) => {
  const canonicalId = resolveAvatarId(itemId);

  for (const category of Object.values(REWARD_CATALOG)) {
    const found = category.find((item) => item.id === canonicalId
      || item.legacyIds?.includes(itemId));
    if (found) return found;
  }

  return null;
};

export const getAllRewards = () => REWARD_CATALOG;
