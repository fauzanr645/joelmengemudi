const CACHE_NAME = 'joelmengemudi-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // API calls & dynamic auth routes: Network first, no offline HTML
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline mode' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static assets (images, icons): Cache first, fallback to network
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.url.includes('/icons/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, copy));
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // HTML navigation requests: Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL).then((fallback) => {
            return fallback || caches.match('/login');
          });
        })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// =========================================================
// WEB PUSH NOTIFICATION HANDLERS (DEVICE TO WEB)
// =========================================================

self.addEventListener('push', (event) => {
  let data = {
    title: 'joelmengemudi',
    body: 'Ada pembaruan penting di sistem kursus Anda.',
    link: '/',
    icon: '/icons/icon-192x192.png',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [150, 60, 150],
    data: {
      url: data.link || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Buka Sekarang' },
      { action: 'close', title: 'Tutup' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
