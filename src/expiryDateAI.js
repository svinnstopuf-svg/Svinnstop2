// AI-baserad utgångsdatum aproximering
// Använder produktinformation för att uppskatta hållbarhet

// Databas över typiska hållbarhetstider (i dagar från inköpsdatum)
export const PRODUCT_SHELF_LIFE = {
  // Mejeri
  'mjölk': 7,
  'milk': 7,
  'yoghurt': 14,
  'yogurt': 14,
  'fil': 14,
  'grädde': 10,
  'cream': 10,
  'ost': 21,
  'cheese': 21,
  'smör': 30,
  'butter': 30,
  
  // Kött och fisk
  'kött': 3,
  'meat': 3,
  'fisk': 2,
  'fish': 2,
  'kyckling': 3,
  'chicken': 3,
  'nötkött': 3,
  'beef': 3,
  'fläskkött': 3,
  'pork': 3,
  'korv': 7,
  'sausage': 7,
  
  // Frukt och grönt
  'äpple': 14,
  'apple': 14,
  'banan': 7,
  'banana': 7,
  'tomat': 7,
  'tomato': 7,
  'gurka': 10,
  'cucumber': 10,
  'sallad': 5,
  'lettuce': 5,
  'morötter': 21,
  'carrot': 21,
  
  // Bröd
  'bröd': 5,
  'bread': 5,
  'limpa': 7,
  'loaf': 7,
  
  // Konserver och torrvaror
  'konserv': 365,
  'canned': 365,
  'pasta': 730,
  'ris': 365,
  'rice': 365,
  'mjöl': 365,
  'flour': 365,
  
  // Frysta varor
  'fryst': 90,
  'frozen': 90,
  'glass': 30,
  'ice cream': 30,
}

// Kategorier och deras typiska hållbarhetstider
export const CATEGORY_SHELF_LIFE = {
  'mejeri': 10,        // Dairy
  'kött': 3,           // Meat
  'fisk': 2,           // Fish
  'frukt': 7,          // Fruit
  'grönsaker': 7,      // Vegetables
  'bröd': 5,           // Bread
  'konserver': 365,    // Canned goods
  'torrvaror': 365,    // Dry goods
  'frysta': 90,        // Frozen
  'drycker': 30,       // Beverages
  'godis': 180,        // Candy/sweets
  'såser': 60,         // Sauces
  'kryddor': 365       // Spices
}

// AI-funktion för att kategorisera produkter
export function categorizeProduct(productName, productInfo = null) {
  if (!productName) return 'okänd'
  
  const name = productName.toLowerCase()
  
  // Använd produktinfo om tillgänglig
  if (productInfo?.category) {
    const category = productInfo.category.toLowerCase()
    if (category.includes('dairy') || category.includes('mejeri')) return 'mejeri'
    if (category.includes('meat') || category.includes('kött')) return 'kött'
    if (category.includes('fish') || category.includes('fisk')) return 'fisk'
    if (category.includes('fruit') || category.includes('frukt')) return 'frukt'
    if (category.includes('vegetable') || category.includes('grönsaker')) return 'grönsaker'
    if (category.includes('bread') || category.includes('bröd')) return 'bröd'
    if (category.includes('frozen') || category.includes('fryst')) return 'frysta'
  }
  
  // Fallback till namn-baserad kategorisering
  // Mejeri
  if (name.includes('mjölk') || name.includes('milk') ||
      name.includes('yoghurt') || name.includes('yogurt') ||
      name.includes('fil') || name.includes('grädde') ||
      name.includes('cream') || name.includes('ost') ||
      name.includes('cheese') || name.includes('smör') ||
      name.includes('butter')) {
    return 'mejeri'
  }
  
  // Kött
  if (name.includes('kött') || name.includes('meat') ||
      name.includes('kyckling') || name.includes('chicken') ||
      name.includes('nöt') || name.includes('beef') ||
      name.includes('fläsk') || name.includes('pork') ||
      name.includes('korv') || name.includes('sausage') ||
      name.includes('bacon') || name.includes('skinka') ||
      name.includes('ham')) {
    return 'kött'
  }
  
  // Fisk
  if (name.includes('fisk') || name.includes('fish') ||
      name.includes('lax') || name.includes('salmon') ||
      name.includes('torsk') || name.includes('cod') ||
      name.includes('tonfisk') || name.includes('tuna')) {
    return 'fisk'
  }
  
  // Frukt
  if (name.includes('äpple') || name.includes('apple') ||
      name.includes('banan') || name.includes('banana') ||
      name.includes('citrus') || name.includes('orange') ||
      name.includes('druva') || name.includes('grape') ||
      name.includes('jordgubb') || name.includes('strawberry') ||
      name.includes('frukt') || name.includes('fruit')) {
    return 'frukt'
  }
  
  // Grönsaker
  if (name.includes('tomat') || name.includes('tomato') ||
      name.includes('gurka') || name.includes('cucumber') ||
      name.includes('sallad') || name.includes('lettuce') ||
      name.includes('morot') || name.includes('carrot') ||
      name.includes('potatis') || name.includes('potato') ||
      name.includes('lök') || name.includes('onion')) {
    return 'grönsaker'
  }
  
  // Bröd
  if (name.includes('bröd') || name.includes('bread') ||
      name.includes('limpa') || name.includes('loaf') ||
      name.includes('bulle') || name.includes('bun')) {
    return 'bröd'
  }
  
  // Konserver
  if (name.includes('konserv') || name.includes('canned') ||
      name.includes('burk') || name.includes('can') ||
      name.includes('tomatpuré') || name.includes('tomato paste')) {
    return 'konserver'
  }
  
  // Torrvaror
  if (name.includes('pasta') || name.includes('ris') ||
      name.includes('rice') || name.includes('mjöl') ||
      name.includes('flour') || name.includes('bönor') ||
      name.includes('beans') || name.includes('linser') ||
      name.includes('lentils')) {
    return 'torrvaror'
  }
  
  // Frysta
  if (name.includes('fryst') || name.includes('frozen') ||
      name.includes('glass') || name.includes('ice cream')) {
    return 'frysta'
  }
  
  // Drycker
  if (name.includes('saft') || name.includes('juice') ||
      name.includes('läsk') || name.includes('soda') ||
      name.includes('öl') || name.includes('beer') ||
      name.includes('vin') || name.includes('wine') ||
      name.includes('vatten') || name.includes('water')) {
    return 'drycker'
  }
  
  return 'okänd'
}

