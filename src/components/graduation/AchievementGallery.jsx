import React from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaStar, FaRocket, FaBook, FaPencilAlt, FaGamepad } from 'react-icons/fa';
import { useMastery } from '../../hooks/useMastery';

const AchievementGallery = ({ className = '' }) => {
  const { progressSummary } = useMastery();

  const achievements = [
    {
      id: 'explorer',
      title: 'Alphabet Explorer',
      description: 'Opened all 26 letters',
      icon: FaRocket,
      unlocked: progressSummary?.total === 26,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'tracer',
      title: 'Super Tracer',
      description: 'Traced all uppercase and lowercase letters',
      icon: FaPencilAlt,
      unlocked: true,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      id: 'reader',
      title: 'Reading Star',
      description: 'Read all alphabet stories',
      icon: FaBook,
      unlocked: true,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 'builder',
      title: 'Word Builder',
      description: 'Built 20+ words',
      icon: FaStar,
      unlocked: false,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      id: 'gamer',
      title: 'Game Master',
      description: 'Played all alphabet games',
      icon: FaGamepad,
      unlocked: false,
      color: 'text-red-500',
      bg: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      id: 'champion',
      title: 'Phonics Champion',
      description: 'Mastered all letter sounds',
      icon: FaTrophy,
      unlocked: false,
      color: 'text-orange-500',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  return (
    <div className={`${className}`}>
      <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4">
        🏅 Achievement Gallery
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`${achievement.bg} rounded-2xl p-4 text-center transition-all duration-300 ${
              achievement.unlocked
                ? 'hover:scale-105 cursor-default'
                : 'opacity-50'
            }`}
          >
            <achievement.icon className={`${achievement.color} text-3xl mx-auto ${
              achievement.unlocked ? 'animate-float' : ''
            }`} />
            <h4 className="font-bold text-sm text-gray-800 dark:text-white mt-2">
              {achievement.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {achievement.description}
            </p>
            <div className="mt-2 text-xs font-bold">
              {achievement.unlocked ? (
                <span className="text-green-500">✅ Unlocked</span>
              ) : (
                <span className="text-gray-400">🔒 Locked</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AchievementGallery;