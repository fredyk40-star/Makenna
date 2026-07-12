import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const MemoryCards = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const { speak } = useAudio();

  useEffect(() => {
    generateCards();
  }, []);

  const generateCards = useCallback(() => {
    const max = game.maxNumber || 8;
    const numPairs = 4 + Math.floor(Math.random() * 3);
    const numbers = [];
    for (let i = 0; i < numPairs; i++) {
      numbers.push(Math.floor(Math.random() * max) + 1);
    }

    const newCards = [];
    numbers.forEach((num, index) => {
      const emojis = ['⭐', '🍎', '🐱', '🚗', '🌈', '🎈', '🍕', '🐶', '🌸', '⭐'];
      const emoji = emojis[index % emojis.length];
      newCards.push({
        id: `num-${index}`,
        type: 'number',
        value: num,
        display: num.toString(),
        pairId: index,
        matched: false,
        flipped: false
      });
      newCards.push({
        id: `emoji-${index}`,
        type: 'emoji',
        value: num,
        display: emoji.repeat(num > 5 ? 3 : num),
        pairId: index,
        matched: false,
        flipped: false
      });
    });

    const shuffled = newCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setTotalPairs(numPairs);
    setSelectedCards([]);
    setMatchedPairs([]);
    setCorrectMatches(0);
    setIsLocked(false);

    speak(`Find the matching pairs!`, { rate: 0.7, pitch: 1.1 });
  }, [game.maxNumber, speak]);

  const handleCardClick = (cardId) => {
    if (isLocked) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.matched || card.flipped || selectedCards.includes(cardId)) return;

    // Flip the card
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, flipped: true } : c
    ));

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsLocked(true);
      const card1 = cards.find(c => c.id === newSelected[0]);
      const card2 = cards.find(c => c.id === newSelected[1]);

      if (card1.pairId === card2.pairId && card1.id !== card2.id) {
        // Match found
        setCards(prev => prev.map(c => 
          c.pairId === card1.pairId ? { ...c, matched: true } : c
        ));
        setMatchedPairs(prev => [...prev, card1.pairId]);
        setCorrectMatches(prev => prev + 1);
        setAttempts(prev => prev + 1);
        speak('Match! 🎉', { rate: 0.8, pitch: 1.2 });
        announceToScreenReader('Correct match!');

        const newScore = Math.round((correctMatches + 1) / totalPairs * 100);
        onScoreUpdate(newScore);

        setSelectedCards([]);
        setIsLocked(false);

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
        announceToScreenReader('Not a match');

        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === card1.id || c.id === card2.id ? { ...c, flipped: false } : c
          ));
          setSelectedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🃏 Memory Cards
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find the matching pairs!
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Matched: {correctMatches} / {totalPairs}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
            whileTap={{ scale: card.flipped || card.matched ? 1 : 0.95 }}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched || card.flipped}
            className={`aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center text-center p-2 ${
              card.matched
                ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400'
                : card.flipped
                ? 'bg-white dark:bg-gray-700 shadow-soft'
                : 'bg-gradient-to-br from-blue-400 to-purple-400 shadow-soft hover:shadow-hover'
            }`}
          >
            {card.flipped || card.matched ? (
              <div className={`text-2xl font-bold ${
                card.matched ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-white'
              }`}>
                {card.display}
              </div>
            ) : (
              <div className="text-3xl">❓</div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {totalPairs > 0 ? `${correctMatches} of ${totalPairs} pairs found` : 'Loading...'}
      </div>
    </div>
  );
};

export default MemoryCards;