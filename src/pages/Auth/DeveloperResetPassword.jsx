import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8 border border-purple-500/20">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">🔐</div>
            <h1 className="text-2xl font-bold text-white">Choose a New Password</h1>
            <p className="text-gray-400 mt-2">Use a strong password you do not use elsewhere.</p>
          </div>

          {error && <p className="text-red-400 text-sm mb-4 text-center" role="alert">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:border-purple-500 outline-none"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:border-purple-500 outline-none"
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save New Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/developer-login" className="text-sm text-purple-300 hover:underline">
              ← Back to Developer Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeveloperResetPassword;
