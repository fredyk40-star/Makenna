import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaFlask, FaArrowLeft } from 'react-icons/fa';
import { SCIENCE_DATA } from '../../data/scienceData';

const ScienceLab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <FaFlask />
          Science Lab
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCIENCE_DATA.map((activity, index) => (
          <Link to={activity.status === 'coming-soon' ? '#' : activity.path} key={activity.id} className={activity.status === 'coming-soon' ? 'cursor-not-allowed' : ''}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: activity.status === 'coming-soon' ? 1 : 1.05, y: activity.status === 'coming-soon' ? 0 : -5 }}
              className={`relative bg-gradient-to-br ${activity.color} rounded-2xl p-6 shadow-soft text-white h-full flex flex-col justify-between`}
            >
              <div>
                <div className="text-5xl mb-4">{activity.icon}</div>
                <h3 className="font-baloo text-2xl font-bold">{activity.title}</h3>
                <p className="opacity-90 mt-2">{activity.summary}</p>
              </div>
              {activity.status === 'coming-soon' ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <span className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full">Coming Soon</span>
                </div>
              ) : (
                <div className="text-right mt-4 font-semibold">Explore →</div>
              )}
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default ScienceLab;
