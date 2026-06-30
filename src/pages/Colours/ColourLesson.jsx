import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaVolumeUp, FaCheck, FaStar,
  FaRegStar, FaArrowRight
} from 'react-icons/fa';
import { getColourById, COLOURS_DATA } from '../../data/coloursData';
import { useAudio } from '../../hooks/useAudio';
import { useProfiles } from '../../context/ProfileContext';
import { announceToScreenReader } from '../../utils/accessibility';

const ColourLesson = () => {
  const { colourId } = useParams();
  const navigate = useNavigate();
  const [colour, setColour] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const { speak } = useAudio();
  const { getProfileData, setProfileData } = useProfiles();

  useEffect(() => {
    const found = getColourById(colourId);
    if (found) {
      setColour(found);
      
      // Load progress
      const progress = getProfileData('colour_progress', {});
      setIsCompleted(progress[colourId]?.completed || false);
      
      // Load favorites
      const favorites = getProfileData('colour_favorites', []);
      setIsFavorite(favorites.includes(colourId));
      
      // Speak colour name
      setTimeout(() => {
        speak(`${found.name}. ${found.description}`, { rate: 0.7, pitch: 1.1 });
      }, 500);
    } else {
      navigate('/colours');
    }
  }, [colourId, navigate, speak, getProfileData]);

  const toggleFavorite = useCallback(() => {
    const favorites = getProfileData('colour_favorites', []);
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== colourId)
      : [...favorites, colourId];
    setProfileData('colour_favorites', newFavorites);
    setIsFavorite(!isFavorite);
  }, [isFavorite, colourId, getProfileData, setProfileData]);

  const handleSpeak = (text) => {
    speak(text, { rate: 0.7, pitch: 1.1 });
  };

  const handleObjectSelect = (object) => {
    if (selectedObject !== null) return;
    
    setSelectedObject(object);
    const correct = object === colour.realObject;
    setIsCorrect(correct);
    
    if (correct) {
      speak('Correct! 🎉', { rate: 0.8, pitch: 1.2 });
      announceToScreenReader('Correct!');
      
      const progress = getProfileData('colour_progress', {});
      progress[colourId] = { completed: true };
      setProfileData('colour_progress', progress);
      setIsCompleted(true);
      setShowCelebration(true);
      
      setTimeout(() => setShowCelebration(false), 3000);
    } else {
      speak('Try again!', { rate: 0.7, pitch: 1.0 });
      announceToScreenReader('Not quite, try again');
      setTimeout(() => {
        setSelectedObject(null);
        setIsCorrect(null);
      }, 1000);
    }
  };

  if (!colour) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎨</div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const objectOptions = COLOURS_DATA
    .filter(c => c.id !== colour.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
    .map(c => c.realObject);
  const allObjects = [colour.realObject, ...objectOptions]
    .sort(() => Math.random() - 0.5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/shapes"
            className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
            Colour: {colour.name}
          </h1>
        </div>
        <button
          onClick={toggleFavorite}
          className={`p-2 rounded-full transition-colors ${
            isFavorite
              ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
              : 'text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
        >
          {isFavorite ? <FaStar className="text-xl" /> : <FaRegStar className="text-xl" />}
        </button>
      </div>

      {/* Colour Display */}
      <div 
        className="rounded-2xl p-8 text-center min-h-[200px] flex flex-col items-center justify-center shadow-soft"
        style={{ backgroundColor: colour.hex }}
      >
        <div className="text-8xl">{colour.emoji}</div>
        <h2 className="font-baloo text-4xl font-bold text-white drop-shadow-lg mt-4">
          {colour.name}
        </h2>
        <p className="text-white/90 text-lg drop-shadow">
          {colour.description}
        </p>
        <button
          onClick={() => handleSpeak(`${colour.name}. ${colour.description}`)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-sm"
        >
          <FaVolumeUp className="text-sm" />
          Listen
        </button>
      </div>

      {/* Emotion and Example */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 text-center">
          <div className="text-3xl">😊</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {colour.emotion}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 text-center">
          <div className="text-3xl">{colour.objectEmoji}</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {colour.realObject}
          </p>
        </div>
      </div>

      {/* Object Matching Quiz */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6">
        <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white mb-4">
          🎯 Match the Object
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Which object is {colour.name}?
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {allObjects.map((object) => (
            <motion.button
              key={object}
              whileHover={{ scale: selectedObject === null ? 1.05 : 1 }}
              whileTap={{ scale: selectedObject === null ? 0.95 : 1 }}
              onClick={() => handleObjectSelect(object)}
              disabled={selectedObject !== null}
              className={`p-4 rounded-xl font-medium transition-all duration-300 ${
                selectedObject === object
                  ? isCorrect
                    ? 'bg-green-500 text-white shadow-glow'
                    : 'bg-red-500 text-white'
                  : selectedObject !== null && object === colour.realObject
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              } ${selectedObject !== null && selectedObject !== object && object !== colour.realObject ? 'opacity-50' : ''}`}
            >
              {object}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-soft"
            >
              <div className="text-7xl mb-4 animate-bounce">🎨</div>
              <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
                You learned {colour.name}!
              </h2>
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-3xl"
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowCelebration(false);
                  navigate('/shapes');
                }}
                className="mt-6 btn-primary"
              >
                Continue Learning
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ColourLesson;