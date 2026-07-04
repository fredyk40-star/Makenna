import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaGift, FaExclamationCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

const Notifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, icon: <FaGift className="text-yellow-500" />, text: "You've unlocked the 'First Game' achievement!", time: '2m ago', read: false },
    { id: 2, icon: <FaBell className="text-blue-500" />, text: 'New story available: The Lion and the Mouse.', time: '1h ago', read: false },
    { id: 3, icon: <FaExclamationCircle className="text-red-500" />, text: 'Parent Zone: Weekly report is ready.', time: '3h ago', read: true },
    { id: 4, icon: <FaCheckCircle className="text-green-500" />, text: 'You completed the Alphabet lesson!', time: '5h ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
    >
      <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close notifications"
        >
          <FaTimes />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <FaBell className="text-3xl mx-auto mb-2 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={() => markRead(notification.id)}
              className={`flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border-b dark:border-gray-700/50 last:border-b-0 ${
                !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="text-xl mt-0.5 flex-shrink-0">{notification.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200 font-medium'}`}>
                  {notification.text}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
                <button
                  onClick={(e) => clearNotification(notification.id, e)}
                  className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1"
                  aria-label="Dismiss notification"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {notifications.length > 0 && unreadCount > 0 && (
        <div className="p-3 text-center border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <button
            onClick={markAllRead}
            className="text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Notifications;
