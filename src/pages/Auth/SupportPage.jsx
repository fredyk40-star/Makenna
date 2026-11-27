import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SupportService } from '../../services/SupportService';
import { useVoiceGuide } from '../../context/VoiceGuideContext';

const SupportPage = () => {
  const { playError, playSuccess } = useVoiceGuide();
  const [childId, setChildId] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await SupportService.submitRequest({ childId, parentEmail, message });
      setSubmitted(true);
      playSuccess();
    } catch (err) {
      setError(err.message || 'Your request could not be sent. Please try again.');
      playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-auto py-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img
              src="/brand-logo.png"
              alt="Makenna Lab emblem"
              className="mx-auto h-16 w-auto object-contain mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Forgot your PIN? 🤝
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Ask a parent to enter your Child ID and the email used when the account was created.
            </p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  Request received ✅
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  The developer will review it. If the Child ID and parent email match an account,
                  a one-time password will be sent to that parent email.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl font-semibold"
              >
                Back to Login 🔐
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl p-3" role="alert">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="childId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Child ID
                </label>
                <input
                  id="childId"
                  type="text"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value.toLowerCase())}
                  placeholder="e.g., kid20345635"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                />
              </div>

              <div>
                <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Email
                </label>
                <input
                  id="parentEmail"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  What happened?
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="I forgot my PIN and need help logging in."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Sending request...' : 'Request PIN Help 🚀'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupportPage;
