import { database, auth } from './firebaseConfig'
import { ref, set, get, onValue } from 'firebase/database'

/**
 * User Data Sync Service
 * 
 * Synkar användardata till users/{uid}/ i Firebase för att möjliggöra
 * sömlös synkning mellan olika enheter för samma användare.
 * 
 * Data som synkas:
 * - Inventory (kylskåp)
 * - Shopping list (inköpslista)
 * - Achievements
 * - Settings (inställningar)
 * - Custom expiry rules
 */

// Synka inventory till Firebase
export async function syncInventoryToUser(items) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    console.log('⚠️ User sync: Skipped - user is anonymous or not logged in')
    return
  }

  try {
    const inventoryRef = ref(database, `users/${user.uid}/inventory`)
    const dataWithTimestamp = {
      items: items,
      lastModified: Date.now()
    }
    await set(inventoryRef, dataWithTimestamp)
    console.log('✅ User sync: Inventory synced to cloud', items.length, 'items')
  } catch (error) {
    console.error('❌ User sync: Failed to sync inventory', error)
  }
}

// Hämta inventory från Firebase (en gång)
export async function getInventoryFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const inventoryRef = ref(database, `users/${user.uid}/inventory`)
    const snapshot = await get(inventoryRef)
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      // Ny struktur: { items: [], lastModified: timestamp }
      // Fallback för gammal data (array direkt)
      const items = Array.isArray(data) ? data : (data.items || [])
      const timestamp = data.lastModified || 0
      
      console.log('✅ User sync: Loaded inventory from cloud', items.length, 'items')
      return { items, lastModified: timestamp }
    } else {
      console.log('ℹ️ User sync: No inventory found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load inventory', error)
    return null
  }
}

// Lyssna på inventory-ändringar från Firebase (realtid)
export function listenToUserInventoryChanges(callback) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    console.log('⚠️ User sync: Not listening to inventory - user is anonymous')
    return null
  }

  console.log('👂 User sync: Starting to listen for inventory changes')
  const inventoryRef = ref(database, `users/${user.uid}/inventory`)
  return onValue(inventoryRef, (snap) => {
    const data = snap.val()
    if (data) {
      // Ny struktur: { items: [], lastModified: timestamp }
      // Fallback för gammal data (array direkt)
      const items = Array.isArray(data) ? data : (data.items || [])
      const timestamp = data.lastModified || 0
      
      console.log('✅ User sync: Inventory updated from cloud', items.length, 'items at', new Date(timestamp).toLocaleTimeString())
      callback({ items, lastModified: timestamp })
    } else {
      console.log('⚠️ User sync: No inventory data in cloud')
      callback({ items: [], lastModified: 0 })
    }
  }, (error) => {
    console.error('❌ User sync: Error listening to inventory', error)
  })
}

// Synka shopping list till Firebase
export async function syncShoppingListToUser(shoppingList) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const shoppingRef = ref(database, `users/${user.uid}/shoppingList`)
    const dataWithTimestamp = {
      items: shoppingList,
      lastModified: Date.now()
    }
    await set(shoppingRef, dataWithTimestamp)
    console.log('✅ User sync: Shopping list synced to cloud', shoppingList.length, 'items')
  } catch (error) {
    console.error('❌ User sync: Failed to sync shopping list', error)
  }
}

// Hämta shopping list från Firebase (en gång)
export async function getShoppingListFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const shoppingRef = ref(database, `users/${user.uid}/shoppingList`)
    const snapshot = await get(shoppingRef)
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      const items = Array.isArray(data) ? data : (data.items || [])
      const timestamp = data.lastModified || 0
      
      console.log('✅ User sync: Loaded shopping list from cloud', items.length, 'items')
      return { items, lastModified: timestamp }
    } else {
      console.log('ℹ️ User sync: No shopping list found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load shopping list', error)
    return null
  }
}

// Lyssna på shopping list-ändringar från Firebase (realtid)
export function listenToUserShoppingListChanges(callback) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  console.log('👂 User sync: Starting to listen for shopping list changes')
  const shoppingRef = ref(database, `users/${user.uid}/shoppingList`)
  return onValue(shoppingRef, (snap) => {
    const data = snap.val()
    if (data) {
      const items = Array.isArray(data) ? data : (data.items || [])
      const timestamp = data.lastModified || 0
      
      console.log('✅ User sync: Shopping list updated from cloud', items.length, 'items at', new Date(timestamp).toLocaleTimeString())
      callback({ items, lastModified: timestamp })
    } else {
      console.log('⚠️ User sync: No shopping list data in cloud')
      callback({ items: [], lastModified: 0 })
    }
  }, (error) => {
    console.error('❌ User sync: Error listening to shopping list', error)
  })
}

// Synka achievements till Firebase
export async function syncAchievementsToUser(achievements) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const achievementsRef = ref(database, `users/${user.uid}/achievements`)
    await set(achievementsRef, {
      data: achievements,
      lastModified: Date.now()
    })
    console.log('✅ User sync: Achievements synced to cloud')
  } catch (error) {
    console.error('❌ User sync: Failed to sync achievements', error)
  }
}

// Hämta achievements från Firebase
export async function getAchievementsFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const achievementsRef = ref(database, `users/${user.uid}/achievements`)
    const snapshot = await get(achievementsRef)
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      console.log('✅ User sync: Loaded achievements from cloud')
      return data.data || data
    } else {
      console.log('ℹ️ User sync: No achievements found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load achievements', error)
    return null
  }
}

// Synka settings till Firebase
export async function syncSettingsToUser(settings) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const settingsRef = ref(database, `users/${user.uid}/settings`)
    await set(settingsRef, {
      ...settings,
      lastModified: Date.now()
    })
    console.log('✅ User sync: Settings synced to cloud')
  } catch (error) {
    console.error('❌ User sync: Failed to sync settings', error)
  }
}

// Synka savings/stats till Firebase
export async function syncStatsToUser(stats) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const statsRef = ref(database, `users/${user.uid}/stats`)
    await set(statsRef, {
      ...stats,
      lastModified: Date.now()
    })
    console.log('✅ User sync: Stats synced to cloud')
  } catch (error) {
    console.error('❌ User sync: Failed to sync stats', error)
  }
}

// Hämta savings/stats från Firebase
export async function getStatsFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const statsRef = ref(database, `users/${user.uid}/stats`)
    const snapshot = await get(statsRef)
    
    if (snapshot.exists()) {
      console.log('✅ User sync: Loaded stats from cloud')
      return snapshot.val()
    } else {
      console.log('ℹ️ User sync: No stats found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load stats', error)
    return null
  }
}

// Synka savings (besparingar) till Firebase
export async function syncSavingsToUser(savingsData) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const savingsRef = ref(database, `users/${user.uid}/savings`)
    await set(savingsRef, {
      ...savingsData,
      lastModified: Date.now()
    })
    console.log('✅ User sync: Savings data synced to cloud')
  } catch (error) {
    console.error('❌ User sync: Failed to sync savings data', error)
  }
}

// Hämta savings från Firebase
export async function getSavingsFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const savingsRef = ref(database, `users/${user.uid}/savings`)
    const snapshot = await get(savingsRef)
    
    if (snapshot.exists()) {
      console.log('✅ User sync: Loaded savings from cloud')
      return snapshot.val()
    } else {
      console.log('ℹ️ User sync: No savings found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load savings', error)
    return null
  }
}

// Synka referral data till Firebase
export async function syncReferralDataToUser(referralData) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const referralRef = ref(database, `users/${user.uid}/referralData`)
    await set(referralRef, {
      myCode: referralData.myCode,
      referredBy: referralData.referredBy,
      createdAt: referralData.createdAt,
      lastModified: Date.now()
    })
    console.log('✅ User sync: Referral data synced to cloud')
  } catch (error) {
    console.error('❌ User sync: Failed to sync referral data', error)
  }
}

// Hämta referral data från Firebase
export async function getReferralDataFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const referralRef = ref(database, `users/${user.uid}/referralData`)
    const snapshot = await get(referralRef)
    
    if (snapshot.exists()) {
      console.log('✅ User sync: Loaded referral data from cloud')
      return snapshot.val()
    } else {
      console.log('ℹ️ User sync: No referral data found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load referral data', error)
    return null
  }
}

// Hämta leaderboard profile från Firebase
export async function getProfileFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const profileRef = ref(database, `users/${user.uid}/profile`)
    const snapshot = await get(profileRef)
    
    if (snapshot.exists()) {
      console.log('✅ User sync: Loaded profile from cloud')
      return snapshot.val()
    } else {
      console.log('ℹ️ User sync: No profile found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load profile', error)
    return null
  }
}

// Synka family membership till Firebase
export async function syncFamilyDataToUser(familyData) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const familyRef = ref(database, `users/${user.uid}/familyData`)
    await set(familyRef, {
      ...familyData,
      lastModified: Date.now()
    })
    console.log('✅ User sync: Family data synced to cloud')
  } catch (error) {
    console.error('❌ User sync: Failed to sync family data', error)
  }
}

