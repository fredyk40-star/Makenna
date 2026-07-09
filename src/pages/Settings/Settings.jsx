import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaMoon, FaSun, FaTrash, FaExclamationTriangle, FaMobileAlt } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useAlphabetProgress } from '../../hooks/useAlphabetProgress';
import { useNumbersProgress } from '../../hooks/useNumbersProgress';
import AudioSettings from '../../components/audio/AudioSettings';
import PWAGuidance from '../../components/PWAGuidance/PWAGuidance';
import ParentalControls from '../../components/ParentalControls/ParentalControls';
import LessonScheduler from '../../components/LessonScheduler/LessonScheduler';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { resetProgress: resetAlphabetProgress } = useAlphabetProgress();
  const { resetProgress: resetNumbersProgress } = useNumbersProgress();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPWAGuidance, setShowPWAGuidance] = useState(false);

  const handleResetProgress = () => {
    resetAlphabetProgress();
    resetNumbersProgress();
    setIsModalOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h1 className="font-baloo text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <FaCog />
          Settings
        </h1>
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <FaSun /> : <FaMoon />}
        </motion.button>
      </motion.div>

      {/* PWA Installation Section */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaMobileAlt className="text-2xl text-blue-500" />
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Install App
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Add Makenna Learning Lab to your home screen for quick access and offline use!
        </p>
        <motion.button
          onClick={() => setShowPWAGuidance(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
        >
          Show Installation Guide
        </motion.button>
      </motion.div>

      {/* PWA Guidance Modal */}
      {showPWAGuidance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <PWAGuidance autoPlay={true} context="settings" />
            <div className="mt-4 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPWAGuidance(false)}
                className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 font-semibold"
              >
                Close Guide
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Audio Settings */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <AudioSettings />
      </motion.div>

      {/* Parental Controls */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4">
          Parental Controls
        </h3>
        <ParentalControls />
      </motion.div>

      {/* Lesson Scheduler */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4">
          Lesson Scheduler
        </h3>
        <LessonScheduler />
      </motion.div>
      
      {/* Data Management */}
      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white mb-4">
          Data Management
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          This will erase all your progress, including completed lessons, favorites, and achievements. This action cannot be undone.
        </p>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 rounded-xl font-semibold hover:bg-red-500/20 transition-colors"
        >
          <FaTrash />
          Reset All Progress
        </motion.button>
      </motion.div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-sm w-full text-center"
          >
            <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
            <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">
              Are you sure?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">
              All your learning progress will be permanently deleted.
            </p>
            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetProgress}
                className="px-6 py-2 rounded-xl bg-red-500 text-white font-semibold"
              >
                Yes, Reset
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Settings;