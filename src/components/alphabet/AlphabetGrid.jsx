import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaStar, FaCheck } from 'react-icons/fa';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { staggerContainer } from '../../utils/constants';

const AlphabetGrid = memo(({ letters }) => {
  const { isLetterCompleted, isLetterFavorited } = useAlphabetProgress();

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
    >
      {letters.map((letter, index) => {
        const isCompleted = isLetterCompleted(letter.id);
        const isFavorited = isLetterFavorited(letter.id);

        return (
          <motion.div
            key={letter.id}
            variants={{
              initial: { opacity: 0, scale: 0.9 },
              animate: { 
                opacity: 1, 
                scale: 1,
                transition: { delay: index * 0.05 }
              }
            }}
            whileHover={{ 
              scale: 1.05,
              y: -4,
              boxShadow: '0 12px 48px rgba(0,0,0,0.12)'
            }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Link
              to={`/alphabet/lesson/${letter.id}`}
              className="block bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft hover:shadow-hover transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Learn letter ${letter.letter}`}
            >
              {/* Letter Display */}
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-baloo font-bold text-primary dark:text-blue-400">
                  {letter.letter}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {letter.lowercase}
                </div>
              </div>

              {/* Icon Placeholder */}
              <div className="mt-3 text-3xl text-center">
                {letter.words[0]?.image || '📚'}
              </div>

              {/* Status Indicators */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {isCompleted && (
                  <span className="text-green-500 text-xs flex items-center gap-1">
                    <FaCheck className="text-[10px]" />
                    <span className="sr-only">Completed</span>
                  </span>
                )}
                {isFavorited && (
                  <span className="text-yellow-500 text-xs">
                    <FaStar className="text-[10px]" />
                    <span className="sr-only">Favorite</span>
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

AlphabetGrid.displayName = 'AlphabetGrid';

export default AlphabetGrid;