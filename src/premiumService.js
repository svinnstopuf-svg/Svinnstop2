// Premium Service - Centralized Premium Status Management
import { auth, database } from './firebaseConfig'
import { ref, get, set, onValue } from 'firebase/database'

const STORAGE_KEY = 'svinnstop_premium_data'

// Hämta premium-status
export function getPremiumStatus() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      
      // Kontrollera om premium har gått ut
      if (parsed.premiumUntil) {
        const expiryDate = new Date(parsed.premiumUntil)
        const now = new Date()
        
        if (now > expiryDate && !parsed.lifetimePremium) {
          // Premium har gått ut
          parsed.active = false
        } else if (!parsed.lifetimePremium) {
          // Premium är fortfarande aktivt
          parsed.active = true
        }
      }
      
      return {
        active: parsed.lifetimePremium || parsed.active || false,
        lifetimePremium: parsed.lifetimePremium || false,
        premiumUntil: parsed.premiumUntil || null,
        source: parsed.source || 'unknown', // 'referral', 'stripe', 'lifetime'
        stripeCustomerId: parsed.stripeCustomerId || null,
        subscriptionId: parsed.subscriptionId || null
      }
    }
  } catch (error) {
    console.error('❌ Kunde inte läsa premium-status:', error)
  }
  
// Default: ingen premium
  return {
    active: false,
    lifetimePremium: false,
    premiumUntil: null,
    source: null,
    stripeCustomerId: null,
    subscriptionId: null,
    premiumType: null // 'individual' or 'family'
  }
}

// Enkel check om premium är aktivt (synkron - för snabb UI)
export function isPremiumActive() {
  const status = getPremiumStatus()
  return status.active
}

// Server-side premium validation (asynkron - för säkerhet)
export async function isPremiumActiveSecure() {
  // 1. Snabb check från localStorage
  const localStatus = getPremiumStatus()
  
  // 2. Verifiera mot Firebase (server-side truth)
  const user = auth.currentUser
  if (user) {
    try {
      const premiumRef = ref(database, `users/${user.uid}/premium`)
      const snap = await get(premiumRef)
      
      if (snap.exists()) {
        const serverStatus = snap.val()
        
        // Server-side datum-check
        if (serverStatus.premiumUntil && !serverStatus.lifetimePremium) {
          const expiryTime = new Date(serverStatus.premiumUntil).getTime()
          const now = Date.now()
          
          const isActive = now < expiryTime
          
          // Synka tillbaka till localStorage
          if (isActive !== localStatus.active) {
            const updatedStatus = {
              ...localStatus,
              ...serverStatus,
              active: isActive
            }
            savePremiumStatus(updatedStatus)
            console.log(`🔒 SECURITY: Premium status synced from server (${isActive ? 'active' : 'expired'})`)
          }
          
          return isActive
        }
        
        // Lifetime eller ingen utgång
        return serverStatus.active || serverStatus.lifetimePremium || false
      }
    } catch (error) {
      console.error('❌ Failed to check premium from server:', error)
    }
  }
  
  // Fallback till localStorage (offline-mode)
  return localStatus.active
}

// Aktivera premium för X dagar (från referrals)
export function activatePremium(days, source = 'referral') {
  const status = getPremiumStatus()
  
  // Om redan lifetime premium, inget att göra
  if (status.lifetimePremium) {
    console.log('✅ Lifetime premium already active')
    return status
  }
  
  const now = new Date()
  let newExpiryDate
  
  if (status.premiumUntil) {
    // Förläng befintlig premium
    const currentExpiry = new Date(status.premiumUntil)
    // Om nuvarande premium redan har gått ut, starta från idag
    newExpiryDate = currentExpiry > now ? currentExpiry : now
  } else {
    // Ny premium, starta från idag
    newExpiryDate = now
  }
  
  newExpiryDate.setDate(newExpiryDate.getDate() + days)
  
  const updatedStatus = {
    ...status,
    active: true,
    premiumUntil: newExpiryDate.toISOString(),
    source: source,
    lastUpdated: new Date().toISOString()
  }
  
  savePremiumStatus(updatedStatus)
  
  // Synka till Firebase om användare är inloggad
  syncPremiumToFirebase(updatedStatus).catch(err => 
    console.warn('⚠️ Could not sync premium to Firebase:', err)
  )
  
  // Uppdatera annonser (dölj för premium)
  import('./adService')
    .then(adService => adService.refreshAdsOnPremiumChange())
    .catch(err => console.warn('⚠️ Could not refresh ads:', err))
  
  console.log(`✅ Premium aktiverat i ${days} dagar (till ${newExpiryDate.toLocaleDateString('sv-SE')})`)
  
  return updatedStatus
}

