const CACHE_NAME = 'story-app-shell-v1';

self.addEventListener('install', event => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Tangani navigasi SPA
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html", { ignoreSearch: true }).then((cacheRes) => {
        if (cacheRes) return cacheRes; // langsung tampil cepat

        return fetch(event.request)
          .then((networkRes) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put("/index.html", networkRes.clone());
              return networkRes;
            });
          })
          .catch(() => caches.match("/index.html")); // fallback kalau offline
      })
    );
    return;
  }

  // Abaikan POST/PUT/DELETE
  if (event.request.method !== "GET") {
    return;
  }

  // Cache-first untuk GET
  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(event.request).then((networkRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkRes.clone());
            return networkRes;
          });
        })
      );
    })
  );
});

// Push Notifikasi 
self.addEventListener('push', event => {
  console.log('[SW] Push Received:', event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Error parsing push event:', e);
    data = {};
  }

  const options = {
    body: data.message || 'No message provided',
    icon: data.image || '/icons/icon-192.png',
    data: { id: data.id || '' },
    actions: [
      { action: 'open_detail', title: 'Lihat Detail' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notifikasi Baru', options)
  );
});


