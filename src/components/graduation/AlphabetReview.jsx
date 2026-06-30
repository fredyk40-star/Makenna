import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaCheck, FaTimes, FaPencilAlt, FaBook, FaGamepad } from 'react-icons/fa';
import { useMastery } from '../../hooks/useMastery';

const AlphabetReview = ({ className = '' }) => {
  const { letterData, getLetterMasteryLevel, getOverallProgress } = useMastery();
  const [selectedLetter, setSelectedLetter] = useState(null);

  const getStatusIcon = (level) => {
    switch (level) {
      case 'Master': return '🌟';
      case 'Diamond': return '💎';
      case 'Gold': return '🥇';
      case 'Silver': return '🥈';
      case 'Bronze': return '🥉';
      default: return '📚';
    }
  };

  const getStatusColor = (level) => {
    switch (level) {
      case 'Master': return 'text-purple-500';
      case 'Diamond': return 'text-blue-500';
      case 'Gold': return 'text-yellow-500';
      case 'Silver': return 'text-gray-400';
      case 'Bronze': return 'text-orange-500';
      default: return 'text-gray-300';
    }
  };

  const sortedLetters = Object.entries(letterData)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          Alphabet Review
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Progress: {getOverallProgress()}%
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {sortedLetters.map(([id, data]) => {
          const level = getLetterMasteryLevel(id);
          const statusIcon = getStatusIcon(level);
          const statusColor = getStatusColor(level);
          
          return (
            <motion.button
              key={id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLetter(id)}
              className={`p-3 rounded-xl text-center transition-all duration-300 ${
                selectedLetter === id
                  ? 'ring-2 ring-primary shadow-glow'
                  : 'hover:shadow-soft'
              } bg-gray-50 dark:bg-gray-700/50`}
            >
              <div className={`text-2xl font-bold ${statusColor}`}>
                {data.letter}
              </div>
              <div className="text-2xl mt-1">{statusIcon}</div>
              <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {data.mastery}%
              </div>
            </motion.button>
          );
        })}
      </div>

      {selectedLetter && letterData[selectedLetter] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white">
                Letter {letterData[selectedLetter].letter}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Mastery: {letterData[selectedLetter].mastery}%
              </p>
            </div>
            <div className="text-3xl">
              {getStatusIcon(getLetterMasteryLevel(selectedLetter))}
            </div>
          </div>
          <div className="mt-2 flex gap-3 text-xs">
            <span className="flex items-center gap-1 text-green-500">
              <FaCheck /> Progress
            </span>
            <span className="flex items-center gap-1 text-blue-500">
              <FaPencilAlt /> Tracing
            </span>
            <span className="flex items-center gap-1 text-purple-500">
              <FaGamepad /> Games
            </span>
            <span className="flex items-center gap-1 text-orange-500">
              <FaBook /> Reading
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AlphabetReview;