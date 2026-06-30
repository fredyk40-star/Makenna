import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShapes, FaGamepad } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { SHAPES_DATA } from '../../data/shapesData';

const ShapesHome = () => {
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
            <FaShapes className="inline-block mr-2" />
            Shapes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Learn about shapes and play fun games!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {SHAPES_DATA.map((shape, index) => (
          <motion.div
            key={shape.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/shapes/${shape.id}`}
              className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-glow transition-shadow"
            >
              <div className="text-6xl mb-2">{shape.emoji}</div>
              <span className="font-baloo text-lg text-gray-800 dark:text-white">{shape.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: SHAPES_DATA.length * 0.1 }}
      >
        <Link
          to="/shapes/games"
          className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl hover:bg-primary-dark transition-colors"
        >
          <FaGamepad className="text-2xl" />
          <span className="font-baloo text-xl">Play Shapes Games</span>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default ShapesHome;
