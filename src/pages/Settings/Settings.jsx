import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaMoon, FaSun, FaMobileAlt } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import AudioSettings from '../../components/audio/AudioSettings';
import PWAGuidance from '../../components/PWAGuidance/PWAGuidance';
import AccessibilitySettings from '../../components/accessibility/AccessibilitySettings';
import ParentSettingsPanel from '../../components/parent/ParentSettingsPanel';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [showPWAGuidance, setShowPWAGuidance] = useState(false);

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

      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaMobileAlt className="text-2xl text-blue-500" />
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">Install App</h3>
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

      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <AudioSettings />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <AccessibilitySettings />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ParentSettingsPanel />
      </motion.div>
    </motion.div>
  );
};

export default Settings;
