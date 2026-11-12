const CACHE_NAME = 'unseal-v5';
const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './site.webmanifest',
  './assets/favicon.svg',
  './assets/favicon-32x32.png',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/og-image.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => { })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isCoreShell =
    req.mode === 'navigate' ||
    url.pathname === '/' ||
    /\.(html|css|js|webmanifest)$/i.test(url.pathname);

  /* Network-First for HTML, CSS, JS, and document navigations */
  if (isCoreShell) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            const cacheKey = req.mode === 'navigate' ? './index.html' : req;
            caches.open(CACHE_NAME).then((c) => c.put(cacheKey, copy)).catch(() => { });
          }
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') {
            return caches.match('./index.html').then((r) => r || caches.match('./'));
          }
          return caches.match(req);
        })
    );
    return;
  }

  /* Cache-then-network refresh for static media assets */
  event.respondWith(
    caches.match(req).then((cached) => {
      const netFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => { });
          }
          return res;
        })
        .catch(() => cached);
      return cached || netFetch;
    })
  );
});
