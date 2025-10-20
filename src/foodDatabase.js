// Svensk matvarudatabas för autocomplete
const SWEDISH_FOODS = [
  // Mejeri
  { name: 'mjölk', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'liter' },
  { name: 'mjölk laktosfri', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'liter' },
  { name: 'mjölk havredryck', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'liter' },
  { name: 'grädde', category: 'mejeri', emoji: '🥛', defaultDays: 10, unit: 'dl' },
  { name: 'crème fraiche', category: 'mejeri', emoji: '🥄', defaultDays: 14, unit: 'dl' },
  { name: 'yoghurt naturell', category: 'mejeri', emoji: '🥄', defaultDays: 10, unit: 'dl' },
  { name: 'yoghurt grekisk', category: 'mejeri', emoji: '🥄', defaultDays: 12, unit: 'dl' },
  { name: 'filmjölk', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'liter' },
  { name: 'smör', category: 'mejeri', emoji: '🧈', defaultDays: 30, unit: 'g' },
  { name: 'margarin', category: 'mejeri', emoji: '🧈', defaultDays: 60, unit: 'g' },
  { name: 'ost hård', category: 'mejeri', emoji: '🧀', defaultDays: 21, unit: 'g' },
  { name: 'ost mjuk', category: 'mejeri', emoji: '🧀', defaultDays: 14, unit: 'g' },
  { name: 'cottage cheese', category: 'mejeri', emoji: '🧀', defaultDays: 10, unit: 'dl' },
  { name: 'feta', category: 'mejeri', emoji: '🧀', defaultDays: 14, unit: 'g' },
  { name: 'mozzarella', category: 'mejeri', emoji: '🧀', defaultDays: 10, unit: 'g' },

  // Kött & Fisk
  { name: 'kött nöt', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'g' },
  { name: 'kött fläsk', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'g' },
  { name: 'kyckling', category: 'kött', emoji: '🍗', defaultDays: 2, unit: 'g' },
  { name: 'kött lamm', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'g' },
  { name: 'korv', category: 'kött', emoji: '🌭', defaultDays: 7, unit: 'st' },
  { name: 'bacon', category: 'kött', emoji: '🥓', defaultDays: 7, unit: 'g' },
  { name: 'lax', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'g' },
  { name: 'torsk', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'g' },
  { name: 'räkor', category: 'fisk', emoji: '🦐', defaultDays: 2, unit: 'g' },
  { name: 'tonfisk konserv', category: 'konserv', emoji: '🥫', defaultDays: 1095, unit: 'burk' },

  // Grönsaker
  { name: 'morötter', category: 'grönsak', emoji: '🥕', defaultDays: 14, unit: 'st' },
  { name: 'potatis', category: 'grönsak', emoji: '🥔', defaultDays: 21, unit: 'kg' },
  { name: 'lök gul', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'st' },
  { name: 'lök röd', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'st' },
  { name: 'vitlök', category: 'grönsak', emoji: '🧄', defaultDays: 30, unit: 'st' },
  { name: 'tomat', category: 'grönsak', emoji: '🍅', defaultDays: 7, unit: 'st' },
  { name: 'gurka', category: 'grönsak', emoji: '🥒', defaultDays: 7, unit: 'st' },
  { name: 'paprika röd', category: 'grönsak', emoji: '🌶️', defaultDays: 10, unit: 'st' },
  { name: 'paprika gul', category: 'grönsak', emoji: '🌶️', defaultDays: 10, unit: 'st' },
  { name: 'paprika grön', category: 'grönsak', emoji: '🌶️', defaultDays: 10, unit: 'st' },
  { name: 'broccoli', category: 'grönsak', emoji: '🥦', defaultDays: 7, unit: 'st' },
  { name: 'blomkål', category: 'grönsak', emoji: '🥬', defaultDays: 7, unit: 'st' },
  { name: 'spenat', category: 'grönsak', emoji: '🥬', defaultDays: 5, unit: 'påse' },
  { name: 'sallad iceberg', category: 'grönsak', emoji: '🥬', defaultDays: 7, unit: 'st' },
  { name: 'ruccola', category: 'grönsak', emoji: '🥬', defaultDays: 5, unit: 'påse' },

  // Frukt
  { name: 'äpplen', category: 'frukt', emoji: '🍎', defaultDays: 14, unit: 'st' },
  { name: 'bananer', category: 'frukt', emoji: '🍌', defaultDays: 7, unit: 'st' },
  { name: 'apelsiner', category: 'frukt', emoji: '🍊', defaultDays: 14, unit: 'st' },
  { name: 'citroner', category: 'frukt', emoji: '🍋', defaultDays: 21, unit: 'st' },
  { name: 'druvor', category: 'frukt', emoji: '🍇', defaultDays: 7, unit: 'påse' },
  { name: 'jordgubbar', category: 'frukt', emoji: '🍓', defaultDays: 3, unit: 'ask' },
  { name: 'blåbär', category: 'frukt', emoji: '🫐', defaultDays: 5, unit: 'ask' },
  { name: 'hallon', category: 'frukt', emoji: '🫐', defaultDays: 3, unit: 'ask' },

  // Bröd & Spannmål  
  { name: 'bröd', category: 'bröd', emoji: '🍞', defaultDays: 5, unit: 'st' },
  { name: 'mjöl', category: 'spannmål', emoji: '🌾', defaultDays: 365, unit: 'kg' },
  { name: 'ris', category: 'spannmål', emoji: '🍚', defaultDays: 730, unit: 'kg' },
  { name: 'pasta', category: 'spannmål', emoji: '🍝', defaultDays: 730, unit: 'kg' },
  { name: 'havregryn', category: 'spannmål', emoji: '🥣', defaultDays: 365, unit: 'kg' },
  { name: 'quinoa', category: 'spannmål', emoji: '🌾', defaultDays: 730, unit: 'kg' },

  // Ägg
  { name: 'ägg', category: 'ägg', emoji: '🥚', defaultDays: 21, unit: 'st' },

  // Kryddor & Såser
  { name: 'salt', category: 'krydda', emoji: '🧂', defaultDays: 1095, unit: 'g' },
  { name: 'peppar svart', category: 'krydda', emoji: '🌶️', defaultDays: 730, unit: 'g' },
  { name: 'oregano', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'basilika', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'timjan', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'ketchup', category: 'sås', emoji: '🍅', defaultDays: 90, unit: 'flaska' },
  { name: 'senap', category: 'sås', emoji: '🟡', defaultDays: 180, unit: 'tub' },
  { name: 'majonnäs', category: 'sås', emoji: '🥄', defaultDays: 60, unit: 'tub' },
  { name: 'soja', category: 'sås', emoji: '🥢', defaultDays: 365, unit: 'flaska' },
  { name: 'olivolja', category: 'olja', emoji: '🫒', defaultDays: 730, unit: 'flaska' },
  { name: 'rapsolja', category: 'olja', emoji: '🌻', defaultDays: 365, unit: 'flaska' },

  // Drycker
  { name: 'kaffe', category: 'dryck', emoji: '☕', defaultDays: 365, unit: 'kg' },
  { name: 'te', category: 'dryck', emoji: '🫖', defaultDays: 730, unit: 'påse' },
  { name: 'juice apelsin', category: 'dryck', emoji: '🧃', defaultDays: 7, unit: 'liter' },
  { name: 'juice äpple', category: 'dryck', emoji: '🧃', defaultDays: 7, unit: 'liter' },
  { name: 'läsk', category: 'dryck', emoji: '🥤', defaultDays: 365, unit: 'flaska' },
  { name: 'öl', category: 'dryck', emoji: '🍺', defaultDays: 180, unit: 'flaska' },
  { name: 'vin', category: 'dryck', emoji: '🍷', defaultDays: 1095, unit: 'flaska' },
]

