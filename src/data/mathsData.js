/**
 * Early Maths Builder - Maths Data
 * Addition, Subtraction, Counting, and Comparison
 */

export const MATHS_TOPICS = [
  {
    id: 'addition',
    title: 'Addition',
    description: 'Learn to add numbers together!',
    icon: '➕',
    route: '/maths/addition',
    color: 'from-green-400 to-blue-400',
    difficulty: 1,
    maxNumber: 20
  },
  {
    id: 'subtraction',
    title: 'Subtraction',
    description: 'Learn to take numbers away!',
    icon: '➖',
    route: '/maths/subtraction',
    color: 'from-red-400 to-orange-400',
    difficulty: 1,
    maxNumber: 20
  },
  {
    id: 'counting',
    title: 'Counting Practice',
    description: 'Count objects and numbers!',
    icon: '🔢',
    route: '/maths/counting',
    color: 'from-yellow-400 to-orange-400',
    difficulty: 1,
    maxNumber: 20
  },
  {
    id: 'compare',
    title: 'Compare Numbers',
    description: 'Learn greater than, less than, and equal!',
    icon: '⚖️',
    route: '/maths/compare',
    color: 'from-purple-400 to-pink-400',
    difficulty: 2,
    maxNumber: 20
  }
];

export const ADDITION_PROBLEMS = [
  { id: 1, a: 1, b: 1, answer: 2 },
  { id: 2, a: 2, b: 1, answer: 3 },
  { id: 3, a: 3, b: 2, answer: 5 },
  { id: 4, a: 4, b: 3, answer: 7 },
  { id: 5, a: 5, b: 4, answer: 9 },
  { id: 6, a: 6, b: 5, answer: 11 },
  { id: 7, a: 7, b: 6, answer: 13 },
  { id: 8, a: 8, b: 7, answer: 15 },
  { id: 9, a: 9, b: 8, answer: 17 },
  { id: 10, a: 10, b: 9, answer: 19 },
  { id: 11, a: 11, b: 9, answer: 20 },
  { id: 12, a: 12, b: 8, answer: 20 },
  { id: 13, a: 0, b: 5, answer: 5 },
  { id: 14, a: 5, b: 0, answer: 5 },
  { id: 15, a: 10, b: 10, answer: 20 }
];

export const SUBTRACTION_PROBLEMS = [
  { id: 1, a: 5, b: 1, answer: 4 },
  { id: 2, a: 8, b: 3, answer: 5 },
  { id: 3, a: 10, b: 4, answer: 6 },
  { id: 4, a: 12, b: 5, answer: 7 },
  { id: 5, a: 15, b: 6, answer: 9 },
  { id: 6, a: 18, b: 8, answer: 10 },
  { id: 7, a: 20, b: 10, answer: 10 },
  { id: 8, a: 14, b: 7, answer: 7 },
  { id: 9, a: 16, b: 9, answer: 7 },
  { id: 10, a: 19, b: 11, answer: 8 },
  { id: 11, a: 20, b: 15, answer: 5 },
  { id: 12, a: 13, b: 13, answer: 0 },
  { id: 13, a: 10, b: 2, answer: 8 },
  { id: 14, a: 7, b: 7, answer: 0 },
  { id: 15, a: 20, b: 0, answer: 20 }
];

export const COUNTING_ITEMS = [
  { id: 'mango', emoji: '🥭', label: 'Mangoes' },
  { id: 'goat', emoji: '🐐', label: 'Goats' },
  { id: 'ball', emoji: '⚽', label: 'Balls' },
  { id: 'plantain', emoji: '🍌', label: 'Plantains' },
  { id: 'star', emoji: '⭐', label: 'Stars' },
  { id: 'fish', emoji: '🐟', label: 'Fish' }
];

export const generateAdditionProblem = (max = 20) => {
  const a = Math.floor(Math.random() * (max / 2 + 1));
  const b = Math.floor(Math.random() * (max / 2 + 1));
  const answer = a + b;
  
  // Generate wrong answers
  const wrongAnswers = new Set();
  while (wrongAnswers.size < 3) {
    let wrong = answer + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    if (wrong < 0) wrong = Math.abs(wrong);
    if (wrong !== answer && wrong <= max + 5) {
      wrongAnswers.add(wrong);
    }
  }
  
  const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  
  return { a, b, answer, options };
};

export const generateSubtractionProblem = (max = 20) => {
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * a);
  const answer = a - b;
  
  const wrongAnswers = new Set();
  while (wrongAnswers.size < 3) {
    let wrong = answer + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    if (wrong < 0) wrong = Math.abs(wrong);
    if (wrong !== answer && wrong <= max) {
      wrongAnswers.add(wrong);
    }
  }
  
  const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  
  return { a, b, answer, options };
};

export const generateCompareProblem = (max = 10) => {
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
  const correct = a > b ? '>' : a < b ? '<' : '=';
  const options = ['>', '<', '='];
  
  return { a, b, correct, options };
};