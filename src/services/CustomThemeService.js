/**
 * Custom Theme Service - Manages UI themes and customization
 * Allows users to select/create/apply custom themes, unlock new ones
 */
import { StorageService } from './StorageService';
import { RewardsStore } from './RewardsStore';
import { NotificationBellService } from './NotificationBellService';

const THEME_KEY = 'makenna_custom_themes';

const PRESET_THEMES = [
  {
    id: 'default',
    name: 'Makenna Default',
    colors: { primary: '#8B5CF6', secondary: '#EC4899', background: '#F9FAFB', text: '#1F2937' },
    unlocked: true,
    category: 'official'
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    colors: { primary: '#0EA5E9', secondary: '#06B6D4', background: '#EFF6FF', text: '#0F172A' },
    cost: 50,
    category: 'premium'
  },
  {
    id: 'forest',
    name: 'Forest Adventure',
    colors: { primary: '#10B981', secondary: '#34D399', background: '#ECFDF5', text: '#065F46' },
    cost: 50,
    category: 'premium'
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: { primary: '#F59E0B', secondary: '#FBBF24', background: '#FFFBEB', text: '#78350F' },
    cost: 75,
    category: 'premium'
  }
];

export class CustomThemeService {
  /**
   * Get all available themes
   */
  static getAllThemes() {
    return PRESET_THEMES;
  }

  /**
   * Get a specific theme by ID
   */
  static getThemeById(themeId) {
    return PRESET_THEMES.find(theme => theme.id === themeId);
  }

  /**
   * Get user's unlocked themes
   */
  static getUserUnlockedThemes(childId) {
    const unlockedThemes = StorageService.get(`${THEME_KEY}_${childId}_unlocked`, ['default']);
    return PRESET_THEMES.filter(theme => unlockedThemes.includes(theme.id));
  }

  /**
   * Unlock a theme for a user
   */
  static unlockTheme(childId, themeId) {
    const unlockedThemes = StorageService.get(`${THEME_KEY}_${childId}_unlocked`, ['default']);
    if (!unlockedThemes.includes(themeId)) {
      unlockedThemes.push(themeId);
      StorageService.set(`${THEME_KEY}_${childId}_unlocked`, unlockedThemes);
      NotificationBellService.addNotification(childId, {
        type: 'reward',
        title: 'Theme Unlocked!',
        message: `You unlocked the '${this.getThemeById(themeId)?.name}' theme!`,
        icon: '🎨'
      });
    }
  }

  /**
   * Apply a theme for a user
   */
  static applyTheme(childId, themeId) {
    const unlockedThemes = StorageService.get(`${THEME_KEY}_${childId}_unlocked`, ['default']);
    if (unlockedThemes.includes(themeId)) {
      StorageService.set(`${THEME_KEY}_${childId}_active`, themeId);
      localStorage.setItem('makenna_active_theme', themeId); // Apply immediately
      return this.getThemeById(themeId);
    }
    return null;
  }

  /**
   * Get active theme for a user
   */
  static getActiveTheme(childId) {
    const activeThemeId = StorageService.get(`${THEME_KEY}_${childId}_active`, 'default');
    return this.getThemeById(activeThemeId) || this.getThemeById('default');
  }

  /**
   * Create a custom theme
   */
  static createCustomTheme(childId, themeName, colors) {
    const customThemes = StorageService.get(`${THEME_KEY}_${childId}_custom`, {});
    const newTheme = {
      id: `custom-${Date.now()}`,
      name: themeName,
      colors,
      category: 'custom'
    };
    customThemes[newTheme.id] = newTheme;
    StorageService.set(`${THEME_KEY}_${childId}_custom`, customThemes);
    this.applyTheme(childId, newTheme.id);
    return newTheme;
  }

  /**
   * Reset to default theme
   */
  static resetToDefault(childId) {
    StorageService.set(`${THEME_KEY}_${childId}_active`, 'default');
    localStorage.setItem('makenna_active_theme', 'default');
  }
}