// Fuzzy search funktion
export function searchFoods(query) {
  if (!query || query.length < 1) return []
  
  const searchTerm = query.toLowerCase().trim()
  const results = []
  
  SWEDISH_FOODS.forEach(food => {
    const name = food.name.toLowerCase()
    
    // Exakt match (högsta prioritet)
    if (name === searchTerm) {
      results.push({ ...food, score: 100 })
      return
    }
    
    // Börjar med söktermen (hög prioritet)
    if (name.startsWith(searchTerm)) {
      results.push({ ...food, score: 90 })
      return
    }
    
    // Innehåller söktermen (medelhög prioritet)
    if (name.includes(searchTerm)) {
      results.push({ ...food, score: 70 })
      return
    }
    
    // Fuzzy match för felstavningar (låg prioritet)
    if (fuzzyMatch(name, searchTerm)) {
      results.push({ ...food, score: 50 })
      return
    }
  })
  
  // Sortera efter poäng och returnera topp 8 resultat
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
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

// Få utgångsdatum förslag baserat på vara
export function getExpiryDateSuggestion(foodName) {
  const food = SWEDISH_FOODS.find(f => 
    f.name.toLowerCase() === foodName.toLowerCase()
  )
  
  if (food) {
    const date = new Date()
    date.setDate(date.getDate() + food.defaultDays)
    return {
      date: date.toISOString().split('T')[0],
      category: food.category,
      defaultUnit: food.unit,
      emoji: food.emoji
    }
  }
  
  // Fallback för okända varor
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return {
    date: date.toISOString().split('T')[0],
    category: 'övrigt',
    defaultUnit: 'st',
    emoji: '📦'
  }
}

export { SWEDISH_FOODS }