import React from 'react';
import { motion } from 'framer-motion';

const FloatingElements = () => {
  const elements = [
    { icon: '☁️', left: '10%', top: '10%', delay: 0, duration: 4 },
    { icon: '☁️', left: '60%', top: '5%', delay: 1.5, duration: 5 },
    { icon: '⭐', left: '85%', top: '15%', delay: 0.5, duration: 3 },
    { icon: '⭐', left: '5%', top: '60%', delay: 1, duration: 3.5 },
    { icon: '🌈', left: '30%', top: '70%', delay: 0.8, duration: 6 },
    { icon: '🐦', left: '70%', top: '75%', delay: 2, duration: 4.5 },
    { icon: '☀️', left: '90%', top: '40%', delay: 0.3, duration: 5 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements.map((el, index) => (
        <motion.div
          key={index}
          className="absolute text-3xl md:text-4xl lg:text-5xl"
          style={{ left: el.left, top: el.top }}
          animate={{
            y: ['0px', '-20px', '0px'],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: el.duration,
            delay: el.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {el.icon}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingElements;