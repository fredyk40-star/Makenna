import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';
import StudyLampBackdrop from '../../components/auth/StudyLampBackdrop';

const DeveloperResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!DeveloperService.validateStrongPassword(newPassword)) {
      setError('Use at least 12 characters with upper case, lower case, a number and a symbol.');
      return;
    }

    setIsSubmitting(true);
    try {
      await DeveloperService.resetPassword(token, newPassword);
      navigate('/developer-login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setError(err.message || 'Could not reset the password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center overflow-y-auto bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-100 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 p-4 relative">
      <StudyLampBackdrop />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md my-auto py-8 relative z-10">
        <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/70 dark:border-amber-200/30 rounded-3xl shadow-2xl shadow-cyan-900/10 dark:shadow-black/30 p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Choose a New Password</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Use a strong password you do not use elsewhere.</p>
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 text-center" role="alert">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-teal-300 shadow-lg shadow-teal-200 dark:shadow-teal-900"
            >
              {isSubmitting ? 'Saving...' : 'Save New Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/developer-login" className="text-sm text-teal-700 dark:text-teal-300 hover:underline">
              ← Back to Developer Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeveloperResetPassword;
