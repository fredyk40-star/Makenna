import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CelebrationOverlay = ({ letter, onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate particles for celebration
    const newParticles = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#34D399', '#FB923C'];
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 15,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2,
        rotation: Math.random() * 360,
        shape: ['circle', 'star', 'square', 'triangle'][Math.floor(Math.random() * 4)]
      });
    }
    setParticles(newParticles);

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      {/* Confetti particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${50 + (Math.random() - 0.5) * 20}%`,
            y: '50%',
            scale: 0,
            rotate: 0,
            opacity: 0
          }}
          animate={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            scale: 1,
            rotate: particle.rotation,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeOut'
          }}
          className="absolute"
          style={{
            color: particle.color,
            fontSize: particle.size,
            width: particle.size,
            height: particle.size
          }}
        >
          {particle.shape === 'star' && '⭐'}
          {particle.shape === 'circle' && '●'}
          {particle.shape === 'square' && '■'}
          {particle.shape === 'triangle' && '▲'}
        </motion.div>
      ))}

      {/* Main celebration message */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', damping: 12 }}
        className="relative z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl p-8 text-center shadow-soft border border-white/20 pointer-events-auto"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatDelay: 0.5
          }}
          className="text-6xl mb-3"
        >
          🎉
        </motion.div>
        <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
          Wonderful job!
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          You traced the letter {letter} perfectly!
        </p>
        <div className="flex justify-center gap-1 mt-3">
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-2xl"
            >
              ⭐
            </motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CelebrationOverlay;