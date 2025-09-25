const CACHE_NAME = 'teleh-health-monitor-v1';
const urlsToCache = [
  '/',
  '/mobile-dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event with error handling
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        
        // Cache URLs individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null; // Continue with other URLs
            })
          )
        );
      })
      .then(() => {
        console.log('Service worker installed successfully');
        // Force activation of new service worker
        self.skipWaiting();
      })
  );
});

// Fetch event for caching static assets only
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests for security
  if (request.method !== 'GET') {
    return;
  }

  // Skip API routes and authenticated requests
  if (url.pathname.includes('/api/') || request.headers.get('Authorization')) {
    return;
  }

  // Only cache same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then((response) => {
            // Only cache successful responses for static assets
            if (response && response.status === 200 && response.type === 'basic') {
              // Cache static assets only (icons, manifest, CSS, JS)
              const cacheable = url.pathname.includes('/icons/') || 
                               url.pathname.includes('/static/') ||
                               url.pathname === '/manifest.json' ||
                               url.pathname.endsWith('.js') ||
                               url.pathname.endsWith('.css');

              if (cacheable) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  });
              }
            }

            return response;
          })
          .catch(() => {
            // Return navigation fallback for navigation requests only
            if (request.mode === 'navigate') {
              return caches.match('/mobile-dashboard') || 
                     caches.match('/') ||
                     new Response('Offline - Please check your connection', {
                       status: 503,
                       statusText: 'Service Unavailable',
                       headers: { 'Content-Type': 'text/html' }
                     });
            }
            
            // For non-navigation requests, let them fail naturally
            throw new Error('Network unavailable');
          });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      clients.claim()
    ]).then(() => {
      console.log('Service worker activated and ready');
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncVitalSigns());
  }
});

async function syncVitalSigns() {
  // Sync any pending vital signs data when back online
  try {
    const pendingData = await getStoredData('pending-vitals');
    if (pendingData && pendingData.length > 0) {
      for (const data of pendingData) {
        await fetch('/api/vital-signs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
          },
          body: JSON.stringify(data.vitals)
        });
      }
      await clearStoredData('pending-vitals');
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Push notifications for health alerts
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Health monitoring update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('24/7 Tele H Health Monitor', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/mobile-dashboard')
    );
  }
});

// Helper functions for IndexedDB storage
async function getStoredData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TeleHHealthDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.data : null);
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function clearStoredData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TeleHHealthDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const deleteRequest = store.delete(key);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}