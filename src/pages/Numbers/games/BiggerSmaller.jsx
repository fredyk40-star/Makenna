import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const BiggerSmaller = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [questionType, setQuestionType] = useState('bigger'); // 'bigger' or 'smaller'
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
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;
    
    // Ensure numbers are different
    while (a === b) {
      b = Math.floor(Math.random() * max) + 1;
    }
    
    const type = Math.random() > 0.5 ? 'bigger' : 'smaller';
    setNum1(a);
    setNum2(b);
    setQuestionType(type);
    setSelected(null);
    setIsCorrect(null);
    setTotalQuestions(prev => prev + 1);

    const questionText = type === 'bigger' 
      ? `Which number is bigger? ${a} or ${b}` 
      : `Which number is smaller? ${a} or ${b}`;
    speak(questionText, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(questionText);
  }, [game.maxNumber, speak]);

  const handleSelect = (value) => {
    if (isCorrect !== null) return;

    setSelected(value);
    const correct = questionType === 'bigger' 
      ? value === Math.max(num1, num2)
      : value === Math.min(num1, num2);
    
    setIsCorrect(correct);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      speak('Correct! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Perfect!');
      
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

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          📏 Bigger or Smaller
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {questionType === 'bigger' ? 'Choose the bigger number!' : 'Choose the smaller number!'}
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Score: {correctAnswers}/{totalQuestions}
        </div>
      </div>

      <div className="flex justify-center gap-8 p-4">
        <motion.div
          whileHover={{ scale: selected ? 1 : 1.05 }}
          whileTap={{ scale: selected ? 1 : 0.95 }}
          onClick={() => handleSelect(num1)}
          className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-bold transition-all duration-300 cursor-pointer ${
            selected === num1
              ? isCorrect
                ? 'bg-green-500 text-white shadow-glow'
                : 'bg-red-500 text-white'
              : isCorrect !== null && selected !== num1
              ? 'opacity-50'
              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-soft hover:shadow-hover'
          }`}
        >
          {num1}
        </motion.div>
        <div className="flex items-center text-4xl text-gray-400">vs</div>
        <motion.div
          whileHover={{ scale: selected ? 1 : 1.05 }}
          whileTap={{ scale: selected ? 1 : 0.95 }}
          onClick={() => handleSelect(num2)}
          className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-bold transition-all duration-300 cursor-pointer ${
            selected === num2
              ? isCorrect
                ? 'bg-green-500 text-white shadow-glow'
                : 'bg-red-500 text-white'
              : isCorrect !== null && selected !== num2
              ? 'opacity-50'
              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-soft hover:shadow-hover'
          }`}
        >
          {num2}
        </motion.div>
      </div>

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
            {isCorrect ? '🎉 Correct! Great job!' : `🤔 The ${questionType} number was ${questionType === 'bigger' ? Math.max(num1, num2) : Math.min(num1, num2)}`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default BiggerSmaller;