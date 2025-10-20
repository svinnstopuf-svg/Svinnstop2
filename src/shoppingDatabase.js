// Utökad databas för inköpslistan - alla varor som finns i svenska livsmedelsbutiker
const SHOPPING_ITEMS = [
  // FÄRSKA VAROR - Kött & Fisk
  { name: 'kött nöt', category: 'kött', emoji: '🥩', unit: 'kg', isFood: true },
  { name: 'kött fläsk', category: 'kött', emoji: '🥩', unit: 'kg', isFood: true },
  { name: 'kött lamm', category: 'kött', emoji: '🥩', unit: 'kg', isFood: true },
  { name: 'kyckling', category: 'kött', emoji: '🍗', unit: 'kg', isFood: true },
  { name: 'korv', category: 'kött', emoji: '🌭', unit: 'st', isFood: true },
  { name: 'bacon', category: 'kött', emoji: '🥓', unit: 'g', isFood: true },
  { name: 'köttfärs', category: 'kött', emoji: '🥩', unit: 'kg', isFood: true },
  { name: 'fläskfilé', category: 'kött', emoji: '🥩', unit: 'kg', isFood: true },
  { name: 'lax', category: 'fisk', emoji: '🐟', unit: 'kg', isFood: true },
  { name: 'torsk', category: 'fisk', emoji: '🐟', unit: 'kg', isFood: true },
  { name: 'räkor', category: 'fisk', emoji: '🦐', unit: 'g', isFood: true },
  { name: 'krabba', category: 'fisk', emoji: '🦀', unit: 'st', isFood: true },
  { name: 'tonfisk konserv', category: 'konserv', emoji: '🥫', unit: 'st', isFood: true },

  // MEJERI
  { name: 'mjölk', category: 'mejeri', emoji: '🥛', unit: 'L', isFood: true },
  { name: 'mjölk laktosfri', category: 'mejeri', emoji: '🥛', unit: 'L', isFood: true },
  { name: 'grädde', category: 'mejeri', emoji: '🥛', unit: 'dl', isFood: true },
  { name: 'crème fraiche', category: 'mejeri', emoji: '🥄', unit: 'dl', isFood: true },
  { name: 'yoghurt', category: 'mejeri', emoji: '🥄', unit: 'st', isFood: true },
  { name: 'filmjölk', category: 'mejeri', emoji: '🥛', unit: 'L', isFood: true },
  { name: 'smör', category: 'mejeri', emoji: '🧈', unit: 'g', isFood: true },
  { name: 'margarin', category: 'mejeri', emoji: '🧈', unit: 'g', isFood: true },
  { name: 'ost hård', category: 'mejeri', emoji: '🧀', unit: 'g', isFood: true },
  { name: 'ost mjuk', category: 'mejeri', emoji: '🧀', unit: 'g', isFood: true },
  { name: 'cottage cheese', category: 'mejeri', emoji: '🧀', unit: 'g', isFood: true },
  { name: 'feta', category: 'mejeri', emoji: '🧀', unit: 'g', isFood: true },
  { name: 'mozzarella', category: 'mejeri', emoji: '🧀', unit: 'g', isFood: true },
  { name: 'parmesan', category: 'mejeri', emoji: '🧀', unit: 'g', isFood: true },
  { name: 'kvarg', category: 'mejeri', emoji: '🥄', unit: 'g', isFood: true },

  // GRÖNSAKER
  { name: 'morötter', category: 'grönsak', emoji: '🥕', unit: 'kg', isFood: true },
  { name: 'potatis', category: 'grönsak', emoji: '🥔', unit: 'kg', isFood: true },
  { name: 'lök gul', category: 'grönsak', emoji: '🧅', unit: 'st', isFood: true },
  { name: 'lök röd', category: 'grönsak', emoji: '🧅', unit: 'st', isFood: true },
  { name: 'vitlök', category: 'grönsak', emoji: '🧄', unit: 'st', isFood: true },
  { name: 'tomat', category: 'grönsak', emoji: '🍅', unit: 'kg', isFood: true },
  { name: 'gurka', category: 'grönsak', emoji: '🥒', unit: 'st', isFood: true },
  { name: 'paprika röd', category: 'grönsak', emoji: '🌶️', unit: 'st', isFood: true },
  { name: 'paprika gul', category: 'grönsak', emoji: '🌶️', unit: 'st', isFood: true },
  { name: 'paprika grön', category: 'grönsak', emoji: '🌶️', unit: 'st', isFood: true },
  { name: 'broccoli', category: 'grönsak', emoji: '🥦', unit: 'st', isFood: true },
  { name: 'blomkål', category: 'grönsak', emoji: '🥬', unit: 'st', isFood: true },
  { name: 'spenat', category: 'grönsak', emoji: '🥬', unit: 'g', isFood: true },
  { name: 'sallad', category: 'grönsak', emoji: '🥬', unit: 'st', isFood: true },
  { name: 'ruccola', category: 'grönsak', emoji: '🥬', unit: 'g', isFood: true },
  { name: 'kål', category: 'grönsak', emoji: '🥬', unit: 'st', isFood: true },
  { name: 'palsternacka', category: 'grönsak', emoji: '🥕', unit: 'kg', isFood: true },
  { name: 'selleri', category: 'grönsak', emoji: '🥬', unit: 'st', isFood: true },
  { name: 'purjolök', category: 'grönsak', emoji: '🧅', unit: 'st', isFood: true },
  { name: 'zucchini', category: 'grönsak', emoji: '🥒', unit: 'st', isFood: true },
  { name: 'aubergine', category: 'grönsak', emoji: '🍆', unit: 'st', isFood: true },

  // FRUKT & BÄR
  { name: 'äpplen', category: 'frukt', emoji: '🍎', unit: 'kg', isFood: true },
  { name: 'bananer', category: 'frukt', emoji: '🍌', unit: 'st', isFood: true },
  { name: 'apelsiner', category: 'frukt', emoji: '🍊', unit: 'kg', isFood: true },
  { name: 'citroner', category: 'frukt', emoji: '🍋', unit: 'st', isFood: true },
  { name: 'lime', category: 'frukt', emoji: '🟢', unit: 'st', isFood: true },
  { name: 'druvor', category: 'frukt', emoji: '🍇', unit: 'kg', isFood: true },
  { name: 'jordgubbar', category: 'frukt', emoji: '🍓', unit: 'g', isFood: true },
  { name: 'blåbär', category: 'frukt', emoji: '🫐', unit: 'g', isFood: true },
  { name: 'hallon', category: 'frukt', emoji: '🫐', unit: 'g', isFood: true },
  { name: 'kiwi', category: 'frukt', emoji: '🥝', unit: 'st', isFood: true },
  { name: 'mango', category: 'frukt', emoji: '🥭', unit: 'st', isFood: true },
  { name: 'ananas', category: 'frukt', emoji: '🍍', unit: 'st', isFood: true },
  { name: 'päron', category: 'frukt', emoji: '🍐', unit: 'kg', isFood: true },
  { name: 'persika', category: 'frukt', emoji: '🍑', unit: 'st', isFood: true },
  { name: 'plommon', category: 'frukt', emoji: '🟣', unit: 'kg', isFood: true },
  { name: 'avokado', category: 'frukt', emoji: '🥑', unit: 'st', isFood: true },

  // BRÖD & SPANNMÅL
  { name: 'bröd', category: 'bröd', emoji: '🍞', unit: 'st', isFood: true },
  { name: 'knäckebröd', category: 'bröd', emoji: '🍞', unit: 'st', isFood: true },
  { name: 'mjöl', category: 'spannmål', emoji: '🌾', unit: 'kg', isFood: true },
  { name: 'ris', category: 'spannmål', emoji: '🍚', unit: 'kg', isFood: true },
  { name: 'pasta', category: 'spannmål', emoji: '🍝', unit: 'g', isFood: true },
  { name: 'havregryn', category: 'spannmål', emoji: '🥣', unit: 'g', isFood: true },
  { name: 'quinoa', category: 'spannmål', emoji: '🌾', unit: 'g', isFood: true },
  { name: 'müsli', category: 'spannmål', emoji: '🥣', unit: 'g', isFood: true },
  { name: 'cornflakes', category: 'spannmål', emoji: '🥣', unit: 'g', isFood: true },

  // ÄGG
  { name: 'ägg', category: 'ägg', emoji: '🥚', unit: 'st', isFood: true },

  // KRYDDOR & SÅSER
  { name: 'salt', category: 'krydda', emoji: '🧂', unit: 'g', isFood: true },
  { name: 'peppar', category: 'krydda', emoji: '🌶️', unit: 'g', isFood: true },
  { name: 'oregano', category: 'krydda', emoji: '🌿', unit: 'g', isFood: true },
  { name: 'basilika', category: 'krydda', emoji: '🌿', unit: 'g', isFood: true },
  { name: 'timjan', category: 'krydda', emoji: '🌿', unit: 'g', isFood: true },
  { name: 'rosmarin', category: 'krydda', emoji: '🌿', unit: 'g', isFood: true },
  { name: 'ketchup', category: 'sås', emoji: '🍅', unit: 'st', isFood: true },
  { name: 'senap', category: 'sås', emoji: '🟡', unit: 'st', isFood: true },
  { name: 'majonnäs', category: 'sås', emoji: '🥄', unit: 'st', isFood: true },
  { name: 'soja', category: 'sås', emoji: '🥢', unit: 'dl', isFood: true },
  { name: 'olivolja', category: 'olja', emoji: '🫒', unit: 'dl', isFood: true },
  { name: 'rapsolja', category: 'olja', emoji: '🌻', unit: 'L', isFood: true },
  { name: 'vinäger', category: 'sås', emoji: '🍶', unit: 'dl', isFood: true },
  { name: 'honung', category: 'sås', emoji: '🍯', unit: 'g', isFood: true },

  // DRYCKER
  { name: 'kaffe', category: 'dryck', emoji: '☕', unit: 'g', isFood: true },
  { name: 'te', category: 'dryck', emoji: '🫖', unit: 'st', isFood: true },
  { name: 'juice', category: 'dryck', emoji: '🧃', unit: 'L', isFood: true },
  { name: 'läsk', category: 'dryck', emoji: '🥤', unit: 'L', isFood: true },
  { name: 'öl', category: 'dryck', emoji: '🍺', unit: 'st', isFood: true },
  { name: 'vin', category: 'dryck', emoji: '🍷', unit: 'st', isFood: true },
  { name: 'vatten', category: 'dryck', emoji: '💧', unit: 'L', isFood: true },
  { name: 'energidryck', category: 'dryck', emoji: '⚡', unit: 'st', isFood: true },

  // SNACKS & GODIS
  { name: 'chips', category: 'snacks', emoji: '🥔', unit: 'st', isFood: true },
  { name: 'choklad', category: 'godis', emoji: '🍫', unit: 'g', isFood: true },
  { name: 'kex', category: 'snacks', emoji: '🍪', unit: 'g', isFood: true },
  { name: 'nötter', category: 'snacks', emoji: '🥜', unit: 'g', isFood: true },
  { name: 'godis', category: 'godis', emoji: '🍬', unit: 'g', isFood: true },
  { name: 'glass', category: 'fryst', emoji: '🍦', unit: 'L', isFood: true },
  { name: 'popcorn', category: 'snacks', emoji: '🍿', unit: 'g', isFood: true },

  // FRYST MAT
  { name: 'pizza fryst', category: 'fryst', emoji: '🍕', unit: 'st', isFood: true },
  { name: 'pommes frites', category: 'fryst', emoji: '🍟', unit: 'kg', isFood: true },
  { name: 'fisk fryst', category: 'fryst', emoji: '🐟', unit: 'kg', isFood: true },
  { name: 'grönsaker frysta', category: 'fryst', emoji: '🥦', unit: 'kg', isFood: true },

  // KONSERVER & BURKAR
  { name: 'tomater krossade', category: 'konserv', emoji: '🥫', unit: 'st', isFood: true },
  { name: 'bönor', category: 'konserv', emoji: '🥫', unit: 'st', isFood: true },
  { name: 'linser', category: 'konserv', emoji: '🥫', unit: 'st', isFood: true },
  { name: 'majs', category: 'konserv', emoji: '🥫', unit: 'st', isFood: true },

  // HUSGERÅD & HEM (finns i livsmedelsbutiker)
  { name: 'diskmedel', category: 'hem', emoji: '🧴', unit: 'st', isFood: false },
  { name: 'tvättmedel', category: 'hem', emoji: '🧴', unit: 'st', isFood: false },
  { name: 'toalettpapper', category: 'hem', emoji: '🧼', unit: 'st', isFood: false },
  { name: 'kökspapper', category: 'hem', emoji: '🧼', unit: 'st', isFood: false },
  { name: 'aluminiumfolie', category: 'hem', emoji: '📜', unit: 'st', isFood: false },
  { name: 'plastfolie', category: 'hem', emoji: '📜', unit: 'st', isFood: false },
  { name: 'bakplåtspapper', category: 'hem', emoji: '📜', unit: 'st', isFood: false },
  { name: 'soppåsar', category: 'hem', emoji: '🗑️', unit: 'st', isFood: false },
  { name: 'fryspåsar', category: 'hem', emoji: '❄️', unit: 'st', isFood: false },

  // PERSONVÅRD (finns i de flesta livsmedelsbutiker)
  { name: 'tandkäm', category: 'personvård', emoji: '🦷', unit: 'st', isFood: false },
  { name: 'schampo', category: 'personvård', emoji: '🧴', unit: 'st', isFood: false },
  { name: 'duschkäm', category: 'personvård', emoji: '🧴', unit: 'st', isFood: false },
  { name: 'deodorant', category: 'personvård', emoji: '🧴', unit: 'st', isFood: false },
  { name: 'tvål', category: 'personvård', emoji: '🧼', unit: 'st', isFood: false },
  { name: 'rakblad', category: 'personvård', emoji: '🪒', unit: 'st', isFood: false },

  // HUSDJUR (många livsmedelsbutiker har husdjursavdelning)
  { name: 'hundmat', category: 'husdjur', emoji: '🐕', unit: 'st', isFood: false },
  { name: 'kattmat', category: 'husdjur', emoji: '🐱', unit: 'st', isFood: false },
  { name: 'kattsand', category: 'husdjur', emoji: '🐱', unit: 'kg', isFood: false },

  // BABY & BARN (finns i större livsmedelsbutiker)
  { name: 'blöjor', category: 'baby', emoji: '👶', unit: 'st', isFood: false },
  { name: 'barnmat', category: 'baby', emoji: '🍼', unit: 'st', isFood: true },
  { name: 'våtservetter', category: 'baby', emoji: '🧼', unit: 'st', isFood: false }
]

// Fuzzy search för inköpslistan
export function searchShoppingItems(query) {
  if (!query || query.length < 1) return []
  
  const searchTerm = query.toLowerCase().trim()
  const results = []
  
  SHOPPING_ITEMS.forEach(item => {
    const name = item.name.toLowerCase()
    
    // Exakt match (högsta prioritet)
    if (name === searchTerm) {
      results.push({ ...item, score: 100 })
      return
    }
    
    // Börjar med söktermen (hög prioritet)
    if (name.startsWith(searchTerm)) {
      results.push({ ...item, score: 90 })
      return
    }
    
    // Innehåller söktermen (medelhög prioritet)
    if (name.includes(searchTerm)) {
      results.push({ ...item, score: 70 })
      return
    }
    
    // Fuzzy match för felstavningar (låg prioritet)
    if (fuzzyMatch(name, searchTerm)) {
      results.push({ ...item, score: 50 })
      return
    }
  })
  
  // Sortera efter poäng och returnera topp 10 resultat
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

// Enkel fuzzy match för närliggande stavningar
function fuzzyMatch(str1, str2) {
  if (Math.abs(str1.length - str2.length) > 2) return false
  
  let matches = 0
  const shorter = str1.length < str2.length ? str1 : str2
  const longer = str1.length >= str2.length ? str1 : str2
  
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++
    }
  }
  
  return matches / shorter.length > 0.7
}

