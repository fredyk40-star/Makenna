import { useCallback, useEffect, useRef, useState } from 'react';
import { useChildAccount } from '../context/ChildAccountContext';
import { ChildAccountService } from '../services/ChildAccountService';
import { AnalyticsService } from '../services/AnalyticsService';
import { ALPHABET_DATA } from '../data/alphabetData';
import {
  ALPHABET_PROGRESS_KEY,
  getLetterSkillCount,
  getLetterSkillPercent,
  getSkillCompletionPercentage,
  isLetterMastered,
  isSkillComplete,
  markSkillInProgress,
  normalizeAlphabetProgress,
  withCoreCompletion,
} from '../services/AlphabetProgressService';

const emptyProgress = () => normalizeAlphabetProgress();

const readCurrentProgress = (childId) => {
  const source = childId
    ? ChildAccountService.getChild(childId)?.progress?.[ALPHABET_PROGRESS_KEY]
    : null;
  return normalizeAlphabetProgress(source);
};

export const useAlphabetProgress = () => {
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
    const normalized = normalizeAlphabetProgress(next);
    progressRef.current = normalized;
    setProgress(normalized);

    const targetId = childIdRef.current || ChildAccountService.getActiveChildId();
    if (!targetId) return normalized;

    const account = ChildAccountService.getChild(targetId);
    const updates = {
      progress: {
        ...(account?.progress || {}),
        [ALPHABET_PROGRESS_KEY]: normalized,
      },
    };

    // Context keeps the UI in sync; the service queues the serverless sync.
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
  }, [childId, activeChild?.progress?.[ALPHABET_PROGRESS_KEY]]);

  const update = useCallback((updater) => {
    const base = readCurrentProgress(childIdRef.current || ChildAccountService.getActiveChildId());
    const next = typeof updater === 'function' ? updater(base) : updater;
    return applyProgress(next);
  }, [applyProgress]);

  const markOpened = useCallback((id) => {
    if (progressRef.current.opened.includes(id)) return;
    update(prev => ({
      ...prev,
      opened: [...prev.opened, id],
      lastVisited: new Date().toISOString(),
    }));
  }, [update]);

  const markCompleted = useCallback((id) => {
    const wasCompleted = progressRef.current.completed.includes(id);
    update(prev => {
      const completed = prev.completed.includes(id)
        ? prev.completed
        : [...prev.completed, id];
      const next = withCoreCompletion({
        ...prev,
        completed,
        recentLessons: [id, ...prev.recentLessons.filter(item => item !== id)].slice(0, 10),
      }, id);
      return next;
    });
    if (!wasCompleted) AnalyticsService.trackLessonComplete('alphabet', id, 100);
  }, [update]);

  /** Record a practiced skill. Core skills also unlock lesson completion. */
  const markSkill = useCallback((id, skill, options = true) => {
    const correct = typeof options === 'object' && options !== null
      ? options.completed !== false
      : options !== false && options !== 0;
    update(prev => withCoreCompletion(
      markSkillInProgress(prev, id, skill, options),
      id,
    ));
    AnalyticsService.trackAnswer(`${id}:${skill}`, correct, 'alphabet');
  }, [update]);

  const toggleFavoriteLetter = useCallback((id) => {
    update(prev => {
      const favorites = prev.favorites.letters.includes(id)
        ? prev.favorites.letters.filter(item => item !== id)
        : [...prev.favorites.letters, id];
      return { ...prev, favorites: { ...prev.favorites, letters: favorites } };
    });
  }, [update]);

  const toggleFavoriteWord = useCallback((wordId, id) => {
    update(prev => {
      const key = `${id}:${wordId}`;
      const favorites = prev.favorites.words.includes(key)
        ? prev.favorites.words.filter(item => item !== key)
        : [...prev.favorites.words, key];
      return { ...prev, favorites: { ...prev.favorites, words: favorites } };
    });
  }, [update]);

  const addTimeSpent = useCallback((id, seconds) => {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    if (!safeSeconds) return;
    update(prev => ({
      ...prev,
      timeSpent: {
        ...prev.timeSpent,
        [id]: (prev.timeSpent[id] || 0) + safeSeconds,
      },
      totalTime: prev.totalTime + safeSeconds,
    }));
  }, [update]);

  const resetProgress = useCallback(() => applyProgress(emptyProgress()), [applyProgress]);

  return {
    progress,
    markOpened,
    markCompleted,
    markSkill,
    toggleFavoriteLetter,
    toggleFavoriteWord,
    addTimeSpent,
    resetProgress,
    isLetterOpened: id => progress.opened.includes(id),
    isLetterCompleted: id => progress.completed.includes(id),
    isLetterFavorited: id => progress.favorites.letters.includes(id),
    isWordFavorited: (wordId, id) => progress.favorites.words.includes(`${id}:${wordId}`),
    isSkillComplete: (id, skill) => isSkillComplete(progress, id, skill),
    getLetterSkillCount: id => getLetterSkillCount(progress, id),
    getLetterSkillPercent: id => getLetterSkillPercent(progress, id),
    isLetterMastered: id => isLetterMastered(progress, id),
    getProgress: () => progress,
    getCompletionPercentage: () => (
      Math.round((progress.completed.length / (ALPHABET_DATA.length || 26)) * 100)
    ),
    getSkillCompletionPercentage: () => getSkillCompletionPercentage(progress),
    getRecentLessons: () => progress.recentLessons,
    getFavoriteLetters: () => progress.favorites.letters,
    getFavoriteWords: () => progress.favorites.words,
  };
};

export default useAlphabetProgress;
