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

// SECURITY: ALLTID validera premium från Firebase
// LocalStorage används ENDAST som cache för snabbare UI
export async function isPremiumActiveSecure() {
  const user = auth.currentUser
  if (!user) {
    console.log('⚠️ Premium check: User not logged in')
    return false
  }
  
  try {
    const premiumRef = ref(database, `users/${user.uid}/premium`)
    const snap = await get(premiumRef)
    
    if (!snap.exists()) {
      console.log('ℹ️ Premium check: No premium data in Firebase')
      // Spara negativt resultat till cache
      savePremiumStatus({
        active: false,
        lifetimePremium: false,
        premiumUntil: null,
        source: null,
        stripeCustomerId: null,
        subscriptionId: null
      })
      return false
    }
    
    const serverStatus = snap.val()
    
    // Lifetime premium har alltid access
    if (serverStatus.lifetimePremium) {
      savePremiumStatus({ ...serverStatus, active: true })
      console.log('✅ Premium check: Lifetime premium active')
      return true
    }
    
    // Datum-check för tidsbegränsad premium
    if (serverStatus.premiumUntil) {
      const expiryTime = new Date(serverStatus.premiumUntil).getTime()
      const now = Date.now()
      const isActive = now < expiryTime
      
      // Synka till localStorage cache
      savePremiumStatus({ ...serverStatus, active: isActive })
      
      console.log(`🔒 Premium check: ${isActive ? 'Active' : 'Expired'} (expires: ${new Date(expiryTime).toLocaleDateString()})`)
      return isActive
    }
    
    // Ingen utgång och ingen lifetime = inte aktivt
    console.log('⚠️ Premium check: No valid premium configuration')
    savePremiumStatus({ ...serverStatus, active: false })
    return false
    
  } catch (error) {
    console.error('❌ Premium check: Failed to validate from Firebase', error)
    // SECURITY: Vid fel, använd INTE localStorage - returnera false
    return false
  }
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
export async function deactivatePremium() {
  const status = getPremiumStatus()
  
  // Behåll lifetime om det finns
  if (status.lifetimePremium) {
    console.log('✅ Lifetime premium - kan inte avaktiveras')
    return status
  }
  
  // Om detta var Family Premium, rensa även familjens premium
  if (status.premiumType === 'family') {
    try {
      await removeFamilyPremium()
    } catch (err) {
      console.warn('⚠️ Could not remove family premium:', err)
    }
  }
  
  const updatedStatus = {
    ...status,
    active: false,
    premiumUntil: null,
    premiumType: null,
    lastUpdated: new Date().toISOString()
  }
  
  savePremiumStatus(updatedStatus)
  syncPremiumToFirebase(updatedStatus).catch(err => 
    console.warn('⚠️ Could not sync deactivation to Firebase:', err)
  )
  
  // Rensa family premium cache lokalt
  localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ active: false, timestamp: Date.now() }))
  
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

// Ta bort Family Premium från familjen
async function removeFamilyPremium() {
  const user = auth.currentUser
  if (!user) return
  
  try {
    const { getFamilyData } = await import('./familyService')
    const familyData = getFamilyData()
    
    if (!familyData.familyId) {
      console.log('ℹ️ Not in a family - nothing to remove')
      return
    }
    
    // Kolla att vi är ägaren av family premium
    const familyPremiumRef = ref(database, `families/${familyData.familyId}/premium`)
    const snap = await get(familyPremiumRef)
    
    if (snap.exists()) {
      const familyPremium = snap.val()
      
      // Bara ta bort om vi är ägaren
      if (familyPremium.ownerId === user.uid) {
        await set(familyPremiumRef, {
          active: false,
          premiumType: null,
          premiumUntil: null,
          source: null,
          ownerId: null,
          lastUpdated: new Date().toISOString()
        })
        console.log('👨‍👩‍👧‍👦 Family Premium removed from family')
      } else {
        console.log('ℹ️ Not the family premium owner - not removing')
      }
    }
  } catch (error) {
    console.error('❌ Failed to remove family premium:', error)
  }
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
  return onValue(premiumRef, async (snap) => {
    const premiumData = snap.val()
    
    // Skapa uppdaterad status - hantera både när premium finns och när det tas bort
    const updatedStatus = {
      active: premiumData?.active || false,
      lifetimePremium: premiumData?.lifetimePremium || false,
      premiumUntil: premiumData?.premiumUntil || null,
      source: premiumData?.source || null,
      stripeCustomerId: premiumData?.stripeCustomerId || null,
      subscriptionId: premiumData?.subscriptionId || null,
      premiumType: premiumData?.premiumType || null,
      lastUpdated: premiumData?.lastUpdated || new Date().toISOString()
    }
    
    savePremiumStatus(updatedStatus)
    console.log('✅ Firebase: Premium status updated from server, active:', updatedStatus.active)
    
    // Om premium är avaktiverat, rensa även family premium
    if (!updatedStatus.active) {
      localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ active: false, timestamp: Date.now() }))
      console.log('ℹ️ Premium deactivated - cleared family premium cache')
      
      // Om det var family premium, ta bort från familjen också
      try {
        await removeFamilyPremium()
      } catch (err) {
        console.warn('⚠️ Could not remove family premium on deactivation:', err)
      }
    }
    
    // FIX: Om användaren har Family Premium, synka till familjen (backup om webhook misslyckades)
    if (premiumData?.active && premiumData?.premiumType === 'family') {
      try {
        await propagateFamilyPremiumToFamily(user.uid, premiumData)
      } catch (err) {
        console.warn('⚠️ Could not propagate family premium:', err)
      }
    }
    
    if (callback) {
      callback(updatedStatus)
    }
  })
}

