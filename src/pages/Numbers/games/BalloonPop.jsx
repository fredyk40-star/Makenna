import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const BalloonPop = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [targetNumber, setTargetNumber] = useState(0);
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isRoundComplete, setIsRoundComplete] = useState(false);

  const { speak } = useAudio();

  useEffect(() => {
    generateRound();
  }, []);

  const generateRound = useCallback(() => {
    const max = game.maxNumber || 5;
    const target = Math.floor(Math.random() * max) + 1;
    setTargetNumber(target);
    setIsRoundComplete(false);
    setTotalQuestions(prev => prev + 1);

    // Generate balloons with numbers
    const totalBalloons = 6 + Math.floor(Math.random() * 4);
    const numbers = [target];
    while (numbers.length < totalBalloons) {
      let num;
      do {
        num = Math.floor(Math.random() * max) + 1;
      } while (numbers.includes(num) || numbers.length >= totalBalloons);
      numbers.push(num);
    }

    // Shuffle balloons
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    const newBalloons = shuffled.map((num, i) => ({
      id: i,
      number: num,
      popped: false,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 70,
      delay: Math.random() * 0.3,
      isTarget: num === target
    }));
    setBalloons(newBalloons);

    speak(`Pop the balloon with number ${target}`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(`Find and pop number ${target}`);
  }, [game.maxNumber, speak]);

  const handlePop = (balloonId) => {
    const balloon = balloons.find(b => b.id === balloonId);
    if (!balloon || balloon.popped || isRoundComplete) return;

    const isCorrect = balloon.isTarget;
    setBalloons(prev => prev.map(b => 
      b.id === balloonId ? { ...b, popped: true } : b
    ));

    if (isCorrect) {
      setCorrectHits(prev => prev + 1);
      setScore(prev => prev + 10);
      speak('Pop! 🎈', { rate: 0.9, pitch: 1.3 });
      announceToScreenReader('Correct!');
      
      // Check if round is complete
      const remaining = balloons.filter(b => !b.popped && b.id !== balloonId);
      if (!remaining.some(b => b.isTarget)) {
        setIsRoundComplete(true);
        const newScore = Math.round((correctHits + 1) / (totalQuestions + 1) * 100);
        onScoreUpdate(newScore);
        
        setTimeout(() => {
          if (totalQuestions >= 5) {
            const finalScore = Math.round((correctHits + 1) / (totalQuestions + 1) * 100);
            const stars = finalScore >= 90 ? 5 : finalScore >= 70 ? 3 : 1;
            onStarsUpdate(stars);
            onComplete({ score: finalScore, stars, correct: correctHits + 1, incorrect: attempts });
          } else {
            setTimeout(generateRound, 1500);
          }
        }, 1000);
      }
    } else {
      setAttempts(prev => prev + 1);
      speak('Oops! Try another one.', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Wrong balloon, try again');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🎈 Balloon Pop
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pop the balloon with number {targetNumber}
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Score: {score}
        </div>
      </div>

      {/* Balloon Field */}
      <div className="relative h-64 bg-gradient-to-b from-blue-200 to-cyan-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden">
        {balloons.map((balloon) => (
          <motion.button
            key={balloon.id}
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: balloon.delay, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => handlePop(balloon.id)}
            disabled={balloon.popped || isRoundComplete}
            className={`absolute text-4xl transition-all duration-300 ${
              balloon.popped ? 'opacity-0 scale-150' : 'hover:scale-110'
            }`}
            style={{ left: `${balloon.x}%`, top: `${balloon.y}%` }}
            aria-label={`Balloon with number ${balloon.number}`}
          >
            🎈
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
              {balloon.number}
            </span>
          </motion.button>
        ))}

        {/* Floating animation helper */}
        <style>{`
          @keyframes floatBalloon {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .balloon-float {
            animation: floatBalloon 3s ease-in-out infinite;
          }
        `}</style>
      </div>

      {/* Progress */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default BalloonPop;