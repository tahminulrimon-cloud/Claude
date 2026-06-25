const CACHE = 'alysha-v1';

const PRECACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Pass through non-GET, cross-origin, and Google Drive requests uncached
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.endsWith('fonts.gstatic.com')) return;

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Only cache same-origin assets and Google Fonts
        if (
          response.ok &&
          (url.origin === self.location.origin || url.hostname.endsWith('fonts.gstatic.com'))
        ) {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
