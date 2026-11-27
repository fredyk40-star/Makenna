import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DeveloperService } from '../../services/DeveloperService';

const DeveloperForgotPassword = () => {
  const [email, setEmail] = useState(DeveloperService.getDeveloperEmail());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await DeveloperService.requestPasswordReset(email);
      setMessage('If that email is registered, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Could not request a reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8 border border-purple-500/20">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4" aria-hidden="true">📧</div>
            <h1 className="text-2xl font-bold text-white">Reset Developer Password</h1>
            <p className="text-gray-400 mt-2">
              Reset links are only sent to {DeveloperService.getDeveloperEmail()}.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm mb-4 text-center" role="alert">{error}</p>}
          {message && <p className="text-green-400 text-sm mb-4 text-center" role="status">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Developer Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:border-purple-500 outline-none"
                autoComplete="email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Email Reset Link'}
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

export default DeveloperForgotPassword;
