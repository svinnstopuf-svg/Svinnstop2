// Open Food Facts API för att hämta produktinformation
const OPENFOODFACTS_API = 'https://world.openfoodfacts.org/api/v0/product'

// Funktion för att hämta produktinformation baserat på streckkod
export async function getProductInfo(barcode) {
  try {
    console.log(`Hämtar produktinfo för streckkod: ${barcode}`)
    
    const response = await fetch(`${OPENFOODFACTS_API}/${barcode}.json`)
    
    if (!response.ok) {
      throw new Error(`API fel: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === 0) {
      // Produkt hittades inte
      return null
    }
    
    const product = data.product
    
    // Extrahera relevant information
    const productInfo = {
      name: getProductName(product),
      brand: product.brands || '',
      category: getProductCategory(product),
      quantity: getProductQuantity(product),
      unit: getProductUnit(product),
      barcode: barcode,
      image: product.image_url || null,
      // Lägg till nutritionsfakta om tillgänglig
      nutrition: {
        energy: product.nutriments?.['energy-kcal_100g'] || null,
        fat: product.nutriments?.fat_100g || null,
        carbs: product.nutriments?.carbohydrates_100g || null,
        protein: product.nutriments?.proteins_100g || null
      }
    }
    
    console.log('Produktinfo hämtad:', productInfo)
    return productInfo
    
  } catch (error) {
    console.error('Fel vid hämtning av produktinfo:', error)
    return null
  }
}

// Hjälpfunktioner för att extrahera produktinformation
function getProductName(product) {
  // Prioritera svenska namn, sedan engelska, sedan annat
  return product.product_name_sv || 
         product.product_name_en || 
         product.product_name || 
         product.generic_name_sv ||
         product.generic_name_en ||
         product.generic_name ||
         'Okänd produkt'
}

function getProductCategory(product) {
  // Försök att få svenska kategori först
  const categories = product.categories_tags || []
  const swedishCategory = categories.find(cat => cat.includes(':sv:'))
  
  if (swedishCategory) {
    return swedishCategory.replace('sv:', '').replace(/^[^:]*:/, '')
  }
  
  return product.categories || ''
}

function getProductQuantity(product) {
  // Extrahera kvantitet från quantity-fältet
  const quantity = product.quantity
  if (!quantity) return 1
  
  // Parse nummer från strängar som "500g", "1.5L", etc.
  const match = quantity.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 1
}

function getProductUnit(product) {
  const quantity = product.quantity || ''
  
  // Vanliga svenska enheter
  if (quantity.toLowerCase().includes('ml')) return 'ml'
  if (quantity.toLowerCase().includes('cl')) return 'cl' 
  if (quantity.toLowerCase().includes('dl')) return 'dl'
  if (quantity.toLowerCase().includes('l')) return 'L'
  if (quantity.toLowerCase().includes('kg')) return 'kg'
  if (quantity.toLowerCase().includes('g')) return 'g'
  if (quantity.toLowerCase().includes('st')) return 'st'
  
  // Försök att gissa baserat på kategori
  const categories = (product.categories || '').toLowerCase()
  
  // Vätskor
  if (categories.includes('dryck') || categories.includes('juice') || 
      categories.includes('mjölk') || categories.includes('beverages')) {
    return 'L'
  }
  
  // Mat som säljs per vikt
  if (categories.includes('kött') || categories.includes('ost') || 
      categories.includes('meat') || categories.includes('cheese')) {
    return 'g'
  }
  
  // Standard fallback
  return 'st'
}

// Fallback produktdatabas för vanliga svenska produkter
const SWEDISH_PRODUCTS = {
  // ICA basics
  '7310040098480': { name: 'ICA Basic Mjölk 1.5%', unit: 'L' },
  '7310040093100': { name: 'ICA Basic Ägg 12-pack', unit: 'st' },
  '7310040071100': { name: 'ICA Basic Bröd', unit: 'st' },
  
  // Arla
  '7310865018632': { name: 'Arla Mjölk 1.5%', unit: 'L' },
  '7310865003210': { name: 'Arla Smör', unit: 'g' },
  
  // Fazer
  '6411401000119': { name: 'Fazer Chokladkaka', unit: 'g' },
  
  // Lägg till fler efter behov...
}

// Fallback-funktion om Open Food Facts inte har produkten
export function getSwedishFallbackProduct(barcode) {
  const product = SWEDISH_PRODUCTS[barcode]
  
  if (product) {
    return {
      name: product.name,
      brand: '',
      category: '',
      quantity: 1,
      unit: product.unit,
      barcode: barcode,
      image: null,
      nutrition: {}
    }
  }
  
  return null
}

// Huvudfunktion som försöker både API och fallback
export async function lookupProduct(barcode) {
  // Först: försök Open Food Facts API
  let productInfo = await getProductInfo(barcode)
  
  // Om inte hittat: försök svensk fallback-databas
  if (!productInfo) {
    productInfo = getSwedishFallbackProduct(barcode)
  }
  
  // Om fortfarande inte hittat: skapa basic produkt
  if (!productInfo) {
    productInfo = {
      name: `Produkt ${barcode.slice(-6)}`, // Använd sista 6 siffrorna
      brand: '',
      category: '',
      quantity: 1,
      unit: 'st',
      barcode: barcode,
      image: null,
      nutrition: {}
    }
  }
  
  return productInfo
}