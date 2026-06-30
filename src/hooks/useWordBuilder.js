import { useState, useEffect, useCallback } from 'react';
import wordBuilderService from '../services/WordBuilderService';
import readingEngine from '../services/ReadingEngine';

export const useWordBuilder = (word = null) => {
  const [build, setBuild] = useState(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (word) {
      const letters = readingEngine.segmentWord(word);
      const newBuild = wordBuilderService.createWordBuild(word, letters);
      setBuild(newBuild);
      setProgress(0);
      setCompleted(false);
      setMessage('Let\'s build the word! 🔤');
      setHint(null);
    }
  }, [word]);

  const placeLetter = useCallback((letterIndex, position) => {
    if (!build || completed) return null;
    
    const result = wordBuilderService.submitPlacement(build.id, letterIndex, position);
    if (result) {
      setProgress(result.progress);
      setMessage(result.message);
      
      // Check if word is completed
      if (result.progress === 100) {
        setCompleted(true);
        const stats = wordBuilderService.recordCompletion(build.id);
        setStats(stats);
        setMessage('🌟 Word completed! Amazing work!');
      }
      
      return result;
    }
    return null;
  }, [build, completed]);

  const getHint = useCallback(() => {
    if (!build || completed) return null;
    
    const hintData = wordBuilderService.getHint(build.id);
    if (hintData) {
      setHint(hintData);
      setMessage('💡 Here\'s a hint!');
      return hintData;
    }
    return null;
  }, [build, completed]);

  const reset = useCallback(() => {
    if (!build) return;
    
    const resetBuild = wordBuilderService.resetBuild(build.id);
    setBuild(resetBuild);
    setProgress(0);
    setCompleted(false);
    setMessage('Let\'s try again! 💪');
    setHint(null);
    setStats(null);
  }, [build]);

  const getAvailableLetters = useCallback(() => {
    if (!build) return [];
    return build.shuffled.filter(l => l !== null);
  }, [build]);

  const getWordLetters = useCallback(() => {
    if (!build) return [];
    return build.letters;
  }, [build]);

  const getPlacementStatus = useCallback((position) => {
    if (!build) return { empty: true, letter: null };
    
    const placed = build.shuffled.every((l, index) => {
      if (l === null) return true;
      return build.letters[index] === l;
    });
    
    // Check if position is filled
    const letter = build.letters[position];
    const isFilled = build.shuffled.every((l, index) => {
      return l === null || index !== position;
    });
    
    return {
      empty: !isFilled,
      letter: letter,
      isCorrect: placed
    };
  }, [build]);

  return {
    build,
    progress,
    completed,
    message,
    hint,
    stats,
    placeLetter,
    getHint,
    reset,
    getAvailableLetters,
    getWordLetters,
    getPlacementStatus,
    isComplete: completed
  };
};