import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceGuide } from '../../services/VoiceGuideService';

/**
 * CelebrationPopup - Reusable celebration modal for account creation, achievements, etc.
 */
const CelebrationPopup = ({ isOpen, onClose, childName, childId, onReplay }) => {
  const [hasSpoken, setHasSpoken] = useState(false);
  const [speechError, setSpeechError] = useState(false);

  useEffect(() => {
    // Initialize voice guide when component mounts
    try {
      voiceGuide.init();
    } catch (err) {
      console.warn('VoiceGuide initialization failed:', err);
    }

    if (isOpen && !hasSpoken && !speechError && childName && childId) {
      // Speak the announcement three times with error handling
      const message = `Congratulations ${childName}! Your child ID is ${childId}. Please remember your ID and PIN to log in next time.`;
      try {
        voiceGuide.speakRepeated(message, 3, {
          rate: 0.9,
          pitch: 1.1,
          onEnd: () => setHasSpoken(true),
          onError: () => setSpeechError(true),
        });
      } catch (err) {
        console.warn('Speech synthesis failed:', err);
        setSpeechError(true);
      }
    } else if (isOpen && (!childName || !childId)) {
      // If no child data, still allow the popup to show but don't try to speak
      console.warn('Missing child data for celebration - showing popup without voice');
    }
  }, [isOpen, childName, childId, hasSpoken, speechError]);

  const handleReplay = () => {
    if (speechError) return;
    const message = `Congratulations ${childName}! Your child ID is ${childId}. Please remember your ID and PIN to log in next time.`;
    try {
      voiceGuide.speakRepeated(message, 3, { rate: 0.9, pitch: 1.1 });
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
    if (onReplay) onReplay();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Celebration"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration emoji */}
            <div className="text-7xl mb-4 animate-bounce" aria-hidden="true">
              🎉
            </div>

            <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              Welcome, {childName}! 🎊
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your account has been created successfully!
            </p>

            {/* Child ID display */}
            <div className="bg-purple-100 dark:bg-purple-900 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                Your Child ID
              </p>
              <p className="text-2xl font-mono font-bold text-purple-800 dark:text-purple-200">
                {childId}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 dark:bg-yellow-900 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                📝 <strong>Please remember:</strong>
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                <li>Your Child ID: <strong>{childId}</strong></li>
                <li>Your secret PIN (keep it safe!)</li>
                <li>Use these to log in next time</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleReplay}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-purple-300"
                aria-label="Hear the information again"
              >
                🔁 Replay
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
                aria-label="Got it, continue"
              >
                Got it! ✅
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationPopup;