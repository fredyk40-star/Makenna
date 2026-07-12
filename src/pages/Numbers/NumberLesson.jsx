import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaArrowRight, FaStar, FaRegStar, 
  FaCheck, FaVolumeUp, FaPlay, FaHeart, FaRegHeart,
  FaFlag, FaRocket, FaPencilAlt
} from 'react-icons/fa';
import { NUMBERS_DATA, getNumberById } from '../../data/numbersData';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { useAudio } from '../../hooks/useAudio';
import { announceToScreenReader } from '../../utils/accessibility';

const NumberLesson = () => {
  const { numberId } = useParams();
  const navigate = useNavigate();
  const {
    markOpened,
    markCompleted,
    markMastered,
    addTimeSpent,
    isNumberCompleted,
    isNumberMastered,
    isNumberFavorited,
    toggleFavorite
  } = useNumbersProgress();

  const [number, setNumber] = useState(null);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [isCounting, setIsCounting] = useState(false);
  const [countIndex, setCountIndex] = useState(0);
  
  const { speak, isPlaying } = useAudio();
  const countIntervalRef = useRef(null);

  useEffect(() => {
    const found = getNumberById(numberId);
    if (found) {
      setNumber(found);
      markOpened(numberId);
      setStartTime(Date.now());
      
      // Speak the number name on load
      setTimeout(() => {
        speak(found.word, { rate: 0.8, pitch: 1.1 });
      }, 500);
    } else {
      navigate('/numbers');
    }

    return () => {
      if (number) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        addTimeSpent(numberId, timeSpent);
      }
      if (countIntervalRef.current) {
        clearInterval(countIntervalRef.current);
      }
    };
  }, [numberId, navigate]);

  if (!number) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const isCompleted = isNumberCompleted(numberId);
  const isMastered = isNumberMastered(numberId);
  const isFavorited = isNumberFavorited(numberId);
  const totalExamples = number.examples.length;
  const isLastExample = currentExampleIndex === totalExamples - 1;

  const handleSpeak = (text, options = {}) => {
    speak(text, { rate: 0.8, pitch: 1.1, ...options });
  };

  const handleCount = () => {
    if (isCounting) {
      clearInterval(countIntervalRef.current);
      setIsCounting(false);
      setCountIndex(0);
      return;
    }

    setIsCounting(true);
    setCountIndex(0);
    const objects = number.objects || [];
    
    countIntervalRef.current = setInterval(() => {
      setCountIndex(prev => {
        const next = prev + 1;
        if (next <= objects.length) {
          handleSpeak(String(next), { rate: 0.6, pitch: 1.2 });
          return next;
        } else {
          clearInterval(countIntervalRef.current);
          setIsCounting(false);
          handleSpeak(`${number.word}!`, { rate: 0.8, pitch: 1.2 });
          announceToScreenReader(`Counted to ${number.number}`);
          return prev;
        }
      });
    }, 800);
  };

  const handleNext = () => {
    if (isLastExample) {
      markCompleted(numberId);
      setShowCelebration(true);
      announceToScreenReader(`Completed number ${number.number}!`);
      
      // Check if all numbers are mastered
      setTimeout(() => {
        markMastered(numberId);
      }, 1000);
    } else {
      setCurrentExampleIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentExampleIndex > 0) {
      setCurrentExampleIndex(prev => prev - 1);
    }
  };

  const handleFavoriteToggle = () => {
    toggleFavorite(numberId);
    announceToScreenReader(isFavorited ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    navigate('/numbers');
  };

  const getObjectsToShow = () => {
    const objects = number.objects || [];
    return objects.slice(0, countIndex);
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
            to="/numbers"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Numbers"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <Link
            to={`/numbers/trace/${numberId}`}
            className="bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <FaPencilAlt className="text-sm" />
            Trace
          </Link>
          <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            Number {number.number}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-full transition-colors ${
              isFavorited
                ? 'text-pink-500 bg-pink-100 dark:bg-pink-900/30'
                : 'text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={isFavorited ? 'Remove favorite' : 'Add favorite'}
          >
            {isFavorited ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
          </button>
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-500 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <FaCheck className="text-sm" />
              <span className="text-sm font-semibold">Done</span>
            </div>
          )}
          {isMastered && (
            <div className="flex items-center gap-1 text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
              <FaStar className="text-sm" />
              <span className="text-sm font-semibold">Mastered</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Number Display */}
      <div className={`bg-gradient-to-br ${number.color} rounded-2xl p-8 text-center text-white`}>
        <div className="flex items-center justify-center gap-6">
          <div className="text-8xl md:text-9xl font-baloo font-bold drop-shadow-lg">
            {number.number}
          </div>
          <div className="text-5xl md:text-6xl drop-shadow-lg">
            {number.emoji}
          </div>
        </div>
        <h3 className="font-baloo text-3xl md:text-4xl font-bold mt-2 drop-shadow-lg">
          {number.word}
        </h3>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => handleSpeak(number.word)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
            aria-label={`Hear ${number.word}`}
          >
            <FaVolumeUp className="text-lg" />
            <span>Listen</span>
          </button>
          <button
            onClick={() => handleSpeak(number.phonics, { rate: 0.5, pitch: 1.1 })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
            aria-label={`Hear slow pronunciation of ${number.word}`}
          >
            <FaPlay className="text-lg" />
            <span>Slow</span>
          </button>
        </div>
        <p className="text-white/90 text-lg mt-4 max-w-2xl mx-auto drop-shadow">
          {number.sentence}
        </p>
      </div>

      {/* Counting Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Count with me! 🔢
          </h3>
          <button
            onClick={handleCount}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
              isCounting
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
            aria-label={isCounting ? 'Stop counting' : 'Start counting'}
          >
            {isCounting ? 'Stop' : 'Count'}
          </button>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 min-h-[80px] p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
          {getObjectsToShow().map((obj, index) => (
            <motion.span
              key={index}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-4xl"
            >
              {obj}
            </motion.span>
          ))}
          {countIndex === 0 && !isCounting && (
            <span className="text-gray-400 dark:text-gray-500 text-lg">
              👆 Tap "Count" to see objects appear!
            </span>
          )}
          {isCounting && countIndex === 0 && (
            <span className="text-gray-400 dark:text-gray-500 text-lg animate-pulse">
              🎵 Counting...
            </span>
          )}
          {countIndex > 0 && countIndex === (number.objects || []).length && !isCounting && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full text-center text-green-500 font-bold text-lg"
            >
              🎉 {countIndex} {countIndex === 1 ? 'object' : 'objects'}!
            </motion.div>
          )}
        </div>
      </div>

      {/* Examples Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Examples 📝
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentExampleIndex + 1} of {totalExamples}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentExampleIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center py-4"
          >
            <div className="text-4xl mb-3">
              {number.examples[currentExampleIndex]}
            </div>
            <button
              onClick={() => handleSpeak(number.examples[currentExampleIndex])}
              className="text-primary hover:text-primary-dark transition-colors"
              aria-label="Hear example"
            >
              <FaVolumeUp className="text-xl" />
            </button>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrev}
            disabled={currentExampleIndex === 0}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous example"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
            aria-label={isLastExample ? 'Complete lesson' : 'Next example'}
          >
            {isLastExample ? 'Complete Lesson 🎉' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            const currentIndex = NUMBERS_DATA.findIndex(n => n.id === numberId);
            if (currentIndex > 0) {
              navigate(`/numbers/lesson/${NUMBERS_DATA[currentIndex - 1].id}`);
            }
          }}
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
          aria-label="Previous number"
        >
          ← Previous Number
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {NUMBERS_DATA.findIndex(n => n.id === numberId) + 1} of {NUMBERS_DATA.length}
        </div>
        <button
          onClick={() => {
            const currentIndex = NUMBERS_DATA.findIndex(n => n.id === numberId);
            if (currentIndex < NUMBERS_DATA.length - 1) {
              navigate(`/numbers/lesson/${NUMBERS_DATA[currentIndex + 1].id}`);
            }
          }}
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors"
          aria-label="Next number"
        >
          Next Number →
        </button>
      </div>

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
                You completed Number {number.number}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Great job learning the number {number.word}! 🌟
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
              <button
                onClick={handleCelebrationComplete}
                className="mt-6 btn-primary flex items-center gap-2 mx-auto"
              >
                <FaFlag />
                Continue Learning
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NumberLesson;