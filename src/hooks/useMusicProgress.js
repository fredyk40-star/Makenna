import { useState, useEffect, useCallback } from 'react';
import { useChildAccount } from '../context/ChildAccountContext';
import { MUSIC_LIBRARY } from '../data/musicData';
import { GamificationService } from '../services/GamificationService';

const STORAGE_KEY = 'music_progress';

export const useMusicProgress = () => {
  const { childId } = useChildAccount();
  const [progress, setProgress] = useState({
    played: [],
    completed: [],
    favorites: [],
    timesPlayed: {},
    timeSpent: {},
    lastPlayed: null,
    totalTime: 0,
    recentSongs: [],
    recordedSongs: {},
    streakDays: [],
    totalXP: 0,
    totalStars: 0
  });

  useEffect(() => {
    if (childId) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${childId}`);
      if (saved) {
        try {
          setProgress(JSON.parse(saved));
        } catch (e) {
          console.warn('Failed to parse music progress', e);
        }
      }
    }
  }, [childId]);

  useEffect(() => {
    if (childId && progress) {
      localStorage.setItem(`${STORAGE_KEY}_${childId}`, JSON.stringify(progress));
    }
  }, [progress, childId]);

  const recordPlay = useCallback((songId, duration = 0) => {
    setProgress(prev => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const played = prev.played.includes(songId) 
        ? prev.played 
        : [...prev.played, songId];
      
      const timesPlayed = {
        ...prev.timesPlayed,
        [songId]: (prev.timesPlayed[songId] || 0) + 1
      };

      const streakDays = prev.streakDays.includes(today)
        ? prev.streakDays
        : [...prev.streakDays, today];

      // Award XP and stars for listening
      const xpEarned = 10;
      const starsEarned = 1;
      
      if (childId) {
        GamificationService.addXP(childId, xpEarned, `Song played: ${songId}`);
        GamificationService.recordCorrectAnswer(childId);
      }

      return {
        ...prev,
        played,
        timesPlayed,
        lastPlayed: now.toISOString(),
        totalTime: prev.totalTime + duration,
        streakDays,
        totalXP: prev.totalXP + xpEarned,
        totalStars: prev.totalStars + starsEarned,
        recentSongs: [
          songId,
          ...prev.recentSongs.filter(id => id !== songId)
        ].slice(0, 10)
      };
    });
  }, [childId]);

  const markCompleted = useCallback((songId) => {
    setProgress(prev => {
      if (!prev.completed.includes(songId)) {
        const now = new Date();
        
        // Award bonus XP for completion
        const xpEarned = 20;
        const starsEarned = 2;
        
        if (childId) {
          GamificationService.addXP(childId, xpEarned, `Song completed: ${songId}`);
          GamificationService.addCoins(childId, 5);
        }

        return {
          ...prev,
          completed: [...prev.completed, songId],
          lastPlayed: now.toISOString(),
          totalXP: prev.totalXP + xpEarned,
          totalStars: prev.totalStars + starsEarned,
          recentSongs: [
            songId,
            ...prev.recentSongs.filter(id => id !== songId)
          ].slice(0, 10)
        };
      }
      return prev;
    });
  }, [childId]);

  const toggleFavorite = useCallback((songId) => {
    setProgress(prev => {
      const favorites = prev.favorites.includes(songId)
        ? prev.favorites.filter(id => id !== songId)
        : [...prev.favorites, songId];
      
      return {
        ...prev,
        favorites
      };
    });
  }, []);

  const saveRecording = useCallback((songId, recordingId) => {
    setProgress(prev => ({
      ...prev,
      recordedSongs: {
        ...prev.recordedSongs,
        [songId]: recordingId
      }
    }));
  }, []);

  const addTimeSpent = useCallback((songId, seconds) => {
    setProgress(prev => ({
      ...prev,
      timeSpent: {
        ...prev.timeSpent,
        [songId]: (prev.timeSpent[songId] || 0) + seconds
      },
      totalTime: prev.totalTime + seconds
    }));
  }, []);

  const isPlayed = useCallback((songId) => {
    return progress?.played.includes(songId) || false;
  }, [progress]);

  const isCompleted = useCallback((songId) => {
    return progress?.completed.includes(songId) || false;
  }, [progress]);

  const isFavorited = useCallback((songId) => {
    return progress?.favorites.includes(songId) || false;
  }, [progress]);

  const getPlayCount = useCallback((songId) => {
    return progress?.timesPlayed[songId] || 0;
  }, [progress]);

  const getCompletionPercentage = useCallback(() => {
    if (!progress) return 0;
    const total = MUSIC_LIBRARY.length;
    const completed = progress.completed.length;
    return Math.round((completed / total) * 100);
  }, [progress]);

  const getCategoryProgress = useCallback((category) => {
    if (!progress) return 0;
    const categorySongs = MUSIC_LIBRARY.filter(s => s.category === category);
    const completedInCategory = categorySongs.filter(s => progress.completed.includes(s.id));
    return Math.round((completedInCategory.length / categorySongs.length) * 100);
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress({
      played: [],
      completed: [],
      favorites: [],
      timesPlayed: {},
      timeSpent: {},
      lastPlayed: null,
      totalTime: 0,
      recentSongs: [],
      recordedSongs: {},
      streakDays: [],
      totalXP: 0,
      totalStars: 0
    });
  }, []);

  return {
    progress,
    recordPlay,
    markCompleted,
    toggleFavorite,
    saveRecording,
    addTimeSpent,
    isPlayed,
    isCompleted,
    isFavorited,
    getPlayCount,
    getCompletionPercentage,
    getCategoryProgress,
    resetProgress
  };
};