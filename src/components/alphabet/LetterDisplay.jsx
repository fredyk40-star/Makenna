import { memo } from 'react';
import { motion } from 'framer-motion';
import VoiceButton from './VoiceButton';
import FavoriteButton from './FavoriteButton';

const LetterDisplay = memo(({
  letter,
  lowercase,
  sound,
  phonetic,
  description,
  isFavorited,
  onFavoriteToggle,
  onPracticed = null,
}) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-5 sm:p-6 md:p-8 text-center"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-baloo font-bold text-primary dark:text-blue-400 animate-float">
              {letter}
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl text-gray-600 dark:text-gray-300">
              {lowercase}
            </div>
            <FavoriteButton
              isFavorited={isFavorited}
              onToggle={onFavoriteToggle}
              label={`${isFavorited ? 'Remove' : 'Add'} ${letter} to favorites`}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
              Sounds like: {sound}
              {phonetic && <span className="ml-2 font-mono text-sm text-gray-500">({phonetic})</span>}
            </span>
            <VoiceButton
              text={`${letter} says ${sound}`}
              label={`Pronounce letter ${letter}`}
              onPracticed={() => onPracticed?.('letter')}
            />
            <VoiceButton
              text={sound}
              label={`Hear the ${letter} sound`}
              slow
              onPracticed={() => onPracticed?.('sound')}
            />
          </div>
        </div>
        <div>
          <VoiceButton
            text={description}
            label={`Hear description of letter ${letter}`}
            className="btn-primary flex items-center gap-2"
            onPracticed={() => onPracticed?.('letter')}
          />
        </div>
      </div>

      <p className="mt-4 text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
        {description}
      </p>
    </motion.div>
  );
});

LetterDisplay.displayName = 'LetterDisplay';

export default LetterDisplay;
