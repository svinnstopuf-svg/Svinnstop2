// Service Worker för push-notifikationer
const CACHE_NAME = 'svinnstop-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx'
]

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

// Fetch event (för offline-funktionalitet)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Returnera cached version eller hämta från nätet
        return response || fetch(event.request)
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