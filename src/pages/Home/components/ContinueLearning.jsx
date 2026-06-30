import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

const ContinueLearning = () => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-baloo font-bold text-gray-800 dark:text-white">
          Continue Learning
        </h2>
        <motion.button
          className="text-primary dark:text-blue-400 font-semibold flex items-center gap-1 text-sm relative"
          disabled
        >
          See All <FaArrowRight className="text-xs" />
        </motion.button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex-shrink-0 w-64 md:w-72 bg-gradient-to-br from-gray-400 to-gray-300 rounded-2xl p-6 shadow-soft`}
          >
            <div className="text-4xl mb-3">📚</div>
            <p className="text-white font-bold text-lg">Your next lesson will appear here!</p>
            <p className="text-white/70 text-sm mt-1">Keep learning to unlock more content.</p>
          </motion.div>
      </div>
    </section>
  );
};

export default ContinueLearning;