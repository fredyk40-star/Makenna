/**
 * NumbersProgressService - canonical progress model for Numbers Kingdom.
 *
 * Records live inside the active child account under `numbers_progress`, so
 * every write flows through ChildAccountService's cloud-sync queue. Legacy
 * boolean/array records are upgraded in place without losing favorites or time.
 */
import { NUMBERS_DATA } from '../data/numbersData';
import { StorageService } from './StorageService';

export const NUMBERS_PROGRESS_KEY = 'numbers_progress';

export const NUMBER_SKILLS = [
  'recognition',
  'counting',
  'word',
  'listening',
  'writing',
  'story',
];

export const CORE_NUMBER_SKILLS = ['recognition', 'counting', 'word'];
export const MASTERY_NUMBER_SKILLS = ['recognition', 'counting', 'word', 'writing'];

const VALID_NUMBER_IDS = new Set(NUMBERS_DATA.map(number => String(number.id)));

const arrayOrEmpty = value => (Array.isArray(value) ? value : []);
const objectOrEmpty = value => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);
const clampPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(100, Math.max(0, Math.round(number)));
};
const nonNegativeInt = (value) => Math.max(0, Math.round(Number(value) || 0));
const asString = value => (value == null ? '' : String(value));

const validNumberIds = (value) => [...new Set(
  arrayOrEmpty(value).map(asString).filter(id => VALID_NUMBER_IDS.has(id))
)];

const normalizeSkillRecord = (value) => {
  if (typeof value === 'boolean') {
    return value
      ? { completed: true, attempts: 1, accuracy: null, lastPracticed: null }
      : null;
  }
  if (typeof value === 'number') {
    return value > 0
      ? { completed: true, attempts: nonNegativeInt(value), accuracy: null, lastPracticed: null }
      : null;
  }

  const record = objectOrEmpty(value);
  if (!Object.keys(record).length) return null;

  return {
    completed: record.completed === undefined
      ? nonNegativeInt(record.attempts) > 0
      : (record.completed === true || Number(record.completed) > 0),
    attempts: nonNegativeInt(record.attempts),
    accuracy: clampPercent(record.accuracy),
    lastPracticed: record.lastPracticed || null,
  };
};

const normalizeGameRecord = (value) => {
  const record = objectOrEmpty(value);
  if (!Object.keys(record).length) return null;
  return {
    completed: record.completed === true || Number(record.completed) > 0,
    attempts: nonNegativeInt(record.attempts),
    bestScore: clampPercent(record.bestScore) ?? 0,
    bestStars: Math.min(5, nonNegativeInt(record.bestStars)),
    lastPlayed: record.lastPlayed || null,
  };
};

export const normalizeNumbersProgress = (raw = {}) => {
  const source = objectOrEmpty(raw);
  const skills = objectOrEmpty(source.skills);
  const timeSpent = objectOrEmpty(source.timeSpent);

  const normalizedSkills = Object.keys(skills).reduce((result, numberId) => {
    if (!VALID_NUMBER_IDS.has(asString(numberId))) return result;
    const numberSkills = objectOrEmpty(skills[numberId]);
    const entries = NUMBER_SKILLS.reduce((numberResult, skill) => {
      const record = normalizeSkillRecord(numberSkills[skill]);
      if (record) numberResult[skill] = record;
      return numberResult;
    }, {});
    if (Object.keys(entries).length) result[asString(numberId)] = entries;
    return result;
  }, {});

  const normalizedGames = Object.keys(objectOrEmpty(source.games)).reduce((result, gameId) => {
    const record = normalizeGameRecord(source.games[gameId]);
    if (record) result[asString(gameId)] = record;
    return result;
  }, {});

  const normalizedTime = Object.keys(timeSpent).reduce((result, numberId) => {
    if (!VALID_NUMBER_IDS.has(asString(numberId))) return result;
    result[asString(numberId)] = nonNegativeInt(timeSpent[numberId]);
    return result;
  }, {});

  const favorites = validNumberIds([
    ...arrayOrEmpty(source.favorites),
    ...arrayOrEmpty(source.favoriteNumbers),
  ]);
  const assessment = objectOrEmpty(source.assessment);

  return {
    opened: validNumberIds(source.opened),
    completed: validNumberIds(source.completed),
    favorites,
    mastered: validNumberIds(source.mastered),
    timeSpent: normalizedTime,
    lastVisited: source.lastVisited || null,
    totalTime: nonNegativeInt(source.totalTime),
    recentLessons: validNumberIds(source.recentLessons),
    skills: normalizedSkills,
    games: normalizedGames,
    stories: arrayOrEmpty(source.stories).map(asString),
    favoriteGames: arrayOrEmpty(source.favoriteGames).map(asString),
    favoriteStories: arrayOrEmpty(source.favoriteStories).map(asString),
    lastSkill: source.lastSkill && typeof source.lastSkill === 'object'
      ? {
        numberId: asString(source.lastSkill.numberId) || asString(source.lastSkill.letterId) || null,
        skill: asString(source.lastSkill.skill) || null,
        at: source.lastSkill.at || null,
        accuracy: clampPercent(source.lastSkill.accuracy),
      }
      : null,
    assessment: Object.keys(assessment).length
      ? {
        percentage: clampPercent(assessment.percentage) ?? 0,
        level: asString(assessment.level) || null,
        correct: nonNegativeInt(assessment.correct),
        total: nonNegativeInt(assessment.total),
        at: assessment.at || null,
        weakestNumbers: arrayOrEmpty(assessment.weakestNumbers).map(asString),
      }
      : null,
  };
};

export const readStoredNumbersProgress = (childId) => {
  if (!childId) return normalizeNumbersProgress();
  const accounts = StorageService.get('makenna_child_accounts_v2', []);
  const account = accounts.find(a => a.childId?.toLowerCase() === String(childId).toLowerCase());
  return normalizeNumbersProgress(account?.progress?.[NUMBERS_PROGRESS_KEY]);
};

export const getNumberSkills = (progress, numberId) => (
  normalizeNumbersProgress(progress).skills[asString(numberId)] || {}
);

export const isSkillComplete = (progress, numberId, skill) => {
  const record = getNumberSkills(progress, numberId)[toSkillName(skill) || skill];
  // An attempted-but-wrong quick-check answer must not count as a learned skill.
  return record?.completed === true;
};

export const getNumberSkillCount = (progress, numberId) => (
  NUMBER_SKILLS.filter(skill => isSkillComplete(progress, numberId, skill)).length
);

export const getNumberSkillPercent = (progress, numberId) => (
  Math.round((getNumberSkillCount(progress, numberId) / NUMBER_SKILLS.length) * 100)
);

export const isNumberCompletedBySkills = (progress, numberId) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(numberId);
  return normalized.completed.includes(id)
    || CORE_NUMBER_SKILLS.every(skill => isSkillComplete(normalized, id, skill));
};

export const isNumberMasteredBySkills = (progress, numberId) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(numberId);
  return normalized.mastered.includes(id)
    || MASTERY_NUMBER_SKILLS.every(skill => isSkillComplete(normalized, id, skill));
};

export const getSkillCompletionPercentage = (progress) => {
  const normalized = normalizeNumbersProgress(progress);
  const total = NUMBERS_DATA.length || 21;
  const completed = NUMBERS_DATA.filter(number => (
    isNumberCompletedBySkills(normalized, number.id)
  )).length;
  return Math.round((completed / total) * 100);
};

export const getCompletionCount = (progress) => (
  NUMBERS_DATA.filter(number => isNumberCompletedBySkills(progress, number.id)).length
);

export const getMasteryCount = (progress) => (
  NUMBERS_DATA.filter(number => isNumberMasteredBySkills(progress, number.id)).length
);

export const toSkillName = (mode) => {
  const aliases = {
    'word-match': 'word',
    'word_match': 'word',
    speak: 'word',
    pronunciation: 'word',
    trace: 'writing',
    write: 'writing',
    handwriting: 'writing',
    count: 'counting',
    recognise: 'recognition',
    recognize: 'recognition',
    numeral: 'recognition',
    listen: 'listening',
    read: 'story',
  };
  const skill = aliases[mode] || mode;
  return NUMBER_SKILLS.includes(skill) ? skill : null;
};

