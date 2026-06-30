import { useState, useEffect } from 'react';
import { QUOTES } from '../constants';

export const useQuote = () => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    let intervalId = null;
    
    const getRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * QUOTES.length);
      return QUOTES[randomIndex];
    };

    setQuote(getRandomQuote());
    intervalId = setInterval(() => {
      setQuote(getRandomQuote());
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, []);

  return quote;
};