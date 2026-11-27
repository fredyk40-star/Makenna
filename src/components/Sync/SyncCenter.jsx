import { useState } from 'react';
import { FaCloudUploadAlt, FaDownload, FaUpload, FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import SchoolDataExchangeService from '../../services/SchoolDataExchangeService';

const formatDate = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
};

const SyncCenter = () => {
  const {
    cloudSyncStatus,
    isCloudSyncEnabled,
    toggleCloudSync,
  } = useChildAccount();
  const [message, setMessage] = useState('');
  const [, setBusy] = useState(false);
  const [importMode, setImportMode] = useState('merge');

  const handleExport = () => {
    try {
      const bundle = SchoolDataExchangeService.download();
      setMessage(`Exported ${Object.keys(bundle.data).length} data sets for offline transfer.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await SchoolDataExchangeService.readFile(file);
      const result = SchoolDataExchangeService.importBundle(text, { mode: importMode });
      setMessage(`Imported ${result.imported.length} data sets. Reload to see all changes.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      event.target.value = '';
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FaCloudUploadAlt className="text-2xl text-blue-500" />
        <div>
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Sync &amp; offline data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Changes are saved on this device first, then synced automatically when a connection
            is available. You do not need to press anything.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        {[
          ['Status', cloudSyncStatus.online ? 'Online' : 'Offline'],
          ['Auto sync', isCloudSyncEnabled ? (cloudSyncStatus.syncing ? 'Syncing…' : 'On') : 'Off'],
          ['Waiting', `${cloudSyncStatus.pendingCount || 0} change(s)`],
          ['Needs attention', `${(cloudSyncStatus.failedCount || 0) + (cloudSyncStatus.blockedCount || 0)}`],
          ['Failed', `${cloudSyncStatus.droppedCount || 0}`],
          ['Last sync', formatDate(cloudSyncStatus.lastSync)],
        ].map(([label, value]) => (
          <div key={label} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="font-semibold text-gray-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {cloudSyncStatus.lastError && (
        <p className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
          <FaExclamationTriangle /> {cloudSyncStatus.lastError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {cloudSyncStatus.syncing && (
          <span className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300">
            <FaSyncAlt className="animate-spin" />
            Syncing in the background…
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleCloudSync(!isCloudSyncEnabled)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 font-semibold"
        >
          Turn cloud sync {isCloudSyncEnabled ? 'off' : 'on'}
        </button>
      </div>

      <div className="border-t dark:border-gray-700 pt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold"
          >
            <FaDownload /> Export school bundle
          </button>
          <select
            aria-label="Import mode"
            value={importMode}
            onChange={event => setImportMode(event.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="merge">Merge (keep both, imported values win conflicts)</option>
            <option value="replace">Replace this device</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold cursor-pointer">
            <FaUpload /> Import bundle
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The bundle includes child accounts, progress, rewards, analytics and classroom data.
          Keep it secure — credentials are verified on the server and are not included.
        </p>
      </div>

      <p className="min-h-5 text-sm font-semibold text-blue-600 dark:text-blue-300" aria-live="polite">
        {message}
      </p>
    </div>
  );
};

export default SyncCenter;
