import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';
import { useVoiceGuide } from '../../context/VoiceGuideContext';

const DeveloperLogin = () => {
  const navigate = useNavigate();
  const { playError, playSuccess } = useVoiceGuide();
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if PIN needs to be set first
    if (!DeveloperService.isDeveloperPinSet()) {
      setIsSettingPin(true);
      return;
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin) && !/^\d{8}$/.test(pin)) {
      setError('PIN must be 4 or 8 digits');
      playError();
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await DeveloperService.verifyDeveloperPin(pin);
      if (isValid) {
        playSuccess();
        localStorage.setItem('makenna_developer_authenticated', 'true');
        navigate('/developer', { replace: true });
      } else {
        setError('Invalid PIN. Please try again.');
        playError();
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    
    if (!/^\d{4}$/.test(pin) && !/^\d{8}$/.test(pin)) {
      setError('PIN must be 4 or 8 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await DeveloperService.setDeveloperPin(pin);
      playSuccess();
      localStorage.setItem('makenna_developer_authenticated', 'true');
      navigate('/developer', { replace: true });
    } catch (err) {
      setError(err.message);
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8 border border-purple-500/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">🔧</div>
            <h1 className="text-3xl font-bold text-white">
              {isSettingPin ? 'Set Developer PIN' : 'Developer Portal'}
            </h1>
            <p className="text-gray-400 mt-2">
              {isSettingPin 
                ? 'Create a secure PIN for developer access'
                : 'Enter your developer PIN to continue'
              }
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-900/50 border border-red-800 rounded-xl p-3 mb-6"
              role="alert"
            >
              <p className="text-red-400 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* PIN input */}
          <form onSubmit={isSettingPin ? handleSetPin : handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-1">
                {isSettingPin ? 'New PIN' : 'Developer PIN'}
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 8) setPin(val);
                    setError('');
                  }}
                  placeholder={isSettingPin ? 'Set your 4 or 8 digit PIN' : 'Enter your 4 or 8 digit PIN'}
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  autoComplete={isSettingPin ? 'new-password' : 'current-password'}
                  disabled={isSubmitting}
                  aria-label="PIN"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {isSettingPin && (
              <div>
                <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm PIN
                </label>
                <input
                  id="confirmPin"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 8) setConfirmPin(val);
                    setError('');
                  }}
                  placeholder="Re-enter your PIN"
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-label="Confirm PIN"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isSettingPin ? 'Setting PIN...' : 'Logging in...'}
                </span>
              ) : (
                isSettingPin ? 'Set PIN 🔐' : 'Access Portal 🚀'
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 p-3 bg-gray-900/50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              🔒 This portal is not linked from anywhere in the app.
              <br />
              Only someone with knowledge of this URL can access it.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeveloperLogin;