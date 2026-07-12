import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SHAPES_DATA } from '../../../data/shapesData';
import { useAudio } from '../../../hooks/useAudio';
import { StorageService } from '../../../services/StorageService';
import { announceToScreenReader } from '../../../utils/accessibility';

const ShapeMatch = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [targetShape, setTargetShape] = useState(null);
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
    const randomIndex = Math.floor(Math.random() * SHAPES_DATA.length);
    const target = SHAPES_DATA[randomIndex];
    setTargetShape(target);

    // Get 3 other shapes
    const others = SHAPES_DATA
      .filter(s => s.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const allOptions = [target, ...others].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setSelected(null);
    setIsCorrect(null);
    setTotalQuestions(prev => prev + 1);

    speak(`Find the ${target.name} shape`, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(`Find the ${target.name} shape`);
  }, [speak]);

  const handleSelect = (shape) => {
    if (selected !== null) return;

    setSelected(shape.id);
    const correct = shape.id === targetShape.id;
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
          🔷 Shape Match
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find the matching shape!
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Score: {score}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {options.map((shape) => (
          <motion.button
            key={shape.id}
            whileHover={{ scale: selected ? 1 : 1.05 }}
            whileTap={{ scale: selected ? 1 : 0.95 }}
            onClick={() => handleSelect(shape)}
            disabled={selected !== null}
            className={`p-6 rounded-2xl text-center transition-all duration-300 ${
              selected === shape.id
                ? isCorrect
                  ? 'bg-green-500 text-white shadow-glow'
                  : 'bg-red-500 text-white'
                : selected !== null && shape.id === targetShape.id
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-700 shadow-soft hover:shadow-hover'
            } ${selected !== null && selected !== shape.id && shape.id !== targetShape.id ? 'opacity-50' : ''}`}
          >
            <div className="text-5xl">{shape.emoji}</div>
            <div className="mt-2 font-semibold">{shape.name}</div>
          </motion.button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default ShapeMatch;