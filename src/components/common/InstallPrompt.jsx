import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { FaDownload, FaTimes } from 'react-icons/fa';

const InstallPrompt = () => {
  const { isInstallable, installApp } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div className="glassmorphism rounded-2xl p-4 shadow-soft border border-white/20">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 dark:text-white">
                Install Makenna Lab
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Get the full experience with offline access!
              </p>
              <button
                onClick={installApp}
                className="mt-3 btn-primary text-sm py-2 px-4 rounded-xl flex items-center gap-2"
              >
                <FaDownload />
                Install App
              </button>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;