// Achievements & Badges System - Tier 3.8
// Gamification layer med progression, badges och belöningar

const STORAGE_KEY = 'svinnstop_achievements'

// Badge tiers
export const BADGE_TIERS = {
  BRONZE: { name: 'Brons', color: '#CD7F32', order: 1 },
  SILVER: { name: 'Silver', color: '#C0C0C0', order: 2 },
  GOLD: { name: 'Guld', color: '#FFD700', order: 3 },
  PLATINUM: { name: 'Platinum', color: '#E5E4E2', order: 4 },
  DIAMOND: { name: 'Diamant', color: '#B9F2FF', order: 5 }
}

// Achievement categories
export const CATEGORIES = {
  SAVER: 'Sparare',
  COOK: 'Kock',
  ORGANIZER: 'Organisatör',
  SOCIAL: 'Social',
  STREAK: 'Aktivitet',
  SPECIAL: 'Speciell'
}

// Achievement definitions
export const ACHIEVEMENTS = [
  // === SPARARE KATEGORIN ===
  {
    id: 'first_save',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.BRONZE,
    title: 'Första Räddningen',
    description: 'Rädda din första vara från soptunnan',
    icon: '🎉',
    requirement: 1,
    checkProgress: (data) => data.itemsSaved >= 1,
    getProgress: (data) => ({ current: data.itemsSaved, target: 1 })
  },
  {
    id: 'saver_bronze',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.BRONZE,
    title: 'Brons Räddare',
    description: 'Rädda 10 varor',
    icon: '🥉',
    requirement: 10,
    checkProgress: (data) => data.itemsSaved >= 10,
    getProgress: (data) => ({ current: data.itemsSaved, target: 10 })
  },
  {
    id: 'saver_silver',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.SILVER,
    title: 'Silver Räddare',
    description: 'Rädda 50 varor',
    icon: '🥈',
    requirement: 50,
    checkProgress: (data) => data.itemsSaved >= 50,
    getProgress: (data) => ({ current: data.itemsSaved, target: 50 })
  },
  {
    id: 'saver_gold',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.GOLD,
    title: 'Guld Räddare',
    description: 'Rädda 100 varor',
    icon: '🥇',
    requirement: 100,
    checkProgress: (data) => data.itemsSaved >= 100,
    getProgress: (data) => ({ current: data.itemsSaved, target: 100 })
  },
  {
    id: 'saver_platinum',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.PLATINUM,
    title: 'Platinum Räddare',
    description: 'Rädda 500 varor',
    icon: '💎',
    requirement: 500,
    checkProgress: (data) => data.itemsSaved >= 500,
    getProgress: (data) => ({ current: data.itemsSaved, target: 500 })
  },
  {
    id: 'saver_diamond',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.DIAMOND,
    title: 'Diamant Räddare',
    description: 'Rädda 1000 varor - Legendarisk!',
    icon: '💠',
    requirement: 1000,
    checkProgress: (data) => data.itemsSaved >= 1000,
    getProgress: (data) => ({ current: data.itemsSaved, target: 1000 })
  },

  // === PENGAR KATEGORIN ===
  {
    id: 'money_100',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.BRONZE,
    title: 'Första Hundralappen',
    description: 'Spara 100 kr',
    icon: '💰',
    requirement: 100,
    checkProgress: (data) => data.totalSaved >= 100,
    getProgress: (data) => ({ current: data.totalSaved, target: 100 })
  },
  {
    id: 'money_500',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.SILVER,
    title: 'Femhundra Klubben',
    description: 'Spara 500 kr',
    icon: '💵',
    requirement: 500,
    checkProgress: (data) => data.totalSaved >= 500,
    getProgress: (data) => ({ current: data.totalSaved, target: 500 })
  },
  {
    id: 'money_1000',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.GOLD,
    title: 'Tusenlappen',
    description: 'Spara 1000 kr',
    icon: '💸',
    requirement: 1000,
    checkProgress: (data) => data.totalSaved >= 1000,
    getProgress: (data) => ({ current: data.totalSaved, target: 1000 })
  },
  {
    id: 'money_5000',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.PLATINUM,
    title: 'Sparprofilen',
    description: 'Spara 5000 kr',
    icon: '🏦',
    requirement: 5000,
    checkProgress: (data) => data.totalSaved >= 5000,
    getProgress: (data) => ({ current: data.totalSaved, target: 5000 })
  },
  {
    id: 'money_10000',
    category: CATEGORIES.SAVER,
    tier: BADGE_TIERS.DIAMOND,
    title: 'Spargurun',
    description: 'Spara 10000 kr - Otroligt!',
    icon: '💎',
    requirement: 10000,
    checkProgress: (data) => data.totalSaved >= 10000,
    getProgress: (data) => ({ current: data.totalSaved, target: 10000 })
  },

  // === KOCK KATEGORIN ===
  {
    id: 'cook_bronze',
    category: CATEGORIES.COOK,
    tier: BADGE_TIERS.BRONZE,
    title: 'Nybörjarkock',
    description: 'Laga 5 recept',
    icon: '👨‍🍳',
    requirement: 5,
    checkProgress: (data) => (data.recipesCooked || 0) >= 5,
    getProgress: (data) => ({ current: data.recipesCooked || 0, target: 5 })
  },
  {
    id: 'cook_silver',
    category: CATEGORIES.COOK,
    tier: BADGE_TIERS.SILVER,
    title: 'Hemkock',
    description: 'Laga 25 recept',
    icon: '🍳',
    requirement: 25,
    checkProgress: (data) => (data.recipesCooked || 0) >= 25,
    getProgress: (data) => ({ current: data.recipesCooked || 0, target: 25 })
  },
  {
    id: 'cook_gold',
    category: CATEGORIES.COOK,
    tier: BADGE_TIERS.GOLD,
    title: 'Mästerkock',
    description: 'Laga 100 recept',
    icon: '⭐',
    requirement: 100,
    checkProgress: (data) => (data.recipesCooked || 0) >= 100,
    getProgress: (data) => ({ current: data.recipesCooked || 0, target: 100 })
  },

  // === ORGANISATÖR KATEGORIN ===
  {
    id: 'organizer_bronze',
    category: CATEGORIES.ORGANIZER,
    tier: BADGE_TIERS.BRONZE,
    title: 'Organiserad',
    description: 'Håll 20 varor aktiva samtidigt',
    icon: '📋',
    requirement: 20,
    checkProgress: (data) => (data.maxActiveItems || 0) >= 20,
    getProgress: (data) => ({ current: data.maxActiveItems || 0, target: 20 })
  },
  {
    id: 'organizer_silver',
    category: CATEGORIES.ORGANIZER,
    tier: BADGE_TIERS.SILVER,
    title: 'Lagerchef',
    description: 'Håll 50 varor aktiva samtidigt',
    icon: '📦',
    requirement: 50,
    checkProgress: (data) => (data.maxActiveItems || 0) >= 50,
    getProgress: (data) => ({ current: data.maxActiveItems || 0, target: 50 })
  },

  // === STREAK KATEGORIN ===
  {
    id: 'streak_7',
    category: CATEGORIES.STREAK,
    tier: BADGE_TIERS.BRONZE,
    title: 'Veckostreak',
    description: 'Använd appen 7 dagar i rad',
    icon: '🔥',
    requirement: 7,
    checkProgress: (data) => (data.currentStreak || 0) >= 7,
    getProgress: (data) => ({ current: data.currentStreak || 0, target: 7 })
  },
  {
    id: 'streak_30',
    category: CATEGORIES.STREAK,
    tier: BADGE_TIERS.SILVER,
    title: 'Månadsstreak',
    description: 'Använd appen 30 dagar i rad',
    icon: '🔥',
    requirement: 30,
    checkProgress: (data) => (data.currentStreak || 0) >= 30,
    getProgress: (data) => ({ current: data.currentStreak || 0, target: 30 })
  },
  {
    id: 'streak_100',
    category: CATEGORIES.STREAK,
    tier: BADGE_TIERS.GOLD,
    title: 'Hundradagar',
    description: 'Använd appen 100 dagar i rad',
    icon: '🔥',
    requirement: 100,
    checkProgress: (data) => (data.currentStreak || 0) >= 100,
    getProgress: (data) => ({ current: data.currentStreak || 0, target: 100 })
  },
  {
    id: 'streak_365',
    category: CATEGORIES.STREAK,
    tier: BADGE_TIERS.DIAMOND,
    title: 'Årsstreak',
    description: 'Använd appen 365 dagar i rad - Legendarisk dedication!',
    icon: '🏆',
    requirement: 365,
    checkProgress: (data) => (data.currentStreak || 0) >= 365,
    getProgress: (data) => ({ current: data.currentStreak || 0, target: 365 })
  },

  // === SOCIAL KATEGORIN ===
  {
    id: 'social_referral_1',
    category: CATEGORIES.SOCIAL,
    tier: BADGE_TIERS.BRONZE,
    title: 'Vänlig Själ',
    description: 'Bjud in 1 vän',
    icon: '👋',
    requirement: 1,
    checkProgress: (data) => (data.referralsCount || 0) >= 1,
    getProgress: (data) => ({ current: data.referralsCount || 0, target: 1 })
  },
  {
    id: 'social_referral_5',
    category: CATEGORIES.SOCIAL,
    tier: BADGE_TIERS.SILVER,
    title: 'Nätverkare',
    description: 'Bjud in 5 vänner',
    icon: '🤝',
    requirement: 5,
    checkProgress: (data) => (data.referralsCount || 0) >= 5,
    getProgress: (data) => ({ current: data.referralsCount || 0, target: 5 })
  },
  {
    id: 'social_referral_20',
    category: CATEGORIES.SOCIAL,
    tier: BADGE_TIERS.GOLD,
    title: 'Influencer',
    description: 'Bjud in 20 vänner',
    icon: '⭐',
    requirement: 20,
    checkProgress: (data) => (data.referralsCount || 0) >= 20,
    getProgress: (data) => ({ current: data.referralsCount || 0, target: 20 })
  },

  // === SPECIELLA ACHIEVEMENTS ===
  {
    id: 'special_perfectweek',
    category: CATEGORIES.SPECIAL,
    tier: BADGE_TIERS.GOLD,
    title: 'Perfekt Vecka',
    description: 'Noll svinn under en vecka',
    icon: '🌟',
    requirement: 1,
    checkProgress: (data) => data.perfectWeeks >= 1,
    getProgress: (data) => ({ current: data.perfectWeeks || 0, target: 1 })
  },
  {
    id: 'special_earlybird',
    category: CATEGORIES.SPECIAL,
    tier: BADGE_TIERS.SILVER,
    title: 'Morgonpigg',
    description: 'Logga in före kl 06:00',
    icon: '🌅',
    requirement: 1,
    checkProgress: (data) => data.earlyBirdLogins >= 1,
    getProgress: (data) => ({ current: data.earlyBirdLogins || 0, target: 1 })
  },
  {
    id: 'special_nightowl',
    category: CATEGORIES.SPECIAL,
    tier: BADGE_TIERS.SILVER,
    title: 'Nattugglа',
    description: 'Logga in efter kl 23:00',
    icon: '🦉',
    requirement: 1,
    checkProgress: (data) => data.nightOwlLogins >= 1,
    getProgress: (data) => ({ current: data.nightOwlLogins || 0, target: 1 })
  }
]

