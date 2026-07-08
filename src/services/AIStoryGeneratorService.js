/**
 * AI Story Generator Service - Dynamically creates personalized stories
 * Integrates with external AI model, generates text, images, and voiceovers
 */
// NOTE: For a real-world scenario, this would involve API calls to a powerful AI model (e.g., Gemini, OpenAI, etc.)
// For this example, we'll simulate AI generation with predefined patterns.

import { StorageService } from './StorageService';
import { VoiceGuideService } from './VoiceGuideService'; // Assuming this exists for voiceovers

const AI_STORY_KEY = 'makenna_ai_stories';

export class AIStoryGeneratorService {
  /**
   * Simulate fetching story themes/genres from AI
   */
  static getStoryThemes() {
    return [
      { id: 'adventure', name: 'Adventure', icon: '🗺️' },
      { id: 'fantasy', name: 'Fantasy', icon: '✨' },
      { id: 'animals', name: 'Animal Tales', icon: '🐾' },
      { id: 'science', name: 'Science Fiction', icon: '🚀' },
      { id: 'mystery', name: 'Mystery', icon: '🕵️‍♀️' },
    ];
  }

  /**
   * Generate a new story based on theme, child's name, and preferences
   */
  static async generateStory(childName, themeId, preferences = {}) {
    const theme = this.getStoryThemes().find(t => t.id === themeId);
    if (!theme) {
      throw new Error('Invalid story theme provided.');
    }

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const storyId = `ai-story-${Date.now()}`;
    const generatedStory = this.craftStoryContent(childName, theme, preferences);

    const storyData = {
      id: storyId,
      title: `The ${theme.name} of ${childName}`,
      author: 'Makenna AI',
      coverEmoji: theme.icon,
      description: generatedStory.description,
      level: preferences.level || 1,
      difficulty: preferences.difficulty || 'easy',
      category: theme.id,
      estimatedTime: Math.ceil(generatedStory.pages.length * 1.5),
      pages: generatedStory.pages,
      createdAt: new Date().toISOString()
    };

    this.saveStory(storyId, storyData);
    return storyData;
  }

  /**
   * Helper to craft story content (simulated AI output)
   */
  static craftStoryContent(childName, theme, preferences) {
    let description = `Join ${childName} on a magical ${theme.name.toLowerCase()}!`;
    let pages = [];

    switch (theme.id) {
      case 'adventure':
        pages = [
          { text: `Once upon a time, in a land far away, ${childName} embarked on a grand adventure!`, imageUrl: 'https://via.placeholder.com/300/FFD700/000000?text=Adventure' },
          { text: `They discovered a hidden map, leading to a treasure island.`, imageUrl: 'https://via.placeholder.com/300/FF8C00/FFFFFF?text=Map' },
          { text: `With courage in their heart, ${childName} sailed across the sparkling sea.`, imageUrl: 'https://via.placeholder.com/300/00BFFF/FFFFFF?text=Sea' },
          { text: `Finally, they found the treasure chest, filled with golden coins and ancient artifacts!`, imageUrl: 'https://via.placeholder.com/300/DAA520/FFFFFF?text=Treasure' }
        ];
        description = `An epic journey of discovery with ${childName} finding hidden riches!`;
        break;
      case 'fantasy':
        pages = [
          { text: `In a world of shimmering forests and talking animals, ${childName} met a wise old owl.`, imageUrl: 'https://via.placeholder.com/300/9370DB/FFFFFF?text=Forest' },
          { text: `The owl granted ${childName} the power to understand all creatures.`, imageUrl: 'https://via.placeholder.com/300/8A2BE2/FFFFFF?text=Owl' },
          { text: `Together, they solved riddles and brought peace to the enchanted kingdom.`, imageUrl: 'https://via.placeholder.com/300/4B0082/FFFFFF?text=Magic' }
        ];
        description = `A whimsical tale where ${childName} discovers magic and befriended enchanted creatures.`;
        break;
      case 'animals':
        pages = [
          { text: `${childName} visited a happy farm, where playful piglets oinked hello!`, imageUrl: 'https://via.placeholder.com/300/FF69B4/FFFFFF?text=Farm' },
          { text: `They helped a lost duckling find its way back to its family.`, imageUrl: 'https://via.placeholder.com/300/87CEEB/FFFFFF?text=Duckling' },
          { text: `The day ended with cuddles from fluffy lambs and friendly cows.`, imageUrl: 'https://via.placeholder.com/300/F0E68C/FFFFFF?text=Animals' }
        ];
        description = `A delightful story about ${childName}'s day on a farm, meeting many animal friends.`;
        break;
      case 'science':
        pages = [
          { text: `${childName} launched into space in a super-fast rocket!`, imageUrl: 'https://via.placeholder.com/300/4682B4/FFFFFF?text=Rocket' },
          { text: `They explored new planets, discovering sparkling space crystals.`, imageUrl: 'https://via.placeholder.com/300/ADD8E6/FFFFFF?text=Planet' },
          { text: `On the moon, ${childName} bounced high and made a new alien friend.`, imageUrl: 'https://via.placeholder.com/300/6A5ACD/FFFFFF?text=Alien' }
        ];
        description = `An exciting space journey for ${childName}, exploring planets and making new friends.`;
        break;
      case 'mystery':
        pages = [
          { text: `A mystery unfolded in the old mansion, and ${childName} became the detective.`, imageUrl: 'https://via.placeholder.com/300/808080/FFFFFF?text=Mansion' },
          { text: `They found clues: a sparkling key and a hidden message.`, imageUrl: 'https://via.placeholder.com/300/C0C0C0/FFFFFF?text=Clues' },
          { text: `With clever thinking, ${childName} solved the mystery and found the missing puppy!`, imageUrl: 'https://via.placeholder.com/300/D3D3D3/FFFFFF?text=Puppy' }
        ];
        description = `A thrilling mystery adventure where ${childName} uses their detective skills.`;
        break;
      default:
        pages = [
          { text: `This is a placeholder story for ${childName}.`, imageUrl: 'https://via.placeholder.com/300' }
        ];
        break;
    }

    // Add voiceovers (simulated)
    pages = pages.map(page => ({
      ...page,
      voiceoverUrl: `/${page.text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.mp3` // Simulated URL
    }));

    return { description, pages };
  }

  /**
   * Save a generated story
   */
  static saveStory(storyId, storyData) {
    const stories = StorageService.get(AI_STORY_KEY, {});
    stories[storyId] = storyData;
    StorageService.set(AI_STORY_KEY, stories);
  }

  /**
   * Get a generated story by ID
   */
  static getStory(storyId) {
    const stories = StorageService.get(AI_STORY_KEY, {});
    return stories[storyId] || null;
  }

  /**
   * Get all generated stories
   */
  static getAllGeneratedStories() {
    const stories = StorageService.get(AI_STORY_KEY, {});
    return Object.values(stories);
  }

  /**
   * Delete a generated story
   */
  static deleteStory(storyId) {
    const stories = StorageService.get(AI_STORY_KEY, {});
    delete stories[storyId];
    StorageService.set(AI_STORY_KEY, stories);
  }

  /**
   * Simulate text-to-speech for story pages
   */
  static async readPageAloud(text) {
    if (VoiceGuideService.isSupported()) {
      VoiceGuideService.speak(text);
      return true;
    }
    console.warn("Voice synthesis not supported or enabled.");
    return false;
  }
}