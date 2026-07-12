import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaCheck, FaStar, FaVolumeUp,
  FaArrowRight
} from 'react-icons/fa';
import { generateCompareProblem } from '../../data/mathsData';
import { useAudio } from '../../hooks/useAudio';
import { useProfiles } from '../../context/ProfileContext';
import adaptiveLearningService from '../../services/AdaptiveLearningService';
import { announceToScreenReader } from '../../utils/accessibility';

const CompareNumbers = () => {
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
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
    generateNewProblem();
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

  const generateNewProblem = useCallback(() => {
    const newProblem = generateCompareProblem(10);
    setProblem(newProblem);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTotalQuestions(prev => prev + 1);

    setTimeout(() => {
      speak(`Compare ${newProblem.a} and ${newProblem.b}`, { rate: 0.7, pitch: 1.1 });
    }, 300);
  }, [speak]);

  const handleAnswer = (answer) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === problem.correct;
    setIsCorrect(correct);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10);
      speak('Correct! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct!');

      const currentProgress = {
        [`compare`]: {
          completed: true,
          score: score + 10,
          correct: correctAnswers + 1,
          attempts: attempts + 1
        }
      };
      saveProgress(currentProgress);

      adaptiveLearningService.recordPerformance('maths_compare', {
        correct: 1,
        incorrect: 0,
        time: 2,
        difficulty: 'medium'
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
        setTimeout(generateNewProblem, 1000);
      }
    } else {
      setAttempts(prev => prev + 1);
      speak('Try again!', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not quite, try again');
      
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 800);
    }
  };

  if (!problem) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚖️</div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Render visual blocks for comparison
  const renderBlocks = (count) => {
    return Array.from({ length: Math.min(count, 10) }, (_, i) => (
      <div key={i} className="w-6 h-6 bg-blue-400 rounded-sm m-0.5" />
    ));
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
            ⚖️ Compare Numbers
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Score: {score}</span>
          <span>•</span>
          <span>{totalQuestions}/5</span>
        </div>
      </div>

      {/* Comparison Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-center gap-4 md:gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800 dark:text-white">
              {problem.a}
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {renderBlocks(problem.a)}
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-400">?</div>
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800 dark:text-white">
              {problem.b}
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {renderBlocks(problem.b)}
            </div>
          </div>
        </div>

        <button
          onClick={() => speak(`Compare ${problem.a} and ${problem.b}`)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mx-auto"
        >
          <FaVolumeUp className="text-sm" />
          Listen
        </button>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {problem.options.map((option) => (
          <motion.button
            key={option}
            whileHover={{ scale: selectedAnswer === null ? 1.05 : 1 }}
            whileTap={{ scale: selectedAnswer === null ? 0.95 : 1 }}
            onClick={() => handleAnswer(option)}
            disabled={selectedAnswer !== null}
            className={`p-4 rounded-xl text-3xl font-bold transition-all duration-300 ${
              selectedAnswer === option
                ? isCorrect
                  ? 'bg-green-500 text-white shadow-glow'
                  : 'bg-red-500 text-white'
                : selectedAnswer !== null && option === problem.correct
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${selectedAnswer !== null && selectedAnswer !== option && option !== problem.correct ? 'opacity-50' : ''}`}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(totalQuestions / 5) * 100}%` }}
          className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
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
              <div className="text-7xl mb-4 animate-bounce">🏆</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                Comparison Master!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                You know how to compare numbers!
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

export default CompareNumbers;