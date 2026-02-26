const CACHE_NAME = 'fox-business-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/collections.html',
  '/management.html',
  '/agents_performance.html',
  '/agent_customers.html',
  '/disconnected_lines.html',
  '/excel_upload.html',
  '/notes.html',
  '/register.html',
  '/forget-pass.html',
  '/change-password.html',
  '/admin.html',
  '/admin-dashboard.html',
  '/app.js',
  '/header.js',
  '/header.css',
  '/modern-styles.css',
  '/modern-header.js',
  '/admin-tabs-content.js',
  '/manifest.json',
  '/Orange_logo.svg.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened, adding files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All files cached successfully');
        return self.skipWaiting();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Only cache HTTP/HTTPS requests (exclude chrome-extension, etc.)
            if (!fetchRequest.url.startsWith('http')) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(fetchRequest, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // For HTML requests, try to serve index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          // Return cached version if network fails
          return caches.match(event.request);
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle any offline actions that need to be synced
  console.log('Background sync completed');
}
