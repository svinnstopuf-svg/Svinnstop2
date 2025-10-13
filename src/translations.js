// Denna fil är inte längre i bruk - appen använder nu hårdkodad svensk text
// This file is no longer used - the app now uses hardcoded Swedish text

export const translations = {
  // Endast svenska översättningar behövs nu
  // Only Swedish translations are needed now
  
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
    expiring: 'Går ut inom ≤ 3 dagar',
    expired: 'Utgångna',
    
    // Bulk actions
    selectAll: 'Välj alla',
    deselectAll: 'Avmarkera alla',
    deleteSelected: 'Ta bort valda',
    bulkDeleteConfirm: 'Ta bort {count} valda varor?',
    selectedCount: '{selected} av {total} varor valda',
    
    // Item status
    expired: 'Utgången',
    expiresToday: 'Går ut idag',
    daysLeft: '{days} dag{plural} kvar',
    expiry: 'Bäst före',
    
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
    youHave: 'du har',
    instructions: 'Instruktioner:',
    servings: 'portioner',
    
    // Units
    units: {
      liters: 'liter',
      loaves: 'limpor',
      kg: 'kg',
      grams: 'gram',
      pieces: 'stycken',
      cans: 'burkar',
      defaultUnit: 'st'
    },
    
    // CSV Export
    csvHeaders: {
      name: 'Namn',
      quantity: 'Antal',
      purchaseDate: 'Inköpsdatum',
      expiryDate: 'Utgångsdatum',
      daysUntilExpiry: 'Dagar till utgång',
      status: 'Status'
    },
    csvStatus: {
      expired: 'Utgången',
      expiresToday: 'Går ut idag',
      daysLeft: 'dagar kvar'
    },
    notAvailable: 'Ej tillgänglig',
    
    // Theme toggle
    switchToLight: 'Växla till ljust läge',
    switchToDark: 'Växla till mörkt läge',
    
    // Language toggle
    switchLanguage: 'Byt språk (EN → SV → DE)',
    
    // Footer
    dataStorage: 'Data sparas i din webbläsare (localStorage).',
    
    // Undo
    undoButton: '↶️ Ångra',
    undoTitle: 'Ångra senaste borttagning',
    
    // Difficulty levels
    easy: 'Lätt',
    medium: 'Medel',
    hard: 'Svår'
  },
}

// Gamla översättningsfunktioner - används inte längre
// Old translation functions - no longer used
export function getLanguage() {
  return 'sv' // Returnera alltid svenska
}

export function t(key, language, replacements = {}) {
  return key // Returnera bara nyckeln
}

export function plural(count, language) {
  return count === 1 ? '' : 'ar' // Svensk pluralisering
}
