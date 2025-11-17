// Smart måttkonvertering för inköpslistor
// Konverterar automatiskt mellan g, hg, kg för bättre användarupplevelse

// Definiera enhetshierarkier
const WEIGHT_UNITS = {
  'g': { base: 'g', multiplier: 1, next: 'hg', step: 100 },
  'hg': { base: 'g', multiplier: 100, next: 'kg', step: 10, prev: 'g' },
  'kg': { base: 'g', multiplier: 1000, prev: 'hg', step: 1 }
}

const VOLUME_UNITS = {
  'ml': { base: 'ml', multiplier: 1, next: 'cl', step: 10 },
  'cl': { base: 'ml', multiplier: 10, next: 'dl', step: 10, prev: 'ml' },
  'dl': { base: 'ml', multiplier: 100, next: 'L', step: 10, prev: 'cl' },
  'L': { base: 'ml', multiplier: 1000, prev: 'dl', step: 1 }
}

// Få smart stegstorlek baserat på aktuell kvantitet och enhet
export function getSmartStep(quantity, unit) {
  const unitLower = unit.toLowerCase()
  
  // För 'stycken' eller 'st', använd alltid steg 1
  if (unitLower === 'stycken' || unitLower === 'st' || unitLower === 'styck') {
    return 1
  }
  
  // För viktenheter
  if (WEIGHT_UNITS[unitLower]) {
    const unitInfo = WEIGHT_UNITS[unitLower]
    return unitInfo.step
  }
  
  // För volymenheter
  if (VOLUME_UNITS[unitLower]) {
    const unitInfo = VOLUME_UNITS[unitLower]
    return unitInfo.step
  }
  
  // Default: 0.5 för andra enheter
  return 0.5
}

// Konvertera automatiskt till bättre enhet när värdet blir för stort eller litet
export function smartConvertUnit(quantity, unit) {
  const unitLower = unit.toLowerCase()
  
  // För viktenheter
  if (WEIGHT_UNITS[unitLower]) {
    const unitInfo = WEIGHT_UNITS[unitLower]
    const baseValue = quantity * unitInfo.multiplier
    
    // Uppåtkonvertering (t.ex. 1000g -> 1kg)
    if (unitInfo.next) {
      const nextUnit = WEIGHT_UNITS[unitInfo.next]
      const threshold = nextUnit.multiplier
      
      if (baseValue >= threshold) {
        return {
          quantity: baseValue / nextUnit.multiplier,
          unit: unitInfo.next
        }
      }
    }
    
    // Nedåtkonvertering (t.ex. 0.5hg -> 50g)
    if (unitInfo.prev && quantity < 1) {
      const prevUnit = WEIGHT_UNITS[unitInfo.prev]
      return {
        quantity: baseValue / prevUnit.multiplier,
        unit: unitInfo.prev
      }
    }
  }
  
  // För volymenheter
  if (VOLUME_UNITS[unitLower]) {
    const unitInfo = VOLUME_UNITS[unitLower]
    const baseValue = quantity * unitInfo.multiplier
    
    // Uppåtkonvertering (t.ex. 100cl -> 1L)
    if (unitInfo.next) {
      const nextUnit = VOLUME_UNITS[unitInfo.next]
      const threshold = nextUnit.multiplier
      
      if (baseValue >= threshold) {
        return {
          quantity: baseValue / nextUnit.multiplier,
          unit: unitInfo.next
        }
      }
    }
    
    // Nedåtkonvertering (t.ex. 0.5dl -> 50ml)
    if (unitInfo.prev && quantity < 1) {
      const prevUnit = VOLUME_UNITS[unitInfo.prev]
      return {
        quantity: baseValue / prevUnit.multiplier,
        unit: unitInfo.prev
      }
    }
  }
  
  // Ingen konvertering behövs
  return { quantity, unit }
}

// Förbättrad funktion för att öka kvantitet
export function increaseQuantity(quantity, unit) {
  const step = getSmartStep(quantity, unit)
  const newQuantity = Number(quantity) + step
  
  // Kör smart konvertering om möjligt
  return smartConvertUnit(newQuantity, unit)
}

// Förbättrad funktion för att minska kvantitet
export function decreaseQuantity(quantity, unit) {
  const step = getSmartStep(quantity, unit)
  const unitLower = unit.toLowerCase()
  
  // Minimivärde baserat på enhet
  let minValue = step
  if (unitLower === 'stycken' || unitLower === 'st' || unitLower === 'styck') {
    minValue = 1
  }
  
  const newQuantity = Math.max(minValue, Number(quantity) - step)
  
  // Kör smart konvertering om möjligt
  return smartConvertUnit(newQuantity, unit)
}

// Konvertera en vara till lämpligare enhet vid skapande
export function suggestBestUnit(itemName, quantity = 1) {
  const nameLower = itemName.toLowerCase()
  
  // För potatis och andra rotfrukter - använd kg om mängden är stor
  if (nameLower.includes('potatis') || nameLower.includes('morot') || 
      nameLower.includes('palsternacka') || nameLower.includes('rotfrukt')) {
    if (quantity >= 500) {
      return smartConvertUnit(quantity, 'g')
    }
    return { quantity: 1, unit: 'kg' }
  }
  
  // För kött och fisk - använd kg för stora mängder
  if (nameLower.includes('kött') || nameLower.includes('fläsk') || 
      nameLower.includes('kyckling') || nameLower.includes('fisk') ||
      nameLower.includes('lax') || nameLower.includes('torsk')) {
    if (quantity >= 1000) {
      return smartConvertUnit(quantity, 'g')
    }
    return { quantity: 1, unit: 'kg' }
  }
  
  // För ost och andra mejeriprodukter - använd hg för medelmängder
  if (nameLower.includes('ost') && quantity >= 100 && quantity < 1000) {
    return smartConvertUnit(quantity, 'g')
  }
  
  // Default - behåll som är
  return { quantity, unit: 'st' }
}

export const unitConverter = {
  getSmartStep,
  smartConvertUnit,
  increaseQuantity,
  decreaseQuantity,
  suggestBestUnit
}
