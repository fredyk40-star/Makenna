import { beforeEach, describe, expect, it } from 'vitest';
import { NumbersAssessmentService } from './NumbersAssessmentService';
import { NUMBERS_DATA } from '../data/numbersData';

const numberData = NUMBERS_DATA.reduce((result, number) => {
  result[number.id] = {
    word: number.word,
    emoji: number.emoji,
    objects: number.objects,
    phonics: number.phonics,
  };
  return result;
}, {});

describe('NumbersAssessmentService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a balanced assessment with valid correct indexes', () => {
    const service = new NumbersAssessmentService();
    const questions = service.generateAssessment(numberData, {});

    expect(questions).toHaveLength(15);
    questions.forEach(question => {
      expect(question.options).toHaveLength(4);
      expect(question.correct).toBeGreaterThanOrEqual(0);
      expect(question.correct).toBeLessThan(question.options.length);
    });
  });

  it('keeps numeral answers correct after options are shuffled', () => {
    const service = new NumbersAssessmentService();
    const [question] = service.generateRecognitionQuestions(numberData, { focusId: '7' });

    expect(question.options[question.correct]).toBe('7');
    expect(question.question).toContain('Seven');
  });

  it('matches number words against the real curriculum words', () => {
    const service = new NumbersAssessmentService();
    const [question] = service.generateWordMatchQuestions(numberData, { focusId: '4' });

    expect(question.options[question.correct]).toBe('Four');
    expect(question.options.every(Boolean)).toBe(true);
  });

  it('does not ask children to count more objects than it shows', () => {
    const service = new NumbersAssessmentService();

    expect(service.generateCountingQuestions(numberData, { focusId: '15' })).toEqual([]);
    const [question] = service.generateCountingQuestions(numberData, { focusId: '0' });
    expect(question.options[question.correct]).toBe('0');
    expect(question.display).toBeTruthy();
  });

  it('scores submitted answers and records the result', () => {
    const service = new NumbersAssessmentService();
    const questions = service.generateAssessment(numberData, {});

    questions.forEach(question => {
      const result = service.submitAnswer(question.correct);
      expect(result.isCorrect).toBe(true);
    });

    expect(service.getResults()).toMatchObject({
      total: 15,
      correct: 15,
      percentage: 100,
      level: 'Master',
      isComplete: true,
    });
  });
});
