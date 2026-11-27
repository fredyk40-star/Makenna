import { describe, expect, it } from 'vitest';
import AccessibilityService from './AccessibilityService';

describe('AccessibilityService', () => {
  it('persists settings and applies them to the document root', () => {
    const settings = AccessibilityService.updateSettings({
      dyslexiaFont: true,
      largeText: true,
      captions: true,
      switchControl: true,
      switchInterval: 800,
    });

    expect(settings.dyslexiaFont).toBe(true);
    expect(AccessibilityService.getSettings().switchInterval).toBe(800);
    expect(document.documentElement.classList.contains('dyslexia-font')).toBe(true);
    expect(document.documentElement.classList.contains('large-text')).toBe(true);
    expect(document.documentElement.classList.contains('captions-on')).toBe(true);
    expect(document.documentElement.classList.contains('switch-control')).toBe(true);
  });

  it('stores the latest spoken text for captions', () => {
    AccessibilityService.announceCaption('Find the letter A');
    expect(AccessibilityService.getLastCaption()).toBe('Find the letter A');
  });

  it('cleans up when reset', () => {
    AccessibilityService.updateSettings({ highContrast: true });
    AccessibilityService.reset();
    expect(AccessibilityService.getSettings().highContrast).toBe(false);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });
});
