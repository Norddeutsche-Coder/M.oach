/* Build placeholders are replaced by scripts/build-service-worker.mjs. */
const VERSION = __BUILD_VERSION__;
const FILES = __PRECACHE_FILES__;
const PREFIX = 'moach-vite-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + VERSION;
const LEGACY_CACHE = 'moach-v61';
const url = path => new URL(path, self.registration.scope).href;
const assets = new Set(FILES.map(url));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key === LEGACY_CACHE || (key.startsWith(PREFIX) && key !== CACHE))
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then(cache => cache.match(url('index.html')))));
  } else if (assets.has(request.url)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request, { ignoreVary: true })) || fetch(request)));
  }
});
self.addEventListener('push', event => {
  let data;
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'M.oach', {
    body: data.body || '', tag: data.tag || 'moach', icon: url('icon-192.png'),
    renotify: true, data: { tab: data.tab || '' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const tab = (event.notification.data || {}).tab || '';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const client = clients.find(client => client.url.startsWith(self.registration.scope));
    if (client) { client.postMessage({ t: 'push', tab }); return client.focus(); }
    return self.clients.openWindow(self.registration.scope + (tab ? '?tab=' + encodeURIComponent(tab) : ''));
  }));
});
