// Recipe Visualizer Service Worker — v2
// Strategy: stale-while-revalidate

const CACHE_NAME = 'recipes-v2';
const PRECACHE = ['./index.html', './app.webmanifest', './icon.svg', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cachedResponse => {
        const networkFetch = fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        // Return cache immediately if available, otherwise wait for network
        return cachedResponse || networkFetch;
      })
    )
  );
});
