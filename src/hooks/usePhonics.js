import { useState, useCallback } from 'react';
import { useAudio } from './useAudio';
import { ALPHABET_DATA } from '../data/alphabetData';

export const usePhonics = () => {
  const { speak, isPlaying } = useAudio();
  const [currentLetter, setCurrentLetter] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [listeningMode, setListeningMode] = useState(false);

  /**
   * Play letter name
   */
  const playLetterName = useCallback(async (letterId) => {
    const letter = ALPHABET_DATA.find(l => l.id === letterId);
    if (!letter) return false;

    setCurrentLetter(letter);
    return await speak(letter.letter, {
      rate: 0.8,
      pitch: 1.2
    });
  }, [speak]);

  /**
   * Play letter sound
   */
  const playLetterSound = useCallback(async (letterId) => {
    const letter = ALPHABET_DATA.find(l => l.id === letterId);
    if (!letter) return false;

    setCurrentLetter(letter);
    // Use phonetic pronunciation
    const soundText = letter.phonetic || letter.sound;
    return await speak(soundText, {
      rate: 0.7,
      pitch: 1.1
    });
  }, [speak]);

  /**
   * Play word pronunciation
   */
  const playWord = useCallback(async (letterId, wordIndex) => {
    const letter = ALPHABET_DATA.find(l => l.id === letterId);
    if (!letter || !letter.words[wordIndex]) return false;

    const word = letter.words[wordIndex];
    setCurrentLetter(letter);
    setCurrentWord(word);

    return await speak(word.word, {
      rate: 0.8,
      pitch: 1.1
    });
  }, [speak]);

  /**
   * Play word with its beginning sound
   */
  const playWordWithSound = useCallback(async (letterId, wordIndex) => {
    const letter = ALPHABET_DATA.find(l => l.id === letterId);
    if (!letter || !letter.words[wordIndex]) return false;

    const word = letter.words[wordIndex];
    setCurrentLetter(letter);
    setCurrentWord(word);

    // Play sound first
    await speak(letter.phonetic || letter.sound, {
      rate: 0.7,
      pitch: 1.1,
      onEnd: async () => {
        // Then play the word
        await speak(word.word, {
          rate: 0.8,
          pitch: 1.1
        });
      }
    });

    return true;
  }, [speak]);

  /**
   * Play sentence
   */
  const playSentence = useCallback(async (letterId, wordIndex) => {
    const letter = ALPHABET_DATA.find(l => l.id === letterId);
    if (!letter || !letter.words[wordIndex]) return false;

    const word = letter.words[wordIndex];
    return await speak(word.sentence, {
      rate: 0.85,
      pitch: 1.0
    });
  }, [speak]);

  /**
   * Slow pronunciation
   */
  const playSlow = useCallback(async (text) => {
    return await speak(text, {
      rate: 0.5,
      pitch: 1.1
    });
  }, [speak]);

  /**
   * Normal pronunciation
   */
  const playNormal = useCallback(async (text) => {
    return await speak(text, {
      rate: 0.8,
      pitch: 1.1
    });
  }, [speak]);

  /**
   * Play beginning sound examples
   */
  const playBeginningSounds = useCallback(async (letterId) => {
    const letter = ALPHABET_DATA.find(l => l.id === letterId);
    if (!letter) return false;

    const sound = letter.phonetic || letter.sound;
    const examples = letter.words.slice(0, 3);

    // Play sound
    await speak(sound, {
      rate: 0.7,
      pitch: 1.1
    });

    // Play examples with pause between
    for (const word of examples) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await speak(word.word, {
        rate: 0.8,
        pitch: 1.1
      });
    }

    return true;
  }, [speak]);

  /**
   * Start listening mode
   */
  const startListeningMode = useCallback(() => {
    setListeningMode(true);
  }, []);

  /**
   * Stop listening mode
   */
  const stopListeningMode = useCallback(() => {
    setListeningMode(false);
  }, []);

  /**
   * Get phonics data for a letter
   */
  const getPhonicsData = useCallback((letterId) => {
    const letter = ALPHABET_DATA.find(l => l.id === letterId);
    if (!letter) return null;

    return {
      letter: letter.letter,
      lowercase: letter.lowercase,
      sound: letter.sound,
      phonetic: letter.phonetic,
      words: letter.words.map(w => w.word),
      examples: letter.words.slice(0, 3).map(w => ({
        word: w.word,
        image: w.image,
        sentence: w.sentence
      }))
    };
  }, []);

  return {
    playLetterName,
    playLetterSound,
    playWord,
    playWordWithSound,
    playSentence,
    playSlow,
    playNormal,
    playBeginningSounds,
    startListeningMode,
    stopListeningMode,
    getPhonicsData,
    currentLetter,
    currentWord,
    listeningMode,
    isPlaying
  };
};