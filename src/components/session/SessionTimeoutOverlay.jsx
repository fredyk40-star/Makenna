import { useEffect, useState } from 'react';
import { FaClock, FaLock } from 'react-icons/fa';
import SessionTimeoutService from '../../services/SessionTimeoutService';
import ParentGateService from '../../services/ParentGateService';

const SessionTimeoutOverlay = () => {
  const [state, setState] = useState(() => SessionTimeoutService.getState());
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    SessionTimeoutService.start();
    return SessionTimeoutService.subscribe(setState);
  }, []);

  if (!state.enabled || state.phase === 'active') return null;

  if (state.phase === 'warning') {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 text-center shadow-xl">
          <FaClock className="text-4xl text-orange-500 mx-auto mb-3" />
          <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">Still there?</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            The app will lock in {state.remainingSeconds} second(s).
          </p>
          <button
            type="button"
            onClick={() => SessionTimeoutService.recordActivity()}
            className="mt-5 w-full py-3 rounded-xl btn-primary font-semibold"
          >
            Keep learning
          </button>
        </div>
      </div>
    );
  }

  const handleUnlock = async (event) => {
    event.preventDefault();
    setError('');
    const valid = await ParentGateService.verifyPin(pin);
    if (valid) {
      SessionTimeoutService.unlock();
      setPin('');
    } else {
      setError('Incorrect PIN. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/90 p-4">
      <form
        onSubmit={handleUnlock}
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 text-center shadow-xl space-y-4"
      >
        <FaLock className="text-4xl text-blue-500 mx-auto" />
        <h2 className="font-baloo text-2xl font-bold text-gray-800 dark:text-white">Session locked</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enter the parent PIN to continue.
        </p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={event => setPin(event.target.value.replace(/\D/g, ''))}
          aria-label="Parent PIN"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-center text-xl tracking-widest"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-300" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={pin.length < 4}
          className="w-full py-3 rounded-xl btn-primary font-semibold disabled:opacity-50"
        >
          Unlock
        </button>
      </form>
    </div>
  );
};

export default SessionTimeoutOverlay;
