import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheck, FaTrash } from 'react-icons/fa';
import { NotificationBellService } from '../../services/NotificationBellService';
import { NotificationService } from '../../services/NotificationService';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    
    // Listen for notification updates
    const handleStorageChange = () => {
      loadNotifications();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Close when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const loadNotifications = () => {
    const bellNotifications = NotificationBellService.getAllNotifications();
    setNotifications(bellNotifications);
    const unread = bellNotifications.filter(n => !n.read);
    setUnreadCount(unread.length);
  };

  // Initialize NotificationService with default parent ID for demo
  useEffect(() => {
    // Sync NotificationService notifications if available
    const parentId = 'demo_parent';
    const parentNotifications = NotificationService.getNotifications(parentId);
    if (parentNotifications.length > 0) {
      const allNotifications = NotificationBellService.getAllNotifications();
      // Merge parent notifications that don't already exist
      parentNotifications.forEach(pn => {
        const exists = allNotifications.some(n => n.id === pn.id);
        if (!exists) {
          NotificationBellService.addNotification({
            title: pn.title,
            message: pn.message,
            timestamp: pn.timestamp,
            read: pn.read,
            icon: pn.type === 'badge_earned' ? '🏆' : pn.type === 'weekly_report' ? '📊' : '📚'
          });
        }
      });
      loadNotifications();
    }
  }, []);

  const markAsRead = (id) => {
    NotificationBellService.markAsRead(id);
    loadNotifications();
  };

  const markAllAsRead = () => {
    NotificationBellService.markAllAsRead();
    loadNotifications();
  };

  const clearNotification = (id) => {
    NotificationBellService.clearNotification(id);
    loadNotifications();
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      NotificationBellService.clearAllNotifications();
      loadNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
        whileTap={{ scale: 0.9 }}
      >
        <FaBell className="text-white text-xl" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications yet
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{notification.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-green-500 hover:text-green-600"
                            title="Mark as read"
                          >
                            <FaCheck size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => clearNotification(notification.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;