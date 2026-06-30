/**
 * Local storage service with type safety and error handling
 */

export class StorageService {
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // Check if item is valid JSON
      try {
        return JSON.parse(item);
      } catch {
        // If not valid JSON, return as string
        return item;
      }
    } catch (error) {
      console.error(`Error getting item ${key} from storage:`, error);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting item ${key} in storage:`, error);
      return false;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key} from storage:`, error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  static getKeys() {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting storage keys:', error);
      return [];
    }
  }

  static getSize() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length * 2; // UTF-16
        }
      }
      return total;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  // Security: Sanitize data before storage
  static sanitize(value) {
    if (typeof value === 'string') {
      // Remove potentially dangerous content
      return value.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    return value;
  }

  // Security: Validate data before retrieval
  static validate(value) {
    // Check for potential XSS patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
    ];
    
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          console.warn('Potential XSS detected in storage value');
          return false;
        }
      }
    }
    return true;
  }
}