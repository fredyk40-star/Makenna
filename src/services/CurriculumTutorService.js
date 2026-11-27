/**
 * CurriculumTutorService - parent-controlled, curriculum-grounded assistant.
 *
 * The assistant only answers when a parent has enabled it in Settings. Every
 * suggestion is taken from the stored Ghana curriculum, and every answer
 * carries the curriculum unit it came from so it can be checked.
 */
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';
import { GhanaCurriculumService } from './GhanaCurriculumService';
import { ClassroomService } from './ClassroomService';
import { LearningAnalytics } from './LearningAnalytics';

const TUTOR_SETTINGS_KEY = 'makenna_parent_tutor_settings_v1';
const LEVELS = ['KG1', 'KG2', 'Basic1', 'Basic2'];

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('Curriculum tutor listener failed:', error);
    }
  });
};

const readAll = () => {
  const data = StorageService.get(TUTOR_SETTINGS_KEY, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
};

const defaults = () => ({
  enabled: false,
  allowVoice: false,
  allowOnlineAI: false,
  level: 'KG1',
  subjects: [],
  updatedAt: null,
});

const firstName = (fullName) => (fullName ? String(fullName).trim().split(/\s+/)[0] : 'Friend');

const toUnit = (unit, subject) => ({
  id: unit.id,
  title: unit.title,
  content: unit.content,
  level: unit.level,
  lesson: unit.lesson,
  icon: unit.image || '📘',
  subject,
  path: ClassroomService.getActivityPath(unit.lesson),
  source: `${subject}:${unit.id}`,
});

const cleanContent = (content) => String(content || '').replace(/\.\.\.$/, '.').trim();

const STOP_WORDS = new Set([
  'about', 'can', 'give', 'how', 'learn', 'lesson', 'me', 'please',
  'practice', 'practise', 'show', 'tell', 'teach', 'want', 'what',
  'why', 'with', 'your',
]);

const scoreUnit = (unit, words) => {
  const searchable = `${unit.title} ${unit.subject} ${unit.lesson} ${unit.content}`.toLowerCase();
  return words.reduce((total, word) => total + (searchable.includes(word) ? 1 : 0), 0);
};

const sortByScore = (entries) => entries.sort((a, b) => b.score - a.score);

export class CurriculumTutorService {
  static subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  static getSettings(childId) {
    if (!childId) return defaults();
    return { ...defaults(), ...(readAll()[childId] || {}) };
  }

  /** Parent-only write path. The Settings UI is wrapped in ParentGate. */
  static saveSettings(childId, patch = {}) {
    if (!childId) return null;
    const all = readAll();
    const current = this.getSettings(childId);
    const availableSubjects = GhanaCurriculumService.getSubjects();
    const subjects = Array.isArray(patch.subjects)
      ? patch.subjects.filter((subject) => availableSubjects.includes(subject))
      : current.subjects;

    const settings = {
      enabled: Boolean(patch.enabled ?? current.enabled),
      allowVoice: Boolean(patch.allowVoice ?? current.allowVoice),
      allowOnlineAI: Boolean(patch.allowOnlineAI ?? current.allowOnlineAI),
      level: LEVELS.includes(patch.level) ? patch.level : current.level,
      subjects,
      updatedAt: new Date().toISOString(),
    };

    all[childId] = settings;
    if (!StorageService.set(TUTOR_SETTINGS_KEY, all)) return null;

    // Mirror the parent's opt-in into the child account settings so the API can
    // verify consent server-side instead of trusting this device.
    if (childId) {
      const account = ChildAccountService.getChild(childId);
      if (account) {
        ChildAccountService.updateChild(childId, {
          settings: { ...(account.settings || {}), tutor: settings },
        });
      }
    }

    notify();
    return settings;
  }

  static isEnabled(childId) {
    return this.getSettings(childId).enabled;
  }

  /** Curriculum units the parent has allowed, newest level first. */
  static getUnits(childId) {
    const settings = this.getSettings(childId);
    const subjects = settings.subjects.length > 0
      ? settings.subjects
      : GhanaCurriculumService.getSubjects();
    const units = subjects.flatMap((subject) => (
      GhanaCurriculumService.getSubjectContent(subject)
        .filter((unit) => unit?.id && unit?.title)
        .map((unit) => toUnit(unit, subject))
    ));

    const levelUnits = units.filter((unit) => unit.level === settings.level);
    return levelUnits.length > 0 ? levelUnits : units;
  }

  /** Weakest curriculum subject first, using the child's real analytics. */
  static getPrioritySubject(childId) {
    const allowed = this.getSettings(childId).subjects;
    const weakSubjects = LearningAnalytics.getWeakSubjects(childId, 5);
    for (const weak of weakSubjects) {
      const label = String(weak.subject || '').toLowerCase();
      const match = allowed.length > 0
        ? allowed.find((subject) => label.includes(subject) || subject.includes(label))
        : GhanaCurriculumService.getSubjects().find((subject) => label.includes(subject) || subject.includes(label));
      if (match) return match;
    }
    return allowed[0] || GhanaCurriculumService.getSubjects()[0] || null;
  }

  static getSuggestion(childId, fullName = '') {
    if (!this.isEnabled(childId)) return null;

    const units = this.getUnits(childId);
    if (units.length === 0) return null;

    const priority = this.getPrioritySubject(childId);
    const unit = units.find((item) => item.subject === priority) || units[0];
    const name = firstName(fullName);

    return {
      unit,
      text: `${name}, let's practise ${unit.title} in ${unit.subject.replace(/_/g, ' ')}. ${cleanContent(unit.content)}`,
    };
  }

  /**
   * Answer only from curriculum content. Returns null when disabled or when
   * no allowed unit relates to the question.
   */
  static answer(childId, query = '', fullName = '') {
    if (!this.isEnabled(childId)) return null;

    const words = String(query)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
    if (words.length === 0) return null;

    const name = firstName(fullName);
    const units = this.getUnits(childId);
    const best = sortByScore(units.map((unit) => ({ unit, score: scoreUnit(unit, words) })))[0];

    if (best?.score > 0) {
      const { unit } = best;
      const prompt = unit.path
        ? ` Open ${unit.title} to practise.`
        : '';

      return {
        unit,
        text: `${name}, in our ${unit.level} ${unit.subject.replace(/_/g, ' ')} work: ${unit.title}. ${cleanContent(unit.content)}${prompt}`,
        matched: true,
      };
    }

    // A parent may have allowed only some subjects or one level. If the lesson
    // exists elsewhere in the bundled curriculum, say exactly what to enable
    // instead of repeating an unrelated suggestion.
    const allowedSources = new Set(units.map((unit) => unit.source));
    const level = this.getSettings(childId).level;
    const fullCurriculum = GhanaCurriculumService.getSubjects().flatMap((subject) => (
      GhanaCurriculumService.getSubjectContent(subject)
        .filter((unit) => unit?.id && unit?.title)
        .map((unit) => toUnit(unit, subject))
    ));
    const outsideMatch = fullCurriculum
      .filter((unit) => !allowedSources.has(unit.source))
      .map((unit) => ({
        unit,
        score: scoreUnit(unit, words),
        levelMatch: unit.level === level ? 1 : 0,
      }))
      .sort((a, b) => b.levelMatch - a.levelMatch || b.score - a.score)[0];

    if (outsideMatch?.score > 0) {
      const { unit } = outsideMatch;
      return {
        unit: null,
        matched: false,
        text: `${name}, ${unit.title} is not in your allowed lessons. Ask a grown-up to allow ${unit.subject.replace(/_/g, ' ')} for ${unit.level} in Settings → AI tutor.`,
        blockedUnit: unit,
      };
    }

    const topics = units.slice(0, 3).map((unit) => unit.title);
    const hint = topics.length > 0
      ? ` Try ${topics.join(', ')}.`
      : ' Choose a lesson first.';

    return {
      unit: null,
      matched: false,
      text: `${name}, I can only help with your lessons right now.${hint}`,
    };
  }

  static recordQuestion(childId, unit) {
    if (!childId || !unit?.title) return;
    const key = 'makenna_tutor_question_log_v1';
    const all = StorageService.get(key, {});
    const childLog = all[childId] && typeof all[childId] === 'object' ? all[childId] : {};
    const topic = `${unit.subject || 'general'}:${unit.title}`;
    childLog[topic] = (childLog[topic] || 0) + 1;
    childLog.__total = (childLog.__total || 0) + 1;
    all[childId] = childLog;
    StorageService.set(key, all);
  }

  static getQuestionLog(childId) {
    const all = StorageService.get('makenna_tutor_question_log_v1', {});
    const childLog = all[childId] && typeof all[childId] === 'object' ? all[childId] : {};
    return Object.entries(childLog)
      .filter(([topic]) => topic !== '__total')
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }

  static clearQuestionLog(childId) {
    if (!childId) return;
    const all = StorageService.get('makenna_tutor_question_log_v1', {});
    delete all[childId];
    StorageService.set('makenna_tutor_question_log_v1', all);
  }
}

export default CurriculumTutorService;
