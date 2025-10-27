// Gamification: Spåra sparade pengar och achievements
const STORAGE_KEY = 'svinnstop_savings_data'

// Genomsnittliga priser per kategori (SEK)
const AVERAGE_PRICES = {
  'mjölkprodukter': 35,
  'kött': 80,
  'fisk': 90,
  'grönsaker': 30,
  'frukt': 40,
  'bröd': 30,
  'pasta': 25,
  'ris': 40,
  'konserver': 20,
  'mejeri': 35,
  'ägg': 45,
  'default': 40 // Standardpris om kategori är okänd
}

// Estimera pris baserat på produktnamn
function estimateProductPrice(productName, quantity = 1) {
  const name = productName.toLowerCase()
  
  // Kött
  if (name.includes('kött') || name.includes('kyckling') || name.includes('fläsk') || 
      name.includes('nöt') || name.includes('korv') || name.includes('bacon')) {
    return AVERAGE_PRICES.kött * quantity
  }
  
  // Fisk
  if (name.includes('fisk') || name.includes('lax') || name.includes('räk') || 
      name.includes('tonfisk')) {
    return AVERAGE_PRICES.fisk * quantity
  }
  
  // Mjölkprodukter
  if (name.includes('mjölk') || name.includes('yoghurt') || name.includes('fil')) {
    return AVERAGE_PRICES.mjölkprodukter * quantity
  }
  
  // Ost
  if (name.includes('ost')) {
    return 60 * quantity
  }
  
  // Ägg
  if (name.includes('ägg')) {
    return AVERAGE_PRICES.ägg * quantity
  }
  
  // Bröd
  if (name.includes('bröd') || name.includes('bulle') || name.includes('limpa')) {
    return AVERAGE_PRICES.bröd * quantity
  }
  
  // Grönsaker
  if (name.includes('tomat') || name.includes('gurka') || name.includes('paprika') ||
      name.includes('sallad') || name.includes('morötter') || name.includes('lök') ||
      name.includes('potatis') || name.includes('broccoli')) {
    return AVERAGE_PRICES.grönsaker * quantity
  }
  
  // Frukt
  if (name.includes('äpple') || name.includes('banan') || name.includes('apelsin') ||
      name.includes('päron') || name.includes('druvor') || name.includes('melon')) {
    return AVERAGE_PRICES.frukt * quantity
  }
  
  // Pasta/Ris
  if (name.includes('pasta') || name.includes('spagetti') || name.includes('makaroner')) {
    return AVERAGE_PRICES.pasta * quantity
  }
  if (name.includes('ris')) {
    return AVERAGE_PRICES.ris * quantity
  }
  
  // Default
  return AVERAGE_PRICES.default * quantity
}

// Hämta sparad data
export function getSavingsData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Kunde inte läsa spardata:', error)
  }
  
  // Default data structure
  return {
    totalSaved: 0,
    itemsSaved: 0,
    currentMonth: {
      saved: 0,
      items: 0,
      month: new Date().getMonth(),
      year: new Date().getFullYear()
    },
    history: [], // Array av månadsdata
    achievements: [],
    lastUpdated: new Date().toISOString()
  }
}

// Spara data
function saveSavingsData(data) {
  try {
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Kunde inte spara spardata:', error)
  }
}

// Registrera att en vara har "räddats" (använd innan utgång)
export function trackItemSaved(item) {
  const data = getSavingsData()
  
  // Estimera värdet
  const estimatedValue = estimateProductPrice(item.name, item.quantity)
  
  // Uppdatera totaler
  data.totalSaved += estimatedValue
  data.itemsSaved += 1
  
  // Uppdatera månadstotaler
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  if (data.currentMonth.month !== currentMonth || data.currentMonth.year !== currentYear) {
    // Ny månad - spara gamla månadens data i history
    data.history.push({...data.currentMonth})
    
    // Återställ månadstotaler
    data.currentMonth = {
      saved: estimatedValue,
      items: 1,
      month: currentMonth,
      year: currentYear
    }
  } else {
    data.currentMonth.saved += estimatedValue
    data.currentMonth.items += 1
  }
  
  // Kontrollera achievements
  checkAchievements(data)
  
  saveSavingsData(data)
  
  return {
    savedAmount: estimatedValue,
    totalSaved: data.totalSaved,
    itemsSaved: data.itemsSaved
  }
}

