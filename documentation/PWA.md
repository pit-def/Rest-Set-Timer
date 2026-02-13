# PWA Implementation Guide

This document outlines the steps to convert the "Rest Set Timer" into a Progressive Web App (PWA).

## 1. Web App Manifest (`manifest.json`)
Create a `manifest.json` file in the root directory.

```json
{
  "name": "Rest Set Timer",
  "short_name": "RestTimer",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0a0e17",
  "theme_color": "#0a0e17",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 2. Service Worker (`sw.js`)
Create a `sw.js` file to cache assets for offline use.

```javascript
const CACHE_NAME = 'rest-timer-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './assets/beep.mp3' // if applicable
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
```

## 3. Registration
Add this script to the bottom of `index.html` (or inside `app.js`):

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW failed', err));
  });
}
```

## 4. HTTPS Requirement
PWAs require HTTPS. When testing locally, `localhost` is treated as secure. For production, ensure your host (e.g., GitHub Pages, Vercel) serves over HTTPS.

## 5. iOS Considerations
- Add `<link rel="apple-touch-icon" href="assets/icon-192.png">` to the `<head>`.
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`.
- Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`.
