import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChildAccount } from '../../context/ChildAccountContext';
import { useVoiceGuide } from '../../context/VoiceGuideContext';
import CelebrationPopup from '../../components/common/CelebrationPopup';
import LoginGuidance from '../../components/LoginGuidance/LoginGuidance';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useChildAccount();
  const { playError } = useVoiceGuide();

  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [registeredChild, setRegisteredChild] = useState({ name: '', childId: '' });

  const validateForm = () => {
    const errors = {};
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      errors.name = 'Please enter your name.';
    } else if (trimmedName.length > 50) {
      errors.name = 'Name must be 50 characters or less.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!pin) {
      errors.pin = 'Please enter a PIN.';
    } else if (!/^\d{4}$/.test(pin) && !/^\d{8}$/.test(pin)) {
      errors.pin = 'PIN must be 4 or 8 digits.';
    }

    if (pin !== confirmPin) {
      errors.confirmPin = 'PINs do not match.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!validateForm()) {
      playError();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(fullName.trim(), pin);
      setRegisteredChild({ name: result.fullName, childId: result.childId });
      setShowCelebration(true);
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please try again.');
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-teal-900 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* AI Guided Registration Help - Stylish AI Note */}
        <LoginGuidance pageType="register" autoPlay={true} />
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">🎉</div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Create Your Account!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Welcome to Makenna Learning Lab! Let's get started.
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

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name 👋
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setLocalError('');
                  setValidationErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Enter your name"
                className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${
                  validationErrors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                }`}
                autoComplete="name"
                disabled={isSubmitting}
                aria-label="Your name"
                aria-invalid={!!validationErrors.name}
                aria-describedby={validationErrors.name ? 'name-error' : undefined}
              />
              {validationErrors.name && (
                <p id="name-error" className="text-red-500 text-xs mt-1" role="alert">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* PIN input */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Choose a PIN 🔒
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 8) {
                    setPin(val);
                    setLocalError('');
                    setValidationErrors(prev => ({ ...prev, pin: '' }));
                  }
                }}
                placeholder="4 or 8 digit PIN"
                className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${
                  validationErrors.pin ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                }`}
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-label="Choose a PIN"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-invalid={!!validationErrors.pin}
              />
              {validationErrors.pin ? (
                <p className="text-red-500 text-xs mt-1" role="alert">
                  {validationErrors.pin}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  PIN must be 4 or 8 digits (numbers only)
                </p>
              )}
            </div>

            {/* Confirm PIN input */}
            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm PIN ✅
              </label>
              <input
                id="confirmPin"
                type="password"
                value={confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 8) {
                    setConfirmPin(val);
                    setLocalError('');
                    setValidationErrors(prev => ({ ...prev, confirmPin: '' }));
                  }
                }}
                placeholder="Re-enter your PIN"
                className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all ${
                  validationErrors.confirmPin ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                }`}
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-label="Confirm your PIN"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-invalid={!!validationErrors.confirmPin}
              />
              {validationErrors.confirmPin && (
                <p className="text-red-500 text-xs mt-1" role="alert">
                  {validationErrors.confirmPin}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg shadow-green-200 dark:shadow-green-900"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account 🚀'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Already have an account?
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl font-semibold hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors focus:outline-none focus:ring-4 focus:ring-purple-200"
            >
              Log In 🔐
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Celebration popup */}
      <CelebrationPopup
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        childName={registeredChild.name}
        childId={registeredChild.childId}
      />
    </div>
  );
};

export default RegisterPage;