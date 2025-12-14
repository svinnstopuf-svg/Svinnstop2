// Referral Program Service - Viral Growth Engine
import { database, auth } from './firebaseConfig'
import { ref, set, get, onValue, update } from 'firebase/database'

const STORAGE_KEY = 'svinnstop_referral_data'

// Belöningsstruktur
const REWARDS = {
  1: { type: 'premium_days', value: 7, label: '1 vecka Premium gratis' },
  3: { type: 'premium_days', value: 30, label: '1 månad Premium gratis' },
  10: { type: 'premium_days', value: 90, label: '3 månader Premium gratis' },
  50: { type: 'premium_days', value: 'lifetime', label: 'Livstids Premium gratis' }
}

// Generera unik referral kod
export function generateReferralCode(userId) {
  if (!userId) {
    // Om ingen userId finns, generera en baserat på timestamp + random
    userId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }
  
  // Skapa kort, delbar kod (8 tecken)
  const code = userId.toString().substr(0, 4).toUpperCase() + 
               Math.random().toString(36).substr(2, 4).toUpperCase()
  
  return code
}

// Synka referral-kod till Firebase
export async function syncReferralCodeToFirebase() {
  const user = auth.currentUser
  if (!user) return

  const data = getReferralData()
  
  try {
    // Spara min referral-kod i Firebase
    const codeRef = ref(database, `referralCodes/${data.myCode}`)
    await set(codeRef, {
      userId: user.uid,
      code: data.myCode,
      createdAt: data.createdAt
    })
    
    // Spara min user-data
    const userRef = ref(database, `users/${user.uid}/referralData`)
    await set(userRef, {
      myCode: data.myCode,
      createdAt: data.createdAt
    })
    
    console.log('✅ Firebase: Referral code synced', data.myCode)
  } catch (error) {
    console.error('❌ Firebase: Failed to sync referral code', error)
  }
}

// Lyssna på referrals i realtid
export function listenToReferrals(callback) {
  const user = auth.currentUser
  if (!user) return null

  const referralsRef = ref(database, `users/${user.uid}/referrals`)
  return onValue(referralsRef, (snap) => {
    const referralsObj = snap.val() || {}
    const referrals = Object.values(referralsObj)
    console.log('✅ Firebase: Referrals updated', referrals.length)
    
    if (callback) {
      callback(referrals)
    }
  })
}

// Hämta referral data
export function getReferralData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      // Synka från Firebase i bakgrunden
      syncFromFirebase()
      return parsed
    }
  } catch (error) {
    console.error('Kunde inte läsa referral data:', error)
  }
  
  // Default structure - skapa och spara direkt
  const defaultData = {
    myCode: generateReferralCode(),
    referredBy: null, // Kod från personen som bjöd in mig
    referrals: [], // Personer jag har bjudit in
    rewards: [], // Belöningar jag har tjänat
    premiumUntil: null, // När min premium går ut (null = ingen premium)
    lifetimePremium: false,
    createdAt: new Date().toISOString()
  }
  
  // Spara direkt så koden inte ändras vid refresh
  saveReferralData(defaultData)
  
  // Synka till Firebase
  syncReferralCodeToFirebase().catch(err => 
    console.warn('Could not sync referral code:', err)
  )
  
  return defaultData
}

