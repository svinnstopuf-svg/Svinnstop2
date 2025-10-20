// Notifikations-service för utgångsdatum
export class NotificationService {
  constructor() {
    this.registration = null
    this.permission = null
  }

  // Begär tillstånd för notifikationer
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Denna webbläsare stödjer inte notifikationer')
      return false
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Denna webbläsare stödjer inte service workers')
      return false
    }

    try {
      // Registrera Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registrerad:', this.registration.scope)

      // Begär notifikationstillstånd
      this.permission = await Notification.requestPermission()
      
      if (this.permission === 'granted') {
        console.log('Notifikationstillstånd beviljat')
        return true
      } else {
        console.warn('Notifikationstillstånd nekat')
        return false
      }
    } catch (error) {
      console.error('Fel vid registrering av notifikationer:', error)
      return false
    }
  }

  // Kontrollera om notifikationer är tillåtna
  isEnabled() {
    return this.permission === 'granted' && this.registration
  }

  // Schemalägg notifikationer baserat på utgångsdatum
  scheduleExpiryNotifications(items) {
    if (!this.isEnabled()) return

    // Avboka tidigare schemalagda notifikationer
    this.clearScheduledNotifications()

    const now = new Date()
    
    items.forEach(item => {
      const expiryDate = new Date(item.expiresAt)
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))

      // Schemalägg notifikationer för 3 dagar, 1 dag och dagen före utgång
      const notificationDays = [3, 1, 0]
      
      notificationDays.forEach(daysBefore => {
        if (daysUntilExpiry === daysBefore) {
          const notificationTime = new Date()
          notificationTime.setHours(9, 0, 0, 0) // Skicka notifikation kl 09:00
          
          if (notificationTime > now) {
            this.scheduleNotification(item, daysBefore, notificationTime)
          }
        }
      })
    })
  }

  // Schemalägg en specifik notifikation
  scheduleNotification(item, daysBefore, notificationTime) {
    const delay = notificationTime.getTime() - Date.now()
    
    if (delay <= 0) return

    const timeoutId = setTimeout(() => {
      this.showExpiryNotification(item, daysBefore)
    }, delay)

    // Spara timeout-ID för att kunna avboka senare
    const scheduledNotifications = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]')
    scheduledNotifications.push({
      itemId: item.id,
      timeoutId,
      scheduledFor: notificationTime.toISOString()
    })
    localStorage.setItem('scheduled_notifications', JSON.stringify(scheduledNotifications))
  }

  // Visa utgångsdatum-notifikation
  async showExpiryNotification(item, daysBefore) {
    if (!this.isEnabled()) return

    let title = 'Svinnstop - Utgångsdatum!'
    let body = ''

    if (daysBefore === 0) {
      body = `${item.name} går ut idag! 🚨`
    } else if (daysBefore === 1) {
      body = `${item.name} går ut imorgon! ⏰`
    } else {
      body = `${item.name} går ut om ${daysBefore} dagar 📅`
    }

    try {
      await this.registration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `expiry-${item.id}`, // Förhindra dubbletter
        vibrate: [100, 50, 100],
        data: {
          itemId: item.id,
          itemName: item.name,
          daysUntilExpiry: daysBefore
        },
        actions: [
          {
            action: 'view',
            title: 'Visa i app'
          },
          {
            action: 'dismiss',
            title: 'Stäng'
          }
        ]
      })
    } catch (error) {
      console.error('Fel vid visning av notifikation:', error)
    }
  }

  // Rensa alla schemalagda notifikationer
  clearScheduledNotifications() {
    const scheduled = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]')
    
    scheduled.forEach(notification => {
      clearTimeout(notification.timeoutId)
    })
    
    localStorage.removeItem('scheduled_notifications')
  }

  // Visa omedelbar test-notifikation
  async showTestNotification() {
    if (!this.isEnabled()) {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    try {
      await this.registration.showNotification('Svinnstop - Test', {
        body: 'Notifikationer fungerar! Du kommer nu få påminnelser om utgångsdatum. 🎉',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-notification'
      })
    } catch (error) {
      console.error('Fel vid test-notifikation:', error)
    }
  }

  // Kontrollera och uppdatera notifikationer dagligen
  setupDailyCheck(items) {
    if (!this.isEnabled()) return

    // Kör kontroll varje dag kl 08:00
    const now = new Date()
    const nextCheck = new Date()
    nextCheck.setHours(8, 0, 0, 0)
    
    if (nextCheck <= now) {
      nextCheck.setDate(nextCheck.getDate() + 1)
    }
    
    const msUntilNext = nextCheck.getTime() - now.getTime()
    
    setTimeout(() => {
      this.scheduleExpiryNotifications(items)
      
      // Schemalägg nästa dagliga kontroll
      setInterval(() => {
        // Här skulle vi hämta uppdaterade varor från localStorage
        const currentItems = JSON.parse(localStorage.getItem('svinnstop_items') || '[]')
        this.scheduleExpiryNotifications(currentItems)
      }, 24 * 60 * 60 * 1000) // Varje dag
      
    }, msUntilNext)
  }
}

export const notificationService = new NotificationService()