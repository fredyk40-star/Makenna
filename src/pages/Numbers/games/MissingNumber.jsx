import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const MissingNumber = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [sequence, setSequence] = useState([]);
  const [missingIndex, setMissingIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const { speak } = useAudio();

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = useCallback(() => {
    const max = game.maxNumber || 10;
    const length = 4 + Math.floor(Math.random() * 2);
    const start = Math.floor(Math.random() * (max - length)) + 1;
    
    const seq = [];
    for (let i = 0; i < length; i++) {
      seq.push(start + i);
    }
    
    const missingIdx = Math.floor(Math.random() * length);
    const missingValue = seq[missingIdx];
    
    setSequence(seq);
    setMissingIndex(missingIdx);
    setSelected(null);
    setIsCorrect(null);
    setTotalQuestions(prev => prev + 1);

    // Generate options
    const opts = new Set();
    opts.add(missingValue);
    while (opts.size < 4) {
      const val = Math.floor(Math.random() * max) + 1;
      if (val !== missingValue && !seq.includes(val)) {
        opts.add(val);
      }
    }
    const shuffledOpts = Array.from(opts).sort(() => Math.random() - 0.5);
    setOptions(shuffledOpts);

    speak(`What number is missing?`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader('Find the missing number');
  }, [game.maxNumber, speak]);

  const handleOptionClick = (value) => {
    if (isCorrect !== null) return;
    
    const correct = value === sequence[missingIndex];
    setSelected(value);
    setIsCorrect(correct);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      speak('Perfect! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct!');
      
      const newScore = Math.round((correctAnswers + 1) / (totalQuestions + 1) * 100);
      onScoreUpdate(newScore);
      
      setTimeout(() => {
        if (totalQuestions >= 5) {
          const finalScore = Math.round((correctAnswers + 1) / (totalQuestions + 1) * 100);
          const stars = finalScore >= 90 ? 5 : finalScore >= 70 ? 3 : 1;
          onStarsUpdate(stars);
          onComplete({ score: finalScore, stars, correct: correctAnswers + 1, incorrect: attempts });
        } else {
          setTimeout(generateQuestion, 1500);
        }
      }, 1000);
    } else {
      setAttempts(prev => prev + 1);
      speak('Try again!', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not quite, try again');
      
      setTimeout(() => {
        setIsCorrect(null);
        setSelected(null);
      }, 800);
    }
  };

  const displaySequence = () => {
    return sequence.map((num, idx) => (
      <div
        key={idx}
        className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
          idx === missingIndex
            ? selected
              ? isCorrect
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-soft'
        }`}
      >
        {idx === missingIndex ? (selected ? sequence[missingIndex] : '?') : num}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🚂 Missing Number
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Fill in the missing number in the sequence!
        </div>
      </div>

      {/* Sequence Display */}
      <div className="flex justify-center gap-3">
        {displaySequence()}
      </div>

      {/* Options */}
      <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto">
        {options.map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: isCorrect !== null ? 1 : 1.1 }}
            whileTap={{ scale: isCorrect !== null ? 1 : 0.95 }}
            onClick={() => handleOptionClick(num)}
            disabled={isCorrect !== null}
            className={`w-14 h-14 rounded-xl text-2xl font-bold transition-all duration-300 ${
              selected === num
                ? isCorrect
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-soft hover:shadow-hover'
            } ${isCorrect !== null && selected !== num ? 'opacity-50' : ''}`}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-center p-3 rounded-xl ${
              isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {isCorrect ? '🎉 Correct! Great job!' : `🤔 The missing number was ${sequence[missingIndex]}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default MissingNumber;