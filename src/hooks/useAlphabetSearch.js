import { useState, useMemo, useCallback } from 'react';
import { searchAlphabet } from '../data/alphabetData';

export const useAlphabetSearch = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'letters', 'words'

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    return searchAlphabet(query);
  }, [query]);

  const filteredResults = useMemo(() => {
    if (searchType === 'letters') {
      return results.filter(item => 
        item.letter.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (searchType === 'words') {
      return results.filter(item =>
        item.words.some(word =>
          word.word.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
    return results;
  }, [results, searchType, query]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchType('all');
  }, []);

  const hasResults = filteredResults.length > 0;

  return {
    query,
    setQuery,
    searchType,
    setSearchType,
    results: filteredResults,
    hasResults,
    clearSearch
  };
};