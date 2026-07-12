import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import SightWordCard from '../../components/reading/SightWordCard';
import readingEngine from '../../services/ReadingEngine';
import gameProgressService from '../../services/GameProgressService';

const SightWordsPage = () => {
  const [sightWords, setSightWords] = useState([]);
  const [completedWords, setCompletedWords] = useState([]);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const words = readingEngine.getSightWords(level);
    setSightWords(words);
  }, [level]);

  const handleWordComplete = (word) => {
    if (!completedWords.includes(word)) {
      const newCompleted = [...completedWords, word];
      setCompletedWords(newCompleted);
      
      // Check if all words are completed
      if (newCompleted.length === sightWords.length) {
        // Advance to next level
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setCompletedWords([]);
        
        // Record achievement
        gameProgressService.recordProgress('sight_words', {
          score: 100,
          stars: 3,
          completed: true,
          gameId: 'sight_words'
        });
      }
    }
  };

  const levels = [1, 2, 3];

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
            to="/learn"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to Learn"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <div>
            <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              Sight Words 👀
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Learn common words by sight
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Level {level}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            • {completedWords.length}/{sightWords.length}
          </span>
        </div>
      </div>

      {/* Level Selector */}
      <div className="flex gap-2">
        {levels.map((l) => (
          <button
            key={l}
            onClick={() => {
              setLevel(l);
              setCompletedWords([]);
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              level === l
                ? 'bg-primary text-white shadow-glow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Level {l}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(completedWords.length / sightWords.length) * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
        />
      </div>

      {/* Sight Words Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sightWords.map((word, index) => (
          <SightWordCard
            key={index}
            word={word.word}
            category={word.category}
            frequency={word.frequency}
            onComplete={handleWordComplete}
          />
        ))}
      </div>

      {/* Completion */}
      {completedWords.length === sightWords.length && sightWords.length > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-2xl"
        >
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="font-baloo text-2xl font-bold text-green-700 dark:text-green-300">
            Level Complete!
          </h3>
          <p className="text-green-600 dark:text-green-400 mt-2">
            You've mastered all the sight words in Level {level}!
          </p>
          {level < levels.length && (
            <button
              onClick={() => {
                setLevel(level + 1);
                setCompletedWords([]);
              }}
              className="mt-4 btn-primary"
            >
              Next Level
            </button>
          )}
        </motion.div>
      )}

      {/* Fun Fact */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl text-center">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          💡 Sight words are words we read instantly without sounding them out!
        </p>
      </div>
    </motion.div>
  );
};

export default SightWordsPage;