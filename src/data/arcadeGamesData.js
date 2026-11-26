/**
 * Data-driven configurations for the lightweight arcade games.
 * Every entry maps a game id to a mechanic and the data that mechanic needs.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = ['A', 'E', 'I', 'O', 'U'];

const WORDS = {
  A: ['Apple', '🍎'], B: ['Ball', '⚽'], C: ['Cat', '🐱'], D: ['Dog', '🐶'],
  E: ['Egg', '🥚'], F: ['Fish', '🐟'], G: ['Goat', '🐐'], H: ['Hat', '🎩'],
  I: ['Ice cream', '🍦'], J: ['Juice', '🧃'], K: ['Kite', '🪁'], L: ['Lion', '🦁'],
  M: ['Mango', '🥭'], N: ['Nest', '🪺'], O: ['Orange', '🍊'], P: ['Pen', '🖊️'],
  Q: ['Queen', '👑'], R: ['Rainbow', '🌈'], S: ['Sun', '☀️'], T: ['Tree', '🌳'],
  U: ['Umbrella', '☂️'], V: ['Van', '🚐'], W: ['Water', '💧'], X: ['Xylophone', '🎼'],
  Y: ['Yoyo', '🪀'], Z: ['Zebra', '🦓'],
};

const SHAPES = [
  { id: 'circle', label: 'Circle', visual: '🔵' },
  { id: 'square', label: 'Square', visual: '🟦' },
  { id: 'triangle', label: 'Triangle', visual: '🔺' },
  { id: 'star', label: 'Star', visual: '⭐' },
  { id: 'heart', label: 'Heart', visual: '❤️' },
  { id: 'diamond', label: 'Diamond', visual: '💎' },
];

const COLOURS = [
  { id: 'red', label: 'Red', visual: '🔴' },
  { id: 'blue', label: 'Blue', visual: '🔵' },
  { id: 'green', label: 'Green', visual: '🟢' },
  { id: 'yellow', label: 'Yellow', visual: '🟡' },
  { id: 'purple', label: 'Purple', visual: '🟣' },
  { id: 'orange', label: 'Orange', visual: '🟠' },
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const pick = (items, count) => shuffle(items).slice(0, count);

const letterOptions = (answer, count = 4) =>
  shuffle([answer, ...pick(ALPHABET.filter((letter) => letter !== answer), count - 1)])
    .map((letter) => ({ id: letter, label: letter, visual: letter }));

const wordOptions = (answerLetter, count = 4) => {
  const correct = { id: answerLetter, label: WORDS[answerLetter][0], visual: WORDS[answerLetter][1] };
  const others = pick(
    ALPHABET.filter((letter) => letter !== answerLetter),
    count - 1
  ).map((letter) => ({ id: letter, label: WORDS[letter][0], visual: WORDS[letter][1] }));
  return shuffle([correct, ...others]);
};

const pictureOptions = (answerLetter, count = 4) =>
  shuffle(wordOptions(answerLetter, count).map((option) => ({
    id: option.id,
    label: `${WORDS[option.id][0]} (${option.id})`,
    visual: option.visual,
  })));

const choiceRounds = (letters, builder) =>
  letters.map((letter) => builder(letter));

const listenRounds = (letters) =>
  choiceRounds(letters, (letter) => ({
    prompt: `Tap the letter ${letter}`,
    speak: `Find the letter ${letter}`,
    options: letterOptions(letter),
    answerId: letter,
  }));

const soundRounds = (letters) =>
  choiceRounds(letters, (letter) => ({
    prompt: `Which letter starts "${WORDS[letter][0]}"?`,
    speak: `Which letter starts with ${WORDS[letter][0]}?`,
    options: letterOptions(letter),
    answerId: letter,
    visual: WORDS[letter][1],
  }));

const choiceOptions = (items, answerId, count = 4) =>
  shuffle([
    items.find((item) => item.id === answerId),
    ...pick(items.filter((item) => item.id !== answerId), count - 1),
  ]);

const shapeChoiceRounds = (shapes) =>
  shapes.map((shape) => ({
    prompt: `Tap the ${shape.label.toLowerCase()}`,
    speak: `Find the ${shape.label.toLowerCase()}`,
    options: choiceOptions(shapes, shape.id).map((option) => ({
      id: option.id,
      label: option.label,
      visual: option.visual,
    })),
    answerId: shape.id,
  }));

const colourChoiceRounds = (colours) =>
  colours.map((colour) => ({
    prompt: `Tap the colour ${colour.label.toLowerCase()}`,
    speak: `Find the colour ${colour.label.toLowerCase()}`,
    options: choiceOptions(colours, colour.id).map((option) => ({
      id: option.id,
      label: option.label,
      visual: option.visual,
    })),
    answerId: colour.id,
  }));

const pairsFrom = (items) =>
  items.map((item) => ({ id: item.id, label: item.label, visual: item.visual }));

const game = (id, title, icon, description, difficulty, backPath, mechanic, data) => ({
  id, title, icon, description, difficulty, backPath, mechanic, data,
});

export const ALPHABET_ARCADE_GAMES = [
  game('letter-hunt', 'Letter Hunt', '🔍', 'Listen and tap the letters you hear!', 'easy',
    '/games/alphabet', 'hunt', {
      instruction: 'Tap every letter you hear in the grid!',
      targets: ['A', 'C', 'E', 'G'],
      grid: ALPHABET.slice(0, 12).map((letter) => ({ id: letter, label: letter })),
      speak: 'Find the letters A, C, E and G!',
    }),
  game('letter-match', 'Letter Match', '🔄', 'Match letters to pictures!', 'easy',
    '/games/alphabet', 'choice', {
      rounds: choiceRounds(['A', 'B', 'C', 'D', 'E'], (letter) => ({
        prompt: `Which picture starts with ${letter}?`,
        speak: `Which picture starts with the letter ${letter}?`,
        options: pictureOptions(letter),
        answerId: letter,
      })),
    }),
  game('memory-cards', 'Memory Cards', '🃏', 'Flip cards and find matching pairs!', 'medium',
    '/games/alphabet', 'memory', {
      instruction: 'Flip two cards at a time to find matching letters.',
      pairs: pairsFrom(['A', 'B', 'C', 'D'].map((letter) => ({
        id: letter, label: letter, visual: letter,
      }))),
    }),
  game('bubble-pop', 'Bubble Pop', '🫧', 'Pop the bubbles with the right letter!', 'easy',
    '/games/alphabet', 'choice', {
      variant: 'bubble',
      rounds: listenRounds(['B', 'D', 'F', 'H']),
    }),
  game('alphabet-bingo', 'Alphabet Bingo', '🎯', 'Listen and tap the letters on your card!', 'medium',
    '/games/alphabet', 'bingo', {
      instruction: 'Tap the called letter on your bingo card.',
      card: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
      calls: ['C', 'A', 'G', 'E', 'I', 'B'],
    }),
  game('alphabet-order', 'Alphabet Order', '📊', 'Arrange the letters from A to Z!', 'medium',
    '/games/alphabet', 'sequence', {
      instruction: 'Tap the letters in alphabetical order.',
      items: ['A', 'B', 'C', 'D', 'E'].map((letter) => ({ id: letter, label: letter })),
    }),
  game('beginning-sounds', 'Beginning Sounds', '🔊', 'Match the sound to the right letter!', 'medium',
    '/games/alphabet', 'choice', { rounds: soundRounds(['M', 'S', 'T', 'P', 'L']) }),
  game('vowel-sorting', 'Vowel Sorting', '📚', 'Sort vowels and consonants!', 'hard',
    '/games/alphabet', 'sort', {
      instruction: 'Tap a letter, then tap Vowels or Consonants.',
      bins: [
        { id: 'vowel', label: 'Vowels', visual: '🔤' },
        { id: 'consonant', label: 'Consonants', visual: '🅲' },
      ],
      items: ['A', 'B', 'E', 'F', 'I', 'O'].map((letter) => ({
        id: letter,
        label: letter,
        binId: VOWELS.includes(letter) ? 'vowel' : 'consonant',
      })),
    }),
  game('shadow-match', 'Shadow Match', '🌓', 'Match letters to their shadows!', 'easy',
    '/games/alphabet', 'choice', {
      variant: 'shadow',
      rounds: listenRounds(['Q', 'R', 'S', 'T']),
    }),
  game('picture-builder', 'Picture Builder', '🧩', 'Choose the beginning letter for each picture!', 'medium',
    '/games/alphabet', 'choice', { rounds: soundRounds(['F', 'H', 'J', 'N', 'W']) }),
  game('letter-train', 'Letter Train', '🚂', 'Connect the alphabet in the right order!', 'medium',
    '/games/alphabet', 'sequence', {
      instruction: 'Tap the letters in the right order to build the train.',
      items: ['J', 'K', 'L', 'M', 'N', 'O'].map((letter) => ({ id: letter, label: letter })),
    }),
  game('treasure-hunt', 'Treasure Hunt', '🗺️', 'Collect letters to unlock the treasure!', 'hard',
    '/games/alphabet', 'hunt', {
      instruction: 'Find the hidden letters to unlock the treasure chest!',
      targets: ['T', 'R', 'E', 'S'],
      grid: ALPHABET.slice(0, 16).map((letter) => ({ id: letter, label: letter })),
      speak: 'Find the letters T, R, E and S!',
    }),
];

export const SHAPES_ARCADE_GAMES = [
  game('shape-match', 'Shape Match', '🔄', 'Match the shapes!', 'easy',
    '/games/shapes', 'choice', { rounds: shapeChoiceRounds(SHAPES) }),
  game('find-the-shape', 'Find the Shape', '🔍', 'Find all the hidden shapes!', 'medium',
    '/games/shapes', 'hunt', {
      instruction: 'Tap every shape in the grid!',
      targets: ['circle', 'star', 'heart'],
      grid: SHAPES.map((shape) => ({ id: shape.id, label: shape.visual })),
      speak: 'Find the circle, the star and the heart!',
    }),
  game('colour-picker', 'Colour Picker', '🎨', 'Pick the right colour!', 'easy',
    '/games/shapes', 'choice', { rounds: colourChoiceRounds(COLOURS) }),
  game('shape-sorting', 'Shape Sorting', '📥', 'Sort objects by shape!', 'easy',
    '/games/shapes', 'sort', {
      instruction: 'Tap an object, then tap the matching shape bin.',
      bins: SHAPES.slice(0, 3).map((shape) => ({ id: shape.id, label: shape.label, visual: shape.visual })),
      items: [
        { id: 'ball', label: 'Ball ⚽', binId: 'circle' },
        { id: 'box', label: 'Box 📦', binId: 'square' },
        { id: 'cone', label: 'Cone 🍦', binId: 'triangle' },
        { id: 'sun', label: 'Sun ☀️', binId: 'circle' },
        { id: 'kite', label: 'Kite 🪁', binId: 'square' },
      ].map((item) => ({ ...item, visual: item.label.split(' ').pop() })),
    }),
  game('shape-memory', 'Shape Memory', '🃏', 'Flip cards and find matching shapes!', 'medium',
    '/games/shapes', 'memory', {
      instruction: 'Flip two cards at a time to find matching shapes.',
      pairs: pairsFrom(SHAPES.slice(0, 4)),
    }),
];

export const MUSIC_ARCADE_GAMES = [
  game('tap-beat', 'Tap the Beat', '👏', 'Tap along to the rhythm!', 'easy',
    '/music/games', 'sequence', {
      instruction: 'Tap the beat four times in a row.',
      items: ['b1', 'b2', 'b3', 'b4'].map((id) => ({ id, label: '👏' })),
    }),
  game('guess-animal-sound', 'Guess the Animal Sound', '🐄', 'Listen and identify animal sounds!', 'easy',
    '/music/games', 'choice', {
      rounds: [
        { prompt: 'Moo! Which animal says moo?', speak: 'Moo! Which animal says moo?',
          options: [{ id: 'cow', label: 'Cow', visual: '🐄' }, { id: 'dog', label: 'Dog', visual: '🐶' },
            { id: 'cat', label: 'Cat', visual: '🐱' }, { id: 'duck', label: 'Duck', visual: '🦆' }], answerId: 'cow' },
        { prompt: 'Quack! Which animal says quack?', speak: 'Quack! Which animal says quack?',
          options: [{ id: 'duck', label: 'Duck', visual: '🦆' }, { id: 'cow', label: 'Cow', visual: '🐄' },
            { id: 'sheep', label: 'Sheep', visual: '🐑' }, { id: 'frog', label: 'Frog', visual: '🐸' }], answerId: 'duck' },
        { prompt: 'Woof! Which animal says woof?', speak: 'Woof! Which animal says woof?',
          options: [{ id: 'dog', label: 'Dog', visual: '🐶' }, { id: 'cat', label: 'Cat', visual: '🐱' },
            { id: 'hen', label: 'Hen', visual: '🐔' }, { id: 'goat', label: 'Goat', visual: '🐐' }], answerId: 'dog' },
      ],
    }),
  game('fill-missing-lyric', 'Fill the Missing Lyric', '✍️', 'Complete the song lyrics!', 'medium',
    '/music/games', 'choice', {
      rounds: [
        { prompt: 'Twinkle, twinkle, little ___', speak: 'Twinkle, twinkle, little what?',
          options: [{ id: 'star', label: 'Star', visual: '⭐' }, { id: 'car', label: 'Car', visual: '🚗' },
            { id: 'dog', label: 'Dog', visual: '🐶' }, { id: 'hat', label: 'Hat', visual: '🎩' }], answerId: 'star' },
        { prompt: 'Old MacDonald had a ___', speak: 'Old MacDonald had a what?',
          options: [{ id: 'farm', label: 'Farm', visual: '🚜' }, { id: 'ship', label: 'Ship', visual: '🚢' },
            { id: 'moon', label: 'Moon', visual: '🌙' }, { id: 'book', label: 'Book', visual: '📖' }], answerId: 'farm' },
        { prompt: 'Row, row, row your ___', speak: 'Row, row, row your what?',
          options: [{ id: 'boat', label: 'Boat', visual: '⛵' }, { id: 'chair', label: 'Chair', visual: '🪑' },
            { id: 'ball', label: 'Ball', visual: '⚽' }, { id: 'cake', label: 'Cake', visual: '🎂' }], answerId: 'boat' },
      ],
    }),
  game('rhythm-memory', 'Rhythm Memory Game', '🧠', 'Repeat the rhythm pattern!', 'medium',
    '/music/games', 'memory', {
      instruction: 'Flip two cards at a time to match the musical sounds.',
      pairs: pairsFrom([
        { id: 'note', label: 'Note', visual: '🎵' },
        { id: 'notes', label: 'Notes', visual: '🎶' },
        { id: 'drum', label: 'Drum', visual: '🥁' },
        { id: 'guitar', label: 'Guitar', visual: '🎸' },
      ]),
    }),
  game('musical-flashcards', 'Musical Flashcards', '🎴', 'Learn vocabulary through songs!', 'easy',
    '/music/games', 'choice', {
      rounds: [
        { prompt: 'Which one is a bell?', speak: 'Find the bell!',
          options: [{ id: 'bell', label: 'Bell', visual: '🔔' }, { id: 'ball', label: 'Ball', visual: '⚽' },
            { id: 'fish', label: 'Fish', visual: '🐟' }, { id: 'tree', label: 'Tree', visual: '🌳' }], answerId: 'bell' },
        { prompt: 'Which one is a piano?', speak: 'Find the piano!',
          options: [{ id: 'sun', label: 'Sun', visual: '☀️' }, { id: 'piano', label: 'Piano', visual: '🎹' },
            { id: 'cat', label: 'Cat', visual: '🐱' }, { id: 'hat', label: 'Hat', visual: '🎩' }], answerId: 'piano' },
        { prompt: 'Which one is a trumpet?', speak: 'Find the trumpet!',
          options: [{ id: 'trumpet', label: 'Trumpet', visual: '🎺' }, { id: 'book', label: 'Book', visual: '📖' },
            { id: 'mango', label: 'Mango', visual: '🥭' }, { id: 'star', label: 'Star', visual: '⭐' }], answerId: 'trumpet' },
      ],
    }),
];

export const getArcadeGame = (collection, id) =>
  collection.find((entry) => entry.id === id) || null;
