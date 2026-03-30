// Recipe Visualizer Service Worker — v1
// Strategy: stale-while-revalidate (per Frontend Masters PWA course pattern)

const CACHE_NAME = 'recipes-v1';
const PRECACHE = ['./index.html', './app.webmanifest', './icon.svg', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale while revalidate: serve cached version immediately,
// fetch update in background for next visit
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // Network failed — return nothing (cachedResponse already returned if available)
      });
      // Return cached response immediately, or wait for network if not cached
      return cachedResponse || fetchPromise;
    })
  );
});
