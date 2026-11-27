import { useState, useEffect } from 'react';
import { ChildAccountService } from '../../services/ChildAccountService';
import { CloudSyncService } from '../../services/CloudSyncService';
import { DeveloperService } from '../../services/DeveloperService';

export default function TestSupabase() {
  const [cloudData, setCloudData] = useState([]);
  const [localData, setLocalData] = useState([]);
  const [syncResult, setSyncResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Test connection and load data
  const testConnection = async () => {
    setLoading(true);
    try {
      // All cloud access is server-side; the browser never uses an anon key.
      const result = await DeveloperService.syncChildrenFromCloud();
      setConnectionStatus({
        success: result.success,
        message: result.success
          ? `Connected successfully! Found ${result.count} records.`
          : `Connection error: ${result.error}`,
      });
      if (result.success) {
        setCloudData(ChildAccountService.getAllAccounts());
        setLocalData(ChildAccountService.getAllAccounts());
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `Error: ${error.message}`
      });
    }
    setLoading(false);
  };

  // Sync local to cloud
  const syncToCloud = async () => {
    setLoading(true);
    try {
      const result = await CloudSyncService.syncToCloud();
      setSyncResult({ success: true, ...result });
      await testConnection(); // Refresh cloud data
    } catch (error) {
      setSyncResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  // Sync cloud to local
  const syncFromCloud = async () => {
    setLoading(true);
    try {
      const result = await CloudSyncService.syncFromCloud();
      setSyncResult({ success: true, ...result });
      setLocalData(ChildAccountService.getAllAccounts());
    } catch (error) {
      setSyncResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  // Insert test record
  const insertTestRecord = async () => {
    setLoading(true);
    try {
      const parentEmail = 'parent@example.com';
      const result = await ChildAccountService.registerChild(
        `Test Child ${Date.now()}`, '1234', parentEmail,
      );
      setSyncResult({ success: true, message: 'Test account registered!', data: result });
      await testConnection();
    } catch (error) {
      setSyncResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  // Clear console and refresh
  const refreshAll = () => {
    testConnection();
    setLocalData(ChildAccountService.getAllAccounts());
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-purple-600">Supabase Test Mode</h1>

      {/* Connection Status */}
      {connectionStatus && (
        <div className={`p-4 rounded-lg mb-6 ${
          connectionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <strong>{connectionStatus.success ? '✅' : '❌'}</strong> {connectionStatus.message}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Connection
        </button>
        <button
          onClick={syncToCloud}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Sync Local → Cloud
        </button>
        <button
          onClick={syncFromCloud}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          Sync Cloud → Local
        </button>
        <button
          onClick={insertTestRecord}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Insert Test Record
        </button>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Refresh All
        </button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className={`p-3 rounded mb-4 ${
          syncResult.success ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <pre className="text-xs">{JSON.stringify(syncResult, null, 2)}</pre>
        </div>
      )}

      {/* Data Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cloud Data */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-3 text-green-600">Cloud Data (Supabase)</h2>
          <p className="text-sm text-gray-500 mb-2">Table: child_accounts</p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
            {cloudData.length > 0
              ? JSON.stringify(cloudData, null, 2)
              : 'No data found in cloud database'}
          </pre>
          <p className="text-xs text-gray-400 mt-2">Total records: {cloudData.length}</p>
        </div>

        {/* Local Data */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-3 text-blue-600">Local Data (Browser)</h2>
          <p className="text-sm text-gray-500 mb-2">Storage key: makenna_child_accounts_v2</p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
            {localData.length > 0
              ? JSON.stringify(localData, null, 2)
              : 'No child accounts registered yet'}
          </pre>
          <p className="text-xs text-gray-400 mt-2">Total accounts: {localData.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3 text-yellow-800">Quick Debug Actions</h2>
        <div className="font-mono text-xs bg-white p-3 rounded space-y-2">
          <p className="text-gray-600 mb-2">Run in browser console (F12):</p>
          <code className="block text-purple-600">
            {'// Show window utilities'}<br/>
            window.MakennaDebug.getAllData()
          </code>
          <code className="block text-purple-600">
            {'// Clear all storage'}<br/>
            localStorage.clear()
          </code>
          <code className="block text-purple-600">
            {'// Show all localStorage keys'}<br/>
            Object.keys(localStorage)
          </code>
        </div>
      </div>
    </div>
  );
}