// Aktivera lifetime premium (50 referrals)
export function activateLifetimePremium(source = 'referral') {
  const status = getPremiumStatus()
  
  const updatedStatus = {
    ...status,
    active: true,
    lifetimePremium: true,
    premiumUntil: null, // Ingen utgång
    source: source,
    lastUpdated: new Date().toISOString()
  }
  
  savePremiumStatus(updatedStatus)
  
  // Synka till Firebase
  syncPremiumToFirebase(updatedStatus).catch(err => 
    console.warn('⚠️ Could not sync lifetime premium to Firebase:', err)
  )
  
  // Uppdatera annonser (dölj för premium)
  try {
    import('./adService').then(adService => {
      adService.refreshAdsOnPremiumChange()
    })
  } catch (err) {
    console.warn('⚠️ Could not refresh ads:', err)
  }
  
  console.log('✅ Lifetime Premium aktiverat! 🎉')
  
  return updatedStatus
}

// Aktivera premium från Stripe (månadsprenumeration)
export function activateStripePremium(stripeCustomerId, subscriptionId, premiumType = 'individual') {
  const status = getPremiumStatus()
  
  // Stripe prenumerationer är månatliga, sätt 30 dagar framåt
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)
  
  const updatedStatus = {
    ...status,
    active: true,
    premiumUntil: expiryDate.toISOString(),
    source: 'stripe',
    stripeCustomerId: stripeCustomerId,
    subscriptionId: subscriptionId,
    premiumType: premiumType, // 'individual' (29 kr) or 'family' (49 kr)
    lastUpdated: new Date().toISOString()
  }
  
  savePremiumStatus(updatedStatus)
  
  // Synka till Firebase
  syncPremiumToFirebase(updatedStatus).catch(err => 
    console.warn('⚠️ Could not sync Stripe premium to Firebase:', err)
  )
  
  // Uppdatera annonser (dölj för premium)
  try {
    import('./adService').then(adService => {
      adService.refreshAdsOnPremiumChange()
    })
  } catch (err) {
    console.warn('⚠️ Could not refresh ads:', err)
  }
  
  console.log(`✅ Stripe Premium (${premiumType}) aktiverat!`)
  
  return updatedStatus
}

// Förnya Stripe premium (körs när faktura betalas)
export function renewStripePremium() {
  const status = getPremiumStatus()
  
  if (status.source !== 'stripe') {
    console.warn('⚠️ Kan inte förnya premium - inte en Stripe-prenumeration')
    return status
  }
  
  // Förläng med 30 dagar från nuvarande utgång (eller idag om utgången)
  const now = new Date()
  const currentExpiry = status.premiumUntil ? new Date(status.premiumUntil) : now
  const newExpiry = currentExpiry > now ? currentExpiry : now
  newExpiry.setDate(newExpiry.getDate() + 30)
  
  const updatedStatus = {
    ...status,
    active: true,
    premiumUntil: newExpiry.toISOString(),
    lastUpdated: new Date().toISOString()
  }
  
  savePremiumStatus(updatedStatus)
  syncPremiumToFirebase(updatedStatus).catch(err => 
    console.warn('⚠️ Could not sync renewed premium to Firebase:', err)
  )
  
  console.log('✅ Stripe Premium förnyat!')
  
  return updatedStatus
}

