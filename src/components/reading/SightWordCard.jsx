import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaVolumeUp } from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';

const SightWordCard = ({ 
  word,
  category = '',
  frequency = 1,
  onComplete = null,
  className = '' 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak, isPlaying } = useAudio();

  const handlePlayWord = async () => {
    await speak(word, {
      rate: 0.7,
      pitch: 1.1
    });
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped && onComplete) {
      onComplete(word);
    }
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      'pronoun': 'Pronoun',
      'verb': 'Verb',
      'article': 'Article',
      'preposition': 'Preposition',
      'possessive': 'Possessive',
      'conjunction': 'Conjunction'
    };
    return labels[cat] || cat;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 ${className}`}
    >
      <div className="text-center">
        {/* Word */}
        <div className="text-5xl md:text-6xl font-baloo font-bold text-gray-800 dark:text-white mb-3">
          {word}
        </div>

        {/* Category Badge */}
        {category && (
          <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium mb-3">
            {getCategoryLabel(category)}
          </div>
        )}

        {/* Frequency Indicator */}
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < frequency ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {frequency === 1 ? 'Beginner' : frequency === 2 ? 'Intermediate' : 'Advanced'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlayWord}
            disabled={isPlaying}
            className="p-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`Hear ${word}`}
          >
            <FaVolumeUp className="text-xl" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFlip}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {isFlipped ? 'Hide Practice' : 'Practice'}
          </motion.button>
        </div>

        {/* Practice Section */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                ✍️ Try writing this word 3 times in your notebook!
              </p>
              <div className="mt-3 flex justify-center gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-sm"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                💡 Try using "{word}" in a sentence!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SightWordCard;