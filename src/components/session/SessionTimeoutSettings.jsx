import { useEffect, useState } from 'react';
import { FaClock } from 'react-icons/fa';
import SessionTimeoutService from '../../services/SessionTimeoutService';

const SessionTimeoutSettings = () => {
  const [config, setConfig] = useState(() => SessionTimeoutService.getConfig());

  useEffect(() => {
    SessionTimeoutService.start();
  }, []);

  const update = (updates) => setConfig(SessionTimeoutService.configure(updates));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <FaClock className="text-2xl text-purple-500" />
        <div>
          <h3 className="font-baloo text-xl font-bold text-gray-800 dark:text-white">
            Session timeout
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lock the app after a period of inactivity. Unlocking requires the parent PIN.
          </p>
        </div>
      </div>

      <label className="flex items-center justify-between gap-4">
        <span className="font-semibold text-gray-800 dark:text-white">Enable automatic lock</span>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={event => update({ enabled: event.target.checked })}
          className="w-5 h-5 accent-blue-600"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="block font-semibold text-gray-800 dark:text-white mb-1">
            Lock after (minutes)
          </span>
          <input
            type="number"
            min="1"
            max="180"
            value={config.minutes}
            onChange={event => update({ minutes: Number(event.target.value) })}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </label>
        <label className="text-sm">
          <span className="block font-semibold text-gray-800 dark:text-white mb-1">
            Warn before (seconds)
          </span>
          <input
            type="number"
            min="10"
            max="300"
            value={config.warningSeconds}
            onChange={event => update({ warningSeconds: Number(event.target.value) })}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </label>
      </div>
    </div>
  );
};

export default SessionTimeoutSettings;
