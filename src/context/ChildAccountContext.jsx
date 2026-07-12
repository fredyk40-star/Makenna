import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChildAccountService } from '../services/ChildAccountService';
import { AnalyticsService } from '../services/AnalyticsService';
import { GamificationService } from '../services/GamificationService';
import { CloudSyncService } from '../services/CloudSyncService';
import { isSupabaseConfigured } from '../services/SupabaseService';

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

      // Auto-sync from Supabase cloud on app load (cross-device accounts)
      if (isSupabaseConfigured()) {
        try {
          await CloudSyncService.syncFromCloud();
          console.log('Cloud sync completed on app init');
        } catch (syncErr) {
          console.warn('Cloud sync skipped (offline or unavailable):', syncErr.message);
        }
      }

      // Check for existing session
      try {
        const child = ChildAccountService.getActiveChild();
        if (child) {
          setActiveChild(child);
        }
      } catch (err) {
        console.error('getActiveChild error:', err);
      }

      setLoading(false);
    };

    init();
  }, []);

  const register = useCallback(async (fullName, pin) => {
    setError(null);
    try {
      const result = await ChildAccountService.registerChild(fullName, pin);
      // Auto-login after registration
      await ChildAccountService.loginChild(result.childId, pin);
      const child = ChildAccountService.getActiveChild();
      setActiveChild(child);
      AnalyticsService.trackLogin();
      
      // Auto-sync to Supabase after successful registration
      if (isSupabaseConfigured()) {
        try {
          await CloudSyncService.syncToCloud();
          console.log('Account synced to Supabase successfully');
        } catch (syncErr) {
          console.warn('Supabase sync failed (account saved locally):', syncErr.message);
          // Don't throw - account is saved locally even if sync fails
        }
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const login = useCallback(async (childId, pin) => {
    setError(null);
    try {
      const result = await ChildAccountService.loginChild(childId, pin);
      const child = ChildAccountService.getActiveChild();
      setActiveChild(child);
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

  // Cloud sync functions
  const syncToCloud = useCallback(async () => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
    return await CloudSyncService.syncToCloud();
  }, []);

  const syncFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
    
    const result = await CloudSyncService.syncFromCloud();
    if (result.success && activeChild) {
      // Refresh active child after sync
      const updatedChild = ChildAccountService.getActiveChild();
      setActiveChild(updatedChild);
    }
    return result;
  }, [activeChild]);

  const fullSync = useCallback(async () => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
    const result = await CloudSyncService.fullSync();
    if (result.success && activeChild) {
      const updatedChild = ChildAccountService.getActiveChild();
      setActiveChild(updatedChild);
    }
    return result;
  }, [activeChild]);

  const value = {
    activeChild,
    loading,
    error,
    register,
    login,
    logout,
    updateChild,
    clearError,
    isAuthenticated: !!activeChild,
    childName: activeChild?.fullName || '',
    childId: activeChild?.childId || '',
    // Cloud sync methods
    syncToCloud,
    syncFromCloud,
    fullSync,
    isCloudSyncEnabled: CloudSyncService.isEnabled(),
    cloudSyncStatus: CloudSyncService.getSyncStatus(),
  };

  return (
    <ChildAccountContext.Provider value={value}>
      {children}
    </ChildAccountContext.Provider>
  );
};

export default ChildAccountContext;