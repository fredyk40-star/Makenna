// Service Worker for Makenna Learning Lab PWA
const CACHE_NAME = 'makenna-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png',
  // Music assets (will be populated dynamically)
  '/data/musicData.js',
  '/hooks/useMusicProgress.js',
  '/pages/Music/MusicLibrary.jsx',
  '/pages/Music/SongPlayer.jsx',
  '/pages/Music/KaraokePlayer.jsx',
  '/pages/Music/MusicGames.jsx',
  '/pages/Music/RecordVoice.jsx',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle music-related requests with specific caching
  const url = event.request.url;
  
  // Cache music data and lyrics
  if (url.includes('musicData') || url.includes('MUSIC_LIBRARY')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          // Return cached version immediately
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // Return cached or offline fallback
            return response || new Response(JSON.stringify({}), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clonedResponse);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Handle updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline progress
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-music-progress') {
    event.waitUntil(
      // Sync any pending music progress
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_MUSIC_PROGRESS' });
        });
      })
    );
  }
});