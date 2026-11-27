import { useCallback, useEffect, useRef, useState } from 'react';
import { useChildAccount } from '../context/ChildAccountContext';
import { ChildAccountService } from '../services/ChildAccountService';
import { AnalyticsService } from '../services/AnalyticsService';
import { NUMBERS_DATA } from '../data/numbersData';
import {
  NUMBERS_PROGRESS_KEY,
  getCompletionCount,
  getMasteryCount,
  getNextNumber,
  getNumberSkillCount,
  getNumberSkillPercent,
  getNumberSkills,
  getSkillCompletionPercentage,
  isNumberCompletedBySkills,
  isNumberMasteredBySkills,
  isSkillComplete,
  markSkillInProgress,
  normalizeNumbersProgress,
  recordAssessmentResult,
  recordGameResult,
  recordStoryCompletion,
  toggleFavoriteGame as toggleFavoriteGameInProgress,
  toggleFavoriteStory as toggleFavoriteStoryInProgress,
  withCoreCompletion,
  withMasteryCompletion,
} from '../services/NumbersProgressService';

const TOTAL_NUMBERS = NUMBERS_DATA.length || 21;
const emptyProgress = () => normalizeNumbersProgress();

const readCurrentProgress = (childId) => {
  const source = childId
    ? ChildAccountService.getChild(childId)?.progress?.[NUMBERS_PROGRESS_KEY]
    : null;
  return normalizeNumbersProgress(source);
};

