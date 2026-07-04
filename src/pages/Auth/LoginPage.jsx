import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChildAccount } from '../../context/ChildAccountContext';
import { useVoiceGuide } from '../../context/VoiceGuideContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error, clearError } = useChildAccount();
  const { playError, playSuccess } = useVoiceGuide();

  const [childId, setChildId] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [shakeForm, setShakeForm] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validate
    if (!childId.trim()) {
      setLocalError('Please enter your Child ID.');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      playError();
      return;
    }

    if (!pin.trim()) {
      setLocalError('Please enter your PIN.');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      playError();
      return;
    }

    setIsSubmitting(true);
    try {
      await login(childId.trim(), pin.trim());
      playSuccess();
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please try again.');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">🔐</div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Welcome Back!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Enter your Child ID and PIN to continue
            </p>
          </div>

          {/* Error message */}
          {(localError || error) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-6"
              role="alert"
            >
              <p className="text-red-600 dark:text-red-400 text-sm text-center">
                {localError || error}
              </p>
            </motion.div>
          )}

          {/* Login form */}
          <motion.form
            onSubmit={handleSubmit}
            animate={shakeForm ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Child ID input */}
            <div>
              <label htmlFor="childId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Child ID
              </label>
              <input
                id="childId"
                type="text"
                value={childId}
                onChange={(e) => {
                  setChildId(e.target.value.toUpperCase());
                  setLocalError('');
                }}
                placeholder="e.g., kid-1"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                autoComplete="username"
                disabled={isSubmitting}
                aria-label="Child ID"
              />
            </div>

            {/* PIN input */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PIN
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 8) {
                      setPin(val);
                      setLocalError('');
                    }
                  }}
                  placeholder="Enter your 4 or 8 digit PIN"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-label="PIN"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                PIN must be 4 or 8 digits
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-purple-300 shadow-lg shadow-purple-200 dark:shadow-purple-900"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Log In 🚀'
              )}
            </button>
          </motion.form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
          </div>

          {/* Register link */}
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Don't have an account yet?
            </p>
            <Link
              to="/register"
              className="inline-block px-6 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-xl font-semibold hover:bg-green-200 dark:hover:bg-green-800 transition-colors focus:outline-none focus:ring-4 focus:ring-green-200"
            >
              Create Account 🎉
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;