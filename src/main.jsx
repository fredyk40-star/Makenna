import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './pwa/register';
import { ChildAccountService } from './services/ChildAccountService';
import { CloudSyncService } from './services/CloudSyncService';

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
  addTestAccount: (name = 'Test Child') => ChildAccountService.createAccount(name, '1234'),

  // Show storage keys
  storageKeys: () => Object.keys(localStorage),
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
