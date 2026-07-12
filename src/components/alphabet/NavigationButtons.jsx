import { memo } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';

const NavigationButtons = memo(({
  onPrevious,
  onNext,
  onComplete,
  isFirst,
  isLast,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  completeLabel = 'Complete'
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPrevious}
        disabled={isFirst}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
          isFirst
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        aria-label={previousLabel}
      >
        <FaArrowLeft className="text-sm" />
        {previousLabel}
      </motion.button>

      {isLast ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all duration-300 shadow-soft hover:shadow-glow"
          aria-label={completeLabel}
        >
          <FaCheck className="text-sm" />
          {completeLabel}
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 shadow-soft hover:shadow-glow"
          aria-label={nextLabel}
        >
          {nextLabel}
          <FaArrowRight className="text-sm" />
        </motion.button>
      )}
    </div>
  );
});

NavigationButtons.displayName = 'NavigationButtons';

export default NavigationButtons;