import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const NumberFishing = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [targetNumber, setTargetNumber] = useState(0);
  const [fish, setFish] = useState([]);
  const [caughtFish, setCaughtFish] = useState([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCatches, setCorrectCatches] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [bobberPosition, setBobberPosition] = useState({ x: 50, y: 20 });

  const { speak } = useAudio();

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  const generateRound = useCallback(() => {
    const max = game.maxNumber || 5;
    const target = Math.floor(Math.random() * max) + 1;
    setTargetNumber(target);
    setIsRoundComplete(false);
    setTotalQuestions(prev => prev + 1);

    const totalFish = Math.min(6 + Math.floor(Math.random() * 4), max);
    const available = Array.from({ length: max }, (_, i) => i + 1).filter(n => n !== target);
    const extraNumbers = available.sort(() => Math.random() - 0.5).slice(0, totalFish - 1);
    const numbers = [target, ...extraNumbers].sort(() => Math.random() - 0.5);
    const newFish = numbers.map((num, i) => ({
      id: i,
      number: num,
      caught: false,
      x: 5 + Math.random() * 90,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 0.3,
      isTarget: num === target,
      wobble: Math.random() * 10
    }));
    setFish(newFish);
    setCaughtFish([]);
    setBobberPosition({ x: 50, y: 20 });

    speak(`Catch the fish with number ${target}!`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(`Find and catch number ${target}`);
  }, [game.maxNumber, speak]);

  const handleCatch = (fishId) => {
    const fishItem = fish.find(f => f.id === fishId);
    if (!fishItem || fishItem.caught || isRoundComplete) return;

    const isCorrect = fishItem.isTarget;
    setFish(prev => prev.map(f => 
      f.id === fishId ? { ...f, caught: true } : f
    ));

    if (isCorrect) {
      setCorrectCatches(prev => prev + 1);
      setScore(prev => prev + 10);
      setCaughtFish(prev => [...prev, fishItem]);
      speak('Splash! Got it! 🎣', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct catch!');
      
      const newScore = Math.round((correctCatches + 1) / (totalQuestions + 1) * 100);
      onScoreUpdate(newScore);
      
      // Animate bobber
      setBobberPosition({ x: fishItem.x, y: fishItem.y });
      setTimeout(() => setBobberPosition({ x: 50, y: 20 }), 500);

      const remaining = fish.filter(f => !f.caught && f.id !== fishId);
      if (!remaining.some(f => f.isTarget)) {
        setIsRoundComplete(true);
        setTimeout(() => {
          if (totalQuestions >= 5) {
            const finalScore = Math.round((correctCatches + 1) / (totalQuestions + 1) * 100);
            const stars = finalScore >= 90 ? 5 : finalScore >= 70 ? 3 : 1;
            onStarsUpdate(stars);
            onComplete({ score: finalScore, stars, correct: correctCatches + 1, incorrect: attempts });
          } else {
            setTimeout(generateRound, 1500);
          }
        }, 1000);
      }
    } else {
      setAttempts(prev => prev + 1);
      speak('Oops! That fish has number ' + fishItem.number, { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Wrong fish, try again');
      
      setTimeout(() => {
        setFish(prev => prev.map(f => 
          f.id === fishId ? { ...f, caught: false } : f
        ));
      }, 800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🎣 Number Fishing
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Catch the fish with number {targetNumber}
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Score: {score}
        </div>
      </div>

      <div className="relative h-64 bg-gradient-to-b from-blue-200 to-blue-400 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden">
        {/* Water waves */}
        <svg className="absolute bottom-0 w-full h-12" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,10 Q25,0 50,10 Q75,20 100,10 L100,20 L0,20 Z" fill="rgba(255,255,255,0.2)" />
          <path d="M0,15 Q25,5 50,15 Q75,25 100,15 L100,20 L0,20 Z" fill="rgba(255,255,255,0.1)" />
        </svg>

        {/* Bobber */}
        <motion.div
          animate={bobberPosition}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="absolute text-3xl"
          style={{ 
            left: `${bobberPosition.x}%`, 
            top: `${bobberPosition.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          🎣
        </motion.div>

        {fish.map((fishItem) => (
          <motion.button
            key={fishItem.id}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ 
              scale: fishItem.caught ? 0 : 1, 
              rotate: fishItem.caught ? 90 : 0,
              x: fishItem.x + '%',
              y: fishItem.y + '%'
            }}
            whileHover={{ scale: fishItem.caught ? 1 : 1.15 }}
            whileTap={{ scale: fishItem.caught ? 1 : 0.85 }}
            onClick={() => handleCatch(fishItem.id)}
            disabled={fishItem.caught || isRoundComplete}
            className={`absolute text-4xl transition-all duration-300 ${
              fishItem.caught ? 'opacity-0' : 'hover:scale-110'
            }`}
            style={{ 
              transform: `translate(-50%, -50%)`,
              left: `${fishItem.x}%`,
              top: `${fishItem.y}%`
            }}
          >
            {fishItem.isTarget ? '🐠' : '🐟'}
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-white drop-shadow">
              {fishItem.number}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5 • Fish caught: {caughtFish.length}
      </div>
    </div>
  );
};

export default NumberFishing;