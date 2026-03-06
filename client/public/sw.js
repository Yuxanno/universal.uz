const CACHE_NAME = 'universal-pos-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['/', '/index.html']).catch(() => Promise.resolve()))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => name !== CACHE_NAME && caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Faqat GET so'rovlar - POST va boshqalarni o'tkazib yuborish
  if (event.request.method !== 'GET') return;

  // API va socket so'rovlarini to'xtatmaslik
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  // /assets/ JS/CSS chunk larini HECH QACHON cache qilmaslik
  // (har build da hash o'zgaradi, eski hash lar 404 bo'ladi)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML sahifalar: network-first, cache ga fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/index.html'))
      )
  );
});
