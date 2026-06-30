import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaStar, FaTrophy, FaChartLine, 
  FaBook, FaGamepad, FaPencilAlt, FaClock,
  FaFire, FaCheck, FaTimes, FaRocket
} from 'react-icons/fa';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { NUMBERS_DATA } from '../../data/numbersData';
import gameProgressService from '../../services/GameProgressService';
import readingAnalyticsService from '../../services/ReadingAnalyticsService';
import adaptiveLearningService from '../../services/AdaptiveLearningService';
import numbersAssessmentService from '../../services/NumbersAssessmentService';

const NumbersMastery = () => {
  const navigate = useNavigate();
  const { 
    progress,
    getCompletionPercentage,
    getMasteryPercentage,
    getNextNumber
  } = useNumbersProgress();

  const [assessmentResults, setAssessmentResults] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const completionPercentage = getCompletionPercentage();
  const masteryPercentage = getMasteryPercentage();
  const nextNumber = getNextNumber();

  // Calculate stats
  const totalGames = NUMBERS_DATA.length;
  const completedGames = progress.completed.length;
  const masteredNumbers = progress.mastered.length;
  const gamesPlayed = gameProgressService.getTotalPlays();
  const starsEarned = gameProgressService.getTotalStars();
  const minutesRead = readingAnalyticsService.getStats().minutesRead || 0;
  const streak = readingAnalyticsService.getStats().readingStreak || 0;
  

  const startAssessment = useCallback(() => {
    // Generate assessment using assessment service
    const numberData = {};
    NUMBERS_DATA.forEach(num => {
      numberData[num.id] = {
        vocabulary: num.examples,
        sound: num.phonics
      };
    });
    const questions = numbersAssessmentService.generateAssessment(numberData, progress);
    setCurrentQuestion(questions[0] || null);
    setQuestionIndex(0);
    setScore(0);
    setIsAssessmentComplete(false);
    setSelectedAnswer(null);
    setShowAssessment(true);
  }, [progress]);

  const handleAnswer = useCallback((answer) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    const result = numbersAssessmentService.submitAnswer(answer);
    
    if (result) {
      setScore(result.currentScore);
      
      if (result.isComplete) {
        setIsAssessmentComplete(true);
        const results = numbersAssessmentService.getResults();
        setAssessmentResults(results);
      } else {
        setTimeout(() => {
          const next = numbersAssessmentService.getCurrentQuestion();
          setCurrentQuestion(next);
          setQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
        }, 1000);
      }
    }
  }, [selectedAnswer]);

  const getLevelEmoji = (level) => {
    const map = {
      'Master': '🌟',
      'Diamond': '💎',
      'Gold': '🥇',
      'Silver': '🥈',
      'Bronze': '🥉'
    };
    return map[level] || '📚';
  };

  const getLevelColor = (level) => {
    const map = {
      'Master': 'text-purple-500',
      'Diamond': 'text-blue-500',
      'Gold': 'text-yellow-500',
      'Silver': 'text-gray-400',
      'Bronze': 'text-orange-500'
    };
    return map[level] || 'text-gray-300';
  };
  

  const stats = useMemo(() => [
  { label: 'Numbers Mastered', value: masteredNumbers, total: totalGames, icon: FaStar, color: 'text-yellow-500' },
    { label: 'Games Played', value: gamesPlayed, total: null, icon: FaGamepad, color: 'text-green-500' },
    { label: 'Stars Earned', value: starsEarned, total: null, icon: FaTrophy, color: 'text-purple-500' },
    { label: 'Minutes Read', value: minutesRead, total: null, icon: FaBook, color: 'text-blue-500' },
    { label: 'Day Streak', value: streak, total: null, icon: FaFire, color: 'text-orange-500' },
    { label: 'Completion', value: `${completionPercentage}%`, total: null, icon: FaChartLine, color: 'text-primary' }
  ]);

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
          <div>
            <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              🏆 Numbers Mastery
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your progress and celebrate your achievements!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow-soft"
          >
            <stat.icon className={`${stat.color} text-2xl mx-auto`} />
            <div className="text-xl font-bold text-gray-800 dark:text-white">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
            {stat.total && (
              <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(stat.value / stat.total) * 100}%` }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Progress Rings */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-soft">
          <div className="relative w-24 h-24 mx-auto">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-600" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-primary" 
                strokeDasharray={`${completionPercentage * 2.51} 251.2`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-800 dark:text-white">
              {completionPercentage}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Completion</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-soft">
          <div className="relative w-24 h-24 mx-auto">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-600" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-yellow-500" 
                strokeDasharray={`${masteryPercentage * 2.51} 251.2`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-800 dark:text-white">
              {masteryPercentage}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Mastery</p>
        </div>
      </div>

      {/* Assessment Section */}
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-6 text-center">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          🎯 Numbers Assessment
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
          Take a quick assessment to test your number skills!
        </p>
        <button
          onClick={startAssessment}
          className="mt-4 btn-primary"
        >
          Start Assessment
        </button>
      </div>

      {/* Assessment Modal */}
      <AnimatePresence>
        {showAssessment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-soft p-6 max-h-[90vh] overflow-y-auto"
            >
              {!isAssessmentComplete ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
                      Number Assessment
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Question {questionIndex + 1} of {numbersAssessmentService.questions.length}
                    </span>
                  </div>

                  {currentQuestion && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                          {currentQuestion.question}
                        </p>
                        {currentQuestion.display && (
                          <p className="text-4xl mt-4">{currentQuestion.display}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        {currentQuestion.options.map((option, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAnswer(index)}
                            disabled={selectedAnswer !== null}
                            className={`p-4 rounded-xl text-xl font-bold transition-all duration-300 ${
                              selectedAnswer === index
                                ? currentQuestion.correct === index
                                  ? 'bg-green-500 text-white shadow-glow'
                                  : 'bg-red-500 text-white'
                                : selectedAnswer !== null
                                ? 'opacity-50'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {option}
                          </motion.button>
                        ))}
                      </div>

                      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Score: {score} / {questionIndex + (selectedAnswer !== null ? 1 : 0)}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-bounce">🎉</div>
                  <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                    Assessment Complete!
                  </h3>
                  <div className="flex justify-center items-center gap-4">
                    <div className="text-4xl">{getLevelEmoji(assessmentResults?.level)}</div>
                    <div>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                        {assessmentResults?.percentage}%
                      </p>
                      <p className={`text-sm font-medium ${getLevelColor(assessmentResults?.level)}`}>
                        {assessmentResults?.level || 'Bronze'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    You got {assessmentResults?.correct} out of {assessmentResults?.total} correct!
                  </p>
                  <button
                    onClick={() => {
                      setShowAssessment(false);
                      numbersAssessmentService.reset();
                    }}
                    className="btn-primary"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Module */}
      <div className="mt-6 p-6 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-2xl text-center">
        <div className="text-4xl mb-2">🚀</div>
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          Ready for Shapes & Colours?
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          Complete all numbers to unlock the next adventure!
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl px-4 py-2 text-sm">
            {masteredNumbers} / {totalGames} Mastered
          </div>
          {masteredNumbers === totalGames ? (
            <button
              onClick={() => navigate('/learn')}
              className="btn-primary"
            >
              Next Adventure →
            </button>
          ) : (
            <div className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-xl">
              🔒 Locked
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NumbersMastery;