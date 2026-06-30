import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { COLOURS_DATA } from '../../../data/coloursData';
import { useAudio } from '../../../hooks/useAudio';
import { StorageService } from '../../../services/StorageService';
import { announceToScreenReader } from '../../../utils/accessibility';

const ColourPicker = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [targetColour, setTargetColour] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const { speak } = useAudio();

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * COLOURS_DATA.length);
    const target = COLOURS_DATA[randomIndex];
    setTargetColour(target);

    const others = COLOURS_DATA
      .filter(c => c.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const allOptions = [target, ...others].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setSelected(null);
    setIsCorrect(null);
    setTotalQuestions(prev => prev + 1);

    speak(`Find the colour ${target.name}`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(`Find the colour ${target.name}`);
  }, [speak]);

  const handleSelect = (colour) => {
    if (selected !== null) return;

    setSelected(colour.id);
    const correct = colour.id === targetColour.id;
    setIsCorrect(correct);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10);
      speak('Correct! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct!');
      
      const newScore = Math.round((correctAnswers + 1) / (totalQuestions + 1) * 100);
      onScoreUpdate(newScore);
      
      setTimeout(() => {
        if (totalQuestions >= 5) {
          const finalScore = Math.round((correctAnswers + 1) / (totalQuestions + 1) * 100);
          const stars = finalScore >= 90 ? 5 : finalScore >= 70 ? 3 : 1;
          onStarsUpdate(stars);
          onComplete({ score: finalScore, stars, correct: correctAnswers + 1, incorrect: attempts });
        } else {
          setTimeout(generateQuestion, 1500);
        }
      }, 1000);
    } else {
      setAttempts(prev => prev + 1);
      speak('Try again!', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not quite');
      setTimeout(() => {
        setSelected(null);
        setIsCorrect(null);
      }, 800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          🎨 Colour Picker
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pick the correct colour!
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Score: {score}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {options.map((colour) => (
          <motion.button
            key={colour.id}
            whileHover={{ scale: selected ? 1 : 1.05 }}
            whileTap={{ scale: selected ? 1 : 0.95 }}
            onClick={() => handleSelect(colour)}
            disabled={selected !== null}
            className={`p-6 rounded-2xl text-center transition-all duration-300 ${
              selected === colour.id
                ? isCorrect
                  ? 'ring-4 ring-green-500 shadow-glow'
                  : 'ring-4 ring-red-500'
                : selected !== null && colour.id === targetColour.id
                ? 'ring-4 ring-green-500 shadow-glow'
                : 'shadow-soft hover:shadow-hover'
            }`}
            style={{ backgroundColor: colour.hex }}
          >
            <div className="text-4xl">{colour.emoji}</div>
            <div className="mt-2 font-semibold text-white drop-shadow">
              {colour.name}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default ColourPicker;