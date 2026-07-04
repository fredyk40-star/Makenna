import {
  FaHome,
  FaBook,
  FaGamepad,
  FaUser,
  FaCog,
} from 'react-icons/fa';

export const ROUTES = {
  HOME: '/',
  WELCOME: '/welcome',
  LEARN: '/learn',
  GAMES: '/games',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  PARENT_ZONE: '/parent-zone',
  // Alphabet Routes
  ALPHABET: '/alphabet',
  ALPHABET_LESSON: '/alphabet/lesson/:letterId',
  ALPHABET_TRACE: '/alphabet/trace/:letterId',
  // Game Routes
  ALPHABET_GAMES: '/games/alphabet',
  ANIMAL_SAFARI: '/animal-safari',
  MUSIC: '/music',
  DRAWING: '/drawing',
  // Reading Routes
  WORD_BUILDER: '/reading/word-builder',
  SIGHT_WORDS: '/reading/sight-words',
  // Story Routes
  STORIES: '/stories',
  STORY_READER: '/story/:storyId',
  // Graduation Routes
  GRADUATION: '/graduation',

  // Bible Time Routes
  BIBLE_TIME: '/bible-time',
  BIBLE_STORY_READER: '/bible-time/:storyId',

  // Science Lab Routes
  SCIENCE_LAB: '/science-lab',
  WATER_CYCLE: '/science-lab/water-cycle',
  PARTS_OF_A_PLANT: '/science-lab/parts-of-a-plant',
  SOLAR_SYSTEM: '/science-lab/solar-system',

  // Ghana Explorer Routes
  GHANA_EXPLORER: '/ghana-explorer',

  // Numbers Routes
  NUMBERS: '/numbers',
  NUMBERS_LESSON: '/numbers/lesson/:numberId',
  NUMBERS_TRACE: '/numbers/trace/:numberId',
  NUMBERS_GAMES: '/numbers/games',
  NUMBERS_GAME: '/numbers/game/:gameId',
  NUMBERS_STORIES: '/numbers/stories',
  NUMBERS_STORY_READER: '/numbers/story/:storyId',
  NUMBERS_MASTERY: '/numbers/mastery',

  // Shapes & Colours Routes
  SHAPES: '/shapes',
  SHAPE_LESSON: '/shapes/lesson/:shapeId',
  SHAPES_GAMES: '/games/shapes',
  SHAPE_MATCH: '/games/shapes/shape-match',
  FIND_THE_SHAPE: '/games/shapes/find-the-shape',
  COLOUR_PICKER: '/games/shapes/colour-picker',
  SHAPE_SORTING: '/games/shapes/shape-sorting',
  SHAPE_MEMORY: '/games/shapes/shape-memory',
  COLOURS: '/colours',
  COLOUR_LESSON: '/colours/lesson/:colorId',

  // Maths Routes
  MATHS: '/maths',
  MATHS_ADDITION: '/maths/addition',
  MATHS_SUBTRACTION: '/maths/subtraction',
  MATHS_COUNTING: '/maths/counting',
  MATHS_COMPARE: '/maths/compare',
};


export const NAV_ITEMS = [
  { path: ROUTES.HOME, label: 'Home', icon: FaHome, ariaLabel: 'Home' },
  { path: ROUTES.LEARN, label: 'Learn', icon: FaBook, ariaLabel: 'Learning' },
  { path: ROUTES.GAMES, label: 'Games', icon: FaGamepad, ariaLabel: 'Games' },
  { path: ROUTES.PROFILE, label: 'Profile', icon: FaUser, ariaLabel: 'Profile' },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: FaCog, ariaLabel: 'Settings' },
];

export const isActiveRoute = (pathname, route) => {
  if (route === ROUTES.HOME) {
    return pathname === route;
  }
  return pathname.startsWith(route);
};
