import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';
import { useVoiceGuide } from '../../context/VoiceGuideContext';

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
    <div className="min-h-screen flex flex-col items-center overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-auto py-8"
      >
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8 border border-purple-500/20">
          <div className="text-center mb-8">
            <img
              src="/brand-logo.png"
              alt="Makenna Lab emblem"
              className="mx-auto h-16 w-auto object-contain mb-4"
            />
            <h1 className="text-3xl font-bold text-white">Developer Portal</h1>
            <p className="text-gray-400 mt-2">
              Restricted sign-in for {DeveloperService.getDeveloperEmail()}
            </p>
          </div>

          {location.state?.passwordReset && (
            <div className="bg-green-900/50 border border-green-800 rounded-xl p-3 mb-6">
              <p className="text-green-300 text-sm text-center">Password updated. Please sign in.</p>
            </div>
          )}

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="developerEmail" className="block text-sm font-medium text-gray-300 mb-1">
                Developer Email
              </label>
              <input
                id="developerEmail"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="developerPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="developerPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your strong password"
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link
                  to="/developer-forgot-password"
                  className="text-xs text-purple-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Access Portal 🚀'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-gray-900/50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              🔒 Password reset links are only sent to the configured developer email.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeveloperLogin;
