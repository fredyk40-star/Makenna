/**
 * Reading Engine - Core reading and word building logic
 * Supports phonics, blending, word families, and sight words
 */

export class ReadingEngine {
  constructor() {
    this.wordFamilies = this.initializeWordFamilies();
    this.sightWords = this.initializeSightWords();
    this.phonemes = this.initializePhonemes();
    this.blendingRules = this.initializeBlendingRules();
  }

  /**
   * Initialize word families data
   */
  initializeWordFamilies() {
    return {
      'at': {
        family: 'at',
        words: ['cat', 'bat', 'hat', 'mat', 'sat', 'rat', 'fat'],
        sound: '/æt/',
        examples: ['The cat is big.', 'The hat is red.', 'The rat is small.']
      },
      'an': {
        family: 'an',
        words: ['man', 'fan', 'can', 'pan', 'van', 'ran'],
        sound: '/æn/',
        examples: ['The man is tall.', 'The fan is on.', 'I can run.']
      },
      'ig': {
        family: 'ig',
        words: ['pig', 'dig', 'wig', 'big', 'fig', 'jig'],
        sound: '/ɪg/',
        examples: ['The pig is pink.', 'I dig in the sand.', 'My wig is brown.']
      },
      'op': {
        family: 'op',
        words: ['top', 'hop', 'pop', 'mop', 'cop', 'drop'],
        sound: '/ɒp/',
        examples: ['The top is spinning.', 'I can hop.', 'Pop goes the balloon.']
      },
      'ug': {
        family: 'ug',
        words: ['bug', 'hug', 'mug', 'jug', 'rug', 'lug'],
        sound: '/ʌg/',
        examples: ['The bug is small.', 'I give a hug.', 'My mug is blue.']
      },
      'et': {
        family: 'et',
        words: ['pet', 'vet', 'net', 'jet', 'get', 'set'],
        sound: '/ɛt/',
        examples: ['I have a pet.', 'The vet helps animals.', 'The net catches fish.']
      },
      'ot': {
        family: 'ot',
        words: ['hot', 'pot', 'dot', 'not', 'got', 'lot'],
        sound: '/ɒt/',
        examples: ['The soup is hot.', 'My pot is red.', 'A dot is small.']
      },
      'en': {
        family: 'en',
        words: ['pen', 'hen', 'ten', 'den', 'men', 'when'],
        sound: '/ɛn/',
        examples: ['I write with a pen.', 'The hen has chicks.', 'I have ten fingers.']
      },
      'in': {
        family: 'in',
        words: ['pin', 'win', 'tin', 'bin', 'gin', 'skin'],
        sound: '/ɪn/',
        examples: ['I pin the paper.', 'I can win the game.', 'The tin is shiny.']
      },
      'un': {
        family: 'un',
        words: ['run', 'sun', 'fun', 'bun', 'gun', 'nun'],
        sound: '/ʌn/',
        examples: ['I can run fast.', 'The sun is bright.', 'We have fun!']
      }
    };
  }

  /**
   * Initialize sight words
   */
  initializeSightWords() {
    return [
      { word: 'I', frequency: 1, category: 'pronoun' },
      { word: 'am', frequency: 1, category: 'verb' },
      { word: 'the', frequency: 1, category: 'article' },
      { word: 'you', frequency: 1, category: 'pronoun' },
      { word: 'we', frequency: 1, category: 'pronoun' },
      { word: 'is', frequency: 1, category: 'verb' },
      { word: 'it', frequency: 1, category: 'pronoun' },
      { word: 'go', frequency: 1, category: 'verb' },
      { word: 'to', frequency: 1, category: 'preposition' },
      { word: 'my', frequency: 1, category: 'possessive' },
      { word: 'like', frequency: 2, category: 'verb' },
      { word: 'see', frequency: 2, category: 'verb' },
      { word: 'can', frequency: 1, category: 'verb' },
      { word: 'and', frequency: 1, category: 'conjunction' },
      { word: 'me', frequency: 2, category: 'pronoun' },
      { word: 'you', frequency: 1, category: 'pronoun' },
      { word: 'for', frequency: 2, category: 'preposition' },
      { word: 'are', frequency: 2, category: 'verb' },
      { word: 'with', frequency: 2, category: 'preposition' },
      { word: 'she', frequency: 2, category: 'pronoun' }
    ];
  }

  /**
   * Initialize phonemes
   */
  initializePhonemes() {
    return {
      'c': { sound: '/k/', type: 'consonant', examples: ['cat', 'cup'] },
      'a': { sound: '/æ/', type: 'vowel', examples: ['apple', 'ant'] },
      't': { sound: '/t/', type: 'consonant', examples: ['top', 'ten'] },
      'd': { sound: '/d/', type: 'consonant', examples: ['dog', 'dig'] },
      'o': { sound: '/ɒ/', type: 'vowel', examples: ['hot', 'pot'] },
      'g': { sound: '/g/', type: 'consonant', examples: ['go', 'get'] },
      's': { sound: '/s/', type: 'consonant', examples: ['sun', 'sit'] },
      'u': { sound: '/ʌ/', type: 'vowel', examples: ['sun', 'up'] },
      'n': { sound: '/n/', type: 'consonant', examples: ['net', 'not'] },
      'p': { sound: '/p/', type: 'consonant', examples: ['pig', 'pen'] },
      'b': { sound: '/b/', type: 'consonant', examples: ['big', 'bat'] },
      'e': { sound: '/ɛ/', type: 'vowel', examples: ['red', 'pen'] },
      'h': { sound: '/h/', type: 'consonant', examples: ['hat', 'hop'] },
      'm': { sound: '/m/', type: 'consonant', examples: ['man', 'mop'] },
      'f': { sound: '/f/', type: 'consonant', examples: ['fan', 'fish'] },
      'r': { sound: '/r/', type: 'consonant', examples: ['run', 'rat'] },
      'i': { sound: '/ɪ/', type: 'vowel', examples: ['pig', 'dig'] },
      'l': { sound: '/l/', type: 'consonant', examples: ['let', 'lot'] },
      'w': { sound: '/w/', type: 'consonant', examples: ['win', 'wig'] },
      'y': { sound: '/j/', type: 'consonant', examples: ['yes', 'you'] }
    };
  }

