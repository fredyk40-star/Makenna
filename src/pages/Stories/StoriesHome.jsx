import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaBookOpen } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { STORIES } from '../../data/stories';
import StoryCard from '../../components/stories/StoryCard';

const StoriesHome = () => {
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
            <FaBookOpen className="inline-block mr-2" />
            Story Library
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a story to read
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {STORIES.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StoryCard story={story} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default StoriesHome;
