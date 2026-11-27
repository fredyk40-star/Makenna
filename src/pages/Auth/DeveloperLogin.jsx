import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';
import { useVoiceGuide } from '../../context/VoiceGuideContext';
import StudyLampBackdrop from '../../components/auth/StudyLampBackdrop';

const DeveloperLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playError, playSuccess } = useVoiceGuide();
  const [email, setEmail] = useState(DeveloperService.getDeveloperEmail());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (DeveloperService.isLockedOut()) {
      const minutes = Math.ceil(DeveloperService.getLockoutRemainingSeconds() / 60);
      setError(`Too many failed attempts. Please wait ${minutes} minute(s).`);
      playError();
      return;
    }

    setIsSubmitting(true);
    try {
      await DeveloperService.loginWithPassword(email, password);
      playSuccess();
      navigate('/developer', { replace: true });
    } catch (err) {
      DeveloperService.recordFailedAttempt();
      setError(err.message || 'Invalid developer email or password.');
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
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/70 dark:border-amber-200/30 rounded-3xl shadow-2xl shadow-cyan-900/10 dark:shadow-black/30 p-8">
          <div className="text-center mb-8">
            <img
              src="/brand-logo.png"
              alt="Makenna Lab emblem"
              className="mx-auto h-16 w-auto object-contain mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Developer Portal</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Restricted sign-in for {DeveloperService.getDeveloperEmail()}
            </p>
          </div>

          {location.state?.passwordReset && (
            <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-6">
              <p className="text-green-700 dark:text-green-300 text-sm text-center">Password updated. Please sign in.</p>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-6"
              role="alert"
            >
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="developerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Developer Email
              </label>
              <input
                id="developerEmail"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="developerPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="developerPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your strong password"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link
                  to="/developer-forgot-password"
                  className="text-xs text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-teal-300 shadow-lg shadow-teal-200 dark:shadow-teal-900"
            >
              {isSubmitting ? 'Signing in...' : 'Access Portal 🚀'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              🔒 Password reset links are only sent to the configured developer email.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeveloperLogin;