export const useNumbersProgress = () => {
  const { activeChild, childId, updateChild } = useChildAccount();
  const [progress, setProgress] = useState(() => readCurrentProgress(childId));
  const progressRef = useRef(progress);
  const childIdRef = useRef(childId);
  const updateChildRef = useRef(updateChild);

  useEffect(() => {
    childIdRef.current = childId;
    updateChildRef.current = updateChild;
  }, [childId, updateChild]);

  const applyProgress = useCallback((next) => {
    const normalized = normalizeNumbersProgress(next);
    progressRef.current = normalized;
    setProgress(normalized);

    const targetId = childIdRef.current || ChildAccountService.getActiveChildId();
    if (!targetId) return normalized;

    const account = ChildAccountService.getChild(targetId);
    const updates = {
      progress: {
        ...(account?.progress || {}),
        [NUMBERS_PROGRESS_KEY]: normalized,
      },
    };

    // Context keeps the UI in sync; the service queues the automatic cloud sync.
    if (updateChildRef.current) {
      updateChildRef.current(updates);
    } else {
      ChildAccountService.updateChild(targetId, updates);
    }
    return normalized;
  }, []);

  // Reload when another component (or a cloud sync) changes the active child.
  useEffect(() => {
    const stored = readCurrentProgress(childId);
    progressRef.current = stored;
    setProgress(stored);
  }, [childId, activeChild?.progress?.[NUMBERS_PROGRESS_KEY]]);

  const update = useCallback((updater) => {
    // Base sequential writes on the latest in-memory progress. Re-reading the
    // account here can lose an earlier write made in the same event loop tick.
    const base = normalizeNumbersProgress(progressRef.current);
    const next = typeof updater === 'function' ? updater(base) : updater;
    return applyProgress(next);
  }, [applyProgress]);

  const markOpened = useCallback((id) => {
    if (progressRef.current.opened.includes(String(id))) return;
    update(prev => ({
      ...prev,
      opened: [...prev.opened, String(id)],
      lastVisited: new Date().toISOString(),
    }));
  }, [update]);

  const markCompleted = useCallback((id) => {
    const safeId = String(id);
    const wasCompleted = progressRef.current.completed.includes(safeId);
    update(prev => {
      const withCore = withCoreCompletion(prev, safeId);
      return {
        ...withCore,
        completed: withCore.completed.includes(safeId)
          ? withCore.completed
          : [...withCore.completed, safeId],
        recentLessons: [safeId, ...withCore.recentLessons.filter(item => item !== safeId)].slice(0, 10),
      };
    });
    if (!wasCompleted) AnalyticsService.trackLessonComplete('numbers', safeId, 100);
  }, [update]);

  const markMastered = useCallback((id) => {
    update(prev => {
      const safeId = String(id);
      const withMastery = withMasteryCompletion(prev, safeId);
      return {
        ...withMastery,
        mastered: withMastery.mastered.includes(safeId)
          ? withMastery.mastered
          : [...withMastery.mastered, safeId],
      };
    });
  }, [update]);

  /** Record a practiced skill. Core skills also unlock lesson completion. */
  const markSkill = useCallback((id, skill, options = true) => {
    const correct = typeof options === 'object' && options !== null
      ? options.completed !== false
      : options !== false && options !== 0;
    update(prev => {
      const withSkill = markSkillInProgress(prev, id, skill, options);
      return withMasteryCompletion(withCoreCompletion(withSkill, id), id);
    });
    AnalyticsService.trackAnswer(`${id}:${skill}`, correct, 'numbers');
  }, [update]);

  const toggleFavorite = useCallback((id) => {
    update(prev => {
      const safeId = String(id);
      const favorites = prev.favorites.includes(safeId)
        ? prev.favorites.filter(item => item !== safeId)
        : [...prev.favorites, safeId];
      return { ...prev, favorites };
    });
  }, [update]);

  const toggleFavoriteGame = useCallback((gameId) => {
    update(prev => toggleFavoriteGameInProgress(prev, gameId));
  }, [update]);

  const toggleFavoriteStory = useCallback((storyId) => {
    update(prev => toggleFavoriteStoryInProgress(prev, storyId));
  }, [update]);

  const addTimeSpent = useCallback((id, seconds) => {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    if (!safeSeconds) return;
    update(prev => ({
      ...prev,
      timeSpent: {
        ...prev.timeSpent,
        [String(id)]: (prev.timeSpent[String(id)] || 0) + safeSeconds,
      },
      totalTime: prev.totalTime + safeSeconds,
    }));
  }, [update]);

  const saveGameResult = useCallback((gameId, result = {}) => {
    update(prev => recordGameResult(prev, gameId, result));
  }, [update]);

  const completeStory = useCallback((storyId, numberId = null) => {
    update(prev => recordStoryCompletion(prev, storyId, numberId));
  }, [update]);

  const saveAssessmentResult = useCallback((results = {}) => {
    update(prev => recordAssessmentResult(prev, results));
  }, [update]);

  const resetProgress = useCallback(() => applyProgress(emptyProgress()), [applyProgress]);

  return {
    progress,
    markOpened,
    markCompleted,
    markMastered,
    markSkill,
    toggleFavorite,
    toggleFavoriteGame,
    toggleFavoriteStory,
    addTimeSpent,
    saveGameResult,
    completeStory,
    saveAssessmentResult,
    resetProgress,
    isNumberOpened: id => progress.opened.includes(String(id)),
    isNumberCompleted: id => isNumberCompletedBySkills(progress, id),
    isNumberMastered: id => isNumberMasteredBySkills(progress, id),
    isNumberFavorited: id => progress.favorites.includes(String(id)),
    isSkillComplete: (id, skill) => isSkillComplete(progress, id, skill),
    getNumberSkills: id => getNumberSkills(progress, id),
    getNumberSkillCount: id => getNumberSkillCount(progress, id),
    getNumberSkillPercent: id => getNumberSkillPercent(progress, id),
    getCompletionCount: () => getCompletionCount(progress),
    getMasteryCount: () => getMasteryCount(progress),
    getCompletionPercentage: () => (
      Math.round((getCompletionCount(progress) / TOTAL_NUMBERS) * 100)
    ),
    getMasteryPercentage: () => (
      Math.round((getMasteryCount(progress) / TOTAL_NUMBERS) * 100)
    ),
    getSkillCompletionPercentage: () => getSkillCompletionPercentage(progress),
    getNextNumber: () => getNextNumber(progress),
    getRecentLessons: () => progress.recentLessons,
    getFavoriteNumbers: () => progress.favorites,
    getGameProgress: gameId => progress.games[String(gameId)] || null,
    isGameFavorited: gameId => progress.favoriteGames.includes(String(gameId)),
    isStoryFavorited: storyId => progress.favoriteStories.includes(String(storyId)),
    isStoryCompleted: storyId => progress.stories.includes(String(storyId)),
    getAssessmentResult: () => progress.assessment,
    getProgress: () => progress,
  };
};

export default useNumbersProgress;
