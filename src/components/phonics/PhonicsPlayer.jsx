import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaStop, FaSpinner } from 'react-icons/fa';
import { usePhonics } from '../../hooks/usePhonics';
import VoiceButton from '../audio/VoiceButton';
import Waveform from '../audio/Waveform';

const PhonicsPlayer = ({
  letterId,
  mode = 'letter', // 'letter', 'sound', 'word', 'sentence'
  wordIndex = 0,
  className = '',
  showWaveform = true,
  autoPlay = false
}) => {
  const {
    playLetterName,
    playLetterSound,
    playWord,
    playSentence,
    playWordWithSound,
    isPlaying,
    currentLetter,
    currentWord
  } = usePhonics();

  const [activeMode, setActiveMode] = useState(mode);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = useCallback(async () => {
    setIsLoading(true);
    try {
      switch (activeMode) {
        case 'letter':
          await playLetterName(letterId);
          break;
        case 'sound':
          await playLetterSound(letterId);
          break;
        case 'word':
          await playWord(letterId, wordIndex);
          break;
        case 'sentence':
          await playSentence(letterId, wordIndex);
          break;
        case 'word-with-sound':
          await playWordWithSound(letterId, wordIndex);
          break;
        default:
          break;
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeMode, letterId, wordIndex, playLetterName, playLetterSound, playWord, playSentence, playWordWithSound]);

  const getPlayButtonLabel = () => {
    switch (activeMode) {
      case 'letter': return 'Play Letter Name';
      case 'sound': return 'Play Letter Sound';
      case 'word': return 'Play Word';
      case 'sentence': return 'Play Sentence';
      case 'word-with-sound': return 'Play with Sound';
      default: return 'Play';
    }
  };

  const getCurrentText = () => {
    if (!currentLetter) return '';
    switch (activeMode) {
      case 'letter': return currentLetter.letter;
      case 'sound': return currentLetter.phonetic || currentLetter.sound;
      case 'word': return currentWord?.word || '';
      case 'sentence': return currentWord?.sentence || '';
      default: return '';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Main Play Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlay}
          disabled={isLoading || isPlaying}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isPlaying 
              ? 'bg-primary shadow-glow' 
              : 'bg-primary hover:bg-primary-dark shadow-soft hover:shadow-hover'
          }`}
          aria-label={getPlayButtonLabel()}
        >
          {isLoading ? (
            <FaSpinner className="text-2xl animate-spin" />
          ) : isPlaying ? (
            <FaStop className="text-2xl" />
          ) : (
            <FaPlay className="text-2xl ml-1" />
          )}
        </motion.button>

        {/* Mode Information */}
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {getPlayButtonLabel()}
          </div>
          <div className="text-2xl font-baloo font-bold text-gray-800 dark:text-white">
            {getCurrentText() || 'Ready to learn!'}
          </div>
        </div>

        {/* Waveform */}
        {showWaveform && (
          <Waveform
            isActive={isPlaying}
            height={40}
            width={120}
            barCount={30}
          />
        )}
      </div>

      {/* Mode Selection */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {['letter', 'sound', 'word', 'sentence', 'word-with-sound'].map((modeOption) => (
          <motion.button
            key={modeOption}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveMode(modeOption)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeMode === modeOption
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-pressed={activeMode === modeOption}
          >
            {modeOption.replace('-', ' ')}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PhonicsPlayer;