import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SightWords = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      <div className="flex items-center gap-3">
        <Link
          to="/learn"
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FaArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            <FaEye className="inline-block mr-2" />
            Sight Words
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Learn common words by sight
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 text-center">
        <h2 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
          Sight Words Page
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          This page is under construction.
        </p>
      </div>
    </motion.div>
  );
};

export default SightWords;
