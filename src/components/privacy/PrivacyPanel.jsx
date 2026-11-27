import { useState } from 'react';
import { FaDownload, FaTrash, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import PrivacyService, { PRIVACY_NOTICE } from '../../services/PrivacyService';

const PrivacyPanel = () => {
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(() => PrivacyService.getDeletionPreview());

  const handleExport = () => {
    try {
      PrivacyService.downloadBundle();
      setMessage('Your data bundle has been downloaded. Store it somewhere private.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') {
      setMessage('Type DELETE exactly to confirm.');
      return;
    }
    const result = await PrivacyService.deleteAll();
    setPreview(PrivacyService.getDeletionPreview());
    setConfirmation('');
    const cloudNote = result.cloudFailed > 0
      ? ` ${result.cloudFailed} cloud deletion(s) still need a signed-in device or developer session.`
      : '';
    setMessage(`Erased ${result.keysDeleted} local data item(s) and ${result.children} child profile(s).${cloudNote} Reload the app to finish.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FaShieldAlt className="text-2xl text-green-500" />
        <div>
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Privacy &amp; your data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You stay in control of everything Makenna stores.
          </p>
        </div>
      </div>

      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
        {PRIVACY_NOTICE.map(item => <li key={item}>{item}</li>)}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold"
        >
          <FaDownload /> Download my data
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Currently {preview.keys} stored item(s), {preview.children} child profile(s).
        </span>
      </div>

      <div className="border-t border-red-200 dark:border-red-900 pt-4 space-y-2">
        <p className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-300">
          <FaExclamationTriangle /> Permanently delete all app data
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This removes child profiles, progress, rewards, drawings, classroom data and cloud rows.
          It cannot be undone. Export a bundle first if you may need it later.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            placeholder="Type DELETE"
            aria-label="Type DELETE to confirm"
            className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={confirmation !== 'DELETE'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50"
          >
            <FaTrash /> Delete everything
          </button>
        </div>
      </div>

      <p className="min-h-5 text-sm font-semibold text-blue-600 dark:text-blue-300" aria-live="polite">
        {message}
      </p>
    </div>
  );
};

export default PrivacyPanel;
