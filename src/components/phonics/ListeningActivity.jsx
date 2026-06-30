import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTimes, FaStar, FaVolumeUp } from 'react-icons/fa';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { usePhonics } from '../../hooks/usePhonics';
import { useAudio } from '../../hooks/useAudio';
import { announceToScreenReader } from '../../utils/accessibility';

const ListeningActivity = ({
  letterId,
  onComplete = null,
  onCorrect = null,
  onIncorrect = null,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [activityComplete, setActivityComplete] = useState(false);
  const [feedback, setFeedback] = useState('');

  const { speak } = useAudio();
  const { playLetterSound, playLetterName } = usePhonics();

  // Generate random letters for the activity
  const [options, setOptions] = useState([]);
  const [targetLetter, setTargetLetter] = useState(null);

  useEffect(() => {
    generateQuestion();
  }, [letterId]);

  const generateQuestion = useCallback(() => {
    const correct = ALPHABET_DATA.find(l => l.id === letterId);
    if (!correct) return;

    // Get 3 random other letters
    const others = ALPHABET_DATA
      .filter(l => l.id !== letterId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [correct, ...others].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setTargetLetter(correct);
    setSelectedLetter(null);
    setIsCorrect(null);
    setFeedback('');

    // Speak the target letter
    setTimeout(() => {
      speak(correct.letter, {
        rate: 0.8,
        pitch: 1.2
      });
    }, 500);
  }, [letterId, speak]);

  const handleLetterSelect = useCallback(async (letter) => {
    if (isCorrect !== null) return;

    setSelectedLetter(letter);
    const correct = letter.id === targetLetter?.id;
    setIsCorrect(correct);
    setTotalAttempts(prev => prev + 1);

    if (correct) {
      setScore(prev => prev + 1);
      setFeedback('🌟 Excellent! Great job!');
      await speak('Excellent! Great job!', {
        rate: 0.9,
        pitch: 1.2
      });
      announceToScreenReader('Correct! Great job!');
      
      if (onCorrect) onCorrect();
      
      // Check if activity is complete (3 correct answers)
      if (score + 1 >= 3) {
        setActivityComplete(true);
        setFeedback('🎉 Amazing! You completed the activity!');
        await speak('Amazing! You completed the activity!', {
          rate: 0.9,
          pitch: 1.2
        });
        if (onComplete) onComplete();
      } else {
        // Next question after delay
        setTimeout(() => {
          generateQuestion();
        }, 1500);
      }
    } else {
      setFeedback('🤔 Not quite. Try again!');
      await speak('Not quite. Try again!', {
        rate: 0.9,
        pitch: 1.1
      });
      announceToScreenReader('Incorrect. Try again!');
      if (onIncorrect) onIncorrect();
      
      setTimeout(() => {
        setSelectedLetter(null);
        setIsCorrect(null);
        setFeedback('');
      }, 1000);
    }
  }, [targetLetter, score, generateQuestion, speak, onCorrect, onIncorrect, onComplete]);

  const handleReplaySound = useCallback(() => {
    if (targetLetter) {
      speak(targetLetter.letter, {
        rate: 0.8,
        pitch: 1.2
      });
    }
  }, [targetLetter, speak]);

  const handleReset = useCallback(() => {
    setScore(0);
    setTotalAttempts(0);
    setActivityComplete(false);
    setCurrentStep(0);
    generateQuestion();
  }, [generateQuestion]);

  if (activityComplete) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-2xl p-8 text-center ${className}`}
      >
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
          Activity Complete!
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          You got {score} out of {totalAttempts} correct!
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="mt-4 btn-primary"
        >
          Play Again
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          Listen & Find
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Listen to the letter and tap the correct one!
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Score: {score}/3
          </span>
          <button
            onClick={handleReplaySound}
            className="text-primary hover:text-primary-dark transition-colors"
            aria-label="Replay sound"
          >
            <FaVolumeUp className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-center py-2 mb-4 rounded-xl ${
              isCorrect 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : isCorrect === false
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Options */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {options.map((letter) => (
          <motion.button
            key={letter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleLetterSelect(letter)}
            disabled={isCorrect !== null}
            className={`relative p-6 rounded-2xl text-4xl font-baloo font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              selectedLetter?.id === letter.id
                ? isCorrect
                  ? 'bg-green-500 text-white shadow-glow'
                  : 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isCorrect !== null && selectedLetter?.id !== letter.id ? 'opacity-50' : ''}`}
            aria-label={`Select letter ${letter.letter}`}
          >
            {letter.letter}
            
            {/* Feedback Icon */}
            {selectedLetter?.id === letter.id && (
              <div className="absolute -top-2 -right-2">
                {isCorrect ? (
                  <FaCheck className="text-green-300 text-xl" />
                ) : (
                  <FaTimes className="text-red-300 text-xl" />
                )}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-6 flex justify-center gap-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index < score
                ? 'bg-green-500'
                : index === score && !activityComplete
                ? 'bg-primary animate-pulse'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ListeningActivity;