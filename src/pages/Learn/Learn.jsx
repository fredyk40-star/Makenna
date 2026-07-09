import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/SearchBar/SearchBar';

const modules = [
  {
    id: 'alphabet',
    title: 'Alphabet Adventure',
    description: 'Learn your ABCs with fun words and pictures!',
    icon: '📚',
    path: '/alphabet',
    color: 'from-blue-500 to-blue-400',
    status: 'available'
  },
  {
    id: 'stories',
    title: 'Story Library',
    description: 'Read fun stories and improve your reading!',
    icon: '📖',
    path: '/stories',
    color: 'from-purple-500 to-purple-400',
    status: 'available'
  },
  {
    id: 'word-builder',
    title: 'Word Builder',
    description: 'Build words by putting letters in order!',
    icon: '🔤',
    path: '/reading/word-builder',
    color: 'from-pink-500 to-pink-400',
    status: 'available'
  },
  {
    id: 'sight-words',
    title: 'Sight Words',
    description: 'Learn common words by sight!',
    icon: '👀',
    path: '/reading/sight-words',
    color: 'from-green-500 to-green-400',
    status: 'available'
  },
  {
    id: 'graduation',
    title: 'Alphabet Graduation',
    description: 'Celebrate your Alphabet Adventure!',
    icon: '🏆',
    path: '/graduation',
    color: 'from-yellow-500 to-orange-400',
    status: 'available'
  },
  {
    id: 'numbers',
    title: 'Numbers Kingdom',
    description: 'Learn numbers 0 to 20 with fun activities!',
    icon: '👑',
    path: '/numbers',
    color: 'from-green-500 to-teal-400',
    status: 'available'
  },
  {
    id: 'shapes',
    title: 'Shapes & Colours Adventure',
    description: 'Explore shapes and colours in the world around you!',
    icon: '🔷',
    path: '/shapes',
    color: 'from-purple-500 to-pink-500',
    status: 'available'
  },
  {
  id: 'maths',
  title: 'Early Maths Adventure',
  description: 'Learn addition, subtraction, counting, and comparing numbers!',
  icon: '🧮',
  path: '/maths',
  color: 'from-orange-400 to-yellow-400',
  status: 'available'
}
];

const Learn = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      <div className="text-center">
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          Learn & Explore
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Choose a learning adventure!
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <motion.div
            key={module.id}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-gradient-to-br ${module.color} rounded-2xl p-6 shadow-soft`}
          >
            <div className="text-5xl mb-4">{module.icon}</div>

            <h3 className="font-baloo text-2xl font-bold text-white">
              {module.title}
            </h3>

            <p className="text-white/90 text-sm mt-2">
              {module.description}
            </p>

            {module.status === 'available' ? (
              <>
                <Link
                  to={module.path}
                  className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300"
                >
                  Start Learning
                </Link>

                {module.id === 'numbers' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to="/numbers/games"
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm"
                    >
                      🎮 Games
                    </Link>

                    <Link
                      to="/numbers/stories"
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm"
                    >
                      📖 Stories
                    </Link>

                    <Link
                      to="/numbers/mastery"
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm"
                    >
                      🏆 Mastery
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4">
                <span className="inline-block bg-gray-800/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Learn;