// Svensk matvarudatabas för autocomplete
import { getProductCategory } from './expiryDateAI'

const SWEDISH_FOODS = [
  // Mejeri
  { name: 'mjölk', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'L' },
  { name: 'mjölk laktosfri', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'L' },
  { name: 'mjölk havredryck', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'L' },
  { name: 'grädde', category: 'mejeri', emoji: '🥛', defaultDays: 10, unit: 'dl' },
  { name: 'crème fraiche', category: 'mejeri', emoji: '🥄', defaultDays: 14, unit: 'dl' },
  { name: 'yoghurt naturell', category: 'mejeri', emoji: '🥄', defaultDays: 10, unit: 'st' },
  { name: 'yoghurt grekisk', category: 'mejeri', emoji: '🥄', defaultDays: 12, unit: 'st' },
  { name: 'filmjölk', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'L' },
  { name: 'smör', category: 'mejeri', emoji: '🧈', defaultDays: 30, unit: 'g' },
  { name: 'margarin', category: 'mejeri', emoji: '🧈', defaultDays: 60, unit: 'g' },
  { name: 'ost hård', category: 'mejeri', emoji: '🧀', defaultDays: 21, unit: 'g' },
  { name: 'ost mjuk', category: 'mejeri', emoji: '🧀', defaultDays: 14, unit: 'g' },
  { name: 'cottage cheese', category: 'mejeri', emoji: '🧀', defaultDays: 10, unit: 'g' },
  { name: 'feta', category: 'mejeri', emoji: '🧀', defaultDays: 14, unit: 'g' },
  { name: 'mozzarella', category: 'mejeri', emoji: '🧀', defaultDays: 10, unit: 'g' },

  // Kött & Fisk
  { name: 'kött nöt', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'kg' },
  { name: 'kött fläsk', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'kg' },
  { name: 'köttfärs', category: 'kött', emoji: '🥩', defaultDays: 2, unit: 'g' },
  { name: 'kyckling', category: 'kött', emoji: '🍗', defaultDays: 2, unit: 'kg' },
  { name: 'kött lamm', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'kg' },
  { name: 'korv', category: 'kött', emoji: '🌭', defaultDays: 7, unit: 'st' },
  { name: 'bacon', category: 'kött', emoji: '🥓', defaultDays: 7, unit: 'g' },
  { name: 'lax', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'kg' },
  { name: 'torsk', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'kg' },
  { name: 'räkor', category: 'fisk', emoji: '🦐', defaultDays: 2, unit: 'g' },
  { name: 'tonfisk konserv', category: 'konserv', emoji: '🥫', defaultDays: 1095, unit: 'st' },

  // Grönsaker
  { name: 'mörötter', category: 'grönsak', emoji: '🥕', defaultDays: 14, unit: 'kg' },
  { name: 'potatis', category: 'grönsak', emoji: '🥔', defaultDays: 21, unit: 'kg' },
  { name: 'lök', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'stycke' },
  { name: 'lök gul', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'st' },
  { name: 'lök röd', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'st' },
  { name: 'vitlök', category: 'grönsak', emoji: '🧄', defaultDays: 30, unit: 'st' },
  { name: 'tomat', category: 'grönsak', emoji: '🍅', defaultDays: 7, unit: 'kg' },
  { name: 'gurka', category: 'grönsak', emoji: '🥒', defaultDays: 7, unit: 'st' },
  { name: 'paprika röd', category: 'grönsak', emoji: '🌶️', defaultDays: 10, unit: 'st' },
  { name: 'paprika gul', category: 'grönsak', emoji: '🌶️', defaultDays: 10, unit: 'st' },
  { name: 'paprika grön', category: 'grönsak', emoji: '🌶️', defaultDays: 10, unit: 'st' },
  { name: 'broccoli', category: 'grönsak', emoji: '🥦', defaultDays: 7, unit: 'st' },
  { name: 'blomkål', category: 'grönsak', emoji: '🥬', defaultDays: 7, unit: 'st' },
  { name: 'spenat', category: 'grönsak', emoji: '🥬', defaultDays: 5, unit: 'g' },
  { name: 'sallad iceberg', category: 'grönsak', emoji: '🥬', defaultDays: 7, unit: 'st' },
  { name: 'ruccola', category: 'grönsak', emoji: '🥬', defaultDays: 5, unit: 'g' },

  // Frukt
  { name: 'äpplen', category: 'frukt', emoji: '🍎', defaultDays: 14, unit: 'kg' },
  { name: 'bananer', category: 'frukt', emoji: '🍌', defaultDays: 7, unit: 'st' },
  { name: 'apelsiner', category: 'frukt', emoji: '🍊', defaultDays: 14, unit: 'kg' },
  { name: 'citroner', category: 'frukt', emoji: '🍋', defaultDays: 21, unit: 'st' },
  { name: 'druvor', category: 'frukt', emoji: '🍇', defaultDays: 7, unit: 'kg' },
  { name: 'jordgubbar', category: 'frukt', emoji: '🍓', defaultDays: 3, unit: 'g' },
  { name: 'blåbär', category: 'frukt', emoji: '🫐', defaultDays: 5, unit: 'g' },
  { name: 'hallon', category: 'frukt', emoji: '🫐', defaultDays: 3, unit: 'g' },

  // Bröd & Spannmål  
  { name: 'bröd', category: 'bröd', emoji: '🍞', defaultDays: 5, unit: 'st' },
  { name: 'brödsmulor', category: 'bröd', emoji: '🍞', defaultDays: 30, unit: 'dl' },
  { name: 'mjöl', category: 'spannmål', emoji: '🌾', defaultDays: 365, unit: 'kg' },
  { name: 'ris', category: 'spannmål', emoji: '🍚', defaultDays: 730, unit: 'kg' },
  { name: 'pasta', category: 'spannmål', emoji: '🍝', defaultDays: 730, unit: 'g' },
  { name: 'havregryn', category: 'spannmål', emoji: '🥣', defaultDays: 365, unit: 'g' },
  { name: 'quinoa', category: 'spannmål', emoji: '🌾', defaultDays: 730, unit: 'g' },

  // Ägg
  { name: 'ägg', category: 'ägg', emoji: '🥚', defaultDays: 21, unit: 'st' },

  // Kryddor & Såser
  { name: 'salt', category: 'krydda', emoji: '🧂', defaultDays: 1095, unit: 'g' },
  { name: 'peppar svart', category: 'krydda', emoji: '🌶️', defaultDays: 730, unit: 'g' },
  { name: 'oregano', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'basilika', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'timjan', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'ketchup', category: 'sås', emoji: '🍅', defaultDays: 90, unit: 'st' },
  { name: 'senap', category: 'sås', emoji: '🟡', defaultDays: 180, unit: 'st' },
  { name: 'majonnäs', category: 'sås', emoji: '🥄', defaultDays: 60, unit: 'st' },
  { name: 'soja', category: 'sås', emoji: '🥢', defaultDays: 365, unit: 'dl' },
  { name: 'olivolja', category: 'olja', emoji: '🫒', defaultDays: 730, unit: 'dl' },
  { name: 'rapsolja', category: 'olja', emoji: '🌻', defaultDays: 365, unit: 'L' },

  // Drycker
  { name: 'kaffe', category: 'dryck', emoji: '☕', defaultDays: 365, unit: 'g' },
  { name: 'te', category: 'dryck', emoji: '🫖', defaultDays: 730, unit: 'st' },
  { name: 'juice apelsin', category: 'dryck', emoji: '🧃', defaultDays: 7, unit: 'L' },
  { name: 'juice äpple', category: 'dryck', emoji: '🧃', defaultDays: 7, unit: 'L' },
  { name: 'läsk', category: 'dryck', emoji: '🥤', defaultDays: 365, unit: 'L' },
  { name: 'öl', category: 'dryck', emoji: '🍺', defaultDays: 180, unit: 'st' },
  { name: 'vin', category: 'dryck', emoji: '🍷', defaultDays: 1095, unit: 'st' },
]

