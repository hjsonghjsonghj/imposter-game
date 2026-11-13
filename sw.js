// Offline support for the Imposter game.
// On the first visit the files below are saved on the device.
// Afterwards the saved copy is shown immediately (also without internet),
// and when online a fresh copy is fetched in the background for the next visit.

const CACHE = 'imposter-v1';
const FILES = [
  './',
  './index.html',
  './apple-touch-icon.png',
  './fonts/fredoka-latin-wght.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const cached = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req)
        .then(async res => {
          // Safari refuses redirected responses for page loads, so store a clean copy
          if (res && res.redirected) {
            res = new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
          }
          if (res && res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
