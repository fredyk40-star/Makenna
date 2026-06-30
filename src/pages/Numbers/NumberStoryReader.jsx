import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaArrowRight, FaPlay, FaPause,
  FaVolumeUp, FaVolumeMute, FaBook, FaHeadphones,
  FaStar, FaRegStar, FaList, FaTimes, FaCheck
} from 'react-icons/fa';
import { getStoryById } from '../../data/numbersStoriesData';
import { useAudio } from '../../hooks/useAudio';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import readingAnalyticsService from '../../services/ReadingAnalyticsService';
import { announceToScreenReader } from '../../utils/accessibility';

const NumberStoryReader = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState('read-to-me');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState('');
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const { speak, stop, isPlaying: isAudioPlaying } = useAudio();
  const { markCompleted, markMastered } = useNumbersProgress();

  useEffect(() => {
    const found = getStoryById(storyId);
    if (found) {
      setStory(found);
      setStartTime(Date.now());
      
      // Load favorite status
      try {
        const favorites = JSON.parse(localStorage.getItem('number_story_favorites') || '[]');
        setIsFavorite(favorites.includes(storyId));
      } catch (error) {
        console.warn('Failed to load favorites:', error);
      }
    } else {
      navigate('/numbers/stories');
    }

    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      readingAnalyticsService.recordReadingTime(timeSpent / 60);
    };
  }, [storyId, navigate]);

  const toggleFavorite = useCallback(() => {
    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);
    try {
      const favorites = JSON.parse(localStorage.getItem('number_story_favorites') || '[]');
      if (newFavorite) {
        favorites.push(storyId);
        readingAnalyticsService.addFavoriteStory(storyId);
      } else {
        const index = favorites.indexOf(storyId);
        if (index > -1) favorites.splice(index, 1);
        readingAnalyticsService.removeFavoriteStory(storyId);
      }
      localStorage.setItem('number_story_favorites', JSON.stringify(favorites));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  }, [isFavorite, storyId]);

  const handlePageTurn = useCallback(async (direction) => {
    if (!story) return;
    
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    if (newPage < 0 || newPage >= story.pages.length) {
      if (direction === 'next' && newPage === story.pages.length) {
        // Story complete
        setIsComplete(true);
        setShowCelebration(true);
        markCompleted(`story-${story.number}`);
        markMastered(`story-${story.number}`);
        readingAnalyticsService.recordStoryCompletion(storyId);
        announceToScreenReader('Story complete! Great reading!');
      }
      return;
    }
    
    setCurrentPage(newPage);
    setHighlightedWord('');
    
    if (readingMode === 'read-to-me') {
      await readPage(newPage);
    }
  }, [story, currentPage, readingMode]);

  const readPage = useCallback(async (pageIndex) => {
    if (!story) return;
    
    const page = story.pages[pageIndex];
    if (!page) return;
    
    setIsPlaying(true);
    const text = page.text;
    const words = text.split(' ');
    
    for (const word of words) {
      setHighlightedWord(word);
      await speak(word, {
        rate: 0.7,
        pitch: 1.1
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setHighlightedWord('');
    setIsPlaying(false);
  }, [story, speak]);

  const handleWordClick = useCallback(async (word) => {
    if (readingMode === 'read-myself') {
      await speak(word, {
        rate: 0.7,
        pitch: 1.1
      });
      
      // Check if word is in vocabulary
      if (story?.vocabulary) {
        const vocabWord = story.vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
        if (vocabWord) {
          setSelectedWord(vocabWord);
          setShowVocabulary(true);
          readingAnalyticsService.recordVocabulary(word);
        }
      }
    }
  }, [readingMode, story, speak]);

  const toggleMode = useCallback(() => {
    const newMode = readingMode === 'read-to-me' ? 'read-myself' : 'read-to-me';
    setReadingMode(newMode);
    if (newMode === 'read-to-me') {
      readPage(currentPage);
    } else {
      stop();
      setIsPlaying(false);
    }
  }, [readingMode, currentPage, readPage, stop]);

  const renderPageContent = () => {
    if (!story) return null;
    const page = story.pages[currentPage];
    if (!page) return null;

    const words = page.text.split(' ');

    return (
      <div className="space-y-4">
        {/* Illustration */}
        <div className="text-center">
          <div className="text-8xl md:text-9xl animate-float">
            {page.illustration}
          </div>
        </div>

        {/* Text with Word Highlighting */}
        <div className="text-2xl md:text-3xl font-baloo text-center leading-relaxed text-gray-800 dark:text-white">
          {words.map((word, index) => (
            <motion.span
              key={index}
              whileHover={{ scale: readingMode === 'read-myself' ? 1.1 : 1, cursor: readingMode === 'read-myself' ? 'pointer' : 'default' }}
              onClick={() => handleWordClick(word)}
              className={`inline-block mx-1 px-1 rounded transition-all duration-300 ${
                highlightedWord === word
                  ? 'bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white scale-110'
                  : ''
              }`}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    );
  };

  if (!story) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📖</div>
          <p className="text-gray-600 dark:text-gray-300">Loading story...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/numbers/stories"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Stories"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {story.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage + 1} of {story.pages.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-full transition-colors ${
              isFavorite
                ? 'text-pink-500 bg-pink-100 dark:bg-pink-900/30'
                : 'text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
          <button
            onClick={toggleMode}
            className={`p-2 rounded-full transition-colors ${
              readingMode === 'read-to-me'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
            aria-label={readingMode === 'read-to-me' ? 'Switch to read myself' : 'Switch to read to me'}
          >
            {readingMode === 'read-to-me' ? <FaHeadphones /> : <FaBook />}
          </button>
          {story.vocabulary && story.vocabulary.length > 0 && (
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Show vocabulary"
            >
              <FaList />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentPage + 1) / story.pages.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
        />
      </div>

      {/* Page Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 min-h-[400px]">
        {renderPageContent()}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handlePageTurn('prev')}
          disabled={currentPage === 0}
          className={`p-3 rounded-xl transition-colors ${
            currentPage === 0
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label="Previous page"
        >
          <FaArrowLeft />
        </button>

        <div className="flex items-center gap-3">
          {readingMode === 'read-to-me' && (
            <button
              onClick={() => {
                if (isPlaying) {
                  stop();
                  setIsPlaying(false);
                } else {
                  readPage(currentPage);
                }
              }}
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
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentPage + 1} / {story.pages.length}
          </span>
        </div>

        <button
          onClick={() => handlePageTurn('next')}
          disabled={currentPage === story.pages.length - 1}
          className={`p-3 rounded-xl transition-colors ${
            currentPage === story.pages.length - 1
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label="Next page"
        >
          <FaArrowRight />
        </button>
      </div>

      {/* Reading Mode Indicator */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {readingMode === 'read-to-me' ? (
          <p>🎧 Listening mode - words are highlighted as read</p>
        ) : (
          <p>📖 Reading mode - tap any word to hear it</p>
        )}
      </div>

      {/* Vocabulary Popup */}
      <AnimatePresence>
        {showVocabulary && selectedWord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowVocabulary(false)}
          >
            <motion.div
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedWord.emoji}</span>
                  <div>
                    <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                      {selectedWord.word}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      New Word!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVocabulary(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Definition</p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  {selectedWord.definition}
                </p>
              </div>
              <button
                onClick={() => speak(selectedWord.word, { rate: 0.7, pitch: 1.1 })}
                className="mt-4 w-full py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <span>🔊 Hear it</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-md w-full mx-4 bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-soft"
            >
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                Story Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                You finished "{story.title}"!
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-3xl"
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
              <div className="flex gap-3 mt-6 justify-center">
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    navigate('/numbers/stories');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Back to Stories
                </button>
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    setCurrentPage(0);
                    setIsComplete(false);
                    setStartTime(Date.now());
                    if (readingMode === 'read-to-me') {
                      readPage(0);
                    }
                  }}
                  className="px-4 py-2 btn-primary"
                >
                  Read Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NumberStoryReader;