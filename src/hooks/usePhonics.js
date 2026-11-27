import { useCallback, useState } from 'react';
import { ALPHABET_DATA } from '../data/alphabetData';
import alphabetSpeech from '../services/AlphabetSpeechService';

const findLetter = letterId => ALPHABET_DATA.find(l => l.id === letterId);
const findWord = (letter, wordIndex) => letter?.words?.[wordIndex] || letter?.words?.[0];

export const usePhonics = () => {
  const [currentLetter, setCurrentLetter] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [listeningMode, setListeningMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const run = useCallback(async (task) => {
    setIsPlaying(true);
    try {
      return await task();
    } finally {
      setIsPlaying(false);
    }
  }, []);

  /** Say the letter name. */
  const playLetterName = useCallback(async (letterId) => {
    const letter = findLetter(letterId);
    if (!letter) return false;

    setCurrentLetter(letter);
    return run(() => alphabetSpeech.speak(letter.letter, { rate: 0.75, pitch: 1.15 }));
  }, [run]);

  /** Say the letter sound using speakable phonics, never IPA symbols. */
  const playLetterSound = useCallback(async (letterId) => {
    const letter = findLetter(letterId);
    if (!letter) return false;

    setCurrentLetter(letter);
    return run(() => alphabetSpeech.speak(letter.phonetic || letter.sound, { rate: 0.65, pitch: 1.1 }));
  }, [run]);

  /** Pronounce a vocabulary word twice: slowly, then naturally. */
  const playWord = useCallback(async (letterId, wordIndex = 0) => {
    const letter = findLetter(letterId);
    const word = findWord(letter, wordIndex);
    if (!letter || !word) return false;

    setCurrentLetter(letter);
    setCurrentWord(word);
    return run(() => alphabetSpeech.pronounceWord(word.word));
  }, [run]);

  /** Say sound first, then the word. */
  const playWordWithSound = useCallback(async (letterId, wordIndex = 0) => {
    const letter = findLetter(letterId);
    const word = findWord(letter, wordIndex);
    if (!letter || !word) return false;

    setCurrentLetter(letter);
    setCurrentWord(word);

    return run(() => alphabetSpeech.speakSequence([
      { text: letter.phonetic || letter.sound, rate: 0.62, pitch: 1.1 },
      { text: word.word, rate: 0.85, pitch: 1.05 },
    ], { gap: 420 }));
  }, [run]);

  /** Read the example sentence. */
  const playSentence = useCallback(async (letterId, wordIndex = 0) => {
    const letter = findLetter(letterId);
    const word = findWord(letter, wordIndex);
    if (!letter || !word) return false;

    setCurrentLetter(letter);
    setCurrentWord(word);
    return run(() => alphabetSpeech.speak(word.sentence, { rate: 0.78, pitch: 1.0 }));
  }, [run]);

  const playSlow = useCallback(async (text) => (
    run(() => alphabetSpeech.speak(text, { rate: 0.5, pitch: 1.05 }))
  ), [run]);

  const playNormal = useCallback(async (text) => (
    run(() => alphabetSpeech.speak(text, { rate: 0.85, pitch: 1.05 }))
  ), [run]);

  const playBeginningSounds = useCallback(async (letterId) => {
    const letter = findLetter(letterId);
    if (!letter) return false;

    setCurrentLetter(letter);
    return run(() => alphabetSpeech.speakSequence([
      { text: letter.phonetic || letter.sound, rate: 0.62, pitch: 1.1 },
      ...letter.words.slice(0, 3).map(word => ({ text: word.word, rate: 0.8, pitch: 1.05 })),
    ], { gap: 420 }));
  }, [run]);

  const stop = useCallback(() => {
    alphabetSpeech.cancel();
    setIsPlaying(false);
  }, []);

  const getPhonicsData = useCallback((letterId) => {
    const letter = findLetter(letterId);
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
        sentence: w.sentence,
      })),
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
    stop,
    startListeningMode: () => setListeningMode(true),
    stopListeningMode: () => setListeningMode(false),
    getPhonicsData,
    currentLetter,
    currentWord,
    listeningMode,
    isPlaying,
  };
};

export default usePhonics;
