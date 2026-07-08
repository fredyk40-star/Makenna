import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBible, FaArrowLeft, FaCheck, FaStar, FaBook, FaScroll } from 'react-icons/fa';
import { BIBLE_STORIES_DATA } from '../../data/bibleStoriesData';

const BibleTime = () => {
  const [completedStories, setCompletedStories] = useState([]);
  const [memoryVerses, setMemoryVerses] = useState([]);

  useEffect(() => {
    const storedCompleted = JSON.parse(localStorage.getItem('bible_completed') || '[]');
    const storedVerses = JSON.parse(localStorage.getItem('bible_verses') || '[]');
    setCompletedStories(storedCompleted);
    setMemoryVerses(storedVerses);
  }, []);

  const progressPercentage = Math.round((completedStories.length / BIBLE_STORIES_DATA.length) * 100);

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
            <FaBible />
            Bible Time
          </h1>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3">
          <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaCheck className="text-green-600" />
            <span className="font-semibold">{completedStories.length} read</span>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaBook className="text-yellow-600" />
            <span className="font-semibold">{memoryVerses.length} verses</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BIBLE_STORIES_DATA.map((story, index) => {
          const isCompleted = completedStories.includes(story.id);
          return (
            <Link 
              to={`/bible-time/${story.id}`} 
              key={story.id}
              onClick={() => {
                if (!isCompleted) {
                  const newCompleted = [...new Set([...completedStories, story.id])];
                  setCompletedStories(newCompleted);
                  localStorage.setItem('bible_completed', JSON.stringify(newCompleted));
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative bg-gradient-to-br ${story.color} rounded-2xl p-6 shadow-soft text-white h-full flex flex-col justify-between ${
                  isCompleted ? 'ring-2 ring-green-400' : ''
                }`}
              >
                <div>
                  <div className="text-5xl mb-4">{story.icon}</div>
                  <h3 className="font-baloo text-2xl font-bold flex items-center gap-2">
                    {story.title}
                    {isCompleted && <FaCheck className="text-green-300 text-sm" />}
                  </h3>
                  <p className="opacity-90 mt-2">{story.summary}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-right font-semibold">Read Story →</div>
                  {isCompleted && <FaStar className="text-yellow-300" />}
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Memory Verses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft">
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FaScroll /> Memory Verses
        </h3>
        {memoryVerses.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {memoryVerses.map((verse, idx) => (
              <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm">
                📖 "{verse}"
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Read stories to collect memory verses!</p>
        )}
      </div>
    </motion.div>
  );
};

export default BibleTime;