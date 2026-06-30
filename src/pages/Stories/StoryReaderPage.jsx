import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BookReader from '../../components/stories/BookReader';

const StoryReaderPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/stories');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-4"
    >
      <BookReader storyId={storyId} onClose={handleClose} />
    </motion.div>
  );
};

export default StoryReaderPage;