/**
 * Notification Service - Parent notifications for lessons, badges, reports
 * Stored locally with schema for future cloud sync
 */
import { StorageService } from './StorageService';

const NOTIFICATIONS_KEY = 'makenna_parent_notifications';
const NOTIFICATION_LIMIT = 100;

export class NotificationService {
  /**
   * Get notifications for a parent
   */
  static getNotifications(parentId) {
    const all = StorageService.get(NOTIFICATIONS_KEY, {});
    return all[parentId] || [];
  }

  /**
   * Save notifications for a parent
   */
  static saveNotifications(parentId, notifications) {
    const all = StorageService.get(NOTIFICATIONS_KEY, {});
    all[parentId] = notifications;
    StorageService.set(NOTIFICATIONS_KEY, all);
  }

  /**
   * Add a notification
   */
  static addNotification(parentId, notification) {
    const notifications = this.getNotifications(parentId);
    notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    });
    
    if (notifications.length > NOTIFICATION_LIMIT) {
      notifications.splice(NOTIFICATION_LIMIT);
    }
    
    this.saveNotifications(parentId, notifications);
    return notifications[0];
  }

  /**
   * Mark notification as read
   */
  static markRead(parentId, notificationId) {
    const notifications = this.getNotifications(parentId);
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      this.saveNotifications(parentId, notifications);
    }
  }

  /**
   * Mark all as read
   */
  static markAllRead(parentId) {
    const notifications = this.getNotifications(parentId);
    notifications.forEach(n => n.read = true);
    this.saveNotifications(parentId, notifications);
  }

  /**
   * Clear all notifications
   */
  static clearNotifications(parentId) {
    this.saveNotifications(parentId, []);
  }

  /**
   * Notify lesson completed
   */
  static notifyLessonCompleted(parentId, childName, subject, score) {
    return this.addNotification(parentId, {
      type: 'lesson_completed',
      title: 'Lesson Completed! 🎉',
      message: `${childName} completed a ${subject} lesson with ${score}% score!`,
      childName,
      subject,
      score
    });
  }

  /**
   * Notify badge earned
   */
  static notifyBadgeEarned(parentId, childName, badgeName, badgeIcon) {
    return this.addNotification(parentId, {
      type: 'badge_earned',
      title: `${badgeIcon} New Badge!`,
      message: `${childName} earned the "${badgeName}" badge!`,
      childName,
      badgeName,
      badgeIcon
    });
  }

  /**
   * Notify weekly report ready
   */
  static notifyWeeklyReport(parentId, childName) {
    return this.addNotification(parentId, {
      type: 'weekly_report',
      title: 'Weekly Report Ready 📊',
      message: `${childName}'s weekly learning report is ready to view.`,
      childName
    });
  }

  /**
   * Notify child inactive
   */
  static notifyChildInactive(parentId, childName, days) {
    return this.addNotification(parentId, {
      type: 'child_inactive',
      title: 'Child Inactive ⚠️',
      message: `${childName} hasn't logged in for ${days} days.`,
      childName,
      days
    });
  }

  /**
   * Notify excellent improvement
   */
  static notifyExcellentImprovement(parentId, childName, subject, improvement) {
    return this.addNotification(parentId, {
      type: 'excellent_improvement',
      title: 'Excellent Progress! 📈',
      message: `${childName} improved ${improvement}% in ${subject}!`,
      childName,
      subject,
      improvement
    });
  }

  /**
   * Get unread count
   */
  static getUnreadCount(parentId) {
    const notifications = this.getNotifications(parentId);
    return notifications.filter(n => !n.read).length;
  }

  /**
   * Get notification summary
   */
  static getSummary(parentId) {
    const notifications = this.getNotifications(parentId);
    const unread = notifications.filter(n => !n.read);
    
    return {
      total: notifications.length,
      unread: unread.length,
      byType: this.getNotificationsByType(notifications)
    };
  }

  /**
   * Group notifications by type
   */
  static getNotificationsByType(notifications) {
    const groups = {};
    notifications.forEach(n => {
      groups[n.type] = (groups[n.type] || 0) + 1;
    });
    return groups;
  }
}