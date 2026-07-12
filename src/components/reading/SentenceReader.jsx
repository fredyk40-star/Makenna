import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaStop, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useReading } from '../../hooks/useReading';

const SentenceReader = ({ 
  sentences = [],
  onComplete = null,
  className = '' 
}) => {
  const {
    currentSentence,
    currentIndex,
    highlightedWord,
    isReading,
    startReading,
    nextSentence,
    previousSentence,
    readSentence,
    readWord,
    getSentenceProgress,
    isLastSentence,
    isFirstSentence,
    resetReading
  } = useReading();

  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (sentences.length > 0) {
      // Set the practice sentences
      // This would be integrated with the useReading hook
    }
  }, [sentences]);

  const handleReadSentence = async () => {
    if (currentSentence) {
      await readSentence(currentSentence);
    }
  };

  const handleWordClick = async (word) => {
    await readWord(word);
  };

  const handleNext = () => {
    const hasNext = nextSentence();
    if (!hasNext && onComplete) {
      onComplete();
    }
  };

  if (!currentSentence) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-4xl mb-4">📖</div>
        <p className="text-gray-600 dark:text-gray-300">
          No sentences available. Click start to begin reading!
        </p>
        <button
          onClick={() => startReading(0)}
          className="mt-4 btn-primary"
        >
          Start Reading
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          📖 Reading Practice
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {sentences.length || 10}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${getSentenceProgress()}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
        />
      </div>

      {/* Sentence Display */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4"
      >
        <div className="text-2xl md:text-3xl font-baloo text-center leading-relaxed">
          {currentSentence.sentence.split(' ').map((word, index) => (
            <motion.span
              key={index}
              whileHover={{ scale: 1.1, cursor: 'pointer' }}
              onClick={() => handleWordClick(word)}
              className={`inline-block mx-1 px-1 rounded transition-all duration-300 ${
                highlightedWord === word
                  ? 'bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white scale-110'
                  : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={previousSentence}
          disabled={isFirstSentence()}
          className={`p-3 rounded-xl transition-colors ${
            isFirstSentence()
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label="Previous sentence"
        >
          <FaArrowLeft className="text-lg" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReadSentence}
          disabled={isReading}
          className={`p-3 rounded-xl transition-colors ${
            isReading
              ? 'bg-red-500 text-white'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
          aria-label={isReading ? 'Stop reading' : 'Read sentence'}
        >
          {isReading ? <FaStop className="text-lg" /> : <FaPlay className="text-lg" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          disabled={isLastSentence()}
          className={`p-3 rounded-xl transition-colors ${
            isLastSentence()
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label="Next sentence"
        >
          <FaArrowRight className="text-lg" />
        </motion.button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        {isReading ? (
          <p>🎧 Listening to the sentence...</p>
        ) : (
          <p>👆 Click play to hear the sentence. Tap any word to hear it separately!</p>
        )}
      </div>

      {/* Word Family Info */}
      {currentSentence.family && (
        <div className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          Word family: -{currentSentence.family}
        </div>
      )}
    </div>
  );
};

export default SentenceReader;