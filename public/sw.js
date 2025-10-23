// Service Worker for Push Notifications and Background Sync
const CACHE_NAME = 'triplexa-notifications-v1';
const urlsToCache = [
  '/',
  '/placeholder.svg',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new update',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'default',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/placeholder.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/placeholder.svg'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
        data: {
          ...notificationData.data,
          ...payload.data
        }
      };
    } catch (error) {
      console.error('Error parsing push payload:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      silent: false
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there's already a window/tab open with the target URL
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }

    // If no window/tab is open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);

  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications with server
async function syncNotifications() {
  try {
    // Get stored notifications that need to be synced
    const cache = await caches.open(CACHE_NAME);
    const pendingNotifications = await cache.match('/pending-notifications');
    
    if (pendingNotifications) {
      const notifications = await pendingNotifications.json();
      
      // Send notifications to server
      for (const notification of notifications) {
        try {
          await fetch('/api/notifications/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(notification)
          });
        } catch (error) {
          console.error('Failed to sync notification:', error);
        }
      }
      
      // Clear synced notifications
      await cache.delete('/pending-notifications');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_NOTIFICATION') {
    cacheNotification(event.data.notification);
  }
});

// Cache notification for offline access
async function cacheNotification(notification) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify(notification), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/notification/${notification.id}`, response);
  } catch (error) {
    console.error('Failed to cache notification:', error);
  }
}

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle notification API requests
  if (event.request.url.includes('/api/notifications')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle other requests with cache-first strategy for static assets
  if (event.request.url.includes('.js') || 
      event.request.url.includes('.css') || 
      event.request.url.includes('.png') || 
      event.request.url.includes('.svg')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync event:', event);

  if (event.tag === 'notification-check') {
    event.waitUntil(checkForNewNotifications());
  }
});

// Check for new notifications
async function checkForNewNotifications() {
  try {
    const response = await fetch('/api/notifications/check', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.hasNewNotifications) {
        // Show notification about new updates
        self.registration.showNotification('New Updates Available', {
          body: 'You have new notifications. Click to view.',
          icon: '/placeholder.svg',
          badge: '/placeholder.svg',
          tag: 'update-available',
          data: { url: '/notifications' }
        });
      }
    }
  } catch (error) {
    console.error('Failed to check for new notifications:', error);
  }
}

console.log('Service Worker loaded and ready');