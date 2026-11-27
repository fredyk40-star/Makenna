import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceGuide } from '../../services/VoiceGuideService';

/**
 * CelebrationPopup - Reusable celebration modal for account creation, achievements, etc.
 * When requireAcknowledgement is true (account creation), the user must copy
 * and acknowledge the generated Child ID before continuing.
 */
const CelebrationPopup = ({ isOpen, onClose, childName, childId, onReplay, requireAcknowledgement = false, welcomeEmailSent = false, parentEmail = '' }) => {
  const [hasSpoken, setHasSpoken] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    // Initialize voice guide when component mounts
    try {
      voiceGuide.init();
    } catch (err) {
      console.warn('VoiceGuide initialization failed:', err);
    }

    if (isOpen && !hasSpoken && !speechError && childName && childId) {
      const message = `Congratulations ${childName}! Your child ID is ${childId}. Please copy it and remember your PIN or password to log in next time.`;
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
      console.warn('Missing child data for celebration - showing popup without voice');
    }
  }, [isOpen, childName, childId, hasSpoken, speechError]);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setAcknowledged(false);
    }
  }, [isOpen, childId]);

  const canClose = !requireAcknowledgement || acknowledged;

  const handleClose = () => {
    if (canClose) onClose();
  };

  const handleReplay = () => {
    if (speechError) return;
    const message = `Congratulations ${childName}! Your child ID is ${childId}. Please copy it and remember your PIN or password to log in next time.`;
    try {
      voiceGuide.speakRepeated(message, 3, { rate: 0.9, pitch: 1.1 });
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
    if (onReplay) onReplay();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(childId || '');
      setCopied(true);
    } catch (err) {
      console.warn('Could not copy child ID:', err);
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Celebration"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce" aria-hidden="true">
              🎉
            </div>

            <h2 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              Welcome, {childName}! 🎊
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your account has been created successfully and saved to the cloud.
            </p>

            {welcomeEmailSent && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                A welcome email with your Child ID and recovery tips was sent to {parentEmail || 'your parent email'}.
              </p>
            )}

            <div className="bg-purple-100 dark:bg-purple-900 rounded-xl p-4 mb-4">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                Your Child ID
              </p>
              <p className="text-2xl font-mono font-bold text-purple-800 dark:text-purple-200 break-all">
                {childId}
              </p>
            </div>

            {requireAcknowledgement && (
              <div className="mb-4 space-y-3">
                <button
                  onClick={handleCopy}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label="Copy child ID"
                >
                  {copied ? '✅ Copied!' : '📋 Copy My Child ID'}
                </button>
                <label className="flex items-start gap-3 text-left bg-yellow-50 dark:bg-yellow-900 rounded-xl p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-purple-600"
                  />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    I have copied or written down my Child ID. I know I need it to log in.
                  </span>
                </label>
              </div>
            )}

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

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleReplay}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-purple-300"
                aria-label="Hear the information again"
              >
                🔁 Replay
              </button>
              <button
                onClick={handleClose}
                disabled={!canClose}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