  /**
   * Initialize blending rules
   */
  initializeBlendingRules() {
    return {
      'CVC': {
        pattern: 'consonant-vowel-consonant',
        examples: ['cat', 'dog', 'pig', 'sun'],
        description: 'Simple three-letter words'
      },
      'CVCC': {
        pattern: 'consonant-vowel-consonant-consonant',
        examples: ['frog', 'plant', 'tent'],
        description: 'Four-letter words with double consonants'
      },
      'CCVC': {
        pattern: 'consonant-consonant-vowel-consonant',
        examples: ['stop', 'flag', 'trip'],
        description: 'Four-letter words with double consonants at start'
      }
    };
  }

  /**
   * Get word family data
   */
  getWordFamily(family) {
    return this.wordFamilies[family] || null;
  }

  /**
   * Get all word families
   */
  getAllWordFamilies() {
    return this.wordFamilies;
  }

  /**
   * Get sight words by level
   */
  getSightWords(level = 1) {
    return this.sightWords.filter(word => word.frequency <= level);
  }

  /**
   * Get all sight words
   */
  getAllSightWords() {
    return this.sightWords;
  }

  /**
   * Build a word from letters
   */
  buildWord(letters) {
    return letters.join('');
  }

  /**
   * Check if a word is valid
   */
  isValidWord(word) {
    // Check if word exists in any word family
    for (const family of Object.values(this.wordFamilies)) {
      if (family.words.includes(word.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get word family for a word
   */
  getWordFamilyForWord(word) {
    const lowerWord = word.toLowerCase();
    for (const [family, data] of Object.entries(this.wordFamilies)) {
      if (data.words.includes(lowerWord)) {
        return family;
      }
    }
    return null;
  }

  /**
   * Get rhyming words for a word
   */
  getRhymingWords(word) {
    const family = this.getWordFamilyForWord(word);
    if (!family) return [];
    return this.wordFamilies[family].words.filter(w => w !== word.toLowerCase());
  }

  /**
   * Get words with a specific letter pattern
   */
  getWordsByPattern(pattern) {
    const results = [];
    for (const family of Object.values(this.wordFamilies)) {
      for (const word of family.words) {
        if (word.includes(pattern)) {
          results.push(word);
        }
      }
    }
    return results;
  }

  /**
   * Split word into phonemes
   */
  segmentWord(word) {
    return word.toLowerCase().split('');
  }

  /**
   * Generate blending sequence for a word
   */
  generateBlendingSequence(word) {
    const letters = this.segmentWord(word);
    const sequence = [];
    
    // Build up the word gradually
    for (let i = 0; i < letters.length; i++) {
      const partial = letters.slice(0, i + 1);
      const phonemes = partial.map(l => {
        const phoneme = this.phonemes[l];
        return phoneme ? phoneme.sound : l;
      });
      sequence.push({
        word: partial.join(''),
        phonemes: phonemes,
        isComplete: i === letters.length - 1
      });
    }
    
    return sequence;
  }

  /**
   * Get sentence examples for a word
   */
  getWordExamples(word) {
    const family = this.getWordFamilyForWord(word);
    if (!family) return null;
    return this.wordFamilies[family].examples;
  }

  /**
   * Generate reading practice sentences
   */
  generateReadingPractice(level = 1) {
    const sentences = [];
    const words = this.getSightWords(level);
    const families = Object.values(this.wordFamilies);
    
    // Simple sentences with sight words and CVC words
    const templates = [
      'I am a {word}.',
      'The {word} is big.',
      'I see the {word}.',
      'Go to the {word}.',
      'My {word} is red.',
      'We like the {word}.',
      'Can you see the {word}?',
      'The {word} is here.'
    ];
    
    // Generate sentences
    for (let i = 0; i < 10; i++) {
      const family = families[Math.floor(Math.random() * families.length)];
      const word = family.words[Math.floor(Math.random() * family.words.length)];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      sentences.push({
        sentence: template.replace('{word}', word),
        word: word,
        family: family.family,
        level: level
      });
    }
    
    return sentences;
  }

  /**
   * Get difficulty level for a word
   */
  getWordDifficulty(word) {
    const length = word.length;
    if (length <= 3) return 'easy';
    if (length <= 4) return 'medium';
    return 'hard';
  }
}

// Singleton instance
const readingEngine = new ReadingEngine();
export default readingEngine;