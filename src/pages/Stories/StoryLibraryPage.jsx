import React from 'react';
import { motion } from 'framer-motion';
import StoryLibrary from '../../components/stories/StoryLibrary';

const StoryLibraryPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-4"
    >
      <StoryLibrary />
    </motion.div>
  );
};

export default StoryLibraryPage;