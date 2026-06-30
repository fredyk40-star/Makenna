import { useState, useEffect, useCallback } from 'react';
import { useProfiles } from '../context/ProfileContext';

const STORAGE_KEY = 'alphabet_progress';

export const useAlphabetProgress = () => {
  const { getProfileData, setProfileData, activeProfile } = useProfiles();
  const [progress, setProgress] = useState({
    opened: [],
    completed: [],
    favorites: {
      letters: [],
      words: []
    },
    timeSpent: {},
    lastVisited: null,
    totalTime: 0,
    recentLessons: []
  });

  useEffect(() => {
    if (activeProfile) {
      const saved = getProfileData(STORAGE_KEY);
      if (saved) {
        setProgress(saved);
      } else {
        // Reset to default if no data is found for the new profile
        setProgress({
          opened: [],
          completed: [],
          favorites: {
            letters: [],
            words: []
          },
          timeSpent: {},
          lastVisited: null,
          totalTime: 0,
          recentLessons: []
        });
      }
    }
  }, [activeProfile, getProfileData]);

  useEffect(() => {
    if (progress) {
      setProfileData(STORAGE_KEY, progress);
    }
  }, [progress, setProfileData]);

  const markOpened = useCallback((letterId) => {
    setProgress(prev => {
      if (!prev.opened.includes(letterId)) {
        return {
          ...prev,
          opened: [...prev.opened, letterId],
          lastVisited: new Date().toISOString()
        };
      }
      return prev;
    });
  }, []);

  const markCompleted = useCallback((letterId) => {
    setProgress(prev => {
      if (!prev.completed.includes(letterId)) {
        return {
          ...prev,
          completed: [...prev.completed, letterId],
          recentLessons: [
            letterId,
            ...prev.recentLessons.filter(id => id !== letterId)
          ].slice(0, 10)
        };
      }
      return prev;
    });
  }, []);

  const toggleFavoriteLetter = useCallback((letterId) => {
    setProgress(prev => {
      const favorites = prev.favorites.letters.includes(letterId)
        ? prev.favorites.letters.filter(id => id !== letterId)
        : [...prev.favorites.letters, letterId];
      
      return {
        ...prev,
        favorites: {
          ...prev.favorites,
          letters: favorites
        }
      };
    });
  }, []);

  const toggleFavoriteWord = useCallback((wordId, letterId) => {
    setProgress(prev => {
      const wordKey = `${letterId}:${wordId}`;
      const favorites = prev.favorites.words.includes(wordKey)
        ? prev.favorites.words.filter(key => key !== wordKey)
        : [...prev.favorites.words, wordKey];
      
      return {
        ...prev,
        favorites: {
          ...prev.favorites,
          words: favorites
        }
      };
    });
  }, []);

  const addTimeSpent = useCallback((letterId, seconds) => {
    setProgress(prev => ({
      ...prev,
      timeSpent: {
        ...prev.timeSpent,
        [letterId]: (prev.timeSpent[letterId] || 0) + seconds
      },
      totalTime: prev.totalTime + seconds
    }));
  }, []);

  const isLetterOpened = useCallback((letterId) => {
    return progress?.opened.includes(letterId) || false;
  }, [progress]);

  const isLetterCompleted = useCallback((letterId) => {
    return progress?.completed.includes(letterId) || false;
  }, [progress]);

  const isLetterFavorited = useCallback((letterId) => {
    return progress?.favorites.letters.includes(letterId) || false;
  }, [progress]);

  const isWordFavorited = useCallback((wordId, letterId) => {
    return progress?.favorites.words.includes(`${letterId}:${wordId}`) || false;
  }, [progress]);

  const getProgress = useCallback(() => {
    return progress;
  }, [progress]);

  const getCompletionPercentage = useCallback(() => {
    if (!progress) return 0;
    const total = 26; // A-Z
    const completed = progress.completed.length;
    return Math.round((completed / total) * 100);
  }, [progress]);

  const getRecentLessons = useCallback(() => {
    return progress?.recentLessons || [];
  }, [progress]);

  const getFavoriteLetters = useCallback(() => {
    return progress?.favorites.letters || [];
  }, [progress]);

  const getFavoriteWords = useCallback(() => {
    return progress?.favorites.words || [];
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress({
      opened: [],
      completed: [],
      favorites: {
        letters: [],
        words: []
      },
      timeSpent: {},
      lastVisited: null,
      totalTime: 0,
      recentLessons: []
    });
  }, []);

  return {
    progress,
    markOpened,
    markCompleted,
    toggleFavoriteLetter,
    toggleFavoriteWord,
    addTimeSpent,
    isLetterOpened,
    isLetterCompleted,
    isLetterFavorited,
    isWordFavorited,
    getProgress,
    getCompletionPercentage,
    getRecentLessons,
    getFavoriteLetters,
    getFavoriteWords,
    resetProgress
  };
};