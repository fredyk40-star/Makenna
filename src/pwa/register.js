export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registered successfully');
          
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
          
          // Handle update found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          });
        })
        .catch(err => {
          console.warn('ServiceWorker registration failed:', err);
        });
    });
  }
};

export const showUpdateNotification = () => {
  const updateDiv = document.createElement('div');
  updateDiv.className = 'fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50';
  updateDiv.setAttribute('role', 'alert');
  updateDiv.setAttribute('aria-live', 'polite');
  updateDiv.innerHTML = `
    <div class="glassmorphism rounded-2xl p-4 shadow-soft border border-white/20">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-bold text-gray-800 dark:text-white">Update Available! ✨</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">New features are ready</p>
        </div>
        <button onclick="location.reload()" class="btn-primary text-sm py-2 px-4 rounded-xl" aria-label="Update app now">
          Update Now
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(updateDiv);
};

export const checkOfflineStatus = () => {
  return !navigator.onLine;
};

export const getAppVersion = () => {
  return '1.0.0';
};