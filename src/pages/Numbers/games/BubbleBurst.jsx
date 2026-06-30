import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const BubbleBurst = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [bubbles, setBubbles] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctBursts, setCorrectBursts] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [spokenNumber, setSpokenNumber] = useState(0);

  const { speak, isPlaying } = useAudio();
  const speechTimeoutRef = useRef(null);

  useEffect(() => {
    generateRound();
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  const generateRound = useCallback(() => {
    const max = game.maxNumber || 10;
    const target = Math.floor(Math.random() * max) + 1;
    setCurrentNumber(target);
    setSpokenNumber(target);
    setIsRoundComplete(false);
    setTotalQuestions(prev => prev + 1);

    // Generate bubbles with numbers
    const totalBubbles = 8 + Math.floor(Math.random() * 4);
    const numbers = [target];
    while (numbers.length < totalBubbles) {
      let num;
      do {
        num = Math.floor(Math.random() * max) + 1;
      } while (numbers.includes(num) || numbers.length >= totalBubbles);
      numbers.push(num);
    }

    const shuffled = numbers.sort(() => Math.random() - 0.5);
    const newBubbles = shuffled.map((num, i) => ({
      id: i,
      number: num,
      burst: false,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 70,
      delay: Math.random() * 0.3,
      isTarget: num === target,
      size: 50 + Math.random() * 30
    }));
    setBubbles(newBubbles);

    // Speak the number after a delay
    speechTimeoutRef.current = setTimeout(() => {
      speak(`Pop the bubble with number ${target}!`, { rate: 0.6, pitch: 1.1 });
      announceToScreenReader(`Find and pop number ${target}`);
    }, 500);
  }, [game.maxNumber, speak]);

  const handleBurst = (bubbleId) => {
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble || bubble.burst || isRoundComplete) return;

    const isCorrect = bubble.isTarget;
    setBubbles(prev => prev.map(b => 
      b.id === bubbleId ? { ...b, burst: true } : b
    ));

    if (isCorrect) {
      setCorrectBursts(prev => prev + 1);
      setScore(prev => prev + 10);
      speak('Pop! 🎈', { rate: 0.9, pitch: 1.3 });
      announceToScreenReader('Correct!');
      
      const newScore = Math.round((correctBursts + 1) / (totalQuestions + 1) * 100);
      onScoreUpdate(newScore);
      
      const remaining = bubbles.filter(b => !b.burst && b.id !== bubbleId);
      if (!remaining.some(b => b.isTarget)) {
        setIsRoundComplete(true);
        setTimeout(() => {
          if (totalQuestions >= 5) {
            const finalScore = Math.round((correctBursts + 1) / (totalQuestions + 1) * 100);
            const stars = finalScore >= 90 ? 5 : finalScore >= 70 ? 3 : 1;
            onStarsUpdate(stars);
            onComplete({ score: finalScore, stars, correct: correctBursts + 1, incorrect: attempts });
          } else {
            setTimeout(generateRound, 1500);
          }
        }, 1000);
      }
    } else {
      setAttempts(prev => prev + 1);
      speak('Oops! Try another one.', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Wrong bubble, try again');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🫧 Bubble Burst
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isPlaying ? 'Listening...' : `Find and pop number ${currentNumber}!`}
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Score: {score}
        </div>
      </div>

      <div className="relative h-64 bg-gradient-to-b from-blue-200 to-cyan-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden">
        {bubbles.map((bubble) => (
          <motion.button
            key={bubble.id}
            initial={{ scale: 0, y: 50 }}
            animate={{ 
              scale: bubble.burst ? 0 : 1, 
              y: bubble.burst ? -50 : 0,
              opacity: bubble.burst ? 0 : 1
            }}
            transition={{ 
              delay: bubble.delay, 
              type: 'spring', 
              stiffness: 300 
            }}
            whileHover={{ scale: bubble.burst ? 0 : 1.1 }}
            whileTap={{ scale: bubble.burst ? 0 : 0.8 }}
            onClick={() => handleBurst(bubble.id)}
            disabled={bubble.burst || isRoundComplete}
            className={`absolute rounded-full transition-all duration-300 ${
              bubble.burst ? 'pointer-events-none' : 'hover:shadow-glow'
            }`}
            style={{ 
              left: `${bubble.x}%`, 
              top: `${bubble.y}%`,
              width: bubble.size,
              height: bubble.size,
              transform: 'translate(-50%, -50%)',
              background: bubble.isTarget 
                ? 'radial-gradient(circle, rgba(255,200,100,1) 0%, rgba(255,150,50,1) 100%)'
                : 'radial-gradient(circle, rgba(100,200,255,1) 0%, rgba(50,150,255,1) 100%)',
              boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.2), inset 5px 5px 15px rgba(255,255,255,0.3)'
            }}
            aria-label={`Bubble with number ${bubble.number}`}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white drop-shadow">
              {bubble.number}
            </span>
            {/* Shine effect */}
            <div className="absolute top-2 left-3 w-4 h-4 bg-white/30 rounded-full transform rotate-45" />
          </motion.button>
        ))}

        {/* Floating animation helper */}
        <style>{`
          @keyframes floatBubble {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(-8px); }
          }
          .bubble-float {
            animation: floatBubble 3s ease-in-out infinite;
          }
        `}</style>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5 • {isPlaying ? '🎧 Listening...' : '🔊 Listen for the number!'}
      </div>
    </div>
  );
};

export default BubbleBurst;