// Synka referrals och rewards från Firebase
async function syncFromFirebase() {
  const user = auth.currentUser
  if (!user) return
  
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    
    // Hämta referrals från Firebase
    const referralsSnap = await get(ref(database, `users/${user.uid}/referrals`))
    const referralsObj = referralsSnap.val() || {}
    const firebaseReferrals = Object.values(referralsObj)
    
    // Räkna BARA aktiva referrals (pending räknas inte)
    const activeReferrals = firebaseReferrals.filter(r => r.status === 'active')
    
    // Hämta rewards från Firebase  
    const rewardsSnap = await get(ref(database, `users/${user.uid}/rewards`))
    const rewardsObj = rewardsSnap.val() || {}
    const firebaseRewards = Object.values(rewardsObj)
    
    // Hämta premium status från Firebase
    const premiumSnap = await get(ref(database, `users/${user.uid}/premium`))
    const premiumData = premiumSnap.val() || {}
    
    // Uppdatera data om det finns skillnader (använd BARA aktiva referrals)
    const referralCount = activeReferrals.length
    
    // Kolla om vi behöver lägga till nya belöningar
    if (REWARDS[referralCount] && !firebaseRewards.find(r => r.referralCount === referralCount)) {
      const reward = REWARDS[referralCount]
      const rewardData = {
        type: reward.type,
        value: reward.value,
        label: reward.label,
        earnedAt: new Date().toISOString(),
        referralCount: referralCount
      }
      
      // Spara belöningen till Firebase
      const rewardRef = ref(database, `users/${user.uid}/rewards/${referralCount}`)
      await set(rewardRef, rewardData)
      
      // Uppdatera premium status
      const premiumRef = ref(database, `users/${user.uid}/premium`)
      if (reward.value === 'lifetime') {
        await set(premiumRef, {
          lifetimePremium: true,
          premiumUntil: null,
          premiumType: 'individual', // Referral premium = Individual
          source: 'referral'
        })
      } else {
        const today = new Date()
        const currentPremiumDate = premiumData.premiumUntil ? new Date(premiumData.premiumUntil) : today
        const newPremiumDate = currentPremiumDate > today ? currentPremiumDate : today
        newPremiumDate.setDate(newPremiumDate.getDate() + reward.value)
        
        await set(premiumRef, {
          lifetimePremium: premiumData.lifetimePremium || false,
          premiumUntil: newPremiumDate.toISOString(),
          premiumType: 'individual', // Referral premium = Individual
          source: 'referral'
        })
      }
      
      console.log('✅ Firebase: Reward auto-granted', reward.label)
      
      // Hämta uppdaterad rewards
      const updatedRewardsSnap = await get(ref(database, `users/${user.uid}/rewards`))
      const updatedRewardsObj = updatedRewardsSnap.val() || {}
      firebaseRewards.push(...Object.values(updatedRewardsObj).filter(r => r.referralCount === referralCount))
      
      // Hämta uppdaterad premium
      const updatedPremiumSnap = await get(ref(database, `users/${user.uid}/premium`))
      const updatedPremiumData = updatedPremiumSnap.val() || {}
      Object.assign(premiumData, updatedPremiumData)
    }
    
    // Uppdatera localStorage (spara ALLA referrals men visa status)
    data.referrals = firebaseReferrals
    data.activeReferrals = activeReferrals.length
    data.rewards = firebaseRewards
    data.lifetimePremium = premiumData.lifetimePremium || false
    data.premiumUntil = premiumData.premiumUntil || null
    
    saveReferralData(data)
    console.log('✅ Firebase: Referral data synced', activeReferrals.length, 'active /', firebaseReferrals.length, 'total referrals,', firebaseRewards.length, 'rewards')
  } catch (error) {
    console.error('❌ Firebase: Failed to sync referral data', error)
  }
}

// Spara referral data
function saveReferralData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Kunde inte spara referral data:', error)
  }
}

// Använd en referral kod (när någon ny använder min kod) - Firebase version
export async function useReferralCode(code) {
  if (!code || typeof code !== 'string') {
    return { success: false, error: 'Ogiltig kod' }
  }
  
  const data = getReferralData()
  
  // Kolla om användaren redan har använt en kod
  if (data.referredBy) {
    return { 
      success: false, 
      error: 'Du har redan använt en referral kod',
      alreadyUsed: true
    }
  }
  
  // Kolla så man inte använder sin egen kod
  if (code.toUpperCase() === data.myCode.toUpperCase()) {
    return { 
      success: false, 
      error: 'Du kan inte använda din egen referral kod' 
    }
  }
  
  // Validera koden mot Firebase
  const user = auth.currentUser
  if (!user) {
    return { success: false, error: 'Du måste vara inloggad' }
  }

  try {
    const codeRef = ref(database, `referralCodes/${code.toUpperCase()}`)
    const codeSnap = await get(codeRef)
    
    if (!codeSnap.exists()) {
      return { success: false, error: 'Ogiltig referral kod' }
    }
    
    const referrerUserId = codeSnap.val().userId
    
    // Lägg till mig som referral hos referrer (PENDING status)
    const referralRef = ref(database, `users/${referrerUserId}/referrals/${user.uid}`)
    await set(referralRef, {
      userId: user.uid,
      joinedAt: new Date().toISOString(),
      status: 'pending', // ⚠️ Pending tills användaren är aktiv
      itemsAdded: 0,
      daysActive: 0,
      appOpens: 0,
      lastActiveDate: new Date().toISOString()
    })
    
    // Spara vem som bjöd in mig
    const myUserRef = ref(database, `users/${user.uid}/referredBy`)
    await set(myUserRef, code.toUpperCase())
    
    console.log('✅ Firebase: Referral code used (pending verification)')
    
    // Spara lokalt också
    data.referredBy = code.toUpperCase()
    saveReferralData(data)
    
    return { 
      success: true, 
      message: '🎉 Referral kod aktiverad! Använd appen för att verifiera.' 
    }
  } catch (error) {
    console.error('❌ Firebase: Failed to use referral code', error)
    return { success: false, error: 'Kunde inte använda referral kod' }
  }
}

