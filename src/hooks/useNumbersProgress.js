import { useState, useEffect, useCallback } from 'react';
import { useChildAccount } from '../context/ChildAccountContext';
import { NUMBERS_DATA } from '../data/numbersData';

const STORAGE_KEY = 'numbers_progress';

export const useNumbersProgress = () => {
  const { activeChild, childId } = useChildAccount();
  const [progress, setProgress] = useState(null);

  // Load progress from child account or localStorage
  useEffect(() => {
    if (activeChild) {
      // Get progress from child's progress data
      const saved = activeChild.progress?.[STORAGE_KEY];
      if (saved) {
        setProgress(saved);
      } else {
        // Initialize default progress
        setProgress({
          opened: [],
          completed: [],
          favorites: [],
          mastered: [],
          timeSpent: {},
          lastVisited: null,
          totalTime: 0,
          recentLessons: []
        });
      }
    } else {
      // No child - use default empty state
      setProgress({
        opened: [],
        completed: [],
        favorites: [],
        mastered: [],
        timeSpent: {},
        lastVisited: null,
        totalTime: 0,
        recentLessons: []
      });
    }
  }, [activeChild]);

  // Save progress to child account
  useEffect(() => {
    if (progress && childId) {
      const accounts = JSON.parse(localStorage.getItem('makenna_child_accounts_v2') || '[]');
      const accountIndex = accounts.findIndex(a => a.childId?.toLowerCase() === childId?.toLowerCase());
      if (accountIndex !== -1) {
        if (!accounts[accountIndex].progress) {
          accounts[accountIndex].progress = {};
        }
        accounts[accountIndex].progress[STORAGE_KEY] = progress;
        localStorage.setItem('makenna_child_accounts_v2', JSON.stringify(accounts));
      }
    }
  }, [progress, childId]);

  const markOpened = useCallback((numberId) => {
    setProgress(prev => {
      if (!prev.opened.includes(numberId)) {
        return {
          ...prev,
          opened: [...prev.opened, numberId],
          lastVisited: new Date().toISOString()
        };
      }
      return prev;
    });
  }, []);

  const markCompleted = useCallback((numberId) => {
    setProgress(prev => {
      if (!prev.completed.includes(numberId)) {
        return {
          ...prev,
          completed: [...prev.completed, numberId],
          recentLessons: [
            numberId,
            ...prev.recentLessons.filter(id => id !== numberId)
          ].slice(0, 10)
        };
      }
      return prev;
    });
  }, []);

  const markMastered = useCallback((numberId) => {
    setProgress(prev => {
      if (!prev.mastered.includes(numberId)) {
        return {
          ...prev,
          mastered: [...prev.mastered, numberId]
        };
      }
      return prev;
    });
  }, []);

  const toggleFavorite = useCallback((numberId) => {
    setProgress(prev => {
      const favorites = prev.favorites.includes(numberId)
        ? prev.favorites.filter(id => id !== numberId)
        : [...prev.favorites, numberId];
      
      return {
        ...prev,
        favorites
      };
    });
  }, []);

  const addTimeSpent = useCallback((numberId, seconds) => {
    setProgress(prev => ({
      ...prev,
      timeSpent: {
        ...prev.timeSpent,
        [numberId]: (prev.timeSpent[numberId] || 0) + seconds
      },
      totalTime: prev.totalTime + seconds
    }));
  }, []);

  const isNumberOpened = useCallback((numberId) => {
    return progress?.opened.includes(numberId) || false;
  }, [progress]);

  const isNumberCompleted = useCallback((numberId) => {
    return progress?.completed.includes(numberId) || false;
  }, [progress]);

  const isNumberMastered = useCallback((numberId) => {
    return progress?.mastered.includes(numberId) || false;
  }, [progress]);

  const isNumberFavorited = useCallback((numberId) => {
    return progress?.favorites.includes(numberId) || false;
  }, [progress]);

  const getCompletionPercentage = useCallback(() => {
    if (!progress) return 0;
    const total = NUMBERS_DATA.length;
    const completed = progress.completed.length;
    return Math.round((completed / total) * 100);
  }, [progress]);

  const getMasteryPercentage = useCallback(() => {
    if (!progress) return 0;
    const total = NUMBERS_DATA.length;
    const mastered = progress.mastered.length;
    return Math.round((mastered / total) * 100);
  }, [progress]);

  const getNextNumber = useCallback(() => {
    if (!progress) return null;
    const allIds = NUMBERS_DATA.map(n => n.id);
    const nextId = allIds.find(id => !progress.completed.includes(id));
    return nextId || null;
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress({
      opened: [],
      completed: [],
      favorites: [],
      mastered: [],
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
    markMastered,
    toggleFavorite,
    addTimeSpent,
    isNumberOpened,
    isNumberCompleted,
    isNumberMastered,
    isNumberFavorited,
    getCompletionPercentage,
    getMasteryPercentage,
    getNextNumber,
    resetProgress
  };
};