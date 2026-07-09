import { useState, useEffect, useCallback, useRef } from 'react';
import storyEngine from '../services/StoryEngine';
import readingAnalyticsService from '../services/ReadingAnalyticsService';

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
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(0.85);

  const utteranceRef = useRef(null);
  const wordMapRef = useRef([]);

  useEffect(() => {
    if (storyId) {
      loadStory(storyId);
    }
    return () => {
      // Cleanup speech on unmount
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
    };
  }, [storyId]);

  const loadStory = useCallback((id) => {
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
        setAutoPlay(false);
        wordMapRef.current = [];
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
    if (isPlaying) {
      // Pause
      window.speechSynthesis.pause();
      setIsPlaying(false);
      storyEngine.stopReading();
      return { isPlaying: false };
    } else {
      // Resume or start
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        return { isPlaying: true };
      } else {
        // Start fresh
        readPageSmooth();
        return { isPlaying: true };
      }
    }
  }, [isPlaying]);

  /**
   * Build word map from text for character-index-based highlighting
   */
  const buildWordMap = useCallback((text) => {
    const words = [];
    let currentIndex = 0;
    const textWords = text.split(/\s+/);
    for (const word of textWords) {
      const startIdx = text.indexOf(word, currentIndex);
      if (startIdx >= 0) {
        words.push({ word, start: startIdx, end: startIdx + word.length });
        currentIndex = startIdx + word.length;
      }
    }
    wordMapRef.current = words;
    return words;
  }, []);

  /**
   * Smooth sentence-level reading using native SpeechSynthesis onboundary
   */
  const readPageSmooth = useCallback(() => {
    if (!currentPage) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    setIsPlaying(true);
    const text = currentPage.text;
    buildWordMap(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = 1.1;
    utterance.lang = 'en-US';

    // Try to get a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                        voices.find(v => v.lang.startsWith('en-US')) ||
                        voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        // Find the word at this character position
        const wordEntry = wordMapRef.current.find(
          w => charIndex >= w.start && charIndex < w.end
        );
        if (wordEntry) {
          setHighlightedWord(wordEntry.word);
        }
      }
    };

    utterance.onend = () => {
      setHighlightedWord('');
      setIsPlaying(false);
      storyEngine.stopReading();
      utteranceRef.current = null;

      // Auto-play: advance to next page
      if (autoPlay) {
        if (storyEngine.currentPage < storyEngine.getTotalPages() - 1) {
          const page = storyEngine.nextPage();
          if (page) {
            setCurrentPage(page);
            setPageNumber(storyEngine.currentPage);
            setProgress(storyEngine.progress);
            setIsComplete(storyEngine.isStoryComplete());
            // Small delay before auto-reading next page
            setTimeout(() => readPageSmooth(), 500);
          }
        } else {
          // Story complete via auto-play
          const page = storyEngine.nextPage();
          if (page) {
            setCurrentPage(page);
            setPageNumber(storyEngine.currentPage);
            setProgress(storyEngine.progress);
            setIsComplete(storyEngine.isStoryComplete());
          }
          if (storyEngine.isStoryComplete()) {
            readingAnalyticsService.recordStoryCompletion(story?.id);
          }
        }
      }
    };

    utterance.onerror = (event) => {
      console.warn('Speech error:', event);
      setHighlightedWord('');
      setIsPlaying(false);
      storyEngine.stopReading();
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [currentPage, speed, autoPlay, story, buildWordMap]);

  const readPage = useCallback(async () => {
    if (!currentPage) return;
    readPageSmooth();
  }, [currentPage, readPageSmooth]);

  const stopReading = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setHighlightedWord('');
    storyEngine.stopReading();
    utteranceRef.current = null;
  }, []);

  const readWord = useCallback(async (word) => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = speed;
      utterance.pitch = 1.1;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                          voices.find(v => v.lang.startsWith('en-US')) ||
                          voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, [speed]);

  const changeMode = useCallback((mode) => {
    storyEngine.setReadingMode(mode);
    setReadingMode(mode);
    if (mode === 'read-by-myself') {
      stopReading();
    }
  }, [stopReading]);

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
    window.speechSynthesis.cancel();
    setPageNumber(0);
    setCurrentPage(story?.pages[0] || null);
    setProgress(0);
    setIsComplete(false);
    setHighlightedWord('');
    setAutoPlay(false);
    setIsPlaying(false);
    utteranceRef.current = null;
    wordMapRef.current = [];
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
    autoPlay,
    setAutoPlay,
    speed,
    setSpeed,
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