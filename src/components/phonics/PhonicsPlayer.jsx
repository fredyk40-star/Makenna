import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaPlay, FaStop, FaSpinner, FaVolumeUp, FaRegCommentDots,
  FaRegListAlt, FaCompactDisc, FaPenFancy, FaCheck
} from 'react-icons/fa';
import { usePhonics } from '../../hooks/usePhonics';
import { getLetterById } from '../../data/alphabetData';
import Waveform from '../audio/Waveform';

const MODES = [
  { id: 'letter', label: 'Letter', icon: FaRegListAlt },
  { id: 'sound', label: 'Sound', icon: FaVolumeUp },
  { id: 'word', label: 'Word', icon: FaCompactDisc },
  { id: 'sentence', label: 'Sentence', icon: FaRegCommentDots },
  { id: 'word-with-sound', label: 'Word + Sound', icon: FaPenFancy },
];

const MODE_TEXT = {
  letter: 'Play Letter Name',
  sound: 'Play Letter Sound',
  word: 'Pronounce Word',
  sentence: 'Read Sentence',
  'word-with-sound': 'Play Sound + Word',
};

const PhonicsPlayer = ({
  letterId,
  mode = 'letter',
  wordIndex = 0,
  className = '',
  showWaveform = true,
  showModeTabs = true,
  completedSkills = {},
  onPracticed = null,
}) => {
  const {
    playLetterName,
    playLetterSound,
    playWord,
    playSentence,
    playWordWithSound,
    stop,
    isPlaying,
  } = usePhonics();

  const [activeMode, setActiveMode] = useState(mode);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => setActiveMode(mode), [mode]);

  const letter = useMemo(() => getLetterById(letterId), [letterId]);
  const word = letter?.words?.[wordIndex] || letter?.words?.[0];

  const displayText = useMemo(() => {
    if (!letter) return '';
    switch (activeMode) {
      case 'letter': return letter.letter;
      case 'sound': return letter.phonetic || letter.sound;
      case 'word': return word?.word || '';
      case 'sentence': return word?.sentence || '';
      case 'word-with-sound': return `${letter.phonetic || letter.sound} → ${word?.word || ''}`;
      default: return '';
    }
  }, [activeMode, letter, word]);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      stop();
      return;
    }

    setIsLoading(true);
    try {
      let spoken = false;
      switch (activeMode) {
        case 'letter': spoken = await playLetterName(letterId); break;
        case 'sound': spoken = await playLetterSound(letterId); break;
        case 'word': spoken = await playWord(letterId, wordIndex); break;
        case 'sentence': spoken = await playSentence(letterId, wordIndex); break;
        case 'word-with-sound': spoken = await playWordWithSound(letterId, wordIndex); break;
        default: break;
      }
      if (onPracticed) onPracticed(activeMode, { wordIndex, spoken });
    } finally {
      setIsLoading(false);
    }
  }, [
    activeMode, isPlaying, letterId, wordIndex, onPracticed, stop,
    playLetterName, playLetterSound, playWord, playSentence, playWordWithSound,
  ]);

  const handleModeChange = useCallback((nextMode) => {
    stop();
    setActiveMode(nextMode);
  }, [stop]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 md:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlay}
          disabled={isLoading}
          className={`relative w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isPlaying
              ? 'bg-red-500 shadow-soft'
              : 'bg-primary hover:bg-primary-dark shadow-soft hover:shadow-hover'
          } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          aria-label={isPlaying ? 'Stop audio' : MODE_TEXT[activeMode]}
        >
          {isLoading ? (
            <FaSpinner className="text-2xl animate-spin" />
          ) : isPlaying ? (
            <FaStop className="text-2xl" />
          ) : (
            <FaPlay className="text-2xl ml-1" />
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {MODE_TEXT[activeMode]}
          </div>
          <div className="text-xl md:text-2xl font-baloo font-bold text-gray-800 dark:text-white break-words">
            {displayText || 'Ready to listen!'}
          </div>
        </div>

        {showWaveform && (
          <div className="hidden sm:block">
            <Waveform
              isActive={isPlaying}
              height={40}
              width={120}
              barCount={30}
            />
          </div>
        )}
      </div>

      {showModeTabs && (
        <div className="mt-4 -mx-1 px-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Phonics practice modes">
          {MODES.map(({ id, label, icon: Icon }) => {
            const isComplete = completedSkills[id] === true;
            return (
              <motion.button
                key={id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleModeChange(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeMode === id
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-pressed={activeMode === id}
                type="button"
              >
                <Icon aria-hidden="true" />
                {label}
                {isComplete && <FaCheck className="text-green-400 text-xs" aria-label="Practiced" />}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PhonicsPlayer;
