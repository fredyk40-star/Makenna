import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaLanguage, FaBook, FaPlay, FaStar, FaQuoteLeft, FaCalculator, FaFlask, FaPalette, FaHeart, FaLeaf } from 'react-icons/fa';
import { GhanaCurriculumService } from '../../services/GhanaCurriculumService';
import { voiceGuide } from '../../services/VoiceGuideService';

const GhanaLanguages = () => {
  const [activeSubject, setActiveSubject] = useState('twi');
  const [content, setContent] = useState([]);
  const [culturalFacts, setCulturalFacts] = useState([]);
  const [activeFact, setActiveFact] = useState(null);

  useEffect(() => {
    loadContent();
  }, [activeSubject]);

  const loadContent = () => {
    setContent(GhanaCurriculumService.getSubjectContent(activeSubject));
    setCulturalFacts(GhanaCurriculumService.getCulturalFacts());
  };

  const handleSpeak = (text) => {
    voiceGuide.speak(text);
  };

  const subjects = [
    { id: 'twi', name: 'Twi', color: 'text-yellow-600', icon: FaLanguage },
    { id: 'ewe', name: 'Ewe', color: 'text-green-600', icon: FaLanguage },
    { id: 'ga', name: 'Ga', color: 'text-blue-600', icon: FaLanguage },
    { id: 'english', name: 'English', color: 'text-red-500', icon: FaBook },
    { id: 'mathematics', name: 'Mathematics', color: 'text-orange-500', icon: FaCalculator },
    { id: 'science', name: 'Science', color: 'text-purple-500', icon: FaFlask },
    { id: 'social_studies', name: 'Social Studies', color: 'text-indigo-500', icon: FaMap },
    { id: 'creative_arts', name: 'Creative Arts', color: 'text-pink-500', icon: FaPalette },
    { id: 'rme', name: 'Religious & Moral', color: 'text-red-600', icon: FaHeart },
    { id: 'life_skills', name: 'Life Skills', color: 'text-teal-500', icon: FaLeaf },
  ];

  // Icon component mapping
  const getIcon = (iconName) => {
    const icons = {
      twi: FaLanguage,
      ewe: FaLanguage,
      ga: FaLanguage,
      english: FaBook,
      mathematics: FaCalculator,
      science: FaFlask,
      social_studies: FaMap,
      creative_arts: FaPalette,
      rme: FaHeart,
      life_skills: FaLeaf,
    };
    return icons[iconName] || FaBook;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-3">
            <FaLanguage className="text-green-600" />
            Ghana Languages & Culture
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Learn Ghanaian languages and discover our rich culture!
          </p>
        </div>

        {/* Subject Selector */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => setActiveSubject(subject.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeSubject === subject.id
                  ? 'bg-white dark:bg-gray-700 shadow-lg scale-105'
                  : 'bg-white/50 dark:bg-gray-800/50'
              } ${subject.color}`}
            >
              <subject.icon className="text-lg" />
              {subject.name}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {content.length > 0 ? (
            content.map(item => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <FaBook className="text-blue-500" />
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {item.content}
                </p>
                {item.level && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                    {item.level}
                  </span>
                )}
                <button
                  onClick={() => handleSpeak(item.content)}
                  className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded"
                >
                  <FaPlay /> Listen
                </button>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No content available for this subject yet.
              </p>
            </div>
          )}
        </div>

        {/* Cultural Facts Carousel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaQuoteLeft className="text-yellow-500" />
            Did You Know?
          </h2>
          <div className="space-y-3">
            {culturalFacts.map(fact => (
              <motion.div
                key={fact.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setActiveFact(fact)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  activeFact?.id === fact.id 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100'
                }`}
              >
                <p className="text-gray-700 dark:text-gray-300">
                  <strong className="text-yellow-600 dark:text-yellow-400">{fact.id.toUpperCase()}:</strong> {fact.fact}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">{fact.category}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Fun Games Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaStar className="text-yellow-400" />
            Ghana Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GhanaCurriculumService.getGhanaGames().map(game => (
              <div key={game.id} className="p-4 bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900/30 dark:to-yellow-900/30 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white">{game.name}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Subject: {game.subject}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Difficulty: {game.difficulty}</p>
                {game.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{game.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GhanaLanguages;