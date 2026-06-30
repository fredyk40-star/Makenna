import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPause, FaStop, FaVolumeUp, FaVolumeMute,
  FaUndo, FaForward, FaRedo
} from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';

const AudioPlayer = ({
  source,
  text,
  autoPlay = false,
  showControls = true,
  showWaveform = false,
  className = '',
  onPlay = null,
  onPause = null,
  onEnd = null,
  onError = null,
  size = 'medium'
}) => {
  const {
    play,
    speak,
    pause,
    resume,
    stop,
    togglePlayPause,
    isPlaying,
    isPaused,
    isLoading,
    error,
    setVolume,
    toggleMute,
    isMuted
  } = useAudio({
    onEnd,
    onError
  });

  const [volume, setVolumeState] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const animationFrameRef = useRef(null);

  const sizeClasses = {
    small: 'p-2 text-sm',
    medium: 'p-3 text-base',
    large: 'p-4 text-lg'
  };

  const iconSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const handlePlay = async () => {
    if (source) {
      await play(source);
    } else if (text) {
      await speak(text);
    }
    if (onPlay) onPlay();
  };

  const handlePause = () => {
    pause();
    if (onPause) onPause();
  };

  const handleStop = () => {
    stop();
  };

  const handleReplay = async () => {
    stop();
    setTimeout(async () => {
      if (source) {
        await play(source);
      } else if (text) {
        await speak(text);
      }
    }, 100);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
  };

  const handleToggleMute = () => {
    const muted = toggleMute();
    setVolumeState(muted ? 0 : 1);
  };

  // Waveform animation
  useEffect(() => {
    if (showWaveform && isPlaying) {
      const updateWaveform = () => {
        const data = audioService.getWaveformData();
        if (data) {
          setWaveformData(Array.from(data));
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (!isPlaying) {
        setWaveformData([]);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, showWaveform]);

  return (
    <div className={`${className}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 ${sizeClasses[size]}`}>
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isPlaying ? handlePause : handlePlay}
            className={`rounded-full bg-primary text-white hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${sizeClasses[size]}`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <FaPause className={iconSizeClasses[size]} />
            ) : (
              <FaPlay className={iconSizeClasses[size]} />
            )}
          </motion.button>

          {/* Replay Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReplay}
            className={`rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${sizeClasses[size]}`}
            aria-label="Replay"
          >
            <FaRedo className={iconSizeClasses[size]} />
          </motion.button>

          {/* Stop Button */}
          {showControls && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStop}
              className={`rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${sizeClasses[size]}`}
              aria-label="Stop"
            >
              <FaStop className={iconSizeClasses[size]} />
            </motion.button>
          )}

          {/* Volume Control */}
          <div className="relative flex items-center gap-2 ml-auto">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleMute}
              className={`rounded-full p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <FaVolumeMute className={iconSizeClasses[size]} /> : <FaVolumeUp className={iconSizeClasses[size]} />}
            </motion.button>

            {showControls && (
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-200 dark:bg-gray-600 rounded-full appearance-none cursor-pointer"
                  aria-label="Volume"
                />
              </div>
            )}
          </div>
        </div>

        {/* Waveform Visualization */}
        {showWaveform && waveformData.length > 0 && (
          <div className="mt-3 h-12 flex items-end gap-0.5">
            {waveformData.slice(0, 100).map((value, index) => (
              <motion.div
                key={index}
                className="flex-1 bg-primary rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${(value / 255) * 100}%` }}
                transition={{ duration: 0.05 }}
              />
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-2 text-red-500 text-sm">
            Error: {error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;