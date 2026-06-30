import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const CountAnimals = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [targetNumber, setTargetNumber] = useState(0);
  const [animals, setAnimals] = useState([]);
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [count, setCount] = useState(0);
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [animalType, setAnimalType] = useState('🐔');

  const { speak } = useAudio();
  const animalEmojis = ['🐔', '🐟', '🐦', '🐐', '🐶', '🐱'];

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = useCallback(() => {
    const max = game.maxNumber || 5;
    const target = Math.floor(Math.random() * max) + 1;
    setTargetNumber(target);
    setCount(0);
    setSelectedAnimals([]);
    setIsCorrect(null);
    setShowResult(false);
    setTotalQuestions(prev => prev + 1);

    const type = animalEmojis[Math.floor(Math.random() * animalEmojis.length)];
    setAnimalType(type);

    const total = target + Math.floor(Math.random() * 3) + 2;
    const newAnimals = Array.from({ length: total }, (_, i) => ({
      id: i,
      selected: false,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 60,
      delay: Math.random() * 0.3,
      type: type
    }));
    setAnimals(newAnimals);

    speak(`Count the ${type} animals!`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(`Count the animals`);
  }, [game.maxNumber, speak]);

  const handleAnimalClick = (animalId) => {
    if (isCorrect !== null || showResult) return;

    setAnimals(prev => prev.map(a => 
      a.id === animalId ? { ...a, selected: !a.selected } : a
    ));

    const isSelected = animals.find(a => a.id === animalId)?.selected;
    if (!isSelected) {
      setSelectedAnimals(prev => [...prev, animalId]);
      setCount(prev => prev + 1);
    } else {
      setSelectedAnimals(prev => prev.filter(id => id !== animalId));
      setCount(prev => prev - 1);
    }
  };

  const handleCheckAnswer = () => {
    if (count === targetNumber) {
      setIsCorrect(true);
      setCorrectAnswers(prev => prev + 1);
      speak('Excellent! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct! Great job!');
      
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
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      speak(`You counted ${count}. Need ${targetNumber}!`, { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not quite, try again');
    }
    setShowResult(true);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🐔 Count the Animals
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tap the {animalType} animals to count. You need {targetNumber}!
        </div>
        <div className="text-2xl font-bold text-primary mt-2">
          {count} / {targetNumber}
        </div>
      </div>

      <div className="relative h-64 bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden">
        {animals.map((animal) => (
          <motion.button
            key={animal.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: animal.delay, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleAnimalClick(animal.id)}
            disabled={isCorrect !== null || showResult}
            className={`absolute text-4xl transition-all duration-300 ${
              animal.selected ? 'opacity-100 scale-110' : 'opacity-90 hover:scale-110'
            }`}
            style={{ left: `${animal.x}%`, top: `${animal.y}%` }}
          >
            {animal.type}
            {animal.selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 text-green-500 text-sm"
              >
                ✅
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => {
            setCount(0);
            setSelectedAnimals([]);
            setAnimals(prev => prev.map(a => ({ ...a, selected: false })));
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleCheckAnswer}
          disabled={count === 0 || isCorrect !== null}
          className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
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
            {isCorrect ? '🎉 Correct! Great counting!' : `🤔 That's not ${targetNumber}. Try again!`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default CountAnimals;