// FIX: Propagera Family Premium till familjen när användaren får det
async function propagateFamilyPremiumToFamily(userId, premiumData) {
  try {
    const { getFamilyData } = await import('./familyService')
    const familyData = getFamilyData()
    
    if (!familyData.familyId) {
      console.log('ℹ️ User has Family Premium but is not in a family yet')
      return
    }
    
    // Kolla om familjen redan har premium
    const familyPremiumRef = ref(database, `families/${familyData.familyId}/premium`)
    const existingPremium = await get(familyPremiumRef)
    
    // Om familjen redan har aktiv premium med samma eller senare utgång, skippa
    if (existingPremium.exists()) {
      const existing = existingPremium.val()
      if (existing.active && existing.premiumUntil >= premiumData.premiumUntil) {
        console.log('ℹ️ Family already has equal or better premium')
        return
      }
    }
    
    // Sätt family premium
    await set(familyPremiumRef, {
      active: true,
      premiumType: 'family',
      premiumUntil: premiumData.premiumUntil,
      source: premiumData.source || 'stripe',
      ownerId: userId,
      lastUpdated: new Date().toISOString()
    })
    
    console.log('✅ Family Premium propagated to family:', familyData.familyId)
  } catch (error) {
    console.error('❌ Failed to propagate family premium:', error)
  }
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
      
      // Firebase tar ALLTID företräde - skriv över localStorage helt
      const syncedStatus = {
        active: firebaseData.active || false,
        lifetimePremium: firebaseData.lifetimePremium || false,
        premiumUntil: firebaseData.premiumUntil || null,
        source: firebaseData.source || null,
        stripeCustomerId: firebaseData.stripeCustomerId || null,
        subscriptionId: firebaseData.subscriptionId || null,
        premiumType: firebaseData.premiumType || null,
        lastUpdated: firebaseData.lastUpdated || null
      }
      
      savePremiumStatus(syncedStatus)
      console.log('✅ Firebase: Premium synced from server, active:', syncedStatus.active)
      
      // Om användaren inte har egen premium, kolla family premium
      if (!syncedStatus.active) {
        await syncFamilyPremiumFromFirebase()
      }
      
      return syncedStatus
    } else {
      // Ingen premium-data i Firebase - kolla family premium istället
      const emptyStatus = {
        active: false,
        lifetimePremium: false,
        premiumUntil: null,
        source: null,
        stripeCustomerId: null,
        subscriptionId: null,
        premiumType: null
      }
      savePremiumStatus(emptyStatus)
      
      // Kolla om familjen har premium
      await syncFamilyPremiumFromFirebase()
      
      console.log('ℹ️ No own premium data in Firebase - checked family premium')
      return emptyStatus
    }
  } catch (error) {
    console.error('❌ Firebase: Failed to sync premium from server', error)
  }
  
  return getPremiumStatus()
}

// Synka family premium från Firebase vid app-start
async function syncFamilyPremiumFromFirebase() {
  try {
    const { getFamilyData } = await import('./familyService')
    const familyData = getFamilyData()
    
    if (!familyData.familyId) {
      // Inte i en familj - rensa cache
      localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ active: false, timestamp: Date.now() }))
      console.log('ℹ️ Not in a family - cleared family premium cache')
      return
    }
    
    // Hämta familjens premium-status från Firebase
    const familyPremiumRef = ref(database, `families/${familyData.familyId}/premium`)
    const familyPremiumSnap = await get(familyPremiumRef)
    
    if (familyPremiumSnap.exists()) {
      const familyPremium = familyPremiumSnap.val()
      
      // Kolla om premium är aktiv och inte utgången
      let isActive = familyPremium.active && familyPremium.premiumType === 'family'
      
      if (isActive && familyPremium.premiumUntil) {
        const expiryTime = new Date(familyPremium.premiumUntil).getTime()
        const now = Date.now()
        if (now >= expiryTime) {
          isActive = false
        }
      }
      
      localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ 
        active: isActive, 
        timestamp: Date.now() 
      }))
      
      if (isActive) {
        console.log('👨‍👩‍👧‍👦 Family Premium synced from Firebase - benefits granted!')
      } else {
        console.log('ℹ️ Family exists but no active family premium')
      }
    } else {
      // Familjen har ingen premium
      localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ active: false, timestamp: Date.now() }))
      console.log('ℹ️ Family has no premium data')
    }
  } catch (error) {
    console.error('❌ Failed to sync family premium from Firebase:', error)
    // Vid fel, sätt cache till false
    localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ active: false, timestamp: Date.now() }))
  }
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
