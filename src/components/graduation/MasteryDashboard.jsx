import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaTrophy, FaChartLine, FaBook, FaGamepad, FaPencilAlt } from 'react-icons/fa';
import { useMastery } from '../../hooks/useMastery';

const MasteryDashboard = ({ className = '' }) => {
  const { progressSummary, recommendations, getOverallProgress } = useMastery();

  if (!progressSummary) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600 dark:text-gray-300">Loading mastery data...</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Mastered',
      value: progressSummary.mastered,
      total: progressSummary.total,
      icon: FaStar,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      label: 'In Progress',
      value: progressSummary.inProgress,
      total: progressSummary.total,
      icon: FaChartLine,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Needs Work',
      value: progressSummary.needsWork,
      total: progressSummary.total,
      icon: FaPencilAlt,
      color: 'text-orange-500',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      label: 'Not Started',
      value: progressSummary.notStarted,
      total: progressSummary.total,
      icon: FaBook,
      color: 'text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-700'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
              Alphabet Mastery
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {progressSummary.mastered} of {progressSummary.total} letters mastered
            </p>
          </div>
          <div className="text-3xl font-bold text-primary dark:text-blue-400">
            {getOverallProgress()}%
          </div>
        </div>
        <div className="mt-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getOverallProgress()}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bg} rounded-2xl p-4 text-center`}
          >
            <stat.icon className={`${stat.color} text-2xl mx-auto`} />
            <div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
          <h4 className="font-bold text-gray-800 dark:text-white mb-2">
            📝 Recommendations
          </h4>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">• {rec.title}:</span> {rec.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasteryDashboard;