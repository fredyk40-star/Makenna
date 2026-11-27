import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChildAccount } from '../../context/ChildAccountContext';
import { useVoiceGuide } from '../../context/VoiceGuideContext';
import CelebrationPopup from '../../components/common/CelebrationPopup';
import LoginGuidance from '../../components/LoginGuidance/LoginGuidance';
import { ChildAccountService } from '../../services/ChildAccountService';
import StudyLampBackdrop from '../../components/auth/StudyLampBackdrop';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useChildAccount();
  const { playError } = useVoiceGuide();

  const [fullName, setFullName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [registeredChild, setRegisteredChild] = useState({ name: '', childId: '', parentEmail: '' });
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);

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

    if (!parentEmail.trim()) {
      errors.parentEmail = 'A parent email is required for account recovery.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(parentEmail.trim())) {
      errors.parentEmail = 'Please enter a valid parent email address.';
    }

    if (!pin) {
      errors.pin = usePassword ? 'Please enter a password.' : 'Please enter a PIN.';
    } else if (usePassword && !ChildAccountService.validatePassword(pin)) {
      errors.pin = 'Password must be at least 8 characters.';
    } else if (!usePassword && !ChildAccountService.validatePin(pin)) {
      errors.pin = 'PIN must be 4 or 8 digits.';
    }

    if (pin !== confirmPin) {
      errors.confirmPin = usePassword ? 'Passwords do not match.' : 'PINs do not match.';
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
      const result = await register(fullName.trim(), pin, parentEmail.trim());
      setRegisteredChild({ name: result.fullName, childId: result.childId, parentEmail: result.parentEmail });
      setWelcomeEmailSent(!!result.welcomeEmailSent);
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
    <div className="min-h-screen flex flex-col items-center overflow-y-auto bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-100 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 p-4 relative">
      <StudyLampBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-auto py-8 relative z-10"
      >
        {/* AI Guided Registration Help - Stylish AI Note */}
        <LoginGuidance pageType="register" autoPlay={false} />
        
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/70 dark:border-white/10 dark:border-amber-200/30 rounded-3xl shadow-2xl shadow-cyan-900/10 dark:shadow-black/30 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src="/brand-logo.png"
              alt="Makenna Lab emblem"
              className="mx-auto h-16 w-auto object-contain mb-4"
            />
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
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
            initial="hidden"
            animate="show"
          >
            {/* Name input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)] ${
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
            </motion.div>

            {/* Parent email - required for recovery */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.06 }}
            >
              <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Email 📧
              </label>
              <input
                id="parentEmail"
                type="email"
                value={parentEmail}
                onChange={(e) => {
                  setParentEmail(e.target.value);
                  setLocalError('');
                  setValidationErrors(prev => ({ ...prev, parentEmail: '' }));
                }}
                placeholder="parent@example.com"
                className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)] ${
                  validationErrors.parentEmail ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                }`}
                autoComplete="email"
                disabled={isSubmitting}
                aria-label="Parent email"
                aria-invalid={!!validationErrors.parentEmail}
                required
              />
              {validationErrors.parentEmail ? (
                <p className="text-red-500 text-xs mt-1" role="alert">
                  {validationErrors.parentEmail}
                </p>
              ) : (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Required: without a parent email, this account cannot be recovered and will be lost forever.
                </p>
              )}
            </motion.div>

            {/* PIN input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {usePassword ? 'Choose a Password 🔒' : 'Choose a PIN 🔒'}
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => {
                  const raw = e.target.value;
                  const val = usePassword ? raw : raw.replace(/\D/g, '');
                  if (val.length <= (usePassword ? 128 : 8)) {
                    setPin(val);
                    setLocalError('');
                    setValidationErrors(prev => ({ ...prev, pin: '' }));
                  }
                }}
                placeholder={usePassword ? 'At least 8 characters' : '4 or 8 digit PIN'}
                className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)] ${
                  validationErrors.pin ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                }`}
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-label={usePassword ? 'Choose a password' : 'Choose a PIN'}
                inputMode={usePassword ? undefined : 'numeric'}
                pattern={usePassword ? undefined : '[0-9]*'}
                aria-invalid={!!validationErrors.pin}
              />
              {validationErrors.pin ? (
                <p className="text-red-500 text-xs mt-1" role="alert">
                  {validationErrors.pin}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  {usePassword ? 'Password must be at least 8 characters' : 'PIN must be 4 or 8 digits (numbers only)'}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setUsePassword(value => !value);
                  setPin('');
                  setConfirmPin('');
                  setValidationErrors(prev => ({ ...prev, pin: '', confirmPin: '' }));
                }}
                className="mt-2 text-xs font-medium text-teal-700 dark:text-teal-300 hover:underline"
              >
                {usePassword ? 'Use a PIN instead' : 'Use a password instead'}
              </button>
            </motion.div>

            {/* Confirm PIN input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.18 }}
            >
              <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {usePassword ? 'Confirm Password ✅' : 'Confirm PIN ✅'}
              </label>
              <input
                id="confirmPin"
                type="password"
                value={confirmPin}
                onChange={(e) => {
                  const raw = e.target.value;
                  const val = usePassword ? raw : raw.replace(/\D/g, '');
                  if (val.length <= (usePassword ? 128 : 8)) {
                    setConfirmPin(val);
                    setLocalError('');
                    setValidationErrors(prev => ({ ...prev, confirmPin: '' }));
                  }
                }}
                placeholder={usePassword ? 'Re-enter your password' : 'Re-enter your PIN'}
                className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)] ${
                  validationErrors.confirmPin ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                }`}
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-label={usePassword ? 'Confirm your password' : 'Confirm your PIN'}
                inputMode="numeric"
                pattern="[0-9]*"
                aria-invalid={!!validationErrors.confirmPin}
              />
              {validationErrors.confirmPin && (
                <p className="text-red-500 text-xs mt-1" role="alert">
                  {validationErrors.confirmPin}
                </p>
              )}
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
                  Creating Account...
                </span>
              ) : (
                'Create Account 🚀'
              )}
            </motion.button>
          </motion.form>

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
              className="inline-block px-6 py-2 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-xl font-semibold hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors focus:outline-none focus:ring-4 focus:ring-teal-200"
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
        parentEmail={registeredChild.parentEmail}
        welcomeEmailSent={welcomeEmailSent}
        requireAcknowledgement
      />
    </div>
  );
};

export default RegisterPage;