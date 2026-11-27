import { useState, useEffect, useCallback } from 'react';
import { RecommendationService } from '../services/RecommendationService';
import { ChildAccountService } from '../services/ChildAccountService';
import { ALPHABET_DATA } from '../data/alphabetData';
import {
  isLetterMastered,
  normalizeAlphabetProgress,
} from '../services/AlphabetProgressService';
import { useProfiles } from '../context/ProfileContext';
import { useChildAccount } from '../context/ChildAccountContext';

export const useMastery = () => {
  const { getProfileData } = useProfiles();
  const { activeChild } = useChildAccount();
  const childId = activeChild?.childId || ChildAccountService.getActiveChildId();
  const [letterData, setLetterData] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [progressSummary, setProgressSummary] = useState({
    mastered: 0,
    total: 0,
    progress: 0,
  });

  useEffect(() => {
    const calculateMastery = (progress, tracing, games, reading) => {
      let score = 0;
      let total = 0;
      
      // Progress (opened/completed)
      if (progress.opened) { score += 10; total += 10; }
      if (progress.completed) { score += 15; total += 15; }
      
      // Tracing
      if (tracing.completed) { score += 15; total += 15; }
      if (tracing.accuracy) { score += (tracing.accuracy / 100) * 10; total += 10; }
      
      // Games
      if (games.completed) { score += 15; total += 15; }
      if (games.score) { score += (games.score / 100) * 10; total += 10; }
      
      // Reading
      if (reading.storyCompleted) { score += 10; total += 10; }
      if (reading.wordsLearned) { score += Math.min(reading.wordsLearned * 2, 15); total += 15; }
      
      return total > 0 ? Math.round((score / total) * 100) : 0;
    };

    // Load all letter data from localStorage
    const loadLetterData = () => {
      const data = {};
      const canonicalProgress = normalizeAlphabetProgress(
        childId ? ChildAccountService.getChild(childId)?.progress?.alphabet_progress : null
      );
      const legacyProgress = getProfileData('alphabet_progress', {});
      const tracingProgress = getProfileData('tracing_progress', {});

      for (const letter of ALPHABET_DATA) {
        const id = letter.id;

        const progress = {
          opened: canonicalProgress.opened.includes(id) || legacyProgress.opened?.includes(id),
          completed: canonicalProgress.completed.includes(id) || legacyProgress.completed?.includes(id),
        };

        const tracing = tracingProgress[id] || {};

        // Game progress is stored by game ID, not by letter ID. Keep legacy
        // per-letter keys as a fallback for older devices.
        const gameProgress = JSON.parse(localStorage.getItem('game_progress') || '{}');
        const legacyGames = JSON.parse(localStorage.getItem(`game_progress_${id}`) || '{}');
        const games = gameProgress[id] || gameProgress[letter.letter] || legacyGames;
        const reading = JSON.parse(localStorage.getItem(`reading_progress_${id}`) || '{}');

        data[id] = {
          letter: letter.letter,
          id: id,
          progress: progress,
          tracing: tracing,
          games: games,
          reading: reading,
          // Core alphabet skills are the source of truth for mastery.
          mastery: isLetterMastered(canonicalProgress, id)
            ? 100
            : calculateMastery(progress, tracing, games, reading),
        };
      }
      return data;
    };

    const data = loadLetterData();
    setLetterData(data);
    
    // No direct update to RecommendationService from useMastery is needed now,
    // as RecommendationService will pull data directly.

    // Get recommendations
    // The recommendation service needs the childId, not global profile data
    if (childId) {
      setRecommendations(RecommendationService.getRecommendations(childId));
    } else {
      setRecommendations([]);
    }

    // Progress summary for letters (if needed, otherwise rely on LearningAnalytics)
    const masteredCount = Object.values(data).filter(item => item.mastery >= 80).length;
    const totalLetters = Object.values(data).length;
    setProgressSummary({
      mastered: masteredCount,
      total: totalLetters,
      progress: totalLetters > 0 ? Math.round((masteredCount / totalLetters) * 100) : 0,
    });
  }, [childId, activeChild?.progress?.alphabet_progress, getProfileData]);

  const getLetterMastery = useCallback((letterId) => {
    return letterData[letterId]?.mastery || 0;
  }, [letterData]);

  const getLetterMasteryLevel = useCallback((letterId) => {
    const mastery = getLetterMastery(letterId);
    if (mastery >= 90) return 'Master';
    if (mastery >= 80) return 'Diamond';
    if (mastery >= 70) return 'Gold';
    if (mastery >= 50) return 'Silver';
    return 'Bronze';
  }, [getLetterMastery]);

  const getRecommendations = useCallback(() => {
    if (!childId) return [];
    return RecommendationService.getRecommendations(childId);
  }, [childId]);

  const getNextActivity = useCallback(() => {
    if (!childId) return null;
    const childRecommendations = RecommendationService.getRecommendations(childId);
    return childRecommendations.length > 0 ? childRecommendations[0] : null;
  }, [childId]);

  const getProgressSummary = useCallback(() => {
    return progressSummary;
  }, [progressSummary]);

  const getOverallProgress = useCallback(() => {
    if (!progressSummary) return 0;
    return progressSummary.progress;
  }, [progressSummary]);

  const isAllLettersMastered = useCallback(() => {
    if (!progressSummary) return false;
    return progressSummary.mastered === progressSummary.total && progressSummary.total > 0;
  }, [progressSummary]);

  const getLettersByMastery = useCallback((level) => {
    const letters = [];
    for (const [id, data] of Object.entries(letterData)) {
      if (data.mastery >= 80) {
        if (level === 'mastered') letters.push(id);
      } else if (data.mastery >= 40) {
        if (level === 'in-progress') letters.push(id);
      } else {
        if (level === 'needs-work') letters.push(id);
      }
    }
    return letters;
  }, [letterData]);

  return {
    letterData,
    recommendations,
    progressSummary,
    getLetterMastery,
    getLetterMasteryLevel,
    getRecommendations,
    getNextActivity,
    getProgressSummary,
    getOverallProgress,
    isAllLettersMastered,
    getLettersByMastery
  };
};