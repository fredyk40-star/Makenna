import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SupportService } from '../../services/SupportService';
import { useVoiceGuide } from '../../context/VoiceGuideContext';
import StudyLampBackdrop from '../../components/auth/StudyLampBackdrop';

const SupportPage = () => {
  const { playError, playSuccess } = useVoiceGuide();
  const [childId, setChildId] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');

  const handleSendCode = async () => {
    setError('');
    setCodeMessage('');
    try {
      const result = await SupportService.requestVerification({ childId, parentEmail });
      setCodeSent(true);
      // Local development has no SMTP server; the API returns the code there.
      setCodeMessage(
        result.devCode
          ? `Development code: ${result.devCode}`
          : 'If those details match an account, a 6-digit code has been sent to the parent email.',
      );
      playSuccess();
    } catch (err) {
      setError(err.message || 'The code could not be sent. Please try again.');
      playError();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await SupportService.submitRequest({ childId, parentEmail, message, verificationCode });
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Forgot your PIN? 🤝
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Ask a parent to enter your Child ID and the email used when the account was created, then verify the code sent to that email.
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
                className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-teal-200 dark:shadow-teal-900"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                  required
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="w-full py-2 rounded-xl border-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  {codeSent ? 'Send a new code' : 'Email me a verification code'}
                </button>
                {codeMessage && (
                  <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-300" role="status">
                    {codeMessage}
                  </p>
                )}
              </div>

              {codeSent && (
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Verification code
                  </label>
                  <input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all focus:shadow-[0_0_20px_rgba(20,184,166,0.25)] tracking-widest"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !codeSent}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-teal-300 shadow-lg shadow-teal-200 dark:shadow-teal-900"
              >
                {isSubmitting ? 'Sending request...' : 'Request PIN Help 🚀'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-teal-700 dark:text-teal-300 hover:underline"
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
