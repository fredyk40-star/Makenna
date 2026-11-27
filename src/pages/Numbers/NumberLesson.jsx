import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaStar, FaCheck, FaVolumeUp, FaPlay, FaHeart, FaRegHeart,
  FaFlag, FaPencilAlt, FaClipboardCheck,
} from 'react-icons/fa';
import { NUMBERS_DATA, getNumberById } from '../../data/numbersData';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { useAudio } from '../../hooks/useAudio';
import { buildNumberPractice, gradeNumberPractice } from '../../services/NumbersPracticeService';
import { toSkillName } from '../../services/NumbersProgressService';
import { announceToScreenReader } from '../../utils/accessibility';

const NumberLesson = () => {
  const { numberId } = useParams();
  const navigate = useNavigate();
  const {
    progress,
    markOpened,
    markCompleted,
    markSkill,
    addTimeSpent,
    isNumberCompleted,
    isNumberMastered,
    isNumberFavorited,
    toggleFavorite,
    getNumberSkillPercent,
  } = useNumbersProgress();

  const [number, setNumber] = useState(null);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const [countIndex, setCountIndex] = useState(0);
  const [practice, setPractice] = useState([]);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceResult, setPracticeResult] = useState(null);

  const { speak } = useAudio();
  const countIntervalRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const addTimeRef = useRef(addTimeSpent);

  useEffect(() => {
    addTimeRef.current = addTimeSpent;
  }, [addTimeSpent]);

  useEffect(() => {
    const found = getNumberById(numberId);
    if (!found) {
      navigate('/numbers');
      return undefined;
    }

    startTimeRef.current = Date.now();
    setNumber(found);
    setCurrentExampleIndex(0);
    setCountIndex(0);
    setIsCounting(false);
    setPractice(buildNumberPractice(found));
    setPracticeAnswers({});
    setPracticeResult(null);
    markOpened(numberId);

    speechTimeoutRef.current = setTimeout(() => {
      speak(found.word, { rate: 0.8, pitch: 1.1 });
    }, 500);

    return () => {
      clearTimeout(speechTimeoutRef.current);
      clearInterval(countIntervalRef.current);
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (seconds > 0) addTimeRef.current(numberId, seconds);
    };
  }, [numberId, navigate, markOpened, speak]);

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
  const skillPercent = getNumberSkillPercent(progress, numberId);

  const handleSpeak = (text, skill, options = {}) => {
    speak(text, { rate: 0.8, pitch: 1.1, ...options });
    if (skill) markSkill(numberId, skill);
  };

  const handleCount = () => {
    if (isCounting) {
      clearInterval(countIntervalRef.current);
      setIsCounting(false);
      setCountIndex(0);
      return;
    }

    const objects = number.objects || [];
    if (!objects.length) {
      markSkill(numberId, 'counting', { accuracy: 100 });
      speak(`Zero! There is nothing to count.`, { rate: 0.8, pitch: 1.1 });
      announceToScreenReader('Zero means nothing to count');
      return;
    }

    setIsCounting(true);
    setCountIndex(0);

    countIntervalRef.current = setInterval(() => {
      setCountIndex(prev => {
        const next = prev + 1;
        if (next <= objects.length) {
          speak(String(next), { rate: 0.6, pitch: 1.2 });
          return next;
        }
        clearInterval(countIntervalRef.current);
        setIsCounting(false);
        markSkill(numberId, 'counting', { accuracy: 100 });
        speak(`${number.word}!`, { rate: 0.8, pitch: 1.2 });
        announceToScreenReader(`Counted to ${number.number}`);
        return prev;
      });
    }, 800);
  };

  const handleNext = () => {
    if (isLastExample) {
      markCompleted(numberId);
      setShowCelebration(true);
      announceToScreenReader(`Completed number ${number.number}!`);
      speak(`Great job! You completed number ${number.number}.`, { rate: 0.9, pitch: 1.1 });
    } else {
      setCurrentExampleIndex(prev => prev + 1);
    }
  };

  const handleFavoriteToggle = () => {
    toggleFavorite(numberId);
    announceToScreenReader(isFavorited ? 'Removed from favorites' : 'Added to favorites');
  };

  const handlePracticeAnswer = (question, optionIndex) => {
    if (practiceAnswers[question.id] != null) return;
    setPracticeAnswers(prev => ({ ...prev, [question.id]: optionIndex }));
    if (question.audio) {
      speak(question.audio, { rate: 0.7, pitch: 1.1 });
    }
  };

  const handlePracticeSubmit = () => {
    const answers = practice.map(question => practiceAnswers[question.id]);
    const result = gradeNumberPractice(practice, answers);
    setPracticeResult(result);

    practice.forEach((question, index) => {
      const skill = toSkillName(question.type);
      const correct = answers[index] === question.correctIndex;
      if (skill) {
        markSkill(numberId, skill, {
          completed: correct,
          accuracy: correct ? 100 : 0,
          attempts: 1,
        });
      }
    });

    announceToScreenReader(
      `Quick check complete. ${result.correct} out of ${result.total} correct.`,
    );
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    navigate('/numbers');
  };

  const getObjectsToShow = () => (number.objects || []).slice(0, countIndex);
  const objectCount = (number.objects || []).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
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
          <h2 className="min-w-0 font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            Number {number.number}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-full transition-colors ${
              isFavorited
                ? 'text-pink-500 bg-pink-100 dark:bg-pink-900/30'
                : 'text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={isFavorited ? 'Remove favorite' : 'Add favorite'}
            aria-pressed={isFavorited}
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

      {/* Skill progress */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Skills practiced</span>
          <span className="text-primary font-bold">{skillPercent}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${skillPercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Recognize, count and read the word to complete this number. Trace it to earn mastery.
        </p>
      </div>

      {/* Main Number Display */}
      <div className={`bg-gradient-to-br ${number.color} rounded-2xl p-8 text-center text-white`}>
        <div className="flex items-center justify-center gap-6">
          <div className="text-8xl md:text-9xl font-baloo font-bold drop-shadow-lg">
            {number.number}
          </div>
          <div className="text-5xl md:text-6xl drop-shadow-lg" aria-hidden="true">
            {number.emoji}
          </div>
        </div>
        <h3 className="font-baloo text-3xl md:text-4xl font-bold mt-2 drop-shadow-lg">
          {number.word}
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            onClick={() => handleSpeak(number.word, 'recognition')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
            aria-label={`Hear and practice ${number.word}`}
          >
            <FaVolumeUp className="text-lg" />
            <span>Listen</span>
          </button>
          <button
            onClick={() => handleSpeak(number.phonics, 'word', { rate: 0.5, pitch: 1.1 })}
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
          {objectCount === 0 && !isCounting && (
            <span className="text-gray-500 dark:text-gray-400 text-lg">
              Zero means nothing to count! Tap Count to hear it.
            </span>
          )}
          {objectCount > 0 && countIndex === 0 && !isCounting && (
            <span className="text-gray-400 dark:text-gray-500 text-lg">
              👆 Tap "Count" to see objects appear!
            </span>
          )}
          {isCounting && countIndex === 0 && objectCount > 0 && (
            <span className="text-gray-400 dark:text-gray-500 text-lg animate-pulse">
              🎵 Counting...
            </span>
          )}
          {objectCount > 0 && countIndex === objectCount && !isCounting && (
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

      {/* Quick check practice */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaClipboardCheck className="text-primary text-xl" />
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Quick check ✏️
          </h3>
        </div>
        <div className="space-y-5">
          {practice.map((question) => {
            const selected = practiceAnswers[question.id];
            return (
              <div key={question.id}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-medium text-gray-700 dark:text-gray-200">{question.prompt}</p>
                  {question.audio && (
                    <button
                      onClick={() => speak(question.audio, { rate: 0.7, pitch: 1.1 })}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-primary hover:bg-gray-200 dark:hover:bg-gray-600"
                      aria-label="Play question audio"
                    >
                      <FaVolumeUp />
                    </button>
                  )}
                </div>
                {question.display && (
                  <p className="text-3xl text-center mb-2" aria-hidden="true">{question.display}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handlePracticeAnswer(question, index)}
                      disabled={selected != null}
                      className={`px-3 py-2 rounded-xl font-bold transition-colors ${
                        selected == null
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-primary hover:text-white'
                          : index === question.correctIndex
                            ? 'bg-green-500 text-white'
                            : index === selected
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 opacity-60'
                      }`}
                      aria-pressed={selected === index}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            onClick={handlePracticeSubmit}
            disabled={practice.some(question => practiceAnswers[question.id] == null)}
            className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check answers
          </button>
          {practiceResult && (
            <p className="font-semibold text-gray-700 dark:text-gray-200" aria-live="polite">
              {practiceResult.correct} of {practiceResult.total} correct · {practiceResult.accuracy}%
              {practiceResult.accuracy === 100 ? ' 🌟' : ' 💪'}
            </p>
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
            <div className="text-4xl mb-3" aria-hidden="true">
              {number.examples[currentExampleIndex]}
            </div>
            <button
              onClick={() => handleSpeak(number.examples[currentExampleIndex], null)}
              className="text-primary hover:text-primary-dark transition-colors"
              aria-label="Hear example"
            >
              <FaVolumeUp className="text-xl" />
            </button>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setCurrentExampleIndex(prev => Math.max(0, prev - 1))}
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
            if (currentIndex > 0) navigate(`/numbers/lesson/${NUMBERS_DATA[currentIndex - 1].id}`);
          }}
          disabled={NUMBERS_DATA.findIndex(n => n.id === numberId) <= 0}
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            if (currentIndex < NUMBERS_DATA.length - 1) navigate(`/numbers/lesson/${NUMBERS_DATA[currentIndex + 1].id}`);
          }}
          disabled={NUMBERS_DATA.findIndex(n => n.id === numberId) >= NUMBERS_DATA.length - 1}
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
              <div className="text-7xl mb-4 animate-bounce" aria-hidden="true">🎉</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                You completed Number {number.number}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Great job learning the number {number.word}! 🌟
              </p>
              <div className="flex justify-center gap-2 mt-4" aria-hidden="true">
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
