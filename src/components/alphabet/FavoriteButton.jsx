import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaRegStar } from 'react-icons/fa';

const FavoriteButton = memo(({ isFavorited, onToggle, label = 'Toggle favorite' }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isFavorited
          ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
          : 'text-gray-400 hover:text-yellow-500 bg-gray-100 dark:bg-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
      }`}
      aria-label={label}
      aria-pressed={isFavorited}
    >
      {isFavorited ? <FaStar className="text-xl" /> : <FaRegStar className="text-xl" />}
    </motion.button>
  );
});

FavoriteButton.displayName = 'FavoriteButton';

export default FavoriteButton;