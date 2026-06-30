import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUndo, FaLightbulb, FaCheck, FaTimes } from 'react-icons/fa';
import { useWordBuilder } from '../../hooks/useWordBuilder';
import LetterTile from './LetterTile';
import BlendingPlayer from './BlendingPlayer';

const WordBuilder = ({ 
  word, 
  onComplete = null,
  className = '' 
}) => {
  const {
    progress,
    completed,
    message,
    hint,
    placeLetter,
    getHint,
    reset,
    getAvailableLetters,
    getWordLetters,
    isComplete
  } = useWordBuilder(word);

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [targetPositions, setTargetPositions] = useState([]);

  useEffect(() => {
    if (completed && onComplete) {
      onComplete(word);
    }
  }, [completed, word, onComplete]);

  const handleLetterClick = (letter, index) => {
    if (completed || !letter) return;
    setSelectedLetter({ letter, index });
  };

  const handlePositionClick = (position) => {
    if (!selectedLetter || completed) return;
    
    const result = placeLetter(selectedLetter.index, position);
    if (result) {
      setSelectedLetter(null);
    }
  };

  const handleReset = () => {
    reset();
    setSelectedLetter(null);
  };

  const letters = getWordLetters();
  const availableLetters = getAvailableLetters();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          Build the Word
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={getHint}
            className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
            aria-label="Get hint"
          >
            <FaLightbulb className="text-lg" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Reset"
          >
            <FaUndo className="text-lg" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
        />
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-center mb-4 font-medium ${
              completed ? 'text-green-500' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hint Display */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-center"
          >
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              💡 {hint.message}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Available letters: {hint.availableLetters.join(', ')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Positions */}
      <div className="flex justify-center gap-2 mb-6">
        {letters.map((letter, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePositionClick(index)}
            className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-300 cursor-pointer ${
              selectedLetter && !completed
                ? 'border-primary bg-blue-50 dark:bg-blue-900/20 hover:border-primary-dark'
                : 'border-gray-300 dark:border-gray-600'
            } ${
              completed ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
            }`}
          >
            {completed ? (
              <span className="text-green-500">{letter}</span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">
                {progress > 0 && selectedLetter ? '?' : '_'}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Available Letters */}
      <div className="flex justify-center gap-2 flex-wrap">
        {availableLetters.map((letter, index) => (
          <LetterTile
            key={index}
            letter={letter}
            index={index}
            isSelected={selectedLetter?.index === index}
            onClick={() => handleLetterClick(letter, index)}
            disabled={completed}
          />
        ))}
      </div>

      {/* Completion Status */}
      {completed && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 text-center"
        >
          <div className="text-4xl mb-2">🌟</div>
          <p className="text-green-500 font-bold text-lg">
            Word completed! You built "{word}"!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default WordBuilder;