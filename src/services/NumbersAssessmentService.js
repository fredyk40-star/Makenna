/**
 * NumbersAssessmentService - balanced, adaptive assessment for Numbers Kingdom.
 *
 * Questions are generated from real curriculum numbers rather than independent
 * random rolls, so every assessment has a predictable length and covers weak
 * numbers first.
 */
import { CORE_NUMBER_SKILLS } from './NumbersProgressService';

const STORAGE_KEY = 'numbers_assessment_data';

export class NumbersAssessmentService {
  constructor() {
    this.questions = [];
    this.answers = [];
    this.currentIndex = 0;
    this.score = 0;
    this.difficulty = 'easy';
    this.isComplete = false;
    this.numberPerformance = {};
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.numberPerformance = parsed.numberPerformance || {};
        this.answers = parsed.answers || [];
      }
    } catch (error) {
      console.warn('Failed to load numbers assessment data:', error);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        numberPerformance: this.numberPerformance,
        answers: this.answers,
      }));
    } catch (error) {
      console.warn('Failed to save numbers assessment data:', error);
    }
  }

  _entryIds(numberData) {
    return Object.keys(numberData || {})
      .filter(id => /^\d+$/.test(String(id)))
      .sort((a, b) => Number(a) - Number(b));
  }

  _focusId(numberData, progressData = {}) {
    const ids = this._entryIds(numberData);
    const requested = String(progressData?.focusId || '');
    return ids.includes(requested) ? requested : (ids[0] || null);
  }

  _isWeak(progressData, id) {
    if (!progressData) return true;
    const safeId = String(id);
    if (progressData.completed?.includes(safeId) || progressData.mastered?.includes(safeId)) {
      return false;
    }
    const skills = progressData.skills?.[safeId] || {};
    return !CORE_NUMBER_SKILLS.every(skill => skills[skill]?.completed === true);
  }

  _orderedFocusNumbers(numberData, progressData) {
    const ids = this._entryIds(numberData);
    const weak = ids.filter(id => this._isWeak(progressData, id));
    const strong = ids.filter(id => !weak.includes(id));
    return [...weak, ...strong];
  }

  generateAssessment(numberData, progressData = {}) {
    const orderedWeak = this._orderedFocusNumbers(numberData, progressData);
    const requestedFocus = String(progressData?.focusId || '');
    const focusNumbers = orderedWeak.includes(requestedFocus)
      ? [requestedFocus, ...orderedWeak.filter(id => id !== requestedFocus)]
      : orderedWeak;
    if (!focusNumbers.length) {
      this.questions = [];
      return this.questions;
    }

    const builders = [
      id => this.generateRecognitionQuestions(numberData, { focusId: id }),
      id => this.generateCountingQuestions(numberData, { focusId: id }),
      id => this.generateMissingNumberQuestions(numberData, { focusId: id }),
      id => this.generateComparisonQuestions(numberData, { focusId: id }),
      id => this.generateWordMatchQuestions(numberData, { focusId: id }),
      id => this.generateListeningQuestions(numberData, { focusId: id }),
      id => this.generateAdditionQuestions(numberData, { focusId: id }),
      id => this.generateSubtractionQuestions(numberData, { focusId: id }),
    ];

    const questions = [];
    let cursor = 0;
    while (questions.length < 15 && cursor < 200) {
      builders.forEach(build => {
        if (questions.length >= 15) return;
        const numberId = focusNumbers[cursor % focusNumbers.length];
        const built = build(numberId);
        if (built?.[0]) questions.push(built[0]);
        cursor += 1;
      });
    }

    this.questions = this.shuffleArray(questions).slice(0, 15);
    this.currentIndex = 0;
    this.score = 0;
    this.isComplete = false;
    this.answers = [];
    return this.questions;
  }

  _numeralPool(numberData) {
    return this._entryIds(numberData);
  }

  _wordPool(numberData) {
    return [...new Set(this._entryIds(numberData)
      .map(id => numberData[id]?.word)
      .filter(Boolean))];
  }

  _buildQuestion(type, id, numberData) {
    const entry = numberData[id];
    if (!entry) return null;

    const value = Number(id);
    const numerals = this._numeralPool(numberData);
    const words = this._wordPool(numberData);
    const numeralQuestion = (answer) => {
      const options = this.getRandomNumbers(answer, numerals, 4);
      return { options, correct: options.indexOf(String(answer)) };
    };

    switch (type) {
      case 'recognition':
        return {
          id: `recog-${id}`,
          type,
          number: id,
          question: `Which number is "${entry.word}"?`,
          display: entry.emoji || '🔢',
          ...numeralQuestion(id),
          difficulty: 'easy',
        };
      case 'counting':
        return {
          id: `count-${id}`,
          type,
          number: id,
          question: 'How many objects are there?',
          display: (entry.objects || []).slice(0, Math.max(1, Math.min(value, 10))).join(' ')
            || (value === 0 ? '🚫' : entry.emoji || '🔢'),
          ...numeralQuestion(id),
          difficulty: value > 10 ? 'medium' : 'easy',
        };
      case 'missing-number': {
        const missing = value < 18 ? value + 1 : value - 1;
        const before = value < 18 ? value : value - 2;
        return {
          id: `missing-${id}`,
          type,
          number: String(missing),
          question: `What number is missing? ${before} ? ${before + 2}`,
          display: '🔢',
          ...numeralQuestion(String(missing)),
          difficulty: 'medium',
        };
      }
      case 'comparison': {
        const other = value > 18 ? value - 2 : value + 2;
        const askBigger = value % 2 === 0;
        const correctNumber = askBigger ? Math.max(value, other) : Math.min(value, other);
        return {
          id: `compare-${id}`,
          type,
          number: String(correctNumber),
          question: askBigger ? 'Which number is bigger?' : 'Which number is smaller?',
          display: `${value} or ${other}`,
          ...numeralQuestion(String(correctNumber)),
          difficulty: 'medium',
        };
      }
      case 'word-match': {
        const options = this.getRandomWords(entry.word, words, 4);
        return {
          id: `word-${id}`,
          type,
          number: id,
          question: `Which word is ${value}?`,
          display: '🔤',
          options,
          correct: options.indexOf(entry.word),
          difficulty: 'easy',
        };
      }
      case 'listening':
        return {
          id: `listen-${id}`,
          type,
          number: id,
          question: 'Listen and find the number.',
          audio: entry.word,
          display: '🎧',
          ...numeralQuestion(id),
          difficulty: 'medium',
        };
      case 'addition': {
        const first = Math.min(Math.max(1, value), 5);
        const second = value - first;
        if (second < 0) return null;
        const answer = value;
        return {
          id: `add-${id}`,
          type,
          number: String(answer),
          question: `${first} + ${second} = ?`,
          display: '➕',
          ...numeralQuestion(String(answer)),
          difficulty: 'medium',
        };
      }
      case 'subtraction': {
        if (value < 1) return null;
        const subtract = Math.max(1, Math.min(value, Math.floor(value / 2) || 1));
        const answer = value - subtract;
        return {
          id: `sub-${id}`,
          type,
          number: String(answer),
          question: `${value} - ${subtract} = ?`,
          display: '➖',
          ...numeralQuestion(String(answer)),
          difficulty: 'hard',
        };
      }
      default:
        return null;
    }
  }

  _questionsForType(type, numberData, progressData) {
    const id = this._focusId(numberData, progressData);
    const question = id ? this._buildQuestion(type, id, numberData) : null;
    return question ? [question] : [];
  }

  generateRecognitionQuestions(numberData, progressData) {
    return this._questionsForType('recognition', numberData, progressData);
  }

  generateCountingQuestions(numberData, progressData) {
    // Counting emoji are capped at ten; larger numerals are assessed through
    // recognition and symbol questions instead of an impossible picture count.
    const id = this._focusId(numberData, progressData);
    if (!id || Number(id) > 10) return [];
    return this._questionsForType('counting', numberData, progressData);
  }

  generateMissingNumberQuestions(numberData, progressData) {
    return this._questionsForType('missing-number', numberData, progressData);
  }

  generateComparisonQuestions(numberData, progressData) {
    return this._questionsForType('comparison', numberData, progressData);
  }

  generateWordMatchQuestions(numberData, progressData) {
    return this._questionsForType('word-match', numberData, progressData);
  }

  generateListeningQuestions(numberData, progressData) {
    return this._questionsForType('listening', numberData, progressData);
  }

  generateAdditionQuestions(numberData, progressData) {
    return this._questionsForType('addition', numberData, progressData);
  }

  generateSubtractionQuestions(numberData, progressData) {
    return this._questionsForType('subtraction', numberData, progressData);
  }

  getRandomNumbers(target, allNumbers, count) {
    const available = [...new Set(
      (allNumbers?.length ? allNumbers : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
        .map(String)
    )];
    const answer = String(target);
    if (!available.includes(answer)) available.unshift(answer);
    const others = this.shuffleArray(available.filter(number => number !== answer));
    return this.shuffleArray([answer, ...others.slice(0, Math.max(0, count - 1))]);
  }

  getRandomWords(target, allWords, count) {
    const available = [...new Set((allWords?.length ? allWords : [target]).filter(Boolean))];
    if (!available.includes(target)) available.unshift(target);
    const others = this.shuffleArray(available.filter(word => word !== target));
    return this.shuffleArray([target, ...others.slice(0, Math.max(0, count - 1))]);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  submitAnswer(answer) {
    if (this.isComplete || this.currentIndex >= this.questions.length) return null;

    const question = this.questions[this.currentIndex];
    const isCorrect = Number(answer) === question.correct;

    this.answers.push({
      questionId: question.id,
      type: question.type,
      isCorrect,
      answer,
      correctAnswer: question.options[question.correct],
    });

    if (isCorrect) this.score += 1;

    if (question.number != null) {
      const key = String(question.number);
      if (!this.numberPerformance[key]) {
        this.numberPerformance[key] = { correct: 0, total: 0 };
      }
      this.numberPerformance[key].total += 1;
      if (isCorrect) this.numberPerformance[key].correct += 1;
    }

    this.currentIndex += 1;
    if (this.currentIndex >= this.questions.length) this.isComplete = true;
    this.saveToStorage();

    return {
      isCorrect,
      currentScore: this.score,
      totalQuestions: this.questions.length,
      isComplete: this.isComplete,
    };
  }

  getCurrentQuestion() {
    if (this.currentIndex < this.questions.length) {
      return this.questions[this.currentIndex];
    }
    return null;
  }

  getResults() {
    const total = this.questions.length;
    const correct = this.score;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    let level = 'Bronze';
    if (percentage >= 90) level = 'Master';
    else if (percentage >= 80) level = 'Diamond';
    else if (percentage >= 70) level = 'Gold';
    else if (percentage >= 50) level = 'Silver';

    const numberMastery = {};
    Object.entries(this.numberPerformance).forEach(([num, data]) => {
      const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      numberMastery[num] = {
        percentage: percent,
        level: percent >= 80 ? 'Mastered' : percent >= 50 ? 'In Progress' : 'Needs Practice',
        correct: data.correct,
        total: data.total,
      };
    });

    const weakestNumbers = Object.entries(numberMastery)
      .filter(([, data]) => data.level === 'Needs Practice')
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([num]) => num)
      .slice(0, 5);

    return {
      total,
      correct,
      percentage,
      level,
      numberMastery,
      weakestNumbers,
      answers: this.answers,
      isComplete: this.isComplete,
    };
  }

  reset() {
    this.questions = [];
    this.answers = [];
    this.currentIndex = 0;
    this.score = 0;
    this.isComplete = false;
    this.saveToStorage();
  }
}

export default new NumbersAssessmentService();
