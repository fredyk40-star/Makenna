import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChildAccount } from '../../context/ChildAccountContext';
import { useVoiceGuide } from '../../context/VoiceGuideContext';
import LoginGuidance from '../../components/LoginGuidance/LoginGuidance';
import StudyLampBackdrop from '../../components/auth/StudyLampBackdrop';

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
      setLocalError('Please enter your PIN or password.');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      playError();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(childId.trim(), pin.trim());
      playSuccess();
      if (result?.requiresCredentialReset) {
        navigate('/reset-credential', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
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
    <div className="min-h-screen flex flex-col items-center overflow-y-auto bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-100 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 p-4 relative">
      <StudyLampBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-auto py-8 relative z-10"
      >
        {/* AI Guided Login Help - Stylish AI Note */}
        <LoginGuidance pageType="login" autoPlay={false} />
        
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/70 dark:border-white/10 dark:border-amber-200/30 rounded-3xl shadow-2xl shadow-cyan-900/10 dark:shadow-black/30 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src="/brand-logo.png"
              alt="Makenna Lab emblem"
              className="mx-auto h-16 w-auto object-contain mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Welcome Back!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Enter your Child ID and PIN or password to continue
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
            animate={shakeForm ? { x: [-10, 10, -10, 10, 0] } : 'show'}
            transition={{ duration: 0.4 }}
            className="space-y-5"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
            initial="hidden"
          >
            {/* Child ID input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="childId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Child ID
              </label>
              <input
                id="childId"
                type="text"
                value={childId}
                onChange={(e) => {
                  setChildId(e.target.value.toLowerCase());
                  setLocalError('');
                }}
                placeholder="e.g., kid20345635"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                autoComplete="username"
                autoCapitalize="none"
                disabled={isSubmitting}
                aria-label="Child ID"
              />
            </motion.div>

            {/* PIN input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.06 }}
            >
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PIN or Password
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 128);
                    setPin(val);
                    setLocalError('');
                  }}
                  placeholder="Enter your PIN or password"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-label="PIN or password"
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
                4 or 8 digit PIN, or the password you chose after recovery
              </p>
              <div className="mt-2 text-right">
                <Link
                  to="/support"
                  className="text-xs text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Need help / Forgot PIN?
                </Link>
              </div>
            </motion.div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-teal-300 shadow-lg shadow-teal-200 dark:shadow-teal-900"
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
            </motion.button>
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
              className="inline-block px-6 py-2 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-xl font-semibold hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors focus:outline-none focus:ring-4 focus:ring-teal-200"
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