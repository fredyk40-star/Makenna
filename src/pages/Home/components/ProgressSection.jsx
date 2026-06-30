import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaTrophy, FaBook, FaClock } from 'react-icons/fa';
import { useApp } from '../../../context/AppContext';

const ProgressSection = () => {
  const { dailyStars, badges, progress } = useApp();

  const stats = [
    { icon: FaStar, label: 'Stars', value: dailyStars, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { icon: FaTrophy, label: 'Badges', value: badges.length, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { icon: FaBook, label: 'Lessons', value: progress.lessons || 0, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { icon: FaClock, label: 'Minutes', value: progress.minutes || 0, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  ];

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-baloo font-bold text-gray-800 dark:text-white mb-4">
        Today's Learning
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className={`${stat.bg} rounded-2xl p-4 text-center card-soft`}
          >
            <stat.icon className={`${stat.color} text-2xl md:text-3xl mx-auto`} />
            <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mt-1">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ProgressSection;