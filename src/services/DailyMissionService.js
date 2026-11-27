/**
 * Daily Mission Service - a guided 10-15 minute learning path.
 *
 * Each day gets a stable mission: review -> lesson -> game -> reward.
 * Steps are chosen from real progress data and point at real routes.
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';
import { LearningAnalytics } from './LearningAnalytics';
import { RevisionPlanner } from './RevisionPlanner';

const MISSION_KEY = 'makenna_daily_missions';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const SUBJECT_PATHS = {
  Alphabet: '/alphabet',
  Numbers: '/numbers',
  Maths: '/maths',
  Reading: '/reading/sight-words',
  Stories: '/stories',
  Shapes: '/shapes',
  Science: '/science-lab',
  Colours: '/colours',
};

const GAME_PATHS = {
  Alphabet: '/games/alphabet/letter-hunt',
  Numbers: '/numbers/games',
  Maths: '/maths/counting',
  Reading: '/reading/word-builder',
  Stories: '/stories',
  Shapes: '/games/shapes/shape-match',
  Science: '/science-lab',
  Colours: '/games/shapes/colour-picker',
};

export const REWARD_STARS = 30;
export const REWARD_XP = 20;

const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const previousDayKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/** Stable pseudo-random index, so a mission does not change on every render. */
const seedIndex = (seed, length) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  return hash % length;
};

const readStore = () => StorageService.get(MISSION_KEY, {});
const writeStore = (store) => StorageService.set(MISSION_KEY, store);

const buildSteps = (childId, dateKey) => {
  const stats = LearningAnalytics.getStats(childId);
  const weak = Object.entries(stats.mastery || {})
    .filter(([subject]) => SUBJECT_PATHS[subject])
    .sort((a, b) => a[1] - b[1]);
  const focus = weak.length > 0 && weak[0][1] < 80 ? weak[0][0] : 'Alphabet';
  const letter = ALPHABET[seedIndex(`${childId}-${dateKey}-letter`, ALPHABET.length)];
  const number = (seedIndex(`${childId}-${dateKey}-number`, 10)) + 1;
  const due = RevisionPlanner.getDueForRepetition(childId);
  const reviewItem = due[seedIndex(`${childId}-${dateKey}-review`, Math.max(due.length, 1))];

  return [
    {
      id: 'review',
      title: 'Quick Review',
      subtitle: 'Warm up with something you know',
      icon: '🔁',
      minutes: 3,
      subject: focus,
      path: focus === 'Numbers'
        ? `/numbers/trace/${number}`
        : `/alphabet/trace/${letter.toLowerCase()}`,
      reason: reviewItem ? `${reviewItem} is due for a refresh` : 'Keep your skills sharp',
    },
    {
      id: 'lesson',
      title: `${focus} Lesson`,
      subtitle: `Learn something new in ${focus}`,
      icon: focus === 'Numbers' ? '🔢' : '📚',
      minutes: 5,
      subject: focus,
      path: focus === 'Alphabet'
        ? `/alphabet/lesson/${letter.toLowerCase()}`
        : (SUBJECT_PATHS[focus] || SUBJECT_PATHS.Alphabet),
      reason: weak.length > 0 ? 'This is a great area to grow' : 'Try a new activity',
    },
    {
      id: 'game',
      title: 'Play a Game',
      subtitle: 'Practise through play',
      icon: '🎮',
      minutes: 5,
      subject: focus,
      path: GAME_PATHS[focus] || GAME_PATHS.Alphabet,
      reason: 'Playing helps it stick',
    },
    {
      id: 'reward',
      title: 'Claim Your Reward',
      subtitle: `${REWARD_STARS} stars for finishing`,
      icon: '🎁',
      minutes: 1,
      subject: 'Reward',
      path: null,
      reason: 'You earned it!',
    },
  ];
};

export class DailyMissionService {
  /** Get (and persist) today's mission, with any progress recorded so far. */
  static getMission(childId, date = todayKey()) {
    if (!childId) return null;

    const store = readStore();
    if (!store[childId]) {
      store[childId] = {};
    }
    if (!store[childId][date]) {
      store[childId][date] = {
        date,
        steps: buildSteps(childId, date),
        completed: [],
        rewardClaimed: false,
      };
      writeStore(store);
    }

    const mission = store[childId][date];
    // Guard against older/corrupt saved missions.
    if (!Array.isArray(mission.steps) || mission.steps.length === 0) {
      store[childId][date] = {
        date,
        steps: buildSteps(childId, date),
        completed: [],
        rewardClaimed: false,
      };
      writeStore(store);
      return store[childId][date];
    }

    return mission;
  }

  static completeStep(childId, stepId, date = todayKey()) {
    const mission = this.getMission(childId, date);
    if (!mission) return { success: false, reason: 'No child selected' };

    const step = mission.steps.find(item => item.id === stepId);
    if (!step) return { success: false, reason: 'Unknown step' };
    if (stepId === 'reward') return { success: false, reason: 'Claim the reward separately' };

    const store = readStore();
    const entry = store[childId][date];
    if (!entry.completed.includes(stepId)) {
      entry.completed = [...entry.completed, stepId];
      writeStore(store);
    }

    return { success: true, completed: entry.completed };
  }

  /** Mark the matching step when an activity elsewhere in the app finishes. */
  static recordActivity(childId, { subject, type = 'lesson', date = todayKey() } = {}) {
    const mission = this.getMission(childId, date);
    if (!mission || !subject) return { success: false, reason: 'No matching activity' };

    const stepId = type === 'game' ? 'game'
      : (type === 'review' ? 'review' : 'lesson');
    const step = mission.steps.find(item => item.id === stepId);
    if (!step || step.subject !== subject) return { success: false, reason: 'No matching step' };

    return this.completeStep(childId, stepId, date);
  }

  static getSummary(childId, date = todayKey()) {
    const mission = this.getMission(childId, date);
    if (!mission) return null;

    const learningSteps = mission.steps.filter(step => step.id !== 'reward');
    const completed = learningSteps.filter(step => mission.completed.includes(step.id)).length;

    return {
      date: mission.date,
      completed,
      total: learningSteps.length,
      percent: Math.round((completed / learningSteps.length) * 100),
      canClaim: completed === learningSteps.length && !mission.rewardClaimed,
      rewardClaimed: mission.rewardClaimed,
      steps: mission.steps,
    };
  }

  /** Award stars and XP exactly once per completed mission. */
  static claimReward(childId, date = todayKey()) {
    const summary = this.getSummary(childId, date);
    if (!summary) return { success: false, reason: 'No child selected' };
    if (!summary.canClaim) return { success: false, reason: 'Finish the mission first' };

    const store = readStore();
    const mission = store[childId][date];
    const previousKey = previousDayKey(date);
    const previous = store[childId][previousKey];

    const streak = previous?.rewardClaimed ? (previous.streak || 1) + 1 : 1;
    mission.rewardClaimed = true;
    mission.streak = streak;
    mission.completed = [...new Set([...mission.completed, 'reward'])];
    writeStore(store);

    const state = GamificationService.getState(childId);
    state.stars = (state.stars || 0) + REWARD_STARS;
    GamificationService.saveState(childId, state);
    GamificationService.addXP(childId, REWARD_XP, 'daily-mission');

    return { success: true, stars: REWARD_STARS, xp: REWARD_XP, streak };
  }

  static getStreak(childId) {
    const mission = this.getMission(childId);
    return mission?.streak || 0;
  }
}

export default DailyMissionService;
