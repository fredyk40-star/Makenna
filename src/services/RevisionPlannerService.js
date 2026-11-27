/**
 * RevisionPlannerService - small offline-first SM-2 style spaced repetition.
 *
 * Cards are curriculum prompts (letter, number, shape, sight word, etc.).
 * Grades are 0-5: below 3 means "again", 3-5 means a successful recall.
 */
import { StorageService } from './StorageService';

const PLANNER_KEY = 'makenna_revision_planner_v1';
const MAX_HISTORY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('Revision planner listener failed:', error);
    }
  });
};

const readAll = () => {
  const data = StorageService.get(PLANNER_KEY, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
};

const writeAll = (all) => {
  if (!StorageService.set(PLANNER_KEY, all)) return false;
  notify();
  return true;
};

const getCards = (all, childId) => {
  if (!Array.isArray(all[childId]?.cards)) all[childId] = { cards: [] };
  return all[childId].cards;
};

const nextReview = (card, grade, now) => {
  const clampedGrade = Math.min(5, Math.max(0, Math.round(Number(grade) || 0)));
  const previousInterval = Math.max(1, Number(card.intervalDays) || 1);
  const ease = Math.max(1.3, Number(card.ease) || 2.5);

  if (clampedGrade < 3) {
    return {
      repetitions: 0,
      intervalDays: 1,
      ease: Math.max(1.3, ease - 0.2),
      dueAt: new Date(now.getTime() + DAY_MS).toISOString(),
    };
  }

  const repetitions = (Number(card.repetitions) || 0) + 1;
  const intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(previousInterval * ease);
  const nextEase = Math.max(
    1.3,
    ease + (0.1 - (5 - clampedGrade) * (0.08 + (5 - clampedGrade) * 0.02)),
  );

  return {
    repetitions,
    intervalDays,
    ease: Number(nextEase.toFixed(2)),
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
  };
};

export class RevisionPlannerService {
  static subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /** Add curriculum cards without duplicating existing ids. */
  static seed(childId, cards = []) {
    if (!childId || !Array.isArray(cards)) return 0;
    const all = readAll();
    const existing = getCards(all, childId);
    const knownIds = new Set(existing.map((card) => card.id));
    const now = new Date().toISOString();
    let added = 0;

    cards.forEach((card) => {
      if (!card?.id || knownIds.has(card.id)) return;
      existing.push({
        id: card.id,
        childId,
        subject: String(card.subject || 'general'),
        topic: String(card.topic || card.id),
        prompt: String(card.prompt || card.topic || card.id),
        answer: String(card.answer || ''),
        level: card.level || null,
        path: card.path || null,
        repetitions: 0,
        intervalDays: 0,
        ease: 2.5,
        dueAt: card.dueAt || now,
        lastReviewedAt: null,
        history: [],
      });
      knownIds.add(card.id);
      added += 1;
    });

    if (added > 0) writeAll(all);
    return added;
  }

  static list(childId) {
    if (!childId) return [];
    const all = readAll();
    return getCards(all, childId).map((card) => ({ ...card }));
  }

  static getDueCards(childId, now = new Date()) {
    const time = now.getTime();
    return this.list(childId)
      .filter((card) => new Date(card.dueAt).getTime() <= time)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }

  /** Build a short, ordered revision session limited by an estimated duration. */
  static buildPlan(childId, { minutes = 10, now = new Date() } = {}) {
    const due = this.getDueCards(childId, now);
    const limit = Math.max(1, Math.min(60, Number(minutes) || 10));
    return due.slice(0, limit).map((card, index) => ({
      ...card,
      order: index + 1,
      estimatedMinutes: 1,
    }));
  }

  static review(childId, cardId, grade) {
    if (!childId || !cardId) return null;
    const all = readAll();
    const card = getCards(all, childId).find((item) => item.id === cardId);
    if (!card) return null;

    const now = new Date();
    const result = nextReview(card, grade, now);
    Object.assign(card, result, {
      lastReviewedAt: now.toISOString(),
      history: [
        ...(Array.isArray(card.history) ? card.history : []),
        { reviewedAt: now.toISOString(), grade: Math.max(0, Math.min(5, Number(grade) || 0)), intervalDays: result.intervalDays },
      ].slice(-MAX_HISTORY),
    });

    return writeAll(all) ? { ...card } : null;
  }

  static snooze(childId, cardId, days = 1) {
    if (!childId || !cardId) return false;
    const all = readAll();
    const card = getCards(all, childId).find((item) => item.id === cardId);
    if (!card) return false;
    const delay = Math.max(1, Math.min(30, Number(days) || 1));
    card.dueAt = new Date(Date.now() + delay * DAY_MS).toISOString();
    return writeAll(all);
  }

  static remove(childId, cardId) {
    if (!childId || !cardId) return false;
    const all = readAll();
    const cards = getCards(all, childId);
    const next = cards.filter((card) => card.id !== cardId);
    if (next.length === cards.length) return false;
    all[childId].cards = next;
    return writeAll(all);
  }

  static getSummary(childId, now = new Date()) {
    const cards = this.list(childId);
    const time = now.getTime();
    const due = cards.filter((card) => new Date(card.dueAt).getTime() <= time).length;
    const mastered = cards.filter((card) => card.repetitions >= 3 && card.intervalDays >= 21).length;
    const upcoming = cards.filter((card) => new Date(card.dueAt).getTime() > time).length;
    return { total: cards.length, due, upcoming, mastered };
  }
}

export default RevisionPlannerService;
