// Service Worker för push-notifikationer
const CACHE_NAME = 'svinnstop-v3' // Uppdaterad cache version
const urlsToCache = [
  '/'
]

// Install Service Worker
self.addEventListener('install', event => {
  self.skipWaiting() // Aktivera ny service worker direkt
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

// Activate - rensa gamla cachar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - Network first, fall back to cache
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Om nätverk misslyckas, använd cache
        return caches.match(event.request)
      })
  )
})

// Push event - visa notifikation
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Några av dina varor närmar sig utgångsdatumet!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore', 
        title: 'Visa varor',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close', 
        title: 'Stäng',
        icon: '/images/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Svinnstop - Utgångsdatum!', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'explore') {
    // Öppna appen när användaren klickar på notifikationen
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Bara stäng notifikationen
    event.notification.close()
  } else {
    // Standard-klick - öppna appen
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})