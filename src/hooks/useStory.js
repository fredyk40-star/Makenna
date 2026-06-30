import { useState, useEffect, useCallback } from 'react';
import storyEngine from '../services/StoryEngine';
import readingAnalyticsService from '../services/ReadingAnalyticsService';
import { useAudio } from './useAudio';

export const useStory = (storyId = null) => {
  const [story, setStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [readingMode, setReadingMode] = useState('read-to-me');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState('');
  const [vocabulary, setVocabulary] = useState([]);
  const [comprehension, setComprehension] = useState([]);
  const [characters, setCharacters] = useState([]);
  
  const { speak, isPlaying: isAudioPlaying, stop } = useAudio();

  useEffect(() => {
    if (storyId) {
      loadStory(storyId);
    }
  }, [storyId]);

  const loadStory = useCallback((id) => {
    // Import stories dynamically
    import('../data/stories').then(({ getStoryById }) => {
      const storyData = getStoryById(id);
      if (storyData) {
        storyEngine.loadStory(storyData);
        setStory(storyData);
        setCurrentPage(storyData.pages[0]);
        setPageNumber(0);
        setTotalPages(storyData.pages.length);
        setVocabulary(storyData.vocabulary || []);
        setComprehension(storyData.comprehension || []);
        setCharacters(storyData.characters || []);
        setProgress(0);
        setIsComplete(false);
        setHighlightedWord('');
      }
    });
  }, []);

  const goToPage = useCallback((pageIndex) => {
    const page = storyEngine.goToPage(pageIndex);
    if (page) {
      setCurrentPage(page);
      setPageNumber(pageIndex);
      setProgress(storyEngine.progress);
      setIsComplete(storyEngine.isStoryComplete());
      
      // Record time spent
      if (pageIndex > 0) {
        readingAnalyticsService.recordReadingTime(0.5);
      }
    }
  }, []);

  const nextPage = useCallback(() => {
    const page = storyEngine.nextPage();
    if (page) {
      setCurrentPage(page);
      setPageNumber(storyEngine.currentPage);
      setProgress(storyEngine.progress);
      setIsComplete(storyEngine.isStoryComplete());
      
      // Check if story is complete
      if (storyEngine.isStoryComplete()) {
        readingAnalyticsService.recordStoryCompletion(story.id);
      }
      
      return true;
    }
    return false;
  }, [story]);

  const previousPage = useCallback(() => {
    const page = storyEngine.previousPage();
    if (page) {
      setCurrentPage(page);
      setPageNumber(storyEngine.currentPage);
      setProgress(storyEngine.progress);
      return true;
    }
    return false;
  }, []);

  const togglePlayPause = useCallback(() => {
    const result = storyEngine.togglePlayPause();
    setIsPlaying(result.isPlaying);
    return result;
  }, []);

  const readPage = useCallback(async () => {
    if (!currentPage) return;
    
    setIsPlaying(true);
    const text = currentPage.text;
    const words = text.split(' ');
    
    for (const word of words) {
      setHighlightedWord(word);
      await speak(word, {
        rate: 0.7,
        pitch: 1.1
      });
      // Small pause between words
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setHighlightedWord('');
    setIsPlaying(false);
    storyEngine.stopReading();
  }, [currentPage, speak]);

  const stopReading = useCallback(() => {
    stop();
    setIsPlaying(false);
    setHighlightedWord('');
    storyEngine.stopReading();
  }, [stop]);

  const readWord = useCallback(async (word) => {
    await speak(word, {
      rate: 0.7,
      pitch: 1.1
    });
  }, [speak]);

  const changeMode = useCallback((mode) => {
    storyEngine.setReadingMode(mode);
    setReadingMode(mode);
  }, []);

  const recordComprehension = useCallback((score) => {
    if (story) {
      storyEngine.recordComprehension(story.id, score);
    }
  }, [story]);

  const getComprehensionScore = useCallback(() => {
    if (story) {
      return storyEngine.getComprehensionScore(story.id);
    }
    return null;
  }, [story]);

  const getVocabulary = useCallback(() => {
    return vocabulary;
  }, [vocabulary]);

  const getCharacters = useCallback(() => {
    return characters;
  }, [characters]);

  const getProgress = useCallback(() => {
    return progress;
  }, [progress]);

  const isStoryComplete = useCallback(() => {
    return isComplete;
  }, [isComplete]);

  const resetStory = useCallback(() => {
    storyEngine.resetStory();
    setPageNumber(0);
    setCurrentPage(story?.pages[0] || null);
    setProgress(0);
    setIsComplete(false);
    setHighlightedWord('');
  }, [story]);

  return {
    story,
    currentPage,
    pageNumber,
    totalPages,
    progress,
    isComplete,
    readingMode,
    isPlaying,
    highlightedWord,
    vocabulary,
    comprehension,
    characters,
    loadStory,
    goToPage,
    nextPage,
    previousPage,
    togglePlayPause,
    readPage,
    readWord,
    stopReading,
    changeMode,
    recordComprehension,
    getComprehensionScore,
    getVocabulary,
    getCharacters,
    getProgress,
    isStoryComplete,
    resetStory
  };
};