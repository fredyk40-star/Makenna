/**
 * Music Data - Educational songs for children aged 5-8 in Ghana
 * Categorized by learning domain
 */

export const MUSIC_CATEGORIES = [
  { id: 'alphabet', label: 'Alphabet & Phonics', icon: '🔤', color: 'from-blue-400 to-purple-400' },
  { id: 'maths', label: 'Maths Songs', icon: '🔢', color: 'from-green-400 to-teal-400' },
  { id: 'science', label: 'Science Songs', icon: '🔬', color: 'from-cyan-400 to-blue-400' },
  { id: 'ghana', label: 'Ghana Songs', icon: '🇬🇭', color: 'from-red-400 to-yellow-400' },
  { id: 'bible', label: 'Bible Songs', icon: '✝️', color: 'from-purple-400 to-indigo-400' },
  { id: 'life-skills', label: 'Life Skills', icon: '🎯', color: 'from-pink-400 to-rose-400' },
  { id: 'safety', label: 'Safety Songs', icon: '🛡️', color: 'from-orange-400 to-amber-400' }
];

export const MUSIC_LIBRARY = [
  // Alphabet & Phonics Songs
  {
    id: 'abc-song',
    title: 'ABC Song',
    category: 'alphabet',
    description: 'Learn your ABCs with the classic alphabet song!',
    icon: '🎵',
    lyrics: [
      { words: 'A, B, C, D, E, F, G', timing: 0 },
      { words: 'H, I, J, K, L, M, N, O, P', timing: 4 },
      { words: 'Q, R, S, T, U, V', timing: 8 },
      { words: 'W, X, Y, Z', timing: 12 },
      { words: 'Now I know my ABCs!', timing: 16 }
    ],
    vocabWords: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    duration: 30,
    estimatedTime: 1
  },
  {
    id: 'letter-sounds',
    title: 'Letter Sounds',
    category: 'alphabet',
    description: 'Learn the sounds each letter makes!',
    icon: '🔤',
    lyrics: [
      { words: 'A says /aaa/', timing: 0 },
      { words: 'B says /buh/', timing: 4 },
      { words: 'C says /kuh/', timing: 8 },
      { words: 'D says /duh/', timing: 12 },
      { words: 'Practice every letter sound!', timing: 16 }
    ],
    vocabWords: ['A', 'B', 'C', 'D', 'sound', 'letter'],
    duration: 45,
    estimatedTime: 2
  },
  {
    id: 'vowel-song',
    title: 'Vowel Song',
    category: 'alphabet',
    description: 'A, E, I, O, U - the vowels in a fun song!',
    icon: '📢',
    lyrics: [
      { words: 'A, E, I, O, U', timing: 0 },
      { words: 'These are the vowels, hooray!', timing: 4 },
      { words: 'A as in Apple', timing: 8 },
      { words: 'E as in Elephant', timing: 12 },
      { words: 'I as in Ice cream', timing: 16 },
      { words: 'O as in Orange', timing: 20 },
      { words: 'U as in Umbrella', timing: 24 }
    ],
    vocabWords: ['vowel', 'apple', 'elephant', 'orange', 'umbrella'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'consonant-song',
    title: 'Consonant Song',
    category: 'alphabet',
    description: 'Learn about consonants and how they work!',
    icon: '🔤',
    lyrics: [
      { words: 'B, C, D, F, G, H', timing: 0 },
      { words: 'These are consonants, you see!', timing: 4 },
      { words: 'They need vowels to make words', timing: 8 },
      { words: 'Like cat, dog, and bird!', timing: 12 }
    ],
    vocabWords: ['consonant', 'vowel', 'cat', 'dog', 'bird'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'beginning-sounds',
    title: 'Beginning Sounds',
    category: 'alphabet',
    description: 'What sound does each word start with?',
    icon: '🔤',
    lyrics: [
      { words: 'Apple starts with A', timing: 0 },
      { words: 'Ball starts with B', timing: 4 },
      { words: 'Cat starts with C', timing: 8 },
      { words: 'Listen carefully to each sound!', timing: 12 }
    ],
    vocabWords: ['apple', 'ball', 'cat', 'sound', 'beginning'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'cvc-song',
    title: 'CVC Word Songs',
    category: 'alphabet',
    description: 'Consonant-Vowel-Consonant word magic!',
    icon: '📝',
    lyrics: [
      { words: 'Cat, hat, bat, rat', timing: 0 },
      { words: 'CVC words are fun!', timing: 4 },
      { words: 'Pig, dig, big, fig', timing: 8 },
      { words: 'Blend the sounds together!', timing: 12 }
    ],
    vocabWords: ['cat', 'hat', 'bat', 'rat', 'pig', 'CVC'],
    duration: 40,
    estimatedTime: 2
  },

  // Maths Songs
  {
    id: 'counting-1-20',
    title: 'Counting 1 to 20',
    category: 'maths',
    description: 'Count from 1 to 20 with fun songs!',
    icon: '🔢',
    lyrics: Array.from({ length: 20 }, (_, i) => ({
      words: `${i + 1}`,
      timing: i * 1
    })),
    vocabWords: ['one', 'two', 'three', 'four', 'five', 'count'],
    duration: 45,
    estimatedTime: 2
  },
  {
    id: 'counting-by-2s',
    title: 'Counting by 2s',
    category: 'maths',
    description: 'Skip count by 2s up to 20!',
    icon: '2️⃣',
    lyrics: [
      { words: '2, 4, 6, 8', timing: 0 },
      { words: '10, 12, 14, 16', timing: 4 },
      { words: '18, 20!', timing: 8 },
      { words: 'Even numbers, that\'s the key!', timing: 12 }
    ],
    vocabWords: ['two', 'four', 'six', 'eight', 'even'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'counting-by-5s',
    title: 'Counting by 5s',
    category: 'maths',
    description: 'Skip count by 5s to learn multiplication!',
    icon: '5️⃣',
    lyrics: [
      { words: '5, 10, 15, 20', timing: 0 },
      { words: '25, 30, 35, 40', timing: 4 },
      { words: 'Counting by fives is so grand!', timing: 8 }
    ],
    vocabWords: ['five', 'ten', 'fifteen', 'multiply'],
    duration: 25,
    estimatedTime: 2
  },
  {
    id: 'counting-by-10s',
    title: 'Counting by 10s',
    category: 'maths',
    description: 'Count by tens for big numbers!',
    icon: '🔟',
    lyrics: [
      { words: '10, 20, 30, 40', timing: 0 },
      { words: '50, 60, 70, 80', timing: 4 },
      { words: '90, 100!', timing: 8 },
      { words: 'Counting by tens makes math easy!', timing: 12 }
    ],
    vocabWords: ['ten', 'twenty', 'thirty', 'hundred'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'addition-song',
    title: 'Addition Songs',
    category: 'maths',
    description: 'Learn addition with catchy tunes!',
    icon: '➕',
    lyrics: [
      { words: 'One plus one equals two', timing: 0 },
      { words: 'Two plus two equals four', timing: 4 },
      { words: 'Three plus three equals six', timing: 8 },
      { words: 'Addition is so cool!', timing: 12 }
    ],
    vocabWords: ['plus', 'equals', 'add', 'addition'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'subtraction-song',
    title: 'Subtraction Songs',
    category: 'maths',
    description: 'Learn subtraction with fun songs!',
    icon: '➖',
    lyrics: [
      { words: 'Five minus one equals four', timing: 0 },
      { words: 'Six minus two equals four', timing: 4 },
      { words: 'Subtracting, taking away', timing: 8 },
      { words: 'Math is fun today!', timing: 12 }
    ],
    vocabWords: ['minus', 'subtract', 'equals', 'take away'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'shapes-song',
    title: 'Shapes Song',
    category: 'maths',
    description: 'Learn about circles, squares, and more!',
    icon: '🔷',
    lyrics: [
      { words: 'Circle, circle, round and round', timing: 0 },
      { words: 'Square, square, four sides', timing: 4 },
      { words: 'Triangle, triangle, pointy top', timing: 8 },
      { words: 'Rectangle, rectangle, tall or wide!', timing: 12 }
    ],
    vocabWords: ['circle', 'square', 'triangle', 'rectangle'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'money-song',
    title: 'Money Song',
    category: 'maths',
    description: 'Learn about coins and money!',
    icon: '💰',
    lyrics: [
      { words: 'One pesewa, two pesewas', timing: 0 },
      { words: 'Cedi and GHANA money', timing: 4 },
      { words: 'Saving coins for later', timing: 8 },
      { words: 'Math is greater!', timing: 12 }
    ],
    vocabWords: ['money', 'cedi', 'pesewa', 'save', 'coin'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'time-song',
    title: 'Time Song',
    category: 'maths',
    description: 'Learn to tell time on the clock!',
    icon: '⏰',
    lyrics: [
      { words: 'The big hand points to twelve', timing: 0 },
      { words: 'The small hand shows the hour', timing: 4 },
      { words: 'When the big hand points to six', timing: 8 },
      { words: 'It\'s half past, what a mix!', timing: 12 }
    ],
    vocabWords: ['time', 'hour', 'minute', 'clock', 'half past'],
    duration: 40,
    estimatedTime: 2
  },

  // Science Songs
  {
    id: 'plants-song',
    title: 'Plants Song',
    category: 'science',
    description: 'Learn about plants and how they grow!',
    icon: '🌱',
    lyrics: [
      { words: 'Roots go down in the soil', timing: 0 },
      { words: 'Stem goes up so tall', timing: 4 },
      { words: 'Leaves catch sunshine', timing: 8 },
      { words: 'Flowers bloom so fine!', timing: 12 }
    ],
    vocabWords: ['roots', 'stem', 'leaves', 'flower', 'soil'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'animals-song',
    title: 'Animals Song',
    category: 'science',
    description: 'Learn about animals and their homes!',
    icon: '🐘',
    lyrics: [
      { words: 'Lion lives in the savanna', timing: 0 },
      { words: 'Elephant walks with pride', timing: 4 },
      { words: 'Monkey swings in trees', timing: 8 },
      { words: 'Birds can fly and glide!', timing: 12 }
    ],
    vocabWords: ['lion', 'elephant', 'monkey', 'bird', 'animals'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'human-body-song',
    title: 'Human Body Song',
    category: 'science',
    description: 'Learn about your amazing body!',
    icon: '🫀',
    lyrics: [
      { words: 'Head, shoulders, knees and toes', timing: 0 },
      { words: 'Eyes and ears and mouth and nose', timing: 4 },
      { words: 'Your heart beats inside your chest', timing: 8 },
      { words: 'Your body is the best!', timing: 12 }
    ],
    vocabWords: ['head', 'shoulders', 'knees', 'toes', 'heart'],
    duration: 40,
    estimatedTime: 2
  },
  {
    id: 'weather-song',
    title: 'Weather Song',
    category: 'science',
    description: 'Learn about sunny, rainy, and cloudy days!',
    icon: '🌤️',
    lyrics: [
      { words: 'Sunny day, shining bright', timing: 0 },
      { words: 'Rainy day, wet and gray', timing: 4 },
      { words: 'Cloudy day, soft and white', timing: 8 },
      { words: 'Windy day, blow the kite!', timing: 12 }
    ],
    vocabWords: ['sunny', 'rainy', 'cloudy', 'windy', 'weather'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'water-cycle-song',
    title: 'Water Cycle Song',
    category: 'science',
    description: 'Learn how water moves around the Earth!',
    icon: '💧',
    lyrics: [
      { words: 'Evaporation, water rises up', timing: 0 },
      { words: 'Condensation, clouds form high', timing: 4 },
      { words: 'Precipitation, rain comes down', timing: 8 },
      { words: 'Water cycle goes around!', timing: 12 }
    ],
    vocabWords: ['evaporation', 'condensation', 'precipitation', 'cloud', 'rain'],
    duration: 45,
    estimatedTime: 3
  },
  {
    id: 'healthy-eating-song',
    title: 'Healthy Eating Song',
    category: 'science',
    description: 'Learn about good food for your body!',
    icon: '🥗',
    lyrics: [
      { words: 'Eat your fruits and vegetables', timing: 0 },
      { words: 'Carrots, apples, bananas too', timing: 4 },
      { words: 'Protein helps you grow up strong', timing: 8 },
      { words: 'Healthy eating for me and you!', timing: 12 }
    ],
    vocabWords: ['fruits', 'vegetables', 'protein', 'healthy', 'eat'],
    duration: 40,
    estimatedTime: 2
  },

  // Ghana Songs
  {
    id: 'national-anthem',
    title: 'Ghana National Anthem',
    category: 'ghana',
    description: 'Sing Ghana\'s beautiful national song!',
    icon: '🇬🇭',
    lyrics: [
      { words: 'God bless our homeland Ghana', timing: 0 },
      { words: 'Raise high the flag of Ghana', timing: 4 },
      { words: 'Proud and free, we sing your name', timing: 8 },
      { words: 'Ghana, Ghana, we love you!', timing: 12 }
    ],
    vocabWords: ['Ghana', 'homeland', 'flag', 'freedom', 'bless'],
    duration: 60,
    estimatedTime: 3
  },
  {
    id: 'national-pledge',
    title: 'Ghana National Pledge',
    category: 'ghana',
    description: 'The pledge of loyalty to Ghana!',
    icon: '🇬🇭',
    lyrics: [
      { words: 'I promise to be faithful', timing: 0 },
      { words: 'To the Republic of Ghana', timing: 4 },
      { words: 'To do my duty to my nation', timing: 8 },
      { words: 'And to uphold her name!', timing: 12 }
    ],
    vocabWords: ['promise', 'faithful', 'Ghana', 'duty', 'nation'],
    duration: 45,
    estimatedTime: 3
  },
  {
    id: 'traditional-nursery',
    title: 'Traditional Nursery Rhymes',
    category: 'ghana',
    description: 'Beautiful Ghanaian nursery rhymes!',
    icon: '🎶',
    lyrics: [
      { words: 'Kokooko kooko kooko', timing: 0 },
      { words: 'The cock has crowed', timing: 4 },
      { words: 'Time to rise and shine', timing: 8 },
      { words: 'In beautiful Ghana land!', timing: 12 }
    ],
    vocabWords: ['Kokooko', 'traditional', 'Ghana', 'rhyme'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'twi-children',
    title: 'Twi Children Songs',
    category: 'ghana',
    description: 'Learn in Twi language!',
    icon: '🗣️',
    lyrics: [
      { words: 'Eyi ye sum mu', translation: 'This is Sunday', timing: 0 },
      { words: 'Eyi ye kwasu mu', translation: 'This is Monday', timing: 4 },
      { words: 'Twi language is so sweet', translation: '', timing: 8 },
      { words: 'Learning is a treat!', translation: '', timing: 12 }
    ],
    vocabWords: ['Twi', 'Sunday', 'Monday', 'language', 'learn'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'ga-children',
    title: 'Ga Children Songs',
    category: 'ghana',
    description: 'Learn in Ga language!',
    icon: '🗣️',
    lyrics: [
      { words: 'Koose koose', translation: 'Beans beans', timing: 0 },
      { words: 'Kokonte kokonte', translation: 'Spicy spicy', timing: 4 },
      { words: 'Ga language is so nice', translation: '', timing: 8 },
      { words: 'Learning feels so nice!', translation: '', timing: 12 }
    ],
    vocabWords: ['Ga', 'language', 'beans', 'kokonte', 'learn'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'ewe-children',
    title: 'Ewe Children Songs',
    category: 'ghana',
    description: 'Learn in Ewe language!',
    icon: '🗣️',
    lyrics: [
      { words: 'Agbe agbe', translation: 'Life life', timing: 0 },
      { words: 'Kplolo kplolo', translation: 'School school', timing: 4 },
      { words: 'Ewe language is so fun', translation: '', timing: 8 },
      { words: 'Learning has begun!', translation: '', timing: 12 }
    ],
    vocabWords: ['Ewe', 'language', 'life', 'school', 'learn'],
    duration: 30,
    estimatedTime: 2
  },

  // Bible Songs
  {
    id: 'jesus-loves-me',
    title: 'Jesus Loves Me',
    category: 'bible',
    description: 'A classic Bible song for children!',
    icon: '✝️',
    lyrics: [
      { words: 'Jesus loves me', timing: 0 },
      { words: 'This I know', translation: '', timing: 4 },
      { words: 'For the Bible tells me so', translation: '', timing: 8 },
      { words: 'Little ones to Him belong', translation: '', timing: 12 },
      { words: 'They are weak, but He is strong', translation: '', timing: 16 }
    ],
    vocabWords: ['Jesus', 'love', 'Bible', 'strong', 'little'],
    duration: 45,
    estimatedTime: 2
  },
  {
    id: 'little-light',
    title: 'This Little Light of Mine',
    category: 'bible',
    description: 'Let your light shine bright!',
    icon: '✨',
    lyrics: [
      { words: 'This little light of mine', timing: 0 },
      { words: 'I\'m gonna let it shine', timing: 4 },
      { words: 'Let it shine, let it shine', timing: 8 },
      { words: 'Let it shine!', timing: 12 }
    ],
    vocabWords: ['light', 'shine', 'let', 'mine', 'bright'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'father-abraham',
    title: 'Father Abraham',
    category: 'bible',
    description: 'A fun song about Father Abraham!',
    icon: '👴',
    lyrics: [
      { words: 'Father Abraham had many sons', timing: 0 },
      { words: 'Many many many sons', timing: 4 },
      { words: 'And they were very strong', translation: '', timing: 8 },
      { words: 'And they were very strong', translation: '', timing: 12 }
    ],
    vocabWords: ['Father', 'Abraham', 'sons', 'strong', 'many'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'bible-memory',
    title: 'Bible Memory Verse Songs',
    category: 'bible',
    description: 'Memorize Bible verses in a fun way!',
    icon: '📖',
    lyrics: [
      { words: 'Train up a child in the way', timing: 0 },
      { words: 'And he will not depart', timing: 4 },
      { words: 'From the way of the Lord', translation: '', timing: 8 },
      { words: 'Proverbs chapter, from the heart!', translation: '', timing: 12 }
    ],
    vocabWords: ['Bible', 'memory', 'verse', 'teach', 'learn'],
    duration: 40,
    estimatedTime: 3
  },

  // Life Skills Songs
  {
    id: 'wash-hands',
    title: 'Wash Your Hands',
    category: 'life-skills',
    description: 'Learn proper hand washing with a song!',
    icon: '🧼',
    lyrics: [
      { words: 'Wash your hands before you eat', timing: 0 },
      { words: 'Scrub them clean and make them neat', timing: 4 },
      { words: 'Rub between each finger', timing: 8 },
      { words: 'For a clean and healthy singer!', timing: 12 }
    ],
    vocabWords: ['wash', 'hands', 'clean', 'soap', 'healthy'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'be-kind',
    title: 'Be Kind',
    category: 'life-skills',
    description: 'Learn how to be kind to others!',
    icon: '💖',
    lyrics: [
      { words: 'Be kind to your family', timing: 0 },
      { words: 'Be kind to your friends', timing: 4 },
      { words: 'Share what you have', timing: 8 },
      { words: 'Kindness never ends!', translation: '', timing: 12 }
    ],
    vocabWords: ['kind', 'family', 'friends', 'share', 'love'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'share-with-others',
    title: 'Share With Others',
    category: 'life-skills',
    description: 'Sharing makes everyone happy!',
    icon: '🤝',
    lyrics: [
      { words: 'Share your toys with others', timing: 0 },
      { words: 'Share your snacks with care', timing: 4 },
      { words: 'When we share and play together', timing: 8 },
      { words: 'Love is everywhere!', translation: '', timing: 12 }
    ],
    vocabWords: ['share', 'toys', 'care', 'play', 'together'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'say-thank-you',
    title: 'Say Thank You',
    category: 'life-skills',
    description: 'Learn to be thankful with this song!',
    icon: '🙏',
    lyrics: [
      { words: 'Say thank you when you get a gift', timing: 0 },
      { words: 'Say thank you when you eat', timing: 4 },
      { words: 'Gratitude is a special thing', timing: 8 },
      { words: 'It makes our hearts feel great!', translation: '', timing: 12 }
    ],
    vocabWords: ['thank', 'gratitude', 'gift', 'happy', 'share'],
    duration: 35,
    estimatedTime: 2
  },

  // Safety Songs
  {
    id: 'road-safety',
    title: 'Road Safety Song',
    category: 'safety',
    description: 'Stay safe when crossing the road!',
    icon: '🚸',
    lyrics: [
      { words: 'Look both ways before you cross', timing: 0 },
      { words: 'Wait for the light to say go', timing: 4 },
      { words: 'Hold hands with your family', timing: 8 },
      { words: 'Road safety is the key!', translation: '', timing: 12 }
    ],
    vocabWords: ['safety', 'road', 'cross', 'careful', 'family'],
    duration: 35,
    estimatedTime: 2
  },
  {
    id: 'fire-safety',
    title: 'Fire Safety Song',
    category: 'safety',
    description: 'Learn fire safety rules!',
    icon: '🔥',
    lyrics: [
      { words: 'Stop, drop, and roll', timing: 0 },
      { words: 'If your clothes catch fire', timing: 4 },
      { words: 'Tell a grown-up right away', timing: 8 },
      { words: 'Fire safety saves the day!', translation: '', timing: 12 }
    ],
    vocabWords: ['fire', 'safety', 'stop', 'roll', 'help'],
    duration: 30,
    estimatedTime: 2
  },
  {
    id: 'water-safety',
    title: 'Water Safety Song',
    category: 'safety',
    description: 'Stay safe near water!',
    icon: '🏊',
    lyrics: [
      { words: 'Never swim alone', timing: 0 },
      { words: 'Always have a grown-up near', timing: 4 },
      { words: 'Pools and lakes can be so fun', timing: 8 },
      { words: 'But safety must be clear!', translation: '', timing: 12 }
    ],
    vocabWords: ['water', 'safety', 'swim', 'pool', 'careful'],
    duration: 30,
    estimatedTime: 2
  }
];

// Music games data
export const MUSIC_GAMES = [
  {
    id: 'tap-beat',
    title: 'Tap the Beat',
    description: 'Tap along to the rhythm!',
    icon: '👏',
    category: 'rhythm',
    difficulty: 'easy',
    estimatedTime: 3,
    color: 'from-red-400 to-pink-400'
  },
  {
    id: 'guess-animal-sound',
    title: 'Guess the Animal Sound',
    description: 'Listen and identify animal sounds!',
    icon: '🐄',
    category: 'listening',
    difficulty: 'easy',
    estimatedTime: 5,
    color: 'from-green-400 to-teal-400'
  },
  {
    id: 'fill-missing-lyric',
    title: 'Fill the Missing Lyric',
    description: 'Complete the song lyrics!',
    icon: '✍️',
    category: 'words',
    difficulty: 'medium',
    estimatedTime: 4,
    color: 'from-blue-400 to-indigo-400'
  },
  {
    id: 'rhythm-memory',
    title: 'Rhythm Memory Game',
    description: 'Repeat the rhythm pattern!',
    icon: '🧠',
    category: 'memory',
    difficulty: 'medium',
    estimatedTime: 5,
    color: 'from-purple-400 to-pink-400'
  },
  {
    id: 'musical-flashcards',
    title: 'Musical Flashcards',
    description: 'Learn vocabulary through songs!',
    icon: '🎴',
    category: 'vocabulary',
    difficulty: 'easy',
    estimatedTime: 4,
    color: 'from-yellow-400 to-orange-400'
  }
];

export const getSongById = (id) => {
  return MUSIC_LIBRARY.find(song => song.id === id);
};

export const getSongsByCategory = (category) => {
  return MUSIC_LIBRARY.filter(song => song.category === category);
};

export const searchSongs = (query) => {
  const lowerQuery = query.toLowerCase();
  return MUSIC_LIBRARY.filter(song =>
    song.title.toLowerCase().includes(lowerQuery) ||
    song.description.toLowerCase().includes(lowerQuery) ||
    song.vocabWords.some(word => word.toLowerCase().includes(lowerQuery))
  );
};

export const GAME_CATEGORIES = [
  { id: 'all', label: 'All Games', icon: '🎮' },
  { id: 'rhythm', label: 'Rhythm', icon: '👏' },
  { id: 'listening', label: 'Listening', icon: '👂' },
  { id: 'words', label: 'Words', icon: '✍️' },
  { id: 'memory', label: 'Memory', icon: '🧠' },
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚' }
];