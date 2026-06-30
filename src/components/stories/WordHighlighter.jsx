import React, { memo } from 'react';
import { motion } from 'framer-motion';

const WordHighlighter = memo(({ 
  text, 
  highlightedWord = '', 
  onWordClick = null,
  className = '' 
}) => {
  const words = text.split(' ');

  return (
    <div className={`flex flex-wrap justify-center gap-1 ${className}`}>
      {words.map((word, index) => {
        const isHighlighted = word.toLowerCase() === highlightedWord.toLowerCase();
        
        return (
          <motion.span
            key={index}
            whileHover={{ scale: 1.1, cursor: onWordClick ? 'pointer' : 'default' }}
            onClick={() => onWordClick?.(word)}
            className={`inline-block px-1 rounded transition-all duration-300 ${
              isHighlighted
                ? 'bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white scale-110'
                : 'text-gray-800 dark:text-gray-200'
            }`}
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
});

WordHighlighter.displayName = 'WordHighlighter';

export default WordHighlighter;