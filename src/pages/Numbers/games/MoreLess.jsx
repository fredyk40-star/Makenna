import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../../hooks/useAudio';
import { announceToScreenReader } from '../../../utils/accessibility';

const MoreLess = ({ game, onComplete, onScoreUpdate, onStarsUpdate }) => {
  const [group1, setGroup1] = useState([]);
  const [group2, setGroup2] = useState([]);
  const [questionType, setQuestionType] = useState('more');
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const { speak } = useAudio();
  const emojis = ['⭐', '🔵', '🟢', '🔴', '🟡', '🟣', '🟠', '💎'];

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = useCallback(() => {
    const max = game.maxNumber || 5;
    const type = Math.random() > 0.5 ? 'more' : 'less';
    setQuestionType(type);
    setSelected(null);
    setIsCorrect(null);
    setTotalQuestions(prev => prev + 1);

    let count1, count2;
    const diff = Math.floor(Math.random() * 3) + 1;
    const base = Math.floor(Math.random() * (max - diff)) + 1;
    
    if (Math.random() > 0.5) {
      count1 = base;
      count2 = base + diff;
    } else {
      count1 = base + diff;
      count2 = base;
    }

    const emoji1 = emojis[Math.floor(Math.random() * emojis.length)];
    const emoji2 = emojis[Math.floor(Math.random() * emojis.length)];
    
    setGroup1(Array(count1).fill(emoji1));
    setGroup2(Array(count2).fill(emoji2));

    const questionText = type === 'more' 
      ? 'Which group has more items?' 
      : 'Which group has less items?';
    speak(questionText, { rate: 0.7, pitch: 1.1 });
    announceToScreenReader(questionText);
  }, [game.maxNumber, speak]);

  const handleSelect = (group) => {
    if (isCorrect !== null) return;

    setSelected(group);
    const correct = questionType === 'more' 
      ? group === 1 ? group1.length > group2.length : group2.length > group1.length
      : group === 1 ? group1.length < group2.length : group2.length < group1.length;
    
    setIsCorrect(correct);

    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      speak('Correct! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Perfect!');
      
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
      announceToScreenReader('Not quite, try again');
      
      setTimeout(() => {
        setIsCorrect(null);
        setSelected(null);
      }, 800);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-baloo font-bold text-gray-800 dark:text-white">
          ⚖️ More or Less
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Which group has {questionType} items?
        </div>
        <div className="text-lg font-bold text-primary mt-2">
          Score: {correctAnswers}/{totalQuestions}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <motion.div
          whileHover={{ scale: selected ? 1 : 1.03 }}
          whileTap={{ scale: selected ? 1 : 0.97 }}
          onClick={() => handleSelect(1)}
          className={`flex-1 max-w-sm p-6 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === 1
              ? isCorrect
                ? 'bg-green-500 text-white shadow-glow'
                : 'bg-red-500 text-white'
              : isCorrect !== null && selected !== 1
              ? 'opacity-50'
              : 'bg-white dark:bg-gray-700 shadow-soft hover:shadow-hover'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{group1.length} items</div>
            <div className="flex flex-wrap justify-center gap-1 text-2xl">
              {group1.map((emoji, i) => (
                <span key={i}>{emoji}</span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: selected ? 1 : 1.03 }}
          whileTap={{ scale: selected ? 1 : 0.97 }}
          onClick={() => handleSelect(2)}
          className={`flex-1 max-w-sm p-6 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === 2
              ? isCorrect
                ? 'bg-green-500 text-white shadow-glow'
                : 'bg-red-500 text-white'
              : isCorrect !== null && selected !== 2
              ? 'opacity-50'
              : 'bg-white dark:bg-gray-700 shadow-soft hover:shadow-hover'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{group2.length} items</div>
            <div className="flex flex-wrap justify-center gap-1 text-2xl">
              {group2.map((emoji, i) => (
                <span key={i}>{emoji}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-center p-3 rounded-xl ${
              isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {isCorrect ? '🎉 Correct! Great comparing!' : `🤔 The ${questionType} group has ${questionType === 'more' ? Math.max(group1.length, group2.length) : Math.min(group1.length, group2.length)} items`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Question {totalQuestions} of 5
      </div>
    </div>
  );
};

export default MoreLess;