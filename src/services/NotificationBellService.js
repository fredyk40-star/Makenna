/**
 * Notification Bell Service - Visual notification indicator
 * Shows unread count, manages notification display
 */
import { StorageService } from './StorageService';

const NOTIFICATION_KEY = 'makenna_notifications';

export class NotificationBellService {
  /**
   * Get notifications for a user
   */
  static getNotifications(userId) {
    return StorageService.get(`${NOTIFICATION_KEY}_${userId}`, []);
  }

  /**
   * Add notification
   */
  static addNotification(userId, notification) {
    const notifications = this.getNotifications(userId);
    notifications.unshift({
      ...notification,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    });
    StorageService.set(`${NOTIFICATION_KEY}_${userId}`, notifications);
    return notifications;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(userId, notificationId) {
    const notifications = this.getNotifications(userId);
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      notifications[index].read = true;
      StorageService.set(`${NOTIFICATION_KEY}_${userId}`, notifications);
    }
  }

  /**
   * Get unread count
   */
  static getUnreadCount(userId) {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Clear all notifications
   */
  static clearAll(userId) {
    StorageService.set(`${NOTIFICATION_KEY}_${userId}`, []);
  }

  /**
   * Remove specific notification
   */
  static removeNotification(userId, notificationId) {
    const notifications = this.getNotifications(userId);
    const filtered = notifications.filter(n => n.id !== notificationId);
    StorageService.set(`${NOTIFICATION_KEY}_${userId}`, filtered);
  }

  /**
   * Get notification types
   */
  static getNotificationTypes() {
    return ['achievement', 'progress', 'reminder', 'update', 'social'];
  }

  /**
   * Create achievement notification
   */
  static createAchievementNotification(userId, achievement) {
    return this.addNotification(userId, {
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You earned the ${achievement.name} badge!`,
      icon: achievement.icon
    });
  }

  /**
   * Create progress notification
   */
  static createProgressNotification(userId, progress) {
    return this.addNotification(userId, {
      type: 'progress',
      title: 'Progress Update',
      message: `You've mastered ${progress.count} ${progress.subject} items!`,
      icon: '📈'
    });
  }

  /**
   * Create reminder notification
   */
  static createReminderNotification(userId, reminder) {
    return this.addNotification(userId, {
      type: 'reminder',
      title: 'Learning Reminder',
      message: reminder.message,
      icon: '⏰'
    });
  }
}