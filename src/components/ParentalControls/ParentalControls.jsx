import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaUnlock, FaClock, FaGamepad, FaBookOpen, FaChartLine, FaMoon, FaSun, FaShieldAlt, FaBan, FaSave } from 'react-icons/fa';
import { SafeModeService } from '../../services/SafeModeService';
import { ParentZoneService } from '../../services/ParentZoneService';
import { ChildAccountService } from '../../services/ChildAccountService';

const ParentalControlsComponent = () => {
  const [settings, setSettings] = useState({
    dailyTimeLimit: 60,
    restrictedApps: [],
    allowedHours: { start: '08:00', end: '20:00' },
    contentFilters: { violence: true, explicitContent: true, shopping: true }
  });
  const [loading, setLoading] = useState(true);

  const parentId = ChildAccountService.getActiveChildId() || 'default';

  useEffect(() => {
    loadSettings();
    setLoading(false);
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem(`makenna_parental_settings_${parentId}`);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    if (parentId) {
      ParentZoneService.updateSettings(parentId, settings);
      localStorage.setItem(`makenna_parental_settings_${parentId}`, JSON.stringify(settings));
      alert('Parental controls saved!');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft">
        <p className="text-center text-gray-600 dark:text-gray-300">Loading parental controls...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6 space-y-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-baloo text-gray-800 dark:text-white">
          Parental Controls <FaShieldAlt className="inline-block ml-2 text-purple-500" />
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your child's learning experience and app usage.
        </p>
      </div>

      {/* Daily Time Limit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-4"
      >
        <h2 className="font-bold text-xl">
          <FaClock className="inline-block mr-2 text-blue-400" /> Daily Time Limit
        </h2>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="30"
            max="180"
            step="15"
            value={settings.dailyTimeLimit}
            onChange={(e) => handleSettingChange('dailyTimeLimit', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="font-bold text-lg w-20 text-right">{settings.dailyTimeLimit} mins</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Set the maximum time your child can spend on the app each day.
        </p>
      </motion.div>

      {/* Allowed Hours */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-4"
      >
        <h2 className="font-bold text-xl">
          <FaMoon className="inline-block mr-2 text-yellow-400" /> <FaSun className="inline-block mr-2 text-orange-400" /> Allowed Hours
        </h2>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="pc-input-106" className="block text-sm mb-1">Start Time</label>
            <input id="pc-input-106"
              type="time"
              value={settings.allowedHours.start}
              onChange={(e) => handleSettingChange('allowedHours', { ...settings.allowedHours, start: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="pc-input-115" className="block text-sm mb-1">End Time</label>
            <input id="pc-input-115"
              type="time"
              value={settings.allowedHours.end}
              onChange={(e) => handleSettingChange('allowedHours', { ...settings.allowedHours, end: e.target.value })}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Restrict app access outside these hours.
        </p>
      </motion.div>

      {/* Content Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md space-y-4"
      >
        <h2 className="font-bold text-xl">
          <FaBan className="inline-block mr-2 text-red-400" /> Content Filters
        </h2>
        <div className="space-y-3">
          {Object.entries(settings.contentFilters).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="capitalize text-gray-700 dark:text-gray-300">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <button
                onClick={() => handleSettingChange('contentFilters', { ...settings.contentFilters, [key]: !value })}
                className={`px-4 py-1 rounded-full text-sm ${
                  value ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                {value ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Filter out inappropriate content for your child.
        </p>
      </motion.div>

      {/* Save Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        onClick={saveSettings}
        className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
      >
        <FaSave /> Save Parental Controls
      </motion.button>
    </motion.div>
  );
};

export default ParentalControlsComponent;