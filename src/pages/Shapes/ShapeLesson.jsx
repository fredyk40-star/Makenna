import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaVolumeUp, FaCheck, FaStar,
  FaRegStar, FaArrowRight
} from 'react-icons/fa';
import { getShapeById, SHAPES_DATA } from '../../data/shapesData';
import { useAudio } from '../../hooks/useAudio';
import { useChildAccount } from '../../context/ChildAccountContext';
import { announceToScreenReader } from '../../utils/accessibility';

const ShapeLesson = () => {
  const { shapeId } = useParams();
  const navigate = useNavigate();
  const [shape, setShape] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizCorrect, setQuizCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const { speak } = useAudio();
  const { activeChild, childId } = useChildAccount();

  useEffect(() => {
    const found = getShapeById(shapeId);
    if (found) {
      setShape(found);
      
      // Load progress from child account or localStorage
      if (childId) {
        const accounts = JSON.parse(localStorage.getItem('makenna_child_accounts_v2') || '[]');
        const account = accounts.find(a => a.childId?.toLowerCase() === childId?.toLowerCase());
        const progress = account?.progress?.shape_progress || {};
        setIsCompleted(progress[shapeId]?.completed || false);
        
        // Load favorites
        const favorites = account?.progress?.shape_favorites || [];
        setIsFavorite(favorites.includes(shapeId));
      } else {
        // Fallback to localStorage for backward compatibility
        const progress = JSON.parse(localStorage.getItem('shape_progress') || '{}');
        setIsCompleted(progress[shapeId]?.completed || false);
        const favorites = JSON.parse(localStorage.getItem('shape_favorites') || '[]');
        setIsFavorite(favorites.includes(shapeId));
      }
      
      // Speak shape name
      setTimeout(() => {
        speak(`This is a ${found.name}. ${found.description}`, { rate: 0.7, pitch: 1.1 });
      }, 500);
    } else {
      navigate('/shapes');
    }
  }, [shapeId, navigate, speak, childId]);

  const toggleFavorite = useCallback(() => {
    const newIsFavorite = !isFavorite;
    
    if (childId) {
      // Save to child account
      const accounts = JSON.parse(localStorage.getItem('makenna_child_accounts_v2') || '[]');
      const accountIndex = accounts.findIndex(a => a.childId?.toLowerCase() === childId?.toLowerCase());
      if (accountIndex !== -1) {
        if (!accounts[accountIndex].progress) accounts[accountIndex].progress = {};
        const favorites = accounts[accountIndex].progress.shape_favorites || [];
        const newFavorites = newIsFavorite
          ? [...favorites, shapeId]
          : favorites.filter(id => id !== shapeId);
        accounts[accountIndex].progress.shape_favorites = newFavorites;
        localStorage.setItem('makenna_child_accounts_v2', JSON.stringify(accounts));
      }
    } else {
      // Fallback to localStorage
      const favorites = JSON.parse(localStorage.getItem('shape_favorites') || '[]');
      const newFavorites = newIsFavorite
        ? [...favorites, shapeId]
        : favorites.filter(id => id !== shapeId);
      localStorage.setItem('shape_favorites', JSON.stringify(newFavorites));
    }
    
    setIsFavorite(newIsFavorite);
  }, [isFavorite, shapeId, childId]);

  const handleSpeak = (text) => {
    speak(text, { rate: 0.7, pitch: 1.1 });
  };

  const handleQuizAnswer = (answer) => {
    if (quizSelected !== null) return;
    
    setQuizSelected(answer);
    const correct = answer === shape.name;
    setQuizCorrect(correct);
    
    if (correct) {
      speak('Correct! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct!');
      
      // Mark as completed
      if (childId) {
        const accounts = JSON.parse(localStorage.getItem('makenna_child_accounts_v2') || '[]');
        const accountIndex = accounts.findIndex(a => a.childId?.toLowerCase() === childId?.toLowerCase());
        if (accountIndex !== -1) {
          if (!accounts[accountIndex].progress) accounts[accountIndex].progress = {};
          if (!accounts[accountIndex].progress.shape_progress) accounts[accountIndex].progress.shape_progress = {};
          accounts[accountIndex].progress.shape_progress[shapeId] = { completed: true };
          localStorage.setItem('makenna_child_accounts_v2', JSON.stringify(accounts));
        }
      } else {
        // Fallback to localStorage
        const progress = JSON.parse(localStorage.getItem('shape_progress') || '{}');
        progress[shapeId] = { completed: true };
        localStorage.setItem('shape_progress', JSON.stringify(progress));
      }
      
      setIsCompleted(true);
      setShowCelebration(true);
      
      setTimeout(() => setShowCelebration(false), 3000);
    } else {
      speak('Try again!', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not quite, try again');
      setTimeout(() => {
        setQuizSelected(null);
        setQuizCorrect(null);
      }, 1000);
    }
  };

  if (!shape) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔷</div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const quizOptions = SHAPES_DATA
    .filter(s => s.id !== shape.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  const allOptions = [shape.name, ...quizOptions.map(s => s.name)]
    .sort(() => Math.random() - 0.5);

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
            to="/shapes"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            Learning {shape.name}
          </h1>
        </div>
        <button
          onClick={toggleFavorite}
          className={`p-2 rounded-full transition-colors ${
            isFavorite
              ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
              : 'text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
        >
          {isFavorite ? <FaStar className="text-xl" /> : <FaRegStar className="text-xl" />}
        </button>
      </div>

      {/* Shape Display */}
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-center">
        <div className="text-9xl animate-float">{shape.emoji}</div>
        <h2 className="font-baloo text-4xl font-bold text-primary dark:text-blue-400 mt-4">
          {shape.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {shape.description}
        </p>
        <button
          onClick={() => handleSpeak(`${shape.name}. ${shape.description}`)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
        >
          <FaVolumeUp className="text-sm" />
          Listen
        </button>
      </div>

      {/* Real World Example */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 text-center">
        <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-2">
          Real World Example
        </h3>
        <div className="text-6xl">{shape.objectEmoji}</div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          A {shape.name} is like a {shape.realObject}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Colour: {shape.colorAssociation}
        </p>
        <button
          onClick={() => handleSpeak(`A ${shape.name} is like a ${shape.realObject}`)}
          className="mt-3 text-primary hover:text-primary-dark transition-colors"
        >
          <FaVolumeUp className="text-xl mx-auto" />
        </button>
      </div>

      {/* Quiz */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6">
        <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-4">
          🧠 Quick Quiz
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Which shape is this?
        </p>
        <div className="text-6xl text-center mb-4">{shape.emoji}</div>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {allOptions.map((option) => (
            <motion.button
              key={option}
              whileHover={{ scale: quizSelected === null ? 1.05 : 1 }}
              whileTap={{ scale: quizSelected === null ? 0.95 : 1 }}
              onClick={() => handleQuizAnswer(option)}
              disabled={quizSelected !== null}
              className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                quizSelected === option
                  ? quizCorrect
                    ? 'bg-green-500 text-white shadow-glow'
                    : 'bg-red-500 text-white'
                  : quizSelected !== null && option === shape.name
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              } ${quizSelected !== null && quizSelected !== option && option !== shape.name ? 'opacity-50' : ''}`}
            >
              {option}
            </motion.button>
          ))}
        </div>
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
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-soft"
            >
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                You learned {shape.name}!
              </h2>
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
                onClick={() => {
                  setShowCelebration(false);
                  navigate('/shapes');
                }}
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

export default ShapeLesson;