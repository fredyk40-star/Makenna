import { useState } from 'react';
import { FaKey, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { ChildAccountService } from '../../services/ChildAccountService';

const CredentialChangeSettings = () => {
  const { activeChild } = useChildAccount();
  const child = activeChild || ChildAccountService.getActiveChild();
  const [type, setType] = useState('pin');
  const [currentCredential, setCurrentCredential] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [confirmCredential, setConfirmCredential] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!child?.childId) {
      setError('Log in as a child before changing the credential.');
      return;
    }
    if (newCredential !== confirmCredential) {
      setError('The new credentials do not match.');
      return;
    }
    if (newCredential === currentCredential) {
      setError('Choose a credential that is different from the current one.');
      return;
    }
    if (type === 'pin' && !ChildAccountService.validatePin(newCredential)) {
      setError('PIN must be 4 or 8 digits.');
      return;
    }
    if (type === 'password' && !ChildAccountService.validatePassword(newCredential)) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      await ChildAccountService.changeCredential(
        child.childId,
        currentCredential,
        newCredential,
        type,
      );
      setCurrentCredential('');
      setNewCredential('');
      setConfirmCredential('');
      setMessage('Credential updated. Other devices have been signed out.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!child?.childId) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Log in as a child to manage the credential used for parent settings.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FaKey className="text-2xl text-purple-500" />
        <div>
          <p className="font-semibold text-gray-800 dark:text-white">
            Change child credential
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This is also the credential used to unlock parent settings. There is no separate parent PIN.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
          New credential type
          <select
            value={type}
            onChange={event => {
              setType(event.target.value);
              setNewCredential('');
              setConfirmCredential('');
              setError('');
            }}
            className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
            aria-label="New credential type"
          >
            <option value="pin">PIN (4 or 8 digits)</option>
            <option value="password">Password (8+ characters)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Current PIN or password
          <input
            type="password"
            value={currentCredential}
            onChange={event => setCurrentCredential(event.target.value)}
            maxLength={128}
            autoComplete="current-password"
            className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
            aria-label="Current PIN or password"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
          New {type === 'pin' ? 'PIN' : 'password'}
          <input
            type="password"
            value={newCredential}
            onChange={event => setNewCredential(event.target.value)}
            maxLength={type === 'pin' ? 8 : 128}
            inputMode={type === 'pin' ? 'numeric' : undefined}
            autoComplete="new-password"
            className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
            aria-label={`New ${type}`}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Confirm new {type === 'pin' ? 'PIN' : 'password'}
          <input
            type="password"
            value={confirmCredential}
            onChange={event => setConfirmCredential(event.target.value)}
            maxLength={type === 'pin' ? 8 : 128}
            inputMode={type === 'pin' ? 'numeric' : undefined}
            autoComplete="new-password"
            className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white"
            aria-label={`Confirm new ${type}`}
          />
        </label>

        <button
          type="submit"
          disabled={busy || !currentCredential || !newCredential || !confirmCredential}
          className="sm:col-span-2 w-full py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-50 hover:bg-purple-700"
        >
          {busy ? 'Updating…' : 'Update credential'}
        </button>
      </form>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300" role="alert">
          <FaExclamationTriangle /> {error}
        </p>
      )}
      {message && (
        <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-300" aria-live="polite">
          <FaCheckCircle /> {message}
        </p>
      )}
    </div>
  );
};

export default CredentialChangeSettings;
