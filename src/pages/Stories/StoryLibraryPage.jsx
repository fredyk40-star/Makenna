import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBook, FaArrowLeft, FaCheck, FaBookmark, FaFire } from 'react-icons/fa';
import StoryLibrary from '../../components/stories/StoryLibrary';
import readingAnalyticsService from '../../services/ReadingAnalyticsService';

const StoryLibraryPage = () => {
  const [completedStories, setCompletedStories] = useState([]);
  const [bookmarkedStories, setBookmarkedStories] = useState([]);

  useEffect(() => {
    const stats = readingAnalyticsService.getStats();
    setCompletedStories(stats.completedStories || []);
    setBookmarkedStories(stats.favoriteStories || []);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-4"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FaBook />
            Story Library
          </h1>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3">
          <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaCheck className="text-purple-600" />
            <span className="font-semibold">{completedStories.length} read</span>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaBookmark className="text-blue-600" />
            <span className="font-semibold">{bookmarkedStories.length} saved</span>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-xl flex items-center gap-2">
            <FaFire className="text-orange-600" />
            <span className="font-semibold">{readingAnalyticsService.getStats().readingStreak} day streak</span>
          </div>
        </div>
      </div>

      {/* Story Library Component */}
      <StoryLibrary />
    </motion.div>
  );
};

export default StoryLibraryPage;