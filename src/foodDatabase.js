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
  { name: 'nötkött', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'g' },
  { name: 'kött', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'g' },
  { name: 'kött fläsk', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'kg' },
  { name: 'fläsk', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'g' },
  { name: 'rökt fläsk', category: 'kött', emoji: '🥓', defaultDays: 14, unit: 'g' },
  { name: 'köttfärs', category: 'kött', emoji: '🥩', defaultDays: 2, unit: 'g' },
  { name: 'kyckling', category: 'kött', emoji: '🍗', defaultDays: 2, unit: 'kg' },
  { name: 'kycklingfilé', category: 'kött', emoji: '🍗', defaultDays: 2, unit: 'g' },
  { name: 'kycklinglår', category: 'kött', emoji: '🍗', defaultDays: 2, unit: 'g' },
  { name: 'kött lamm', category: 'kött', emoji: '🥩', defaultDays: 3, unit: 'kg' },
  { name: 'korv', category: 'kött', emoji: '🌭', defaultDays: 7, unit: 'st' },
  { name: 'falukorv', category: 'kött', emoji: '🌭', defaultDays: 14, unit: 'g' },
  { name: 'bacon', category: 'kött', emoji: '🥓', defaultDays: 7, unit: 'g' },
  { name: 'lax', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'kg' },
  { name: 'laxfilé', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'g' },
  { name: 'rökt lax', category: 'fisk', emoji: '🐟', defaultDays: 7, unit: 'g' },
  { name: 'torsk', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'kg' },
  { name: 'torskfilé', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'g' },
  { name: 'strömmingsfilé', category: 'fisk', emoji: '🐟', defaultDays: 2, unit: 'g' },
  { name: 'ansovis', category: 'fisk', emoji: '🐟', defaultDays: 365, unit: 'g' },
  { name: 'räkor', category: 'fisk', emoji: '🦐', defaultDays: 2, unit: 'g' },
  { name: 'räksmör', category: 'fisk', emoji: '🦐', defaultDays: 7, unit: 'g' },
  { name: 'tonfisk konserv', category: 'konserv', emoji: '🥫', defaultDays: 1095, unit: 'st' },
  { name: 'tonfisk', category: 'fisk', emoji: '🐟', defaultDays: 365, unit: 'g' },

  // Grönsaker
  { name: 'mörötter', category: 'grönsak', emoji: '🥕', defaultDays: 14, unit: 'kg' },
  { name: 'morot', category: 'grönsak', emoji: '🥕', defaultDays: 14, unit: 'st' },
  { name: 'potatis', category: 'grönsak', emoji: '🥔', defaultDays: 21, unit: 'kg' },
  { name: 'sötpotatis', category: 'grönsak', emoji: '🍠', defaultDays: 14, unit: 'st' },
  { name: 'lök', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'stycke' },
  { name: 'lök gul', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'st' },
  { name: 'lök röd', category: 'grönsak', emoji: '🧅', defaultDays: 30, unit: 'st' },
  { name: 'vitlök', category: 'grönsak', emoji: '🧄', defaultDays: 30, unit: 'st' },
  { name: 'tomat', category: 'grönsak', emoji: '🍅', defaultDays: 7, unit: 'kg' },
  { name: 'krossade tomater', category: 'konserv', emoji: '🍅', defaultDays: 730, unit: 'g' },
  { name: 'tomatpuré', category: 'sås', emoji: '🍅', defaultDays: 365, unit: 'g' },
  { name: 'tomatsås', category: 'sås', emoji: '🍅', defaultDays: 365, unit: 'g' },
  { name: 'gurka', category: 'grönsak', emoji: '🥒', defaultDays: 7, unit: 'st' },
  { name: 'paprika röd', category: 'grönsak', emoji: '🫑', defaultDays: 10, unit: 'st' },
  { name: 'paprika gul', category: 'grönsak', emoji: '🫑', defaultDays: 10, unit: 'st' },
  { name: 'paprika grön', category: 'grönsak', emoji: '🫑', defaultDays: 10, unit: 'st' },
  { name: 'paprika', category: 'grönsak', emoji: '🫑', defaultDays: 10, unit: 'st' },
  { name: 'broccoli', category: 'grönsak', emoji: '🥦', defaultDays: 7, unit: 'st' },
  { name: 'blomkål', category: 'grönsak', emoji: '🥬', defaultDays: 7, unit: 'st' },
  { name: 'spenat', category: 'grönsak', emoji: '🥬', defaultDays: 5, unit: 'g' },
  { name: 'sallad iceberg', category: 'grönsak', emoji: '🥬', defaultDays: 7, unit: 'st' },
  { name: 'sallad', category: 'grönsak', emoji: '🥬', defaultDays: 5, unit: 'g' },
  { name: 'ruccola', category: 'grönsak', emoji: '🥬', defaultDays: 5, unit: 'g' },
  { name: 'champinjoner', category: 'grönsak', emoji: '🍄', defaultDays: 7, unit: 'g' },
  { name: 'avokado', category: 'grönsak', emoji: '🥑', defaultDays: 5, unit: 'st' },
  { name: 'grönsaker', category: 'grönsak', emoji: '🥦', defaultDays: 7, unit: 'g' },
  { name: 'gröna bönor', category: 'grönsak', emoji: '🫘', defaultDays: 7, unit: 'g' },
  { name: 'ingefära', category: 'krydda', emoji: '🧅', defaultDays: 21, unit: 'g' },
  { name: 'dill', category: 'krydda', emoji: '🌿', defaultDays: 7, unit: 'g' },
  { name: 'koriander', category: 'krydda', emoji: '🌿', defaultDays: 7, unit: 'g' },

  // Frukt
  { name: 'äpplen', category: 'frukt', emoji: '🍎', defaultDays: 14, unit: 'kg' },
  { name: 'äpple', category: 'frukt', emoji: '🍎', defaultDays: 14, unit: 'st' },
  { name: 'bananer', category: 'frukt', emoji: '🍌', defaultDays: 7, unit: 'st' },
  { name: 'apelsiner', category: 'frukt', emoji: '🍊', defaultDays: 14, unit: 'kg' },
  { name: 'citroner', category: 'frukt', emoji: '🍋', defaultDays: 21, unit: 'st' },
  { name: 'citron', category: 'frukt', emoji: '🍋', defaultDays: 21, unit: 'st' },
  { name: 'lime', category: 'frukt', emoji: '🍋', defaultDays: 21, unit: 'st' },
  { name: 'druvor', category: 'frukt', emoji: '🍇', defaultDays: 7, unit: 'kg' },
  { name: 'jordgubbar', category: 'frukt', emoji: '🍓', defaultDays: 3, unit: 'g' },
  { name: 'blåbär', category: 'frukt', emoji: '🫐', defaultDays: 5, unit: 'g' },
  { name: 'hallon', category: 'frukt', emoji: '🫐', defaultDays: 3, unit: 'g' },
  { name: 'kokos', category: 'frukt', emoji: '🥥', defaultDays: 365, unit: 'g' },

  // Bröd & Spannmål  
  { name: 'bröd', category: 'bröd', emoji: '🍞', defaultDays: 5, unit: 'st' },
  { name: 'brödsmulor', category: 'bröd', emoji: '🍞', defaultDays: 30, unit: 'dl' },
  { name: 'ströbröd', category: 'bröd', emoji: '🍞', defaultDays: 90, unit: 'dl' },
  { name: 'hamburgerbröd', category: 'bröd', emoji: '🍔', defaultDays: 7, unit: 'st' },
  { name: 'pitabröd', category: 'bröd', emoji: '🫓', defaultDays: 7, unit: 'st' },
  { name: 'tacoskal', category: 'bröd', emoji: '🌮', defaultDays: 180, unit: 'st' },
  { name: 'mjöl', category: 'spannmål', emoji: '🌾', defaultDays: 365, unit: 'kg' },
  { name: 'ris', category: 'spannmål', emoji: '🍚', defaultDays: 730, unit: 'kg' },
  { name: 'jasminris', category: 'spannmål', emoji: '🍚', defaultDays: 730, unit: 'g' },
  { name: 'pasta', category: 'spannmål', emoji: '🍝', defaultDays: 730, unit: 'g' },
  { name: 'makaroner', category: 'spannmål', emoji: '🍝', defaultDays: 730, unit: 'g' },
  { name: 'lasagneplattor', category: 'spannmål', emoji: '🍝', defaultDays: 730, unit: 'g' },
  { name: 'havregryn', category: 'spannmål', emoji: '🥣', defaultDays: 365, unit: 'g' },
  { name: 'quinoa', category: 'spannmål', emoji: '🌾', defaultDays: 730, unit: 'g' },

  // Ägg & Mejeriprodukter
  { name: 'ägg', category: 'ägg', emoji: '🥚', defaultDays: 21, unit: 'st' },
  { name: 'äggulor', category: 'ägg', emoji: '🥚', defaultDays: 2, unit: 'st' },
  { name: 'gräddfil', category: 'mejeri', emoji: '🥛', defaultDays: 14, unit: 'dl' },
  { name: 'grädde', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'dl' },
  { name: 'mjölk', category: 'mejeri', emoji: '🥛', defaultDays: 7, unit: 'L' },
  { name: 'yoghurt', category: 'mejeri', emoji: '🥛', defaultDays: 14, unit: 'st' },
  { name: 'parmesan', category: 'ost', emoji: '🧀', defaultDays: 60, unit: 'g' },
  { name: 'ost', category: 'ost', emoji: '🧀', defaultDays: 21, unit: 'g' },
  { name: 'halloumi', category: 'ost', emoji: '🧀', defaultDays: 14, unit: 'g' },
  { name: 'ricotta', category: 'ost', emoji: '🧀', defaultDays: 7, unit: 'g' },
  { name: 'mascarpone', category: 'ost', emoji: '🧀', defaultDays: 7, unit: 'g' },
  { name: 'smör', category: 'mejeri', emoji: '🧈', defaultDays: 60, unit: 'g' },

  // Kryddor & Såser
  { name: 'salt', category: 'krydda', emoji: '🧂', defaultDays: 1095, unit: 'g' },
  { name: 'peppar svart', category: 'krydda', emoji: '🌶️', defaultDays: 730, unit: 'g' },
  { name: 'svartpeppar', category: 'krydda', emoji: '🌶️', defaultDays: 730, unit: 'msk' },
  { name: 'chili', category: 'krydda', emoji: '🌶️', defaultDays: 365, unit: 'g' },
  { name: 'chilisås', category: 'sås', emoji: '🌶️', defaultDays: 180, unit: 'msk' },
  { name: 'kummin', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'msk' },
  { name: 'kanel', category: 'krydda', emoji: '🟤', defaultDays: 730, unit: 'msk' },
  { name: 'oregano', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'basilika', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'timjan', category: 'krydda', emoji: '🌿', defaultDays: 365, unit: 'g' },
  { name: 'lagerblad', category: 'krydda', emoji: '🍃', defaultDays: 730, unit: 'st' },
  { name: 'tacokrydda', category: 'krydda', emoji: '🌮', defaultDays: 365, unit: 'msk' },
  { name: 'currypasta', category: 'krydda', emoji: '🍛', defaultDays: 365, unit: 'msk' },
  { name: 'grön currypasta', category: 'krydda', emoji: '🍛', defaultDays: 365, unit: 'msk' },
  { name: 'ketchup', category: 'sås', emoji: '🍅', defaultDays: 90, unit: 'st' },
  { name: 'senap', category: 'sås', emoji: '🟡', defaultDays: 180, unit: 'st' },
  { name: 'majonnäs', category: 'sås', emoji: '🥄', defaultDays: 60, unit: 'st' },
  { name: 'soja', category: 'sås', emoji: '🥢', defaultDays: 365, unit: 'msk' },
  { name: 'honung', category: 'sötsak', emoji: '🍯', defaultDays: 1095, unit: 'msk' },
  { name: 'sirap', category: 'sötsak', emoji: '🍯', defaultDays: 365, unit: 'msk' },
  { name: 'tzatziki', category: 'sås', emoji: '🥒', defaultDays: 7, unit: 'dl' },
  { name: 'bearnaisesås', category: 'sås', emoji: '🥄', defaultDays: 14, unit: 'dl' },
  { name: 'bbq-sås', category: 'sås', emoji: '🍖', defaultDays: 180, unit: 'dl' },
  { name: 'olivolja', category: 'olja', emoji: '🫒', defaultDays: 730, unit: 'dl' },
  { name: 'rapsolja', category: 'olja', emoji: '🌻', defaultDays: 365, unit: 'L' },
  { name: 'fiskbuljong', category: 'buljong', emoji: '🐟', defaultDays: 730, unit: 'msk' },
  { name: 'grönsaksbuljong', category: 'buljong', emoji: '🥦', defaultDays: 730, unit: 'msk' },

  // Drycker
  { name: 'kaffe', category: 'dryck', emoji: '☕', defaultDays: 365, unit: 'g' },
  { name: 'kallt kaffe', category: 'dryck', emoji: '☕', defaultDays: 3, unit: 'dl' },
  { name: 'te', category: 'dryck', emoji: '🫖', defaultDays: 730, unit: 'st' },
  { name: 'juice apelsin', category: 'dryck', emoji: '🧃', defaultDays: 7, unit: 'L' },
  { name: 'juice äpple', category: 'dryck', emoji: '🧃', defaultDays: 7, unit: 'L' },
  { name: 'läsk', category: 'dryck', emoji: '🥤', defaultDays: 365, unit: 'L' },
  { name: 'öl', category: 'dryck', emoji: '🍺', defaultDays: 180, unit: 'st' },
  { name: 'vin', category: 'dryck', emoji: '🍷', defaultDays: 1095, unit: 'st' },
  { name: 'kokosmjölk', category: 'dryck', emoji: '🥥', defaultDays: 730, unit: 'ml' },

  // Baljväxter & Nötter
  { name: 'gula ärtor', category: 'baljväxt', emoji: '🫛', defaultDays: 730, unit: 'g' },
  { name: 'röda linser', category: 'baljväxt', emoji: '🫘', defaultDays: 730, unit: 'g' },
  { name: 'svarta bönor', category: 'baljväxt', emoji: '🫘', defaultDays: 730, unit: 'g' },
  { name: 'kikärtor', category: 'baljväxt', emoji: '🫘', defaultDays: 730, unit: 'g' },
  { name: 'majs', category: 'grönsak', emoji: '🌽', defaultDays: 365, unit: 'g' },
  { name: 'jordnötter', category: 'nötter', emoji: '🥜', defaultDays: 365, unit: 'g' },
  { name: 'valnötter', category: 'nötter', emoji: '🥜', defaultDays: 365, unit: 'g' },

  // Bakning
  { name: 'socker', category: 'bakning', emoji: '🧂', defaultDays: 1095, unit: 'dl' },
  { name: 'florsocker', category: 'bakning', emoji: '🧂', defaultDays: 1095, unit: 'dl' },
  { name: 'farinsocker', category: 'bakning', emoji: '🧂', defaultDays: 1095, unit: 'dl' },
  { name: 'vaniljsocker', category: 'bakning', emoji: '✨', defaultDays: 730, unit: 'msk' },
  { name: 'vaniljstång', category: 'bakning', emoji: '✨', defaultDays: 730, unit: 'st' },
  { name: 'vaniljkräm', category: 'bakning', emoji: '✨', defaultDays: 14, unit: 'dl' },
  { name: 'bakpulver', category: 'bakning', emoji: '🧁', defaultDays: 365, unit: 'msk' },
  { name: 'kakao', category: 'bakning', emoji: '🍫', defaultDays: 730, unit: 'msk' },
  { name: 'mörk choklad', category: 'sötsak', emoji: '🍫', defaultDays: 365, unit: 'g' },
  { name: 'marsipan', category: 'bakning', emoji: '🥜', defaultDays: 180, unit: 'g' },
  { name: 'sylt', category: 'sötsak', emoji: '🍓', defaultDays: 365, unit: 'dl' },
  { name: 'gelatin', category: 'bakning', emoji: '🥄', defaultDays: 1095, unit: 'g' },
  { name: 'savoiardkex', category: 'bakning', emoji: '🍪', defaultDays: 180, unit: 'g' },
  { name: 'savoiardikex', category: 'bakning', emoji: '🍪', defaultDays: 180, unit: 'g' },
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
