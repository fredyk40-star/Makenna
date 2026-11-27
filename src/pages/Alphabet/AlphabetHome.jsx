import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaChevronRight, FaFire, FaMedal, FaChartLine, FaPlay } from 'react-icons/fa';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useAlphabetSearch } from '../../hooks/useAlphabetSearch';
import { useChildAccount } from '../../context/ChildAccountContext';
import { GamificationService } from '../../services/GamificationService';

import AlphabetGrid from '../../components/alphabet/AlphabetGrid';
import SearchBar from '../../components/alphabet/SearchBar';
import ProgressBar from '../../components/alphabet/ProgressBar';
import { fadeInUp, staggerContainer } from '../../utils/constants';

const AlphabetHome = () => {
  const { progress, getCompletionPercentage, getSkillCompletionPercentage } = useAlphabetProgress();
  const { childId } = useChildAccount();
  const { query, setQuery, results } = useAlphabetSearch();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredLetters, setFilteredLetters] = useState(ALPHABET_DATA);

  useEffect(() => {
    let letters = ALPHABET_DATA;

    if (selectedCategory !== 'all') {
      letters = letters.filter(letter => letter.category === selectedCategory);
    }

    if (query.trim()) {
      const searchResults = results.length > 0 ? results : [];
      letters = letters.filter(letter =>
        searchResults.some(result => result.id === letter.id)
      );
    }

    setFilteredLetters(letters);
  }, [selectedCategory, query, results]);

  const categories = [
    { id: 'all', label: 'All Letters' },
    { id: 'vowels', label: 'Vowels' },
    { id: 'consonants', label: 'Consonants' },
  ];

  const completionPercentage = getCompletionPercentage();
  const skillPercentage = getSkillCompletionPercentage();
  const gamification = childId ? GamificationService.getSummary(childId) : null;
  const streak = gamification?.currentStreak || 0;
  const badgeCount = gamification?.badges?.length || 0;
  const continueId = progress.lastSkill?.letterId || progress.recentLessons[0];
  const continueLetter = ALPHABET_DATA.find(letter => letter.id === continueId);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-5 md:space-y-8 pb-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-baloo text-3xl md:text-4xl font-bold text-primary dark:text-blue-400">
            Alphabet Adventure
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Learn your ABCs with fun words, sounds and tracing!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ProgressBar percentage={skillPercentage} />
          <Link
            to="/learn"
            className="text-primary dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
          >
            Back to Learn <FaChevronRight className="text-sm" />
          </Link>
        </div>
      </div>

      {/* Streak & Achievement Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-xl">
          <FaFire className="text-orange-500 text-lg shrink-0" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {streak} day{streak === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-xl">
          <FaMedal className="text-yellow-500 text-lg shrink-0" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {badgeCount} badge{badgeCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl">
          <FaChartLine className="text-green-500 text-lg shrink-0" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {skillPercentage}% skills
          </span>
        </div>
        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-xl">
          <span className="text-lg" aria-hidden="true">🔤</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {progress.completed.length}/{ALPHABET_DATA.length} letters
          </span>
        </div>
      </motion.div>

      {/* Continue where the child left off */}
      {continueLetter && (
        <motion.div variants={fadeInUp}>
          <Link
            to={`/alphabet/lesson/${continueLetter.id}`}
            className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-soft hover:shadow-hover transition-shadow"
          >
            <div className="text-4xl font-baloo font-bold" aria-hidden="true">
              {continueLetter.letter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm opacity-90">Continue learning</p>
              <p className="font-baloo text-lg font-bold">Letter {continueLetter.letter}</p>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FaPlay /> Resume
            </span>
          </Link>
        </motion.div>
      )}

      {/* Search Bar */}
      <SearchBar
        query={query}
        setQuery={setQuery}
        placeholder="Search letters or words..."
      />

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="group" aria-label="Letter categories">
        {categories.map(category => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
              selectedCategory === category.id
                ? 'bg-primary text-white shadow-glow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-pressed={selectedCategory === category.id}
            type="button"
          >
            {category.label}
          </motion.button>
        ))}
      </div>

      {/* Results Count */}
      {query.trim() && (
        <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          Found {filteredLetters.length} letter{filteredLetters.length === 1 ? '' : 's'}
        </p>
      )}

      {/* Alphabet Grid */}
      <AnimatePresence mode="wait">
        {filteredLetters.length > 0 ? (
          <AlphabetGrid letters={filteredLetters} />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-baloo text-2xl text-gray-600 dark:text-gray-300">
              No letters found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Try searching for something else!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="sr-only" aria-live="polite">Alphabet progress: {completionPercentage}% complete</p>
    </motion.div>
  );
};

export default AlphabetHome;
