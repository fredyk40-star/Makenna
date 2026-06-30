import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const PageTurn = ({ 
  children, 
  pageNumber, 
  totalPages, 
  onPageTurn,
  className = '' 
}) => {
  const [direction, setDirection] = useState('next');

  const handleNext = () => {
    setDirection('next');
    onPageTurn('next');
  };

  const handlePrev = () => {
    setDirection('prev');
    onPageTurn('prev');
  };

  const pageVariants = {
    initial: (direction) => ({
      x: direction === 'next' ? 300 : -300,
      opacity: 0,
      rotateY: direction === 'next' ? 10 : -10,
      scale: 0.95
    }),
    animate: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: (direction) => ({
      x: direction === 'next' ? -300 : 300,
      opacity: 0,
      rotateY: direction === 'next' ? -10 : 10,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    })
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={pageNumber}
          custom={direction}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Click zones for page turning on desktop */}
      {pageNumber > 0 && (
        <div
          className="hidden md:block absolute left-0 top-0 w-20 h-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          onClick={handlePrev}
          aria-label="Previous page"
        />
      )}
      {pageNumber < totalPages - 1 && (
        <div
          className="hidden md:block absolute right-0 top-0 w-20 h-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          onClick={handleNext}
          aria-label="Next page"
        />
      )}

      {/* Page corner indicator */}
      <div className="absolute bottom-0 right-0 text-4xl opacity-10 select-none pointer-events-none">
        📄
      </div>
    </div>
  );
};

export default PageTurn;