// Comprehensive Swedish food database for smart autocomplete
// Organized by category with search keywords and default properties

export const SWEDISH_FOODS = {
  // === MEJERI & ÄGG ===
  'mjölk': {
    name: 'Mjölk',
    category: 'mejeri',
    unit: 'liter', 
    defaultQuantity: 1,
    shelfLifeDays: 7,
    keywords: ['mjolk', 'milk', 'mjölk 3%', 'mjölk 1.5%', 'lättmjölk', 'standardmjölk'],
    emoji: '🥛'
  },
  'grädde': {
    name: 'Grädde',
    category: 'mejeri',
    unit: 'dl',
    defaultQuantity: 5,
    shelfLifeDays: 10,
    keywords: ['gradde', 'cream', 'vispsgrädde', 'matlagningsgrädde'],
    emoji: '🥛'
  },
  'smör': {
    name: 'Smör',
    category: 'mejeri',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 21,
    keywords: ['smor', 'butter', 'bregott'],
    emoji: '🧈'
  },
  'ägg': {
    name: 'Ägg',
    category: 'mejeri',
    unit: 'st',
    defaultQuantity: 12,
    shelfLifeDays: 21,
    keywords: ['agg', 'eggs', 'äggpaket', '12-pack'],
    emoji: '🥚'
  },
  'yoghurt': {
    name: 'Yoghurt',
    category: 'mejeri',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 14,
    keywords: ['yogurt', 'naturell yoghurt', 'grekisk yoghurt'],
    emoji: '🥛'
  },
  'ost': {
    name: 'Ost',
    category: 'mejeri',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 14,
    keywords: ['cheese', 'hårdost', 'västerbottenost', 'herrgård'],
    emoji: '🧀'
  },
  'keso': {
    name: 'Keso',
    category: 'mejeri',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 10,
    keywords: ['cottage cheese', 'kvarg'],
    emoji: '🧀'
  },

  // === KÖTT & CHARK ===
  'kyckling': {
    name: 'Kyckling',
    category: 'kött',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 3,
    keywords: ['chicken', 'kycklingfilé', 'kycklinglår'],
    emoji: '🐔'
  },
  'fläskkött': {
    name: 'Fläskkött',
    category: 'kött',
    unit: 'kg',
    defaultQuantity: 0.5,
    shelfLifeDays: 3,
    keywords: ['pork', 'fläsk', 'griskött', 'kotlett'],
    emoji: '🥩'
  },
  'nötkött': {
    name: 'Nötkött',
    category: 'kött',
    unit: 'kg',
    defaultQuantity: 0.5,
    shelfLifeDays: 3,
    keywords: ['beef', 'nöt', 'oxkött', 'biff'],
    emoji: '🥩'
  },
  'köttfärs': {
    name: 'Köttfärs',
    category: 'kött',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 2,
    keywords: ['färs', 'malet kött', 'blandfärs'],
    emoji: '🥩'
  },
  'korv': {
    name: 'Korv',
    category: 'kött',
    unit: 'g',
    defaultQuantity: 400,
    shelfLifeDays: 7,
    keywords: ['sausage', 'prinskorv', 'falukorv'],
    emoji: '🌭'
  },
  'skinka': {
    name: 'Skinka',
    category: 'kött',
    unit: 'g',
    defaultQuantity: 200,
    shelfLifeDays: 5,
    keywords: ['ham', 'julskinka', 'rökt skinka'],
    emoji: '🍖'
  },

  // === FISK & SKALDJUR ===
  'lax': {
    name: 'Lax',
    category: 'fisk',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 2,
    keywords: ['salmon', 'laxfilé', 'gravlax'],
    emoji: '🐟'
  },
  'torsk': {
    name: 'Torsk',
    category: 'fisk',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 2,
    keywords: ['cod', 'torskfilé'],
    emoji: '🐟'
  },
  'räkor': {
    name: 'Räkor',
    category: 'fisk',
    unit: 'g',
    defaultQuantity: 200,
    shelfLifeDays: 3,
    keywords: ['shrimp', 'skalade räkor'],
    emoji: '🦐'
  },

  // === FRUKT ===
  'äpplen': {
    name: 'Äpplen',
    category: 'frukt',
    unit: 'st',
    defaultQuantity: 6,
    shelfLifeDays: 14,
    keywords: ['apples', 'äpple', 'röda äpplen', 'gröna äpplen'],
    emoji: '🍎'
  },
  'bananer': {
    name: 'Bananer',
    category: 'frukt',
    unit: 'st',
    defaultQuantity: 6,
    shelfLifeDays: 5,
    keywords: ['bananas', 'banan'],
    emoji: '🍌'
  },
  'apelsiner': {
    name: 'Apelsiner',
    category: 'frukt',
    unit: 'st',
    defaultQuantity: 4,
    shelfLifeDays: 10,
    keywords: ['oranges', 'apelsin', 'pressapelsiner'],
    emoji: '🍊'
  },
  'citroner': {
    name: 'Citroner',
    category: 'frukt',
    unit: 'st',
    defaultQuantity: 3,
    shelfLifeDays: 14,
    keywords: ['lemons', 'citron'],
    emoji: '🍋'
  },
  'vindruvor': {
    name: 'Vindruvor',
    category: 'frukt',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 7,
    keywords: ['grapes', 'blå vindruvor', 'gröna vindruvor'],
    emoji: '🍇'
  },
  'päron': {
    name: 'Päron',
    category: 'frukt',
    unit: 'st',
    defaultQuantity: 4,
    shelfLifeDays: 7,
    keywords: ['pears'],
    emoji: '🍐'
  },
  'bär': {
    name: 'Bär',
    category: 'frukt',
    unit: 'g',
    defaultQuantity: 250,
    shelfLifeDays: 3,
    keywords: ['berries', 'blåbär', 'hallon', 'jordgubbar'],
    emoji: '🫐'
  },

  // === GRÖNSAKER ===
  'potatis': {
    name: 'Potatis',
    category: 'grönsaker',
    unit: 'kg',
    defaultQuantity: 2,
    shelfLifeDays: 14,
    keywords: ['potato', 'färskpotatis', 'mjölig potatis'],
    emoji: '🥔'
  },
  'morötter': {
    name: 'Morötter',
    category: 'grönsaker',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 14,
    keywords: ['carrots', 'morot'],
    emoji: '🥕'
  },
  'lök': {
    name: 'Lök',
    category: 'grönsaker',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 21,
    keywords: ['onions', 'gul lök', 'rödlök'],
    emoji: '🧅'
  },
  'vitlök': {
    name: 'Vitlök',
    category: 'grönsaker',
    unit: 'st',
    defaultQuantity: 1,
    shelfLifeDays: 30,
    keywords: ['garlic'],
    emoji: '🧄'
  },
  'tomater': {
    name: 'Tomater',
    category: 'grönsaker',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 7,
    keywords: ['tomatoes', 'tomat', 'körsbärstomater'],
    emoji: '🍅'
  },
  'gurka': {
    name: 'Gurka',
    category: 'grönsaker',
    unit: 'st',
    defaultQuantity: 1,
    shelfLifeDays: 7,
    keywords: ['cucumber'],
    emoji: '🥒'
  },
  'paprika': {
    name: 'Paprika',
    category: 'grönsaker',
    unit: 'st',
    defaultQuantity: 3,
    shelfLifeDays: 7,
    keywords: ['bell pepper', 'röd paprika', 'gul paprika'],
    emoji: '🫑'
  },
  'sallad': {
    name: 'Sallad',
    category: 'grönsaker',
    unit: 'st',
    defaultQuantity: 1,
    shelfLifeDays: 5,
    keywords: ['lettuce', 'isbergssallad', 'ruccola'],
    emoji: '🥬'
  },
  'broccoli': {
    name: 'Broccoli',
    category: 'grönsaker',
    unit: 'st',
    defaultQuantity: 1,
    shelfLifeDays: 5,
    keywords: ['broccoli'],
    emoji: '🥦'
  },

  // === BRÖD & BAGERI ===
  'bröd': {
    name: 'Bröd',
    category: 'bageri',
    unit: 'st',
    defaultQuantity: 1,
    shelfLifeDays: 3,
    keywords: ['bread', 'limpa', 'fullkornsbröd', 'vitt bröd'],
    emoji: '🍞'
  },
  'knäckebröd': {
    name: 'Knäckebröd',
    category: 'bageri',
    unit: 'paket',
    defaultQuantity: 1,
    shelfLifeDays: 90,
    keywords: ['crisp bread', 'rågknäcke'],
    emoji: '🍞'
  },
  'bullar': {
    name: 'Bullar',
    category: 'bageri',
    unit: 'st',
    defaultQuantity: 8,
    shelfLifeDays: 2,
    keywords: ['buns', 'hamburgerbröd', 'semlor'],
    emoji: '🥖'
  },

  // === TORRVAROR ===
  'pasta': {
    name: 'Pasta',
    category: 'torrvaror',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 365,
    keywords: ['spaghetti', 'makaroner', 'penne'],
    emoji: '🍝'
  },
  'ris': {
    name: 'Ris',
    category: 'torrvaror',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 365,
    keywords: ['rice', 'jasminris', 'basmatiris'],
    emoji: '🍚'
  },
  'mjöl': {
    name: 'Mjöl',
    category: 'torrvaror',
    unit: 'kg',
    defaultQuantity: 2,
    shelfLifeDays: 180,
    keywords: ['flour', 'vetemjöl', 'råmjöl'],
    emoji: '🌾'
  },
  'socker': {
    name: 'Socker',
    category: 'torrvaror',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 365,
    keywords: ['sugar', 'strösocker'],
    emoji: '🧂'
  },
  'salt': {
    name: 'Salt',
    category: 'torrvaror',
    unit: 'kg',
    defaultQuantity: 1,
    shelfLifeDays: 365,
    keywords: ['table salt', 'havsalt'],
    emoji: '🧂'
  },

  // === DRYCKER ===
  'juice': {
    name: 'Juice',
    category: 'drycker',
    unit: 'liter',
    defaultQuantity: 1,
    shelfLifeDays: 5,
    keywords: ['apelsinjuice', 'äppeljuice', 'cranberryjuice'],
    emoji: '🧃'
  },
  'läsk': {
    name: 'Läsk',
    category: 'drycker',
    unit: 'liter',
    defaultQuantity: 1.5,
    shelfLifeDays: 90,
    keywords: ['soda', 'coca cola', 'pepsi', 'fanta'],
    emoji: '🥤'
  },
  'vatten': {
    name: 'Vatten',
    category: 'drycker',
    unit: 'liter',
    defaultQuantity: 1.5,
    shelfLifeDays: 365,
    keywords: ['water', 'mineralvatten', 'kallvatten'],
    emoji: '💧'
  },
  'kaffe': {
    name: 'Kaffe',
    category: 'drycker',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 90,
    keywords: ['coffee', 'bryggkaffe', 'snabbkaffe'],
    emoji: '☕'
  },
  'te': {
    name: 'Te',
    category: 'drycker',
    unit: 'paket',
    defaultQuantity: 1,
    shelfLifeDays: 365,
    keywords: ['tea', 'svart te', 'grönt te'],
    emoji: '🫖'
  },

  // === FRYSTA VAROR ===
  'glass': {
    name: 'Glass',
    category: 'fryst',
    unit: 'liter',
    defaultQuantity: 1,
    shelfLifeDays: 90,
    keywords: ['ice cream', 'vaniljglass'],
    emoji: '🍦'
  },
  'frysta grönsaker': {
    name: 'Frysta grönsaker',
    category: 'fryst',
    unit: 'g',
    defaultQuantity: 500,
    shelfLifeDays: 180,
    keywords: ['frozen vegetables', 'frysta ärtor', 'frysta bönor'],
    emoji: '🥶'
  },
  'pizza': {
    name: 'Fryst pizza',
    category: 'fryst',
    unit: 'st',
    defaultQuantity: 1,
    shelfLifeDays: 90,
    keywords: ['frozen pizza'],
    emoji: '🍕'
  }
}

