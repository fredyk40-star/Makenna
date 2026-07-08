/**
 * Educational Search Service - Search across lessons, games, stories
 * Provides instant search results for learning content
 */
import { StorageService } from './StorageService';

const SEARCH_INDEX_KEY = 'makenna_search_index';

// Sample search index - would be populated from curriculum data
const SEARCH_CATEGORIES = {
  lessons: ['Alphabet', 'Numbers', 'Reading', 'Maths', 'Science', 'Shapes', 'Colours'],
  games: ['Counting', 'Addition', 'Subtraction', 'Number Games', 'Alphabet Games'],
  stories: ['Bible Stories', 'Fairy Tales', 'Educational Stories'],
  topics: ['Letters', 'Numbers', 'Animals', 'Colors', 'Shapes', 'Math']
};

export class SearchService {
  /**
   * Build search index from available content
   */
  static buildSearchIndex() {
    // This would index all lessons, games, and stories
    const index = {
      lessons: SEARCH_CATEGORIES.lessons.map((l, i) => ({
        id: `lesson_${i}`,
        title: l,
        type: 'lesson',
        subject: l,
        url: `/${l.toLowerCase()}`,
        keywords: l.toLowerCase().split(' ')
      })),
      games: SEARCH_CATEGORIES.games.map((g, i) => ({
        id: `game_${i}`,
        title: g,
        type: 'game',
        subject: g.includes('Alphabet') || g.includes('Reading') ? 'Alphabet' : 'Maths',
        url: '/games',
        keywords: g.toLowerCase().split(' ')
      })),
      stories: SEARCH_CATEGORIES.stories.map((s, i) => ({
        id: `story_${i}`,
        title: s,
        type: 'story',
        subject: 'Reading',
        url: '/stories',
        keywords: s.toLowerCase().split(' ')
      }))
    };
    
    StorageService.set(SEARCH_INDEX_KEY, index);
    return index;
  }

  /**
   * Search content by query
   */
  static search(query, limit = 10) {
    if (!query || query.length < 2) return { results: [], suggestions: [] };

    const index = StorageService.get(SEARCH_INDEX_KEY, this.buildSearchIndex());
    const searchTerm = query.toLowerCase();
    const results = [];

    // Search through all content
    Object.values(index).flat().forEach(item => {
      const matchesTitle = item.title.toLowerCase().includes(searchTerm);
      const matchesKeywords = item.keywords.some(k => k.includes(searchTerm));
      const matchesSubject = item.subject?.toLowerCase().includes(searchTerm);

      if (matchesTitle || matchesKeywords || matchesSubject) {
        results.push({
          ...item,
          relevance: matchesTitle ? 3 : matchesKeywords ? 2 : 1
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Generate suggestions for partial matches
    const suggestions = this.generateSuggestions(query, index);

    return {
      results: results.slice(0, limit),
      suggestions,
      total: results.length
    };
  }

  /**
   * Generate search suggestions
   */
  static generateSuggestions(query, index) {
    if (!query) return [];

    const searchTerm = query.toLowerCase();
    const suggestions = [];

    // Find matching titles for autocomplete
    Object.values(index).flat().forEach(item => {
      if (item.title.toLowerCase().startsWith(searchTerm) && 
          item.title.toLowerCase() !== searchTerm) {
        suggestions.push(item.title);
      }
    });

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Get recent searches
   */
  static getRecentSearches(childId) {
    const recent = StorageService.get(`makenna_recent_searches_${childId}`, []);
    return recent.slice(0, 5);
  }

  /**
   * Save search to history
   */
  static saveSearch(childId, query) {
    if (!query) return;
    const recent = this.getRecentSearches(childId);
    const newRecent = [query, ...recent.filter(s => s !== query)];
    StorageService.set(`makenna_recent_searches_${childId}`, newRecent);
  }

  /**
   * Clear search history
   */
  static clearHistory(childId) {
    StorageService.remove(`makenna_recent_searches_${childId}`);
  }

  /**
   * Get search statistics
   */
  static getStats() {
    const index = StorageService.get(SEARCH_INDEX_KEY);
    return {
      totalLessons: index?.lessons?.length || 0,
      totalGames: index?.games?.length || 0,
      totalStories: index?.stories?.length || 0,
      categories: Object.keys(index || {})
    };
  }
}