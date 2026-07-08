import { useState, useEffect, useCallback } from 'react';
import { RecommendationService } from '../services/RecommendationService';
import { ALPHABET_DATA } from '../data/alphabetData';
import { useProfiles } from '../context/ProfileContext';

export const useMastery = () => {
  const { getProfileData, activeProfile } = useProfiles();
  const [letterData, setLetterData] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [progressSummary, setProgressSummary] = useState({
    mastered: 0,
    total: 0,
    progress: 0,
  });

  useEffect(() => {
    if (!activeProfile) return;

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
      const alphabetProgress = getProfileData('alphabet_progress', {});
      const tracingProgress = getProfileData('tracing_progress', {});

      for (const letter of ALPHABET_DATA) {
        const id = letter.id;
        
        const progress = {
          opened: alphabetProgress.opened?.includes(id),
          completed: alphabetProgress.completed?.includes(id),
        };
        
        const tracing = tracingProgress[id] || {};
        
        // TODO: Migrate game and reading progress to be profile-specific
        const games = JSON.parse(localStorage.getItem(`game_progress_${id}`) || '{}');
        const reading = JSON.parse(localStorage.getItem(`reading_progress_${id}`) || '{}');
        
        data[id] = {
          letter: letter.letter,
          id: id,
          progress: progress,
          tracing: tracing,
          games: games,
          reading: reading,
          mastery: calculateMastery(progress, tracing, games, reading)
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
    if (activeProfile?.childId) {
      const recs = RecommendationService.getRecommendations(activeProfile.childId);
      setRecommendations(recs);
    }

    // Progress summary for letters (if needed, otherwise rely on LearningAnalytics)
    const masteredCount = Object.values(data).filter(item => item.mastery >= 80).length;
    const totalLetters = Object.values(data).length;
    setProgressSummary({
      mastered: masteredCount,
      total: totalLetters,
      progress: totalLetters > 0 ? Math.round((masteredCount / totalLetters) * 100) : 0,
    });
  }, [activeProfile, getProfileData]);

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
    if (!activeProfile?.childId) return [];
    return RecommendationService.getRecommendations(activeProfile.childId);
  }, [activeProfile]);

  const getNextActivity = useCallback(() => {
    if (!activeProfile?.childId) return null;
    // Assuming RecommendationService will have a more specific getNextActivity
    const recommendations = RecommendationService.getRecommendations(activeProfile.childId);
    return recommendations.length > 0 ? recommendations[0] : null;
  }, [activeProfile]);

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