// Registrera en ny referral (när någon använder MIN kod)
export function registerReferral(referredUserCode) {
  const data = getReferralData()
  
  // Lägg till i min lista
  const referral = {
    code: referredUserCode,
    joinedAt: new Date().toISOString(),
    status: 'active'
  }
  
  data.referrals.push(referral)
  
  // Uppdatera achievement stats
  const referralCount = data.referrals.length
  try {
    // Import achievementService dynamiskt för att undvika circular dependencies
    import('./achievementService.js').then(({ achievementService }) => {
      achievementService.updateStats({
        referralsCount: referralCount
      })
    })
  } catch (error) {
    console.warn('Could not update achievement stats:', error)
  }
  
  if (REWARDS[referralCount]) {
    const reward = REWARDS[referralCount]
    
    // Lägg till belöning
    const newReward = {
      ...reward,
      earnedAt: new Date().toISOString(),
      referralCount: referralCount
    }
    
    data.rewards.push(newReward)
    
    // Aktivera premium
    if (reward.value === 'lifetime') {
      data.lifetimePremium = true
      data.premiumUntil = null
    } else {
      // Lägg till dagar till premium
      const today = new Date()
      const currentPremium = data.premiumUntil ? new Date(data.premiumUntil) : today
      const newPremiumDate = currentPremium > today ? currentPremium : today
      newPremiumDate.setDate(newPremiumDate.getDate() + reward.value)
      data.premiumUntil = newPremiumDate.toISOString()
    }
    
    saveReferralData(data)
    
    return {
      success: true,
      milestone: true,
      reward: newReward,
      referralCount: referralCount
    }
  }
  
  saveReferralData(data)
  
  return {
    success: true,
    milestone: false,
    referralCount: referralCount
  }
}

// Kontrollera om användaren har Premium
export function hasPremium() {
  const data = getReferralData()
  
  if (data.lifetimePremium) {
    return true
  }
  
  if (data.premiumUntil) {
    const premiumDate = new Date(data.premiumUntil)
    const today = new Date()
    return premiumDate > today
  }
  
  return false
}

// Hämta nästa milestone
export function getNextMilestone(currentCount) {
  const milestones = Object.keys(REWARDS).map(Number).sort((a, b) => a - b)
  
  for (const milestone of milestones) {
    if (currentCount < milestone) {
      return {
        count: milestone,
        reward: REWARDS[milestone],
        remaining: milestone - currentCount
      }
    }
  }
  
  return null // Användaren har nått alla milestones
}

// Verifiera referral baserat på aktivitet
export async function verifyReferralActivity() {
  const user = auth.currentUser
  if (!user) return
  
  const data = getReferralData()
  if (!data.referredBy) return // Ingen som bjöd in mig
  
  try {
    // Hämta aktivitetsdata från Firebase (SECURITY FIX)
    const activityData = await verifyActivityFromFirebase()
    
    // Aktivitetskrav för verifiering:
    // 1. Minst 3 varor tillagda
    // 2. Minst 2 olika dagar aktiv
    // 3. Minst 3 app-öppningar
    const meetsRequirements = 
      activityData.itemsAdded >= 3 &&
      activityData.daysActive >= 2 &&
      activityData.appOpens >= 3
    
    if (!meetsRequirements) {
      console.log('⏳ Referral not yet verified - needs more activity')
      return
    }
    
    // Hämta vem som bjöd in mig
    const referrerCodeSnap = await get(ref(database, `referralCodes/${data.referredBy}`))
    if (!referrerCodeSnap.exists()) return
    
    const referrerUserId = referrerCodeSnap.val().userId
    
    // Hämta min referral-status hos referrer
    const myReferralRef = ref(database, `users/${referrerUserId}/referrals/${user.uid}`)
    const myReferralSnap = await get(myReferralRef)
    
    if (!myReferralSnap.exists()) return
    
    const myReferralData = myReferralSnap.val()
    
    // Om redan aktiv, gör inget
    if (myReferralData.status === 'active') {
      console.log('✅ Referral already verified')
      return
    }
    
    // Verifiera!
    await update(myReferralRef, {
      status: 'active', // ✅ NU räknas den!
      verifiedAt: new Date().toISOString(),
      itemsAdded: activityData.itemsAdded,
      daysActive: activityData.daysActive,
      appOpens: activityData.appOpens
    })
    
    console.log('✅ Referral verified! Referrer will get their reward.')
    
    // Triggera reward-check för referrer (görs automatiskt via syncFromFirebase)
    
  } catch (error) {
    console.error('❌ Failed to verify referral:', error)
  }
}

// Spåra användaraktivitet
const ACTIVITY_STORAGE_KEY = 'svinnstop_activity_data'

export function getActivityData() {
  try {
    const data = localStorage.getItem(ACTIVITY_STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to read activity data:', error)
  }
  
  return {
    itemsAdded: 0,
    daysActive: 0,
    appOpens: 0,
    lastActiveDate: null,
    activeDates: [] // Array av datum-strängar
  }
}

function saveActivityData(data) {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save activity data:', error)
  }
}

