// Förbättrad AI-motor för utgångsdatum med självlärande funktioner
import { PRODUCT_SHELF_LIFE, CATEGORY_SHELF_LIFE, categorizeProduct } from './expiryDateAI'

const LEARNING_KEY = 'svinnstop_ai_learning'
const USER_ADJUSTMENTS_KEY = 'svinnstop_user_adjustments'

// Laddning av användarjusteringar och lärdata
function loadLearningData() {
  try {
    const data = localStorage.getItem(LEARNING_KEY)
    return data ? JSON.parse(data) : {
      productAdjustments: {}, // produkt -> genomsnittlig justering i dagar
      categoryAdjustments: {}, // kategori -> genomsnittlig justering
      userPatterns: [], // historik av justeringar
      confidence: {} // hur säker AI:n är på varje kategori
    }
  } catch (error) {
    console.error('Fel vid laddning av lärdata:', error)
    return { productAdjustments: {}, categoryAdjustments: {}, userPatterns: [], confidence: {} }
  }
}

function saveLearningData(data) {
  try {
    localStorage.setItem(LEARNING_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Fel vid sparande av lärdata:', error)
  }
}

// Beräkna genomsnittlig justering för en produkt/kategori
function calculateAverageAdjustment(adjustments) {
  if (adjustments.length === 0) return 0
  const sum = adjustments.reduce((acc, adj) => acc + adj.daysDifference, 0)
  return Math.round(sum / adjustments.length)
}

// Lär av användarjusteringar
export function learnFromUserAdjustment(productName, originalDate, newDate, category, reason = '') {
  const learningData = loadLearningData()
  
  // Beräkna skillnaden i dagar
  const original = new Date(originalDate)
  const adjusted = new Date(newDate)
  const daysDifference = Math.round((adjusted - original) / (1000 * 60 * 60 * 24))
  
  console.log(`🧠 AI lär sig: ${productName} justerades ${daysDifference} dagar (${reason})`)
  
  // Spara justering för specifik produkt
  const productKey = productName.toLowerCase()
  if (!learningData.productAdjustments[productKey]) {
    learningData.productAdjustments[productKey] = []
  }
  learningData.productAdjustments[productKey].push({
    daysDifference,
    date: new Date().toISOString(),
    reason,
    originalCategory: category
  })
  
  // Spara justering för kategori
  if (category && category !== '❓ Okänd') {
    const categoryKey = category.replace(/[🥛🥩🐟🍎🥕🍞🥫🌾❄️🧃🍭🍯🧂]/g, '').trim()
    if (!learningData.categoryAdjustments[categoryKey]) {
      learningData.categoryAdjustments[categoryKey] = []
    }
    learningData.categoryAdjustments[categoryKey].push({
      daysDifference,
      date: new Date().toISOString(),
      reason,
      productName
    })
  }
  
  // Lägg till i historik
  learningData.userPatterns.push({
    productName,
    category,
    daysDifference,
    reason,
    timestamp: Date.now()
  })
  
  // Begränsa historik till senaste 1000 justeringar
  if (learningData.userPatterns.length > 1000) {
    learningData.userPatterns = learningData.userPatterns.slice(-1000)
  }
  
  // Uppdatera konfidensnivå
  updateConfidence(learningData, category, Math.abs(daysDifference))
  
  saveLearningData(learningData)
}

// Uppdatera konfidensnivå för kategorier
function updateConfidence(learningData, category, adjustmentMagnitude) {
  if (!category || category === '❓ Okänd') return
  
  const categoryKey = category.replace(/[🥛🥩🐟🍎🥕🍞🥫🌾❄️🧃🍭🍯🧂]/g, '').trim()
  
  if (!learningData.confidence[categoryKey]) {
    learningData.confidence[categoryKey] = { score: 50, adjustments: 0 }
  }
  
  const conf = learningData.confidence[categoryKey]
  conf.adjustments++
  
  // Minska konfidensen om stora justeringar görs ofta
  if (adjustmentMagnitude > 3) {
    conf.score = Math.max(0, conf.score - 5)
  } else if (adjustmentMagnitude <= 1) {
    conf.score = Math.min(100, conf.score + 2)
  }
}

// Förbättrad beräkning med användarlärning
export function calculateSmartExpiryDate(productName, productInfo = null, purchaseDate = null) {
  try {
    console.log('🧠 Smart AI-beräkning för:', productName)
    
    // Använd inköpsdatum eller dagens datum
    const baseDate = purchaseDate ? new Date(purchaseDate) : new Date()
    const learningData = loadLearningData()
    
    // 1. Kontrollera om vi har specifik lärdata för denna produkt
    const productKey = productName.toLowerCase()
    let baseDays = 0
    let confidence = 50
    
    // Första försök: hitta exakt produktmatch i lärdata
    if (learningData.productAdjustments[productKey]) {
      const avgAdjustment = calculateAverageAdjustment(learningData.productAdjustments[productKey])
      console.log(`🎯 Användardata för "${productName}": ${avgAdjustment} dagar justering`)
    }
    
    // 2. Hitta basdatum från ursprunglig AI
    const name = productName.toLowerCase()
    
    // Exakt produktmatch
    for (const [keyword, days] of Object.entries(PRODUCT_SHELF_LIFE)) {
      if (name.includes(keyword)) {
        baseDays = days
        confidence = 80
        console.log(`✅ Exakt match "${keyword}": ${days} dagar`)
        break
      }
    }
    
    // Om ingen exakt match, använd kategori
    if (baseDays === 0) {
      const category = categorizeProduct(productName, productInfo)
      baseDays = CATEGORY_SHELF_LIFE[category] || 7
      confidence = learningData.confidence[category]?.score || 50
      console.log(`📂 Kategori "${category}": ${baseDays} dagar (konfidenz: ${confidence}%)`)
      
      // Justera med kategorilärning
      const categoryKey = category
      if (learningData.categoryAdjustments[categoryKey]) {
        const avgCategoryAdjustment = calculateAverageAdjustment(learningData.categoryAdjustments[categoryKey])
        baseDays += avgCategoryAdjustment
        console.log(`🔧 Kategorijustering: +${avgCategoryAdjustment} dagar`)
      }
    }
    
    // 3. Tillämpa produktspecifik lärning
    if (learningData.productAdjustments[productKey]) {
      const avgAdjustment = calculateAverageAdjustment(learningData.productAdjustments[productKey])
      baseDays += avgAdjustment
      confidence = Math.min(95, confidence + 20) // Öka konfidenz för lärda produkter
      console.log(`🎓 Tillämpar inlärd justering: +${avgAdjustment} dagar`)
    }
    
    // 4. Säkerhetscheck - hindra absurda datum
    baseDays = Math.max(0, Math.min(baseDays, 1095)) // Max 3 år
    
    // Beräkna slutdatum
    const expiryDate = new Date(baseDate)
    expiryDate.setDate(expiryDate.getDate() + baseDays)
    
    const result = {
      date: expiryDate.toISOString().split('T')[0],
      baseDays,
      confidence,
      method: learningData.productAdjustments[productKey] ? 'Inlärd' : 'AI-uppskattning',
      adjustments: learningData.productAdjustments[productKey]?.length || 0
    }
    
    console.log(`🎯 Smart resultat:`, result)
    return result
    
  } catch (error) {
    console.error('❌ Fel i smart AI-beräkning:', error)
    
    // Emergency fallback
    const emergencyDate = new Date()
    emergencyDate.setDate(emergencyDate.getDate() + 7)
    return {
      date: emergencyDate.toISOString().split('T')[0],
      baseDays: 7,
      confidence: 30,
      method: 'Nödlösning',
      adjustments: 0
    }
  }
}

// Förbättrad produktkategori med konfidensnivå
export function getSmartProductCategory(productName, productInfo = null) {
  const learningData = loadLearningData()
  const category = categorizeProduct(productName, productInfo)
  
  const categoryKey = category.replace(/[🥛🥩🐟🍎🥕🍞🥫🌾❄️🧃🍭🍯🧂]/g, '').trim()
  const confidence = learningData.confidence[categoryKey]?.score || 50
  const adjustments = learningData.confidence[categoryKey]?.adjustments || 0
  
  return {
    category,
    confidence,
    adjustments,
    reliable: confidence > 70
  }
}

// Hämta statistik för debugging
export function getAIStatistics() {
  const learningData = loadLearningData()
  
  return {
    totalAdjustments: learningData.userPatterns.length,
    learnedProducts: Object.keys(learningData.productAdjustments).length,
    learnedCategories: Object.keys(learningData.categoryAdjustments).length,
    averageConfidence: Object.values(learningData.confidence).reduce((acc, conf) => acc + conf.score, 0) / Math.max(1, Object.values(learningData.confidence).length),
    mostAdjustedCategory: Object.entries(learningData.categoryAdjustments).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'Ingen',
    recentPatterns: learningData.userPatterns.slice(-5)
  }
}

// Rensa gammal lärdata
export function cleanupLearningData() {
  const learningData = loadLearningData()
  const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000)
  
  // Ta bort gamla mönster
  learningData.userPatterns = learningData.userPatterns.filter(p => p.timestamp > threeMonthsAgo)
  
  // Rensa gamla produktjusteringar
  Object.keys(learningData.productAdjustments).forEach(product => {
    learningData.productAdjustments[product] = learningData.productAdjustments[product]
      .filter(adj => new Date(adj.date).getTime() > threeMonthsAgo)
    
    if (learningData.productAdjustments[product].length === 0) {
      delete learningData.productAdjustments[product]
    }
  })
  
  // Rensa gamla kategorijusteringar
  Object.keys(learningData.categoryAdjustments).forEach(category => {
    learningData.categoryAdjustments[category] = learningData.categoryAdjustments[category]
      .filter(adj => new Date(adj.date).getTime() > threeMonthsAgo)
    
    if (learningData.categoryAdjustments[category].length === 0) {
      delete learningData.categoryAdjustments[category]
    }
  })
  
  saveLearningData(learningData)
  console.log('🧹 AI-lärdata rensad från gamla poster')
}

// Exportera hjälpfunktioner
export function resetAILearning() {
  localStorage.removeItem(LEARNING_KEY)
  console.log('🔄 AI-lärning återställd')
}

export function exportLearningData() {
  const data = loadLearningData()
  return JSON.stringify(data, null, 2)
}

export function importLearningData(jsonData) {
  try {
    const data = JSON.parse(jsonData)
    saveLearningData(data)
    console.log('📥 AI-lärdata importerad')
    return true
  } catch (error) {
    console.error('❌ Fel vid import av lärdata:', error)
    return false
  }
}