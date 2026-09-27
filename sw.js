// Service Worker لتطبيق مسار - للعمل في وضع عدم الاتصال (Offline)
const CACHE_NAME = 'masar-cache-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './styles/main.css',
  './src/app.js',
  './src/services/storage.js',
  './src/services/prayers.js',
  './src/modules/thanawya.js',
  './src/modules/youtube_ai.js',
  './src/modules/habits.js',
  './src/modules/ai_advisor.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('SW cache partial:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});
