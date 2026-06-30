import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaVolumeUp, FaStar, FaRegStar } from 'react-icons/fa';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import VoiceButton from './VoiceButton';
import FavoriteButton from './FavoriteButton';

const VocabularyCard = memo(({ word, letter, letterId }) => {
  const { isWordFavorited, toggleFavoriteWord } = useAlphabetProgress();
  const [isFlipped, setIsFlipped] = useState(false);
  
  const isFavorited = isWordFavorited(word.word, letterId);

  const handleFavoriteToggle = () => {
    toggleFavoriteWord(word.word, letterId);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden"
    >
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-5xl md:text-6xl" role="img" aria-label={word.word}>
                {word.image}
              </span>
              <div>
                <h3 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  {word.word}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {word.pronunciation}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceButton
              text={`${word.word}. ${word.sentence}`}
              label={`Pronounce ${word.word}`}
              className="text-primary hover:text-primary-dark transition-colors p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
            />
            <FavoriteButton
              isFavorited={isFavorited}
              onToggle={handleFavoriteToggle}
              label={`${isFavorited ? 'Remove' : 'Add'} ${word.word} to favorites`}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-lg text-gray-700 dark:text-gray-200">
            {word.sentence}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {word.description}
          </p>
        </div>

        <button
          onClick={handleFlip}
          className="mt-4 text-sm text-primary dark:text-blue-400 hover:underline font-medium"
          aria-label={`Learn more about ${word.word}`}
        >
          {isFlipped ? 'Show less' : 'Learn more'} →
        </button>

        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
          >
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-semibold">Fun fact:</span> The word "{word.word}" 
              starts with the letter {letter}. {word.description}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

VocabularyCard.displayName = 'VocabularyCard';

export default VocabularyCard;