import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AccessibilityService, { DEFAULT_ACCESSIBILITY_SETTINGS } from '../services/AccessibilityService';

const AccessibilityContext = createContext(DEFAULT_ACCESSIBILITY_SETTINGS);

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => AccessibilityService.init());

  useEffect(() => AccessibilityService.subscribe(next => setSettings({ ...next })), []);

  const updateSettings = useCallback((updates) => {
    setSettings({ ...AccessibilityService.updateSettings(updates) });
  }, []);

  const value = useMemo(() => ({
    ...settings,
    settings,
    updateSettings,
    resetAccessibility: () => setSettings({ ...AccessibilityService.reset() }),
  }), [settings, updateSettings]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export const useAccessibility = () => useContext(AccessibilityContext);