// Hämta family membership från Firebase
export async function getFamilyDataFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const familyRef = ref(database, `users/${user.uid}/familyData`)
    const snapshot = await get(familyRef)
    
    if (snapshot.exists()) {
      console.log('✅ User sync: Loaded family data from cloud')
      return snapshot.val()
    } else {
      console.log('ℹ️ User sync: No family data found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load family data', error)
    return null
  }
}

// Hämta settings från Firebase
export async function getSettingsFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const settingsRef = ref(database, `users/${user.uid}/settings`)
    const snapshot = await get(settingsRef)
    
    if (snapshot.exists()) {
      console.log('✅ User sync: Loaded settings from cloud')
      return snapshot.val()
    } else {
      console.log('ℹ️ User sync: No settings found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load settings', error)
    return null
  }
}

/**
 * Merge-strategi för att kombinera lokal och cloud data
 * Väljer alltid den nyaste versionen baserat på lastModified timestamp
 */
export function mergeWithTimestamp(localData, cloudData) {
  if (!cloudData) {
    console.log('📊 Merge: Using local data (no cloud data)')
    return { data: localData, source: 'local' }
  }
  
  if (!localData || localData.length === 0) {
    console.log('📊 Merge: Using cloud data (no local data)')
    return { data: cloudData.items, source: 'cloud' }
  }
  
  // Kolla timestamp på localStorage
  const localTimestamp = localStorage.getItem('svinnstop_last_modified') || 0
  const cloudTimestamp = cloudData.lastModified || 0
  
  if (cloudTimestamp > localTimestamp) {
    console.log(`📊 Merge: Using cloud data (cloud: ${new Date(cloudTimestamp).toLocaleString()}, local: ${new Date(parseInt(localTimestamp)).toLocaleString()})`)
    return { data: cloudData.items, source: 'cloud' }
  } else {
    console.log(`📊 Merge: Using local data (cloud: ${new Date(cloudTimestamp).toLocaleString()}, local: ${new Date(parseInt(localTimestamp)).toLocaleString()})`)
    return { data: localData, source: 'local' }
  }
}

/**
 * SECURITY: Synka premium-status till Firebase
 * Premium ska ALDRIG bara finnas i localStorage
 */
export async function syncPremiumToUser(premiumData) {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return
  }

  try {
    const premiumRef = ref(database, `users/${user.uid}/premium`)
    await set(premiumRef, {
      ...premiumData,
      lastModified: Date.now()
    })
    console.log('✅ User sync: Premium data synced to cloud')
  } catch (error) {
    console.error('❌ User sync: Failed to sync premium data', error)
  }
}

/**
 * SECURITY: Hämta premium-status från Firebase
 * Detta är källan till sanning för premium
 */
export async function getPremiumFromUser() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    return null
  }

  try {
    const premiumRef = ref(database, `users/${user.uid}/premium`)
    const snapshot = await get(premiumRef)
    
    if (snapshot.exists()) {
      console.log('✅ User sync: Loaded premium data from cloud')
      return snapshot.val()
    } else {
      console.log('ℹ️ User sync: No premium data found in cloud')
      return null
    }
  } catch (error) {
    console.error('❌ User sync: Failed to load premium data', error)
    return null
  }
}

/**
 * MIGRATION: Migrera localStorage data till Firebase första gången
 * Detta körs när användaren loggar in första gången
 */