// Search function with fuzzy matching
export function searchFoods(query) {
  if (!query || query.length < 1) return []
  
  const lowerQuery = query.toLowerCase().trim()
  const results = []
  
  // Exact name matches (highest priority)
  for (const [key, food] of Object.entries(SWEDISH_FOODS)) {
    if (food.name.toLowerCase() === lowerQuery) {
      results.push({ ...food, key, score: 100 })
    }
  }
  
  // Name starts with query (high priority)
  for (const [key, food] of Object.entries(SWEDISH_FOODS)) {
    if (food.name.toLowerCase().startsWith(lowerQuery) && !results.find(r => r.key === key)) {
      results.push({ ...food, key, score: 90 })
    }
  }
  
  // Name contains query (medium priority)
  for (const [key, food] of Object.entries(SWEDISH_FOODS)) {
    if (food.name.toLowerCase().includes(lowerQuery) && !results.find(r => r.key === key)) {
      results.push({ ...food, key, score: 80 })
    }
  }
  
  // Keywords match (lower priority)
  for (const [key, food] of Object.entries(SWEDISH_FOODS)) {
    const keywordMatch = food.keywords.some(keyword => 
      keyword.toLowerCase().includes(lowerQuery)
    )
    if (keywordMatch && !results.find(r => r.key === key)) {
      results.push({ ...food, key, score: 70 })
    }
  }
  
  // Sort by score and return top 8 results for mobile
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

// Get smart defaults for a food item
export function getFoodDefaults(foodKey) {
  const food = SWEDISH_FOODS[foodKey]
  if (!food) return null
  
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + food.shelfLifeDays)
  
  return {
    name: food.name,
    quantity: food.defaultQuantity,
    unit: food.unit,
    expiresAt: expiryDate.toISOString().split('T')[0],
    category: food.category,
    emoji: food.emoji
  }
}

