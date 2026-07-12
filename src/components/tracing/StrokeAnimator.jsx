import { memo, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

const StrokeAnimator = memo(({ 
  animationData, 
  letter, 
  caseType,
  onComplete = null,
  className = '' 
}) => {
  const controls = useAnimation();
  const containerRef = useRef(null);

  useEffect(() => {
    if (animationData && containerRef.current) {
      // Animate each stroke
      const animateStrokes = async () => {
        for (const stroke of animationData.strokes) {
          await controls.start({
            pathLength: 1,
            opacity: 1,
            transition: {
              duration: stroke.duration / 1000,
              ease: 'easeInOut'
            }
          });
        }
        if (onComplete) onComplete();
      };
      
      animateStrokes();
    }
  }, [animationData, controls, onComplete]);

  if (!animationData || !animationData.strokes) return null;

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {animationData.strokes.map((stroke, index) => (
          <motion.path
            key={stroke.id}
            d={`M ${stroke.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={controls}
            custom={{ delay: stroke.delay / 1000 }}
            transition={{
              delay: stroke.delay / 1000,
              duration: stroke.duration / 1000,
              ease: 'easeInOut'
            }}
          />
        ))}
      </svg>
    </div>
  );
});

StrokeAnimator.displayName = 'StrokeAnimator';

export default StrokeAnimator;