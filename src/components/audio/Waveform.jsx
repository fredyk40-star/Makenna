import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import audioService from '../../services/AudioService';

const Waveform = ({
  isActive = false,
  height = 60,
  width = 200,
  color = '#2563EB',
  barCount = 40,
  className = ''
}) => {
  const [bars, setBars] = useState(new Array(barCount).fill(0));
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      const updateWaveform = () => {
        const data = audioService.getFrequencyData();
        if (data) {
          const normalizedBars = Array.from({ length: barCount }, (_, i) => {
            const index = Math.floor((i / barCount) * data.length);
            return data[index] / 255;
          });
          setBars(normalizedBars);
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setBars(new Array(barCount).fill(0));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, barCount]);

  return (
    <div className={`flex items-end justify-center gap-0.5 ${className}`} style={{ height, width }}>
      {bars.map((value, index) => (
        <motion.div
          key={index}
          className="rounded-t"
          style={{
            backgroundColor: color,
            width: `${100 / barCount}%`,
            height: `${Math.max(value * 100, 2)}%`,
          }}
          animate={{
            height: `${Math.max(value * 100, 2)}%`,
          }}
          transition={{
            duration: 0.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;