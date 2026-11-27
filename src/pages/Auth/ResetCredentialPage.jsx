import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChildAccount } from '../../context/ChildAccountContext';
import { ChildAccountService } from '../../services/ChildAccountService';
import { useVoiceGuide } from '../../context/VoiceGuideContext';

const ResetCredentialPage = () => {
  const navigate = useNavigate();
  const { activeChild, resetCredential, error, clearError } = useChildAccount();
  const { playError, playSuccess } = useVoiceGuide();
  const [type, setType] = useState('pin');
  const [credential, setCredential] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresReset = activeChild?.requiresCredentialReset;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    clearError();

    if (credential !== confirm) {
      setLocalError('The two entries do not match.');
      playError();
      return;
    }

    const valid = type === 'pin'
      ? ChildAccountService.validatePin(credential)
      : ChildAccountService.validatePassword(credential);
    if (!valid) {
      setLocalError(type === 'pin'
        ? 'PIN must be 4 or 8 digits.'
        : 'Password must be at least 8 characters.');
      playError();
      return;
    }

    setIsSubmitting(true);
    try {
      await resetCredential(credential, type);
      playSuccess();
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Could not set your new credential.');
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!requiresReset) {
    return (
      <div className="min-h-screen flex flex-col items-center overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-md text-center my-auto py-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            No reset is pending
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Log in first with the one-time password from your parent.
          </p>
          <Link to="/login" className="px-6 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl font-semibold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md my-auto py-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4" aria-hidden="true">🔑</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Set your new login
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Welcome, {activeChild?.fullName || 'friend'}! Choose a new PIN or password before continuing.
            </p>
          </div>

          {(localError || error) && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-5" role="alert">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{localError || error}</p>
            </div>
          )}

          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => { setType('pin'); setCredential(''); setConfirm(''); }}
              className={`flex-1 py-2 rounded-xl font-semibold ${type === 'pin' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              New PIN
            </button>
            <button
              type="button"
              onClick={() => { setType('password'); setCredential(''); setConfirm(''); }}
              className={`flex-1 py-2 rounded-xl font-semibold ${type === 'password' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              Choose Password
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newCredential" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {type === 'pin' ? 'New PIN' : 'New Password'}
              </label>
              <input
                id="newCredential"
                type="password"
                value={credential}
                onChange={(e) => {
                  const value = type === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 8) : e.target.value;
                  setCredential(value);
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 outline-none"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmCredential" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm {type === 'pin' ? 'PIN' : 'Password'}
              </label>
              <input
                id="confirmCredential"
                type="password"
                value={confirm}
                onChange={(e) => {
                  const value = type === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 8) : e.target.value;
                  setConfirm(value);
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 outline-none"
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save and Continue 🚀'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetCredentialPage;
