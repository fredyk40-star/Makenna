import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVolumeUp, FaVolumeMute, FaSpinner } from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';

const VoiceButton = ({
  text,
  label = 'Listen',
  className = '',
  size = 'medium',
  showWaveform = false,
  onPlay = null,
  onEnd = null,
  onError = null,
  autoPlay = false
}) => {
  const { speak, isPlaying, isLoading, stop } = useAudio({
    onEnd,
    onError
  });

  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(async () => {
    if (isPlaying) {
      stop();
      return;
    }

    await speak(text, {
      rate: 0.9,
      pitch: 1.1
    });
    if (onPlay) onPlay();
  }, [isPlaying, speak, stop, text, onPlay]);

  const sizeClasses = {
    small: 'w-10 h-10 text-sm',
    medium: 'w-12 h-12 text-base',
    large: 'w-14 h-14 text-lg'
  };

  const iconSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        isPlaying 
          ? 'bg-primary text-white shadow-glow' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${sizeClasses[size]} ${className}`}
      aria-label={isPlaying ? 'Stop speaking' : label}
      aria-pressed={isPlaying}
      disabled={isLoading}
    >
      {isLoading ? (
        <FaSpinner className={`${iconSizeClasses[size]} animate-spin`} />
      ) : isPlaying ? (
        <FaVolumeMute className={iconSizeClasses[size]} />
      ) : (
        <FaVolumeUp className={iconSizeClasses[size]} />
      )}

      {/* Sound wave animation */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 rounded-full border-2 border-primary"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-primary/50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple effect on hover */}
      {isHovered && !isPlaying && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.3 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="absolute inset-0 rounded-full bg-primary"
        />
      )}
    </motion.button>
  );
};

export default VoiceButton;