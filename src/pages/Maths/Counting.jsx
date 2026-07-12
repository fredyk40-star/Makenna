import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaCheck, FaStar, FaVolumeUp,
  FaArrowRight
} from 'react-icons/fa';
import { COUNTING_ITEMS } from '../../data/mathsData';
import { useAudio } from '../../hooks/useAudio';
import { useProfiles } from '../../context/ProfileContext';
import adaptiveLearningService from '../../services/AdaptiveLearningService';
import { announceToScreenReader } from '../../utils/accessibility';

const Counting = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [targetCount, setTargetCount] = useState(0);
  const [counted, setCounted] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [progress, setProgress] = useState({});

  const { speak } = useAudio();
  const { getProfileData, setProfileData } = useProfiles();

  useEffect(() => {
    loadProgress();
    generateQuestion();
  }, []);

  const loadProgress = () => {
    const saved = getProfileData('maths_progress', {});
    setProgress(saved);
  };

  const saveProgress = (data) => {
    const updated = { ...progress, ...data };
    setProfileData('maths_progress', updated);
    setProgress(updated);
  };

  const generateQuestion = useCallback(() => {
    const maxItems = 10;
    const count = Math.floor(Math.random() * maxItems) + 1;
    setTargetCount(count);
    setCounted(0);
    setSelectedItems([]);
    setIsCorrect(null);

    const itemType = COUNTING_ITEMS[Math.floor(Math.random() * COUNTING_ITEMS.length)];
    const total = count + Math.floor(Math.random() * 3) + 2;
    const newItems = Array.from({ length: total }, (_, i) => ({
      id: i,
      emoji: itemType.emoji,
      label: itemType.label,
      selected: false,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 70,
      delay: Math.random() * 0.2
    }));
    setItems(newItems);
    setTotalQuestions(prev => prev + 1);

    setTimeout(() => {
      speak(`Count the ${itemType.label}`, { rate: 0.7, pitch: 1.1 });
      announceToScreenReader(`Count the ${itemType.label}`);
    }, 300);
  }, [speak]);

  const handleItemClick = (itemId) => {
    if (isCorrect !== null) return;

    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ));

    const item = items.find(i => i.id === itemId);
    if (!item?.selected) {
      setSelectedItems(prev => [...prev, itemId]);
      setCounted(prev => prev + 1);
      speak(String(counted + 1), { rate: 0.6, pitch: 1.2 });
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      setCounted(prev => prev - 1);
    }
  };

  const handleCheckAnswer = () => {
    if (counted === targetCount) {
      setIsCorrect(true);
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10);
      speak('Correct! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct!');

      const currentProgress = {
        [`counting`]: {
          completed: true,
          score: score + 10,
          correct: correctAnswers + 1,
          attempts: attempts + 1
        }
      };
      saveProgress(currentProgress);

      adaptiveLearningService.recordPerformance('maths_counting', {
        correct: 1,
        incorrect: 0,
        time: 2,
        difficulty: 'easy'
      });

      if (totalQuestions >= 5) {
        const finalScore = Math.round((correctAnswers + 1) / (totalQuestions + 1) * 100);
        const stars = finalScore >= 90 ? 5 : finalScore >= 70 ? 3 : 1;
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          navigate('/maths');
        }, 3000);
      } else {
        setTimeout(generateQuestion, 1500);
      }
    } else {
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      speak(`You counted ${counted}. Need ${targetCount}!`, { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not quite, try again');
      setTimeout(() => {
        setIsCorrect(null);
      }, 1000);
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
            to="/maths"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            🔢 Counting Practice
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Score: {score}</span>
          <span>•</span>
          <span>{totalQuestions}/5</span>
        </div>
      </div>

      {/* Counting Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 text-center">
        <div className="text-2xl font-bold text-primary">
          Count {targetCount} items
        </div>
        <div className="text-4xl font-bold text-gray-800 dark:text-white mt-2">
          {counted} / {targetCount}
        </div>
      </div>

      {/* Items Grid */}
      <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 min-h-[250px]">
        {items.map((item) => (
          <motion.button
            key={item.id}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: item.selected ? 180 : 0,
              opacity: item.selected ? 0.7 : 1
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleItemClick(item.id)}
            disabled={isCorrect !== null}
            className={`absolute text-3xl transition-all duration-300 ${
              item.selected ? 'ring-2 ring-green-400 rounded-full' : ''
            }`}
            style={{ 
              left: `${item.x}%`, 
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            aria-label={item.selected ? 'Selected' : item.label}
          >
            {item.emoji}
            {item.selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 text-green-500 text-sm"
              >
                ✅
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => {
            setCounted(0);
            setSelectedItems([]);
            setItems(prev => prev.map(item => ({ ...item, selected: false })));
            setIsCorrect(null);
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleCheckAnswer}
          disabled={counted === 0 || isCorrect !== null}
          className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-center p-3 rounded-xl ${
              isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {isCorrect ? '🎉 Correct! Great counting!' : `🤔 That's not ${targetCount}. Try again!`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(totalQuestions / 5) * 100}%` }}
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
        />
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {Math.min(totalQuestions, 5)} of 5
      </div>

      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-soft"
            >
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                Counting Champion!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                You're a counting superstar!
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
                onClick={() => navigate('/maths')}
                className="mt-6 btn-primary"
              >
                Continue Learning
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Counting;