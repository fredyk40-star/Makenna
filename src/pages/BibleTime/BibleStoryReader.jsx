import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaBible } from 'react-icons/fa';
import { Link, useParams, Navigate } from 'react-router-dom';
import { BIBLE_STORIES_DATA } from '../../data/bibleStoriesData';

const BibleStoryReader = () => {
  const { storyId } = useParams();
  const story = BIBLE_STORIES_DATA.find(s => s.id === storyId);

  if (!story) {
    return <Navigate to="/bible-time" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center gap-4">
        <Link to="/bible-time" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            {story.icon} {story.title}
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6 md:p-8">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {story.content.map((item, index) => {
            if (item.type === 'paragraph') {
              return <p key={index}>{item.text}</p>;
            }
            return null;
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default BibleStoryReader;
