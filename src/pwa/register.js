let reloadingForUpdate = false;

const reloadOnce = (hadController) => {
  if (reloadingForUpdate || !hadController) return;
  reloadingForUpdate = true;
  console.info('A newer app version is available. Reloading...');
  window.location.reload();
};

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return undefined;

  window.addEventListener('load', () => {
    // Only reload clients that were already running an older app. A first-time
    // install should not interrupt the current session.
    const hadController = Boolean(navigator.serviceWorker.controller);

    const watchWorker = (worker) => {
      if (!worker || !hadController) return;

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') {
          worker.postMessage({ type: 'SKIP_WAITING' });
        } else if (worker.state === 'activated') {
          reloadOnce(hadController);
        }
      });

      if (worker.state === 'installed') {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    const checkForUpdate = async (registration) => {
      try {
        watchWorker(registration.waiting);
        await registration.update();
      } catch {
        // The app still works offline; updates retry on the next visit/focus.
      }
    };

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('ServiceWorker registered successfully');

        registration.addEventListener('updatefound', () => {
          watchWorker(registration.installing);
        });

        checkForUpdate(registration);
      })
      .catch((error) => {
        console.warn('ServiceWorker registration failed (app will still work):', error);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      reloadOnce(hadController);
    });

    window.addEventListener('focus', () => {
      navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (registration) checkForUpdate(registration);
        })
        .catch(() => {
          // Ignore transient registration lookup failures.
        });
    });
  });

  return undefined;
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
