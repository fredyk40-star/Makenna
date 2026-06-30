/**
 * Shapes & Colours Adventure - Colours Data
 * Ghana-friendly examples and emotional associations
 */

export const COLOURS_DATA = [
  {
    id: 'red',
    name: 'Red',
    hex: '#EF4444',
    emoji: '🔴',
    realObject: 'Mango',
    objectEmoji: '🥭',
    emotion: 'Exciting and bold',
    audioLabel: 'Red',
    description: 'Red is the colour of ripe mangoes',
    difficulty: 1,
    category: 'primary'
  },
  {
    id: 'blue',
    name: 'Blue',
    hex: '#3B82F6',
    emoji: '🔵',
    realObject: 'Sky',
    objectEmoji: '☀️',
    emotion: 'Calm and peaceful',
    audioLabel: 'Blue',
    description: 'Blue is the colour of the sky',
    difficulty: 1,
    category: 'primary'
  },
  {
    id: 'yellow',
    name: 'Yellow',
    hex: '#FBBF24',
    emoji: '🟡',
    realObject: 'Sun',
    objectEmoji: '🌞',
    emotion: 'Happy and bright',
    audioLabel: 'Yellow',
    description: 'Yellow is the colour of sunshine',
    difficulty: 1,
    category: 'primary'
  },
  {
    id: 'green',
    name: 'Green',
    hex: '#22C55E',
    emoji: '🟢',
    realObject: 'Cocoa pod',
    objectEmoji: '🌿',
    emotion: 'Growing and fresh',
    audioLabel: 'Green',
    description: 'Green is the colour of cocoa trees',
    difficulty: 1,
    category: 'primary'
  },
  {
    id: 'orange',
    name: 'Orange',
    hex: '#FB923C',
    emoji: '🟠',
    realObject: 'Orange fruit',
    objectEmoji: '🍊',
    emotion: 'Warm and energetic',
    audioLabel: 'Orange',
    description: 'Orange is the colour of oranges',
    difficulty: 2,
    category: 'secondary'
  },
  {
    id: 'purple',
    name: 'Purple',
    hex: '#A78BFA',
    emoji: '🟣',
    realObject: 'Kente cloth',
    objectEmoji: '🧶',
    emotion: 'Royal and creative',
    audioLabel: 'Purple',
    description: 'Purple is the colour of royal Kente cloth',
    difficulty: 2,
    category: 'secondary'
  },
  {
    id: 'black',
    name: 'Black',
    hex: '#1F2937',
    emoji: '⚫',
    realObject: 'Night sky',
    objectEmoji: '🌙',
    emotion: 'Strong and powerful',
    audioLabel: 'Black',
    description: 'Black is the colour of the night',
    difficulty: 1,
    category: 'neutral'
  },
  {
    id: 'white',
    name: 'White',
    hex: '#F9FAFB',
    emoji: '⚪',
    realObject: 'Clouds',
    objectEmoji: '☁️',
    emotion: 'Pure and clean',
    audioLabel: 'White',
    description: 'White is the colour of clouds',
    difficulty: 1,
    category: 'neutral'
  }
];

export const getColourById = (id) => {
  return COLOURS_DATA.find(colour => colour.id === id);
};

export const getColoursByCategory = (category) => {
  return COLOURS_DATA.filter(colour => colour.category === category);
};

export const searchColours = (query) => {
  const lowerQuery = query.toLowerCase();
  return COLOURS_DATA.filter(colour =>
    colour.name.toLowerCase().includes(lowerQuery) ||
    colour.realObject.toLowerCase().includes(lowerQuery) ||
    colour.emotion.toLowerCase().includes(lowerQuery)
  );
};