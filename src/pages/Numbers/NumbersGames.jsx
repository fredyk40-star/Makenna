import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaSearch, FaStar, FaHeart, FaRegHeart,
  FaPlay, FaLock, FaClock, FaFilter, FaGamepad,
  FaTrophy, FaFire
} from 'react-icons/fa';
import { 
  NUMBERS_GAMES, 
  GAME_CATEGORIES, 
  searchGames,
  getGamesByCategory,
  getGamesByDifficulty
} from '../../data/numbersGamesData';
import gameProgressService from '../../services/GameProgressService';
import { staggerContainer } from '../../utils/constants';

const NumbersGames = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [filteredGames, setFilteredGames] = useState(NUMBERS_GAMES);

  useEffect(() => {
    // Load favorites
    try {
      const saved = localStorage.getItem('numbers_game_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load favorites:', error);
    }
  }, []);

  useEffect(() => {
    let results = [...NUMBERS_GAMES];
    
    // Search filter
    if (searchQuery.trim()) {
      results = searchGames(searchQuery);
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter(game => game.category === selectedCategory);
    }
    
    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      results = results.filter(game => game.difficulty === selectedDifficulty);
    }
    
    // Favorites filter
    if (showFavorites) {
      results = results.filter(game => favorites.includes(game.id));
    }
    
    // Sort: favorites first, then by title
    results.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? -1 : 1;
      const bFav = favorites.includes(b.id) ? -1 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.title.localeCompare(b.title);
    });
    
    setFilteredGames(results);
  }, [searchQuery, selectedCategory, selectedDifficulty, showFavorites, favorites]);

  const toggleFavorite = useCallback((gameId) => {
    const newFavorites = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    
    setFavorites(newFavorites);
    localStorage.setItem('numbers_game_favorites', JSON.stringify(newFavorites));
  }, [favorites]);

  const getGameProgress = useCallback((gameId) => {
    return gameProgressService.getGameProgress(gameId);
  }, []);

  const getStarsDisplay = useCallback((gameId) => {
    const progress = getGameProgress(gameId);
    if (progress && progress.bestStars) {
      return '⭐'.repeat(Math.min(progress.bestStars, 5));
    }
    return '☆☆☆☆☆';
  }, [getGameProgress]);

  const difficulties = [
    { id: 'all', label: 'All' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' }
  ];

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
              🎮 Numbers Games
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Play and learn numbers 0-20!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <FaGamepad className="text-lg" />
          <span>{filteredGames.length} games</span>
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
              placeholder="Search games..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Search games"
            />
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              showFavorites
                ? 'bg-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
            aria-label={showFavorites ? 'Show all games' : 'Show favorites'}
          >
            {showFavorites ? <FaHeart /> : <FaRegHeart />}
            <span className="hidden sm:inline">Favorites</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <FaFilter className="text-gray-400 text-sm self-center" />
          {GAME_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-pressed={selectedCategory === cat.id}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Difficulty:</span>
          {difficulties.map(diff => (
            <button
              key={diff.id}
              onClick={() => setSelectedDifficulty(diff.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                selectedDifficulty === diff.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-pressed={selectedDifficulty === diff.id}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredGames.map((game, index) => {
          const isFavorite = favorites.includes(game.id);
          const progress = getGameProgress(game.id);
          const stars = getStarsDisplay(game.id);
          const hasPlayed = progress && progress.plays > 0;
          
          return (
            <motion.div
              key={game.id}
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
              <div className="relative h-32 bg-gradient-to-br overflow-hidden flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-80`} />
                <div className="relative z-10 text-5xl">{game.icon}</div>
                
                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(game.id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors z-20"
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? (
                    <FaHeart className="text-pink-500 text-sm" />
                  ) : (
                    <FaRegHeart className="text-white text-sm" />
                  )}
                </button>

                {/* Difficulty Badge */}
                <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white`}>
                  {game.difficulty}
                </div>

                {/* Time Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white flex items-center gap-1">
                  <FaClock className="text-[10px]" />
                  {game.estimatedTime}m
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                      {game.description}
                    </p>
                  </div>
                </div>

                {/* Stars and Progress */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{stars}</span>
                    {hasPlayed && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        ({progress.plays} plays)
                      </span>
                    )}
                  </div>
                  <Link to={`/numbers/game/${game.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                    >
                      <FaPlay className="text-xs" />
                      Play
                    </motion.button>
                  </Link>
                </div>

                {/* Progress Bar */}
                {hasPlayed && (
                  <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((progress.completed || 0) / 10 * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="font-baloo text-2xl text-gray-600 dark:text-gray-300">
            No games found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-primary">{NUMBERS_GAMES.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Games</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-yellow-500">{favorites.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-green-500">
            {gameProgressService.getTotalPlays() || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Plays</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-purple-500">
            {gameProgressService.getTotalStars() || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Stars Earned</div>
        </div>
      </div>
    </motion.div>
  );
};

export default NumbersGames;