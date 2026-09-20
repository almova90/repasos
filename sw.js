const APP_VERSION = '0.20.0';
const CACHE_NAME = `repasos-${APP_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest-v5.webmanifest',
  './demo-data.js',
  './icon-192-v5.png',
  './icon-192-maskable-v5.png',
  './icon-512-v5.png',
  './icon-512-maskable-v5.png',
  './icon-1024-v5.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
            return response;
          })
          .catch(() => caches.match('./'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fresh = fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
