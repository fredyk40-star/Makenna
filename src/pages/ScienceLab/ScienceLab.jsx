import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFlask, FaArrowLeft, FaCheck, FaBook, FaStar, FaBullseye, FaLightbulb } from 'react-icons/fa';
import { SCIENCE_DATA } from '../../data/scienceData';

const ScienceLab = () => {
  const [completedExperiments, setCompletedExperiments] = useState([]);
  const [collectedFacts, setCollectedFacts] = useState([]);

  useEffect(() => {
    const storedCompleted = JSON.parse(localStorage.getItem('science_completed') || '[]');
    const storedFacts = JSON.parse(localStorage.getItem('science_facts') || '[]');
    setCompletedExperiments(storedCompleted);
    setCollectedFacts(storedFacts);
  }, []);

  const progressPercentage = Math.round((completedExperiments.length / SCIENCE_DATA.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FaFlask />
            Science Lab
          </h1>
        </div>
        
        {/* Progress Stats */}
        <div className="flex gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaCheck className="text-green-600" />
            <span className="font-semibold">{completedExperiments.length} completed</span>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaLightbulb className="text-yellow-600" />
            <span className="font-semibold">{collectedFacts.length} facts</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCIENCE_DATA.map((activity, index) => {
          const isCompleted = completedExperiments.includes(activity.id);
          return (
            <Link 
              to={activity.status === 'coming-soon' ? '#' : activity.path} 
              key={activity.id} 
              className={activity.status === 'coming-soon' ? 'cursor-not-allowed' : ''}
              onClick={() => {
                if (activity.status !== 'coming-soon') {
                  const newCompleted = [...new Set([...completedExperiments, activity.id])];
                  setCompletedExperiments(newCompleted);
                  localStorage.setItem('science_completed', JSON.stringify(newCompleted));
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: activity.status === 'coming-soon' ? 1 : 1.05, y: activity.status === 'coming-soon' ? 0 : -5 }}
                className={`relative bg-gradient-to-br ${activity.color} rounded-2xl p-6 shadow-soft text-white h-full flex flex-col justify-between ${
                  isCompleted ? 'ring-2 ring-green-400' : ''
                }`}
              >
                <div>
                  <div className="text-5xl mb-4">{activity.icon}</div>
                  <h3 className="font-baloo text-2xl font-bold flex items-center gap-2">
                    {activity.title}
                    {isCompleted && <FaCheck className="text-green-300 text-sm" />}
                  </h3>
                  <p className="opacity-90 mt-2">{activity.summary}</p>
                </div>
                {activity.status === 'coming-soon' ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <span className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full">Coming Soon</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-semibold">Explore →</span>
                    {isCompleted && <FaStar className="text-yellow-300" />}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Science Facts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft"
      >
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FaBook /> Science Facts Journal
        </h3>
        {collectedFacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {collectedFacts.map((fact, idx) => (
              <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
                📚 {fact}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Complete experiments to collect science facts!</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ScienceLab;