// Huvud-AI funktion för att uppskatta utgångsdatum
export function calculateExpiryDate(productName, productInfo = null, purchaseDate = null) {
  try {
    console.log('🤖 AI Utgångsdatum-beräkning för:', productName)
    
    // Använd inköpsdatum eller dagens datum
    const baseDate = purchaseDate ? new Date(purchaseDate) : new Date()
    
    // 1. Försök hitta exakt match i produkt-databas
    const name = productName.toLowerCase()
    for (const [keyword, days] of Object.entries(PRODUCT_SHELF_LIFE)) {
      if (name.includes(keyword)) {
        const expiryDate = new Date(baseDate)
        expiryDate.setDate(expiryDate.getDate() + days)
        console.log(`✅ Exakt match "${keyword}": ${days} dagar → ${expiryDate.toISOString().split('T')[0]}`)
        return expiryDate.toISOString().split('T')[0]
      }
    }
    
    // 2. Använd kategori-baserad uppskattning
    const category = categorizeProduct(productName, productInfo)
    const categoryDays = CATEGORY_SHELF_LIFE[category]
    
    if (categoryDays) {
      const expiryDate = new Date(baseDate)
      expiryDate.setDate(expiryDate.getDate() + categoryDays)
      console.log(`📂 Kategori "${category}": ${categoryDays} dagar → ${expiryDate.toISOString().split('T')[0]}`)
      return expiryDate.toISOString().split('T')[0]
    }
    
    // 3. Fallback - använd produktinfo om tillgänglig
    if (productInfo?.shelfLife) {
      const days = parseInt(productInfo.shelfLife)
      if (!isNaN(days) && days > 0) {
        const expiryDate = new Date(baseDate)
        expiryDate.setDate(expiryDate.getDate() + days)
        console.log(`📊 Produktinfo: ${days} dagar → ${expiryDate.toISOString().split('T')[0]}`)
        return expiryDate.toISOString().split('T')[0]
      }
    }
    
    // 4. Sista fallback - generisk uppskattning (7 dagar)
    const defaultDays = 7
    const expiryDate = new Date(baseDate)
    expiryDate.setDate(expiryDate.getDate() + defaultDays)
    console.log(`🔄 Standard fallback: ${defaultDays} dagar → ${expiryDate.toISOString().split('T')[0]}`)
    return expiryDate.toISOString().split('T')[0]
    
  } catch (error) {
    console.error('❌ Fel i AI utgångsdatum-beräkning:', error)
    
    // Emergency fallback
    const emergencyDate = new Date()
    emergencyDate.setDate(emergencyDate.getDate() + 7)
    return emergencyDate.toISOString().split('T')[0]
  }
}

// Hjälpfunktion för att få kategoribeskrivning
export function getProductCategory(productName, productInfo = null) {
  const category = categorizeProduct(productName, productInfo)
  
  const categoryDescriptions = {
    'mejeri': '🥛 Mejeri',
    'kött': '🥩 Kött',
    'fisk': '🐟 Fisk',
    'frukt': '🍎 Frukt',
    'grönsaker': '🥕 Grönsaker',
    'bröd': '🍞 Bröd',
    'konserver': '🥫 Konserver',
    'torrvaror': '🌾 Torrvaror',
    'frysta': '❄️ Frysta',
    'drycker': '🧃 Drycker',
    'godis': '🍭 Godis',
    'såser': '🍯 Såser',
    'kryddor': '🧂 Kryddor',
    'okänd': '❓ Okänd'
  }
  
  return categoryDescriptions[category] || '❓ Okänd'
}

// Funktion för att föreslå bättre inköpsdatum baserat på utgångsdatum
export function suggestPurchaseDate(productName, expiryDate) {
  const category = categorizeProduct(productName)
  const categoryDays = CATEGORY_SHELF_LIFE[category] || 7
  
  const expiry = new Date(expiryDate)
  const suggestedPurchase = new Date(expiry)
  suggestedPurchase.setDate(suggestedPurchase.getDate() - categoryDays)
  
  return suggestedPurchase.toISOString().split('T')[0]
}