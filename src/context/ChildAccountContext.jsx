import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChildAccountService } from '../services/ChildAccountService';
import { StorageService } from '../services/StorageService';
import { AnalyticsService } from '../services/AnalyticsService';
import { GamificationService } from '../services/GamificationService';
import { CloudSyncService } from '../services/CloudSyncService';
import { NotificationBellService } from '../services/NotificationBellService';

const ChildAccountContext = createContext();

export const useChildAccount = () => {
  const context = useContext(ChildAccountContext);
  if (!context) {
    throw new Error('useChildAccount must be used within ChildAccountProvider');
  }
  return context;
};

export const ChildAccountProvider = ({ children }) => {
  const [activeChild, setActiveChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState(() => CloudSyncService.getSyncStatus());

  useEffect(() => {
    setCloudSyncStatus(CloudSyncService.init().status);
    return CloudSyncService.subscribe(status => setCloudSyncStatus({ ...status }));
  }, []);

  useEffect(() => {
    const init = async () => {
      // Initialize services with error handling
      try {
        ChildAccountService.initialize();
      } catch (err) {
        console.error('ChildAccountService initialization error:', err);
      }

      try {
        AnalyticsService.initialize();
      } catch (err) {
        console.error('AnalyticsService initialization error:', err);
      }

      // Replay queued writes and merge cloud changes when the app starts.
      if (CloudSyncService.isEnabled()) {
        try {
          const result = await CloudSyncService.syncNow();
          if (!result.success) console.warn('Cloud sync pending:', result.error);
        } catch (syncErr) {
          console.warn('Cloud sync skipped (offline or unavailable):', syncErr.message);
        }
      }

      // Check for existing session
      try {
        const child = ChildAccountService.getActiveChild();
        if (child) {
          setActiveChild(child);
          StorageService.set('makenna_current_user_id', child.childId);
        }
      } catch (err) {
        console.error('getActiveChild error:', err);
      }

      setLoading(false);
    };

    init();
  }, []);

  const register = useCallback(async (fullName, pin, parentEmail) => {
    setError(null);
    try {
      const result = await ChildAccountService.registerChild(fullName, pin, parentEmail);
      // Registration already saved the account and device token. Auto-login is
      // a convenience; a transient failure here must not make the user retry a
      // name that is already registered.
      try {
        await ChildAccountService.loginChild(result.childId, pin);
      } catch (loginErr) {
        console.warn('Auto-login pending after registration:', loginErr.message);
        ChildAccountService.setActiveChild(result.childId);
      }
      const child = ChildAccountService.getActiveChild();
      setActiveChild(child);
      if (child?.childId) {
        StorageService.set('makenna_current_user_id', child.childId);
        NotificationBellService.addNotification(child.childId, {
          title: 'Welcome!',
          message: `Hello ${child.fullName || 'friend'}! Ready to learn today?`,
          icon: '👋',
        });
        window.dispatchEvent(new Event('storage'));
      }
      AnalyticsService.trackLogin();
      
      // The account is queued by ChildAccountService; flush it when possible.
      if (CloudSyncService.isEnabled()) {
        try {
          await CloudSyncService.syncNow();
        } catch (syncErr) {
          console.warn('Supabase sync pending (account saved locally):', syncErr.message);
        }
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const login = useCallback(async (childId, credential) => {
    setError(null);
    try {
      const result = await ChildAccountService.loginChild(childId, credential);
      const child = ChildAccountService.getActiveChild();
      setActiveChild(child);
      if (child?.childId) {
        StorageService.set('makenna_current_user_id', child.childId);
        NotificationBellService.addNotification(child.childId, {
          title: 'Welcome!',
          message: `Hello ${child.fullName || 'friend'}! Ready to learn today?`,
          icon: '👋',
        });
        window.dispatchEvent(new Event('storage'));
      }
      AnalyticsService.trackLogin();
      // Check daily reset for gamification
      GamificationService.checkDailyReset(childId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    const childId = activeChild?.childId;
    if (childId) {
      AnalyticsService.trackLogout();
    }
    ChildAccountService.logoutChild();
    setActiveChild(null);
    setError(null);
  }, [activeChild]);

  const updateChild = useCallback((updates) => {
    if (activeChild) {
      const updated = ChildAccountService.updateChild(activeChild.childId, updates);
      if (updated) {
        setActiveChild(updated);
      }
    }
  }, [activeChild]);

  const clearError = useCallback(() => setError(null), []);

  /** Required after a one-time temporary-password login. */
  const resetCredential = useCallback(async (newCredential, type = 'pin') => {
    setError(null);
    try {
      const childId = activeChild?.childId || ChildAccountService.getActiveChildId();
      if (!childId) throw new Error('Please log in again before resetting your credential.');
      const result = await ChildAccountService.resetCredential(childId, newCredential, type);
      const child = ChildAccountService.getActiveChild();
      setActiveChild(child);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [activeChild]);

  // Cloud sync functions
  const refreshAfterSync = useCallback((result) => {
    if (result.success && activeChild) {
      setActiveChild(ChildAccountService.getActiveChild());
    }
    return result;
  }, [activeChild]);

  const syncToCloud = useCallback(async () => (
    refreshAfterSync(await CloudSyncService.syncToCloud())
  ), [refreshAfterSync]);

  const syncFromCloud = useCallback(async () => (
    refreshAfterSync(await CloudSyncService.syncFromCloud())
  ), [refreshAfterSync]);

  const fullSync = useCallback(async () => (
    refreshAfterSync(await CloudSyncService.syncNow())
  ), [refreshAfterSync]);

  const syncNow = useCallback(async () => (
    refreshAfterSync(await CloudSyncService.syncNow())
  ), [refreshAfterSync]);

  const toggleCloudSync = useCallback((enabled) => {
    const init = CloudSyncService.setEnabled(enabled);
    setCloudSyncStatus({ ...init.status });
    return init;
  }, []);

  const value = {
    activeChild,
    loading,
    error,
    register,
    login,
    logout,
    updateChild,
    resetCredential,
    clearError,
    isAuthenticated: !!activeChild,
    childName: activeChild?.fullName || '',
    childId: activeChild?.childId || '',
    // Cloud sync methods
    syncToCloud,
    syncFromCloud,
    fullSync,
    syncNow,
    toggleCloudSync,
    isCloudSyncEnabled: cloudSyncStatus.enabled,
    cloudSyncStatus,
  };

  return (
    <ChildAccountContext.Provider value={value}>
      {children}
    </ChildAccountContext.Provider>
  );
};

export default ChildAccountContext;