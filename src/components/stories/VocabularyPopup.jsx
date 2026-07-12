import { motion } from 'framer-motion';
import { FaTimes, FaStar, FaRegStar } from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';
import readingAnalyticsService from '../../services/ReadingAnalyticsService';

const VocabularyPopup = ({ word, onClose }) => {
  const { speak } = useAudio();

  const handleLearnWord = () => {
    readingAnalyticsService.recordVocabulary(word.word);
    speak(word.word, {
      rate: 0.7,
      pitch: 1.1
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{word.emoji || '📖'}</span>
            <div>
              <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                {word.word}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New Word!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Definition</p>
            <p className="text-gray-800 dark:text-gray-200 font-medium">
              {word.definition}
            </p>
          </div>

          {word.sentence && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Example</p>
              <p className="text-gray-800 dark:text-gray-200 italic">
                "{word.sentence}"
              </p>
            </div>
          )}

          <button
            onClick={handleLearnWord}
            className="w-full py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <span>Learn this word</span>
            <span className="text-sm">🔊</span>
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            💡 Tap the speaker to hear the word
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VocabularyPopup;