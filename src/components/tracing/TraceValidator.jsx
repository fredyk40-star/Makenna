import React, { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaExclamationCircle, FaStar, FaSmile } from 'react-icons/fa';

const TraceValidator = memo(({ 
  result, 
  message,
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!result) return null;

  const { score, accuracy, completion, valid, errors } = result;
  const percentage = Math.round(score * 100);
  
  const getEmoji = () => {
    if (percentage >= 90) return '🌟';
    if (percentage >= 70) return '😊';
    if (percentage >= 50) return '💪';
    return '🤔';
  };

  const getColor = () => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    if (percentage >= 50) return 'text-orange-500';
    return 'text-blue-500';
  };

  const getBarColor = () => {
    if (percentage >= 90) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (percentage >= 70) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-blue-400 to-blue-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-gray-200/50 dark:border-gray-700/50 ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* Score indicator */}
        <div className="flex-shrink-0 text-4xl">
          {getEmoji()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {message}
          </p>
          
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full ${getBarColor()} rounded-full`}
            />
          </div>

          {/* Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        </div>

        <div className={`text-2xl font-bold ${getColor()}`}>
          {percentage}%
        </div>
      </div>

      {/* Detailed stats */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Accuracy</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {Math.round(accuracy * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Completion</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {Math.round(completion * 100)}%
                </span>
              </div>
              {valid && (
                <div className="flex items-center gap-1 text-green-500 col-span-2 justify-center">
                  <FaCheck className="text-sm" />
                  <span className="font-medium">Valid trace!</span>
                </div>
              )}
              {errors.length > 0 && (
                <div className="col-span-2 mt-1 space-y-0.5">
                  {errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs text-blue-500">
                      <FaExclamationCircle className="text-[10px]" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

TraceValidator.displayName = 'TraceValidator';

export default TraceValidator;