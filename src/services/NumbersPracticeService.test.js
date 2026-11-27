import { describe, expect, it } from 'vitest';
import { getNumberById } from '../data/numbersData';
import { buildNumberPractice, gradeNumberPractice } from './NumbersPracticeService';

describe('NumbersPracticeService', () => {
  it('builds three graded questions for a number', () => {
    const questions = buildNumberPractice(getNumberById('7'));

    expect(questions).toHaveLength(3);
    questions.forEach(question => {
      expect(question.options).toHaveLength(4);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.options[question.correctIndex]).toBeTruthy();
    });
    expect(questions.map(question => question.type)).toEqual(['word', 'count', 'listen']);
  });

  it('handles zero without showing objects', () => {
    const questions = buildNumberPractice(getNumberById('0'));
    expect(questions[1].display).toContain('nothing');
    expect(questions[1].options[questions[1].correctIndex]).toBe('0');
  });

  it('grades answers by accuracy', () => {
    const questions = buildNumberPractice(getNumberById('2'));
    const answers = [questions[0].correctIndex, questions[1].correctIndex + 1, questions[2].correctIndex];

    expect(gradeNumberPractice(questions, answers)).toEqual({
      correct: 2,
      total: 3,
      accuracy: 67,
    });
  });
});
