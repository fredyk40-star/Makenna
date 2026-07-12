import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaStar, FaRegStar } from 'react-icons/fa';
import StoryCard from './StoryCard';
import { STORIES, searchStories } from '../../data/stories';
import readingAnalyticsService from '../../services/ReadingAnalyticsService';

const StoryLibrary = ({ 
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

  useEffect(() => {
    // Load favorites from analytics
    const stats = readingAnalyticsService.getStats();
    setFavorites(stats.favoriteStories || []);
  }, []);

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
    const newFavorites = favorites.includes(storyId)
      ? favorites.filter(id => id !== storyId)
      : [...favorites, storyId];
    
    setFavorites(newFavorites);
    
    if (newFavorites.includes(storyId)) {
      readingAnalyticsService.addFavoriteStory(storyId);
    } else {
      readingAnalyticsService.removeFavoriteStory(storyId);
    }
  };

  const levels = [
    { id: 'all', label: 'All Levels' },
    { id: '1', label: 'Level 1' },
    { id: '2', label: 'Level 2' },
    { id: '3', label: 'Level 3' }
  ];

  const difficulties = [
    { id: 'all', label: 'All' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' }
  ];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'animals', label: 'Animals' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'family', label: 'Family' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {subtitle}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Level:</span>
            {levels.map(level => (
              <button
                key={level.id}
                onClick={() => setFilterLevel(level.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  filterLevel === level.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Difficulty:</span>
            {difficulties.map(diff => (
              <button
                key={diff.id}
                onClick={() => setFilterDifficulty(diff.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  filterDifficulty === diff.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Story Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredStories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            isFavorite={favorites.includes(story.id)}
            onFavoriteToggle={() => toggleFavorite(story.id)}
          />
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredStories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📖</div>
          <h3 className="font-baloo text-2xl text-gray-600 dark:text-gray-300">
            No stories found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </motion.div>
      )}

      {/* Reading Stats */}
      <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white">Your Reading Progress</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {readingAnalyticsService.getStats().storiesCompleted} stories completed • 
                {readingAnalyticsService.getStats().minutesRead} minutes read
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Level: {readingAnalyticsService.getReadingLevelLabel()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              • 🔥 {readingAnalyticsService.getStats().readingStreak} day streak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryLibrary;