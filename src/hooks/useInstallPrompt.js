import { useState, useEffect, useCallback } from 'react';

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone
        || document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    const alreadyInstalled = checkInstalled();

    // Check if beforeinstallprompt is supported
    const supported = 'onbeforeinstallprompt' in window;
    setIsSupported(supported);

    if (alreadyInstalled || !supported) {
      setIsInstallable(false);
      return;
    }

    const handler = (e) => {
      // Prevent default browser install banner — only if not already installed
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const installedHandler = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt || isInstalled) return false;

    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      // Prompt is single-use — clear it immediately after calling
      setDeferredPrompt(null);

      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error installing app:', error);
      setDeferredPrompt(null);
      return false;
    }
  }, [deferredPrompt, isInstalled]);

  return { isInstallable, isInstalled, isSupported, installApp };
};
