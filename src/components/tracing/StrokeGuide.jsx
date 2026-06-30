import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const StrokeGuide = memo(({ 
  guideData, 
  letter, 
  caseType, 
  visible = true,
  className = '' 
}) => {
  if (!visible || !guideData || guideData.length === 0) return null;

  const getArrowIcon = (direction) => {
    switch (direction) {
      case 'up': return FaArrowUp;
      case 'down': return FaArrowDown;
      case 'left': return FaArrowLeft;
      case 'right': return FaArrowRight;
      default: return null;
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="relative w-full h-full">
        {guideData.map((guide, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="absolute"
            style={{
              left: guide.start?.x || '20%',
              top: guide.start?.y || '20%',
            }}
          >
            {/* Start dot */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-400 animate-pulse">
              <span className="sr-only">Start point {index + 1}</span>
            </div>

            {/* Direction arrow */}
            {guide.direction && (
              <motion.div
                animate={{
                  y: guide.direction === 'down' ? [0, 10, 0] : 
                      guide.direction === 'up' ? [0, -10, 0] : 0,
                  x: guide.direction === 'right' ? [0, 10, 0] :
                      guide.direction === 'left' ? [0, -10, 0] : 0,
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-6 left-1/2 -translate-x-1/2 text-blue-400 text-xl"
              >
                {getArrowIcon(guide.direction) && 
                  React.createElement(getArrowIcon(guide.direction))}
              </motion.div>
            )}

            {/* Stroke order number */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-sm">
              {guide.order + 1}
            </div>
          </motion.div>
        ))}

        {/* Letter label */}
        <div className="absolute bottom-2 right-2 text-2xl font-bold text-gray-300 dark:text-gray-600 opacity-50 select-none">
          {caseType === 'uppercase' ? letter.toUpperCase() : letter.toLowerCase()}
        </div>
      </div>
    </div>
  );
});

StrokeGuide.displayName = 'StrokeGuide';

export default StrokeGuide;