import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaUserLock, FaTimes } from 'react-icons/fa';
import { announceToScreenReader } from '../../../utils/accessibility';
import ParentZonePage from '../../../pages/ParentZone/ParentZone';

const ParentSection = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const pinInputRef = useRef(null);
  const CORRECT_PIN = '1234';
  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    if (showPinInput && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [showPinInput]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsLocked(false);
      setError('');
      setPin('');
      setShowPinInput(false);
      setAttempts(0);
      announceToScreenReader('Parent zone unlocked');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining`);
      setPin('');
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setError('Too many attempts. Please wait 30 seconds.');
        setTimeout(() => {
          setAttempts(0);
          setError('');
        }, 30000);
      }
      announceToScreenReader('Incorrect PIN');
    }
  };

  const handlePinKeypad = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handlePinClear = () => {
    setPin('');
    setError('');
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9' && pin.length < 4) {
      handlePinKeypad(e.key);
    } else if (e.key === 'Backspace') {
      handlePinBackspace();
    } else if (e.key === 'Enter' && pin.length === 4) {
      handlePinSubmit(e);
    } else if (e.key === 'Escape') {
      setShowPinInput(false);
      setPin('');
      setError('');
    }
  };

  if (isLocked) {
    return (
      <section className="mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-2xl p-4 md:p-6"
        >
          {!showPinInput ? (
            <button
              onClick={() => setShowPinInput(true)}
              className="w-full flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl p-3"
              aria-label="Open Parent Zone with PIN"
            >
              <FaLock className="text-xl" aria-hidden="true" />
              <span className="font-semibold text-lg">Parent Zone (PIN required)</span>
            </button>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
              role="dialog"
              aria-label="Parent zone PIN entry"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-white">Enter PIN</h3>
                <button
                  onClick={() => {
                    setShowPinInput(false);
                    setPin('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1"
                  aria-label="Close PIN entry"
                >
                  <FaTimes className="text-xl" aria-hidden="true" />
                </button>
              </div>
              
              {/* PIN Display */}
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
                      pin.length > index
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 dark:border-gray-600 text-gray-400'
                    }`}
                    aria-hidden="true"
                  >
                    {pin.length > index ? '●' : ''}
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center font-medium" role="alert">
                  {error}
                </p>
              )}

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePinKeypad(num.toString())}
                    className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 text-2xl font-bold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={`Enter ${num}`}
                  >
                    {num}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePinClear}
                  className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Clear PIN"
                >
                  Clear
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePinKeypad('0')}
                  className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 text-2xl font-bold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Enter 0"
                >
                  0
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePinBackspace}
                  className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Backspace"
                >
                  ⌫
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 md:p-6"
      >
        <div className="flex items-start justify-between">
          <div className="w-full">
            <ParentZonePage />
            <button
              onClick={() => setIsLocked(true)}
              className="mt-3 text-sm text-primary dark:text-blue-400 font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded-lg px-2 py-1"
              aria-label="Lock Parent Zone"
            >
              Lock Parent Zone
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ParentSection;