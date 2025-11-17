// Service för användardefinierade varor - Självlärande system
// Sparar varor som användaren lägger till manuellt

const STORAGE_KEY = 'svinnstop_user_items'

// Hämta alla användarskapade varor
export function getUserItems() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Kunde inte läsa användarvaror:', error)
  }
  return []
}

// Lägg till en ny användarvara
export function addUserItem(itemData) {
  const items = getUserItems()
  
  // Kolla om varan redan finns (case-insensitive)
  const existingIndex = items.findIndex(item => 
    item.name.toLowerCase() === itemData.name.toLowerCase()
  )
  
  const now = new Date().toISOString()
  
  if (existingIndex >= 0) {
    // Uppdatera befintlig vara
    items[existingIndex] = {
      ...items[existingIndex],
      unit: itemData.unit || items[existingIndex].unit,
      isFood: itemData.isFood,
      category: itemData.category || items[existingIndex].category,
      emoji: itemData.emoji || items[existingIndex].emoji,
      usageCount: (items[existingIndex].usageCount || 0) + 1,
      lastUsedAt: now,
      updatedAt: now
    }
  } else {
    // Lägg till ny vara
    const newItem = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: itemData.name,
      category: itemData.category || 'övrigt',
      emoji: itemData.emoji || (itemData.isFood ? '🍽️' : '📦'),
      unit: itemData.unit || 'st',
      isFood: itemData.isFood || false,
      usageCount: 1,
      createdAt: now,
      lastUsedAt: now,
      updatedAt: now,
      userCreated: true
    }
    items.push(newItem)
  }
  
  // Sortera efter användningsfrekvens
  items.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    return { success: true, items }
  } catch (error) {
    console.error('Kunde inte spara användarvara:', error)
    return { success: false, error: 'Kunde inte spara' }
  }
}

// Sök bland användarvaror
export function searchUserItems(query) {
  if (!query || query.length < 1) return []
  
  const items = getUserItems()
  const searchTerm = query.toLowerCase().trim()
  const results = []
  
  items.forEach(item => {
    const name = item.name.toLowerCase()
    
    // Exakt match
    if (name === searchTerm) {
      results.push({ ...item, score: 100 })
      return
    }
    
    // Börjar med
    if (name.startsWith(searchTerm)) {
      results.push({ ...item, score: 90 })
      return
    }
    
    // Innehåller
    if (name.includes(searchTerm)) {
      results.push({ ...item, score: 70 })
      return
    }
  })
  
  // Sortera efter poäng och användningsfrekvens
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (b.usageCount || 0) - (a.usageCount || 0)
  })
}

// Ta bort en användarvara
export function deleteUserItem(itemId) {
  const items = getUserItems()
  const filtered = items.filter(item => item.id !== itemId)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return { success: true }
  } catch (error) {
    console.error('Kunde inte ta bort användarvara:', error)
    return { success: false, error: 'Kunde inte ta bort' }
  }
}

// Rensa alla användarvaror
export function clearUserItems() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return { success: true }
  } catch (error) {
    console.error('Kunde inte rensa användarvaror:', error)
    return { success: false, error: 'Kunde inte rensa' }
  }
}

// Exportera användarvaror (för Firebase-synk)
export function exportUserItems() {
  return getUserItems()
}

// Importera användarvaror (från Firebase-synk)
export function importUserItems(items) {
  try {
    // Merga med befintliga varor
    const existing = getUserItems()
    const merged = [...existing]
    
    items.forEach(newItem => {
      const existingIndex = merged.findIndex(item => 
        item.name.toLowerCase() === newItem.name.toLowerCase()
      )
      
      if (existingIndex >= 0) {
        // Behåll den med högst användningsfrekvens
        if ((newItem.usageCount || 0) > (merged[existingIndex].usageCount || 0)) {
          merged[existingIndex] = newItem
        }
      } else {
        merged.push(newItem)
      }
    })
    
    // Sortera efter användningsfrekvens
    merged.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return { success: true, items: merged }
  } catch (error) {
    console.error('Kunde inte importera användarvaror:', error)
    return { success: false, error: 'Kunde inte importera' }
  }
}

export const userItemsService = {
  getUserItems,
  addUserItem,
  searchUserItems,
  deleteUserItem,
  clearUserItems,
  exportUserItems,
  importUserItems
}
