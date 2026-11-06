/* GORILLA GAMES — offline support
   Shell is precached on install; everything else same-origin is cached as it
   is used (stale-while-revalidate), so a second visit works with no network.
   Firebase requests always go to the network: offline the games fall back to
   the records stored on the device. */
const VERSION = 'gorilla-v1';
const FONTS = VERSION + '-fonts';
const SHELL = [
  './',
  './index.html',
  './yumekawa.html',
  './sunset.html',
  './config.js',
  './sw-register.js',
  './manifest.webmanifest',
  './favicon.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => Promise.all(SHELL.map(u => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Google Fonts: cache first, so the typefaces survive offline
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then(cache =>
        cache.match(req).then(hit =>
          hit || fetch(req).then(res => { cache.put(req, res.clone()); return res; }).catch(() => hit)
        )
      )
    );
    return;
  }

  // anything else off-site (the score database) stays online-only
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