// Avaktivera premium (prenumeration avslutad)
export function deactivatePremium() {
  const status = getPremiumStatus()
  
  // Behåll lifetime om det finns
  if (status.lifetimePremium) {
    console.log('✅ Lifetime premium - kan inte avaktiveras')
    return status
  }
  
  const updatedStatus = {
    ...status,
    active: false,
    premiumUntil: null,
    lastUpdated: new Date().toISOString()
  }
  
  savePremiumStatus(updatedStatus)
  syncPremiumToFirebase(updatedStatus).catch(err => 
    console.warn('⚠️ Could not sync deactivation to Firebase:', err)
  )
  
  // Uppdatera annonser (visa för free users)
  try {
    import('./adService').then(adService => {
      adService.refreshAdsOnPremiumChange()
    })
  } catch (err) {
    console.warn('⚠️ Could not refresh ads:', err)
  }
  
  console.log('❌ Premium avaktiverat')
  
  return updatedStatus
}

// Spara premium-status
function savePremiumStatus(status) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status))
  } catch (error) {
    console.error('❌ Kunde inte spara premium-status:', error)
  }
}

// Synka premium till Firebase
export async function syncPremiumToFirebase(status) {
  const user = auth.currentUser
  if (!user) return
  
  try {
    const premiumRef = ref(database, `users/${user.uid}/premium`)
    await set(premiumRef, {
      active: status.active,
      lifetimePremium: status.lifetimePremium || false,
      premiumUntil: status.premiumUntil,
      source: status.source,
      stripeCustomerId: status.stripeCustomerId || null,
      subscriptionId: status.subscriptionId || null,
      premiumType: status.premiumType || null,
      lastUpdated: status.lastUpdated
    })
    
    console.log('✅ Firebase: Premium status synced')
  } catch (error) {
    console.error('❌ Firebase: Failed to sync premium status', error)
  }
}

// Lyssna på premium-ändringar från Firebase (realtid)
export function listenToPremiumChanges(callback) {
  const user = auth.currentUser
  if (!user) return null
  
  const premiumRef = ref(database, `users/${user.uid}/premium`)
  return onValue(premiumRef, (snap) => {
    const premiumData = snap.val()
    if (premiumData) {
      // Uppdatera localStorage
      const currentStatus = getPremiumStatus()
      const updatedStatus = {
        ...currentStatus,
        ...premiumData
      }
      savePremiumStatus(updatedStatus)
      
      console.log('✅ Firebase: Premium status updated from server')
      
      if (callback) {
        callback(updatedStatus)
      }
    }
  })
}

// Lyssna på family premium-ändringar från Firebase (realtid)
export async function listenToFamilyPremiumChanges(callback) {
  try {
    // Import getFamilyData dynamically to avoid circular dependency
    const { getFamilyData } = await import('./familyService')
    const familyData = getFamilyData()
    
    if (!familyData.familyId) {
      console.log('ℹ️ Not in a family - cannot listen to family premium')
      return null
    }
    
    const familyPremiumRef = ref(database, `families/${familyData.familyId}/premium`)
    return onValue(familyPremiumRef, (snap) => {
      const familyPremium = snap.val()
      
      // Update localStorage cache
      const cache = {
        active: familyPremium?.active && familyPremium?.premiumType === 'family' || false,
        timestamp: Date.now()
      }
      
      // Check expiry if exists
      if (familyPremium?.premiumUntil) {
        const expiryTime = new Date(familyPremium.premiumUntil).getTime()
        const now = Date.now()
        if (now >= expiryTime) {
          cache.active = false
        }
      }
      
      localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify(cache))
      
      if (cache.active) {
        console.log('👨‍👩‍👧‍👦 Firebase: Family Premium activated - benefits granted')
      } else {
        console.log('ℹ️ Firebase: Family Premium deactivated or expired')
      }
      
      if (callback) {
        callback({
          hasBenefits: cache.active,
          source: cache.active ? 'family' : null,
          type: cache.active ? 'family' : null
        })
      }
    })
  } catch (error) {
    console.error('❌ Failed to setup family premium listener:', error)
    return null
  }
}

// Kontrollera och synka premium från Firebase vid app-start
export async function syncPremiumFromFirebase() {
  const user = auth.currentUser
  if (!user) return getPremiumStatus()
  
  try {
    const premiumRef = ref(database, `users/${user.uid}/premium`)
    const snap = await get(premiumRef)
    
    if (snap.exists()) {
      const firebaseData = snap.val()
      
      // Merge med localStorage (Firebase tar företräde)
      const localStatus = getPremiumStatus()
      const mergedStatus = {
        ...localStatus,
        ...firebaseData
      }
      
      savePremiumStatus(mergedStatus)
      console.log('✅ Firebase: Premium synced from server')
      
      return mergedStatus
    }
  } catch (error) {
    console.error('❌ Firebase: Failed to sync premium from server', error)
  }
  
  return getPremiumStatus()
}