export const markSkillInProgress = (progress, numberId, skill, options = {}) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(numberId);
  const skillName = toSkillName(skill);
  if (!VALID_NUMBER_IDS.has(id) || !skillName) return normalized;

  const config = typeof options === 'boolean' || typeof options === 'number'
    ? { completed: options !== false && options !== 0 }
    : objectOrEmpty(options);
  const previous = normalized.skills[id]?.[skillName] || {
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
      [id]: {
        ...(normalized.skills[id] || {}),
        [skillName]: record,
      },
    },
    lastVisited: at,
    lastSkill: {
      numberId: id,
      skill: skillName,
      at,
      accuracy: record.accuracy,
    },
  };
};

export const withCoreCompletion = (progress, numberId) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(numberId);
  if (!id || !isNumberCompletedBySkills(normalized, id)) return normalized;

  return {
    ...normalized,
    completed: normalized.completed.includes(id)
      ? normalized.completed
      : [...normalized.completed, id],
    recentLessons: [id, ...normalized.recentLessons.filter(item => item !== id)].slice(0, 10),
  };
};

export const withMasteryCompletion = (progress, numberId) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(numberId);
  if (!id || !isNumberMasteredBySkills(normalized, id)) return normalized;

  return {
    ...normalized,
    mastered: normalized.mastered.includes(id)
      ? normalized.mastered
      : [...normalized.mastered, id],
  };
};

export const recordGameResult = (progress, gameId, result = {}) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(gameId);
  if (!id) return normalized;
  const previous = normalized.games[id] || {
    completed: false,
    attempts: 0,
    bestScore: 0,
    bestStars: 0,
    lastPlayed: null,
  };
  const at = result.at || new Date().toISOString();

  return {
    ...normalized,
    games: {
      ...normalized.games,
      [id]: {
        completed: true,
        attempts: previous.attempts + 1,
        bestScore: Math.max(previous.bestScore, clampPercent(result.score) ?? 0),
        bestStars: Math.max(previous.bestStars, Math.min(5, nonNegativeInt(result.stars))),
        lastPlayed: at,
      },
    },
    lastVisited: at,
  };
};

export const recordStoryCompletion = (progress, storyId, numberId = null) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(storyId);
  if (!id) return normalized;

  let next = {
    ...normalized,
    stories: [...new Set([...normalized.stories, id])],
    lastVisited: new Date().toISOString(),
  };
  if (numberId != null) {
    next = markSkillInProgress(next, numberId, 'story', { completed: true, attempts: 1 });
  }
  return next;
};

export const recordAssessmentResult = (progress, results = {}) => {
  const normalized = normalizeNumbersProgress(progress);
  return {
    ...normalized,
    assessment: {
      percentage: clampPercent(results.percentage) ?? 0,
      level: asString(results.level) || null,
      correct: nonNegativeInt(results.correct),
      total: nonNegativeInt(results.total),
      at: results.at || new Date().toISOString(),
      weakestNumbers: arrayOrEmpty(results.weakestNumbers).map(asString),
    },
  };
};

const toggleInList = (list, id) => (
  list.includes(id) ? list.filter(item => item !== id) : [...list, id]
);

export const toggleFavoriteGame = (progress, gameId) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(gameId);
  if (!id) return normalized;
  return { ...normalized, favoriteGames: toggleInList(normalized.favoriteGames, id) };
};

export const toggleFavoriteStory = (progress, storyId) => {
  const normalized = normalizeNumbersProgress(progress);
  const id = asString(storyId);
  if (!id) return normalized;
  return { ...normalized, favoriteStories: toggleInList(normalized.favoriteStories, id) };
};

export const getNextNumber = (progress) => (
  NUMBERS_DATA.find(number => !isNumberCompletedBySkills(progress, number.id))?.id || null
);

export default {
  NUMBERS_PROGRESS_KEY,
  NUMBER_SKILLS,
  CORE_NUMBER_SKILLS,
  MASTERY_NUMBER_SKILLS,
  normalizeNumbersProgress,
  readStoredNumbersProgress,
  getNumberSkills,
  isSkillComplete,
  getNumberSkillCount,
  getNumberSkillPercent,
  isNumberCompletedBySkills,
  isNumberMasteredBySkills,
  getSkillCompletionPercentage,
  getCompletionCount,
  getMasteryCount,
  toSkillName,
  markSkillInProgress,
  withCoreCompletion,
  withMasteryCompletion,
  recordGameResult,
  recordStoryCompletion,
  recordAssessmentResult,
  toggleFavoriteGame,
  toggleFavoriteStory,
  getNextNumber,
};
