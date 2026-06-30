import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaStar, FaCheck, FaTimes, 
  FaHeart, FaRegHeart, FaPlay, FaPause,
  FaVolumeUp, FaVolumeMute
} from 'react-icons/fa';
import { getGameById } from '../../data/numbersGamesData';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import gameProgressService from '../../services/GameProgressService';
import adaptiveLearningService from '../../services/AdaptiveLearningService';
import { announceToScreenReader } from '../../utils/accessibility';

// Import all game components
import CountMangoes from './games/CountMangoes';
import CountPlantains from './games/CountPlantains';
import CountGoats from './games/CountGoats';
import BalloonPop from './games/BalloonPop';
import NumberFishing from './games/NumberFishing';
import MarketBasket from './games/MarketBasket';
import NumberMatch from './games/NumberMatch';
import MemoryCards from './games/MemoryCards';
import MissingNumber from './games/MissingNumber';
import NumberPuzzle from './games/NumberPuzzle';
import BiggerSmaller from './games/BiggerSmaller';
import MoreLess from './games/MoreLess';
import CountAnimals from './games/CountAnimals';
import TreasureHunt from './games/TreasureHunt';
import BubbleBurst from './games/BubbleBurst';

const GameComponents = {
  'count-mangoes': CountMangoes,
  'count-plantains': CountPlantains,
  'count-goats': CountGoats,
  'balloon-pop': BalloonPop,
  'number-fishing': NumberFishing,
  'market-basket': MarketBasket,
  'number-match': NumberMatch,
  'memory-cards': MemoryCards,
  'missing-number': MissingNumber,
  'number-puzzle': NumberPuzzle,
  'bigger-smaller': BiggerSmaller,
  'more-less': MoreLess,
  'count-animals': CountAnimals,
  'treasure-hunt': TreasureHunt,
  'bubble-burst': BubbleBurst
};

// Placeholder components for games not yet implemented
const PlaceholderGame = ({ title }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🎮</div>
    <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
      {title} Coming Soon!
    </h3>
    <p className="text-gray-600 dark:text-gray-300 mt-2">
      We're building this game for you!
    </p>
  </div>
);

const GameTemplate = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { markCompleted, markMastered } = useNumbersProgress();

  useEffect(() => {
    const found = getGameById(gameId);
    if (found) {
      setGame(found);
      setStartTime(Date.now());
      
      // Load favorite status
      try {
        const favorites = JSON.parse(localStorage.getItem('numbers_game_favorites') || '[]');
        setIsFavorite(favorites.includes(gameId));
      } catch (error) {
        console.warn('Failed to load favorites:', error);
      }
    } else {
      navigate('/numbers/games');
    }
  }, [gameId, navigate]);

  const toggleFavorite = useCallback(() => {
    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);
    try {
      const favorites = JSON.parse(localStorage.getItem('numbers_game_favorites') || '[]');
      if (newFavorite) {
        favorites.push(gameId);
      } else {
        const index = favorites.indexOf(gameId);
        if (index > -1) favorites.splice(index, 1);
      }
      localStorage.setItem('numbers_game_favorites', JSON.stringify(favorites));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  }, [isFavorite, gameId]);

  const handleGameComplete = useCallback((result) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    // Record progress
    gameProgressService.recordProgress(gameId, {
      score: result.score || 0,
      stars: result.stars || 0,
      time: timeSpent,
      completed: true,
      gameId: gameId
    });
    
    // Update numbers progress
    markCompleted(gameId);
    if (result.score > 80) {
      markMastered(gameId);
    }
    
    // Adaptive learning
    adaptiveLearningService.recordPerformance(gameId, {
      correct: result.correct || 0,
      incorrect: result.incorrect || 0,
      time: timeSpent,
      difficulty: game?.difficulty || 'medium'
    });
    
    setScore(result.score || 0);
    setStars(result.stars || 0);
    setIsComplete(true);
    setShowCelebration(true);
    
    announceToScreenReader(`Game complete! You scored ${result.score}%`);
  }, [gameId, startTime, game, markCompleted, markMastered]);

  const GameComponent = game ? GameComponents[game.id] || null : null;

  if (!game) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-gray-600 dark:text-gray-300">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/numbers/games"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Games"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {game.icon} {game.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {game.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-full transition-colors ${
              isFavorite
                ? 'text-pink-500 bg-pink-100 dark:bg-pink-900/30'
                : 'text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ⭐ {stars}
          </span>
        </div>
      </div>

      {/* Game Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 md:p-6 min-h-[400px]">
        {GameComponent ? (
          <GameComponent
            game={game}
            onComplete={handleGameComplete}
            onScoreUpdate={(newScore) => setScore(newScore)}
            onStarsUpdate={(newStars) => setStars(newStars)}
          />
        ) : (
          <PlaceholderGame title={game.title} />
        )}
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
                Great Job!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                You scored {score}% on {game.title}!
              </p>
              <div className="flex justify-center gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`text-2xl ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
              <div className="flex gap-3 mt-6 justify-center">
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    navigate('/numbers/games');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Back to Games
                </button>
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    setIsComplete(false);
                    setScore(0);
                    setStars(0);
                    setStartTime(Date.now());
                  }}
                  className="px-4 py-2 btn-primary"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GameTemplate;