const CACHE_NAME = 'rest-set-timer-v2';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/beep.mp3'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
