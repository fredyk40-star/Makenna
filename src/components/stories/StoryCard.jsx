import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaPlay, FaClock, FaStar, FaRegStar, 
  FaBookOpen, FaHeart, FaRegHeart 
} from 'react-icons/fa';

const StoryCard = ({ story, isFavorite, onFavoriteToggle }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getLevelBadge = (level) => {
    const colors = {
      1: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      2: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      3: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    };
    return colors[level] || colors[1];
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-500',
      medium: 'text-yellow-500',
      hard: 'text-red-500'
    };
    return colors[difficulty] || 'text-gray-500';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden"
    >
      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
        <div className="text-7xl">{story.coverEmoji}</div>
        
        {/* Letter Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 dark:bg-gray-800/90 rounded-lg text-sm font-bold text-gray-800 dark:text-white">
          {story.letter}
        </div>

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

        {/* Level Badge */}
        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelBadge(story.level)}`}>
          Level {story.level}
        </div>

        {/* Reading Time */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-white text-xs flex items-center gap-1">
          <FaClock className="text-[10px]" />
          {story.estimatedTime} min
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white line-clamp-1">
          {story.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
          {story.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {story.category}
          </span>
          <span className={`text-xs font-medium ${getDifficultyColor(story.difficulty)}`}>
            • {story.difficulty}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {story.pages.length} pages
          </div>
          
          <Link to={`/story/${story.id}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark shadow-soft hover:shadow-glow transition-all duration-300"
            >
              <FaPlay className="text-xs" />
              Read
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryCard;