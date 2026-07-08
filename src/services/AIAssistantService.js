/**
 * AI Learning Assistant Service - Personalized AI tutor for each child
 * Greets by name, gives encouragement, suggests lessons, detects mistakes
 * Now with enhanced voice commands and interactive Q&A!
 */
import { StorageService } from './StorageService';
import AdaptiveLearningService from './AdaptiveLearningService';
import { GamificationService } from './GamificationService';
import { ProfileService } from './ProfileService';

const AI_STATE_KEY = 'makenna_ai_assistant_state';
const AI_CONFIG_KEY = 'makenna_ai_config_v1';
const AI_VOICE_COMMANDS_KEY = 'makenna_ai_voice_commands_v1';
const AI_INTERACTIONS_KEY = 'makenna_ai_interactions_v1';

// Encouragement messages organized by category
const ENCOURAGEMENT_MESSAGES = {
  greeting: [
    "Hello {name}! Let's have fun learning today!",
    "Hi {name}! I'm excited to learn with you!",
    "Good to see you, {name}! Ready for some learning?",
    "Hey there, {name}! Let's start our learning adventure!"
  ],
  praise: [
    "Great job, {name}!",
    "You're doing amazing!",
    "Wow, you're a superstar!",
    "Excellent work!",
    "Keep it up, champion!"
  ],
  improvement: [
    "You're improving so much, {name}!",
    "I can see your progress, well done!",
    "You're getting better every time!",
    "Fantastic improvement!"
  ],
  revision: [
    "Let's practice {subject} again to get even better!",
    "{name}, let's review this together.",
    "Some practice will help us remember this!",
    "Let's revisit this and make it stick!"
  ],
  suggestion: [
    "How about we try {subject} next?",
    "Let's continue with {subject}!",
    "Ready for more {subject}?",
    "{name}, you should try {subject} - you'll love it!"
  ],
  mistake: [
    "It's okay, {name}! We all make mistakes. Let's try again!",
    "Don't worry, {name}! Learning takes practice.",
    "That's alright! You're learning and that's what matters!",
    "You're doing your best, {name}! Let's give it another go!"
  ],
  hint: [
    "Here's a hint: {hint}",
    "Let me help! {hint}",
    "Think about this: {hint}",
    "You can do it! {hint}"
  ]
};

// Knowledge base for interactive Q&A
const KNOWLEDGE_BASE = {
  alphabet: {
    'a': 'A is for Apple! The letter A makes an "ah" sound. Can you say "ah"?',
    'b': 'B is for Ball! The letter B makes a "buh" sound. Watch my lips!',
    'c': 'C is for Cat! The letter C makes a "kuh" sound sometimes.',
    'default': 'That\'s a letter! Each letter has a special sound it makes.'
  },
  numbers: {
    '0': 'Zero! That\'s the number 0. It means nothing - no cookies, no toys!',
    '1': 'One! That\'s the number 1. Just one sun in the sky!',
    '2': 'Two! That\'s the number 2. Two eyes on your face!',
    '3': 'Three! That\'s the number 3. Three little pigs!',
    '4': 'Four! That\'s the number 4. Four seasons in a year!',
    '5': 'Five! That\'s the number 5. Five fingers on your hand!',
    '6': 'Six! That\'s the number 6. Six legs on an ant!',
    '7': 'Seven! That\'s the number 7. Seven days in a week!',
    '8': 'Eight! That\'s the number 8. Eight sides on an octagon!',
    '9': 'Nine! That\'s the number 9. Nine lives for a cat!',
    '10': 'Ten! That\'s the number 10. Count your fingers - ten! Ten toes too!',
    'default': 'Numbers help us count! Can you count with me?'
  },
  colors: {
    'red': 'Red is like a juicy apple or a fire truck! What red things can you find?',
    'blue': 'Blue is like the ocean or the sky! It\'s very calming.',
    'yellow': 'Yellow is like the sun or a happy banana! It\'s so bright!',
    'green': 'Green is like grass or leaves! It makes us think of nature.',
    'default': 'Colors are beautiful! What\'s your favorite color?'
  },
  shapes: {
    'circle': 'A circle has no corners! Like a pizza or a ball - round and round!',
    'square': 'A square has four equal sides and four corners! Like a box!',
    'triangle': 'A triangle has three sides and three corners! Like a slice of pizza!',
    'rectangle': 'A rectangle has four sides - two long and two short! Like a door!',
    'default': 'Shapes are everywhere! Look around and spot them!'
  },
  math: {
    'addition': 'Addition means putting things together! Like 2 apples + 2 apples = 4 apples!',
    'subtraction': 'Subtraction means taking away! If you have 5 cookies and eat 2, you have 3 left!',
    'counting': 'Counting helps us know how many! 1, 2, 3, 4, 5... keep going!',
    'default': 'Math helps us solve puzzles every day!'
  }
};

export class AIAssistantService {
  /**
   * Get AI state for a child
   */
  static getState(childId) {
    const allStates = StorageService.get(AI_STATE_KEY, {});
    if (!allStates[childId]) {
      allStates[childId] = {
        lastInteraction: null,
        interactionCount: 0,
        favoriteSubject: null,
        revisionNeeded: [],
        lastSuggestion: null,
        lastPage: null
      };
      StorageService.set(AI_STATE_KEY, allStates);
    }
    return allStates[childId];
  }

  /**
   * Save AI state for a child
   */
  static saveState(childId, state) {
    const allStates = StorageService.get(AI_STATE_KEY, {});
    allStates[childId] = state;
    StorageService.set(AI_STATE_KEY, allStates);
  }

  /**
   * Get child's first name
   */
  static getFirstName(fullName) {
    if (!fullName) return 'Friend';
    return fullName.split(' ')[0] || fullName;
  }

  /**
   * Get personalized greeting
   */
  static getGreeting(childId, fullName) {
    const name = this.getFirstName(fullName);
    const messages = ENCOURAGEMENT_MESSAGES.greeting;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    this.recordInteraction(childId, 'greeting');
    
    return message.replace('{name}', name);
  }

  /**
   * Record an interaction
   */
  static recordInteraction(childId, type) {
    const state = this.getState(childId);
    state.lastInteraction = new Date().toISOString();
    state.interactionCount++;
    
    // Reset daily suggestion cooldown
    if (type === 'suggestion') {
      state.lastSuggestion = new Date().toISOString();
    }
    
    this.saveState(childId, state);
  }

  /**
   * Get next lesson suggestion based on progress
   */
  static getNextLessonSuggestion(childId, fullName) {
    const name = this.getFirstName(fullName);
    const state = this.getState(childId);
    
    // Check for items needing revision first
    const revisionItems = AdaptiveLearningService.getItemsNeedingReview(50);
    if (revisionItems.length > 0) {
      state.revisionNeeded = revisionItems.map(i => i.itemId);
      this.saveState(childId, state);
      
      const revisionMsg = ENCOURAGEMENT_MESSAGES.revision[
        Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.revision.length)
      ];
      
      // Determine subject from itemId
      let subject = 'this topic';
      if (revisionItems[0].itemId.includes('alph')) subject = 'Alphabet';
      else if (revisionItems[0].itemId.includes('num')) subject = 'Numbers';
      else if (revisionItems[0].itemId.includes('read')) subject = 'Reading';
      else if (revisionItems[0].itemId.includes('math')) subject = 'Math';
      
      return revisionMsg.replace('{name}', name).replace('{subject}', subject);
    }
    
    // Suggest based on weakest area
    const weakAreas = this.getWeakAreas(childId);
    if (weakAreas.length > 0) {
      const subject = weakAreas[0];
      const msg = ENCOURAGEMENT_MESSAGES.suggestion[
        Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.suggestion.length)
      ];
      return msg.replace('{name}', name).replace('{subject}', subject);
    }
    
    // Default suggestion based on gamification favorite
    const gamState = GamificationService.getState(childId);
    if (gamState && gamState.lessonsCompleted > 0) {
      const subjects = ['Alphabet', 'Numbers', 'Reading', 'Maths'];
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      const msg = ENCOURAGEMENT_MESSAGES.suggestion[
        Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.suggestion.length)
      ];
      return msg.replace('{name}', name).replace('{subject}', randomSubject);
    }
    
    return `Let's start learning, ${name}!`;
  }

  /**
   * Get encouragement message
   */
  static getEncouragement(childId, type = 'praise', customSubject = null) {
    const profile = ProfileService.getActiveProfile();
    const name = this.getFirstName(profile?.name);
    const messages = ENCOURAGEMENT_MESSAGES[type] || ENCOURAGEMENT_MESSAGES.praise;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    this.recordInteraction(childId, type);
    
    let result = message.replace('{name}', name);
    if (customSubject) {
      result = result.replace('{subject}', customSubject);
    }
    
    return result;
  }

  /**
   * Detect repeated mistakes and suggest revision
   */
  static detectMistakes(childId) {
    const performanceData = AdaptiveLearningService.performanceData;
    const mistakes = [];
    
    for (const [itemId, record] of performanceData) {
      const accuracy = record.correct / Math.max(1, record.attempts);
      
      // Flag if more than 3 attempts with < 50% accuracy
      if (record.attempts >= 3 && accuracy < 0.5) {
        mistakes.push({
          itemId,
          attempts: record.attempts,
          accuracy: Math.round(accuracy * 100)
        });
      }
    }
    
    return mistakes;
  }

  /**
   * Get revision recommendation
   */
  static getRevisionRecommendation(childId, fullName) {
    const mistakes = this.detectMistakes(childId);
    
    if (mistakes.length === 0) {
      return null;
    }
    
    const name = this.getFirstName(fullName);
    const worstMistake = mistakes.sort((a, b) => a.accuracy - b.accuracy)[0];
    
    let subject = 'this area';
    if (worstMistake.itemId.includes('alph')) subject = 'Alphabet';
    else if (worstMistake.itemId.includes('num')) subject = 'Numbers';
    else if (worstMistake.itemId.includes('read')) subject = 'Reading';
    else if (worstMistake.itemId.includes('math')) subject = 'Math';
    
    const msg = ENCOURAGEMENT_MESSAGES.revision[
      Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.revision.length)
    ];
    
    return msg.replace('{name}', name).replace('{subject}', subject);
  }

  /**
   * Get weak areas for a child
   */
  static getWeakAreas(childId) {
    // Determine areas with most "needing review" items
    const revisionItems = AdaptiveLearningService.getItemsNeedingReview();
    
    const areaCounts = {
      'Alphabet': 0,
      'Numbers': 0,
      'Reading': 0,
      'Maths': 0,
      'Science': 0
    };
    
    revisionItems.forEach(item => {
      const lowerItem = item.itemId.toLowerCase();
      if (lowerItem.includes('alph') || lowerItem.includes('letter')) {
        areaCounts['Alphabet']++;
      } else if (lowerItem.includes('num') || lowerItem.includes('number')) {
        areaCounts['Numbers']++;
      } else if (lowerItem.includes('read') || lowerItem.includes('word')) {
        areaCounts['Reading']++;
      } else if (lowerItem.includes('math') || lowerItem.includes('add') || lowerItem.includes('sub')) {
        areaCounts['Maths']++;
      } else if (lowerItem.includes('science')) {
        areaCounts['Science']++;
      } else {
        // Distribute to all
        Object.keys(areaCounts).forEach(key => areaCounts[key]++);
      }
    });
    
    return Object.entries(areaCounts)
      .filter(([area, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area);
  }

  /**
   * Get AI summary for display
   */
  static getSummary(childId, fullName) {
    const state = this.getState(childId);
    const profile = ProfileService.getActiveProfile();
    const name = this.getFirstName(fullName || profile?.name);
    
    return {
      name,
      greeting: this.getGreeting(childId, fullName),
      nextSuggestion: this.getNextLessonSuggestion(childId, fullName),
      revisionNeeded: this.detectMistakes(childId).length > 0,
      weakAreas: this.getWeakAreas(childId),
      interactionCount: state.interactionCount
    };
  }

  // =====================
  // NEW: Interactive Q&A
  // =====================

  /**
   * Process voice command or text query and return appropriate response
   */
  static processQuery(childId, query) {
    const name = this.getFirstName();
    const queryLower = query.toLowerCase().trim();

    // Navigation commands
    if (queryLower.includes('go to') || queryLower.includes('take me to')) {
      return this.handleNavigationCommand(queryLower, name);
    }

    // Learning topics
    if (queryLower.includes('letter') || queryLower.includes('alphabet')) {
      return this.handleAlphabetQuery(queryLower, name);
    }

    if (queryLower.includes('number') || /\d/.test(queryLower)) {
      return this.handleNumberQuery(queryLower, name);
    }

    if (queryLower.includes('color') || queryLower.includes('colour')) {
      return this.handleColorQuery(queryLower, name);
    }

    if (queryLower.includes('shape')) {
      return this.handleShapeQuery(queryLower, name);
    }

    if (queryLower.includes('math') || queryLower.includes('maths')) {
      return this.handleMathQuery(queryLower, name);
    }

    // Help requests
    if (queryLower.includes('help') || queryLower.includes('hint')) {
      return this.getHelpHint(childId, name);
    }

    // Encouragement
    if (queryLower.includes('good') || queryLower.includes('great') || queryLower.includes('well done')) {
      return this.getEncouragement(childId);
    }

    // Greeting responses
    if (queryLower.includes('hello') || queryLower.includes('hi') || queryLower.includes('hey')) {
      return `Hello there, ${name}! I'm your learning buddy! What would you like to explore today?`;
    }

    // Story reading
    if (queryLower.includes('read') || queryLower.includes('story')) {
      return `Let me read you a fun story! We have stories in Alphabet and Numbers sections. Which would you like?`;
    }

    // Games
    if (queryLower.includes('game') || queryLower.includes('play')) {
      return "I'd love to play a game with you! We have alphabet games, number games, and shape games. Which one sounds fun?";
    }

    // What/Who questions
    if (queryLower.startsWith('what') || queryLower.startsWith('who')) {
      return this.handleQuestionQuery(queryLower, name);
    }

    // Default fallback
    return `I'm listening, ${name}! You can ask me about letters, numbers, shapes, colors, or math. What would you like to learn?`;
  }

  /**
   * Handle navigation commands
   */
  static handleNavigationCommand(query, name) {
    const routes = {
      'home': '/',
      'alphabet': '/alphabet',
      'numbers': '/numbers',
      'games': '/games',
      'stories': '/stories',
      'profile': '/profile',
      'settings': '/settings'
    };

    for (const [key, route] of Object.entries(routes)) {
      if (query.includes(key)) {
        return `Taking you to ${key}, ${name}! Click the screen or say "go" when you're ready!`;
      }
    }

    return `Where would you like to go, ${name}? I can take you to home, alphabet, numbers, games, or stories!`;
  }

  /**
   * Handle alphabet queries
   */
  static handleAlphabetQuery(query, name) {
    const letterMatch = query.match(/[a-z]/i);
    if (letterMatch) {
      const letter = letterMatch[0].toLowerCase();
      const info = KNOWLEDGE_BASE.alphabet[letter];
      return info ? info : KNOWLEDGE_BASE.alphabet.default;
    }
    return `The alphabet has 26 letters from A to Z! Each letter has its own special sound. Which letter would you like to learn about?`;
  }

  /**
   * Handle number queries
   */
  static handleNumberQuery(query, name) {
    const numberMatch = query.match(/\d+/);
    if (numberMatch) {
      const number = numberMatch[0];
      const info = KNOWLEDGE_BASE.numbers[number];
      return info ? info : KNOWLEDGE_BASE.numbers.default;
    }
    return `Numbers help us count everything! From 0 to 100 and beyond. What number are you curious about?`;
  }

  /**
   * Handle color queries
   */
  static handleColorQuery(query, name) {
    const colors = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];
    for (const color of colors) {
      if (query.includes(color)) {
        return KNOWLEDGE_BASE.colors[color] || KNOWLEDGE_BASE.colors.default;
      }
    }
    return `Colors make our world beautiful! Like a rainbow after rain. What's your favorite color?`;
  }

  /**
   * Handle shape queries
   */
  static handleShapeQuery(query, name) {
    const shapes = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond', 'heart', 'star'];
    for (const shape of shapes) {
      if (query.includes(shape)) {
        return KNOWLEDGE_BASE.shapes[shape] || KNOWLEDGE_BASE.shapes.default;
      }
    }
    return `Shapes are like puzzles! A circle rolls, a square stands tall. What shape can you find?`;
  }

  /**
   * Handle math queries
   */
  static handleMathQuery(query, name) {
    if (query.includes('addition') || query.includes('add')) {
      return KNOWLEDGE_BASE.math.addition;
    }
    if (query.includes('subtraction') || query.includes('subtract')) {
      return KNOWLEDGE_BASE.math.subtraction;
    }
    if (query.includes('count')) {
      return KNOWLEDGE_BASE.math.counting;
    }
    return KNOWLEDGE_BASE.math.default;
  }

  /**
   * Handle general questions
   */
  static handleQuestionQuery(query, name) {
    if (query.includes('your name') || query.includes('who are')) {
      return `I'm Makenna, your friendly learning assistant! I'm here to help you learn and have fun!`;
    }
    if (query.includes('time')) {
      return `Time flies when we're learning! It's always a good time to explore something new!`;
    }
    if (query.includes('day')) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      return `Today is ${today}! A perfect day for learning adventures!`;
    }
    return `That's a great question, ${name}! Let's discover the answer together!`;
  }

  /**
   * Get contextual help hint
   */
  static getHelpHint(childId, name) {
    const weakAreas = this.getWeakAreas(childId);
    if (weakAreas.length > 0) {
      return `I noticed you could use some extra practice with ${weakAreas[0]}. Would you like me to help you with that?`;
    }
    return `What do you need help with, ${name}? I can explain letters, numbers, shapes, or colors!`;
  }

  // =====================
  // Developer Portal Features
  // =====================

  /**
   * Get AI configuration
   */
  static getAIConfig() {
    return StorageService.get(AI_CONFIG_KEY, {
      voiceSettings: {
        rate: 0.9,
        pitch: 1.1,
        volume: 0.8,
        preferredVoice: null
      },
      messageCategories: {
        greeting: true,
        praise: true,
        improvement: true,
        revision: true,
        suggestion: true,
        hint: true
      },
      interactiveMode: true,
      autoSpeak: true,
      welcomeDelay: 2000
    });
  }

  /**
   * Update AI configuration
   */
  static updateAIConfig(config) {
    StorageService.set(AI_CONFIG_KEY, config);
    return true;
  }

  /**
   * Get custom voice commands for AI
   */
  static getVoiceCommands() {
    return StorageService.get(AI_VOICE_COMMANDS_KEY, [
      { id: 1, phrase: 'help me', response: 'I can help! What do you need?', category: 'help' },
      { id: 2, phrase: 'tell me a fact', response: 'Learning is like an adventure!', category: 'fun' },
      { id: 3, phrase: 'what can i do', response: 'You can learn letters, numbers, play games, or read stories!', category: 'info' }
    ]);
  }

  /**
   * Add custom voice command
   */
  static addVoiceCommand(command) {
    const commands = this.getVoiceCommands();
    const newCommand = {
      id: Date.now(),
      phrase: command.phrase,
      response: command.response,
      category: command.category || 'custom'
    };
    commands.push(newCommand);
    StorageService.set(AI_VOICE_COMMANDS_KEY, commands);
    return newCommand;
  }

  /**
   * Delete voice command
   */
  static deleteVoiceCommand(commandId) {
    const commands = this.getVoiceCommands();
    const filtered = commands.filter(c => c.id !== commandId);
    StorageService.set(AI_VOICE_COMMANDS_KEY, filtered);
    return true;
  }

  /**
   * Get AI interaction statistics
   */
  static getAIStatistics() {
    const interactions = StorageService.get(AI_INTERACTIONS_KEY, []);
    const stats = {
      totalInteractions: interactions.length,
      byType: {},
      bySubject: {},
      recentActivity: interactions.slice(-50)
    };

    interactions.forEach(interaction => {
      // Count by type
      stats.byType[interaction.type] = (stats.byType[interaction.type] || 0) + 1;
      
      // Count by subject if available
      if (interaction.subject) {
        stats.bySubject[interaction.subject] = (stats.bySubject[interaction.subject] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Record AI interaction for analytics
   */
  static recordAIInteraction(data) {
    const interactions = StorageService.get(AI_INTERACTIONS_KEY, []);
    interactions.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...data
    });
    StorageService.set(AI_INTERACTIONS_KEY, interactions);
  }

  /**
   * Get available voices for configuration
   */
  static getAvailableVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [];
    }
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  }
}