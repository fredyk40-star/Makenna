import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaPaintBrush } from 'react-icons/fa';
import DrawingPad from './DrawingPad';

const Drawing = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-4 w-full"
    >
      <div className="flex items-center justify-between">
        <Link to="/games" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaPaintBrush />
          Drawing Pad
        </h1>
        <div className="w-8"></div>
      </div>
      
      <DrawingPad />

    </motion.div>
  );
};

export default Drawing;
