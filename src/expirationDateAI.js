// AI-system för att gissa rimliga bäst före-datum baserat på produkttyp
export class ExpirationDateAI {
  constructor() {
    // Databas med typiska hållbarhet för olika matvaror (i dagar)
    this.productLifespans = {
      // Frukt & Grönt (rumstemperatur som bas)
      'banan': { min: 3, max: 7, typical: 5, category: 'frukt' },
      'avokado': { min: 1, max: 3, typical: 2, category: 'frukt' }, // Kort utan kylskåp
      'tomat': { min: 3, max: 5, typical: 4, category: 'grönt' }, // Kort utan kylskåp
      'gurka': { min: 2, max: 4, typical: 3, category: 'grönt' }, // Kort utan kylskåp
      'paprika': { min: 3, max: 6, typical: 4, category: 'grönt' }, // Kort utan kylskåp
      'citron': { min: 14, max: 28, typical: 21, category: 'citrus' },
      'lime': { min: 10, max: 21, typical: 14, category: 'citrus' },
      'äpple': { min: 14, max: 30, typical: 21, category: 'frukt' },
      'päron': { min: 5, max: 10, typical: 7, category: 'frukt' },
      'apelsin': { min: 14, max: 21, typical: 18, category: 'citrus' },
      'morot': { min: 14, max: 30, typical: 21, category: 'rotfrukt' },
      'potatis': { min: 30, max: 60, typical: 45, category: 'rotfrukt' },
      'lök': { min: 30, max: 90, typical: 60, category: 'rotfrukt' },
      'vitlök': { min: 30, max: 90, typical: 60, category: 'krydda' },
      'sallad': { min: 1, max: 2, typical: 1, category: 'bladgrönt' }, // Visnar snabbt utan kylskåp
      'spenat': { min: 1, max: 2, typical: 1, category: 'bladgrönt' }, // Visnar snabbt utan kylskåp
      'broccoli': { min: 2, max: 4, typical: 3, category: 'grönt' }, // Kort utan kylskåp
      'blomkål': { min: 2, max: 4, typical: 3, category: 'grönt' }, // Kort utan kylskåp
      'champinjon': { min: 1, max: 3, typical: 2, category: 'svamp' }, // Kort utan kylskåp
      'svamp': { min: 1, max: 3, typical: 2, category: 'svamp' }, // Kort utan kylskåp
      
      // Mejeriprodukter
      'mjölk': { min: 5, max: 10, typical: 7, category: 'mejeri' },
      'grädde': { min: 7, max: 14, typical: 10, category: 'mejeri' },
      'filmjölk': { min: 7, max: 14, typical: 10, category: 'mejeri' },
      'yoghurt': { min: 10, max: 21, typical: 14, category: 'mejeri' },
      'kvarg': { min: 10, max: 21, typical: 14, category: 'mejeri' },
      'ost': { min: 14, max: 30, typical: 21, category: 'mejeri' },
      'smör': { min: 30, max: 60, typical: 45, category: 'mejeri' },
      'margarin': { min: 60, max: 120, typical: 90, category: 'mejeri' },
      
      // Kött & Fisk (kort hållbarhet)
      'kött': { min: 1, max: 3, typical: 2, category: 'kött' },
      'fläsk': { min: 1, max: 3, typical: 2, category: 'kött' },
      'nöt': { min: 1, max: 4, typical: 3, category: 'kött' },
      'kyckling': { min: 1, max: 2, typical: 1, category: 'fågel' },
      'fisk': { min: 1, max: 2, typical: 1, category: 'fisk' },
      'lax': { min: 1, max: 2, typical: 1, category: 'fisk' },
      'torsk': { min: 1, max: 2, typical: 1, category: 'fisk' },
      'räkor': { min: 1, max: 2, typical: 1, category: 'skaldjur' },
      'korv': { min: 7, max: 21, typical: 14, category: 'chark' },
      'skinka': { min: 7, max: 14, typical: 10, category: 'chark' },
      'bacon': { min: 7, max: 14, typical: 10, category: 'chark' },
      
      // Ägg
      'ägg': { min: 21, max: 35, typical: 28, category: 'ägg' },
      
      // Bröd & Bakverk
      'bröd': { min: 3, max: 7, typical: 5, category: 'bröd' },
      'limpa': { min: 5, max: 10, typical: 7, category: 'bröd' },
      'tunnbröd': { min: 30, max: 90, typical: 60, category: 'bröd' },
      'knäckebröd': { min: 180, max: 365, typical: 270, category: 'torrvaror' },
      
      // Torrvaror (lång hållbarhet)
      'ris': { min: 365, max: 730, typical: 540, category: 'torrvaror' },
      'pasta': { min: 365, max: 730, typical: 540, category: 'torrvaror' },
      'mjöl': { min: 180, max: 365, typical: 270, category: 'torrvaror' },
      'socker': { min: 730, max: 1095, typical: 900, category: 'torrvaror' },
      'salt': { min: 1095, max: 1825, typical: 1460, category: 'torrvaror' },
      'olja': { min: 365, max: 730, typical: 540, category: 'torrvaror' },
      'vinäger': { min: 730, max: 1095, typical: 900, category: 'torrvaror' },
      
      // Konserver
      'konserv': { min: 365, max: 1095, typical: 730, category: 'konserver' },
      'tomater': { min: 365, max: 730, typical: 540, category: 'konserver' },
      'bönor': { min: 365, max: 1095, typical: 730, category: 'konserver' },
      
      // Kryddor & Såser
      'krydda': { min: 365, max: 730, typical: 540, category: 'kryddor' },
      'ketchup': { min: 180, max: 365, typical: 270, category: 'såser' },
      'senap': { min: 180, max: 365, typical: 270, category: 'såser' },
      'majonnäs': { min: 90, max: 180, typical: 120, category: 'såser' },
      
      // Sötsaker
      'choklad': { min: 60, max: 365, typical: 180, category: 'sötsaker' },
      'godis': { min: 180, max: 365, typical: 270, category: 'sötsaker' },
      'kex': { min: 30, max: 90, typical: 60, category: 'sötsaker' },
      'lakritsmix': { min: 90, max: 180, typical: 120, category: 'sötsaker' },
      'lakrits': { min: 90, max: 180, typical: 120, category: 'sötsaker' },
      
      // Drycker
      'juice': { min: 3, max: 7, typical: 5, category: 'drycker' },
      'mjölk': { min: 5, max: 10, typical: 7, category: 'drycker' },
      'läsk': { min: 90, max: 180, typical: 120, category: 'drycker' },
      'öl': { min: 60, max: 120, typical: 90, category: 'alkohol' },
      'vin': { min: 365, max: 1095, typical: 730, category: 'alkohol' },
      
      // Fryst
      'fryst': { min: 90, max: 365, typical: 180, category: 'fryst' },
      'glass': { min: 30, max: 90, typical: 60, category: 'fryst' }
    }
    
    // Kategoriregler för fallback
    this.categoryDefaults = {
      'frukt': { min: 3, max: 10, typical: 5 },
      'grönt': { min: 5, max: 14, typical: 7 },
      'citrus': { min: 14, max: 28, typical: 21 },
      'rotfrukt': { min: 21, max: 60, typical: 30 },
      'bladgrönt': { min: 3, max: 7, typical: 5 },
      'svamp': { min: 3, max: 7, typical: 5 },
      'mejeri': { min: 7, max: 21, typical: 14 },
      'kött': { min: 1, max: 3, typical: 2 },
      'fågel': { min: 1, max: 2, typical: 1 },
      'fisk': { min: 1, max: 2, typical: 1 },
      'skaldjur': { min: 1, max: 2, typical: 1 },
      'chark': { min: 7, max: 14, typical: 10 },
      'ägg': { min: 21, max: 35, typical: 28 },
      'bröd': { min: 3, max: 7, typical: 5 },
      'torrvaror': { min: 180, max: 730, typical: 360 },
      'konserver': { min: 365, max: 1095, typical: 730 },
      'kryddor': { min: 365, max: 730, typical: 540 },
      'såser': { min: 90, max: 365, typical: 180 },
      'sötsaker': { min: 60, max: 180, typical: 120 },
      'drycker': { min: 5, max: 10, typical: 7 },
      'alkohol': { min: 60, max: 365, typical: 180 },
      'fryst': { min: 60, max: 365, typical: 180 }
    }
  }
  
