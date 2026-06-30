import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaArrowRight, FaHome, FaStar, FaRegStar,
  FaVolumeUp, FaCheck, FaLock, FaPlay, FaHeadphones
} from 'react-icons/fa';
import { ALPHABET_DATA, getLetterById } from '../../data/alphabetData';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { usePhonics } from '../../hooks/usePhonics';
import LetterDisplay from '../../components/alphabet/LetterDisplay';
import VocabularyCard from '../../components/alphabet/VocabularyCard';
import NavigationButtons from '../../components/alphabet/NavigationButtons';
import FavoriteButton from '../../components/alphabet/FavoriteButton';
import VoiceButton from '../../components/alphabet/VoiceButton';
import ProgressIndicator from '../../components/alphabet/ProgressIndicator';
import PhonicsPlayer from '../../components/phonics/PhonicsPlayer';
import ListeningActivity from '../../components/phonics/ListeningActivity';
import { fadeInUp, staggerContainer } from '../../utils/constants';
import { FaPenFancy } from 'react-icons/fa';

const LessonPage = () => {
  const { letterId } = useParams();
  const navigate = useNavigate();
  const {
    markOpened,
    markCompleted,
    addTimeSpent,
    isLetterCompleted,
    isLetterFavorited,
    toggleFavoriteLetter,
    getProgress
  } = useAlphabetProgress();

  const [letter, setLetter] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [showListeningActivity, setShowListeningActivity] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const foundLetter = getLetterById(letterId);
    if (foundLetter) {
      setLetter(foundLetter);
      markOpened(letterId);
      setStartTime(Date.now());
      
      // Start timer
      timerRef.current = setInterval(() => {
        setStartTime(prev => prev);
      }, 1000);
    } else {
      navigate('/alphabet');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Save time spent
      if (letter) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        addTimeSpent(letterId, timeSpent);
      }
    };
  }, [letterId, navigate, markOpened, addTimeSpent]);

  if (!letter) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600 dark:text-gray-300">Loading lesson...</p>
        </div>
      </div>
    );
  }

  const isCompleted = isLetterCompleted(letterId);
  const isFavorited = isLetterFavorited(letterId);
  const currentWord = letter.words[currentWordIndex];
  const totalWords = letter.words.length;
  const isLastWord = currentWordIndex === totalWords - 1;

  const handleNextWord = () => {
    if (isLastWord) {
      markCompleted(letterId);
      navigate('/alphabet');
    } else {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  const handlePrevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    markCompleted(letterId);
    navigate('/alphabet');
  };

  const handleFavoriteToggle = () => {
    toggleFavoriteLetter(letterId);
  };

  const handleNavigateLetter = (direction) => {
    const currentIndex = ALPHABET_DATA.findIndex(l => l.id === letterId);
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, ALPHABET_DATA.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    if (newIndex !== currentIndex) {
      navigate(`/alphabet/lesson/${ALPHABET_DATA[newIndex].id}`);
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-6 pb-4"
    >
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/alphabet"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Alphabet"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            Letter {letter.letter}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/alphabet/trace/${letterId}`}
            className="p-2 rounded-full transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Trace letter"
          >
            <FaPenFancy className="text-xl" />
          </Link>
          <button
            onClick={() => setShowListeningActivity(!showListeningActivity)}
            className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              showListeningActivity
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={showListeningActivity ? 'Hide listening activity' : 'Show listening activity'}
          >
            <FaHeadphones className="text-xl" />
          </button>
          <FavoriteButton
            isFavorited={isFavorited}
            onToggle={handleFavoriteToggle}
            label={`${isFavorited ? 'Remove' : 'Add'} ${letter.letter} to favorites`}
          />
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-500 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <FaCheck className="text-sm" />
              <span className="text-sm font-semibold">Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Letter Display */}
      <LetterDisplay
        letter={letter.letter}
        lowercase={letter.lowercase}
        sound={letter.sound}
        description={letter.description}
        isFavorited={isFavorited}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* Phonics Player - NEW */}
      <PhonicsPlayer
        letterId={letterId}
        mode="letter"
        showWaveform={true}
      />

      {/* Listening Activity - NEW */}
      <AnimatePresence>
        {showListeningActivity && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ListeningActivity
              letterId={letterId}
              onComplete={() => {
                setShowListeningActivity(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <ProgressIndicator
        current={currentWordIndex + 1}
        total={totalWords}
        label={`Word ${currentWordIndex + 1} of ${totalWords}`}
      />

      {/* Vocabulary Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWordIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <VocabularyCard
            word={currentWord}
            letter={letter.letter}
            letterId={letter.id}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <NavigationButtons
        onPrevious={handlePrevWord}
        onNext={handleNextWord}
        onComplete={handleComplete}
        isFirst={currentWordIndex === 0}
        isLast={isLastWord}
        previousLabel="Previous Word"
        nextLabel={isLastWord ? "Complete Lesson" : "Next Word"}
        completeLabel="Back to Alphabet"
      />

      {/* Letter Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleNavigateLetter('prev')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={ALPHABET_DATA.findIndex(l => l.id === letterId) === 0}
          aria-label="Previous letter"
        >
          <FaArrowLeft className="text-sm" />
          <span>Previous</span>
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {ALPHABET_DATA.findIndex(l => l.id === letterId) + 1} of {ALPHABET_DATA.length}
        </div>
        <button
          onClick={() => handleNavigateLetter('next')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={ALPHABET_DATA.findIndex(l => l.id === letterId) === ALPHABET_DATA.length - 1}
          aria-label="Next letter"
        >
          <span>Next</span>
          <FaArrowRight className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

export default LessonPage;
