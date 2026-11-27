import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import VoiceButton from './VoiceButton';
import FavoriteButton from './FavoriteButton';

const VocabularyCard = memo(({ word, letter, letterId, onPracticed = null }) => {
  const { isWordFavorited, toggleFavoriteWord } = useAlphabetProgress();
  const [isFlipped, setIsFlipped] = useState(false);

  const isFavorited = isWordFavorited(word.word, letterId);

  const handleFavoriteToggle = () => {
    toggleFavoriteWord(word.word, letterId);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden"
    >
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-5xl md:text-6xl" role="img" aria-label={word.word}>
                {word.image}
              </span>
              <div className="min-w-0">
                <h3 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white truncate">
                  {word.word}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sounds like: <span className="font-mono">{word.pronunciation}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VoiceButton
              text={word.word}
              label={`Pronounce ${word.word}`}
              onPracticed={() => onPracticed?.('word')}
            />
            <VoiceButton
              text={word.word}
              label={`Say ${word.word} slowly`}
              slow
              onPracticed={() => onPracticed?.('word')}
            />
            <FavoriteButton
              isFavorited={isFavorited}
              onToggle={handleFavoriteToggle}
              label={`${isFavorited ? 'Remove' : 'Add'} ${word.word} to favorites`}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <p className="text-lg text-gray-700 dark:text-gray-200 flex-1 min-w-[12rem]">
              {word.sentence}
            </p>
            <VoiceButton
              text={word.sentence}
              label="Read the sentence"
              onPracticed={() => onPracticed?.('sentence')}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {word.description}
          </p>
        </div>

        <button
          onClick={() => setIsFlipped(prev => !prev)}
          className="mt-4 text-sm text-primary dark:text-blue-400 hover:underline font-medium"
          aria-expanded={isFlipped}
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