// Fuzzy search funktion
export function searchFoods(query) {
  if (!query || query.length < 1) return []
  
  const searchTerm = query.toLowerCase().trim()
  const results = []
  const allFoods = getAllFoods()
  
  allFoods.forEach(food => {
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

// Dynamiska ingredienser från recept (lagras i localStorage)
const LEARNED_INGREDIENTS_KEY = 'svinnstop_learned_ingredients'

function getLearnedIngredients() {
  try {
    const stored = localStorage.getItem(LEARNED_INGREDIENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

function saveLearnedIngredient(ingredient) {
  const learned = getLearnedIngredients()
  
  // Kolla om ingrediensen redan finns
  const exists = learned.some(item => 
    item.name.toLowerCase() === ingredient.name.toLowerCase()
  )
  
  if (!exists) {
    // Använd AI för att bestämma emoji och kategori
    const categoryWithEmoji = getProductCategory(ingredient.name)
    const emoji = categoryWithEmoji.split(' ')[0] || '🍳'
    
    learned.push({
      name: ingredient.name,
      category: categoryWithEmoji,
      emoji: emoji,
      defaultDays: 7,
      unit: ingredient.unit || 'st',
      learnedFrom: 'recipe'
    })
    
    try {
      localStorage.setItem(LEARNED_INGREDIENTS_KEY, JSON.stringify(learned))
      console.log(`✅ Lärde mig ingrediens: ${ingredient.name} ${emoji}`)
    } catch (e) {
      console.warn('Kunde inte spara lärd ingrediens:', e)
    }
  }
}

// Lär sig ingredienser från ett recept
export function learnIngredientsFromRecipe(ingredients) {
  ingredients.forEach(ingredient => {
    saveLearnedIngredient(ingredient)
  })
}

// Kombinera statiska och lärda matvaror för sökning
export function getAllFoods() {
  return [...SWEDISH_FOODS, ...getLearnedIngredients()]
}

export { SWEDISH_FOODS }