// Get achievement data from localStorage
export function getAchievementData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('❌ Could not load achievement data:', error)
  }

  // Default structure
  return {
    unlocked: [], // Array of { achievementId, unlockedAt }
    progress: {}, // Track progress för achievements som inte är unlocked än
    stats: {
      itemsSaved: 0,
      totalSaved: 0,
      recipesCooked: 0,
      maxActiveItems: 0,
      currentStreak: 0,
      longestStreak: 0,
      referralsCount: 0,
      perfectWeeks: 0,
      earlyBirdLogins: 0,
      nightOwlLogins: 0,
      lastLoginDate: null
    }
  }
}

// Save achievement data
function saveAchievementData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('❌ Could not save achievement data:', error)
  }
}

// Update stats (called from various places in the app)
export function updateStats(updates) {
  const data = getAchievementData()
  
  // Merge updates
  data.stats = {
    ...data.stats,
    ...updates
  }
  
  // Check for newly unlocked achievements
  checkForNewAchievements(data)
  
  saveAchievementData(data)
  
  return data
}

// Check for newly unlocked achievements
function checkForNewAchievements(data) {
  const newlyUnlocked = []
  
  ACHIEVEMENTS.forEach(achievement => {
    // Skip if already unlocked
    const alreadyUnlocked = data.unlocked.find(u => u.achievementId === achievement.id)
    if (alreadyUnlocked) return
    
    // Check if achievement is now completed
    if (achievement.checkProgress(data.stats)) {
      data.unlocked.push({
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString()
      })
      newlyUnlocked.push(achievement)
    }
  })
  
  return newlyUnlocked
}

// Get all achievements with unlock status
export function getAllAchievements() {
  const data = getAchievementData()
  
  return ACHIEVEMENTS.map(achievement => {
    const unlockInfo = data.unlocked.find(u => u.achievementId === achievement.id)
    const progress = achievement.getProgress(data.stats)
    
    return {
      ...achievement,
      unlocked: !!unlockInfo,
      unlockedAt: unlockInfo?.unlockedAt,
      progress: progress,
      progressPercent: Math.min(100, Math.round((progress.current / progress.target) * 100))
    }
  })
}

// Get achievements by category
export function getAchievementsByCategory(category) {
  return getAllAchievements().filter(a => a.category === category)
}

// Get unlocked achievements count by tier
export function getUnlockedByTier() {
  const achievements = getAllAchievements()
  const result = {}
  
  Object.values(BADGE_TIERS).forEach(tier => {
    const tierAchievements = achievements.filter(a => a.tier.name === tier.name)
    const unlockedCount = tierAchievements.filter(a => a.unlocked).length
    
    result[tier.name] = {
      unlocked: unlockedCount,
      total: tierAchievements.length,
      percentage: Math.round((unlockedCount / tierAchievements.length) * 100)
    }
  })
  
  return result
}

// Get user's achievement score
export function getAchievementScore() {
  const achievements = getAllAchievements()
  
  // Poäng baserat på tier
  const tierScores = {
    [BADGE_TIERS.BRONZE.name]: 10,
    [BADGE_TIERS.SILVER.name]: 25,
    [BADGE_TIERS.GOLD.name]: 50,
    [BADGE_TIERS.PLATINUM.name]: 100,
    [BADGE_TIERS.DIAMOND.name]: 200
  }
  
  let totalScore = 0
  let earnedScore = 0
  
  achievements.forEach(a => {
    const score = tierScores[a.tier.name] || 0
    totalScore += score
    if (a.unlocked) {
      earnedScore += score
    }
  })
  
  return {
    score: earnedScore,
    maxScore: totalScore,
    percentage: Math.round((earnedScore / totalScore) * 100)
  }
}

