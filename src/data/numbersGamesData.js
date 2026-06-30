/**
 * Numbers Games Data - Game configurations for Numbers Kingdom
 */

export const NUMBERS_GAMES = [
  {
    id: 'count-mangoes',
    title: 'Count the Mangoes',
    description: 'Tap the correct number of mangoes!',
    icon: '🥭',
    category: 'counting',
    difficulty: 'easy',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 5,
    color: 'from-yellow-400 to-orange-400'
  },
  {
    id: 'count-plantains',
    title: 'Count the Plantains',
    description: 'Count bunches of plantains!',
    icon: '🍌',
    category: 'counting',
    difficulty: 'easy',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 5,
    color: 'from-yellow-500 to-green-400'
  },
  {
    id: 'count-goats',
    title: 'Count the Goats',
    description: 'Count the goats moving across the screen!',
    icon: '🐐',
    category: 'counting',
    difficulty: 'easy',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 5,
    color: 'from-gray-400 to-brown-400'
  },
  {
    id: 'balloon-pop',
    title: 'Balloon Pop',
    description: 'Pop balloons with the right number!',
    icon: '🎈',
    category: 'recognition',
    difficulty: 'easy',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 5,
    color: 'from-red-400 to-pink-400'
  },
  {
    id: 'number-fishing',
    title: 'Number Fishing',
    description: 'Catch the fish with the right number!',
    icon: '🎣',
    category: 'recognition',
    difficulty: 'easy',
    estimatedTime: 4,
    minNumber: 1,
    maxNumber: 5,
    color: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'market-basket',
    title: 'Market Basket',
    description: 'Put the right number of fruits in the basket!',
    icon: '🧺',
    category: 'counting',
    difficulty: 'medium',
    estimatedTime: 4,
    minNumber: 1,
    maxNumber: 10,
    color: 'from-green-400 to-teal-400'
  },
  {
    id: 'number-match',
    title: 'Number Match',
    description: 'Match the numeral with the quantity!',
    icon: '🔢',
    category: 'matching',
    difficulty: 'easy',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 5,
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: 'memory-cards',
    title: 'Memory Cards',
    description: 'Find matching pairs of numbers and quantities!',
    icon: '🃏',
    category: 'memory',
    difficulty: 'medium',
    estimatedTime: 5,
    minNumber: 1,
    maxNumber: 8,
    color: 'from-indigo-400 to-purple-400'
  },
  {
    id: 'missing-number',
    title: 'Missing Number',
    description: 'Fill in the missing number in the sequence!',
    icon: '🚂',
    category: 'sequence',
    difficulty: 'medium',
    estimatedTime: 4,
    minNumber: 1,
    maxNumber: 10,
    color: 'from-blue-500 to-indigo-400'
  },
  {
    id: 'number-puzzle',
    title: 'Number Puzzle',
    description: 'Drag the numbers into the correct order!',
    icon: '🧩',
    category: 'sequence',
    difficulty: 'medium',
    estimatedTime: 4,
    minNumber: 1,
    maxNumber: 10,
    color: 'from-orange-400 to-red-400'
  },
  {
    id: 'bigger-smaller',
    title: 'Bigger or Smaller',
    description: 'Choose the bigger or smaller number!',
    icon: '📏',
    category: 'comparison',
    difficulty: 'medium',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 10,
    color: 'from-green-400 to-blue-400'
  },
  {
    id: 'more-less',
    title: 'More or Less',
    description: 'Compare groups of objects!',
    icon: '⚖️',
    category: 'comparison',
    difficulty: 'medium',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 10,
    color: 'from-yellow-400 to-green-400'
  },
  {
    id: 'count-animals',
    title: 'Count the Animals',
    description: 'Count chickens, fish, birds, and goats!',
    icon: '🐔',
    category: 'counting',
    difficulty: 'easy',
    estimatedTime: 3,
    minNumber: 1,
    maxNumber: 5,
    color: 'from-brown-400 to-orange-400'
  },
  {
    id: 'treasure-hunt',
    title: 'Number Treasure Hunt',
    description: 'Find the hidden numbers to unlock treasure!',
    icon: '🗺️',
    category: 'recognition',
    difficulty: 'hard',
    estimatedTime: 5,
    minNumber: 1,
    maxNumber: 10,
    color: 'from-yellow-600 to-red-500'
  },
  {
    id: 'bubble-burst',
    title: 'Bubble Burst',
    description: 'Burst bubbles matching the spoken number!',
    icon: '🫧',
    category: 'recognition',
    difficulty: 'medium',
    estimatedTime: 4,
    minNumber: 1,
    maxNumber: 10,
    color: 'from-cyan-400 to-blue-500'
  }
];

export const getGameById = (id) => {
  return NUMBERS_GAMES.find(game => game.id === id);
};

export const getGamesByCategory = (category) => {
  return NUMBERS_GAMES.filter(game => game.category === category);
};

export const getGamesByDifficulty = (difficulty) => {
  return NUMBERS_GAMES.filter(game => game.difficulty === difficulty);
};

export const searchGames = (query) => {
  const lowerQuery = query.toLowerCase();
  return NUMBERS_GAMES.filter(game =>
    game.title.toLowerCase().includes(lowerQuery) ||
    game.description.toLowerCase().includes(lowerQuery) ||
    game.category.toLowerCase().includes(lowerQuery)
  );
};

export const GAME_CATEGORIES = [
  { id: 'all', label: 'All Games', icon: '🎮' },
  { id: 'counting', label: 'Counting', icon: '🔢' },
  { id: 'recognition', label: 'Recognition', icon: '👀' },
  { id: 'matching', label: 'Matching', icon: '🔗' },
  { id: 'memory', label: 'Memory', icon: '🧠' },
  { id: 'sequence', label: 'Sequence', icon: '📊' },
  { id: 'comparison', label: 'Comparison', icon: '⚖️' }
];