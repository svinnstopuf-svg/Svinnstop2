// Referral Program Service - Viral Growth Engine
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

// Hämta referral data
export function getReferralData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
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
  
  return defaultData
}

// Spara referral data
function saveReferralData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Kunde inte spara referral data:', error)
  }
}

// Använd en referral kod (när någon ny använder min kod)
export function useReferralCode(code) {
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
  
  // Spara vem som bjöd in mig
  data.referredBy = code.toUpperCase()
  saveReferralData(data)
  
  return { 
    success: true, 
    message: '🎉 Referral kod aktiverad!' 
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

// Default export
export const referralService = {
  getReferralData,
  generateReferralCode,
  useReferralCode,
  registerReferral,
  hasPremium,
  getNextMilestone,
  getShareableContent,
  resetReferralData
}
