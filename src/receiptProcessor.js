import { createWorker } from 'tesseract.js'

// Kvitto-processor som använder OCR för att läsa produkter från kvitton
export class ReceiptProcessor {
  constructor() {
    this.worker = null
  }

  async initialize() {
    if (this.worker) return

    console.log('🤖 Initierar OCR-worker...')
    this.worker = await createWorker()
    await this.worker.loadLanguage('swe+eng') // Svenska och engelska
    await this.worker.initialize('swe+eng')
    
    // Optimera för kvitton
    await this.worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-€kr% ',
      tessedit_pageseg_mode: 6 // Uniform block of text
    })
    
    console.log('✅ OCR-worker redo')
  }

  async processReceipt(imageElement) {
    try {
      await this.initialize()
      
      console.log('📸 Läser kvittobild...')
      const { data: { text } } = await this.worker.recognize(imageElement)
      
      console.log('📝 OCR-text:', text)
      
      // Extrahera produkter från texten
      const products = this.parseReceiptText(text)
      
      console.log('📦 Extraherade produkter:', products)
      return products
      
    } catch (error) {
      console.error('❌ OCR-fel:', error)
      throw error
    }
  }

  parseReceiptText(text) {
    const products = []
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    console.log('📄 Analyserar rader:', lines)
    
    // Svenska butiksmönster
    const productPatterns = [
      // ICA-format: "PRODUKT NAMN    12.50"
      /^(.+?)\s+(\d+[.,]\d{2})\s*kr?\s*$/i,
      // Coop-format: "Produkt namn 2st    25.00"
      /^(.+?)\s+\d*st\s+(\d+[.,]\d{2})\s*kr?\s*$/i,
      // Generisk: "Text med pris    X.XX"
      /^(.+?)\s+(\d+[.,]\d{2})\s*$/,
    ]
    
    // Ord/fraser att ignorera (inte produkter)
    const ignorePatterns = [
      /^(summa|total|moms|vat|kvitto|receipt|datum|date|tid|time|kort|card|kontant|cash|återbäring|change)$/i,
      /^(tack|thank|hejdå|goodbye|välkommen|welcome)$/i,
      /^(ica|coop|willys|hemköp|citygross)$/i,
      /^\d+[.,]\d{2}\s*kr?\s*$/, // Bara pris utan produktnamn
      /^[*\-=]+$/, // Bara symboler
      /^\d{4}-\d{2}-\d{2}/, // Datum
      /^\d{2}:\d{2}/ // Tid
    ]
    
    for (let line of lines) {
      // Hoppa över tom rad eller ignorerade mönster
      if (ignorePatterns.some(pattern => pattern.test(line))) {
        continue
      }
      
      // Testa produktmönster
      for (let pattern of productPatterns) {
        const match = line.match(pattern)
        if (match) {
          let productName = match[1].trim()
          const price = parseFloat(match[2].replace(',', '.'))
          
          // Rensa produktnamnet
          productName = this.cleanProductName(productName)
          
          // Validera att det ser ut som ett produktnamn
          if (this.isValidProductName(productName) && price > 0 && price < 1000) {
            products.push({
              name: productName,
              price: price,
              quantity: this.extractQuantity(match[1]) || 1,
              unit: this.guessUnit(productName)
            })
            break // Sluta testa mönster för denna rad
          }
        }
      }
    }
    
    return products
  }

  cleanProductName(name) {
    // Ta bort vanliga kvitto-prefix/suffix
    return name
      .replace(/^\d+\s*x?\s*/i, '') // Ta bort "2x" eller "3 st" i början
      .replace(/\s*\d+\s*st\s*$/i, '') // Ta bort "2 st" i slutet
      .replace(/\s*\d+[.,]\d{2}\s*kr?\s*$/i, '') // Ta bort pris i slutet
      .replace(/[*]+/g, '') // Ta bort stjärnor
      .replace(/\s+/g, ' ') // Normalisera mellanslag
      .trim()
  }

  extractQuantity(text) {
    // Extrahera kvantitet från text som "2x Mjölk" eller "Äpplen 1kg"
    const qtyMatch = text.match(/(\d+)\s*x\s*/i) || text.match(/(\d+)\s*st/i)
    return qtyMatch ? parseInt(qtyMatch[1]) : null
  }

  guessUnit(productName) {
    const name = productName.toLowerCase()
    
    // Vätskor
    if (name.includes('mjölk') || name.includes('juice') || name.includes('läsk') || 
        name.includes('öl') || name.includes('vin') || name.includes('vatten')) {
      return 'L'
    }
    
    // Kött/ost (vikt)
    if (name.includes('kött') || name.includes('ost') || name.includes('skinka') || 
        name.includes('korv') || name.includes('fisk')) {
      return 'g'
    }
    
    // Frukt/grönsaker (ofta vikt)
    if (name.includes('tomat') || name.includes('potatis') || name.includes('äpple') || 
        name.includes('banan') || name.includes('gurka')) {
      return 'g'
    }
    
    // Standard
    return 'st'
  }

  isValidProductName(name) {
    // Kolla att det verkar vara ett riktigt produktnamn
    return name.length > 2 && 
           name.length < 50 && 
           /[a-zA-ZåäöÅÄÖ]/.test(name) && // Innehåller bokstäver
           !/^\d+[.,]\d{2}$/.test(name) // Är inte bara ett pris
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      console.log('🧹 OCR-worker stängd')
    }
  }
}

// Singleton instance
let receiptProcessor = null

export async function processReceiptImage(imageElement) {
  if (!receiptProcessor) {
    receiptProcessor = new ReceiptProcessor()
  }
  
  return await receiptProcessor.processReceipt(imageElement)
}

export async function cleanupReceiptProcessor() {
  if (receiptProcessor) {
    await receiptProcessor.cleanup()
    receiptProcessor = null
  }
}