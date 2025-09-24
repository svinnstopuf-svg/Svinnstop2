// Translations for different languages
export const translations = {
  en: {
    // App title and header
    appName: 'Svinnstop',
    appDescription: 'Track your purchased food, expiry dates, and see recipe ideas.',
    
    // Form labels
    addItem: 'Add item',
    name: 'Name',
    namePlaceholder: 'e.g. milk, bread, tomato',
    quantity: 'Quantity',
    purchaseDate: 'Purchase date',
    expiryDate: 'Expiry date',
    addButton: 'Add',
    
    // Items section
    items: 'Items',
    searchPlaceholder: 'Search items...',
    selectButton: '☑️ Select',
    exitButton: '✕ Exit',
    exportCSV: '📊 Export CSV',
    
    // Filters
    all: 'All',
    expiring: 'Expiring ≤ 3 days',
    expired: 'Expired',
    
    // Bulk actions
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    deleteSelected: 'Delete Selected',
    bulkDeleteConfirm: 'Delete {count} selected item{plural}?',
    selectedCount: '{selected} of {total} items selected',
    
    // Item status
    expired: 'Expired',
    expiresToday: 'Expires today',
    daysLeft: '{days} day{plural} left',
    expiry: 'Expiry',
    
    // Messages
    noItems: 'No items yet. Add your first item above.',
    noSearchResults: 'No items found matching "{query}"',
    noFilterResults: 'No items match the selected filter.',
    noItemsToExport: 'No items to export!',
    
    // Recipes
    recipeSuggestions: 'Recipe suggestions',
    noRecipesEmpty: 'Add items to see suggested recipes.',
    noRecipesFound: 'No recipes found with your current ingredients. Try adding more items!',
    ingredientsNeeded: 'Ingredients needed:',
    instructions: 'Instructions:',
    servings: 'serving{plural}',
    
    // Units
    units: {
      liters: 'liters',
      loaves: 'loaves',
      kg: 'kg',
      grams: 'grams',
      pieces: 'pieces',
      cans: 'cans',
      quantity: 'quantity'
    },
    
    // Footer
    dataStorage: 'Data is saved in your browser (localStorage).',
    
    // Undo
    undoButton: '↶️ Undo',
    undoTitle: 'Undo last deletion'
  },
  
  sv: {
    // App title and header
    appName: 'Svinnstop',
    appDescription: 'Spåra din inköpta mat, utgångsdatum och se receptidéer.',
    
    // Form labels
    addItem: 'Lägg till vara',
    name: 'Namn',
    namePlaceholder: 't.ex. mjölk, bröd, tomat',
    quantity: 'Antal',
    purchaseDate: 'Inköpsdatum',
    expiryDate: 'Utgångsdatum',
    addButton: 'Lägg till',
    
    // Items section
    items: 'Varor',
    searchPlaceholder: 'Sök varor...',
    selectButton: '☑️ Välj',
    exitButton: '✕ Avsluta',
    exportCSV: '📊 Exportera CSV',
    
    // Filters
    all: 'Alla',
    expiring: 'Går ut ≤ 3 dagar',
    expired: 'Utgångna',
    
    // Bulk actions
    selectAll: 'Välj alla',
    deselectAll: 'Avmarkera alla',
    deleteSelected: 'Ta bort valda',
    bulkDeleteConfirm: 'Ta bort {count} valda vara{plural}?',
    selectedCount: '{selected} av {total} varor valda',
    
    // Item status
    expired: 'Utgången',
    expiresToday: 'Går ut idag',
    daysLeft: '{days} dag{plural} kvar',
    expiry: 'Utgång',
    
    // Messages
    noItems: 'Inga varor ännu. Lägg till din första vara ovan.',
    noSearchResults: 'Inga varor hittades som matchar "{query}"',
    noFilterResults: 'Inga varor matchar det valda filtret.',
    noItemsToExport: 'Inga varor att exportera!',
    
    // Recipes
    recipeSuggestions: 'Receptförslag',
    noRecipesEmpty: 'Lägg till varor för att se receptförslag.',
    noRecipesFound: 'Inga recept hittades med dina nuvarande ingredienser. Försök lägga till fler varor!',
    ingredientsNeeded: 'Ingredienser som behövs:',
    instructions: 'Instruktioner:',
    servings: 'portion{plural}',
    
    // Units
    units: {
      liters: 'liter',
      loaves: 'limpor',
      kg: 'kg',
      grams: 'gram',
      pieces: 'stycken',
      cans: 'burkar',
      quantity: 'antal'
    },
    
    // Footer
    dataStorage: 'Data sparas i din webbläsare (localStorage).',
    
    // Undo
    undoButton: '↶️ Ångra',
    undoTitle: 'Ångra senaste borttagning'
  },
  
  de: {
    // App title and header
    appName: 'Svinnstop',
    appDescription: 'Verfolge deine gekauften Lebensmittel, Ablaufdaten und erhalte Rezeptideen.',
    
    // Form labels
    addItem: 'Artikel hinzufügen',
    name: 'Name',
    namePlaceholder: 'z.B. Milch, Brot, Tomate',
    quantity: 'Menge',
    purchaseDate: 'Kaufdatum',
    expiryDate: 'Ablaufdatum',
    addButton: 'Hinzufügen',
    
    // Items section
    items: 'Artikel',
    searchPlaceholder: 'Artikel suchen...',
    selectButton: '☑️ Auswählen',
    exitButton: '✕ Beenden',
    exportCSV: '📊 CSV exportieren',
    
    // Filters
    all: 'Alle',
    expiring: 'Läuft ab ≤ 3 Tage',
    expired: 'Abgelaufen',
    
    // Bulk actions
    selectAll: 'Alle auswählen',
    deselectAll: 'Alle abwählen',
    deleteSelected: 'Ausgewählte löschen',
    bulkDeleteConfirm: '{count} ausgewählte Artikel löschen?',
    selectedCount: '{selected} von {total} Artikel ausgewählt',
    
    // Item status
    expired: 'Abgelaufen',
    expiresToday: 'Läuft heute ab',
    daysLeft: '{days} Tag{plural} übrig',
    expiry: 'Ablauf',
    
    // Messages
    noItems: 'Noch keine Artikel. Füge deinen ersten Artikel oben hinzu.',
    noSearchResults: 'Keine Artikel gefunden, die "{query}" entsprechen',
    noFilterResults: 'Keine Artikel entsprechen dem gewählten Filter.',
    noItemsToExport: 'Keine Artikel zum Exportieren!',
    
    // Recipes
    recipeSuggestions: 'Rezeptvorschläge',
    noRecipesEmpty: 'Füge Artikel hinzu, um Rezeptvorschläge zu sehen.',
    noRecipesFound: 'Keine Rezepte mit deinen aktuellen Zutaten gefunden. Versuche mehr Artikel hinzuzufügen!',
    ingredientsNeeded: 'Benötigte Zutaten:',
    instructions: 'Anweisungen:',
    servings: 'Portion{plural}',
    
    // Units
    units: {
      liters: 'Liter',
      loaves: 'Laibe',
      kg: 'kg',
      grams: 'Gramm',
      pieces: 'Stück',
      cans: 'Dosen',
      quantity: 'Menge'
    },
    
    // Footer
    dataStorage: 'Daten werden in deinem Browser gespeichert (localStorage).',
    
    // Undo
    undoButton: '↶️ Rückgängig',
    undoTitle: 'Letzte Löschung rückgängig machen'
  }
}

// Get browser language and fall back to English
export function getLanguage() {
  const browserLang = navigator.language || navigator.languages[0]
  const langCode = browserLang.split('-')[0].toLowerCase()
  
  // Check if we have translations for this language
  if (translations[langCode]) {
    return langCode
  }
  
  // Default to English
  return 'en'
}

// Translation function with placeholder support
export function t(key, language, replacements = {}) {
  const keys = key.split('.')
  let translation = translations[language]
  
  // Navigate through nested keys
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k]
    } else {
      // Fallback to English if key not found
      translation = translations.en
      for (const k of keys) {
        if (translation && translation[k]) {
          translation = translation[k]
        } else {
          return key // Return key if not found in English either
        }
      }
      break
    }
  }
  
  if (typeof translation !== 'string') {
    return key
  }
  
  // Replace placeholders
  let result = translation
  Object.keys(replacements).forEach(placeholder => {
    const value = replacements[placeholder]
    result = result.replace(new RegExp(`{${placeholder}}`, 'g'), value)
  })
  
  return result
}

// Helper for pluralization
export function plural(count) {
  return count === 1 ? '' : 's'
}