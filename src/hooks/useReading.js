import { useState, useEffect, useCallback } from 'react';
import readingEngine from '../services/ReadingEngine';
import { useAudio } from './useAudio';

export const useReading = () => {
  const [currentSentence, setCurrentSentence] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceSentences, setPracticeSentences] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState('');
  
  const { speak, isPlaying } = useAudio();

  useEffect(() => {
    // Generate practice sentences
    const sentences = readingEngine.generateReadingPractice(1);
    setPracticeSentences(sentences);
  }, []);

  const startReading = useCallback((sentenceIndex = 0) => {
    if (practiceSentences.length === 0) return;
    
    setIsReading(true);
    setCurrentIndex(sentenceIndex);
    setCurrentSentence(practiceSentences[sentenceIndex]);
    setHighlightedWord('');
  }, [practiceSentences]);

  const nextSentence = useCallback(() => {
    if (currentIndex < practiceSentences.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSentence(practiceSentences[nextIndex]);
      setHighlightedWord('');
      return true;
    }
    return false;
  }, [currentIndex, practiceSentences]);

  const previousSentence = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSentence(practiceSentences[prevIndex]);
      setHighlightedWord('');
      return true;
    }
    return false;
  }, [currentIndex, practiceSentences]);

  const readSentence = useCallback(async (sentence) => {
    if (!sentence) return;
    
    const words = sentence.sentence.split(' ');
    setHighlightedWord('');
    
    // Read each word with highlighting
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      setHighlightedWord(word);
      await speak(word, {
        rate: 0.7,
        pitch: 1.1
      });
      // Wait a bit between words
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setHighlightedWord('');
  }, [speak]);

  const readWord = useCallback(async (word) => {
    if (!word) return;
    await speak(word, {
      rate: 0.7,
      pitch: 1.1
    });
  }, [speak]);

  const readWordFamily = useCallback(async (family) => {
    const data = readingEngine.getWordFamily(family);
    if (!data) return;
    
    // Read family sound
    await speak(data.sound, {
      rate: 0.7,
      pitch: 1.1
    });
    
    // Read examples
    for (const word of data.words.slice(0, 3)) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await speak(word, {
        rate: 0.7,
        pitch: 1.1
      });
    }
  }, [speak]);

  const getSentenceProgress = useCallback(() => {
    if (practiceSentences.length === 0) return 0;
    return ((currentIndex + 1) / practiceSentences.length) * 100;
  }, [currentIndex, practiceSentences]);

  const isLastSentence = useCallback(() => {
    return currentIndex === practiceSentences.length - 1;
  }, [currentIndex, practiceSentences]);

  const isFirstSentence = useCallback(() => {
    return currentIndex === 0;
  }, [currentIndex]);

  const resetReading = useCallback(() => {
    setIsReading(false);
    setCurrentSentence(null);
    setCurrentIndex(0);
    setHighlightedWord('');
  }, []);

  const getWordFamilyExamples = useCallback((family) => {
    return readingEngine.getWordFamily(family);
  }, []);

  const getAllWordFamilies = useCallback(() => {
    return readingEngine.getAllWordFamilies();
  }, []);

  return {
    currentSentence,
    currentWord,
    currentIndex,
    practiceSentences,
    isReading,
    highlightedWord,
    startReading,
    nextSentence,
    previousSentence,
    readSentence,
    readWord,
    readWordFamily,
    getSentenceProgress,
    isLastSentence,
    isFirstSentence,
    resetReading,
    getWordFamilyExamples,
    getAllWordFamilies,
    isPlaying
  };
};