// Kontrollera och tilldela achievements
function checkAchievements(data) {
  const achievements = [
    {
      id: 'first_save',
      title: '🎉 Första räddningen!',
      description: 'Du räddade din första vara från att slängas',
      condition: () => data.itemsSaved >= 1,
      unlocked: false
    },
    {
      id: 'save_10',
      title: '⭐ 10 varor räddade',
      description: 'Du har räddat 10 varor från soptunnan!',
      condition: () => data.itemsSaved >= 10,
      unlocked: false
    },
    {
      id: 'save_50',
      title: '🏆 Räddnings-hjälte',
      description: '50 varor räddade - Du gör verklig skillnad!',
      condition: () => data.itemsSaved >= 50,
      unlocked: false
    },
    {
      id: 'save_100kr',
      title: '💰 100 kr sparat',
      description: 'Du har sparat 100 kronor från matsvinn!',
      condition: () => data.totalSaved >= 100,
      unlocked: false
    },
    {
      id: 'save_500kr',
      title: '💎 500 kr sparat',
      description: 'Hälften av en månadslön i besparingar!',
      condition: () => data.totalSaved >= 500,
      unlocked: false
    },
    {
      id: 'save_1000kr',
      title: '🌟 1000 kr sparat',
      description: 'Tusen kronor! Du är en mästare på att spara!',
      condition: () => data.totalSaved >= 1000,
      unlocked: false
    },
    {
      id: 'month_warrior',
      title: '📅 Månads-krigare',
      description: 'Räddade minst 10 varor denna månad',
      condition: () => data.currentMonth.items >= 10,
      unlocked: false
    }
  ]
  
  // Kontrollera vilka achievements som är upplåsta
  achievements.forEach(achievement => {
    const alreadyUnlocked = data.achievements.find(a => a.id === achievement.id)
    
    if (!alreadyUnlocked && achievement.condition()) {
      // Nytt achievement!
      data.achievements.push({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date().toISOString()
      })
    }
  })
}

// Hämta alla tillgängliga achievements
export function getAllAchievements() {
  const data = getSavingsData()
  
  const allAchievements = [
    { id: 'first_save', title: '🎉 Första räddningen!', description: 'Rädda din första vara', threshold: 1 },
    { id: 'save_10', title: '⭐ 10 varor räddade', description: 'Rädda 10 varor', threshold: 10 },
    { id: 'save_50', title: '🏆 Räddnings-hjälte', description: 'Rädda 50 varor', threshold: 50 },
    { id: 'save_100kr', title: '💰 100 kr sparat', description: 'Spara 100 kr', threshold: 100 },
    { id: 'save_500kr', title: '💎 500 kr sparat', description: 'Spara 500 kr', threshold: 500 },
    { id: 'save_1000kr', title: '🌟 1000 kr sparat', description: 'Spara 1000 kr', threshold: 1000 },
    { id: 'month_warrior', title: '📅 Månads-krigare', description: 'Rädda 10 varor denna månad', threshold: 10 }
  ]
  
  return allAchievements.map(achievement => {
    const unlocked = data.achievements.find(a => a.id === achievement.id)
    return {
      ...achievement,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt
    }
  })
}

// Återställ all data (för testing)
export function resetSavingsData() {
  localStorage.removeItem(STORAGE_KEY)
}

// Default export object
export const savingsTracker = {
  getSavingsData,
  trackSavedItem: trackItemSaved,
  getAllAchievements,
  resetSavingsData
}
