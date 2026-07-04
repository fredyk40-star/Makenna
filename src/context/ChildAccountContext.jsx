import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChildAccountService } from '../services/ChildAccountService';
import { AnalyticsService } from '../services/AnalyticsService';
import { GamificationService } from '../services/GamificationService';

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
    // Initialize services
    ChildAccountService.initialize();
    AnalyticsService.initialize();

    // Check for existing session
    const child = ChildAccountService.getActiveChild();
    if (child) {
      setActiveChild(child);
    }
    setLoading(false);
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
  };

  return (
    <ChildAccountContext.Provider value={value}>
      {children}
    </ChildAccountContext.Provider>
  );
};

export default ChildAccountContext;