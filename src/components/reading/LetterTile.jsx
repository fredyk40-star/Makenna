import { memo } from 'react';
import { motion } from 'framer-motion';

const LetterTile = memo(({ 
  letter, 
  index, 
  isSelected = false,
  onClick = null,
  disabled = false,
  className = '' 
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-14 rounded-xl font-bold text-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isSelected
          ? 'bg-primary text-white shadow-glow'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      aria-label={`Letter ${letter}`}
    >
      {letter}
    </motion.button>
  );
});

LetterTile.displayName = 'LetterTile';

export default LetterTile;