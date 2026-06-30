import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaArrowRight, FaPlay, FaPause, 
  FaVolumeUp, FaVolumeMute, FaBook, FaHeadphones,
  FaList, FaTimes
} from 'react-icons/fa';
import { useStory } from '../../hooks/useStory';
import PageTurn from './PageTurn';
import WordHighlighter from './WordHighlighter';
import VocabularyPopup from './VocabularyPopup';
import { Link } from 'react-router-dom';

const BookReader = ({ storyId, onClose = null }) => {
  const {
    story,
    currentPage,
    pageNumber,
    totalPages,
    progress,
    isComplete,
    readingMode,
    isPlaying,
    highlightedWord,
    vocabulary,
    nextPage,
    previousPage,
    togglePlayPause,
    readPage,
    readWord,
    stopReading,
    changeMode,
    resetStory
  } = useStory(storyId);

  const [showVocabulary, setShowVocabulary] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isBookOpen, setIsBookOpen] = useState(true);

  useEffect(() => {
    // Auto-read first page
    if (readingMode === 'read-to-me' && currentPage && !isPlaying) {
      readPage();
    }
  }, [currentPage, readingMode]);

  const handleWordClick = (word) => {
    if (readingMode === 'read-by-myself') {
      readWord(word);
      
      // Check if word is in vocabulary
      const vocabWord = vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
      if (vocabWord) {
        setSelectedWord(vocabWord);
        setShowVocabulary(true);
      }
    }
  };

  const handlePageTurn = (direction) => {
    if (direction === 'next') {
      if (pageNumber === totalPages - 1) {
        // Story complete
        if (onClose) onClose();
      } else {
        nextPage();
      }
    } else {
      previousPage();
    }
  };

  const handleModeToggle = () => {
    const newMode = readingMode === 'read-to-me' ? 'read-by-myself' : 'read-to-me';
    changeMode(newMode);
    if (newMode === 'read-to-me') {
      readPage();
    } else {
      stopReading();
    }
  };

  if (!story || !currentPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">📖</div>
          <p className="text-gray-600 dark:text-gray-300">Loading story...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            to="/stories"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Library"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h2 className="font-baloo text-lg font-bold text-gray-800 dark:text-white">
              {story.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {pageNumber + 1} of {totalPages}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <button
            onClick={handleModeToggle}
            className={`p-2 rounded-xl transition-colors ${
              readingMode === 'read-to-me'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
            aria-label={readingMode === 'read-to-me' ? 'Switch to read by myself' : 'Switch to read to me'}
          >
            {readingMode === 'read-to-me' ? <FaHeadphones /> : <FaBook />}
          </button>

          {/* Vocabulary Button */}
          {vocabulary.length > 0 && (
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Show vocabulary"
            >
              <FaList />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Close reader"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
        />
      </div>

      {/* Page Content */}
      <div className="p-6 min-h-[400px]">
        <PageTurn
          pageNumber={pageNumber}
          totalPages={totalPages}
          onPageTurn={handlePageTurn}
        >
          {/* Illustration */}
          <div className="text-center mb-6">
            <div className="text-8xl md:text-9xl animate-float">
              {currentPage.illustration}
            </div>
          </div>

          {/* Text with Highlighting */}
          <WordHighlighter
            text={currentPage.text}
            highlightedWord={highlightedWord}
            onWordClick={handleWordClick}
            className="text-2xl md:text-3xl font-baloo text-center leading-relaxed text-gray-800 dark:text-white"
          />

          {/* Interactive Hint */}
          {currentPage.interactive && (
            <div className="mt-4 text-center text-sm text-gray-400 dark:text-gray-500">
              👆 Tap the illustration to interact!
            </div>
          )}
        </PageTurn>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handlePageTurn('prev')}
          disabled={pageNumber === 0}
          className={`p-2 rounded-xl transition-colors ${
            pageNumber === 0
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label="Previous page"
        >
          <FaArrowLeft />
        </button>

        <div className="flex items-center gap-3">
          {/* Play/Pause for read-to-me mode */}
          {readingMode === 'read-to-me' && (
            <button
              onClick={togglePlayPause}
              className={`p-3 rounded-full transition-colors ${
                isPlaying
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
          )}

          {/* Page Indicator */}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {pageNumber + 1} / {totalPages}
          </span>
        </div>

        <button
          onClick={() => handlePageTurn('next')}
          disabled={pageNumber === totalPages - 1}
          className={`p-2 rounded-xl transition-colors ${
            pageNumber === totalPages - 1
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label="Next page"
        >
          <FaArrowRight />
        </button>
      </div>

      {/* Vocabulary Popup */}
      <AnimatePresence>
        {showVocabulary && selectedWord && (
          <VocabularyPopup
            word={selectedWord}
            onClose={() => {
              setShowVocabulary(false);
              setSelectedWord(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Completion Message */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                Story Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                You finished "{story.title}"!
              </p>
              <button
                onClick={() => {
                  resetStory();
                  if (onClose) onClose();
                }}
                className="mt-4 btn-primary"
              >
                Back to Library
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookReader;