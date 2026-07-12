import { useState, useEffect } from 'react';
import { ChildAccountService } from '../../services/ChildAccountService';
import { CloudSyncService } from '../../services/CloudSyncService';
import { StorageService } from '../../services/StorageService';

export default function DataDebug() {
  const [localStorageData, setLocalStorageData] = useState({});
  const [supabaseData, setSupabaseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // Load localStorage data
  const loadLocalStorageData = () => {
    const data = {
      'makenna_child_accounts_v2': JSON.parse(localStorage.getItem('makenna_child_accounts_v2') || '[]'),
      'makenna_active_child_id': localStorage.getItem('makenna_active_child_id'),
      'makenna_storage_version': localStorage.getItem('makenna_storage_version'),
      'makenna_sync_status_v1': JSON.parse(localStorage.getItem('makenna_sync_status_v1') || '{}'),
    };
    setLocalStorageData(data);
  };

  // Load Supabase data
  const loadSupabaseData = async () => {
    setLoading(true);
    try {
      const result = await CloudSyncService.downloadChildAccounts();
      if (result.success) {
        setSupabaseData(result.accounts);
      }
    } catch (error) {
      console.error('Error loading Supabase data:', error);
    }
    setLoading(false);
  };

  // Initialize on mount
  useEffect(() => {
    loadLocalStorageData();
    loadSupabaseData();
  }, []);

  // Force refresh
  const refreshAll = () => {
    loadLocalStorageData();
    loadSupabaseData();
    setSyncStatus(CloudSyncService.getSyncStatus());
  };

  // Clear all data
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all stored data? This cannot be undone!')) {
      localStorage.clear();
      loadLocalStorageData();
      alert('All localStorage data cleared!');
    }
  };

  // View raw Supabase table
  const viewSupabaseTable = async () => {
    const result = await CloudSyncService.downloadChildAccounts();
    console.log('Supabase child_accounts data:', result.accounts);
    setSupabaseData(result.accounts || []);
    alert('Check console for raw data');
  };

  // Copy data to clipboard
  const copyToClipboard = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('Data copied to clipboard!');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-purple-600">Data Debug Console</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Storage Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Local Storage Data</h2>
          <div className="space-y-3">
            <button 
              onClick={refreshAll}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Refresh Data
            </button>
            <button 
              onClick={clearAllData}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear All Data
            </button>
            
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700">Child Accounts:</h3>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(localStorageData['makenna_child_accounts_v2'], null, 2)}
              </pre>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700">Active Child ID:</h3>
              <code className="bg-gray-100 p-2 rounded block mt-2">
                {localStorageData['makenna_active_child_id'] || 'None'}
              </code>
            </div>
          </div>
        </div>

        {/* Supabase Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-green-600">Supabase Data</h2>
          <div className="space-y-3">
            <button 
              onClick={viewSupabaseTable}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'View Supabase Table'}
            </button>
            <button 
              onClick={() => copyToClipboard(supabaseData)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2"
            >
              Copy to Clipboard
            </button>
            
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700">Cloud Child Accounts:</h3>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(supabaseData, null, 2)}
              </pre>
            </div>
            
            {syncStatus && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700">Sync Status:</h3>
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
                  {JSON.stringify(syncStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Console Commands Section */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3 text-yellow-800">Console Commands</h2>
        <p className="text-sm text-gray-600 mb-2">Open browser console (F12) and run:</p>
        <div className="font-mono text-xs bg-white p-3 rounded">
          <p className="mb-1">// View child accounts</p>
          <code className="block text-purple-600">JSON.parse(localStorage.getItem('makenna_child_accounts_v2'))</code>
          <p className="mt-2 mb-1">// View active child</p>
          <code className="block text-purple-600">localStorage.getItem('makenna_active_child_id')</code>
          <p className="mt-2 mb-1">// View all localStorage keys</p>
          <code className="block text-purple-600">Object.keys(localStorage)</code>
        </div>
      </div>
    </div>
  );
}