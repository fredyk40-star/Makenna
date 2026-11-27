import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaMoon, FaSun, FaMobileAlt, FaLanguage, FaInfoCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useI18n, LANGUAGE_NAMES } from '../../context/I18nContext';
import AudioSettings from '../../components/audio/AudioSettings';
import PWAGuidance from '../../components/PWAGuidance/PWAGuidance';
import AccessibilitySettings from '../../components/accessibility/AccessibilitySettings';
import ParentSettingsPanel from '../../components/parent/ParentSettingsPanel';

const Settings = () => {
  const { theme, toggleTheme, setThemeMode } = useTheme();
  const { locale, changeLanguage } = useI18n();
  const [showPWAGuidance, setShowPWAGuidance] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  const isDark = theme === 'dark' || (theme === 'auto' && typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildLabel = import.meta.env.MODE === 'production' ? 'Production' : (import.meta.env.MODE || 'Development');

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
          aria-label={`Toggle theme, currently ${theme}`}
        >
          {isDark ? <FaSun /> : <FaMoon />}
        </motion.button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaLanguage className="text-2xl text-purple-500" />
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Appearance &amp; language
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Theme
            <select
              value={theme}
              onChange={(event) => setThemeMode(event.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
              aria-label="Theme mode"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (follow device)</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            App language
            <select
              value={locale}
              onChange={(event) => changeLanguage(event.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
              aria-label="App language"
            >
              {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
        </div>
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

      <motion.div
        variants={itemVariants}
        className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaInfoCircle className="text-2xl text-green-500" />
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            About Makenna
          </h3>
        </div>
        <dl className="grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold text-gray-700 dark:text-gray-200">App</dt>
          <dd>Makenna Learning Lab</dd>
          <dt className="font-semibold text-gray-700 dark:text-gray-200">Version</dt>
          <dd>{appVersion}</dd>
          <dt className="font-semibold text-gray-700 dark:text-gray-200">Build</dt>
          <dd>{buildLabel}</dd>
          <dt className="font-semibold text-gray-700 dark:text-gray-200">Learning</dt>
          <dd>Ghana-curriculum lessons with offline-first practice.</dd>
        </dl>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
