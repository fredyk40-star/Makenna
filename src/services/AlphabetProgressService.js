/**
 * AlphabetProgressService - pure progress model for the alphabet curriculum.
 *
 * Progress is stored inside the active child account so it survives reloads and
 * syncs through the serverless cloud queue. These helpers keep the shape stable
 * while older local records are upgraded in place.
 */
import { ALPHABET_DATA } from '../data/alphabetData';
import { StorageService } from './StorageService';

export const ALPHABET_PROGRESS_KEY = 'alphabet_progress';

export const ALPHABET_SKILLS = [
  'letter',
  'sound',
  'word',
  'sentence',
  'wordWithSound',
  'listening',
  'trace',
];

export const CORE_ALPHABET_SKILLS = [
  'letter',
  'sound',
  'word',
  'sentence',
  'wordWithSound',
];

const arrayOrEmpty = value => (Array.isArray(value) ? value : []);
const objectOrEmpty = value => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);
const clampPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(100, Math.max(0, Math.round(number)));
};

const normalizeSkillRecord = (value) => {
  if (typeof value === 'boolean') {
    return value
      ? { completed: true, attempts: 1, accuracy: null, lastPracticed: null }
      : null;
  }
  if (typeof value === 'number') {
    return value > 0
      ? { completed: true, attempts: Math.round(value), accuracy: null, lastPracticed: null }
      : null;
  }

  const record = objectOrEmpty(value);
  if (!Object.keys(record).length) return null;

  return {
    completed: record.completed === true || Number(record.completed) > 0,
    attempts: Math.max(0, Math.round(Number(record.attempts) || 0)),
    accuracy: clampPercent(record.accuracy),
    lastPracticed: record.lastPracticed || null,
  };
};

export const normalizeAlphabetProgress = (raw = {}) => {
  const source = objectOrEmpty(raw);
  const favorites = objectOrEmpty(source.favorites);
  const skills = objectOrEmpty(source.skills);
  const normalizedSkills = Object.keys(skills).reduce((result, letterId) => {
    const letterSkills = objectOrEmpty(skills[letterId]);
    const entries = ALPHABET_SKILLS.reduce((letters, skill) => {
      const record = normalizeSkillRecord(letterSkills[skill]);
      if (record) letters[skill] = record;
      return letters;
    }, {});
    if (Object.keys(entries).length) result[letterId] = entries;
    return result;
  }, {});

  return {
    opened: arrayOrEmpty(source.opened),
    completed: arrayOrEmpty(source.completed),
    favorites: {
      letters: arrayOrEmpty(favorites.letters),
      words: arrayOrEmpty(favorites.words),
    },
    timeSpent: objectOrEmpty(source.timeSpent),
    lastVisited: source.lastVisited || null,
    totalTime: Math.max(0, Math.round(Number(source.totalTime) || 0)),
    recentLessons: arrayOrEmpty(source.recentLessons),
    skills: normalizedSkills,
    lastSkill: source.lastSkill && typeof source.lastSkill === 'object'
      ? {
        letterId: source.lastSkill.letterId || null,
        skill: source.lastSkill.skill || null,
        at: source.lastSkill.at || null,
        accuracy: clampPercent(source.lastSkill.accuracy),
      }
      : null,
  };
};

export const readStoredAlphabetProgress = (childId) => {
  if (!childId) return normalizeAlphabetProgress();
  const accounts = StorageService.get('makenna_child_accounts_v2', []);
  const account = accounts.find(a => a.childId?.toLowerCase() === String(childId).toLowerCase());
  return normalizeAlphabetProgress(account?.progress?.[ALPHABET_PROGRESS_KEY]);
};

export const getLetterSkills = (progress, letterId) => (
  normalizeAlphabetProgress(progress).skills[letterId] || {}
);

export const isSkillComplete = (progress, letterId, skill) => {
  const record = getLetterSkills(progress, letterId)[skill];
  if (!record) return false;
  return record.completed === true || record.attempts > 0;
};

export const getLetterSkillCount = (progress, letterId) => (
  ALPHABET_SKILLS.filter(skill => isSkillComplete(progress, letterId, skill)).length
);

export const getLetterSkillPercent = (progress, letterId) => (
  Math.round((getLetterSkillCount(progress, letterId) / ALPHABET_SKILLS.length) * 100)
);

export const isLetterMastered = (progress, letterId) => (
  CORE_ALPHABET_SKILLS.every(skill => isSkillComplete(progress, letterId, skill))
);

export const getSkillCompletionPercentage = (progress) => {
  const normalized = normalizeAlphabetProgress(progress);
  const letters = ALPHABET_DATA.length || 26;
  const mastered = ALPHABET_DATA.filter(letter => isLetterMastered(normalized, letter.id)).length;
  return Math.round((mastered / letters) * 100);
};

export const toSkillName = (mode) => {
  const aliases = {
    'word-with-sound': 'wordWithSound',
    'word_with_sound': 'wordWithSound',
    pronunciation: 'word',
    speaking: 'letter',
  };
  const skill = aliases[mode] || mode;
  return ALPHABET_SKILLS.includes(skill) ? skill : null;
};

export const markSkillInProgress = (progress, letterId, skill, options = {}) => {
  const normalized = normalizeAlphabetProgress(progress);
  const skillName = toSkillName(skill);
  if (!letterId || !skillName) return normalized;

  const config = typeof options === 'boolean' || typeof options === 'number'
    ? { completed: options !== false && options !== 0 }
    : objectOrEmpty(options);
  const previous = normalized.skills[letterId]?.[skillName] || {
    completed: false,
    attempts: 0,
    accuracy: null,
    lastPracticed: null,
  };
  const requestedAttempts = Math.max(0, Math.round(Number(config.attempts ?? 1) || 0));
  const requestedAccuracy = clampPercent(config.accuracy);
  const completed = config.completed !== false || previous.completed;
  const at = config.at || new Date().toISOString();

  const record = {
    completed,
    attempts: previous.attempts + requestedAttempts,
    accuracy: requestedAccuracy == null
      ? previous.accuracy
      : Math.max(previous.accuracy || 0, requestedAccuracy),
    lastPracticed: at,
  };

  return {
    ...normalized,
    skills: {
      ...normalized.skills,
      [letterId]: {
        ...(normalized.skills[letterId] || {}),
        [skillName]: record,
      },
    },
    lastVisited: at,
    lastSkill: {
      letterId,
      skill: skillName,
      at,
      accuracy: record.accuracy,
    },
  };
};

export const withCoreCompletion = (progress, letterId) => {
  const normalized = normalizeAlphabetProgress(progress);
  if (!letterId || !isLetterMastered(normalized, letterId)) return normalized;
  if (normalized.completed.includes(letterId)) return normalized;

  return {
    ...normalized,
    completed: [...normalized.completed, letterId],
    recentLessons: [letterId, ...normalized.recentLessons.filter(id => id !== letterId)].slice(0, 10),
  };
};

export default {
  ALPHABET_PROGRESS_KEY,
  ALPHABET_SKILLS,
  CORE_ALPHABET_SKILLS,
  normalizeAlphabetProgress,
  readStoredAlphabetProgress,
  getLetterSkills,
  isSkillComplete,
  getLetterSkillCount,
  getLetterSkillPercent,
  isLetterMastered,
  getSkillCompletionPercentage,
  toSkillName,
  markSkillInProgress,
  withCoreCompletion,
};
