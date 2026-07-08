import { useState, useEffect } from 'react';

export const usePWADetection = () => {
  const [platform, setPlatform] = useState('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);

  useEffect(() => {
    detectPlatform();
    checkIfInstalled();
    checkInstallCapability();
  }, []);

  const detectPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setPlatform('ios');
    }
    // Android detection
    else if (/android/i.test(userAgent)) {
      setPlatform('android');
    }
    // Desktop detection
    else if (!/mobile/i.test(userAgent)) {
      setPlatform('desktop');
    }
    else {
      setPlatform('unknown');
    }
  };

  const checkIfInstalled = () => {
    // Check if running in standalone mode (installed)
    if (window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }
    
    // Check if matchMedia indicates standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    
    // Check for PWA installed class
    if (document.referrer.includes('webapk') || document.referrer.includes('android')) {
      setIsInstalled(true);
      return;
    }
    
    setIsInstalled(false);
  };

  const checkInstallCapability = () => {
    // Check if beforeinstallprompt event is supported
    const canPrompt = 'onbeforeinstallprompt' in window;
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const isServiceWorker = 'serviceWorker' in navigator;
    
    setCanInstall(canPrompt && isSecure && isServiceWorker && !isInstalled);
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'ios': return 'iPhone/iPad';
      case 'android': return 'Android';
      case 'desktop': return 'Desktop';
      default: return 'Mobile Device';
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios': return '🍏';
      case 'android': return '🤖';
      case 'desktop': return '💻';
      default: return '📱';
    }
  };

  return {
    platform,
    isInstalled,
    canInstall,
    showGuidance,
    setShowGuidance,
    getPlatformName,
    getPlatformIcon
  };
};