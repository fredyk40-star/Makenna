import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const NumberPuzzle = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [numbers, setNumbers] = useState([]);
  const [targetOrder, setTargetOrder] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const { speak } = useAudio();

  useEffect(() => {
    generatePuzzle();
  }, []);

  const generatePuzzle = useCallback(() => {
    const max = game.maxNumber || 5;
    const count = 4 + Math.floor(Math.random() * 2);
    const start = Math.floor(Math.random() * (max - count)) + 1;
    
    const order = [];
    for (let i = 0; i < count; i++) {
      order.push(start + i);
    }
    
    const shuffled = [...order].sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
    setTargetOrder(order);
    setSelectedIndex(null);
    setIsComplete(false);
    setTotalQuestions(prev => prev + 1);

    speak(`Put the numbers in order from smallest to largest!`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader('Arrange the numbers in order');
  }, [game.maxNumber, speak]);

  const handleNumberClick = (index) => {
    if (isComplete) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      // Swap numbers
      const newNumbers = [...numbers];
      [newNumbers[selectedIndex], newNumbers[index]] = [newNumbers[index], newNumbers[selectedIndex]];
      setNumbers(newNumbers);
      setSelectedIndex(null);
      setAttempts(prev => prev + 1);

      // Check if solved
      if (newNumbers.every((num, i) => num === targetOrder[i])) {
        setIsComplete(true);
        setCorrectAnswers(prev => prev + 1);
        speak('Puzzle solved! 🧩', { rate: 0.8, pitch: 1.2 });
        announceToScreenReader('Perfect order!');
        
        const newScore = Math.round((correctAnswers + 1) / (totalQuestions + 1) * 100);
        onScoreUpdate(newScore);
        
        setTimeout(() => {
          if (totalQuestions >= 5) {
            const finalScore = Math.round((correctAnswers + 1) / (totalQuestions + 1) * 100);
            const stars = finalScore >= 90 ? 5 : finalScore >= 70 ? 3 : 1;
            onStarsUpdate(stars);
            onComplete({ score: finalScore, stars, correct: correctAnswers + 1, incorrect: attempts });
          } else {
            setTimeout(generatePuzzle, 1500);
          }
        }, 1000);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🧩 Number Puzzle
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tap two numbers to swap them. Put them in order!
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Moves: {attempts}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto">
        {numbers.map((num, index) => (
          <motion.button
            key={index}
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ 
              scale: 1, 
              rotateY: 0,
              y: selectedIndex === index ? -10 : 0
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberClick(index)}
            disabled={isComplete}
            className={`w-16 h-16 rounded-2xl text-2xl font-bold transition-all duration-300 ${
              selectedIndex === index
                ? 'bg-primary text-white shadow-glow'
                : isComplete
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-soft hover:shadow-hover'
            }`}
          >
            {num}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={generatePuzzle}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          New Puzzle
        </button>
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          >
            🎉 Perfect! The numbers are in order!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Puzzle {totalQuestions} of 5
      </div>
    </div>
  );
};

export default NumberPuzzle;