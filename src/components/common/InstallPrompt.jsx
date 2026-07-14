import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { usePWADetection } from '../../hooks/usePWADetection';
import { FaDownload, FaTimes, FaShareAlt } from 'react-icons/fa';

const InstallPrompt = () => {
  const { isInstallable, isInstalled, installApp } = useInstallPrompt();
  const { platform } = usePWADetection();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleInstall = async () => {
    if (isInstallable) {
      const result = await installApp();
      if (!result && platform === 'ios') {
        setShowIOSHint(true);
      }
    } else if (platform === 'ios') {
      setShowIOSHint(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSHint(false);
  };

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

              {/* iOS Safari hint */}
              <AnimatePresence>
                {showIOSHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2"
                  >
                    <div className="flex items-center gap-2">
                      <FaShareAlt className="text-blue-500 shrink-0" />
                      <span>
                        Tap the <strong>Share</strong> button in Safari, then scroll down and tap <strong>"Add to Home Screen"</strong>.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showIOSHint && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Get the full experience with offline access!
                </p>
              )}

              <button
                onClick={handleInstall}
                className="mt-3 btn-primary text-sm py-2 px-4 rounded-xl flex items-center gap-2"
              >
                <FaDownload />
                {isInstallable ? 'Install App' : 'Add to Home Screen'}
              </button>
            </div>
            <button
              onClick={handleDismiss}
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
