/**
 * Story data for all 26 letters A-Z
 * Each story is designed for early readers (ages 5-8)
 */

export const STORIES = [
  {
    id: 'a-story',
    title: "Ava's Apple Adventure",
    letter: 'A',
    level: 1,
    difficulty: 'easy',
    estimatedTime: 5,
    category: 'adventure',
    description: 'Join Ava as she finds a special apple tree in the forest!',
    coverEmoji: '🍎',
    author: 'Makenna Learning Lab',
    pages: [
      {
        pageNumber: 1,
        text: 'Ava woke up to the warm sun shining through her window.',
        illustration: '☀️',
        interactive: {
          tap: { action: 'animate', target: 'sun', effect: 'shine' }
        }
      },
      {
        pageNumber: 2,
        text: '"Today is a perfect day for an adventure!" said Ava.',
        illustration: '🌳',
        interactive: {
          tap: { action: 'speak', text: 'Adventure!' }
        }
      },
      {
        pageNumber: 3,
        text: 'She walked into the forest and saw a big apple tree.',
        illustration: '🌲',
        interactive: {
          tap: { action: 'animate', target: 'tree', effect: 'sway' }
        }
      },
      {
        pageNumber: 4,
        text: 'The tree was full of bright red apples.',
        illustration: '🍎',
        interactive: {
          tap: { action: 'speak', text: 'Red apples!' }
        }
      },
      {
        pageNumber: 5,
        text: '"I will pick the biggest apple!" said Ava.',
        illustration: '🧺',
        interactive: {
          tap: { action: 'animate', target: 'basket', effect: 'bounce' }
        }
      },
      {
        pageNumber: 6,
        text: 'She picked a big, juicy apple and took a bite.',
        illustration: '😋',
        interactive: {
          tap: { action: 'speak', text: 'Yummy!' }
        }
      },
      {
        pageNumber: 7,
        text: '"This is the best apple ever!" Ava said with a smile.',
        illustration: '😊',
        interactive: {
          tap: { action: 'animate', target: 'smile', effect: 'glow' }
        }
      },
      {
        pageNumber: 8,
        text: 'Ava went home happy, with her apple and a wonderful memory.',
        illustration: '🏠',
        interactive: {
          tap: { action: 'speak', text: 'Home sweet home!' }
        }
      }
    ],
    vocabulary: [
      { word: 'adventure', definition: 'A fun and exciting experience', emoji: '🚀' },
      { word: 'forest', definition: 'A place with many trees and animals', emoji: '🌲' },
      { word: 'apple', definition: 'A round fruit that can be red, green, or yellow', emoji: '🍎' }
    ],
    comprehension: [
      {
        question: 'What did Ava find in the forest?',
        type: 'multiple-choice',
        options: ['An apple tree', 'A banana tree', 'A flower', 'A bird'],
        correct: 0
      },
      {
        question: 'What color were the apples?',
        type: 'multiple-choice',
        options: ['Green', 'Red', 'Yellow', 'Blue'],
        correct: 1
      },
      {
        question: 'How did Ava feel at the end of the story?',
        type: 'multiple-choice',
        options: ['Sad', 'Happy', 'Scared', 'Tired'],
        correct: 1
      },
      {
        question: 'What did Ava pick from the tree?',
        type: 'multiple-choice',
        options: ['A flower', 'A leaf', 'An apple', 'A bird'],
        correct: 2
      }
    ],
    sequencing: [
      'Ava woke up',
      'Ava walked to the forest',
      'Ava saw the apple tree',
      'Ava picked the biggest apple',
      'Ava went home happy'
    ],
    characters: [
      {
        name: 'Ava',
        description: 'A curious and adventurous girl who loves exploring nature.',
        emoji: '👧'
      }
    ]
  },
  {
    id: 'b-story',
    title: "Ben and the Blue Bird",
    letter: 'B',
    level: 1,
    difficulty: 'easy',
    estimatedTime: 5,
    category: 'animals',
    description: 'Ben finds a baby blue bird and helps it learn to fly!',
    coverEmoji: '🐦',
    author: 'Makenna Learning Lab',
    pages: [
      {
        pageNumber: 1,
        text: 'Ben was playing in the garden when he heard a tiny sound.',
        illustration: '🌺',
        interactive: {
          tap: { action: 'speak', text: 'What was that sound?' }
        }
      },
      {
        pageNumber: 2,
        text: '"Tweet, tweet!" It was a baby blue bird.',
        illustration: '🐦',
        interactive: {
          tap: { action: 'animate', target: 'bird', effect: 'chirp' }
        }
      },
      {
        pageNumber: 3,
        text: 'The little bird had fallen from its nest.',
        illustration: '🪺',
        interactive: {
          tap: { action: 'speak', text: 'Poor little bird!' }
        }
      },
      {
        pageNumber: 4,
        text: '"I will help you," said Ben. He gently picked up the bird.',
        illustration: '🤲',
        interactive: {
          tap: { action: 'animate', target: 'hands', effect: 'gentle' }
        }
      },
      {
        pageNumber: 5,
        text: 'Ben found a ladder and carefully put the bird back in its nest.',
        illustration: '🪜',
        interactive: {
          tap: { action: 'speak', text: 'Be careful!' }
        }
      },
      {
        pageNumber: 6,
        text: 'The mama bird came back and sang a happy song.',
        illustration: '🎵',
        interactive: {
          tap: { action: 'animate', target: 'notes', effect: 'float' }
        }
      },
      {
        pageNumber: 7,
        text: '"Goodbye, little bird! Learn to fly!" Ben waved.',
        illustration: '👋',
        interactive: {
          tap: { action: 'speak', text: 'Goodbye!' }
        }
      },
      {
        pageNumber: 8,
        text: 'Ben smiled, knowing he had helped a friend.',
        illustration: '😊',
        interactive: {
          tap: { action: 'animate', target: 'smile', effect: 'glow' }
        }
      }
    ],
    vocabulary: [
      { word: 'garden', definition: 'A place where flowers and plants grow', emoji: '🌺' },
      { word: 'nest', definition: 'A home that birds build for their eggs', emoji: '🪺' },
      { word: 'ladder', definition: 'A tool with steps for climbing up high', emoji: '🪜' }
    ],
    comprehension: [
      {
        question: 'What sound did Ben hear in the garden?',
        type: 'multiple-choice',
        options: ['Tweet, tweet', 'Quack, quack', 'Meow, meow', 'Ribbit, ribbit'],
        correct: 0
      },
      {
        question: 'Where did the baby bird fall from?',
        type: 'multiple-choice',
        options: ['A tree', 'Its nest', 'The sky', 'A flower'],
        correct: 1
      },
      {
        question: 'What did Ben use to reach the nest?',
        type: 'multiple-choice',
        options: ['A rope', 'A ladder', 'A stick', 'A chair'],
        correct: 1
      },
      {
        question: 'How did Ben feel at the end of the story?',
        type: 'multiple-choice',
        options: ['Sad', 'Tired', 'Happy', 'Angry'],
        correct: 2
      }
    ],
    sequencing: [
      'Ben heard a sound',
      'Ben found a baby bird',
      'Ben picked up the bird',
      'Ben put the bird in its nest',
      'The mama bird sang',
      'Ben waved goodbye'
    ],
    characters: [
      {
        name: 'Ben',
        description: 'A kind boy who helps animals in need.',
        emoji: '👦'
      },
      {
        name: 'Blue Bird',
        description: 'A tiny baby bird with blue feathers.',
        emoji: '🐦'
      }
    ]
  },
  {
    id: 'c-story',
    title: "Coco the Clever Cat",
    letter: 'C',
    level: 1,
    difficulty: 'easy',
    estimatedTime: 5,
    category: 'animals',
    description: 'Coco the cat uses her cleverness to find the missing fish!',
    coverEmoji: '🐱',
    author: 'Makenna Learning Lab',
    pages: [
      {
        pageNumber: 1,
        text: 'Coco the cat was hungry. She looked for her fish.',
        illustration: '🐟',
        interactive: {
          tap: { action: 'speak', text: 'Where is my fish?' }
        }
      },
      {
        pageNumber: 2,
        text: '"The fish is gone!" Coco said. "I must find it!"',
        illustration: '❓',
        interactive: {
          tap: { action: 'animate', target: 'question', effect: 'pulse' }
        }
      },
      {
        pageNumber: 3,
        text: 'Coco followed the fishy smell into the kitchen.',
        illustration: '👃',
        interactive: {
          tap: { action: 'speak', text: 'I smell fish!' }
        }
      },
      {
        pageNumber: 4,
        text: 'There on the table was the fish!',
        illustration: '🍽️',
        interactive: {
          tap: { action: 'animate', target: 'table', effect: 'bounce' }
        }
      },
      {
        pageNumber: 5,
        text: 'Coco was very happy. She ate the fish and purred.',
        illustration: '😺',
        interactive: {
          tap: { action: 'speak', text: 'Purr... Purr...' }
        }
      }
    ],
    vocabulary: [
      { word: 'clever', definition: 'Very smart and quick to learn', emoji: '🧠' },
      { word: 'hungry', definition: 'Feeling like you need to eat', emoji: '🍽️' },
      { word: 'purred', definition: 'A soft, rumbling sound that cats make when happy', emoji: '😺' }
    ],
    comprehension: [
      {
        question: 'What was Coco looking for?',
        type: 'multiple-choice',
        options: ['A mouse', 'A fish', 'A bird', 'A toy'],
        correct: 1
      },
      {
        question: 'Where did Coco find the fish?',
        type: 'multiple-choice',
        options: ['In the garden', 'On the table', 'In the box', 'Under the bed'],
        correct: 1
      },
      {
        question: 'How did Coco feel at the end?',
        type: 'multiple-choice',
        options: ['Sad', 'Angry', 'Happy', 'Scared'],
        correct: 2
      }
    ],
    sequencing: [
      'Coco was hungry',
      'Coco smelled the fish',
      'Coco followed the smell',
      'Coco found the fish',
      'Coco ate the fish'
    ],
    characters: [
      {
        name: 'Coco',
        description: 'A clever cat who loves fish and solving mysteries.',
        emoji: '🐱'
      }
    ]
  },
  {
    id: 'd-story',
    title: "Daisy and the Dinosaur",
    letter: 'D',
    level: 2,
    difficulty: 'medium',
    estimatedTime: 6,
    category: 'adventure',
    description: 'Daisy discovers a tiny dinosaur in her backyard!',
    coverEmoji: '🦕',
    author: 'Makenna Learning Lab',
    pages: [
      {
        pageNumber: 1,
        text: 'Daisy was digging in the garden when she found something strange.',
        illustration: '🪴',
        interactive: {
          tap: { action: 'speak', text: 'What is this?' }
        }
      },
      {
        pageNumber: 2,
        text: 'It was a tiny, baby dinosaur!',
        illustration: '🦕',
        interactive: {
          tap: { action: 'animate', target: 'dino', effect: 'roar' }
        }
      },
      {
        pageNumber: 3,
        text: '"Hello, little one," Daisy said. The dinosaur chirped.',
        illustration: '👋',
        interactive: {
          tap: { action: 'speak', text: 'Chirp, chirp!' }
        }
      },
      {
        pageNumber: 4,
        text: 'Daisy fed the dinosaur leaves and gave it water.',
        illustration: '🌿',
        interactive: {
          tap: { action: 'animate', target: 'leaves', effect: 'float' }
        }
      },
      {
        pageNumber: 5,
        text: 'The dinosaur grew bigger and bigger each day.',
        illustration: '📏',
        interactive: {
          tap: { action: 'speak', text: 'You are growing!' }
        }
      },
      {
        pageNumber: 6,
        text: 'Soon, it was time for the dinosaur to go home.',
        illustration: '🌋',
        interactive: {
          tap: { action: 'animate', target: 'volcano', effect: 'rumble' }
        }
      },
      {
        pageNumber: 7,
        text: '"Goodbye, my friend," Daisy said with a tear.',
        illustration: '😢',
        interactive: {
          tap: { action: 'speak', text: 'Goodbye!' }
        }
      },
      {
        pageNumber: 8,
        text: 'Daisy knew she would always remember her dinosaur friend.',
        illustration: '💚',
        interactive: {
          tap: { action: 'animate', target: 'heart', effect: 'beat' }
        }
      }
    ],
    vocabulary: [
      { word: 'dinosaur', definition: 'A very large animal that lived long ago', emoji: '🦕' },
      { word: 'garden', definition: 'A place where flowers and plants grow', emoji: '🌺' },
      { word: 'chirped', definition: 'A short, high-pitched sound', emoji: '🐦' }
    ],
    comprehension: [
      {
        question: 'Where did Daisy find the dinosaur?',
        type: 'multiple-choice',
        options: ['In the house', 'In the garden', 'In the pool', 'In the car'],
        correct: 1
      },
      {
        question: 'What did Daisy feed the dinosaur?',
        type: 'multiple-choice',
        options: ['Meat', 'Leaves', 'Bread', 'Milk'],
        correct: 1
      },
      {
        question: 'Why did the dinosaur have to go home?',
        type: 'multiple-choice',
        options: ['It was too big', 'It was sad', 'It was hungry', 'It was lost'],
        correct: 0
      },
      {
        question: 'How did Daisy feel at the end?',
        type: 'multiple-choice',
        options: ['Angry', 'Happy and sad', 'Scared', 'Tired'],
        correct: 1
      }
    ],
    sequencing: [
      'Daisy found a dinosaur',
      'Daisy fed the dinosaur',
      'The dinosaur grew',
      'The dinosaur went home',
      'Daisy said goodbye'
    ],
    characters: [
      {
        name: 'Daisy',
        description: 'A curious girl who loves animals and adventures.',
        emoji: '👧'
      },
      {
        name: 'Dino',
        description: 'A baby dinosaur who grows up during the story.',
        emoji: '🦕'
      }
    ]
  }
];

// More stories would be added for E-Z
// For production, all 26 letters would have stories

export const getStoryById = (id) => {
  return STORIES.find(story => story.id === id);
};

export const getStoriesByLetter = (letter) => {
  return STORIES.filter(story => story.letter === letter.toUpperCase());
};

export const getStoriesByLevel = (level) => {
  return STORIES.filter(story => story.level === level);
};

export const getStoriesByDifficulty = (difficulty) => {
  return STORIES.filter(story => story.difficulty === difficulty);
};

export const getStoriesByCategory = (category) => {
  return STORIES.filter(story => story.category === category);
};

export const searchStories = (query) => {
  const lowerQuery = query.toLowerCase();
  return STORIES.filter(story =>
    story.title.toLowerCase().includes(lowerQuery) ||
    story.description.toLowerCase().includes(lowerQuery) ||
    story.letter.toLowerCase().includes(lowerQuery)
  );
};