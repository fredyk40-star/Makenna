import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaStar, FaMoon, FaSun, FaUserCircle } from 'react-icons/fa';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useChildAccount } from '../../context/ChildAccountContext';
import NotificationBell from './NotificationBell';

const TopBar = () => {
  const { dailyStars } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { childName } = useChildAccount();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const toggleNotifications = () => setShowNotifications(prev => !prev);
  const closeNotifications = () => setShowNotifications(false);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const profileInitial = childName
    ? childName.charAt(0).toUpperCase()
    : 'M';

  return (
    <header className="glassmorphism sticky top-0 z-50 px-4 py-3 md:px-6 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" aria-label="Go to home">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-3xl md:text-4xl"
          >
            🌈
          </motion.div>
          <div className="hidden xs:block">
            <h1 className="font-baloo text-xl md:text-2xl font-bold text-primary dark:text-blue-400">
              Makenna Lab
            </h1>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Stars */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full"
            title="Daily stars earned"
          >
            <FaStar className="text-yellow-500 text-sm md:text-base" />
            <span className="font-bold text-sm md:text-base text-gray-700 dark:text-gray-200">
              {dailyStars ?? 0}
            </span>
          </motion.div>

          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Notification Bell - Using enhanced NotificationBell component */}
          <NotificationBell />

          {/* Profile */}
          <Link to="/profile" aria-label="Go to profile">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-base md:text-lg font-bold shadow-soft"
              title={childName ?? 'Profile'}
            >
              {profileInitial}
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopBar;