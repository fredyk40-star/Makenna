import React from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaCog, FaUserShield, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ParentZone = () => {
  const features = [
    {
      name: 'Progress Report',
      description: "View your child's learning progress and achievements.",
      icon: <FaChartBar className="text-blue-500" />,
      link: '/parent-zone/progress',
    },
    {
      name: 'Manage Profiles',
      description: 'Add or edit child profiles.',
      icon: <FaUserShield className="text-green-500" />,
      link: '/profile',
    },
    {
      name: 'App Settings',
      description: 'Adjust learning goals and app preferences.',
      icon: <FaCog className="text-purple-500" />,
      link: '/settings',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          Parent Zone
        </h1>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Link to={feature.link} key={index}>
            <motion.div
              whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center cursor-pointer shadow-soft"
            >
              <div className="text-4xl mb-4 inline-block">{feature.icon}</div>
              <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">{feature.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{feature.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default ParentZone;