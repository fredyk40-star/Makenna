/**
 * Pure practice-question builder for a single number lesson.
 * Options are deterministic so lessons are stable and easy to test.
 */
import { NUMBERS_DATA } from '../data/numbersData';

const ALL_NUMBERS = NUMBERS_DATA.map(number => String(number.id));
const ALL_WORDS = NUMBERS_DATA.map(number => number.word);

const rotate = (items, by) => {
  if (!items.length) return items;
  const offset = Math.abs(Math.round(by)) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

const nearbyOptions = (answer, pool, count = 4) => {
  const values = [...new Set(pool.map(String))];
  const index = Math.max(0, values.indexOf(String(answer)));
  const options = [String(answer)];

  for (let distance = 1; options.length < count && distance < values.length; distance += 1) {
    const before = values[(index - distance + values.length) % values.length];
    const after = values[(index + distance) % values.length];
    if (!options.includes(before)) options.push(before);
    if (options.length < count && !options.includes(after)) options.push(after);
  }

  return rotate(options, index);
};

const question = (id, type, prompt, options, answer, extras = {}) => ({
  id,
  type,
  prompt,
  options,
  correctIndex: options.indexOf(String(answer)),
  ...extras,
});

export const buildNumberPractice = (number) => {
  const id = String(number?.id ?? '');
  const value = Number(number?.number ?? id);
  if (!id || !Number.isFinite(value)) return [];

  const objects = Array.isArray(number.objects) ? number.objects : [];
  const visibleObjects = objects.slice(0, Math.min(value, 10));
  const display = visibleObjects.length
    ? visibleObjects.join(' ')
    : (value === 0 ? '🚫 (nothing)' : number.emoji || '🔢');

  const wordOptions = nearbyOptions(number.word, ALL_WORDS, 4);
  const countOptions = nearbyOptions(id, ALL_NUMBERS, 4);

  return [
    question(
      `${id}-word`,
      'word',
      `Which word is ${value}?`,
      wordOptions,
      number.word,
      { display: `🔢 ${value}`, spoken: number.word }
    ),
    question(
      `${id}-count`,
      'count',
      'How many objects can you count?',
      countOptions,
      id,
      { display, spoken: `Count to ${value}` }
    ),
    question(
      `${id}-listen`,
      'listen',
      'Listen and tap the number you hear.',
      nearbyOptions(id, ALL_NUMBERS, 4),
      id,
      { display: '🎧', spoken: number.word }
    ),
  ];
};

export const gradeNumberPractice = (questions = [], answers = []) => {
  const total = questions.length;
  const correct = questions.reduce((score, item, index) => (
    score + (answers[index] === item.correctIndex ? 1 : 0)
  ), 0);
  return {
    correct,
    total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
  };
};

export default { buildNumberPractice, gradeNumberPractice };
