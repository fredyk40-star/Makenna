import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaArrowRight, FaCheck, FaHeadphones, FaPenFancy
} from 'react-icons/fa';
import { ALPHABET_DATA, getLetterById } from '../../data/alphabetData';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { toSkillName } from '../../services/AlphabetProgressService';

import LetterDisplay from '../../components/alphabet/LetterDisplay';
import VocabularyCard from '../../components/alphabet/VocabularyCard';
import SoundPracticeCard from '../../components/alphabet/SoundPracticeCard';
import NavigationButtons from '../../components/alphabet/NavigationButtons';
import FavoriteButton from '../../components/alphabet/FavoriteButton';
import ProgressIndicator from '../../components/alphabet/ProgressIndicator';
import PhonicsPlayer from '../../components/phonics/PhonicsPlayer';
import ListeningActivity from '../../components/phonics/ListeningActivity';
import { staggerContainer } from '../../utils/constants';

const LessonPage = () => {
  const { letterId } = useParams();
  const navigate = useNavigate();
  const {
    markOpened,
    markCompleted,
    markSkill,
    addTimeSpent,
    isLetterCompleted,
    isLetterFavorited,
    isSkillComplete,
    getLetterSkillPercent,
    toggleFavoriteLetter,
  } = useAlphabetProgress();

  const [letter, setLetter] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showListeningActivity, setShowListeningActivity] = useState(false);
  const markOpenedRef = useRef(markOpened);
  const addTimeSpentRef = useRef(addTimeSpent);

  useEffect(() => {
    markOpenedRef.current = markOpened;
    addTimeSpentRef.current = addTimeSpent;
  }, [markOpened, addTimeSpent]);

  useEffect(() => {
    const foundLetter = getLetterById(letterId);
    if (foundLetter) {
      setLetter(foundLetter);
      setCurrentWordIndex(0);
      setShowListeningActivity(false);
      markOpenedRef.current(letterId);
    } else {
      navigate('/alphabet', { replace: true });
    }
  }, [letterId, navigate]);

  // Save actual time on the page without writing progress on every tick.
  useEffect(() => {
    const startedAt = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      if (seconds > 0) addTimeSpentRef.current(letterId, seconds);
    };
  }, [letterId]);

  const handlePracticed = useCallback((mode, detail) => {
    const skill = toSkillName(mode);
    if (skill) markSkill(letterId, skill, detail);
  }, [letterId, markSkill]);

  const handleListeningComplete = useCallback((summary) => {
    markSkill(letterId, 'listening', {
      accuracy: summary?.accuracy ?? 100,
    });
    setShowListeningActivity(false);
  }, [letterId, markSkill]);

  const handleListeningIncorrect = useCallback(() => {
    markSkill(letterId, 'listening', {
      completed: false,
      accuracy: 0,
    });
  }, [letterId, markSkill]);

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
  const skillPercent = getLetterSkillPercent(letterId);
  const currentIndex = ALPHABET_DATA.findIndex(item => item.id === letterId);
  const completedSkills = {
    letter: isSkillComplete(letterId, 'letter'),
    sound: isSkillComplete(letterId, 'sound'),
    word: isSkillComplete(letterId, 'word'),
    sentence: isSkillComplete(letterId, 'sentence'),
    'word-with-sound': isSkillComplete(letterId, 'wordWithSound'),
  };

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

  const handleNavigateLetter = (direction) => {
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
      className="space-y-5 sm:space-y-6 pb-8"
    >
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/alphabet"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Alphabet"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div className="min-w-0">
            <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
              Letter {letter.letter}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {skillPercent}% of skills practiced
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/alphabet/trace/${letterId}`}
            className="p-2 rounded-full transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Trace letter"
          >
            <FaPenFancy className="text-xl" />
          </Link>
          <button
            onClick={() => setShowListeningActivity(prev => !prev)}
            className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              showListeningActivity
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={showListeningActivity ? 'Hide listening activity' : 'Show listening activity'}
            aria-pressed={showListeningActivity}
            type="button"
          >
            <FaHeadphones className="text-xl" />
          </button>
          <FavoriteButton
            isFavorited={isFavorited}
            onToggle={() => toggleFavoriteLetter(letterId)}
            label={`${isFavorited ? 'Remove' : 'Add'} ${letter.letter} to favorites`}
          />
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
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
        sound={letter.phonetic || letter.sound}
        phonetic={letter.phonetic ? letter.sound : null}
        description={letter.description}
        isFavorited={isFavorited}
        onFavoriteToggle={() => toggleFavoriteLetter(letterId)}
        onPracticed={handlePracticed}
      />

      {/* Phonics practice: letter, sound, word, sentence, word + sound */}
      <PhonicsPlayer
        letterId={letterId}
        wordIndex={currentWordIndex}
        completedSkills={completedSkills}
        onPracticed={handlePracticed}
      />

      <SoundPracticeCard letter={letter} onPracticed={handlePracticed} />

      {/* Listening Activity */}
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
              onComplete={handleListeningComplete}
              onIncorrect={handleListeningIncorrect}
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
            onPracticed={handlePracticed}
          />
        </motion.div>
      </AnimatePresence>

      <NavigationButtons
        onPrevious={handlePrevWord}
        onNext={handleNextWord}
        onComplete={handleComplete}
        isFirst={currentWordIndex === 0}
        isLast={isLastWord}
        previousLabel="Previous Word"
        nextLabel={isLastWord ? 'Complete Lesson' : 'Next Word'}
        completeLabel="Back to Alphabet"
      />

      {/* Letter Navigation */}
      <div className="flex justify-between items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleNavigateLetter('prev')}
          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentIndex === 0}
          aria-label="Previous letter"
          type="button"
        >
          <FaArrowLeft className="text-sm" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1} of {ALPHABET_DATA.length}
        </div>
        <button
          onClick={() => handleNavigateLetter('next')}
          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentIndex === ALPHABET_DATA.length - 1}
          aria-label="Next letter"
          type="button"
        >
          <span className="hidden sm:inline">Next</span>
          <FaArrowRight className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

export default LessonPage;
