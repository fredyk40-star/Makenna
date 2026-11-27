/**
 * AccessibilityService - persisted, device-wide accessibility preferences.
 *
 * Settings are applied to <html> so games, tracing, stories and settings all
 * respond to the same choices without every component owning its own copy.
 */
import { StorageService } from './StorageService';

const SETTINGS_KEY = 'makenna_accessibility_v1';
const CAPTION_KEY = 'makenna_last_caption';

export const DEFAULT_ACCESSIBILITY_SETTINGS = {
  dyslexiaFont: false,
  largeText: false,
  highContrast: false,
  reducedMotion: false,
  captions: false,
  soundSensitive: false,
  switchControl: false,
  switchInterval: 1200,
};

const listeners = new Set();
const captionListeners = new Set();

const sanitize = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(Object.entries(DEFAULT_ACCESSIBILITY_SETTINGS).map(([key, fallback]) => {
    const incoming = source[key];
    if (typeof fallback === 'boolean') return [key, typeof incoming === 'boolean' ? incoming : fallback];
    const number = Number(incoming);
    return [key, Number.isFinite(number) && number >= 300 ? number : fallback];
  }));
};

export class AccessibilityService {
  static getSettings() {
    return sanitize(StorageService.get(SETTINGS_KEY, {}));
  }

  static updateSettings(updates = {}) {
    const next = sanitize({ ...this.getSettings(), ...updates });
    StorageService.set(SETTINGS_KEY, next);
    this.apply(next);
    listeners.forEach(listener => {
      try {
        listener(next);
      } catch (error) {
        console.warn('Accessibility listener failed:', error);
      }
    });
    return next;
  }

  static reset() {
    return this.updateSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
  }

  static apply(settings = this.getSettings()) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const classes = {
      'dyslexia-font': settings.dyslexiaFont,
      'large-text': settings.largeText,
      'high-contrast': settings.highContrast,
      'reduced-motion': settings.reducedMotion,
      'captions-on': settings.captions,
      'sound-sensitive': settings.soundSensitive,
      'switch-control': settings.switchControl,
    };

    Object.entries(classes).forEach(([className, active]) => {
      root.classList.toggle(className, !!active);
    });
    root.style.setProperty('--makenna-switch-interval', `${settings.switchInterval}ms`);
  }

  static subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /** Audio and speech providers call this so captions mirror spoken prompts. */
  static announceCaption(text) {
    if (!text) return;
    StorageService.set(CAPTION_KEY, String(text));
    captionListeners.forEach(listener => {
      try {
        listener(String(text));
      } catch (error) {
        console.warn('Caption listener failed:', error);
      }
    });
  }

  static subscribeCaptions(listener) {
    captionListeners.add(listener);
    return () => captionListeners.delete(listener);
  }

  static getLastCaption() {
    return StorageService.get(CAPTION_KEY, '');
  }

  static init() {
    this.apply();
    return this.getSettings();
  }
}

export default AccessibilityService;