// Categories for templates
export const FOOD_CATEGORIES = {
  mejeri: { name: 'Mejeri & ägg', emoji: '🥛' },
  kött: { name: 'Kött & chark', emoji: '🥩' },
  fisk: { name: 'Fisk & skaldjur', emoji: '🐟' },
  frukt: { name: 'Frukt', emoji: '🍎' },
  grönsaker: { name: 'Grönsaker', emoji: '🥕' },
  bageri: { name: 'Bröd & bageri', emoji: '🍞' },
  torrvaror: { name: 'Torrvaror', emoji: '🌾' },
  drycker: { name: 'Drycker', emoji: '🥤' },
  fryst: { name: 'Frysta varor', emoji: '🥶' }
}

// Common shopping templates
export const SHOPPING_TEMPLATES = {
  breakfast: {
    name: 'Frukost',
    emoji: '🍳',
    items: ['mjölk', 'bröd', 'ägg', 'smör', 'juice', 'kaffe']
  },
  weekly: {
    name: 'Veckohandla',
    emoji: '🛒',
    items: ['mjölk', 'bröd', 'ägg', 'kyckling', 'potatis', 'morötter', 'lök', 'pasta']
  },
  dinner: {
    name: 'Middag idag',
    emoji: '🍽️',
    items: ['kött', 'potatis', 'grönsaker']
  },
  snacks: {
    name: 'Mellanmål',
    emoji: '🍿',
    items: ['frukt', 'yoghurt', 'nötter']
  }
}