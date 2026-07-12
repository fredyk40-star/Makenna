import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaSearch, FaStar, FaLock, FaPlay, FaClock, 
  FaHeart, FaRegHeart, FaFilter, FaTrophy
} from 'react-icons/fa';
import GameCard from './GameCard';
import gameProgressService from '../../services/GameProgressService';
import { staggerContainer, fadeInUp } from '../../utils/constants';

const GameHub = ({ 
  games, 
  title = 'Game Hub',
  subtitle = 'Choose your adventure!',
  className = '' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [filteredGames, setFilteredGames] = useState(games);

  useEffect(() => {
    // Load favorites
    try {
      const saved = localStorage.getItem('game_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load favorites:', error);
    }
  }, []);

  useEffect(() => {
    let filtered = [...games];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(game => 
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(game => game.difficulty === filterDifficulty);
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(game => game.category === filterCategory);
    }
    
    // Favorites first
    filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id) ? -1 : 1;
      const bFav = favorites.includes(b.id) ? -1 : 1;
      return aFav - bFav;
    });
    
    setFilteredGames(filtered);
  }, [games, searchQuery, filterDifficulty, filterCategory, favorites]);

  const toggleFavorite = (gameId) => {
    const newFavorites = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    
    setFavorites(newFavorites);
    localStorage.setItem('game_favorites', JSON.stringify(newFavorites));
  };

  const difficulties = [
    { id: 'all', label: 'All' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' }
  ];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'letters', label: 'Letters' },
    { id: 'sounds', label: 'Sounds' },
    { id: 'words', label: 'Words' },
    { id: 'memory', label: 'Memory' }
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
              placeholder="Search games..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <FaFilter className="text-gray-400 text-sm" />
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">Difficulty:</span>
          </div>
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

      {/* Game Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isFavorite={favorites.includes(game.id)}
            onFavoriteToggle={() => toggleFavorite(game.id)}
          />
        ))}
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

      {/* Progress Summary */}
      <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaTrophy className="text-3xl text-yellow-500" />
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white">Your Progress</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {gameProgressService.getCompletedGames()} games completed • 
                {gameProgressService.getTotalStars()} stars earned
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Streak: {gameProgressService.getStreak()} days
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              • {gameProgressService.getTotalPlays()} total plays
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHub;