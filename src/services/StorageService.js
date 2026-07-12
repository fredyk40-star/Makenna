/**
 * Storage Service - Robust localStorage wrapper with error handling
 */

export class StorageService {
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error getting item ${key} from storage:`, error);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Check if quota exceeded
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('Storage quota exceeded, attempting to clean up');
        this.cleanupStorage();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (retryError) {
          console.error('Failed to save after cleanup:', retryError);
          return false;
        }
      }
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing item ${key}:`, error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing storage:', error);
      return false;
    }
  }

  static cleanupStorage() {
    // Remove old or unnecessary items
    const keys = Object.keys(localStorage);
    const sortedKeys = keys
      .map(key => ({ key, size: localStorage[key].length }))
      .sort((a, b) => b.size - a.size);
    
    // Remove largest items first until under limit
    for (const item of sortedKeys) {
      if (localStorage.length > 10) {
        localStorage.removeItem(item.key);
      }
    }
  }

  static getSize() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage[key].length * 2;
        }
      }
      return total;
    } catch (error) {
      return 0;
    }
  }

  static has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }
}