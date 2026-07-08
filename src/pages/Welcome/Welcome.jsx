import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import PWAGuidance from '../../components/PWAGuidance/PWAGuidance';

const Welcome = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[80vh] flex flex-col items-center justify-center text-center"
    >
      <motion.div
        animate={{ y: ['0px', '-20px', '0px'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-8xl md:text-9xl mb-6"
      >
        🌈
      </motion.div>
      <h1 className="font-baloo text-4xl md:text-5xl font-bold text-primary dark:text-blue-400 mb-4">
        Welcome to Makenna Learning Lab!
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
        Watch • Play • Learn • Grow
      </p>
      
      {/* PWA Installation Guidance for Parents */}
      <PWAGuidance autoPlay={true} context="welcome" />
      
      <Link to="/">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary flex items-center gap-2 text-lg"
        >
          Let's Go! <FaArrowRight />
        </motion.button>
      </Link>
    </motion.div>
  );
};

export default Welcome;