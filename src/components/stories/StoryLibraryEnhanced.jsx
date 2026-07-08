import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaStar, FaRegStar, FaPlay, FaClock, FaBookOpen, FaHeart, FaRegHeart, FaChartLine, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { StoryEngine } from '../../services/StoryEngine';
import { RecommendationService } from '../../services/RecommendationService';
import { STORIES, searchStories } from '../../data/stories';
import { ChildAccountService } from '../../services/ChildAccountService';

const StoryLibraryEnhanced = ({
  title = 'Story Library 📚',
  subtitle = 'Choose a story to read!',
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filteredStories, setFilteredStories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recommendedStories, setRecommendedStories] = useState([]);
  const [storyProgress, setStoryProgress] = useState({}); // State to hold story progress
  const childId = ChildAccountService.getActiveChildId();

  // Load favorites and progress on mount
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('reading_analytics') || '{}');
    setFavorites(stats.favoriteStories || []);
    loadStoryProgress();
  }, []);

  // Get recommended stories based on user progress
  useEffect(() => {
    if (childId) {
      const recommendations = RecommendationService.getRecommendedStories(childId);
      const recommendedStoryObjects = recommendations
        .map(rec => STORIES.find(story => story.id === rec.storyId))
        .filter(Boolean);
      setRecommendedStories(recommendedStoryObjects);
    }
  }, [childId]);

  const loadStoryProgress = () => {
    const progressData = {};
    STORIES.forEach(story => {
      const savedProgress = StoryEngine.getStoryProgress(story.id);
      if (savedProgress) {
        progressData[story.id] = savedProgress.progress || 0;
      }
    });
    setStoryProgress(progressData);
  };

  // Apply search and filters
  useEffect(() => {
    let filtered = [...STORIES];

    // Search filter
    if (searchQuery) {
      filtered = searchStories(searchQuery);
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(story => story.level === parseInt(filterLevel));
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(story => story.difficulty === filterDifficulty);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(story => story.category === filterCategory);
    }

    // Favorites first
    filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? -1 : 1;
      const bFav = favorites.includes(b.id) ? -1 : 1;
      return aFav - bFav;
    });

    setFilteredStories(filtered);
  }, [searchQuery, filterLevel, filterDifficulty, filterCategory, favorites]);

  const toggleFavorite = (storyId) => {
    const stats = JSON.parse(localStorage.getItem('reading_analytics') || '{}');
    let favoriteStories = stats.favoriteStories || [];

    const newFavorites = favorites.includes(storyId)
      ? favorites.filter(id => id !== storyId)
      : [...favorites, storyId];

    setFavorites(newFavorites);

    if (newFavorites.includes(storyId)) {
      favoriteStories = [...new Set([...favoriteStories, storyId])];
    } else {
      favoriteStories = favoriteStories.filter(id => id !== storyId);
    }

    stats.favoriteStories = favoriteStories;
    localStorage.setItem('reading_analytics', JSON.stringify(stats));
  };

  const getLevelBadge = (level) => {
    const colors = {
      1: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      2: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      3: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-yellow-400'
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

  // Story Card Component (nested for simplicity, could be separate)
  const StoryCardEnhanced = ({ story, isFavorite, onFavoriteToggle, progress }) => {
    return (
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        className='bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden'>
        {/* Cover */}
        <div className='relative h-48 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center'>
          <div className='text-7xl'>{story.coverEmoji}</div>

          {/* Level Badge */}
          <div className={'absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ' + getLevelBadge(story.level)}>
            Level {story.level}
          </div>

          {/* Reading Time */}
          <div className='absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-white text-xs flex items-center gap-1'>
            <FaClock className='text-[10px]' />
            {story.estimatedTime} min
          </div>

          {/* Favorite Button */}
          <button
            onClick={onFavoriteToggle}
            className='absolute top-2 right-2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors'
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            {isFavorite ? (
              <FaHeart className='text-red-500 text-lg' />
            ) : (
              <FaRegHeart className='text-white text-lg' />
            )}
          </button>

          {/* Progress Indicator Overlay */}
          {progress > 0 && (
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-black/20'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: progress + '%' }}
                className='h-full bg-gradient-to-r from-green-400 to-green-500'
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className='p-4'>
          <h3 className='font-baloo text-lg font-bold text-gray-800 dark:text-white line-clamp-1'>
            {story.title}
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2'>
            {story.description}
          </p>

          {/* Progress Bar */}
          <div className='mt-2'>
            <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1'>
              <span>Progress</span>
              <span>{progress > 0 ? Math.round(progress) + '%' : 'New'}</span>
            </div>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: progress + '%' }}
                className={'h-2 rounded-full transition-all duration-500 ' + (
                  progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-primary' : 'bg-gray-300'
                )}
              />
            </div>
            {progress === 100 && (
              <div className='flex items-center gap-1 mt-1 text-green-500'>
                <FaCheckCircle className='text-xs' />
                <span className='text-xs font-medium'>Completed!</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className='flex items-center gap-2 mt-2'>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {story.category}
            </span>
            <span className={'text-xs font-medium ' + getDifficultyColor(story.difficulty)}>
              • {story.difficulty}
            </span>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'>
            <div className='text-xs text-gray-500 dark:text-gray-400'>
              {story.pages.length} pages
            </div>

            <Link to={'/story/' + story.id}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark shadow-soft hover:shadow-glow transition-all duration-300'>
                <FaPlay className='text-xs' />
                Read Now
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={'space-y-6 ' + className}>
      {/* Header */}
      <div className='text-center'>
        <h1 className='font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white'>
          {title}
        </h1>
        <p className='text-gray-600 dark:text-gray-300 mt-1'>
          {subtitle}
        </p>
      </div>

      {/* Recommended Stories Section */}
      <AnimatePresence>
        {recommendedStories.length > 0 && !searchQuery && filterLevel === 'all' && filterDifficulty === 'all' && filterCategory === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <FaStar className='text-yellow-500 text-2xl' />
              <h2 className='font-baloo text-2xl font-bold text-gray-800 dark:text-white'>
                Recommended for You ⭐
              </h2>
            </div>
            <p className='text-gray-600 dark:text-gray-300 mb-4'>
              Based on your progress, we think you'll love these stories!
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {recommendedStories.map((story) => (
                <StoryCardEnhanced
                  key={story.id}
                  story={story}
                  isFavorite={favorites.includes(story.id)}
                  onFavoriteToggle={() => toggleFavorite(story.id)}
                  progress={storyProgress[story.id] || 0}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className='space-y-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          {/* Search */}
          <div className='flex-1 relative'>
            <FaSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search stories...' // Added placeholder
              className='w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary'
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className='flex flex-wrap gap-4'>
          <div className='flex flex-wrap gap-2'>
            <span className='text-sm text-gray-500 dark:text-gray-400 self-center'>Level:</span>
            {levels.map(level => (
              <button
                key={level.id}
                onClick={() => setFilterLevel(level.id)}
                className={'px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ' + (
                  filterLevel === level.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}>
                {level.label}
              </button>
            ))}
          </div>

          <div className='flex flex-wrap gap-2'>
            <span className='text-sm text-gray-500 dark:text-gray-400 self-center'>Difficulty:</span>
            {difficulties.map(diff => (
              <button
                key={diff.id}
                onClick={() => setFilterDifficulty(diff.id)}
                className={'px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ' + (
                  filterDifficulty === diff.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}>
                {diff.label}
              </button>
            ))}
          </div>

          <div className='flex flex-wrap gap-2'>
            <span className='text-sm text-gray-500 dark:text-gray-400 self-center'>Category:</span>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={'px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ' + (
                  filterCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchQuery || filterLevel !== 'all' || filterDifficulty !== 'all' || filterCategory !== 'all') && (
        <div className='flex items-center gap-2 flex-wrap'>
          <span className='text-sm text-gray-500 dark:text-gray-400'>Active filters:</span>
          {searchQuery && (
            <span className='px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium'>
              Search: '{searchQuery}'
            </span>
          )}
          {filterLevel !== 'all' && (
            <span className='px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium'>
              Level: {filterLevel}
            </span>
          )}
          {filterDifficulty !== 'all' && (
            <span className='px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium'>
              Difficulty: {filterDifficulty}
            </span>
          )}
          {filterCategory !== 'all' && (
            <span className='px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium'>
              Category: {filterCategory}
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterLevel('all');
              setFilterDifficulty('all');
              setFilterCategory('all');
            }}
            className='text-xs text-gray-500 dark:text-gray-400 underline hover:text-primary'>
            Clear all
          </button>
        </div>
      )}

      {/* Story Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {filteredStories.map((story) => (
          <StoryCardEnhanced
            key={story.id}
            story={story}
            isFavorite={favorites.includes(story.id)}
            onFavoriteToggle={() => toggleFavorite(story.id)}
            progress={storyProgress[story.id] || 0}
          />
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredStories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center py-12'>
          <div className='text-6xl mb-4'>📖</div>
          <h3 className='font-baloo text-2xl text-gray-600 dark:text-gray-300'>
            No stories found
          </h3>
          <p className='text-gray-500 dark:text-gray-400 mt-1'>
            Try adjusting your search or filters
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default StoryLibraryEnhanced;