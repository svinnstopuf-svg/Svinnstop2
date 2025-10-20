// Utökad databas för inköpslistan - alla varor som finns i svenska livsmedelsbutiker
const SHOPPING_ITEMS = [
  // FÄRSKA VAROR - Kött & Fisk
  { name: 'kött nöt', category: 'kött', emoji: '🥩', isFood: true },
  { name: 'kött fläsk', category: 'kött', emoji: '🥩', isFood: true },
  { name: 'kött lamm', category: 'kött', emoji: '🥩', isFood: true },
  { name: 'kyckling', category: 'kött', emoji: '🍗', isFood: true },
  { name: 'korv', category: 'kött', emoji: '🌭', isFood: true },
  { name: 'bacon', category: 'kött', emoji: '🥓', isFood: true },
  { name: 'köttfärs', category: 'kött', emoji: '🥩', isFood: true },
  { name: 'fläskfilé', category: 'kött', emoji: '🥩', isFood: true },
  { name: 'lax', category: 'fisk', emoji: '🐟', isFood: true },
  { name: 'torsk', category: 'fisk', emoji: '🐟', isFood: true },
  { name: 'räkor', category: 'fisk', emoji: '🦐', isFood: true },
  { name: 'krabba', category: 'fisk', emoji: '🦀', isFood: true },
  { name: 'tonfisk konserv', category: 'konserv', emoji: '🥫', isFood: true },

  // MEJERI
  { name: 'mjölk', category: 'mejeri', emoji: '🥛', isFood: true },
  { name: 'mjölk laktosfri', category: 'mejeri', emoji: '🥛', isFood: true },
  { name: 'grädde', category: 'mejeri', emoji: '🥛', isFood: true },
  { name: 'crème fraiche', category: 'mejeri', emoji: '🥄', isFood: true },
  { name: 'yoghurt', category: 'mejeri', emoji: '🥄', isFood: true },
  { name: 'filmjölk', category: 'mejeri', emoji: '🥛', isFood: true },
  { name: 'smör', category: 'mejeri', emoji: '🧈', isFood: true },
  { name: 'margarin', category: 'mejeri', emoji: '🧈', isFood: true },
  { name: 'ost hård', category: 'mejeri', emoji: '🧀', isFood: true },
  { name: 'ost mjuk', category: 'mejeri', emoji: '🧀', isFood: true },
  { name: 'cottage cheese', category: 'mejeri', emoji: '🧀', isFood: true },
  { name: 'feta', category: 'mejeri', emoji: '🧀', isFood: true },
  { name: 'mozzarella', category: 'mejeri', emoji: '🧀', isFood: true },
  { name: 'parmesan', category: 'mejeri', emoji: '🧀', isFood: true },
  { name: 'kvarg', category: 'mejeri', emoji: '🥄', isFood: true },

  // GRÖNSAKER
  { name: 'morötter', category: 'grönsak', emoji: '🥕', isFood: true },
  { name: 'potatis', category: 'grönsak', emoji: '🥔', isFood: true },
  { name: 'lök gul', category: 'grönsak', emoji: '🧅', isFood: true },
  { name: 'lök röd', category: 'grönsak', emoji: '🧅', isFood: true },
  { name: 'vitlök', category: 'grönsak', emoji: '🧄', isFood: true },
  { name: 'tomat', category: 'grönsak', emoji: '🍅', isFood: true },
  { name: 'gurka', category: 'grönsak', emoji: '🥒', isFood: true },
  { name: 'paprika röd', category: 'grönsak', emoji: '🌶️', isFood: true },
  { name: 'paprika gul', category: 'grönsak', emoji: '🌶️', isFood: true },
  { name: 'paprika grön', category: 'grönsak', emoji: '🌶️', isFood: true },
  { name: 'broccoli', category: 'grönsak', emoji: '🥦', isFood: true },
  { name: 'blomkål', category: 'grönsak', emoji: '🥬', isFood: true },
  { name: 'spenat', category: 'grönsak', emoji: '🥬', isFood: true },
  { name: 'sallad', category: 'grönsak', emoji: '🥬', isFood: true },
  { name: 'ruccola', category: 'grönsak', emoji: '🥬', isFood: true },
  { name: 'kål', category: 'grönsak', emoji: '🥬', isFood: true },
  { name: 'palsternacka', category: 'grönsak', emoji: '🥕', isFood: true },
  { name: 'selleri', category: 'grönsak', emoji: '🥬', isFood: true },
  { name: 'purjolök', category: 'grönsak', emoji: '🧅', isFood: true },
  { name: 'zucchini', category: 'grönsak', emoji: '🥒', isFood: true },
  { name: 'aubergine', category: 'grönsak', emoji: '🍆', isFood: true },

  // FRUKT & BÄR
  { name: 'äpplen', category: 'frukt', emoji: '🍎', isFood: true },
  { name: 'bananer', category: 'frukt', emoji: '🍌', isFood: true },
  { name: 'apelsiner', category: 'frukt', emoji: '🍊', isFood: true },
  { name: 'citroner', category: 'frukt', emoji: '🍋', isFood: true },
  { name: 'lime', category: 'frukt', emoji: '🟢', isFood: true },
  { name: 'druvor', category: 'frukt', emoji: '🍇', isFood: true },
  { name: 'jordgubbar', category: 'frukt', emoji: '🍓', isFood: true },
  { name: 'blåbär', category: 'frukt', emoji: '🫐', isFood: true },
  { name: 'hallon', category: 'frukt', emoji: '🫐', isFood: true },
  { name: 'kiwi', category: 'frukt', emoji: '🥝', isFood: true },
  { name: 'mango', category: 'frukt', emoji: '🥭', isFood: true },
  { name: 'ananas', category: 'frukt', emoji: '🍍', isFood: true },
  { name: 'päron', category: 'frukt', emoji: '🍐', isFood: true },
  { name: 'persika', category: 'frukt', emoji: '🍑', isFood: true },
  { name: 'plommon', category: 'frukt', emoji: '🟣', isFood: true },
  { name: 'avokado', category: 'frukt', emoji: '🥑', isFood: true },

  // BRÖD & SPANNMÅL
  { name: 'bröd', category: 'bröd', emoji: '🍞', isFood: true },
  { name: 'knäckebröd', category: 'bröd', emoji: '🍞', isFood: true },
  { name: 'mjöl', category: 'spannmål', emoji: '🌾', isFood: true },
  { name: 'ris', category: 'spannmål', emoji: '🍚', isFood: true },
  { name: 'pasta', category: 'spannmål', emoji: '🍝', isFood: true },
  { name: 'havregryn', category: 'spannmål', emoji: '🥣', isFood: true },
  { name: 'quinoa', category: 'spannmål', emoji: '🌾', isFood: true },
  { name: 'müsli', category: 'spannmål', emoji: '🥣', isFood: true },
  { name: 'cornflakes', category: 'spannmål', emoji: '🥣', isFood: true },

  // ÄGG
  { name: 'ägg', category: 'ägg', emoji: '🥚', isFood: true },

  // KRYDDOR & SÅSER
  { name: 'salt', category: 'krydda', emoji: '🧂', isFood: true },
  { name: 'peppar', category: 'krydda', emoji: '🌶️', isFood: true },
  { name: 'oregano', category: 'krydda', emoji: '🌿', isFood: true },
  { name: 'basilika', category: 'krydda', emoji: '🌿', isFood: true },
  { name: 'timjan', category: 'krydda', emoji: '🌿', isFood: true },
  { name: 'rosmarin', category: 'krydda', emoji: '🌿', isFood: true },
  { name: 'ketchup', category: 'sås', emoji: '🍅', isFood: true },
  { name: 'senap', category: 'sås', emoji: '🟡', isFood: true },
  { name: 'majonnäs', category: 'sås', emoji: '🥄', isFood: true },
  { name: 'soja', category: 'sås', emoji: '🥢', isFood: true },
  { name: 'olivolja', category: 'olja', emoji: '🫒', isFood: true },
  { name: 'rapsolja', category: 'olja', emoji: '🌻', isFood: true },
  { name: 'vinäger', category: 'sås', emoji: '🍶', isFood: true },
  { name: 'honung', category: 'sås', emoji: '🍯', isFood: true },

  // DRYCKER
  { name: 'kaffe', category: 'dryck', emoji: '☕', isFood: true },
  { name: 'te', category: 'dryck', emoji: '🫖', isFood: true },
  { name: 'juice', category: 'dryck', emoji: '🧃', isFood: true },
  { name: 'läsk', category: 'dryck', emoji: '🥤', isFood: true },
  { name: 'öl', category: 'dryck', emoji: '🍺', isFood: true },
  { name: 'vin', category: 'dryck', emoji: '🍷', isFood: true },
  { name: 'vatten', category: 'dryck', emoji: '💧', isFood: true },
  { name: 'energidryck', category: 'dryck', emoji: '⚡', isFood: true },

  // SNACKS & GODIS
  { name: 'chips', category: 'snacks', emoji: '🥔', isFood: true },
  { name: 'choklad', category: 'godis', emoji: '🍫', isFood: true },
  { name: 'kex', category: 'snacks', emoji: '🍪', isFood: true },
  { name: 'nötter', category: 'snacks', emoji: '🥜', isFood: true },
  { name: 'godis', category: 'godis', emoji: '🍬', isFood: true },
  { name: 'glass', category: 'fryst', emoji: '🍦', isFood: true },
  { name: 'popcorn', category: 'snacks', emoji: '🍿', isFood: true },

  // FRYST MAT
  { name: 'pizza fryst', category: 'fryst', emoji: '🍕', isFood: true },
  { name: 'pommes frites', category: 'fryst', emoji: '🍟', isFood: true },
  { name: 'fisk fryst', category: 'fryst', emoji: '🐟', isFood: true },
  { name: 'grönsaker frysta', category: 'fryst', emoji: '🥦', isFood: true },

  // KONSERVER & BURKAR
  { name: 'tomater krossade', category: 'konserv', emoji: '🥫', isFood: true },
  { name: 'bönor', category: 'konserv', emoji: '🥫', isFood: true },
  { name: 'linser', category: 'konserv', emoji: '🥫', isFood: true },
  { name: 'majs', category: 'konserv', emoji: '🥫', isFood: true },

  // HUSGERÅD & HEM (finns i livsmedelsbutiker)
  { name: 'diskmedel', category: 'hem', emoji: '🧴', isFood: false },
  { name: 'tvättmedel', category: 'hem', emoji: '🧴', isFood: false },
  { name: 'toalettpapper', category: 'hem', emoji: '🧻', isFood: false },
  { name: 'kökspapper', category: 'hem', emoji: '🧻', isFood: false },
  { name: 'aluminiumfolie', category: 'hem', emoji: '📜', isFood: false },
  { name: 'plastfolie', category: 'hem', emoji: '📜', isFood: false },
  { name: 'bakplåtspapper', category: 'hem', emoji: '📜', isFood: false },
  { name: 'soppåsar', category: 'hem', emoji: '🗑️', isFood: false },
  { name: 'fryspåsar', category: 'hem', emoji: '❄️', isFood: false },

  // PERSONVÅRD (finns i de flesta livsmedelsbutiker)
  { name: 'tandkräm', category: 'personvård', emoji: '🦷', isFood: false },
  { name: 'schampo', category: 'personvård', emoji: '🧴', isFood: false },
  { name: 'duschkräm', category: 'personvård', emoji: '🧴', isFood: false },
  { name: 'deodorant', category: 'personvård', emoji: '🧴', isFood: false },
  { name: 'tvål', category: 'personvård', emoji: '🧼', isFood: false },
  { name: 'rakblad', category: 'personvård', emoji: '🪒', isFood: false },

  // HUSDJUR (många livsmedelsbutiker har husdjursavdelning)
  { name: 'hundmat', category: 'husdjur', emoji: '🐕', isFood: false },
  { name: 'kattmat', category: 'husdjur', emoji: '🐱', isFood: false },
  { name: 'kattsand', category: 'husdjur', emoji: '🐱', isFood: false },

  // BABY & BARN (finns i större livsmedelsbutiker)
  { name: 'blöjor', category: 'baby', emoji: '👶', isFood: false },
  { name: 'barnmat', category: 'baby', emoji: '🍼', isFood: true },
  { name: 'våtservetter', category: 'baby', emoji: '🧻', isFood: false }
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