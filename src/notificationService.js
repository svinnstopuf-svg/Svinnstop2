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

      // AGGRESSIVE: Fler notifikationspunkter för bättre retention
      // 7 dagar, 3 dagar, 1 dag, samma dag (morgon + kväll)
      const notificationDays = [7, 3, 1, 0]
      
      notificationDays.forEach(daysBefore => {
        if (daysUntilExpiry === daysBefore) {
          // Morgonnotifikation kl 08:00
          const morningTime = new Date()
          morningTime.setHours(8, 0, 0, 0)
          
          if (morningTime > now) {
            this.scheduleNotification(item, daysBefore, morningTime, 'morning')
          }
          
          // Extra kvällspåminnelse för kritiska varor (går ut idag/imorgon)
          if (daysBefore <= 1) {
            const eveningTime = new Date()
            eveningTime.setHours(19, 0, 0, 0)
            
            if (eveningTime > now) {
              this.scheduleNotification(item, daysBefore, eveningTime, 'evening')
            }
          }
        }
      })
    })
    
    // TIER 1 FEATURE: Daglig sammanfattning kl 19:00
    this.scheduleDailySummary(items)
  }

  // Schemalägg en specifik notifikation
  scheduleNotification(item, daysBefore, notificationTime, timeOfDay = 'morning') {
    const delay = notificationTime.getTime() - Date.now()
    
    if (delay <= 0) return

    const timeoutId = setTimeout(() => {
      this.showExpiryNotification(item, daysBefore, timeOfDay)
    }, delay)

    // Spara timeout-ID för att kunna avboka senare
    const scheduledNotifications = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]')
    scheduledNotifications.push({
      itemId: item.id,
      timeoutId,
      scheduledFor: notificationTime.toISOString(),
      timeOfDay
    })
    localStorage.setItem('scheduled_notifications', JSON.stringify(scheduledNotifications))
  }

  // Visa utgångsdatum-notifikation
  async showExpiryNotification(item, daysBefore, timeOfDay = 'morning') {
    if (!this.isEnabled()) return

    let title = ''
    let body = ''

    // AGGRESSIVE MESSAGING med värdefokus
    if (daysBefore === 0) {
      title = timeOfDay === 'evening' ? '🚨 SISTA CHANSEN!' : '⚠️ Går ut idag!'
      body = `${item.name} går ut idag! Använd den nu för att spara pengar! 💰`
    } else if (daysBefore === 1) {
      title = timeOfDay === 'evening' ? '⏰ Imorgon är det försent!' : '⏰ Går ut imorgon'
      body = `${item.name} går ut imorgon. Planera din middag nu! 🍽️`
    } else if (daysBefore === 3) {
      title = '📅 3 dagar kvar'
      body = `${item.name} går ut om 3 dagar. Kolla våra recept! 🍳`
    } else if (daysBefore === 7) {
      title = '📌 Påminnelse om 1 vecka'
      body = `${item.name} går ut om 1 vecka. Bra att veta! 👍`
    } else {
      title = '📅 Utgångsdatum'
      body = `${item.name} går ut om ${daysBefore} dagar`
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
    // Kontrollera om service worker är registrerad
    if (!this.registration) {
      console.warn('Service worker är inte registrerad ännu')
      return
    }

    try {
      await this.registration.showNotification('Svinnstop - Test', {
        body: 'Notifikationer fungerar! Du kommer nu få påminnelser om utgångsdatum. 🎉',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-notification'
      })
      console.log('✅ Test-notifikation skickad!')
    } catch (error) {
      console.error('Fel vid test-notifikation:', error)
    }
  }

  // TIER 1 FEATURE: Daglig sammanfattning kl 19:00
  scheduleDailySummary(items) {
    if (!this.isEnabled()) return
    
    const now = new Date()
    const summaryTime = new Date()
    summaryTime.setHours(19, 0, 0, 0) // Kvällstid när folk planerar mat
    
    if (summaryTime <= now) {
      summaryTime.setDate(summaryTime.getDate() + 1)
    }
    
    const delay = summaryTime.getTime() - now.getTime()
    
    setTimeout(() => {
      this.showDailySummary(items)
      // Schemalägg nästa dagliga sammanfattning
      setInterval(() => {
        const currentItems = JSON.parse(localStorage.getItem('svinnstop_items') || '[]')
        this.showDailySummary(currentItems)
      }, 24 * 60 * 60 * 1000)
    }, delay)
  }
  
  // Visa daglig sammanfattning
  async showDailySummary(items) {
    if (!this.isEnabled() || items.length === 0) return
    
    const now = new Date()
    
    // Räkna varor som går ut inom olika tidsramar
    const expiringToday = items.filter(item => {
      const days = Math.ceil((new Date(item.expiresAt) - now) / (1000 * 60 * 60 * 24))
      return days === 0
    })
    
    const expiringTomorrow = items.filter(item => {
      const days = Math.ceil((new Date(item.expiresAt) - now) / (1000 * 60 * 60 * 24))
      return days === 1
    })
    
    const expiringThisWeek = items.filter(item => {
      const days = Math.ceil((new Date(item.expiresAt) - now) / (1000 * 60 * 60 * 24))
      return days > 1 && days <= 7
    })
    
    // Skapa värdefokuserad sammanfattning
    let title = '🍽️ Kvällens matplanering!'
    let body = ''
    
    if (expiringToday.length > 0) {
      title = '🚨 VIKTIG: Mat går ut idag!'
      body = `${expiringToday.length} vara${expiringToday.length > 1 ? 'r' : ''} går ut idag. Spara pengar - använd dem nu! 💰`
    } else if (expiringTomorrow.length > 0) {
      title = '🍳 Planera morgondagens mat!'
      body = `${expiringTomorrow.length} vara${expiringTomorrow.length > 1 ? 'r' : ''} går ut imorgon. Kolla våra receptförslag!`
    } else if (expiringThisWeek.length > 0) {
      title = '📅 Veckans matplanering'
      body = `Du har ${expiringThisWeek.length} varor som går ut denna vecka. Håll koll! 👍`
    } else {
      title = '✅ Allt ser bra ut!'
      body = `Du har ${items.length} varor hemma och inget går ut inom 7 dagar. Bra jobbat! 🎉`
    }
    
    try {
      await this.registration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'daily-summary',
        vibrate: expiringToday.length > 0 ? [200, 100, 200] : [100],
        requireInteraction: expiringToday.length > 0, // Kräv action om kritiskt
        data: {
          type: 'daily-summary',
          expiringToday: expiringToday.length,
          expiringTomorrow: expiringTomorrow.length,
          expiringThisWeek: expiringThisWeek.length
        },
        actions: [
          {
            action: 'open-app',
            title: '👀 Visa mina varor'
          },
          {
            action: 'view-recipes',
            title: '🍳 Se recept'
          }
        ]
      })
    } catch (error) {
      console.error('Fel vid daglig sammanfattning:', error)
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