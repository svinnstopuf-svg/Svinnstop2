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
          const originalText = match[1].trim()
          const price = parseFloat(match[2].replace(',', '.'))
          
          // Extrahera kvantitet FÖRE rensning
          const quantity = this.extractQuantity(originalText)
          const unit = this.extractUnit(originalText)
          
          // Rensa produktnamnet från kvantiteter och priser
          const productName = this.cleanProductName(originalText)
          
          // Validera att det är ett giltigt produktnamn och en matvara
          if (this.isValidProductName(productName) && 
              this.isFoodProduct(productName) && 
              price > 0 && price < 1000) {
            products.push({
              name: productName,
              price: price,
              quantity: quantity || 1,
              unit: unit || this.guessUnit(productName)
            })
            break // Sluta testa mönster för denna rad
          }
        }
      }
    }
    
    return products
  }

  cleanProductName(name) {
    // Ta bort vanliga kvitto-prefix/suffix och kvantiteter
    return name
      .replace(/^\d+\s*x?\s*/i, '') // Ta bort "2x" eller "3 st" i början
      .replace(/\s*\d+\s*st\s*$/i, '') // Ta bort "2 st" i slutet  
      .replace(/\s*\d+\s*kg\s*$/i, '') // Ta bort "1 kg" i slutet
      .replace(/\s*\d+[.,]\d+\s*kg\s*$/i, '') // Ta bort "1,5 kg" i slutet
      .replace(/\s*\d+\s*g\s*$/i, '') // Ta bort "500 g" i slutet
      .replace(/\s*\d+\s*L\s*$/i, '') // Ta bort "1 L" i slutet
      .replace(/\s*\d+[.,]\d+\s*L\s*$/i, '') // Ta bort "1,5 L" i slutet
      .replace(/\s*\d+\s*cl\s*$/i, '') // Ta bort "33 cl" i slutet
      .replace(/\s*\d+\s*ml\s*$/i, '') // Ta bort "250 ml" i slutet
      .replace(/\s*\d+[.,]\d{2}\s*kr?\s*$/i, '') // Ta bort pris i slutet
      .replace(/\s*\*\s*\d+[.,]\d{2}\s*$/i, '') // Ta bort "* 19,90" format
      .replace(/[*]+/g, '') // Ta bort stjärnor
      .replace(/\s+/g, ' ') // Normalisera mellanslag
      .trim()
      .toLowerCase() // Normalisera till gemener
      .replace(/^(\w)/, (match) => match.toUpperCase()) // Stor bokstav först
  }

  extractQuantity(text) {
    // Extrahera kvantitet från olika kvittoformat
    const patterns = [
      // "2x Mjölk" eller "3 x Äpplen"
      /(\d+)\s*x\s*/i,
      // "Gurka 2st" eller "2 st Tomat"
      /(?:^|\s)(\d+)\s*st(?:\s|$)/i,
      // "Potatis 1kg" eller "1,5 kg Fisk"
      /(\d+(?:[.,]\d+)?)\s*kg/i,
      // "Mjölk 1L" eller "0,5 L Grädde"
      /(\d+(?:[.,]\d+)?)\s*L/i,
      // "Juice 33cl" eller "250 ml Grädde"
      /(\d+)\s*(?:cl|ml)/i,
      // "500g Kött" 
      /(\d+)\s*g/i,
      // Fallback: nummer i början som "3 Bananer"
      /^(\d+)\s+[a-zåäö]/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'))
        console.log(`🔢 Extraherad kvantitet: ${value} från "${text}"`)
        return value
      }
    }
    
    return null
  }
  
  extractUnit(text) {
    // Extrahera enhet från kvittotexten
    const unitPatterns = [
      { pattern: /\d+(?:[.,]\d+)?\s*(kg)/i, unit: 'kg' },
      { pattern: /\d+(?:[.,]\d+)?\s*(g)(?:\s|$)/i, unit: 'g' },
      { pattern: /\d+(?:[.,]\d+)?\s*(L)/i, unit: 'L' },
      { pattern: /\d+\s*(cl)/i, unit: 'cl' },
      { pattern: /\d+\s*(ml)/i, unit: 'ml' },
      { pattern: /\d+\s*(st)(?:\s|$)/i, unit: 'st' },
      { pattern: /\d+\s*x\s*/i, unit: 'st' } // "2x" betyder styck
    ]
    
    for (const { pattern, unit } of unitPatterns) {
      if (pattern.test(text)) {
        console.log(`📎 Extraherad enhet: ${unit} från "${text}"`)
        return unit
      }
    }
    
    return null
  }

  guessUnit(productName) {
    const name = productName.toLowerCase()
    
    // Vätskor - ofta i liter eller cl
    if (name.includes('mjölk') || name.includes('juice') || name.includes('läsk') || 
        name.includes('öl') || name.includes('vin') || name.includes('vatten') ||
        name.includes('grädde') || name.includes('filmjölk')) {
      return 'L'
    }
    
    // Kött/fisk/ost - oftast i gram/kg
    if (name.includes('kött') || name.includes('ost') || name.includes('skinka') || 
        name.includes('korv') || name.includes('fisk') || name.includes('kyckling') ||
        name.includes('nöt') || name.includes('fläsk') || name.includes('bacon') ||
        name.includes('lax') || name.includes('torsk')) {
      return 'kg'
    }
    
    // Lösviktsvaror - frukt/grönsaker
    if (name.includes('tomat') || name.includes('potatis') || name.includes('äpple') || 
        name.includes('banan') || name.includes('gurka') || name.includes('morot') ||
        name.includes('lök') || name.includes('paprika') || name.includes('avokado') ||
        name.includes('citron') || name.includes('apelsin')) {
      return 'kg'
    }
    
    // Bröd och bakvaror - oftast per styck
    if (name.includes('bröd') || name.includes('kaka') || name.includes('bulle') ||
        name.includes('muffin') || name.includes('tårta')) {
      return 'st'
    }
    
    // Konserver och förpackningar
    if (name.includes('burk') || name.includes('konserv') || name.includes('förpackning')) {
      return 'st'
    }
    
    // Standard fallback
    return 'st'
  }

  isValidProductName(name) {
    // Kolla att det verkar vara ett riktigt produktnamn
    return name.length > 2 && 
           name.length < 50 && 
           /[a-zA-ZåäöÅÄÖ]/.test(name) && // Innehåller bokstäver
           !/^\d+[.,]\d{2}$/.test(name) // Är inte bara ett pris
  }

  isFoodProduct(name) {
    const lowerName = name.toLowerCase()
    
    // Definitivt INTE matvaror (filtreras bort)
    const nonFoodItems = [
      // Hushållsartiklar
      'plastpåse', 'plastbärare', 'kasse', 'påse', 'papperspåse',
      'papperskasse', 'tygkasse', 'bärare', 'handla',
      
      // Hygienartiklar  
      'tandkräm', 'tandborste', 'schampo', 'balsam', 'duschgel', 
      'tvål', 'deodorant', 'parfym', 'rakgel', 'rakning',
      'damhygien', 'blöjor', 'barnblöjor', 'servetter', 'papper',
      
      // Kemikalier och städ
      'diskmedel', 'tvättmedel', 'sköljmedel', 'blekmedel',
      'städ', 'rengöring', 'spray', 'kemikalie',
      
      // Övrigt
      'tidning', 'magasin', 'cigaretter', 'tobak', 'alkohol',
      'batterier', 'glödlampa', 'lampa', 'el-artikel',
      'leksak', 'present', 'blommor', 'växt'
    ]
    
    // Kolla om produkten innehåller något icke-matvaru ord
    if (nonFoodItems.some(item => lowerName.includes(item))) {
      console.log(`🚫 Filtrerar bort icke-matvara: ${name}`)
      return false
    }
    
    // Matvarukategorier (positivlista)
    const foodCategories = [
      // Grönsaker & frukt
      'tomat', 'gurka', 'morot', 'lök', 'potatis', 'sallad', 'paprika',
      'äpple', 'banan', 'apelsin', 'citron', 'vindruv', 'kiwi', 'mango',
      'avokado', 'broccoli', 'blomkål', 'zucchini', 'aubergine',
      
      // Kött & fisk
      'kött', 'kyckling', 'nöt', 'fläsk', 'korv', 'skinka', 'bacon',
      'fisk', 'lax', 'torsk', 'räka', 'musslor', 'tonfisk',
      
      // Mejeri
      'mjölk', 'grädde', 'filmjölk', 'yoghurt', 'kvarg', 'ost',
      'smör', 'margarin', 'crème fraiche', 'keso',
      
      // Spannmål & bröd
      'bröd', 'pasta', 'ris', 'bulgur', 'quinoa', 'havregryn', 
      'müsli', 'flingor', 'flour', 'mjöl',
      
      // Konserver & torrvaror
      'konserv', 'burk', 'krossad', 'passata', 'ärtor', 'bönor',
      'linser', 'nötter', 'mandel', 'cashew', 'valnöt',
      
      // Drycker
      'juice', 'läsk', 'vatten', 'te', 'kaffe', 'choklad',
      
      // Kryddor & tillagning
      'krydda', 'salt', 'peppar', 'vitlök', 'persilja', 'basilika',
      'oregano', 'curry', 'paprikapulver', 'kanel', 'vanilj',
      'olja', 'oliv', 'vinäger', 'honung', 'sirap', 'socker',
      
      // Godis & bakning
      'godis', 'choklad', 'kaka', 'bakelse', 'tårta', 'muffins',
      'kex', 'chips', 'popcorn', 'nötter'
    ]
    
    // Om namnet innehåller något matvaru-ord, acceptera det
    const isFoodByCategory = foodCategories.some(food => lowerName.includes(food))
    
    // Acceptera även produkter som har typiska mat-ord i sig
    const foodIndicators = [
      /eko\s/i,     // Ekologisk
      /krav/i,      // KRAV-märkt 
      /färsk/i,     // Färsk
      /fryst/i,     // Fryst
      /konserv/i,   // Konserverad
      /torkad/i,    // Torkad
      /rå[a-z]/i,   // Råvara
      /naturell/i   // Naturell
    ]
    
    const hasConfidenceIndicators = foodIndicators.some(pattern => pattern.test(lowerName))
    
    // Slutlig bedömning
    const isFood = isFoodByCategory || hasConfidenceIndicators
    
    if (!isFood) {
      console.log(`❓ Osäker på om '${name}' är matvara - filtrerar bort för säkerhets skull`)
    } else {
      console.log(`✅ Identifierad matvara: ${name}`)
    }
    
    return isFood
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