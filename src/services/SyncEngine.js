/**
 * Offline Sync Engine - Queue updates while offline and sync when online
 * Handles Progress, Stars, Coins, Achievements, Reports, Certificates
 */
import { StorageService } from './StorageService';

const SYNC_QUEUE_KEY = 'makenna_sync_queue';
const SYNC_STATUS_KEY = 'makenna_sync_status';

export class SyncEngine {
  /**
   * Get sync queue for a child
   */
  static getQueue(childId) {
    const allQueues = StorageService.get(SYNC_QUEUE_KEY, {});
    return allQueues[childId] || [];
  }

  /**
   * Add item to sync queue
   */
  static addToQueue(childId, item) {
    const queue = this.getQueue(childId);
    queue.push({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: item.type,
      data: item.data,
      syncAttempt: 0
    });
    this.saveQueue(childId, queue);
    return queue.length;
  }

  /**
   * Save queue for a child
   */
  static saveQueue(childId, queue) {
    const allQueues = StorageService.get(SYNC_QUEUE_KEY, {});
    allQueues[childId] = queue;
    StorageService.set(SYNC_QUEUE_KEY, allQueues);
  }

  /**
   * Get sync status
   */
  static getStatus() {
    return StorageService.get(SYNC_STATUS_KEY, {
      online: navigator.onLine,
      lastSync: null,
      pendingItems: 0,
      failedItems: 0
    });
  }

  /**
   * Update sync status
   */
  static setStatus(status) {
    StorageService.set(SYNC_STATUS_KEY, status);
  }

  /**
   * Queue a progress update
   */
  static queueProgressUpdate(childId, progressData) {
    return this.addToQueue(childId, {
      type: 'progress',
      data: progressData
    });
  }

  /**
   * Queue a stars update
   */
  static queueStarsUpdate(childId, stars) {
    return this.addToQueue(childId, {
      type: 'stars',
      data: { stars }
    });
  }

  /**
   * Queue a coins update
   */
  static queueCoinsUpdate(childId, coins) {
    return this.addToQueue(childId, {
      type: 'coins',
      data: { coins }
    });
  }

  /**
   * Queue an achievement
   */
  static queueAchievement(childId, achievement) {
    return this.addToQueue(childId, {
      type: 'achievement',
      data: achievement
    });
  }

  /**
   * Queue a certificate generation
   */
  static queueCertificate(childId, certificateData) {
    return this.addToQueue(childId, {
      type: 'certificate',
      data: certificateData
    });
  }

  /**
   * Check if online
   */
  static isOnline() {
    return navigator.onLine;
  }

  /**
   * Process queue when online
   */
  static async processQueue(childId) {
    if (!this.isOnline()) return false;

    const queue = this.getQueue(childId);
    const processed = [];
    const failed = [];

    for (const item of queue) {
      try {
        await this.processItem(item);
        processed.push(item.id);
      } catch (error) {
        item.syncAttempt++;
        if (item.syncAttempt >= 3) {
          failed.push(item.id);
        } else {
          // Keep in queue for retry
          processed.push(item.id); // Will be removed and re-added
        }
      }
    }

    // Remove processed items
    let remainingQueue = queue.filter(item => !processed.includes(item.id));
    
    // Re-add items that need retry
    for (const item of queue.filter(i => processed.includes(i.id) && !failed.includes(i.id))) {
      if (item.syncAttempt < 3) {
        remainingQueue.push(item);
      }
    }

    this.saveQueue(childId, remainingQueue);

    const status = this.getStatus();
    status.lastSync = new Date().toISOString();
    status.pendingItems = remainingQueue.length;
    status.failedItems = failed.length;
    this.setStatus(status);

    return { processed: processed.length, failed: failed.length };
  }

  /**
   * Process a single queue item
   */
  static async processItem(item) {
    // Simulate API call for now (would connect to backend)
    // For offline-first app, this just validates the data
    switch (item.type) {
      case 'progress':
        // Validate progress data structure
        if (!item.data || typeof item.data !== 'object') {
          throw new Error('Invalid progress data');
        }
        break;
      case 'stars':
        if (typeof item.data.stars !== 'number') {
          throw new Error('Invalid stars data');
        }
        break;
      case 'coins':
        if (typeof item.data.coins !== 'number') {
          throw new Error('Invalid coins data');
        }
        break;
      case 'achievement':
        if (!item.data.id) {
          throw new Error('Invalid achievement data');
        }
        break;
      case 'certificate':
        if (!item.data.name) {
          throw new Error('Invalid certificate data');
        }
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    return true;
  }

  /**
   * Clear queue for a child
   */
  static clearQueue(childId) {
    this.saveQueue(childId, []);
  }

  /**
   * Get sync summary
   */
  static getSummary(childId) {
    const queue = this.getQueue(childId);
    const status = this.getStatus();
    
    const itemsByType = {};
    queue.forEach(item => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
    });

    return {
      ...status,
      pendingItems: queue.length,
      itemsByType,
      hasPending: queue.length > 0
    };
  }
}