import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaCheck } from 'react-icons/fa';
import { MATHS_TOPICS } from '../../data/mathsData';
import { useProfiles } from '../../context/ProfileContext';
import { staggerContainer } from '../../utils/constants';

const MathsHome = () => {
  const [progress, setProgress] = useState({});
  const { getProfileData } = useProfiles();

  useEffect(() => {
    const savedProgress = getProfileData('maths_progress', {});
    setProgress(savedProgress);
  }, [getProfileData]);

  const getTopicProgress = (topicId) => {
    const topic = progress[topicId] || {};
    return topic.completed || false;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/learn"
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FaArrowLeft className="text-xl" />
        </Link>
        <div>
          <h1 className="font-baloo text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            🧮 Early Maths Adventure
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Learn addition, subtraction, counting, and more!
          </p>
        </div>
      </div>

      {/* Topics Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {MATHS_TOPICS.map((topic, index) => {
          const isCompleted = getTopicProgress(topic.id);

          return (
            <motion.div
              key={topic.id}
              variants={{
                initial: { opacity: 0, scale: 0.9 },
                animate: { 
                  opacity: 1, 
                  scale: 1,
                  transition: { delay: index * 0.05 }
                }
              }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <Link
                to={topic.route}
                className={`block bg-gradient-to-br ${topic.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl mb-2">{topic.icon}</div>
                    <h3 className="font-baloo text-xl font-bold text-white">
                      {topic.title}
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      {topic.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <FaCheck className="text-[10px]" />
                        Done
                      </span>
                    )}
                    <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                      Start
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-primary">4</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Topics</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-green-500">
            {Object.values(progress).filter(p => p.completed).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-yellow-500">⭐</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Stars Earned</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-soft">
          <div className="text-2xl font-bold text-purple-500">🏆</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Mastery</div>
        </div>
      </div>
    </motion.div>
  );
};

export default MathsHome;