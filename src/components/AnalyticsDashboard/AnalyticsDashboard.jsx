import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaChartBar, FaGlobe, FaStar, FaBookOpen, FaGamepad } from 'react-icons/fa';
import { LearningAnalytics } from '../../services/LearningAnalytics';
import { ChildAccountService } from '../../services/ChildAccountService';

const AnalyticsDashboardComponent = () => {
  const [overallStats, setOverallStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [activeTab, setActiveTab] = useState('overall');

  const childId = ChildAccountService.getActiveChildId();

  useEffect(() => {
    if (childId) {
      loadAnalytics();
    }
  }, [childId]);

  const loadAnalytics = () => {
    setOverallStats(LearningAnalytics.getStats(childId));
    setTrends(LearningAnalytics.getProgressTrends(childId));
  };

  if (!overallStats || !trends) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <div className="text-center">Loading analytics dashboard...</div>
      </div>
    );
  }

  const renderOverallStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Stars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800/30 dark:to-yellow-900/30 rounded-xl shadow-md flex items-center space-x-4"
      >
        <FaStar className="text-yellow-500 text-4xl" />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Total Stars Earned</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{overallStats.starsEarned}</p>
        </div>
      </motion.div>

      {/* Lessons Completed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/30 dark:to-blue-900/30 rounded-xl shadow-md flex items-center space-x-4"
      >
        <FaBookOpen className="text-blue-500 text-4xl" />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Lessons Completed</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{overallStats.lessonsCompleted}</p>
        </div>
      </motion.div>

      {/* Games Played */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800/30 dark:to-green-900/30 rounded-xl shadow-md flex items-center space-x-4"
      >
        <FaGamepad className="text-green-500 text-4xl" />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Games Played</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{overallStats.gamesPlayed}</p>
        </div>
      </motion.div>

      {/* Average Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-5 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800/30 dark:to-purple-900/30 rounded-xl shadow-md flex items-center space-x-4"
      >
        <FaChartLine className="text-purple-500 text-4xl" />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Average Score</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{overallStats.averageScore}%</p>
        </div>
      </motion.div>
    </div>
  );

  const renderProgressTrends = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">Learning Progress Over Time</h3>
      {trends.progressTrend && trends.progressTrend.length > 0 ? (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 h-64 flex items-end justify-between gap-2">
          {trends.progressTrend.slice(-15).map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="w-full bg-blue-400 rounded-t-lg transition-all duration-300 hover:bg-blue-500"
                   style={{ height: `${data.progress || 0}%` }} />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(data.date).toLocaleDateString("en", { day: "numeric" })}
              </span>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileHover={{ opacity: 1, y: -20 }}
                className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
              >
                {data.progress}% on {new Date(data.date).toLocaleDateString()}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No progress data available yet.</p>
      )}

      <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-8">Time Spent Learning</h3>
      {trends.timeSpentTrend && trends.timeSpentTrend.length > 0 ? (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 h-64 flex items-end justify-between gap-2">
          {trends.timeSpentTrend.slice(-15).map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div className="w-full bg-green-400 rounded-t-lg transition-all duration-300 hover:bg-green-500"
                   style={{ height: `${(data.timeSpent / 60) * 100}%` }} /> {/* Assuming max 60min/day for scaling */}
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(data.date).toLocaleDateString("en", { day: "numeric" })}
              </span>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileHover={{ opacity: 1, y: -20 }}
                className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
              >
                {data.timeSpent} mins on {new Date(data.date).toLocaleDateString()}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No time spent data available yet.</p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 space-y-8"
    >
      <h1 className="text-4xl font-extrabold text-center font-baloo">
        Your Learning Journey 🚀
      </h1>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab('overall')}
          className={`px-5 py-2 rounded-full text-lg font-medium transition-all ${
            activeTab === 'overall' ? 'bg-primary text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <FaGlobe className="inline-block mr-2" /> Overall Stats
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-5 py-2 rounded-full text-lg font-medium transition-all ${
            activeTab === 'trends' ? 'bg-primary text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <FaChartBar className="inline-block mr-2" /> Progress Trends
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overall' && renderOverallStats()}
          {activeTab === 'trends' && renderProgressTrends()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default AnalyticsDashboardComponent;