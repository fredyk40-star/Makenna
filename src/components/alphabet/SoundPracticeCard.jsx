import { memo } from 'react';
import { motion } from 'framer-motion';
import { FaRegLightbulb } from 'react-icons/fa';
import VoiceButton from './VoiceButton';

const SoundPracticeCard = memo(({ letter, onPracticed }) => {
  const examples = letter.words.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-5 md:p-7"
    >
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
          Letter sound
        </p>
        <div className="text-5xl md:text-6xl font-baloo font-bold text-primary dark:text-blue-300 mt-2">
          {letter.phonetic || letter.sound}
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {letter.letter} makes the “{letter.phonetic || letter.sound}” sound.
        </p>
        <div className="flex justify-center gap-2 mt-3">
          <VoiceButton
            text={letter.phonetic || letter.sound}
            label="Hear the sound normally"
            onPracticed={() => onPracticed?.('sound')}
          />
          <VoiceButton
            text={letter.phonetic || letter.sound}
            label="Hear the sound slowly"
            slow
            onPracticed={() => onPracticed?.('sound')}
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          <FaRegLightbulb className="text-yellow-500" aria-hidden="true" />
          Words that start with {letter.letter}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {examples.map((word) => (
            <button
              key={word.word}
              type="button"
              onClick={() => onPracticed?.('sound')}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 text-left transition-colors"
            >
              <span className="text-3xl" role="img" aria-label={word.word}>{word.image}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-gray-800 dark:text-white truncate">{word.word}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{word.pronunciation}</span>
              </span>
              <VoiceButton text={word.word} label={`Pronounce ${word.word}`} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

SoundPracticeCard.displayName = 'SoundPracticeCard';

export default SoundPracticeCard;
