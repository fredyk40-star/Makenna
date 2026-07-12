import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const NumberMatch = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [pairs, setPairs] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [score, setScore] = useState(0);

  const { speak } = useAudio();

  useEffect(() => {
    generatePairs();
  }, []);

  const generatePairs = useCallback(() => {
    const max = game.maxNumber || 5;
    const numPairs = 4 + Math.floor(Math.random() * 3);
    const numbers = [];
    for (let i = 1; i <= numPairs; i++) {
      numbers.push(Math.floor(Math.random() * max) + 1);
    }
    
    // Create pairs: one numeral, one emoji count
    const newPairs = [];
    numbers.forEach((num, index) => {
      const emojis = ['⭐', '🔵', '🟢', '🔴', '🟡', '🟣', '🟠', '🔶', '🔷', '💎'];
      const emoji = emojis[index % emojis.length];
      newPairs.push({
        id: `num-${index}`,
        type: 'number',
        value: num,
        display: num.toString(),
        pairId: index,
        matched: false
      });
      newPairs.push({
        id: `emoji-${index}`,
        type: 'emoji',
        value: num,
        display: emoji.repeat(num),
        pairId: index,
        matched: false
      });
    });

    // Shuffle
    const shuffled = newPairs.sort(() => Math.random() - 0.5);
    setPairs(shuffled);
    setTotalPairs(numPairs);
    setSelectedPair(null);
    setMatchedPairs([]);
    setCorrectMatches(0);
    setScore(0);

    speak(`Match the numbers to the groups!`, { rate: 0.7, pitch: 1.1 });
  }, [game.maxNumber, speak]);

  const handleCardClick = (pairId) => {
    const pair = pairs.find(p => p.id === pairId);
    if (!pair || pair.matched) return;

    if (!selectedPair) {
      setSelectedPair(pair);
      return;
    }

    // Check match
    if (selectedPair.pairId === pair.pairId && selectedPair.id !== pair.id) {
      // Match found!
      setPairs(prev => prev.map(p => 
        p.pairId === pair.pairId ? { ...p, matched: true } : p
      ));
      setMatchedPairs(prev => [...prev, pair.pairId]);
      setCorrectMatches(prev => prev + 1);
      setScore(prev => prev + 10);
      speak('Match! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct match!');

      const newScore = Math.round((correctMatches + 1) / totalPairs * 100);
      onScoreUpdate(newScore);

      // Check if all matched
      if (matchedPairs.length + 1 >= totalPairs) {
        setTimeout(() => {
          const finalScore = 100;
          const stars = 5;
          onStarsUpdate(stars);
          onComplete({ score: finalScore, stars, correct: correctMatches + 1, incorrect: attempts });
        }, 1000);
      }
    } else {
      // No match
      setAttempts(prev => prev + 1);
      speak('Try again!', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not a match, try again');
      
      // Reset selection after delay
      setTimeout(() => {
        setSelectedPair(null);
      }, 500);
      return;
    }

    setSelectedPair(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🔢 Number Match
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Match each number to its group!
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Matched: {correctMatches} / {totalPairs}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
        {pairs.map((pair) => (
          <motion.button
            key={pair.id}
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            whileHover={{ scale: pair.matched ? 1 : 1.05 }}
            whileTap={{ scale: pair.matched ? 1 : 0.95 }}
            onClick={() => handleCardClick(pair.id)}
            disabled={pair.matched || (selectedPair && selectedPair.id === pair.id)}
            className={`aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center text-center p-2 ${
              pair.matched
                ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400'
                : selectedPair && selectedPair.id === pair.id
                ? 'bg-primary text-white shadow-glow'
                : 'bg-white dark:bg-gray-700 shadow-soft hover:shadow-hover'
            }`}
            aria-label={`${pair.type === 'number' ? 'Number' : 'Group'} ${pair.value}`}
          >
            <div className={`text-2xl font-bold ${
              pair.matched ? 'text-green-600 dark:text-green-400' :
              selectedPair && selectedPair.id === pair.id ? 'text-white' : 'text-gray-800 dark:text-white'
            }`}>
              {pair.display}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {totalPairs > 0 ? `${correctMatches} of ${totalPairs} matched` : 'Loading...'}
      </div>
    </div>
  );
};

export default NumberMatch;