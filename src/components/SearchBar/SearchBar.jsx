import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaHistory, FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { SearchService } from '../../services/SearchService';
import { ChildAccountService } from '../../services/ChildAccountService';

const SearchBarComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const childId = ChildAccountService.getActiveChildId();
  const searchRef = useRef(null);

  useEffect(() => {
    setRecentSearches(SearchService.getRecentSearches(childId));
    
    // Close results when clicking outside
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [childId]);

  useEffect(() => {
    if (query.length >= 2) {
      const searchResult = SearchService.search(query);
      setResults(searchResult.results);
      setSuggestions(searchResult.suggestions);
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (searchTerm) => {
    setQuery(searchTerm);
    SearchService.saveSearch(childId, searchTerm);
    setShowResults(false);
    
    // Navigate to first result if available
    if (results.length > 0) {
      navigate(results[0].url);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-md mx-auto mb-4" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search lessons, games, stories..."
          className="w-full pl-10 pr-10 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (query || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Suggestions:</p>
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleSearch(suggestion)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-700 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-gray-400 mb-1">Results:</p>
                {results.map(result => (
                  <button
                    key={result.id}
                    onClick={() => handleSearch(result.title)}
                    className="w-full text-left px-2 py-2 hover:bg-gray-700 rounded flex items-center gap-2"
                  >
                    <span className="text-xs bg-purple-600 px-2 py-1 rounded">{result.type}</span>
                    <span>{result.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <FaHistory /> Recent Searches:
                </p>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-700 rounded"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && results.length === 0 && suggestions.length === 0 && (
              <div className="p-4 text-center text-gray-400">
                <FaLightbulb className="mx-auto mb-2" />
                No results found for "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBarComponent;