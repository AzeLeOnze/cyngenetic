// Cyngenetic : cache hors ligne. Version 20261113-183518 (change à chaque fabrication, pour que les mises à jour arrivent).
const VERSION = 'cyngenetic-20261113-183518';
const FONTS = 'cyngenetic-fonts';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png?v=2', './icons/icon-512.png?v=2',
  './icons/icon-maskable-512.png?v=2', './icons/apple-touch-icon.png?v=2', './icons/favicon.svg?v=2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {          // la page : réseau d'abord (mises à jour), sinon la copie hors ligne
      e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {   // polices gardées après la 1re visite
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});