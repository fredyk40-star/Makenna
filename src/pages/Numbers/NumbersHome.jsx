import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaStar, FaCheck, FaArrowLeft, FaSearch, 
  FaHeart, FaRegHeart, FaLock, FaPlay, FaFire, FaMedal
} from 'react-icons/fa';
import { NUMBERS_DATA, searchNumbers } from '../../data/numbersData';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import { staggerContainer } from '../../utils/constants';

const NumbersHome = () => {
  const { 
    isNumberCompleted, 
    isNumberFavorited, 
    isNumberMastered,
    getCompletionPercentage,
    getMasteryPercentage
  } = useNumbersProgress();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNumbers, setFilteredNumbers] = useState(NUMBERS_DATA);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    let results = NUMBERS_DATA;
    
    if (searchQuery.trim()) {
      results = searchNumbers(searchQuery);
    }
    
    if (showFavorites) {
      results = results.filter(num => isNumberFavorited(num.id));
    }
    
    setFilteredNumbers(results);
  }, [searchQuery, showFavorites, isNumberFavorited]);

  const completionPercentage = getCompletionPercentage();
  const masteryPercentage = getMasteryPercentage();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-6 md:space-y-8 pb-4"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">👑</span>
            <h1 className="font-baloo text-3xl md:text-4xl font-bold text-primary dark:text-blue-400">
              Numbers Kingdom
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Learn numbers 0 to 20 with fun activities!
          </p>
          
          {/* Progress Ring */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-primary"
                    strokeDasharray={`${completionPercentage * 1.256} 125.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
                  {completionPercentage}%
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-yellow-500"
                    strokeDasharray={`${masteryPercentage * 1.256} 125.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
                  {masteryPercentage}%
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Mastered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search numbers by name or example..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search numbers"
          />
        </div>
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
            showFavorites
              ? 'bg-yellow-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
          aria-label={showFavorites ? 'Show all numbers' : 'Show favorites'}
        >
          {showFavorites ? <FaHeart className="text-white" /> : <FaRegHeart />}
        </button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredNumbers.length} numbers found
      </div>

      {/* Numbers Grid */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        {filteredNumbers.map((num, index) => {
          const isCompleted = isNumberCompleted(num.id);
          const isMastered = isNumberMastered(num.id);
          const isFavorited = isNumberFavorited(num.id);

          return (
            <motion.div
              key={num.id}
              variants={{
                initial: { opacity: 0, scale: 0.9 },
                animate: { 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: index * 0.05 }
                }
              }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link
                to={`/numbers/lesson/${num.id}`}
                className={`block bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft hover:shadow-hover transition-all duration-300 text-center ${
                  isMastered ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className={`text-4xl md:text-5xl font-baloo font-bold bg-gradient-to-br ${num.color} bg-clip-text text-transparent`}>
                  {num.number}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
                  {num.word}
                </div>
                <div className="mt-2 text-2xl">
                  {num.emoji}
                </div>
                
                {/* Status Indicators */}
                <div className="mt-2 flex items-center justify-center gap-1">
                  {isCompleted && (
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      <FaCheck className="text-[10px]" />
                      <span className="sr-only">Completed</span>
                    </span>
                  )}
                  {isMastered && (
                    <span className="text-yellow-500 text-xs flex items-center gap-1">
                      <FaStar className="text-[10px]" />
                      <span className="sr-only">Mastered</span>
                    </span>
                  )}
                  {isFavorited && (
                    <span className="text-pink-500 text-xs">
                      <FaHeart className="text-[10px]" />
                      <span className="sr-only">Favorite</span>
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {filteredNumbers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-baloo text-2xl text-gray-600 dark:text-gray-300">
            No numbers found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Try searching for something else!
          </p>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-primary">{NUMBERS_DATA.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Numbers</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-green-500">{isNumberCompleted('20') ? 21 : 0}+</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-yellow-500">{isNumberMastered('20') ? 21 : 0}+</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Mastered</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-pink-500">❤️</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-6">
          <Link to="/numbers/games">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-soft hover:shadow-hover transition-all duration-300"
            >
              🎮 Play Games
            </motion.button>
          </Link>
          <Link to="/numbers/stories">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-soft hover:shadow-hover transition-all duration-300"
            >
              📖 Read Stories
            </motion.button>
          </Link>
        </div>
    </motion.div>
  );
};

export default NumbersHome;