// Check premium expiry (körs vid app-start)
export function checkPremiumExpiry() {
  const status = getPremiumStatus()
  
  if (status.lifetimePremium) {
    return status // Lifetime aldrig går ut
  }
  
  if (status.premiumUntil) {
    const expiryDate = new Date(status.premiumUntil)
    const now = new Date()
    
    if (now > expiryDate) {
      console.log('⏰ Premium har gått ut')
      // Avaktivera om det inte är en Stripe-prenumeration (den förnyas automatiskt)
      if (status.source !== 'stripe') {
        return deactivatePremium()
      }
    }
  }
  
  return status
}

// Få antal dagar kvar av premium
export function getDaysLeftOfPremium() {
  const status = getPremiumStatus()
  
  if (status.lifetimePremium) {
    return Infinity // Oändligt
  }
  
  if (!status.active || !status.premiumUntil) {
    return 0
  }
  
  const expiryDate = new Date(status.premiumUntil)
  const now = new Date()
  const diffTime = expiryDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

// Check if user or their family has premium (Netflix model)
export async function hasFamilyPremiumBenefits() {
  // First check own premium
  if (isPremiumActive()) {
    const status = getPremiumStatus()
    return {
      hasBenefits: true,
      source: 'own',
      type: status.premiumType || 'individual'
    }
  }
  
  // Check if user is in a family and if family has Family Premium
  try {
    // Import getFamilyData dynamically to avoid circular dependency
    const { getFamilyData } = await import('./familyService')
    const familyData = getFamilyData()
    
    if (!familyData.familyId) {
      // Not in a family
      return {
        hasBenefits: false,
        source: null,
        type: null
      }
    }
    
    // Check if family itself has premium flag (set when owner buys Family Premium)
    const familyPremiumRef = ref(database, `families/${familyData.familyId}/premium`)
    const familyPremiumSnap = await get(familyPremiumRef)
    
    if (familyPremiumSnap.exists()) {
      const familyPremium = familyPremiumSnap.val()
      
      // Check if premium is active and not expired
      if (familyPremium.active && familyPremium.premiumType === 'family') {
        // Check expiry
        if (familyPremium.premiumUntil) {
          const expiryTime = new Date(familyPremium.premiumUntil).getTime()
          const now = Date.now()
          
          if (now < expiryTime) {
            return {
              hasBenefits: true,
              source: 'family',
              type: 'family'
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to check family premium:', error)
  }
  
  return {
    hasBenefits: false,
    source: null,
    type: null
  }
}

// Synchronous version for quick UI checks
export function hasFamilyPremiumBenefitsSync() {
  // First check own premium
  if (isPremiumActive()) {
    const status = getPremiumStatus()
    return {
      hasBenefits: true,
      source: 'own',
      type: status.premiumType || 'individual'
    }
  }
  
  // Check localStorage cache for family premium
  try {
    const familyPremiumCache = localStorage.getItem('svinnstop_family_premium_cache')
    if (familyPremiumCache) {
      const cache = JSON.parse(familyPremiumCache)
      const now = Date.now()
      
      // Cache valid for 5 minutes
      if (cache.timestamp && (now - cache.timestamp) < 5 * 60 * 1000) {
        if (cache.active) {
          return {
            hasBenefits: true,
            source: 'family',
            type: 'family'
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to read family premium cache:', error)
  }
  
  return {
    hasBenefits: false,
    source: null,
    type: null
  }
}

// Export service object
export const premiumService = {
  getPremiumStatus,
  isPremiumActive,
  isPremiumActiveSecure,
  activatePremium,
  activateLifetimePremium,
  activateStripePremium,
  renewStripePremium,
  deactivatePremium,
  syncPremiumToFirebase,
  listenToPremiumChanges,
  listenToFamilyPremiumChanges,
  syncPremiumFromFirebase,
  checkPremiumExpiry,
  getDaysLeftOfPremium,
  hasFamilyPremiumBenefits,
  hasFamilyPremiumBenefitsSync
}
