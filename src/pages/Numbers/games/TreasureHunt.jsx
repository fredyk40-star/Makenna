import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const TreasureHunt = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [hiddenNumbers, setHiddenNumbers] = useState([]);
  const [foundNumbers, setFoundNumbers] = useState([]);
  const [targetNumbers, setTargetNumbers] = useState([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const { speak } = useAudio();

  useEffect(() => {
    generateHunt();
  }, []);

  const generateHunt = useCallback(() => {
    const max = game.maxNumber || 5;
    const numToFind = 4 + Math.floor(Math.random() * 2);
    const numbers = [];
    for (let i = 0; i < numToFind; i++) {
      numbers.push(Math.floor(Math.random() * max) + 1);
    }
    setTargetNumbers(numbers);
    setFoundNumbers([]);
    setIsComplete(false);
    setShowHint(false);
    setTotalQuestions(prev => prev + 1);

    // Create hiding spots (6x6 grid)
    const spots = [];
    const totalSpots = 36;
    const shuffledNumbers = [];
    // Fill with numbers
    for (let i = 0; i < totalSpots; i++) {
      const num = numbers[Math.floor(Math.random() * numbers.length)];
      shuffledNumbers.push(num);
    }
    
    const newSpots = shuffledNumbers.map((num, i) => ({
      id: i,
      number: num,
      found: false,
      isTarget: numbers.includes(num),
      x: (i % 6) * 16.6 + 1,
      y: Math.floor(i / 6) * 16.6 + 1
    }));
    setHiddenNumbers(newSpots);

    speak(`Find the hidden numbers!`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(`Find ${numToFind} hidden numbers`);
  }, [game.maxNumber, speak]);

  const handleReveal = (spotId) => {
    if (isComplete) return;

    const spot = hiddenNumbers.find(s => s.id === spotId);
    if (!spot || spot.found) return;

    setHiddenNumbers(prev => prev.map(s => 
      s.id === spotId ? { ...s, found: true } : s
    ));

    if (spot.isTarget && !foundNumbers.includes(spot.number)) {
      setFoundNumbers(prev => [...prev, spot.number]);
      setScore(prev => prev + 10);
      speak(`Found number ${spot.number}! 🎉`, { rate: 0.8, pitch: 1.2 });
      announceToScreenReader(`Found number ${spot.number}`);
      
      const newScore = Math.round((foundNumbers.length + 1) / targetNumbers.length * 100);
      onScoreUpdate(newScore);

      // Check if all found
      if (foundNumbers.length + 1 >= targetNumbers.length) {
        setIsComplete(true);
        setTimeout(() => {
          const finalScore = 100;
          const stars = 5;
          onStarsUpdate(stars);
          onComplete({ score: finalScore, stars, correct: foundNumbers.length + 1, incorrect: attempts });
        }, 1000);
      }
    } else {
      setAttempts(prev => prev + 1);
      speak('Keep looking!', { rate: 0.7, pitch: 1.0 });
    }
  };

  const handleHint = () => {
    setShowHint(true);
    const remaining = targetNumbers.filter(n => !foundNumbers.includes(n));
    if (remaining.length > 0) {
      speak(`Look for number ${remaining[0]}`, { rate: 0.7, pitch: 1.0 });
      announceToScreenReader(`Look for number ${remaining[0]}`);
    }
    setTimeout(() => setShowHint(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🗺️ Number Treasure Hunt
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find all the hidden numbers!
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Found: {foundNumbers.length} / {targetNumbers.length}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
        {hiddenNumbers.map((spot) => (
          <motion.button
            key={spot.id}
            whileHover={{ scale: spot.found ? 1 : 1.05 }}
            whileTap={{ scale: spot.found ? 1 : 0.95 }}
            onClick={() => handleReveal(spot.id)}
            disabled={spot.found || isComplete}
            className={`aspect-square rounded-xl transition-all duration-300 ${
              spot.found
                ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400'
                : 'bg-gradient-to-br from-yellow-400 to-yellow-600 hover:shadow-hover'
            }`}
            aria-label={spot.found ? `Found ${spot.number}` : 'Hidden treasure'}
          >
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
              {spot.found ? spot.number : '❓'}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={handleHint}
          disabled={isComplete || foundNumbers.length >= targetNumbers.length}
          className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
        >
          💡 Hint
        </button>
        <button
          onClick={generateHunt}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          New Hunt
        </button>
      </div>

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
          >
            💡 Keep searching! There are {targetNumbers.length - foundNumbers.length} more numbers to find!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Found {foundNumbers.length} of {targetNumbers.length} numbers
      </div>
    </div>
  );
};

export default TreasureHunt;