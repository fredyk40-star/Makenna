import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBell, FaUserCircle, FaStar } from 'react-icons/fa';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const TopBar = () => {
  const { dailyStars } = useApp();
  const { theme } = useTheme();

  return (
    <header className="glassmorphism sticky top-0 z-50 px-4 py-3 md:px-6 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
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
        <div className="flex items-center gap-3 md:gap-4">
          {/* Stars */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full"
          >
            <FaStar className="text-yellow-500 text-sm md:text-base" />
            <span className="font-bold text-sm md:text-base text-gray-700 dark:text-gray-200">
              {dailyStars}
            </span>
          </motion.div>

          {/* Notification */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
            aria-label="Notifications"
          >
            <FaBell className="text-xl md:text-2xl" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
          </motion.button>

          {/* Profile */}
          <Link to="/profile">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-lg md:text-xl font-bold shadow-soft"
            >
              M
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopBar;