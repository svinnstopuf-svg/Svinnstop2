// Service för sparade inköpslistor (templates)
// Låter användare spara och återanvända vanliga inköpslistor

const STORAGE_KEY = 'svinnstop_saved_shopping_lists'

// Hämta alla sparade inköpslistor
export function getSavedShoppingLists() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Kunde inte läsa sparade inköpslistor:', error)
  }
  return []
}

// Spara en ny inköpslista template
export function saveShoppingList(name, items) {
  if (!name || !name.trim()) {
    return { success: false, error: 'Listenamn krävs' }
  }
  
  if (!items || items.length === 0) {
    return { success: false, error: 'Listan måste innehålla minst en vara' }
  }
  
  const lists = getSavedShoppingLists()
  
  // Kolla om namnet redan finns
  const existingIndex = lists.findIndex(list => 
    list.name.toLowerCase() === name.trim().toLowerCase()
  )
  
  const listId = existingIndex >= 0 
    ? lists[existingIndex].id 
    : `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const savedList = {
    id: listId,
    name: name.trim(),
    items: items.map(item => ({
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      unit: item.unit,
      quantity: item.quantity,
      isFood: item.isFood || false
    })),
    savedAt: new Date().toISOString(),
    usageCount: existingIndex >= 0 ? lists[existingIndex].usageCount + 1 : 0
  }
  
  if (existingIndex >= 0) {
    lists[existingIndex] = savedList
  } else {
    lists.push(savedList)
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
    return { 
      success: true, 
      list: savedList,
      isUpdate: existingIndex >= 0
    }
  } catch (error) {
    console.error('Kunde inte spara inköpslista:', error)
    return { success: false, error: 'Kunde inte spara. Försök igen.' }
  }
}

// Ta bort en sparad inköpslista
export function deleteSavedList(listId) {
  const lists = getSavedShoppingLists()
  const filtered = lists.filter(list => list.id !== listId)
  
  if (filtered.length === lists.length) {
    return { success: false, error: 'Lista hittades inte' }
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return { success: true }
  } catch (error) {
    console.error('Kunde inte ta bort lista:', error)
    return { success: false, error: 'Kunde inte ta bort. Försök igen.' }
  }
}

// Uppdatera användningsräknare när en lista används
export function incrementUsageCount(listId) {
  const lists = getSavedShoppingLists()
  const list = lists.find(l => l.id === listId)
  
  if (!list) return
  
  list.usageCount = (list.usageCount || 0) + 1
  list.lastUsedAt = new Date().toISOString()
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  } catch (error) {
    console.error('Kunde inte uppdatera användningsräknare:', error)
  }
}

// Hämta en specifik sparad lista
export function getSavedListById(listId) {
  const lists = getSavedShoppingLists()
  return lists.find(list => list.id === listId)
}

// Export service object
export const shoppingListService = {
  getSavedShoppingLists,
  saveShoppingList,
  deleteSavedList,
  incrementUsageCount,
  getSavedListById
}
