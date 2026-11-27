let reloadingForUpdate = false;
let pendingUpdateWorker = null;
let deferredInstallPrompt = null;

const reloadOnce = (hadController) => {
  if (reloadingForUpdate || !hadController) return;
  reloadingForUpdate = true;
  console.info('A newer app version is available. Reloading...');
  window.location.reload();
};

export const applyPendingUpdate = () => {
  if (pendingUpdateWorker) {
    pendingUpdateWorker.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
};

const showInstallButton = () => {
  if (document.getElementById('makenna-install-button')) return;

  const button = document.createElement('button');
  button.id = 'makenna-install-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Install Makenna Learning Lab');
  button.textContent = 'Install App';
  button.style.cssText = [
    'position:fixed',
    'right:1rem',
    'bottom:1rem',
    'z-index:60',
    'padding:0.75rem 1rem',
    'border-radius:9999px',
    'border:1px solid rgba(255,255,255,0.35)',
    'background:linear-gradient(135deg,#2563eb,#06b6d4)',
    'color:#fff',
    'font:600 0.875rem/1.25 system-ui,sans-serif',
    'box-shadow:0 10px 30px rgba(37,99,235,0.35)',
    'cursor:pointer',
  ].join(';');

  button.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try {
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.info('Install prompt outcome:', outcome);
    } catch (error) {
      console.warn('Install prompt failed:', error);
    }
    deferredInstallPrompt = null;
    button.remove();
  });

  document.body.appendChild(button);
};

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return undefined;

  window.__makennaApplyUpdate = applyPendingUpdate;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    document.getElementById('makenna-install-button')?.remove();
    console.info('Makenna was installed.');
  });

  window.addEventListener('load', () => {
    // Only reload clients that were already running an older app. A first-time
    // install should not interrupt the current session.
    const hadController = Boolean(navigator.serviceWorker.controller);

    const watchWorker = (worker) => {
      if (!worker) return;

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') {
          pendingUpdateWorker = worker;
          // Let the user choose when to switch; the button posts SKIP_WAITING.
          showUpdateNotification();
        } else if (worker.state === 'activated') {
          reloadOnce(hadController);
        }
      });

      if (worker.state === 'installed') {
        pendingUpdateWorker = worker;
        showUpdateNotification();
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
  if (document.getElementById('makenna-update-notification')) return;

  const updateDiv = document.createElement('div');
  updateDiv.id = 'makenna-update-notification';
  updateDiv.className = 'fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50';
  updateDiv.setAttribute('role', 'alert');
  updateDiv.setAttribute('aria-live', 'polite');
  updateDiv.innerHTML = `
    <div class="glassmorphism rounded-2xl p-4 shadow-soft border border-white/20">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h4 class="font-bold text-gray-800 dark:text-white">Update Available! ✨</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">New features are ready</p>
        </div>
        <button type="button" class="btn-primary text-sm py-2 px-4 rounded-xl" aria-label="Update app now">
          Update Now
        </button>
      </div>
    </div>
  `;

  const button = updateDiv.querySelector('button');
  button?.addEventListener('click', applyPendingUpdate);
  document.body.appendChild(updateDiv);
};

export const checkOfflineStatus = () => {
  return !navigator.onLine;
};

export const getAppVersion = () => {
  return '1.0.0';
};