import { useState, useEffect, useCallback, useRef } from 'react';
import readingEngine from '../services/ReadingEngine';
import { useAudio } from './useAudio';

export const useReading = () => {
  const [currentSentence, setCurrentSentence] = useState(null);
  const [currentWord, ] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceSentences, setPracticeSentences] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState('');

  const { speak, stop, isPlaying } = useAudio();
  const readingRunRef = useRef(0);

  useEffect(() => {
    // Generate practice sentences
    const sentences = readingEngine.generateReadingPractice(1);
    setPracticeSentences(sentences);
  }, []);

  const cancelReading = useCallback(() => {
    readingRunRef.current += 1;
    stop();
    setIsReading(false);
    setHighlightedWord('');
  }, [stop]);

  useEffect(() => () => {
    readingRunRef.current += 1;
    stop();
  }, [stop]);

  const startReading = useCallback((sentenceIndex = 0) => {
    if (practiceSentences.length === 0) return;

    cancelReading();
    setCurrentIndex(sentenceIndex);
    setCurrentSentence(practiceSentences[sentenceIndex]);
  }, [cancelReading, practiceSentences]);

  const nextSentence = useCallback(() => {
    if (currentIndex < practiceSentences.length - 1) {
      cancelReading();
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSentence(practiceSentences[nextIndex]);
      return true;
    }
    return false;
  }, [cancelReading, currentIndex, practiceSentences]);

  const previousSentence = useCallback(() => {
    if (currentIndex > 0) {
      cancelReading();
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSentence(practiceSentences[prevIndex]);
      return true;
    }
    return false;
  }, [cancelReading, currentIndex, practiceSentences]);

  const readSentence = useCallback(async (sentence) => {
    if (!sentence) return;

    const runId = ++readingRunRef.current;
    const words = sentence.sentence.split(' ');
    setHighlightedWord('');
    setIsReading(true);

    try {
      for (const word of words) {
        if (readingRunRef.current !== runId) return;
        setHighlightedWord(word);
        const spoken = await speak(word, { rate: 0.7, pitch: 1.1 });
        if (!spoken || readingRunRef.current !== runId) return;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } finally {
      if (readingRunRef.current === runId) {
        setHighlightedWord('');
        setIsReading(false);
      }
    }
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
    const soundSpoken = await speak(data.sound, { rate: 0.7, pitch: 1.1 });
    if (!soundSpoken) return;

    // Read examples
    for (const word of data.words.slice(0, 3)) {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!await speak(word, { rate: 0.7, pitch: 1.1 })) return;
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
    cancelReading();
    setCurrentSentence(null);
    setCurrentIndex(0);
  }, [cancelReading]);

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
    stopReading: cancelReading,
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