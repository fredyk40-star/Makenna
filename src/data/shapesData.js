/**
 * Shapes & Colours Adventure - Shapes Data
 * Ghana-friendly examples and associations
 */

export const SHAPES_DATA = [
  {
    id: 'circle',
    name: 'Circle',
    svg: '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4"/>',
    emoji: '⭕',
    realObject: 'Ball',
    objectEmoji: '⚽',
    colorAssociation: 'Red',
    audioLabel: 'Circle',
    description: 'A round shape with no corners',
    difficulty: 1,
    category: 'basic'
  },
  {
    id: 'square',
    name: 'Square',
    svg: '<rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="4"/>',
    emoji: '🟦',
    realObject: 'Window',
    objectEmoji: '🪟',
    colorAssociation: 'Blue',
    audioLabel: 'Square',
    description: 'A shape with four equal sides',
    difficulty: 1,
    category: 'basic'
  },
  {
    id: 'triangle',
    name: 'Triangle',
    svg: '<polygon points="50,10 10,90 90,90" fill="none" stroke="currentColor" strokeWidth="4"/>',
    emoji: '🔺',
    realObject: 'Mountain',
    objectEmoji: '🏔️',
    colorAssociation: 'Green',
    audioLabel: 'Triangle',
    description: 'A shape with three sides',
    difficulty: 1,
    category: 'basic'
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    svg: '<rect x="10" y="20" width="80" height="60" fill="none" stroke="currentColor" strokeWidth="4"/>',
    emoji: '🟨',
    realObject: 'Book',
    objectEmoji: '📖',
    colorAssociation: 'Yellow',
    audioLabel: 'Rectangle',
    description: 'A shape with four sides, two longer than the others',
    difficulty: 2,
    category: 'basic'
  },
  {
    id: 'star',
    name: 'Star',
    svg: '<polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="none" stroke="currentColor" strokeWidth="4"/>',
    emoji: '⭐',
    realObject: 'Star in the sky',
    objectEmoji: '⭐',
    colorAssociation: 'Yellow',
    audioLabel: 'Star',
    description: 'A shape with five points',
    difficulty: 2,
    category: 'advanced'
  },
  {
    id: 'oval',
    name: 'Oval',
    svg: '<ellipse cx="50" cy="50" rx="45" ry="30" fill="none" stroke="currentColor" strokeWidth="4"/>',
    emoji: '🥚',
    realObject: 'Egg',
    objectEmoji: '🥚',
    colorAssociation: 'White',
    audioLabel: 'Oval',
    description: 'A stretched circle shape',
    difficulty: 2,
    category: 'advanced'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    svg: '<polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="currentColor" strokeWidth="4"/>',
    emoji: '💎',
    realObject: 'Kente cloth pattern',
    objectEmoji: '🧶',
    colorAssociation: 'Purple',
    audioLabel: 'Diamond',
    description: 'A shape with four sides like a tilted square',
    difficulty: 2,
    category: 'advanced'
  }
];

export const getShapeById = (id) => {
  return SHAPES_DATA.find(shape => shape.id === id);
};

export const getShapesByCategory = (category) => {
  return SHAPES_DATA.filter(shape => shape.category === category);
};

export const getShapesByDifficulty = (difficulty) => {
  return SHAPES_DATA.filter(shape => shape.difficulty === difficulty);
};

export const searchShapes = (query) => {
  const lowerQuery = query.toLowerCase();
  return SHAPES_DATA.filter(shape =>
    shape.name.toLowerCase().includes(lowerQuery) ||
    shape.realObject.toLowerCase().includes(lowerQuery) ||
    shape.description.toLowerCase().includes(lowerQuery)
  );
};