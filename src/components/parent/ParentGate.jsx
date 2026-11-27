import { useEffect, useRef, useState } from 'react';
import { FaLock, FaExclamationTriangle } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { ChildAccountService } from '../../services/ChildAccountService';
import ParentGateService from '../../services/ParentGateService';
import { trapFocus } from '../../utils/accessibility';

const ParentGate = ({ children, title = 'Parent verification' }) => {
  const { activeChild } = useChildAccount();
  const [unlocked, setUnlocked] = useState(() => ParentGateService.isUnlocked());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => ParentGateService.subscribe(() => {
    setUnlocked(ParentGateService.isUnlocked());
  }), []);

  useEffect(() => {
    if (unlocked) return undefined;
    modalRef.current?.querySelector('input')?.focus();

    const handleKeyDown = (event) => trapFocus(modalRef.current, event);
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [unlocked]);

  if (unlocked) return children;

  const child = activeChild || ChildAccountService.getActiveChild();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (!child?.childId) {
        setError('Log in as a child before unlocking parent settings.');
        return;
      }

      const valid = await ParentGateService.verifyChildCredential(child.childId, pin);
      if (!valid) {
        setError(ParentGateService.getLockoutRemaining() > 0
          ? 'Too many attempts. Please wait five minutes.'
          : 'Incorrect PIN or password. Please try again.');
        setPin('');
        return;
      }
      setUnlocked(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      ref={modalRef}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4"
      >
        <FaLock className="text-4xl text-blue-500 mx-auto" />
        <h2 className="font-baloo text-2xl font-bold text-center text-gray-800 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          Enter the child's PIN or password to change these settings.
        </p>
        <input
          type="password"
          maxLength={128}
          value={pin}
          onChange={event => setPin(event.target.value)}
          placeholder="PIN or password"
          aria-label="Child PIN or password"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-center text-xl tracking-widest focus:border-blue-500 focus:outline-none"
        />
        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300" role="alert">
            <FaExclamationTriangle /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pin.trim().length < 4}
          className="w-full py-3 rounded-xl btn-primary font-semibold disabled:opacity-50"
        >
          Unlock settings
        </button>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Parent access stays unlocked for 10 minutes.
        </p>
      </form>
    </div>
  );
};

export default ParentGate;