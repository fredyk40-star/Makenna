/**
 * Performance Optimizer - Memory and render optimization utilities
 * Lazy loading, caching, virtual scrolling
 */

const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class PerformanceOptimizer {
  /**
   * Lazy load component with caching
   */
  static lazyLoad(key, loader, ttl = CACHE_TTL) {
    const cached = CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = loader();
    CACHE.set(key, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Clear cache for a key
   */
  static clearCache(key) {
    if (key) {
      CACHE.delete(key);
    } else {
      CACHE.clear();
    }
  }

  /**
   * Get cache stats
   */
  static getCacheStats() {
    return {
      size: CACHE.size,
      keys: Array.from(CACHE.keys())
    };
  }

  /**
   * Debounce function calls
   */
  static debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle function calls
   */
  static throttle(fn, limit = 100) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Virtual scrolling helper
   */
  static getVisibleItems(items, startIndex, visibleCount, total = 100) {
    const startIndexClamped = Math.max(0, Math.min(startIndex, items.length - 1));
    const visibleCountClamped = Math.min(visibleCount, items.length);
    
    return {
      items: items.slice(startIndexClamped, startIndexClamped + visibleCountClamped),
      total: items.length,
      hasMore: startIndexClamped + visibleCountClamped < items.length
    };
  }

  /**
   * Optimize images for loading
   */
  static optimizeImage(src, options = {}) {
    const { width, height, quality = 80 } = options;
    
    // Return optimized image URL (would integrate with image CDN)
    if (src.includes('http')) {
      return `${src}?w=${width || 400}&h=${height || 300}&q=${quality}`;
    }
    return src;
  }

  /**
   * Get memory usage
   */
  static getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Preload resources
   */
  static preload(resources) {
    resources.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = src.includes('.js') ? 'script' : 'style';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  /**
   * Idle callback for non-critical tasks
   */
  static idleRun(callback) {
    if ('requestIdleCallback' in window) {
      return requestIdleCallback(callback);
    }
    return setTimeout(callback, 1);
  }
}