// Få rekommenderade varor baserat på kategori eller popularitet
export function getRecommendedItems(category = null, limit = 12) {
  let items = SHOPPING_ITEMS
  
  if (category) {
    items = items.filter(item => item.category === category)
  }
  
  // Returnera de mest populära/vanliga varorna först
  const popularItems = [
    'mjölk', 'bröd', 'ägg', 'smör', 'ost hård', 'bananer', 'äpplen', 
    'kyckling', 'pasta', 'ris', 'potatis', 'morötter', 'tomat', 'lök gul',
    'kaffe', 'yoghurt', 'kött nöt', 'lax', 'grädde', 'filmjölk'
  ]
  
  const recommended = []
  
  // Lägg till populära varor först
  popularItems.forEach(name => {
    const item = items.find(i => i.name === name)
    if (item && recommended.length < limit) {
      recommended.push(item)
    }
  })
  
  // Fyll på med resten om vi behöver fler
  items.forEach(item => {
    if (!recommended.find(r => r.name === item.name) && recommended.length < limit) {
      recommended.push(item)
    }
  })
  
  return recommended.slice(0, limit)
}

// Få kategorier
export function getShoppingCategories() {
  const categories = [...new Set(SHOPPING_ITEMS.map(item => item.category))]
  return categories.sort()
}

export { SHOPPING_ITEMS }