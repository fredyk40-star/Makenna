import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaTrophy, FaRocket, FaGift } from 'react-icons/fa';
import { useMastery } from '../../hooks/useMastery';

const CelebrationScreen = ({ 
  onContinue = null,
  className = '' 
}) => {
  const { isAllLettersMastered, progressSummary } = useMastery();
  const [particles, setParticles] = useState([]);
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    // Generate celebration particles
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#34D399', '#FB923C'];
    const emojis = ['🌟', '⭐', '🎉', '🎊', '✨', '🌈', '🎈', '🎆'];
    const newParticles = [];
    
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 20 + Math.random() * 40,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 3,
        rotation: Math.random() * 360
      });
    }
    setParticles(newParticles);
  }, []);

  const handleContinue = () => {
    setShowCelebration(false);
    if (onContinue) onContinue();
  };

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="max-w-2xl w-full mx-4 bg-white dark:bg-gray-800 rounded-3xl shadow-soft overflow-hidden"
          >
            {/* Particles overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{
                    x: '50%',
                    y: '50%',
                    opacity: 0,
                    scale: 0,
                    rotate: 0
                  }}
                  animate={{
                    x: `${particle.x}%`,
                    y: `${particle.y}%`,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: particle.rotation
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    ease: 'easeOut'
                  }}
                  className="absolute text-3xl"
                  style={{ 
                    color: particle.color,
                    fontSize: particle.size
                  }}
                >
                  {particle.emoji}
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative p-8 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>

              <h2 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                Congratulations, Makenna!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">
                You completed the Alphabet Adventure! 🎊
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm mx-auto">
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-3">
                  <div className="text-3xl">⭐</div>
                  <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    {progressSummary?.mastered || 0} Letters Mastered
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3">
                  <div className="text-3xl">🏆</div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    Reading Ready!
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContinue}
                className="mt-6 btn-primary flex items-center gap-2 mx-auto"
              >
                <FaRocket />
                Continue to Next Adventure
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationScreen;