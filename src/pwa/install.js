/**
 * PWA installation utilities
 */

let deferredPrompt = null;

export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    return deferredPrompt;
  });
};

export const isInstallable = () => {
  return !!deferredPrompt;
};

export const installApp = async () => {
  if (!deferredPrompt) {
    return { success: false, reason: 'No install prompt available' };
  }
  
  try {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
    
    if (result.outcome === 'accepted') {
      return { success: true };
    } else {
      return { success: false, reason: 'User dismissed install' };
    }
  } catch (error) {
    console.error('Install error:', error);
    return { success: false, reason: error.message };
  }
};

export const isPWAInstalled = () => {
  // Check if app is installed (standalone mode)
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone || 
         document.referrer.includes('android-app://');
};