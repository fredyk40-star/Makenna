import React, { useState, useEffect, useCallback } from 'react';
import { useProfiles } from '../context/ProfileContext';
import { NUMBERS_DATA } from '../data/numbersData';

const STORAGE_KEY = 'numbers_progress';

export const useNumbersProgress = () => {
  const { getProfileData, setProfileData, activeProfile } = useProfiles();
  const [progress, setProgress] = useState(null);

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
          favorites: [],
          mastered: [],
          timeSpent: {},
          lastVisited: null,
          totalTime: 0,
          recentLessons: []
        });
      }
    } else {
      // No profile - use default empty state
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
  }, [activeProfile, getProfileData]);

  useEffect(() => {
    if (progress) {
      setProfileData(STORAGE_KEY, progress);
    }
  }, [progress, setProfileData]);

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