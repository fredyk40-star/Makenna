import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaSearch, FaStar, FaHeart, FaRegHeart,
  FaPlay, FaLock, FaClock, FaFilter, FaMusic,
  FaTrophy, FaFire, FaMicrophone, FaGamepad
} from 'react-icons/fa';
import { MUSIC_CATEGORIES, MUSIC_LIBRARY, searchSongs, GAME_CATEGORIES } from '../../data/musicData';
import { useMusicProgress } from '../../hooks/useMusicProgress';
import { useChildAccount } from '../../context/ChildAccountContext';
import { voiceGuide } from '../../services/VoiceGuideService';
import { GamificationService } from '../../services/GamificationService';
import { staggerContainer, fadeInUp } from '../../utils/constants';

const MusicLibrary = () => {
  const { childName, childId } = useChildAccount();
  const { progress, toggleFavorite, isFavorited } = useMusicProgress();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState(MUSIC_LIBRARY);
  const [dailySong, setDailySong] = useState(null);

  // Initialize voice guide on mount
  useEffect(() => {
    voiceGuide.init();
  }, []);

  // Set daily song challenge
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedDailySong = localStorage.getItem(`daily_song_${today}`);
    if (savedDailySong) {
      setDailySong(JSON.parse(savedDailySong));
    } else {
      // Pick a random song as daily challenge
      const randomSong = MUSIC_LIBRARY[Math.floor(Math.random() * MUSIC_LIBRARY.length)];
      setDailySong(randomSong);
      localStorage.setItem(`daily_song_${today}`, JSON.stringify(randomSong));
    }

    // Greet the child
    if (childName) {
      setTimeout(() => {
        voiceGuide.speak(`Hello ${childName}! Ready for some musical learning today?`);
      }, 1000);
    }
  }, [childName]);

  useEffect(() => {
    let results = [...MUSIC_LIBRARY];
    
    // Search filter
    if (searchQuery.trim()) {
      results = searchSongs(searchQuery);
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter(song => song.category === selectedCategory);
    }
    
    // Favorites filter
    if (showFavorites) {
      results = results.filter(song => progress.favorites.includes(song.id));
    }
    
    // Sort: favorites first, daily song first, then by title
    results.sort((a, b) => {
      const aDaily = dailySong?.id === a.id ? -1 : 0;
      const bDaily = dailySong?.id === b.id ? -1 : 0;
      if (aDaily !== bDaily) return aDaily - bDaily;
      
      const aFav = progress.favorites.includes(a.id) ? -1 : 1;
      const bFav = progress.favorites.includes(b.id) ? -1 : 1;
      if (aFav !== bFav) return aFav - bFav;
      
      return a.title.localeCompare(b.title);
    });
    
    setFilteredSongs(results);
  }, [searchQuery, selectedCategory, showFavorites, progress.favorites, dailySong]);

  const handleSongClick = (song) => {
    // Announce song selection
    voiceGuide.speak(`Let's play ${song.title}!`);
  };

  const gamificationSummary = childId ? GamificationService.getSummary(childId) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/games"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Games"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              🎵 Music Learning Lab
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Educational songs for children aged 5-8
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <FaMusic className="text-lg" />
          <span>{filteredSongs.length} songs</span>
        </div>
      </div>

      {/* Daily Song Challenge */}
      {dailySong && (
        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-2xl p-4 md:p-6 shadow-soft"
        >
          <div className="flex items-center gap-3 mb-2">
            <FaStar className="text-2xl animate-pulse" />
            <h3 className="font-baloo text-xl font-bold">Song of the Day!</h3>
          </div>
          <p className="mb-3">{dailySong.title} - {dailySong.description}</p>
          <Link
            to={`/music/${dailySong.id}`}
            onClick={() => handleSongClick(dailySong)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-yellow-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            <FaPlay /> Listen Now
          </Link>
        </motion.div>
      )}

      {/* Stats Summary */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <motion.div
          variants={fadeInUp}
          className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft"
        >
          <div className="text-2xl font-bold text-primary">{MUSIC_LIBRARY.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Songs</div>
        </motion.div>
        <motion.div
          variants={fadeInUp}
          className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft"
        >
          <div className="text-2xl font-bold text-pink-500">{progress.favorites.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
        </motion.div>
        <motion.div
          variants={fadeInUp}
          className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft"
        >
          <div className="text-2xl font-bold text-green-500">
            {progress.completed.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
        </motion.div>
        <motion.div
          variants={fadeInUp}
          className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft"
        >
          <div className="text-2xl font-bold text-yellow-500">
            {progress.totalStars}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Stars Earned</div>
        </motion.div>
      </motion.div>

      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search songs"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <FaFilter className="text-gray-400 text-sm self-center" />
        {MUSIC_CATEGORIES.map(cat => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
              selectedCategory === cat.id
                ? 'bg-primary text-white shadow-glow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-pressed={selectedCategory === cat.id}
          >
            {cat.icon} {cat.label}
          </motion.button>
        ))}
      </div>

      {/* Favorites Toggle */}
      <button
        onClick={() => setShowFavorites(!showFavorites)}
        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
          showFavorites
            ? 'bg-pink-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
        }`}
        aria-label={showFavorites ? 'Show all songs' : 'Show favorites'}
      >
        {showFavorites ? <FaHeart /> : <FaRegHeart />}
        <span>Favorites</span>
      </button>

      {/* Songs Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredSongs.map((song, index) => {
          const isFavorite = progress.favorites.includes(song.id);
          const isPlayed = progress.played.includes(song.id);
          const playCount = progress.timesPlayed[song.id] || 0;
          const isDaily = dailySong?.id === song.id;
          
          return (
            <motion.div
              key={song.id}
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
                <div className={`absolute inset-0 bg-gradient-to-br ${MUSIC_CATEGORIES.find(c => c.id === song.category)?.color || 'from-gray-400 to-gray-500'} opacity-80`} />
                <div className="relative z-10 text-5xl">{song.icon}</div>
                
                {/* Daily Song Badge */}
                {isDaily && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold z-20">
                    Song of Day
                  </div>
                )}
                
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(song.id);
                  }}
                  className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm z-20 transition-colors ${
                    isFavorite
                      ? 'text-pink-500 bg-white/20'
                      : 'text-white bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? <FaHeart className="text-sm" /> : <FaRegHeart className="text-sm" />}
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white line-clamp-1">
                  {song.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                  {song.description}
                </p>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaClock />
                    <span>{song.estimatedTime} min</span>
                  </div>
                  <Link
                    to={`/music/${song.id}`}
                    onClick={() => handleSongClick(song)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
                  >
                    <FaPlay className="text-xs" />
                    Listen
                  </Link>
                </div>

                {/* Play count */}
                {playCount > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Played {playCount} {playCount === 1 ? 'time' : 'times'}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Music Games Section */}
      <motion.div
        variants={fadeInUp}
        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-4 md:p-6 shadow-soft"
      >
        <h3 className="font-baloo text-xl font-bold mb-4 flex items-center gap-2">
          <FaGamepad /> Music Games
        </h3>
        <p className="mb-3">Play fun games while learning through music!</p>
        <Link
          to="/music/games"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <FaGamepad /> Play Music Games
        </Link>
      </motion.div>

      {/* Empty State */}
      {filteredSongs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="font-baloo text-2xl text-gray-600 dark:text-gray-300">
            No songs found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MusicLibrary;