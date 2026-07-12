import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaSearch, FaStar, FaClock, 
  FaPlay, FaBookOpen, FaHeadphones
} from 'react-icons/fa';
import { NUMBERS_STORIES, searchStories } from '../../data/numbersStoriesData';
import readingAnalyticsService from '../../services/ReadingAnalyticsService';
import { staggerContainer } from '../../utils/constants';

const NumberStories = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStories, setFilteredStories] = useState(NUMBERS_STORIES);
  const [favorites, setFavorites] = useState([]);
  const [readingMode, setReadingMode] = useState('all'); // 'all', 'read-to-me', 'read-myself'

  useEffect(() => {
    try {
      const saved = localStorage.getItem('number_story_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load favorites:', error);
    }
  }, []);

  useEffect(() => {
    let results = [...NUMBERS_STORIES];
    
    if (searchQuery.trim()) {
      results = searchStories(searchQuery);
    }
    
    if (readingMode !== 'all') {
      // Filter by reading mode (simplified)
      results = results.filter(story => story.level === 1);
    }
    
    // Sort: favorites first
    results.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? -1 : 1;
      const bFav = favorites.includes(b.id) ? -1 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.number - b.number;
    });
    
    setFilteredStories(results);
  }, [searchQuery, readingMode, favorites]);

  const toggleFavorite = (storyId) => {
    const newFavorites = favorites.includes(storyId)
      ? favorites.filter(id => id !== storyId)
      : [...favorites, storyId];
    
    setFavorites(newFavorites);
    localStorage.setItem('number_story_favorites', JSON.stringify(newFavorites));
    
    if (newFavorites.includes(storyId)) {
      readingAnalyticsService.addFavoriteStory(storyId);
    } else {
      readingAnalyticsService.removeFavoriteStory(storyId);
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
            to="/numbers"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Numbers"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              📖 Number Stories
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Read and learn with numbers 1 to 20!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <FaBookOpen className="text-lg" />
          <span>{filteredStories.length} stories</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Search stories"
            />
          </div>
        </div>

        {/* Reading Mode Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReadingMode('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              readingMode === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Stories
          </button>
          <button
            onClick={() => setReadingMode('read-to-me')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
              readingMode === 'read-to-me'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FaHeadphones className="text-xs" /> Read to Me
          </button>
          <button
            onClick={() => setReadingMode('read-myself')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
              readingMode === 'read-myself'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FaBookOpen className="text-xs" /> Read Myself
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredStories.map((story, index) => {
          const isFavorite = favorites.includes(story.id);
          
          return (
            <motion.div
              key={story.id}
              variants={{
                initial: { opacity: 0, scale: 0.9 },
                animate: { 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: index * 0.05 }
                }
              }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden"
            >
              {/* Cover */}
              <div className="relative h-40 bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <div className="text-7xl">{story.coverEmoji}</div>
                
                {/* Number Badge */}
                <div className="absolute top-2 left-2 px-3 py-1 bg-white/90 dark:bg-gray-800/90 rounded-xl text-sm font-bold text-gray-800 dark:text-white">
                  #{story.number}
                </div>

                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(story.id);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>

                {/* Level Badge */}
                <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white`}>
                  Level {story.level}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white line-clamp-1">
                  {story.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                  {story.description}
                </p>

                {/* Pages and Level */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {story.pages.length} pages
                  </div>
                  <Link to={`/numbers/story/${story.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                    >
                      <FaPlay className="text-xs" />
                      Read
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-primary">{NUMBERS_STORIES.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Stories</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-yellow-500">{favorites.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-green-500">
            {readingAnalyticsService.getStats().storiesCompleted || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Read</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-purple-500">
            {readingAnalyticsService.getStats().minutesRead || 0}m
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Minutes Read</div>
        </div>
      </div>
    </motion.div>
  );
};

export default NumberStories;