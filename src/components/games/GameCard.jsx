import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaStar, FaPlay, FaClock, FaHeart, FaRegHeart,
  FaLock, FaTrophy
} from 'react-icons/fa';
import gameProgressService from '../../services/GameProgressService';

const GameCard = ({ game, isFavorite, onFavoriteToggle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const progress = gameProgressService.getGameProgress(game.id);
  
  const getStarsDisplay = () => {
    if (progress && progress.bestStars) {
      return '⭐'.repeat(Math.min(progress.bestStars, 5));
    }
    return '☆☆☆☆☆';
  };

  const getCompletionStatus = () => {
    if (progress && progress.completed > 0) {
      return '✅ Completed';
    }
    return '🔒 Not started';
  };

  const getDifficultyColor = () => {
    switch (game.difficulty) {
      case 'easy': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      case 'hard': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getEstimatedTime = () => {
    if (game.estimatedTime) {
      return `${game.estimatedTime} min`;
    }
    return '5 min';
  };

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 }
      }}
      whileHover={{ 
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 300 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden"
    >
      {/* Header with icon */}
      <div className="relative h-32 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
        <div className="text-6xl">{game.icon}</div>
        
        {/* Favorite Button */}
        <button
          onClick={onFavoriteToggle}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-white text-lg" />
          )}
        </button>

        {/* Difficulty Badge */}
        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
          {game.difficulty || 'Easy'}
        </div>

        {/* Play Count */}
        {progress && progress.plays > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-white text-xs">
            {progress.plays} plays
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white">
          {game.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
          {game.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <FaClock className="text-xs" />
            <span>{getEstimatedTime()}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <FaStar className="text-xs text-yellow-400" />
            <span>{progress ? progress.bestStars || 0 : 0}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && progress.completed > 0 && (
          <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress.completed / 10 * 100, 100)}%` }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {getCompletionStatus()}
          </div>
          
          <Link to={game.path || '#'}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                game.locked 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-soft hover:shadow-glow'
              }`}
              disabled={game.locked}
              aria-label={`Play ${game.title}`}
            >
              {game.locked ? (
                <FaLock className="text-xs" />
              ) : (
                <FaPlay className="text-xs" />
              )}
              {game.locked ? 'Locked' : 'Play'}
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;