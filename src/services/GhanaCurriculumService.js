/**
 * GhanaCurriculumService - Content aligned with Ghana educational standards
 * Provides learning content structured for Ghana's curriculum (KG1-KG2, Basic 1-2)
 */
import { StorageService } from './StorageService';
import { 
  GHANA_REGIONS_DATA, 
  GHANAIAN_FOODS, 
  GHANAIAN_FESTIVALS, 
  GHANAIAN_CURRENCY, 
  GHANAIAN_CLOTHS, 
  GHANAIAN_ANIMALS, 
  GHANAIAN_MARKETS, 
  GHANAIAN_PROVERBS, 
  GHANAIAN_SYMBOLS 
} from '../data/ghanaData';

const CURRICULUM_KEY = 'makenna_ghana_curriculum_v1';

export class GhanaCurriculumService {
  /**
   * Get curriculum content by subject
   */
  static getSubjectContent(subject) {
    const curriculum = StorageService.get(CURRICULUM_KEY, this.getDefaultCurriculum());
    return curriculum[subject] || [];
  }

  /**
   * Get all curriculum subjects
   */
  static getSubjects() {
    const curriculum = StorageService.get(CURRICULUM_KEY, this.getDefaultCurriculum());
    return Object.keys(curriculum);
  }

  /**
   * Get default Ghana curriculum
   */
  static getDefaultCurriculum() {
    return {
      // Local Languages
      twi: [
        { id: 't1', title: 'Twi Alphabet', content: 'Learning the Twi alphabet letters (A, E, Ɛ, I, O, etc.)...', level: 'KG1', lesson: 'alphabet', image: '🔤' },
        { id: 't2', title: 'Common Words', content: 'Basic Twi vocabulary for kids: Mma (water), Ofie (house), Nkɔm (food)...', level: 'KG1', lesson: 'vocabulary', image: '📚' },
        { id: 't3', title: 'Greetings', content: 'How to greet in Twi: "Good morning" = Mema wo akye, "Thank you" = Meda wo ase', level: 'KG1', lesson: 'greetings', image: '👋' },
        { id: 't4', title: 'Numbers in Twi', content: 'Counting in Twi: 1=Ɛdan, 2=Ade, 3=Ɛtin, 4=Ɛnan, 5=Ɛnum...', level: 'KG2', lesson: 'numbers', image: '🔢' },
        { id: 't5', title: 'Days of the Week', content: 'Days in Twi: Dwɔɔdwo, Ben, Wuku, Tah, Fida, Memmal, Kwakwada', level: 'Basic1', lesson: 'days', image: '📅' },
        { id: 't6', title: 'Family Words', content: 'Family terms: Papa (father), Mama (mother), Nana (grandparent)...', level: 'KG2', lesson: 'family', image: '👨‍👩‍👧‍👦' },
      ],
      ewe: [
        { id: 'e1', title: 'Ewe Alphabet', content: 'Learning the Ewe alphabet letters...', level: 'KG1', lesson: 'alphabet', image: '🔤' },
        { id: 'e2', title: 'Common Words', content: 'Basic Ewe vocabulary for kids...', level: 'KG1', lesson: 'vocabulary', image: '📚' },
        { id: 'e3', title: 'Greetings in Ewe', content: 'Greetings: "Good morning" = Ŋutɔ̃ si ɖõ, "Thank you" = Meda siɣi', level: 'KG1', lesson: 'greetings', image: '👋' },
        { id: 'e4', title: 'Family Words', content: 'Family terms in Ewe: Dada (father), Mama (mother)', level: 'KG2', lesson: 'family', image: '👨‍👩‍👧‍👦' },
      ],
      ga: [
        { id: 'g1', title: 'Ga Alphabet', content: 'Learning the Ga alphabet...', level: 'KG1', lesson: 'alphabet', image: '🔤' },
        { id: 'g2', title: 'Greetings in Ga', content: 'Greetings: "Good morning" = Mema wo akye, "Thank you" = Asie ɔ', level: 'KG1', lesson: 'greetings', image: '👋' },
        { id: 'g3', title: 'Sea Creatures', content: 'Fish and creatures from the sea in Ga language', level: 'KG2', lesson: 'animals', image: '🐟' },
      ],
      
      // English Language
      english: [
        { id: 'en1', title: 'Vowels', content: 'Learning the vowel sounds: A, E, I, O, U with examples from Ghanaian names...', level: 'KG1', lesson: 'vowels', image: '🔤' },
        { id: 'en2', title: 'Consonants', content: 'Learning consonant sounds with Ghanaian examples: Kwame, Kojo, Boatema...', level: 'KG2', lesson: 'consonants', image: '📖' },
        { id: 'en3', title: 'Sight Words', content: 'High-frequency words: the, and, is, in, on...', level: 'KG2', lesson: 'sight-words', image: '👀' },
        { id: 'en4', title: 'CVC Words', content: 'Three-letter words: cat, dog, sun, hat, pot...', level: 'Basic1', lesson: 'reading', image: '📚' },
        { id: 'en5', title: 'Sentence Building', content: 'Putting words together to make sentences...', level: 'Basic1', lesson: 'writing', image: '✏️' },
        { id: 'en6', title: 'Ghanaian Names', content: 'Common Ghanaian names: Kwame, Akosua, Kofi, Adwoa...', level: 'KG1', lesson: 'names', image: '📛' },
      ],
      
      // Mathematics
      mathematics: [
        { id: 'm1', title: 'Counting 1-10', content: 'Learning to count from 1 to 10...', level: 'KG1', lesson: 'counting', image: '🔢' },
        { id: 'm2', title: 'Adding with Objects', content: 'Addition using fingers and objects...', level: 'KG2', lesson: 'addition', image: '➕' },
        { id: 'm3', title: 'Ghanaian Money', content: 'Learning about Cedi and Pesewas - count coins and notes!', level: 'Basic1', lesson: 'money', image: '₵' },
        { id: 'm4', title: 'Shapes Around Us', content: 'Recognizing shapes in our environment...', level: 'KG2', lesson: 'shapes', image: '🔷' },
        { id: 'm5', title: 'Measuring Length', content: 'Comparing long and short objects...', level: 'Basic1', lesson: 'measurement', image: '📏' },
        { id: 'm6', title: 'Currency Exchange', content: 'Understanding how to use Cedi coins and notes in markets', level: 'Basic2', lesson: 'shopping', image: '🏪' },
      ],
      
      // Science
      science: [
        { id: 's1', title: 'Local Animals', content: 'Animals found in Ghana: Lion, Elephant, Zebra...', level: 'KG2', lesson: 'animals', image: '🦁' },
        { id: 's2', title: 'Ghanaian Food', content: 'Traditional foods: Fufu, Banku, Kenkey...', level: 'KG1', lesson: 'food', image: '🍽️' },
        { id: 's3', title: 'Weather Patterns', content: 'Rainy season and dry season in Ghana...', level: 'Basic1', lesson: 'weather', image: '🌦️' },
        { id: 's4', title: 'Parts of a Plant', content: 'Roots, stem, leaves, flowers, fruits...', level: 'Basic2', lesson: 'plants', image: '🌱' },
        { id: 's5', title: 'Water Cycle', content: 'How water moves from earth to sky and back...', level: 'Basic2', lesson: 'water', image: '💧' },
        { id: 's6', title: 'Our Environment', content: 'Learning about Ghana\'s forests, rivers, and beaches', level: 'KG2', lesson: 'environment', image: '🌳' },
      ],
      
      // Social Studies
      social_studies: [
        { id: 'ss1', title: 'Regions of Ghana', content: 'Learning about Ghana\'s 16 regions and their capitals...', level: 'Basic1', lesson: 'regions', image: '🗺️' },
        { id: 'ss2', title: 'Local Markets', content: 'Traditional markets in Ghana: Makola, Kejetia...', level: 'KG2', lesson: 'markets', image: '🏪' },
        { id: 'ss3', title: 'Festivals', content: 'Ghanaian festivals: Homowo, Aboakyer, Damba...', level: 'Basic1', lesson: 'festivals', image: '🎉' },
        { id: 'ss4', title: 'National Symbols', content: 'Flag, coat of arms, national anthem...', level: 'Basic2', lesson: 'symbols', image: '🇬🇭' },
      ],
      
      // Creative Arts
      creative_arts: [
        { id: 'ca1', title: 'Kente Patterns', content: 'Learning about colorful Kente cloth designs...', level: 'KG2', lesson: 'textiles', image: '🎨' },
        { id: 'ca2', title: 'Adinkra Symbols', content: 'Symbols that tell stories: Gye Nyame, Sankofa...', level: 'Basic1', lesson: 'symbols', image: '⬢' },
        { id: 'ca3', title: 'Drawing Shapes', content: 'Creating art with circles, squares, triangles...', level: 'KG1', lesson: 'drawing', image: '✏️' },
        { id: 'ca4', title: 'Traditional Music', content: 'Drums, rattles, and other local instruments...', level: 'KG2', lesson: 'music', image: '🥁' },
      ],
      
      // Religious & Moral Education
      rme: [
        { id: 'rme1', title: 'Good Behavior', content: 'Being kind, honest, and helpful...', level: 'KG1', lesson: 'behavior', image: '😊' },
        { id: 'rme2', title: 'Sharing and Caring', content: 'Why we should share with others...', level: 'KG2', lesson: 'sharing', image: '🤝' },
        { id: 'rme3', title: 'Respect for Others', content: 'Showing respect to parents and elders...', level: 'Basic1', lesson: 'respect', image: '🙏' },
        { id: 'rme4', title: 'Ghanaian Proverbs', content: 'Learning wisdom from our ancestors...', level: 'Basic2', lesson: 'proverbs', image: '💬' },
      ],
      
      // Life Skills
      life_skills: [
        { id: 'ls1', title: 'Counting Money', content: 'How to count Ghanaian currency...', level: 'Basic1', lesson: 'money', image: '💰' },
        { id: 'ls2', title: 'Basic Hygiene', content: 'Washing hands, brushing teeth...', level: 'KG1', lesson: 'hygiene', image: '🧼' },
        { id: 'ls3', title: 'Healthy Eating', content: 'Eating fruits and vegetables...', level: 'KG2', lesson: 'health', image: '🥗' },
      ],
    };
  }

  /**
   * Get Ghana-specific games
   */
  static getGhanaGames() {
    return [
      { id: 'market-match', name: 'Market Match', subject: 'social_studies', difficulty: 'easy', description: 'Match items sold in Ghanaian markets' },
      { id: 'food-sort', name: 'Food Sorter', subject: 'science', difficulty: 'medium', description: 'Sort traditional Ghanaian foods' },
      { id: 'festival-quiz', name: 'Festival Quiz', subject: 'social_studies', difficulty: 'hard', description: 'Test your knowledge of Ghanaian festivals' },
      { id: 'kente-colors', name: 'Kente Colors', subject: 'creative_arts', difficulty: 'easy', description: 'Learn Kente cloth patterns and meanings' },
      { id: 'region-identify', name: 'Find the Region', subject: 'social_studies', difficulty: 'medium', description: 'Identify Ghanaian regions on a map' },
      { id: 'cedi-count', name: 'Cedi Counting', subject: 'mathematics', difficulty: 'easy', description: 'Practice counting Ghanaian money' },
    ];
  }

  /**
   * Get stories in local languages
   */
  static getLocalStories() {
    return [
      { id: 'anu', title: 'Anansi and the Pot of Wisdom', language: 'twi', moral: 'Think before you act' },
      { id: 'tortoise', title: 'Tortoise and His Friend', language: 'ewe', moral: 'Friendship' },
      { id: 'kente', title: 'Origin of Kente Cloth', language: 'twi', moral: 'Creativity' },
      { id: 'sankofa', title: 'Sankofa Bird', language: 'english', moral: 'Learn from the past' },
    ];
  }

  /**
   * Get cultural facts
   */
  static getCulturalFacts() {
    return [
      { id: 'kente', fact: 'Kente cloth originates from the Ashanti region and is handwoven', category: 'culture', image: '🎨' },
      { id: 'adinkra', fact: 'Adinkra symbols represent proverbs and concepts', category: 'culture', image: '⬢' },
      { id: 'fufu', fact: 'Fufu is made from cassava and plantain', category: 'food', image: '🍠' },
      { id: 'homowo', fact: 'Homowo festival celebrates the harvest in Ga tradition', category: 'festival', image: '🎉' },
      { id: 'akwaaba', fact: 'Akwaaba means welcome in Twi', category: 'language', image: '👋' },
      { id: 'ghana', fact: 'Ghana has 16 regions and over 50 languages', category: 'geography', image: '🗺️' },
    ];
  }

  /**
   * Get Ghana regions data
   */
  static getRegions() {
    return GHANA_REGIONS_DATA;
  }

  /**
   * Get Ghanaian foods
   */
  static getFoods() {
    return GHANAIAN_FOODS;
  }

  /**
   * Get Ghanaian festivals
   */
  static getFestivals() {
    return GHANAIAN_FESTIVALS;
  }

  /**
   * Get Ghanaian currency
   */
  static getCurrency() {
    return GHANAIAN_CURRENCY;
  }

  /**
   * Get Ghanaian traditional cloths
   */
  static getCloths() {
    return GHANAIAN_CLOTHS;
  }

  /**
   * Get Ghanaian animals
   */
  static getAnimals() {
    return GHANAIAN_ANIMALS;
  }

  /**
   * Get Ghanaian markets
   */
  static getMarkets() {
    return GHANAIAN_MARKETS;
  }

  /**
   * Get Ghanaian proverbs
   */
  static getProverbs() {
    return GHANAIAN_PROVERBS;
  }

  /**
   * Get Ghanaian symbols
   */
  static getSymbols() {
    return GHANAIAN_SYMBOLS;
  }

  /**
   * Get content filtered by level
   */
  static getContentByLevel(level) {
    const curriculum = this.getDefaultCurriculum();
    const result = {};
    
    Object.entries(curriculum).forEach(([subject, items]) => {
      result[subject] = items.filter(item => item.level === level);
    });
    
    return result;
  }
}