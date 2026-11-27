import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './pwa/register';
import { ChildAccountService } from './services/ChildAccountService';
import { CloudSyncService } from './services/CloudSyncService';
import { migrateStorage } from './services/StorageMigrationService';
import errorReporter from './services/ErrorReportingService';

// Bring saved data up to the current schema before any component reads it.
migrateStorage();
errorReporter.installGlobalHandlers();
// Cloud writes flush themselves; this also handles reconnect/focus/polling.
CloudSyncService.startAutoSync();
window.addEventListener('online', () => errorReporter.flush());

// Register service worker with update handling
registerServiceWorker();

// Add debug utilities to window for console access
window.MakennaDebug = {
  // Show all localStorage data
  getAllData: () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        data[key] = localStorage.getItem(key);
      }
    }
    console.table('localStorage Data:', data);
    return data;
  },

  // Get child accounts
  getChildAccounts: () => ChildAccountService.getAllAccounts(),

  // Clear all data
  clearAll: () => {
    localStorage.clear();
    console.log('All localStorage data cleared');
    window.location.reload();
  },

  // Sync data
  syncToCloud: () => CloudSyncService.syncToCloud(),
  syncFromCloud: () => CloudSyncService.syncFromCloud(),

  // Add test account
  addTestAccount: (name = 'Test Child', parentEmail = 'parent@example.com') =>
    ChildAccountService.registerChild(name, '1234', parentEmail),

  // Show storage keys
  storageKeys: () => Object.keys(localStorage),
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
