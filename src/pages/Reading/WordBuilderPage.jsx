import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import WordBuilder from '../../components/reading/WordBuilder';
import BlendingPlayer from '../../components/reading/BlendingPlayer';
import readingEngine from '../../services/ReadingEngine';
import wordBuilderService from '../../services/WordBuilderService';

const WordBuilderPage = () => {
  const [currentWord, setCurrentWord] = useState(null);
  const [wordList, setWordList] = useState([]);
  const [completedWords, setCompletedWords] = useState([]);
  const [showBlending, setShowBlending] = useState(false);

  useEffect(() => {
    // Get recommended words for building
    const words = wordBuilderService.getRecommendedWords('easy');
    setWordList(words);
    if (words.length > 0) {
      setCurrentWord(words[0]);
    }
  }, []);

  const handleWordComplete = (word) => {
    if (!completedWords.includes(word)) {
      setCompletedWords([...completedWords, word]);
    }
    
    // Move to next word
    const currentIndex = wordList.indexOf(word);
    if (currentIndex < wordList.length - 1) {
      setCurrentWord(wordList[currentIndex + 1]);
    } else {
      setCurrentWord(null);
    }
  };

  const handleNextWord = () => {
    if (currentWord) {
      const currentIndex = wordList.indexOf(currentWord);
      if (currentIndex < wordList.length - 1) {
        setCurrentWord(wordList[currentIndex + 1]);
      }
    }
  };

  const handlePreviousWord = () => {
    if (currentWord) {
      const currentIndex = wordList.indexOf(currentWord);
      if (currentIndex > 0) {
        setCurrentWord(wordList[currentIndex - 1]);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/learn"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Learn"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              Word Builder 🔤
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Build words by putting letters in the right order
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Completed: {completedWords.length}/{wordList.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(completedWords.length / wordList.length) * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
        />
      </div>

      {/* Word Builder */}
      {currentWord ? (
        <WordBuilder
          word={currentWord}
          onComplete={handleWordComplete}
        />
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            All Done!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            You built {completedWords.length} words!
          </p>
          <button
            onClick={() => {
              setCompletedWords([]);
              setCurrentWord(wordList[0]);
            }}
            className="mt-4 btn-primary"
          >
            Play Again
          </button>
        </motion.div>
      )}

      {/* Word Navigation */}
      {currentWord && (
        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousWord}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50"
            disabled={wordList.indexOf(currentWord) === 0}
          >
            Previous
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {wordList.indexOf(currentWord) + 1} of {wordList.length}
          </div>
          <button
            onClick={handleNextWord}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50"
            disabled={wordList.indexOf(currentWord) === wordList.length - 1}
          >
            Next
          </button>
        </div>
      )}

      {/* Blending Player */}
      <div className="mt-4">
        <button
          onClick={() => setShowBlending(!showBlending)}
          className="text-primary dark:text-blue-400 font-semibold hover:underline"
        >
          {showBlending ? 'Hide Blending' : 'Show Blending Practice'}
        </button>
        {showBlending && currentWord && (
          <div className="mt-4">
            <BlendingPlayer word={currentWord} />
          </div>
        )}
      </div>

      {/* Completed Words */}
      {completedWords.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
          <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">
            ✅ Words Completed:
          </h4>
          <div className="flex flex-wrap gap-2">
            {completedWords.map((word, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WordBuilderPage;