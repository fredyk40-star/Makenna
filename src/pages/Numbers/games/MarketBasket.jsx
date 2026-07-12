import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const MarketBasket = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [targetNumber, setTargetNumber] = useState(0);
  const [fruits, setFruits] = useState([]);
  const [basket, setBasket] = useState([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const { speak } = useAudio();
  const fruitEmojis = ['🥭', '🍌', '🍎', '🍊', '🍇', '🍉', '🍓', '🍑'];

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = useCallback(() => {
    const max = game.maxNumber || 5;
    const target = Math.floor(Math.random() * max) + 1;
    setTargetNumber(target);
    setBasket([]);
    setIsComplete(false);
    setShowResult(false);
    setTotalQuestions(prev => prev + 1);

    const totalFruits = target + Math.floor(Math.random() * 4) + 2;
    const fruitTypes = Math.min(totalFruits, 4);
    const newFruits = [];
    for (let i = 0; i < totalFruits; i++) {
      newFruits.push({
        id: i,
        emoji: fruitEmojis[i % fruitTypes.length],
        type: i % fruitTypes.length,
        inBasket: false,
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 50,
        delay: Math.random() * 0.2
      });
    }
    setFruits(newFruits);

    speak(`Put ${target} fruits in the basket!`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(`Add ${target} fruits to the basket`);
  }, [game.maxNumber, speak]);

  const handleFruitClick = (fruitId) => {
    if (showResult || isComplete) return;

    setFruits(prev => prev.map(f => 
      f.id === fruitId ? { ...f, inBasket: !f.inBasket } : f
    ));

    const fruit = fruits.find(f => f.id === fruitId);
    if (!fruit?.inBasket) {
      setBasket(prev => [...prev, fruitId]);
    } else {
      setBasket(prev => prev.filter(id => id !== fruitId));
    }
  };

  const handleCheckAnswer = () => {
    if (basket.length === targetNumber) {
      setIsComplete(true);
      setCorrectAnswers(prev => prev + 1);
      speak('Perfect! Basket is full! 🧺', { rate: 0.8, pitch: 1.2 });
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
      setAttempts(prev => prev + 1);
      speak(`That's ${basket.length} fruits. Need ${targetNumber}!`, { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Keep adding fruits to the basket');
      setShowResult(true);
      setTimeout(() => setShowResult(false), 1500);
    }
  };

  const getBasketDisplay = () => {
    const basketFruits = fruits.filter(f => f.inBasket);
    return basketFruits.map(f => f.emoji).join('');
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🧺 Market Basket
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Put {targetNumber} fruits in the basket!
        </div>
        <div className="text-2xl font-bold text-primary mt-2">
          {basket.length} / {targetNumber}
        </div>
      </div>

      {/* Basket */}
      <div className="relative h-32 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-blue-300 dark:to-gray-600 rounded-b-2xl" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-4xl">
          🧺
          <span className="ml-2 text-2xl">{getBasketDisplay()}</span>
        </div>
        <div className="absolute top-2 left-2 text-sm text-gray-500 dark:text-gray-400">
          {basket.length} fruits
        </div>
      </div>

      {/* Fruits */}
      <div className="relative h-40 bg-gradient-to-br from-yellow-50 to-green-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden p-4">
        {fruits.map((fruit) => (
          <motion.button
            key={fruit.id}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: fruit.inBasket ? 0.8 : 1, 
              rotate: fruit.inBasket ? 180 : 0,
              opacity: fruit.inBasket ? 0.5 : 1
            }}
            whileHover={{ scale: fruit.inBasket ? 0.8 : 1.15 }}
            whileTap={{ scale: fruit.inBasket ? 0.8 : 0.85 }}
            onClick={() => handleFruitClick(fruit.id)}
            disabled={isComplete || showResult}
            className={`absolute text-3xl transition-all duration-300 ${
              fruit.inBasket ? 'opacity-50' : 'hover:scale-110'
            }`}
            style={{ 
              left: `${fruit.x}%`, 
              top: `${fruit.y}%`,
              transform: `translate(-50%, -50%)`
            }}
            aria-label={fruit.inBasket ? 'In basket' : 'Fruit to add'}
          >
            {fruit.emoji}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => {
            setBasket([]);
            setFruits(prev => prev.map(f => ({ ...f, inBasket: false })));
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleCheckAnswer}
          disabled={basket.length === 0 || isComplete}
          className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answer
        </button>
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          >
            Keep going! You need {targetNumber - basket.length} more fruits!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default MarketBasket;