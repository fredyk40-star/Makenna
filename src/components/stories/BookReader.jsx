import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaArrowRight, FaPlay, FaPause, 
  FaVolumeUp, FaVolumeMute, FaBook, FaHeadphones,
  FaList, FaTimes, FaForward, FaTachometerAlt,
  FaCheck, FaChevronLeft, FaChevronRight, FaStar,
  FaGripVertical
} from 'react-icons/fa';
import { useStory } from '../../hooks/useStory';
import { useComprehension } from '../../hooks/useComprehension';
import readingAnalyticsService from '../../services/ReadingAnalyticsService';
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
    comprehension,
    autoPlay,
    setAutoPlay,
    speed,
    setSpeed,
    nextPage,
    previousPage,
    togglePlayPause,
    readPage,
    readWord,
    stopReading,
    changeMode,
    recordComprehension,
    resetStory
  } = useStory(storyId);

  // Post-story flow state machine
  // 0 = hidden, 1 = celebration, 2 = comprehension quiz, 3 = sequencing, 4 = vocabulary review, 5 = done
  const [postStoryStep, setPostStoryStep] = useState(0);
  const [showVocabularyPopup, setShowVocabularyPopup] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Sequencing state
  const [sequenceItems, setSequenceItems] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [sequenceCorrect, setSequenceCorrect] = useState(false);

  // Comprehension hook
  const comprehensionQuiz = useComprehension(comprehension || []);

  // Track story completion to trigger post-story flow
  useEffect(() => {
    if (isComplete && postStoryStep === 0) {
      setPostStoryStep(1);
      // Shuffle sequencing items for the game
      if (story?.sequencing) {
        const shuffled = [...story.sequencing].sort(() => Math.random() - 0.5);
        setSequenceItems(shuffled);
      }
      comprehensionQuiz.resetQuiz();
    }
  }, [isComplete]);

  // Auto-read page when in read-to-me mode
  useEffect(() => {
    if (readingMode === 'read-to-me' && currentPage && !isPlaying && postStoryStep === 0) {
      readPage();
    }
  }, [currentPage, readingMode, postStoryStep]);

  const handleWordClick = (word) => {
    if (readingMode === 'read-by-myself') {
      readWord(word);
      const vocabWord = vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
      if (vocabWord) {
        setSelectedWord(vocabWord);
        setShowVocabularyPopup(true);
      }
    }
  };

  const handlePageTurn = (direction) => {
    stopReading();
    if (direction === 'next') {
      if (pageNumber === totalPages - 1) {
        // Will trigger isComplete in useStory
        nextPage();
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

  const handleTogglePlayPause = () => {
    togglePlayPause();
  };

  // Comprehension handlers
  const handleQuizAnswer = (answerIndex) => {
    comprehensionQuiz.submitAnswer(answerIndex);
  };

  // Sequencing handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index) => {
    if (draggedIndex === null) return;
    const newItems = [...sequenceItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removed);
    setSequenceItems(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const checkSequenceCorrect = () => {
    if (!story?.sequencing) return;
    const isCorrect = sequenceItems.every((item, i) => item === story.sequencing[i]);
    setSequenceCorrect(isCorrect);
    if (isCorrect) {
      readingAnalyticsService.recordQuestionAnswer(true);
    }
  };

  const handlePostStoryNext = () => {
    if (postStoryStep === 1) {
      // Move from celebration to quiz
      setPostStoryStep(2);
    } else if (postStoryStep === 2 && comprehensionQuiz.isComplete) {
      // Move from quiz to sequencing
      setPostStoryStep(3);
    } else if (postStoryStep === 3) {
      // Move from sequencing to vocabulary review
      setPostStoryStep(4);
    } else if (postStoryStep === 4) {
      // Move to done
      setPostStoryStep(5);
      // Record final comprehension score
      if (comprehensionQuiz.getScore) {
        recordComprehension(comprehensionQuiz.getScore().percentage);
      }
    }
  };

  const handleBackToLibrary = () => {
    resetStory();
    setPostStoryStep(0);
    if (onClose) onClose();
  };

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 0.85, label: 'Normal' },
    { value: 1.1, label: '1.1x' },
    { value: 1.25, label: '1.25x' }
  ];

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

  // Post-story overlay views
  const renderPostStoryOverlay = () => {
    return (
      <AnimatePresence>
        {postStoryStep >= 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm flex items-center justify-center z-20 overflow-y-auto"
          >
            <div className="text-center p-8 max-w-lg w-full">
              {/* Step 1: Celebration */}
              {postStoryStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="text-8xl animate-bounce">🎉</div>
                  <h3 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white">
                    Story Complete!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    You finished "{story.title}"!
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Great job! Now let's see what you remember.
                  </p>
                  <button
                    onClick={handlePostStoryNext}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg"
                  >
                    Take the Quiz! 🧠
                  </button>
                </motion.div>
              )}

              {/* Step 2: Comprehension Quiz */}
              {postStoryStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="text-4xl mb-2">🧠</div>
                  <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                    Quiz Time!
                  </h3>
                  
                  {!comprehensionQuiz.isComplete && comprehensionQuiz.currentQuestion ? (
                    <>
                      {/* Progress bar */}
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${comprehensionQuiz.progress}%` }}
                          className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full"
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Question {comprehensionQuiz.currentQuestionIndex + 1} of {comprehensionQuiz.totalQuestions}
                      </p>
                      
                      <p className="text-lg font-semibold text-gray-800 dark:text-white mt-4">
                        {comprehensionQuiz.currentQuestion.question}
                      </p>
                      
                      <div className="grid gap-3 mt-4">
                        {comprehensionQuiz.currentQuestion.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuizAnswer(idx)}
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-blue-400 hover:bg-primary/5 transition-all duration-300 text-left text-gray-700 dark:text-gray-200 font-medium"
                          >
                            {['A', 'B', 'C', 'D'][idx]}. {option}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : comprehensionQuiz.isComplete ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="text-6xl">
                        {(() => {
                          const score = comprehensionQuiz.getScore();
                          const pct = score.percentage;
                          if (pct >= 80) return '🌟';
                          if (pct >= 60) return '👍';
                          return '📖';
                        })()}
                      </div>
                      <h4 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
                        Quiz Results
                      </h4>
                      <p className="text-3xl font-bold text-primary">
                        {comprehensionQuiz.getScore().correct} / {comprehensionQuiz.getScore().total}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {comprehensionQuiz.getScore().percentage}% correct
                      </p>
                      <button
                        onClick={handlePostStoryNext}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg"
                      >
                        Next: Sequencing Game 🔢
                      </button>
                    </motion.div>
                  ) : (
                    <p className="text-gray-500">No questions for this story.</p>
                  )}
                </motion.div>
              )}

              {/* Step 3: Sequencing Game */}
              {postStoryStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="text-4xl mb-2">🔢</div>
                  <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                    Put the Story in Order
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag and arrange the events in the correct order
                  </p>
                  
                  {!sequenceCorrect ? (
                    <>
                      <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                        {sequenceItems.map((item, idx) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={() => handleDrop(idx)}
                            onDragEnd={() => {
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                              dragOverIndex === idx
                                ? 'border-primary bg-primary/10 scale-105'
                                : draggedIndex === idx
                                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 opacity-50'
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                            }`}
                          >
                            <FaGripVertical className="text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-200 text-left font-medium">
                              {item}
                            </span>
                            <span className="ml-auto text-gray-400 font-bold text-sm">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={checkSequenceCorrect}
                        className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg mt-4"
                      >
                        Check Order ✓
                      </button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="text-6xl">✅</div>
                      <h4 className="font-baloo text-xl font-bold text-green-600">
                        Correct Order!
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        You remembered the story perfectly!
                      </p>
                      <div className="space-y-1 text-left bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        {story.sequencing?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <FaCheck className="text-green-500 flex-shrink-0" />
                            <span className="text-sm">{idx + 1}. {item}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handlePostStoryNext}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg"
                      >
                        Next: Vocabulary Review 📝
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Vocabulary Review */}
              {postStoryStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="text-4xl mb-2">📝</div>
                  <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                    Words You Learned
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Great new words from this story!
                  </p>
                  
                  {vocabulary.length > 0 ? (
                    <div className="grid gap-3 mt-4 max-h-[350px] overflow-y-auto">
                      {vocabulary.map((vocab, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 text-left"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{vocab.emoji}</span>
                            <div>
                              <h4 className="font-baloo text-lg font-bold text-gray-800 dark:text-white">
                                {vocab.word}
                              </h4>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {vocab.definition}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No vocabulary words for this story.</p>
                  )}
                  
                  <button
                    onClick={handlePostStoryNext}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg mt-2"
                  >
                    Finish 🎉
                  </button>
                </motion.div>
              )}

              {/* Step 5: All Done */}
              {postStoryStep === 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="text-8xl animate-bounce">🏆</div>
                  <h3 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white">
                    Amazing Work!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    You completed the story, aced the quiz, and learned new words!
                  </p>
                  <button
                    onClick={handleBackToLibrary}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg"
                  >
                    Back to Library 📚
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden"
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
        <div className="flex items-center gap-1">
          {/* Speed Control */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Reading speed"
              title={`Speed: ${speedOptions.find(s => s.value === speed)?.label || 'Normal'}`}
            >
              <FaTachometerAlt className="text-sm" />
            </button>
            {showSpeedMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 p-1 z-30 min-w-[100px]"
              >
                {speedOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSpeed(option.value);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      speed === option.value
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Auto-Play Toggle */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`p-2 rounded-xl transition-all duration-300 ${
              autoPlay
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={autoPlay ? 'Disable auto-play' : 'Enable auto-play'}
            title={autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
          >
            <FaForward className="text-sm" />
          </button>

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

          {/* Vocabulary Popup Button */}
          {vocabulary.length > 0 && (
            <button
              onClick={() => setShowVocabularyPopup(!showVocabularyPopup)}
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
              onClick={handleTogglePlayPause}
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

      {/* Vocabulary Popup (during reading) */}
      <AnimatePresence>
        {showVocabularyPopup && selectedWord && (
          <VocabularyPopup
            word={selectedWord}
            onClose={() => {
              setShowVocabularyPopup(false);
              setSelectedWord(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Post-Story Overlay (completion, quiz, sequencing, vocabulary review) */}
      {renderPostStoryOverlay()}
    </motion.div>
  );
};

export default BookReader;