// Track daily login for streak
export function trackDailyLogin() {
  const data = getAchievementData()
  const today = new Date().toDateString()
  const lastLogin = data.stats.lastLoginDate
  
  if (lastLogin === today) {
    // Already logged in today
    return data
  }
  
  // Check if streak should continue
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  
  if (lastLogin === yesterdayStr) {
    // Continue streak
    data.stats.currentStreak = (data.stats.currentStreak || 0) + 1
  } else {
    // Streak broken, start new
    data.stats.currentStreak = 1
  }
  
  // Update longest streak
  if (data.stats.currentStreak > (data.stats.longestStreak || 0)) {
    data.stats.longestStreak = data.stats.currentStreak
  }
  
  // Check for early bird / night owl
  const hour = new Date().getHours()
  if (hour < 6) {
    data.stats.earlyBirdLogins = (data.stats.earlyBirdLogins || 0) + 1
  } else if (hour >= 23) {
    data.stats.nightOwlLogins = (data.stats.nightOwlLogins || 0) + 1
  }
  
  data.stats.lastLoginDate = today
  
  checkForNewAchievements(data)
  saveAchievementData(data)
  
  return data
}

// Get recently unlocked achievements (last 7 days)
export function getRecentlyUnlocked(days = 7) {
  const data = getAchievementData()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  return data.unlocked
    .filter(u => new Date(u.unlockedAt) >= cutoffDate)
    .map(u => {
      const achievement = ACHIEVEMENTS.find(a => a.id === u.achievementId)
      return {
        ...achievement,
        unlockedAt: u.unlockedAt
      }
    })
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
}

// Export service object
export const achievementService = {
  getAchievementData,
  updateStats,
  getAllAchievements,
  getAchievementsByCategory,
  getUnlockedByTier,
  getAchievementScore,
  trackDailyLogin,
  getRecentlyUnlocked
}