  // Huvusdmetod för att gissa bäst före-datum
  guessExpirationDate(productName) {
    const cleanName = productName.toLowerCase().trim()
    
    // Försök hitta direkt match
    const directMatch = this.findDirectMatch(cleanName)
    if (directMatch) {
      const enhanced = this.enhanceWithStorage(directMatch, cleanName)
      return this.calculateDate(enhanced, `Direkt match för "${productName}"${enhanced.storageNote ? ' (' + enhanced.storageNote + ')' : ''}`)
    }
    
    // Försök partiell matchning
    const partialMatch = this.findPartialMatch(cleanName)
    if (partialMatch) {
      const enhanced = this.enhanceWithStorage(partialMatch, cleanName)
      return this.calculateDate(enhanced, `Partiell match för "${productName}"${enhanced.storageNote ? ' (' + enhanced.storageNote + ')' : ''}`)
    }
    
    // Kategorigissning baserat på ordstruktur
    const categoryGuess = this.guessCategory(cleanName)
    if (categoryGuess) {
      const enhanced = this.enhanceWithStorage(categoryGuess, cleanName)
      return this.calculateDate(enhanced, `Kategorigissning för "${productName}"${enhanced.storageNote ? ' (' + enhanced.storageNote + ')' : ''}`)
    }
    
    // Standard fallback
    const fallback = { min: 7, max: 14, typical: 10, category: 'okänt' }
    const enhanced = this.enhanceWithStorage(fallback, cleanName)
    return this.calculateDate(
      enhanced, 
      `Standardgissning för "${productName}"${enhanced.storageNote ? ' (' + enhanced.storageNote + ')' : ''}`
    )
  }
  
  // Förbättra hållbarhet baserat på förvaring (kylskåp, frys, rumstemperatur)
  enhanceWithStorage(lifespan, productName) {
    const enhanced = { ...lifespan }
    const name = productName.toLowerCase()
    
    // Produkter som MÅSTE förvaras i kylskåp (längre hållbarhet)
    const refrigeratorRequired = [
      'mjölk', 'milk', 'grädde', 'cream', 'filmjölk', 'yoghurt', 'kvarg',
      'kött', 'meat', 'fläsk', 'nöt', 'kyckling', 'chicken', 'korv', 'sausage',
      'fisk', 'fish', 'lax', 'salmon', 'torsk', 'räkor', 'shrimp',
      'ost', 'cheese', 'smör', 'butter', 'margarin',
      'ägg', 'egg'
    ]
    
    // Produkter som håller längre i kylskåp men kan stå ute
    const benefitsFromRefrigeration = [
      'tomat', 'tomato', 'gurka', 'cucumber', 'paprika', 'pepper',
      'sallad', 'lettuce', 'spenat', 'spinach', 'broccoli', 'blomkål',
      'morot', 'carrot', 'selleri', 'celery', 'rädisa', 'radish',
      'champinjon', 'mushroom', 'svamp', 'ostron', 'shiitake',
      'avokado', 'avocado', 'citron', 'lemon', 'lime', 'apelsin', 'orange'
    ]
    
    // Produkter som INTE ska i kylskåp (inte påverkas)
    const roomTemperatureOnly = [
      'potatis', 'potato', 'lök', 'onion', 'vitlök', 'garlic',
      'banan', 'banana', 'äpple', 'apple', 'päron', 'pear',
      'bröd', 'bread', 'pasta', 'ris', 'rice', 'mjöl', 'flour',
      'socker', 'sugar', 'salt', 'olja', 'oil'
    ]
    
    let storageMultiplier = 1
    let storageNote = ''
    
    // Kylskåp KRÄVS - utan kylskåp håller de mycket kortare
    if (refrigeratorRequired.some(item => name.includes(item))) {
      // Anta kylskåpsförvaring som standard för dessa
      storageMultiplier = 1.0 // Redan kalkylerat för kylskåp
      storageNote = 'kylskåp krävs'
      
      // Extra tid för hårda ostar och smör
      if (name.includes('ost') && !name.includes('cottage') && !name.includes('keso')) {
        storageMultiplier = 1.3
        storageNote = 'hårdost i kylskåp'
      }
      
      if (name.includes('smör') || name.includes('butter')) {
        storageMultiplier = 1.5
        storageNote = 'smör i kylskåp'
      }
    }
    // Gynnas av kylskåp - dramatisk förlängning
    else if (benefitsFromRefrigeration.some(item => name.includes(item))) {
      storageMultiplier = 2.5 // 2.5x längre i kylskåp
      storageNote = 'förlängs kraftigt i kylskåp'
      
      // Bladgrönt gynnas extra mycket
      if (name.includes('sallad') || name.includes('spenat') || name.includes('rucola')) {
        storageMultiplier = 3.0
        storageNote = 'bladgrönt håller länge i kylskåp'
      }
    }
    // Rumstemperatur - ingen förändring
    else if (roomTemperatureOnly.some(item => name.includes(item))) {
      storageMultiplier = 1.0
      storageNote = 'rumstemperatur'
      
      // Potatis och lök håller länge i mörka, svala utrymmen
      if (name.includes('potatis') || name.includes('lök')) {
        storageMultiplier = 1.2
        storageNote = 'svalt och mörkt'
      }
    }
    // Okänd produkt - anta kylskåpsfördel
    else {
      storageMultiplier = 1.8
      storageNote = 'troligen längre i kylskåp'
    }
    
    // Applicera multiplier
    enhanced.min = Math.round(enhanced.min * storageMultiplier)
    enhanced.max = Math.round(enhanced.max * storageMultiplier)
    enhanced.typical = Math.round(enhanced.typical * storageMultiplier)
    enhanced.storageNote = storageNote
    
    return enhanced
  }
  
  findDirectMatch(productName) {
    return this.productLifespans[productName]
  }
  
  findPartialMatch(productName) {
    // Kolla om något nyckelord finns i produktnamnet
    for (const [keyword, lifespan] of Object.entries(this.productLifespans)) {
      if (productName.includes(keyword) || keyword.includes(productName)) {
        return lifespan
      }
    }
    return null
  }
  
  guessCategory(productName) {
    // Analysera ordstruktur och gissa kategori
    const fruitWords = ['bär', 'frukt', 'citrus', 'sweet', 'sött']
    const vegetableWords = ['sallad', 'grön', 'färsk', 'kvist', 'eko', 'bio']
    const meatWords = ['kött', 'filé', 'färs', 'skiva', 'bit']
    const dairyWords = ['mjölk', '%', 'naturell', 'grekisk', 'laktos']
    
    if (fruitWords.some(word => productName.includes(word))) {
      return this.categoryDefaults['frukt']
    }
    if (vegetableWords.some(word => productName.includes(word))) {
      return this.categoryDefaults['grönt']
    }
    if (meatWords.some(word => productName.includes(word))) {
      return this.categoryDefaults['kött']
    }
    if (dairyWords.some(word => productName.includes(word))) {
      return this.categoryDefaults['mejeri']
    }
    
    return null
  }
  
  calculateDate(lifespan, reason) {
    const today = new Date()
    const daysToAdd = lifespan.typical
    const expirationDate = new Date(today)
    expirationDate.setDate(today.getDate() + daysToAdd)
    
    return {
      date: expirationDate,
      daysFromNow: daysToAdd,
      confidence: this.getConfidence(lifespan),
      reason: reason,
      range: `${lifespan.min}-${lifespan.max} dagar`,
      category: lifespan.category || 'okänt',
      storageNote: lifespan.storageNote || null
    }
  }
  
  getConfidence(lifespan) {
    // Högre konfidens för mer specifika produkter
    const range = lifespan.max - lifespan.min
    if (range <= 3) return 'hög'
    if (range <= 7) return 'medel' 
    if (range <= 14) return 'låg'
    return 'mycket låg'
  }
  
  formatDate(date) {
    return date.toLocaleDateString('sv-SE')
  }
}

// Singleton instance
let expirationAI = null

export function getExpirationDateGuess(productName) {
  if (!expirationAI) {
    expirationAI = new ExpirationDateAI()
  }
  return expirationAI.guessExpirationDate(productName)
}