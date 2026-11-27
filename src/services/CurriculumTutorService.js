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
      .filter((word) => word.length > 2);
    if (words.length === 0) return null;

    const scores = this.getUnits(childId).map((unit) => {
      const searchable = `${unit.title} ${unit.subject} ${unit.lesson} ${unit.content}`.toLowerCase();
      const score = words.reduce((total, word) => total + (searchable.includes(word) ? 1 : 0), 0);
      return { unit, score };
    });

    const best = scores.sort((a, b) => b.score - a.score)[0];
    if (!best || best.score === 0) {
      const suggestion = this.getSuggestion(childId, fullName);
      return suggestion
        ? {
          text: `${suggestion.text} You can also ask me about ${suggestion.unit.subject.replace(/_/g, ' ')}.`,
          unit: suggestion.unit,
          matched: false,
        }
        : null;
    }

    const { unit } = best;
    const name = firstName(fullName);
    const prompt = unit.path
      ? ` Open ${unit.title} to practise.`
      : '';

    return {
      unit,
      text: `${name}, in our ${unit.level} ${unit.subject.replace(/_/g, ' ')} work: ${unit.title}. ${cleanContent(unit.content)}${prompt}`,
      matched: true,
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
