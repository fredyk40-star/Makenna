import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaArrowRight, FaPlay, FaPause,
  FaHeadphones, FaBook, FaForward, FaTachometerAlt,
  FaBible
} from 'react-icons/fa';
import { Link, useParams, Navigate } from 'react-router-dom';
import { BIBLE_STORIES_DATA } from '../../data/bibleStoriesData';

const BibleStoryReader = () => {
  const { storyId } = useParams();
  const story = BIBLE_STORIES_DATA.find(s => s.id === storyId);

  // Convert content paragraphs into pages
  const pages = story
    ? story.content
        .filter(item => item.type === 'paragraph')
        .map((item, idx) => ({
          pageNumber: idx,
          text: item.text,
        }))
    : [];

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [readingMode, setReadingMode] = useState('read-to-me'); // 'read-to-me' | 'read-by-myself'
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [highlightRange, setHighlightRange] = useState({ start: 0, end: 0 });
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(0.85);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const utteranceRef = useRef(null);
  const totalPages = pages.length;

  // Reset when story changes
  useEffect(() => {
    setCurrentPageIndex(0);
    setIsPlaying(false);
    setIsComplete(false);
    setHighlightRange({ start: 0, end: 0 });
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [storyId]);

  const currentPage = pages[currentPageIndex];
  const progress = totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0;

  /**
   * Read the current page smoothly using Speech Synthesis
   */
  const readPageSmooth = useCallback(() => {
    if (!currentPage) return;

    window.speechSynthesis.cancel();

    setIsPlaying(true);
    const text = currentPage.text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Get best available voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
      voices.find(v => v.lang.startsWith('en-US')) ||
      voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightRange({
          start: event.charIndex,
          end: event.charIndex + (event.charLength || 1),
        });
      }
    };

    utterance.onend = () => {
      setHighlightRange({ start: 0, end: 0 });
      setIsPlaying(false);
      utteranceRef.current = null;

      // Auto-play: advance to next page
      if (autoPlay) {
        if (currentPageIndex < totalPages - 1) {
          setCurrentPageIndex(prev => prev + 1);
        } else {
          setIsComplete(true);
        }
      }
    };

    utterance.onerror = (event) => {
      console.warn('Speech error:', event);
      setHighlightRange({ start: 0, end: 0 });
      setIsPlaying(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [currentPage, speed, autoPlay, currentPageIndex, totalPages]);

  // Auto-read new page when in read-to-me mode
  useEffect(() => {
    if (readingMode === 'read-to-me' && currentPage && !isPlaying && !isComplete) {
      readPageSmooth();
    }
  }, [currentPageIndex, readingMode, isComplete]);

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleModeToggle = () => {
    const newMode = readingMode === 'read-to-me' ? 'read-by-myself' : 'read-to-me';
    setReadingMode(newMode);
    if (newMode === 'read-by-myself') {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setHighlightRange({ start: 0, end: 0 });
    }
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        readPageSmooth();
      }
    }
  };

  const handleReadWord = (word) => {
    if (readingMode !== 'read-by-myself') return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = speed;
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setCurrentPageIndex(0);
    setIsPlaying(false);
    setIsComplete(false);
    setHighlightRange({ start: 0, end: 0 });
    setAutoPlay(false);
  };

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 0.85, label: 'Normal' },
    { value: 1.1, label: '1.1x' },
    { value: 1.25, label: '1.25x' },
  ];

  if (!story) {
    return <Navigate to="/bible-time" replace />;
  }

  // Render text with character-level highlighting
  const renderHighlightedText = (text) => {
    if (readingMode !== 'read-to-me' || !isPlaying) {
      // In read-by-myself mode, make each word tappable
      if (readingMode === 'read-by-myself') {
        return (
          <p className="text-xl md:text-2xl font-baloo text-center leading-relaxed text-gray-800 dark:text-white">
            {text.split(/\s+/).map((word, idx) => (
              <span
                key={idx}
                onClick={() => handleReadWord(word)}
                className="cursor-pointer hover:text-primary hover:underline transition-colors inline-block mx-[2px]"
              >
                {word}
              </span>
            ))}
          </p>
        );
      }
      return (
        <p className="text-xl md:text-2xl font-baloo text-center leading-relaxed text-gray-800 dark:text-white">
          {text}
        </p>
      );
    }

    // Highlight current word during read-to-me
    const before = text.substring(0, highlightRange.start);
    const highlighted = text.substring(highlightRange.start, highlightRange.end);
    const after = text.substring(highlightRange.end);

    return (
      <p className="text-xl md:text-2xl font-baloo text-center leading-relaxed text-gray-800 dark:text-white">
        {before}
        <span className="bg-yellow-300 dark:bg-yellow-500/50 rounded px-1 transition-colors duration-100">
          {highlighted}
        </span>
        {after}
      </p>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/bible-time"
          className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Back to Bible Time"
        >
          <FaArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <span>{story.icon}</span> {story.title}
          </h1>
        </div>
      </div>

      {/* Story Card */}
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden relative`}>
        {/* Top accent bar with story's color */}
        <div className={`h-2 bg-gradient-to-r ${story.color || 'from-blue-400 to-purple-400'}`} />

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FaBible className="text-primary text-lg" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPageIndex + 1} of {totalPages}
            </span>
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
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full rounded-r-full bg-gradient-to-r ${story.color || 'from-blue-400 to-purple-400'}`}
          />
        </div>

        {/* Page Content */}
        <motion.div
          key={currentPageIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-10 min-h-[300px] flex items-center justify-center"
        >
          <div className="max-w-2xl w-full">
            {currentPage && renderHighlightedText(currentPage.text)}

            {/* Reading mode hint */}
            {readingMode === 'read-by-myself' && (
              <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                👆 Tap any word to hear it spoken
              </p>
            )}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={currentPageIndex === 0 || isComplete}
            className={`p-2 rounded-xl transition-colors ${
              currentPageIndex === 0 || isComplete
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label="Previous page"
          >
            <FaArrowLeft />
          </button>

          <div className="flex items-center gap-3">
            {/* Play/Pause for read-to-me mode */}
            {readingMode === 'read-to-me' && !isComplete && (
              <button
                onClick={handleTogglePlayPause}
                className={`p-3 rounded-full transition-colors shadow-md ${
                  isPlaying
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
            )}

            {/* Page indicator dots */}
            <div className="hidden sm:flex items-center gap-1">
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                    setCurrentPageIndex(idx);
                    setIsComplete(false);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentPageIndex
                      ? 'bg-primary w-4'
                      : idx < currentPageIndex
                      ? 'bg-primary/40'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>

            <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
              {currentPageIndex + 1} / {totalPages}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentPageIndex === totalPages - 1 || isComplete}
            className={`p-2 rounded-xl transition-colors ${
              currentPageIndex === totalPages - 1 || isComplete
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label="Next page"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* Completion Overlay */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
            >
              <div className="text-8xl mb-4 animate-bounce">{story.icon || '🙏'}</div>
              <h2 className="font-baloo text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Story Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                You finished reading
              </p>
              <p className="font-baloo text-xl font-bold text-primary mb-6">
                "{story.title}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                "Your word is a lamp to my feet and a light to my path."
                <br />
                <span className="italic">— Psalm 119:105</span>
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/bible-time"
                  onClick={handleReset}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg"
                >
                  Back to Bible Time 📖
                </Link>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors text-sm"
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

export default BibleStoryReader;