// Spåra när användaren lägger till vara
export function trackItemAdded() {
  const data = getActivityData()
  data.itemsAdded += 1
  saveActivityData(data)
  
  // Sync to Firebase (SECURITY FIX)
  syncActivityToFirebase(data).catch(err => 
    console.warn('Could not sync activity to Firebase:', err)
  )
  
  // Kolla om vi nu uppfyller kraven
  verifyReferralActivity().catch(err => 
    console.warn('Could not verify referral:', err)
  )
  
  console.log(`📊 Activity: ${data.itemsAdded} items added`)
}

// Spåra app-öppning
export function trackAppOpen() {
  const data = getActivityData()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  data.appOpens += 1
  
  // Kolla om det är en ny dag
  if (!data.activeDates.includes(today)) {
    data.activeDates.push(today)
    data.daysActive = data.activeDates.length
    data.lastActiveDate = today
  }
  
  saveActivityData(data)
  
  // Sync to Firebase (SECURITY FIX)
  syncActivityToFirebase(data).catch(err => 
    console.warn('Could not sync activity to Firebase:', err)
  )
  
  // Kolla om vi nu uppfyller kraven
  verifyReferralActivity().catch(err => 
    console.warn('Could not verify referral:', err)
  )
  
  console.log(`📊 Activity: ${data.appOpens} opens, ${data.daysActive} days active`)
}

// Sync activity to Firebase (SECURITY FIX)
async function syncActivityToFirebase(activityData) {
  const user = auth.currentUser
  if (!user) return
  
  try {
    const activityRef = ref(database, `users/${user.uid}/activity`)
    await set(activityRef, {
      itemsAdded: activityData.itemsAdded,
      daysActive: activityData.daysActive,
      appOpens: activityData.appOpens,
      lastActiveDate: activityData.lastActiveDate,
      activeDates: activityData.activeDates,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to sync activity to Firebase:', error)
  }
}

// Verify activity from Firebase (SECURITY FIX)
export async function verifyActivityFromFirebase() {
  const user = auth.currentUser
  if (!user) return getActivityData()
  
  try {
    const activityRef = ref(database, `users/${user.uid}/activity`)
    const snap = await get(activityRef)
    
    if (snap.exists()) {
      const serverActivity = snap.val()
      
      // Merge med localStorage (Firebase tar företräde)
      const localActivity = getActivityData()
      const mergedActivity = {
        itemsAdded: Math.max(serverActivity.itemsAdded || 0, localActivity.itemsAdded),
        daysActive: Math.max(serverActivity.daysActive || 0, localActivity.daysActive),
        appOpens: Math.max(serverActivity.appOpens || 0, localActivity.appOpens),
        lastActiveDate: serverActivity.lastActiveDate || localActivity.lastActiveDate,
        activeDates: [...new Set([...(serverActivity.activeDates || []), ...(localActivity.activeDates || [])])]
      }
      
      saveActivityData(mergedActivity)
      console.log('🔒 SECURITY: Activity verified from Firebase')
      
      return mergedActivity
    }
  } catch (error) {
    console.error('❌ Failed to verify activity from Firebase:', error)
  }
  
  return getActivityData()
}

// Hämta delbar länk/text
export function getShareableContent() {
  const data = getReferralData()
  const code = data.myCode
  
  // I produktion skulle detta vara din riktiga app-URL
  const appUrl = window.location.origin
  const referralUrl = `${appUrl}?ref=${code}`
  
  const shareText = `🍽️ Sluta svinnet & spara pengar med Svinnstop! 

Använd min kod: ${code}
${referralUrl}

Belöningar:
✨ 1 vän = 1 vecka Premium
🎁 3 vänner = 1 månad Premium  
🏆 10 vänner = 3 månader Premium
💎 50 vänner = LIVSTIDS Premium!`

  return {
    code,
    url: referralUrl,
    text: shareText
  }
}

// Återställ data (för testing)
export function resetReferralData() {
  localStorage.removeItem(STORAGE_KEY)
}

// Reset activity data (för testing)
export function resetActivityData() {
  localStorage.removeItem(ACTIVITY_STORAGE_KEY)
}

// Default export
export const referralService = {
  getReferralData,
  generateReferralCode,
  useReferralCode,
  registerReferral,
  hasPremium,
  getNextMilestone,
  getShareableContent,
  resetReferralData,
  syncReferralCodeToFirebase,
  listenToReferrals,
  // Activity tracking
  trackItemAdded,
  trackAppOpen,
  getActivityData,
  verifyReferralActivity,
  verifyActivityFromFirebase,
  resetActivityData
}
