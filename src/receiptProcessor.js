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
    const allLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    console.log('📄 Alla rader:', allLines)
    
    // Hitta produktsektionen mellan referensnummer och total
    const lines = this.extractProductSection(allLines)
    
    console.log('🎯 Produktsektion extraherad:', lines)
    
    // Läs av ALLT i produktsektionen och låt AI avgöra vad som är matvaror
    for (let line of lines) {
      console.log(`🔍 Analyserar rad: "${line}"`)
      
      // Försök extrahera produktinformation från denna rad
      const extractedProduct = this.extractProductFromLine(line)
      
      if (extractedProduct) {
        console.log(`✅ Hittad potentiell produkt:`, extractedProduct)
        
        // Använd AI för att avgöra om detta är en matvara
        if (this.isLikelyFoodProduct(extractedProduct.name)) {
          products.push(extractedProduct)
          console.log(`🍎 Lägger till matvara: ${extractedProduct.name}`)
        } else {
          console.log(`🚫 Filtrerar bort icke-matvara: ${extractedProduct.name}`)
        }
      }
    }
    
    return products
  }

  extractProductSection(lines) {
    // Hitta start och slutmarkering för produktsektionen
    let startIndex = -1
    let endIndex = lines.length
    
    // Leta efter referensnummer eller liknande startmarkering
    const startPatterns = [
      /^Ref[\s.]*\d+/i,           // "Ref. 40392" eller "Ref 40392"
      /^\d{5,}/,                 // Långt nummer som referens  
      /^Artikel/i,               // "Artikel" rubrik
      /^Vara/i,                  // "Vara" rubrik
      /^Produkt/i                // "Produkt" rubrik
    ]
    
    // Leta efter slutmarkering
    const endPatterns = [
      /^(Summa|Total|Sum)/i,     // "Summa", "Total", "Sum"
      /^(Att\s+betala)/i,        // "Att betala"
      /^(Moms|VAT)/i,            // Momssektion
      /^(Kort|Kontant|Card)/i,   // Betalningssektion
      /^\s*[-=]+\s*$/            // Linje med bara streck
    ]
    
    // Hitta startindex
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Kolla startmönster
      if (startPatterns.some(pattern => pattern.test(line))) {
        startIndex = i + 1 // Börja EFTER startmarkeringen
        console.log(`🚦 Produktsektion startar vid rad ${i + 1}: "${line}"`)
        break
      }
    }
    
    // Om ingen explicit start hittas, börja från början
    if (startIndex === -1) {
      startIndex = 0
      console.log('🔍 Ingen startmarkering hittad - scannar från början')
    }
    
    // Hitta slutindex
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      
      // Kolla slutmönster
      if (endPatterns.some(pattern => pattern.test(line))) {
        endIndex = i
        console.log(`🚩 Produktsektion slutar vid rad ${i + 1}: "${line}"`)
        break
      }
    }
    
    // Extrahera produktsektionen
    const productLines = lines.slice(startIndex, endIndex)
    console.log(`📋 Extraherar rader ${startIndex + 1}-${endIndex} (${productLines.length} rader)`)
    
    return productLines
  }

  // Generös extraktion av produkter från kvittorader  
  extractProductFromLine(line) {
    // Hoppa över uppenbart icke-produktrader
    const obviousIgnore = [
      /^\s*$/,                           // Tom rad
      /^[*\-=_]{3,}$/,                   // Bara symboler
      /^\d{2}:\d{2}/,                    // Tid
      /^\d{4}-\d{2}-\d{2}/,              // Datum YYYY-MM-DD
      /^\d{2}[.\/\-]\d{2}[.\/\-]/,       // Datum DD.MM eller MM/DD
      /^(summa|total|sum|moms|vat|kort|kontant|swish|cash)$/i, // Kvitto-termer
      /^\d+[.,]\d{2}\s*kr?\s*$/,         // Bara pris
      /^(ref[\s.]*\d+|trans[\s.]*\d+)$/i // Referensnummer
    ]
    
    if (obviousIgnore.some(pattern => pattern.test(line))) {
      return null
    }
    
    // Generösa mönster för att hitta produkter med priser
    const productPatterns = [
      // Standard: "Produktnamn    12.50" eller "Produktnamn 12.50"
      /^(.+?)\s+(\d+[.,]\d{1,2})\s*kr?\s*$/i,
      
      // Med kvantitet: "Produktnamn 2st    25.00"
      /^(.+?)\s+\d+\s*(?:st|kg|g|L|cl|ml)\s+(\d+[.,]\d{1,2})\s*kr?\s*$/i,
      
      // Med multiplikation: "Produktnamn 2 x 12.50"
      /^(.+?)\s+\d+\s*x\s*(\d+[.,]\d{1,2})\s*kr?\s*$/i,
      
      // Pris först: "12.50 Produktnamn"
      /^(\d+[.,]\d{1,2})\s*kr?\s+(.+)$/i,
      
      // Endast produktnamn (inget pris) - för rader som kanske är uppdelade
      /^([a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\s\d]{2,40})$/
    ]
    
    for (let pattern of productPatterns) {
      const match = line.match(pattern)
      if (match) {
        let productName, price
        
        if (pattern.source.includes('^(\\d+')) {
          // Pris först format
          price = parseFloat(match[1].replace(',', '.'))
          productName = match[2].trim()
        } else if (match[2] && /\d/.test(match[2])) {
          // Standard format med pris som match[2]
          productName = match[1].trim()
          price = parseFloat(match[2].replace(',', '.'))
        } else {
          // Endast produktnamn
          productName = match[1].trim()
          price = 0 // Okänt pris
        }
        
        // Validera pris
        if (price > 0 && (price < 0.1 || price > 1000)) {
          continue // Orealistiskt pris
        }
        
        // Extrahera kvantitet innan rensning
        const originalText = match[0]
        const quantity = this.extractQuantity(originalText)
        const unit = this.extractUnit(originalText)
        
        // Rensa produktnamnet
        const cleanedName = this.cleanProductName(productName)
        
        if (this.isValidProductName(cleanedName)) {
          return {
            name: cleanedName,
            price: price,
            quantity: quantity || 1,
            unit: unit || this.guessUnit(cleanedName)
          }
        }
      }
    }
    
    return null
  }

  // AI-baserad intelligent matvarubedömning
  isLikelyFoodProduct(productName) {
    if (!productName || productName.length < 2) return false
    
    const name = productName.toLowerCase().trim()
    
    // Definitivt INTE matvaror (hög precision)
    const definitelyNotFood = [
      'påse', 'plastpåse', 'kasse', 'bärare', 'papperspåse',
      'diskmedel', 'tvättmedel', 'städ', 'rengöring', 'kemikalie',
      'tandkräm', 'tandborste', 'schampo', 'tvål', 'deodorant',
      'batterier', 'glödlampa', 'tidning', 'magasin', 'present',
      'blommor', 'växt', 'leksak', 'cigaretter', 'tobak'
    ]
    
    if (definitelyNotFood.some(item => name.includes(item))) {
      return false
    }
    
    // Matvaruindikatorer (bred lista)
    const foodIndicators = [
      // Frukt & grönt
      'äpple', 'päron', 'banan', 'apelsin', 'citron', 'lime', 'kiwi', 'mango', 'ananas',
      'vindruv', 'melon', 'vattenmelon', 'jordgubb', 'hallon', 'blåbär', 'lingon',
      'tomat', 'gurka', 'paprika', 'lök', 'vitlök', 'morot', 'potatis', 'sötpotatis',
      'broccoli', 'blomkål', 'kål', 'sallad', 'spenat', 'ruccola', 'dill', 'persilja',
      'purjolök', 'selleri', 'rädisa', 'rödbetor', 'palsternacka', 'kålrot',
      
      // Kött & chark
      'kött', 'nötkött', 'fläskkött', 'lamm', 'kyckling', 'kalkonfläsk', 'korv',
      'prinskorv', 'falukorv', 'salami', 'skinka', 'bacon', 'köttbullar', 'fläskfilé',
      'nötfärs', 'kyckling', 'kycklingfilé', 'köttfärs',
      
      // Fisk & skaldjur
      'fisk', 'lax', 'torsk', 'sill', 'makrill', 'tonfisk', 'räkor', 'kräftor',
      'musslor', 'hummer', 'krabba', 'abborre', 'gädda',
      
      // Mejeri
      'mjölk', 'grädde', 'filmjölk', 'yoghurt', 'naturell', 'grekisk', 'kvarg',
      'ost', 'cheddar', 'gouda', 'brie', 'herrgård', 'präst', 'västerbotten',
      'smör', 'margarin', 'crème fraiche', 'philadelphia', 'cottage cheese',
      
      // Ägg
      'ägg', 'hönsägg', 'ekologiska ägg',
      
      // Bröd & spannmål
      'bröd', 'skogaholm', 'polarbröd', 'limpa', 'tunnbröd', 'knäckebröd',
      'pasta', 'spagetti', 'makaroner', 'penne', 'fusilli', 'lasagne',
      'ris', 'jasminris', 'basmatiris', 'risotto', 'bulgur', 'quinoa', 'couscous',
      'havregryn', 'müsli', 'flingor', 'cornflakes', 'special k',
      'mjöl', 'vetemjöl', 'graham', 'dinkel',
      
      // Konserver & torrvaror
      'krossad', 'passata', 'tomater', 'bönor', 'kidneybönor', 'vita bönor',
      'linser', 'ärtor', 'kikärtor', 'mais', 'oliver',
      'nötter', 'mandel', 'valnötter', 'cashew', 'pistasch', 'jordnötter',
      'russin', 'dadlar', 'fikon', 'aprikoser',
      
      // Kryddor & såser
      'salt', 'peppar', 'krydda', 'oregano', 'basilika', 'rosmarin', 'timjan',
      'kanel', 'kardemumma', 'ingefära', 'curry', 'paprikapulver', 'chili',
      'ketchup', 'senap', 'majonnäs', 'sojasås', 'tabasco', 'sriracha',
      'olja', 'olivolja', 'rapsolja', 'solrosolja', 'kokosolja',
      'vinäger', 'balsamico', 'äppelcidervinäger',
      
      // Sötsaker & bakning
      'socker', 'florsocker', 'farinsocker', 'honung', 'sirap', 'lönnsirap',
      'vanilj', 'vaniljsocker', 'bakpulver', 'jäst', 'kakao',
      'choklad', 'marabou', 'fazer', 'lindt', 'godis', 'lösgodis',
      'kex', 'digestive', 'maria', 'ballerina', 'göteborgs',
      
      // Drycker
      'juice', 'äppeljuice', 'apelsinjuice', 'tranbärsjuice',
      'läsk', 'coca cola', 'pepsi', 'sprite', 'fanta', 'festis',
      'vatten', 'mineralvatten', 'ramlösa', 'loka', 'evian',
      'kaffe', 'te', 'earl grey', 'grön te', 'rooibos', 'chai',
      'öl', 'folköl', 'lättöl', 'starköl', 'ipa', 'lager',
      'vin', 'rödvin', 'vitt vin', 'rosé', 'champagne', 'prosecco',
      
      // Fryst & kött
      'fryst', 'frozen', 'kött', 'korv', 'pizza', 'pannkakor',
      'glass', 'magnum', 'ben jerry', 'häagen dazs', 'gb',
      
      // Övrigt
      'baby', 'barnmat', 'välling', 'gröt', 'follow', 'semper',
      'glutenfri', 'laktosfri', 'vegansk', 'vegetarisk', 'eko', 'krav'
    ]
    
    // Om namnet innehåller någon matvaruindikator
    if (foodIndicators.some(indicator => name.includes(indicator))) {
      return true
    }
    
    // Heuristik: korta ord som verkar vara matvaror
    if (name.length <= 15) {
      // Vanliga svenska matvaruord-ändelser
      const foodEndings = ['mjölk', 'ost', 'kött', 'fisk', 'bröd', 'juice', 'gryn', 'olja']
      if (foodEndings.some(ending => name.endsWith(ending))) {
        return true
      }
    }
    
    // Standard fallback - om det passerat alla filter och ser ut som ett produktnamn
    // Låt det passera och låt användaren avgöra
    if (name.match(/^[a-zåäö\s]+$/i) && name.length >= 3 && name.length <= 25) {
      console.log(`⚠️ Osäker produkt som får passera: "${productName}"`);
      return true
    }
    
    return false
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
    const lowerText = text.toLowerCase()
    
    // Först kolla explicita enheter i texten
    const unitPatterns = [
      { pattern: /\d+(?:[.,]\d+)?\s*(kg)/i, unit: 'kg' },
      { pattern: /\d+(?:[.,]\d+)?\s*(g)(?:\s|$)/i, unit: 'g' },
      { pattern: /\d+(?:[.,]\d+)?\s*(L)/i, unit: 'L' },
      { pattern: /\d+\s*(cl)/i, unit: 'cl' },
      { pattern: /\d+\s*(ml)/i, unit: 'ml' },
      { pattern: /\d+\s*(st)(?:\s|$)/i, unit: 'st' }
    ]
    
    // Kolla för explicita enheter först
    for (const { pattern, unit } of unitPatterns) {
      if (pattern.test(text)) {
        console.log(`📎 Extraherad explicit enhet: ${unit} från "${text}"`)
        return unit
      }
    }
    
    // Om "2x" format, gissa rätt enhet baserat på produkttyp
    if (/\d+\s*x\s*/i.test(text)) {
      // Vätskor ska vara i liter även om det står "2x Mjölk"
      if (lowerText.includes('mjölk') || lowerText.includes('juice') || 
          lowerText.includes('läsk') || lowerText.includes('vatten') ||
          lowerText.includes('grädde') || lowerText.includes('filmjölk') ||
          lowerText.includes('öl') || lowerText.includes('vin')) {
        console.log(`🥛 Vätska med 'x' format - använder L: "${text}"`)
        return 'L'
      }
      
      // Kött/ost i kg
      if (lowerText.includes('kött') || lowerText.includes('ost') || 
          lowerText.includes('skinka') || lowerText.includes('korv') ||
          lowerText.includes('fisk') || lowerText.includes('kyckling')) {
        console.log(`🥩 Kött/ost med 'x' format - använder kg: "${text}"`)
        return 'kg'
      }
      
      // Annars styck
      console.log(`📎 'x' format - använder st: "${text}"`)
      return 'st'
    }
    
    return null
  }

  guessUnit(productName) {
    const name = productName.toLowerCase()
    
    // Vätskor - ALLTID i liter
    if (name.includes('mjölk') || name.includes('juice') || name.includes('läsk') || 
        name.includes('öl') || name.includes('vin') || name.includes('vatten') ||
        name.includes('grädde') || name.includes('filmjölk') || name.includes('yoghurt') ||
        name.includes('kefir') || name.includes('smoothie')) {
      console.log(`🥛 Gissar enhet L för vätska: ${productName}`)
      return 'L'
    }
    
    // Kött/fisk/ost - i kg (eller g för mindre mängder)
    if (name.includes('kött') || name.includes('ost') || name.includes('skinka') || 
        name.includes('korv') || name.includes('fisk') || name.includes('kyckling') ||
        name.includes('nöt') || name.includes('fläsk') || name.includes('bacon') ||
        name.includes('lax') || name.includes('torsk') || name.includes('räka')) {
      console.log(`🥩 Gissar enhet kg för kött/fisk: ${productName}`)
      return 'kg'
    }
    
    // Lösviktsvaror - frukt/grönsaker i kg
    if (name.includes('tomat') || name.includes('potatis') || name.includes('äpple') || 
        name.includes('banan') || name.includes('gurka') || name.includes('morot') ||
        name.includes('lök') || name.includes('paprika') || name.includes('avokado') ||
        name.includes('citron') || name.includes('apelsin') || name.includes('päron') ||
        name.includes('sallad') || name.includes('broccoli') || name.includes('blomkål')) {
      console.log(`🥦 Gissar enhet kg för frukt/grönsaker: ${productName}`)
      return 'kg'
    }
    
    // Torrvaror som säljs i kg
    if (name.includes('ris') || name.includes('pasta') || name.includes('mjöl') ||
        name.includes('socker') || name.includes('nötter') || name.includes('mandel')) {
      console.log(`🌾 Gissar enhet kg för torrvara: ${productName}`)
      return 'kg'
    }
    
    // Bröd och bakvaror - per styck
    if (name.includes('bröd') || name.includes('kaka') || name.includes('bulle') ||
        name.includes('muffin') || name.includes('tårta') || name.includes('kex')) {
      console.log(`🍞 Gissar enhet st för bakvara: ${productName}`)
      return 'st'
    }
    
    // Konserver och förpackningar - per styck
    if (name.includes('burk') || name.includes('konserv') || name.includes('förpackning') ||
        name.includes('tårta') || name.includes('pizza')) {
      console.log(`🥫 Gissar enhet st för förpackning: ${productName}`)
      return 'st'
    }
    
    // Ägg - per styck eller förpackning
    if (name.includes('ägg')) {
      console.log(`🥚 Gissar enhet st för ägg: ${productName}`)
      return 'st'
    }
    
    // Standard fallback
    console.log(`❓ Okänd produkttyp - använder st som fallback: ${productName}`)
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