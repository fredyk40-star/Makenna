import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBible, FaArrowLeft } from 'react-icons/fa';
import { BIBLE_STORIES_DATA } from '../../data/bibleStoriesData';

const BibleTime = () => {
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
          <FaBible />
          Bible Time
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BIBLE_STORIES_DATA.map((story, index) => (
          <Link to={`/bible-time/${story.id}`} key={story.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`bg-gradient-to-br ${story.color} rounded-2xl p-6 shadow-soft text-white h-full flex flex-col justify-between`}
            >
              <div>
                <div className="text-5xl mb-4">{story.icon}</div>
                <h3 className="font-baloo text-2xl font-bold">{story.title}</h3>
                <p className="opacity-90 mt-2">{story.summary}</p>
              </div>
              <div className="text-right mt-4 font-semibold">Read Story →</div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default BibleTime;
