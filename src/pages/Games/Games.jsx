import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaGamepad, FaGift } from 'react-icons/fa';
import RewardsStore from '../../components/RewardsStore/RewardsStore';

const Games = () => {
  const gameModules = [
    {
      id: 'alphabet',
      title: 'Alphabet Games',
      description: 'Learn your ABCs with fun games!',
      icon: '🔤',
      path: '/games/alphabet',
      color: 'from-blue-500 to-blue-400',
      status: 'available'
    },
    {
      id: 'numbers',
      title: 'Numbers Games',
      description: 'Count and play with numbers.',
      icon: '🔢',
      path: '/numbers/games',
      color: 'from-purple-500 to-purple-400',
      status: 'available'
    },
    {
      id: 'shapes',
      title: 'Shapes Games',
      description: 'Learn shapes with fun games!',
      icon: '🎨',
      path: '/games/shapes',
      color: 'from-green-500 to-green-400',
      status: 'available'
    },
    {
      id: 'music',
      title: 'Music Learning',
      description: 'Sing and learn with educational songs!',
      icon: '🎵',
      path: '/music',
      color: 'from-pink-500 to-purple-500',
      status: 'available'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      <div className="text-center">
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          🎮 Game Zone
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Learn while you play!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gameModules.map((module) => (
          <motion.div
            key={module.id}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-gradient-to-br ${module.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 ${
              module.status === 'coming-soon' ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <div className="text-5xl mb-4">{module.icon}</div>
            <h3 className="font-baloo text-2xl font-bold text-white">
              {module.title}
            </h3>
            <p className="text-white/90 text-sm mt-2">
              {module.description}
            </p>
            {module.status === 'available' ? (
              <Link
                to={module.path}
                className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300"
              >
                Play Now <FaArrowRight className="text-sm" />
              </Link>
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

      {/* Rewards Store */}
      <div className="mt-8">
        <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
          <FaGift className="text-yellow-500" />
          Rewards Store
        </h2>
        <RewardsStore />
      </div>

      {/* Fun Fact */}
      <div className="mt-8 p-6 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl text-center">
        <p className="text-lg font-baloo text-gray-700 dark:text-gray-200">
          🌟 Did you know? Playing games helps your brain grow stronger!
        </p>
      </div>
    </motion.div>
  );
};

export default Games;