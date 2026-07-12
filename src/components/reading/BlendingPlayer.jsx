import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaStop } from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';

const BlendingPlayer = ({ 
  word,
  onComplete = null,
  className = '' 
}) => {
  const [sequence, setSequence] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { speak, stop } = useAudio();

  useEffect(() => {
    if (word) {
      const seq = generateBlendingSequence(word);
      setSequence(seq);
      setCurrentStep(0);
    }
  }, [word]);

  const generateBlendingSequence = (word) => {
    const letters = word.toLowerCase().split('');
    const sequence = [];
    
    for (let i = 0; i < letters.length; i++) {
      const partial = letters.slice(0, i + 1);
      sequence.push({
        word: partial.join(''),
        isComplete: i === letters.length - 1,
        letters: partial
      });
    }
    
    return sequence;
  };

  const playBlend = async () => {
    if (!sequence.length || isPlaying) return;
    
    setIsPlaying(true);
    setCurrentStep(0);
    
    for (let i = 0; i < sequence.length; i++) {
      setCurrentStep(i);
      
      // Speak each letter separately for blending
      if (i < sequence[i].letters.length) {
        await speak(sequence[i].letters[i], {
          rate: 0.6,
          pitch: 1.1
        });
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Then speak the partial word
      if (i > 0) {
        await speak(sequence[i].word, {
          rate: 0.7,
          pitch: 1.1
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsPlaying(false);
    if (onComplete) onComplete();
  };

  const stopBlend = () => {
    stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const getStepColor = (index) => {
    if (index < currentStep) return 'text-green-500';
    if (index === currentStep) return 'text-primary animate-pulse';
    return 'text-gray-400 dark:text-gray-500';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          Blend It! 🔤
        </h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isPlaying ? stopBlend : playBlend}
            className={`p-3 rounded-full transition-colors ${
              isPlaying
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
            aria-label={isPlaying ? 'Stop blending' : 'Play blending'}
          >
            {isPlaying ? <FaStop className="text-xl" /> : <FaPlay className="text-xl" />}
          </motion.button>
        </div>
      </div>

      {/* Word Display */}
      <div className="flex justify-center gap-1 mb-6">
        {word && word.split('').map((letter, index) => (
          <div
            key={index}
            className={`w-12 h-14 rounded-xl flex items-center justify-center text-3xl font-bold transition-all duration-300 ${
              index <= currentStep && isPlaying
                ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Blending Sequence */}
      <div className="space-y-2">
        {sequence.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
              index <= currentStep && isPlaying
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''
            }`}
          >
            <div className={`w-6 text-sm font-bold ${getStepColor(index)}`}>
              {index + 1}
            </div>
            <div className="flex-1 font-medium text-gray-700 dark:text-gray-200">
              {step.word}
            </div>
            {step.isComplete && index <= currentStep && isPlaying && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-green-500"
              >
                ✅
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        {isPlaying ? (
          <p>🔄 Listening to the blend...</p>
        ) : sequence.length > 0 ? (
          <p>👆 Click play to hear the word blended together</p>
        ) : (
          <p>Select a word to blend</p>
        )}
      </div>
    </div>
  );
};

export default BlendingPlayer;