// Sorteringsverktyg för varor i kylskåp och inköpslista
// Sorterar efter: 1. Kategori, 2. Alfabetisk ordning

// Kategoriordning (högre prioritet först)
const CATEGORY_ORDER = {
  // Nya huvudkategorier
  'färskvaror': 1,
  'frukt_gront': 2,
  'skafferi': 3,
  'fryst': 4,
  'brod_bageri': 5,
  'dryck': 6,
  
  // Gamla kategorier (för bakåtkompatibilitet)
  'frukt': 2,
  'grönsak': 2,
  'kött': 1,
  'fisk': 1,
  'mejeri': 1,
  'ägg': 1,
  'bröd': 5,
  'spannmål': 3,
  'pasta': 3,
  'ris': 3,
  'konserv': 3,
  'krydda': 3,
  'sås': 3,
  'olja': 3,
  'snacks': 3,
  'godis': 3,
  'mat': 3, // Generisk mat-kategori
  
  // Icke-matvaror (lägre prioritet)
  'hem': 50,
  'personvård': 51,
  'husdjur': 52,
  'baby': 53,
  'övrigt': 99
}

// Hämta kategoriprioritet
function getCategoryPriority(category) {
  if (!category) return 99
  const categoryLower = category.toLowerCase()
  return CATEGORY_ORDER[categoryLower] ?? 99
}

// Sortera varor efter kategori och alfabetisk ordning
export function sortItemsByCategory(items) {
  if (!Array.isArray(items)) return []
  
  return [...items].sort((a, b) => {
    // 1. Sortera efter kategori
    const categoryA = getCategoryPriority(a.category)
    const categoryB = getCategoryPriority(b.category)
    
    if (categoryA !== categoryB) {
      return categoryA - categoryB
    }
    
    // 2. Inom samma kategori, sortera alfabetiskt efter namn
    const nameA = (a.name || '').toLowerCase()
    const nameB = (b.name || '').toLowerCase()
    
    return nameA.localeCompare(nameB, 'sv')
  })
}

// Sortera inköpslista (completed items sist)
export function sortShoppingItems(items) {
  if (!Array.isArray(items)) return []
  
  // Dela upp i completed och active
  const active = items.filter(item => !item.completed)
  const completed = items.filter(item => item.completed)
  
  // Sortera båda grupperna efter kategori och alfabetisk ordning
  const sortedActive = sortItemsByCategory(active)
  const sortedCompleted = sortItemsByCategory(completed)
  
  // Returnera active först, sedan completed
  return [...sortedActive, ...sortedCompleted]
}

// Sortera kylskåpsvaror efter kategori och utgångsdatum inom kategori
export function sortInventoryItems(items) {
  if (!Array.isArray(items)) return []
  
  return [...items].sort((a, b) => {
    // 1. Sortera efter kategori
    const categoryA = getCategoryPriority(a.category)
    const categoryB = getCategoryPriority(b.category)
    
    if (categoryA !== categoryB) {
      return categoryA - categoryB
    }
    
    // 2. Inom samma kategori, sortera alfabetiskt efter namn
    const nameA = (a.name || '').toLowerCase()
    const nameB = (b.name || '').toLowerCase()
    
    return nameA.localeCompare(nameB, 'sv')
  })
}

export const sortingUtils = {
  sortItemsByCategory,
  sortShoppingItems,
  sortInventoryItems,
  getCategoryPriority
}