export async function migrateLocalStorageToFirebase() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    console.log('⚠️ Migration: Skipping - user is anonymous')
    return
  }

  // Kolla om migration redan är gjord
  const migrationKey = `svinnstop_migration_done_${user.uid}`
  if (localStorage.getItem(migrationKey) === 'true') {
    console.log('ℹ️ Migration: Already done for this user')
    return
  }

  console.log('🔄 Migration: Starting localStorage -> Firebase migration...')

  try {
    // Hämta premium data från localStorage
    const premiumStatus = localStorage.getItem('svinnstop_premium') === 'true'
    const premiumExpiry = localStorage.getItem('svinnstop_premium_expiry')
    
    if (premiumStatus || premiumExpiry) {
      console.log('📦 Migration: Found premium data in localStorage')
      await syncPremiumToUser({
        isPremium: premiumStatus,
        expiryDate: premiumExpiry
      })
    }

    // Hämta achievements från localStorage
    const achievementsJSON = localStorage.getItem('svinnstop_achievements')
    if (achievementsJSON) {
      console.log('📦 Migration: Found achievements in localStorage')
      const achievements = JSON.parse(achievementsJSON)
      await syncAchievementsToUser(achievements)
    }

    // Hämta family data från localStorage
    const familyDataJSON = localStorage.getItem('svinnstop_family_data')
    if (familyDataJSON) {
      try {
        const familyData = JSON.parse(familyDataJSON)
        if (familyData.familyId) {
          console.log('📦 Migration: Found family data in localStorage')
          await syncFamilyDataToUser(familyData)
        }
      } catch (e) {
        console.warn('⚠️ Migration: Could not parse family data')
      }
    }

    // Hämta shopping list från localStorage
    const shoppingListJSON = localStorage.getItem('svinnstop_shopping_list')
    if (shoppingListJSON) {
      try {
        const shoppingList = JSON.parse(shoppingListJSON)
        if (Array.isArray(shoppingList) && shoppingList.length > 0) {
          console.log('📦 Migration: Found shopping list in localStorage')
          await syncShoppingListToUser(shoppingList)
        }
      } catch (e) {
        console.warn('⚠️ Migration: Could not parse shopping list')
      }
    }

    // Hämta savings stats från localStorage
    const savingsJSON = localStorage.getItem('svinnstop_stats')
    if (savingsJSON) {
      try {
        const savings = JSON.parse(savingsJSON)
        console.log('📦 Migration: Found savings stats in localStorage')
        await syncStatsToUser(savings)
      } catch (e) {
        console.warn('⚠️ Migration: Could not parse savings stats')
      }
    }
    
    // Hämta savings data (besparingar)
    const savingsDataJSON = localStorage.getItem('svinnstop_savings_data')
    if (savingsDataJSON) {
      try {
        const savingsData = JSON.parse(savingsDataJSON)
        console.log('📦 Migration: Found savings data in localStorage')
        await syncSavingsToUser(savingsData)
      } catch (e) {
        console.warn('⚠️ Migration: Could not parse savings data')
      }
    }
    
    // Hämta referral data
    const referralJSON = localStorage.getItem('svinnstop_referral_data')
    if (referralJSON) {
      try {
        const referralData = JSON.parse(referralJSON)
        if (referralData.myCode) {
          console.log('📦 Migration: Found referral data in localStorage')
          await syncReferralDataToUser(referralData)
        }
      } catch (e) {
        console.warn('⚠️ Migration: Could not parse referral data')
      }
    }

    // Markera migration som klar
    localStorage.setItem(migrationKey, 'true')
    console.log('✅ Migration: Complete!')

    // SECURITY: Ta bort premium från localStorage efter migration
    localStorage.removeItem('svinnstop_premium')
    localStorage.removeItem('svinnstop_premium_expiry')
    console.log('🔒 Migration: Removed premium data from localStorage')

  } catch (error) {
    console.error('❌ Migration: Failed', error)
  }
}

/**
 * Initial sync när användaren loggar in
 * Laddar data från cloud och mergear med lokal data
 */
export async function performInitialUserSync() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    console.log('⚠️ User sync: Skipping initial sync - user is anonymous')
    return null
  }

  console.log('🔄 User sync: Performing initial sync...')

  try {
    // Först: Migrera localStorage data om det behövs
    await migrateLocalStorageToFirebase()

    // Hämta all data från cloud
    const [cloudInventory, cloudShoppingList, cloudAchievements, cloudSettings, cloudFamilyData, cloudPremium, cloudStats, cloudSavings, cloudReferral, cloudProfile] = await Promise.all([
      getInventoryFromUser(),
      getShoppingListFromUser(),
      getAchievementsFromUser(),
      getSettingsFromUser(),
      getFamilyDataFromUser(),
      getPremiumFromUser(),
      getStatsFromUser(),
      getSavingsFromUser(),
      getReferralDataFromUser(),
      getProfileFromUser()
    ])

    console.log('✅ User sync: Initial sync complete')
    
    return {
      inventory: cloudInventory,
      shoppingList: cloudShoppingList,
      achievements: cloudAchievements,
      settings: cloudSettings,
      familyData: cloudFamilyData,
      premium: cloudPremium,
      stats: cloudStats,
      savings: cloudSavings,
      referral: cloudReferral,
      profile: cloudProfile
    }
  } catch (error) {
    console.error('❌ User sync: Failed to perform initial sync', error)
    return null
  }
}
