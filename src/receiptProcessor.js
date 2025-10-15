import { createWorker } from 'tesseract.js'
import { analyzeAgainstTrainingData, cleanReceiptProductName } from './receiptTrainingData.js'
import { extractProductsFromReceipt, identifyStoreType } from './receiptAnalysisTraining.js'

// Kvitto-processor som använder OCR för att läsa produkter från kvitton
export class ReceiptProcessor {
  constructor() {
    this.worker = null
    this.debugMode = true // Sätt till false för att stänga av debug
  }

  async initialize() {
    if (this.worker) return

    console.log('🤖 Initierar OCR-worker...')
    this.worker = await createWorker()
    await this.worker.loadLanguage('swe+eng') // Svenska och engelska
    await this.worker.initialize('swe+eng')
    
    // Förbättrade OCR-inställningar för svenska kvitton
    await this.worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-€kr%*/() ',
      tessedit_pageseg_mode: 7, // Single text line (bättre för kvitton)
      tessedit_ocr_engine_mode: 1, // Neural net LSTM + Legacy (hybrid för bättre resultat)
      preserve_interword_spaces: 1,
      tessedit_char_blacklist: '|[]{}~`^_=+\\"#@&<>',
      classify_enable_learning: 1,
      classify_enable_adaptive_matcher: 1,
      textord_debug_tabfind: 0,
      textord_tabfind_find_tables: 0,
      load_system_dawg: 0, // Inaktivera systemordbok för bättre precision
      load_freq_dawg: 0, // Inaktivera frekvensordbok
      load_punc_dawg: 1,
      load_number_dawg: 1,
      load_unambig_dawg: 0,
      load_bigram_dawg: 0,
      load_fixed_length_dawgs: 0,
      // Ytterligare inställningar för bättre kvalitet
      tessedit_create_hocr: 0,
      tessedit_create_tsv: 0,
      gapmap_use_ends: 0,
      gapmap_no_isolated_quanta: 1,
      tesseract_minimum_word_size: 2
    })
    
    console.log('✅ OCR-worker redo')
  }

  async processReceipt(imageElement) {
    try {
      await this.initialize()
      
      // Debug: visa att vi startar scanning
      this.showDebugInfo('🔄 MULTI-PASS OCR STARTAR', 'Kör 3 olika OCR-strategier samtidigt')
      
      // Skapa 3 olika förbehandlade versioner av bilden
      const versions = [
        { name: 'Standard', image: this.preprocessImage(imageElement, 'standard') },
        { name: 'Hög kontrast', image: this.preprocessImage(imageElement, 'high_contrast') },
        { name: 'Mjuk', image: this.preprocessImage(imageElement, 'soft') }
      ]
      
      const allResults = []
      
      // Kör OCR på alla versioner
      for (let i = 0; i < versions.length; i++) {
        const version = versions[i]
        console.log(`📸 Kör OCR med ${version.name}-inställningar...`)
        this.showDebugInfo(`📸 OCR ${i+1}/3: ${version.name}`, 'Startar...')
        
        try {
          // Sätt olika OCR-parametrar för varje version
          await this.setOCRParameters(i)
          
          const startTime = Date.now()
          const { data: { text } } = await this.worker.recognize(version.image)
          const endTime = Date.now()
          
          console.log(`OCR ${version.name}:`, text)
          this.showDebugInfo(`📝 ${version.name} (${endTime - startTime}ms)`, 
            `Längd: ${text.length}\n\n${text}`)
          
          // Extrahera produkter
          const products = this.parseReceiptText(text, version.name)
          
          allResults.push({
            version: version.name,
            text: text,
            products: products,
            score: this.scoreResult(text, products)
          })
          
          this.showDebugInfo(`📦 ${version.name} resultat`, 
            `${products.length} produkter, poäng: ${allResults[allResults.length-1].score}`)
          
        } catch (error) {
          console.error(`OCR ${version.name} misslyckades:`, error)
          allResults.push({ version: version.name, products: [], score: 0 })
        }
      }
      
      // Välj bästa resultatet baserat på poäng
      allResults.sort((a, b) => b.score - a.score)
      const bestResult = allResults[0]
      
      this.showDebugInfo('🏆 BÄSTA RESULTAT', 
        `${bestResult.version}: ${bestResult.products.length} produkter (poäng: ${bestResult.score})`)
      
      console.log(`✅ Bästa resultat: ${bestResult.version} med ${bestResult.products.length} produkter`)
      return bestResult.products
        
    } catch (error) {
      console.error('❌ Multi-pass OCR misslyckades:', error)
      this.showDebugInfo('❌ FEL', `OCR misslyckades: ${error.message}`)
      return []
    }
  }

  // Sätt olika OCR-parametrar för olika strategier
  async setOCRParameters(strategy) {
    const configs = [
      // Strategi 0: Precision (för tydlig text)
      {
        tessedit_pageseg_mode: 6, // Uniform text block
        tessedit_ocr_engine_mode: 2, // LSTM only
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-€kr%*/() '
      },
      // Strategi 1: Aggressiv (för otydlig text)
      {
        tessedit_pageseg_mode: 8, // Single word
        tessedit_ocr_engine_mode: 1, // LSTM + Legacy
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-€kr%*/()  '
      },
      // Strategi 2: Bred (för komplexa layouter)
      {
        tessedit_pageseg_mode: 11, // Sparse text
        tessedit_ocr_engine_mode: 3, // Legacy only
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-€kr%*/()  '
      }
    ]
    
    await this.worker.setParameters(configs[strategy])
  }

  // Poängsätt resultat baserat på kvalitet
  scoreResult(text, products) {
    let score = 0
    
    // Poäng för antal produkter
    score += products.length * 10
    
    // Poäng för textlängd (mer text = mer information)
    score += Math.min(text.length / 10, 50)
    
    // Poäng för vanliga matvaruord
    const foodWords = ['banan', 'svamp', 'champinjon', 'gurka', 'avokado', 'lakrits', 'bröd', 'mjölk', 'ost', 'kött']
    const lowerText = text.toLowerCase()
    foodWords.forEach(word => {
      if (lowerText.includes(word)) score += 5
    })
    
    // Poäng för prisformat (X.XX kr)
    const priceMatches = text.match(/\d+[.,]\d{2}\s*kr/gi)
    if (priceMatches) score += priceMatches.length * 3
    
    return score
  }

  // Förbehandla bild för bättre OCR-resultat
  preprocessImage(imageElement, mode = 'standard') {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Skala upp bilden för bättre OCR-precision
    const scale = mode === 'soft' ? 1.5 : 2
    canvas.width = (imageElement.naturalWidth || imageElement.width) * scale
    canvas.height = (imageElement.naturalHeight || imageElement.height) * scale
    
    ctx.imageSmoothingEnabled = mode === 'soft'
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height
    
    // Olika förbehandlingsstrategier
    switch (mode) {
      case 'high_contrast':
        // Hård svartvit kontrast
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          const enhanced = gray > 110 ? 255 : 0 // Lägre tröskel för mer text
          data[i] = data[i + 1] = data[i + 2] = enhanced
        }
        break
        
      case 'soft':
        // Mjuk förbättring
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          const enhanced = Math.min(255, gray * 1.3) // Öka kontrast mjukt
          data[i] = data[i + 1] = data[i + 2] = enhanced
        }
        break
        
      default: // 'standard'
        // Adaptiv tröskelvärdering som tidigare
        const cleanedData = new Uint8ClampedArray(data.length)
        
        // Brusminskning
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4
            const neighbors = []
            
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ni = ((y + dy) * width + (x + dx)) * 4
                const gray = data[ni] * 0.299 + data[ni + 1] * 0.587 + data[ni + 2] * 0.114
                neighbors.push(gray)
              }
            }
            
            neighbors.sort((a, b) => a - b)
            const medianGray = neighbors[4]
            cleanedData[i] = cleanedData[i + 1] = cleanedData[i + 2] = medianGray
            cleanedData[i + 3] = data[i + 3]
          }
        }
        
        // Adaptiv tröskelvärdering
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4
            let sum = 0, count = 0
            const radius = 7
            
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const ny = y + dy, nx = x + dx
                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  sum += cleanedData[(ny * width + nx) * 4]
                  count++
                }
              }
            }
            
            const threshold = (sum / count) - 10
            const pixelValue = cleanedData[i] > threshold ? 255 : 0
            data[i] = data[i + 1] = data[i + 2] = pixelValue
          }
        }
    }
    
    ctx.putImageData(imageData, 0, 0)
    console.log(`🖼️ Bildförbehandling (${mode}) klar`)
    return canvas
  }

  parseReceiptText(text, version = 'unknown') {
    const allLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    console.log('📄 Alla rader:', allLines)
    
    // Använd avancerad kvittoanalys
    console.log('🤖 Startar avancerad kvittoanalys...')
    this.showDebugInfo('📄 OCR RADER (totalt ' + allLines.length + '):', allLines.map((line, i) => `${i+1}: "${line}"`).join('\n'))
    
    // Kör extraktion med extra debug
    console.log('📦 Startar produktextraktion...')
    const extractedProducts = extractProductsFromReceipt(allLines)
    
    console.log(`📊 Extraktion klar: ${extractedProducts.length} produkter hittade`)
    this.showDebugInfo('🎯 EXTRAHERADE FRÅN OCR (' + extractedProducts.length + ' st):', 
      extractedProducts.length > 0 
        ? extractedProducts.map((p, i) => `${i+1}. "${p.name}" (pris: ${p.price || 'inget'})`).join('\n')
        : 'INGA PRODUKTER EXTRAHERADE!')
    
    if (extractedProducts.length === 0) {
      this.showDebugInfo('❌ VARNING!', 'Ingen produkt extraherad från OCR-text. Kontrollera mönster!')
    }
    
    const products = []
    
    for (const product of extractedProducts) {
      // Rensa produktnamn och extrahera kärnan
      const cleanedName = this.extractCoreProductName(product.name)
      const originalName = product.name
      
      const isDefinitelyNotFood = this.isDefinitelyNotFood(originalName)
      const isLikelyFood = this.isLikelyFoodProduct(cleanedName) // Använd det rensade namnet
      
      // Debug varje produkt med båda namnen
      this.showDebugInfo(`Analyserar "${originalName}"`, 
        `Rensat namn: "${cleanedName}"\nDefinitely NOT food: ${isDefinitelyNotFood}\nLikely food: ${isLikelyFood}`)
      
      // Extra säkerhetskontroll - undvik icke-matvaror
      if (isDefinitelyNotFood) {
        console.log(`🗑️ Hoppar över icke-matvara: ${originalName}`)
        continue
      }
      
      // Använd AI för att avgöra om detta är en matvara (med rensat namn)
      if (isLikelyFood) {
        // Standardisera produktformatet med originalnamnet men rensat för display
        const standardProduct = {
          name: cleanedName, // Använd det rensade namnet
          originalName: originalName, // Behåll originalet för debug
          quantity: product.quantity || this.extractQuantityFromName(originalName),
          unit: product.unit || this.guessUnit(originalName),
          price: product.price
        }
        products.push(standardProduct)
        console.log(`🍎 Lägger till matvara: ${cleanedName} (från "${originalName}")`)
      } else {
        console.log(`🚫 Filtrerar bort icke-matvara: ${originalName} (rensat: ${cleanedName})`)
      }
    }
    
    console.log(`📊 Slutresultat: ${products.length} matvaror identifierade`)
    return products
  }

  // Visa debug-info på skärmen för telefondebug
  showDebugInfo(title, content) {
    if (!this.debugMode) return
    
    // Skapa eller hitta debug-element
    let debugElement = document.getElementById('receipt-debug')
    if (!debugElement) {
      debugElement = document.createElement('div')
      debugElement.id = 'receipt-debug'
      debugElement.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        right: 10px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        max-height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
      `
      document.body.appendChild(debugElement)
    }
    
    // Lägg till debug-info
    const timestamp = new Date().toLocaleTimeString()
    debugElement.innerHTML += `\n\n[${timestamp}] ${title}\n${content}\n${'='.repeat(50)}`
    
    // Scrolla ned
    debugElement.scrollTop = debugElement.scrollHeight
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
    // Hoppa över uppenbart icke-produktrader (men INTE * som kan vara produkter)
    const obviousIgnore = [
      /^\s*$/,                           // Tom rad
      /^[-=_]{3,}$/,                     // Bara streck/symboler (EJ * som kan vara produkter)
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
    
    // Generösa mönster för att hitta produkter (med och utan priser)
    const productPatterns = [
      // Standard: "Produktnamn    12.50" eller "Produktnamn 12.50"
      /^(.+?)\s+(\d+[.,]\d{1,2})\s*kr?\s*$/i,
      
      // Med kvantitet: "Produktnamn 2st    25.00"
      /^(.+?)\s+\d+\s*(?:st|kg|g|L|cl|ml)\s+(\d+[.,]\d{1,2})\s*kr?\s*$/i,
      
      // Med multiplikation: "Produktnamn 2 x 12.50"
      /^(.+?)\s+\d+\s*x\s*(\d+[.,]\d{1,2})\s*kr?\s*$/i,
      
      // Pris först: "12.50 Produktnamn"
      /^(\d+[.,]\d{1,2})\s*kr?\s+(.+)$/i,
      
      // ***NYTT*** Asterisk-format: "*Avokado", "*Lakritsmix", "*Svamp champinjon"
      /^\*\s*([a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\s\-]{2,40})\s*$/i,
      
      // ***NYTT*** Produkter med komman: "Avokado, Lakritsmix, Svamp"
      /^([a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\s\-,]{3,50})$/i,
      
      // Endast produktnamn (inget pris) - mer generös
      /^([a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\s\d\-]{2,40})$/i
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
        
        // Rensa produktnamnet (ta bort * och extra mellanslag)
        let cleanedName = this.cleanProductName(productName)
        cleanedName = cleanedName.replace(/^\*\s*/, '').trim() // Ta bort * i början
        
        // Hantera kommaseparerade produkter ("Avokado, Lakritsmix, Svamp")
        if (cleanedName.includes(',')) {
          console.log(`🔪 Hittade kommaseparerade produkter: "${cleanedName}"`)
          const products = []
          const parts = cleanedName.split(',').map(p => p.trim()).filter(p => p.length > 2)
          
          for (const part of parts) {
            const partCleaned = this.cleanProductName(part)
            if (this.isValidProductName(partCleaned)) {
              products.push({
                name: partCleaned,
                price: price || 0,
                quantity: 1, // Varje del får kvantitet 1
                unit: this.guessUnit(partCleaned)
              })
            }
          }
          
          return products // Returnera array av produkter
        }
        
        if (this.isValidProductName(cleanedName)) {
          return {
            name: cleanedName,
            price: price || 0,
            quantity: quantity || 1,
            unit: unit || this.guessUnit(cleanedName)
          }
        }
      }
    }
    
    return null
  }

  // Kraftfull OCR-felkorrektion och otydlighetshantering
  correctOCRErrors(text) {
    if (!text) return text
    
    let corrected = text.toLowerCase()
    
    // Specifika produktnamn-korrigeringar
    const productCorrections = {
      'ritik': 'lakritsmix',
      'ritik.*mix': 'lakritsmix',
      'ritik.*1258.*dre': 'lakritsmix',
      'akritsmix': 'lakritsmix',
      'iakritsmix': 'lakritsmix',
      'lakrit.*mix': 'lakritsmix',
      'gurka.*mini': 'mini gurka',
      'mini.*gurka': 'mini gurka',
      'gur[kc]a': 'gurka',
      'avoka[dt]o': 'avokado',
      'avo[ck]ado': 'avokado',
      'svamp.*champ': 'svamp champinjon',
      'champ.*svamp': 'svamp champinjon'
    }
    
    // Applicera produktkorrigeringar
    for (const [errorPattern, correction] of Object.entries(productCorrections)) {
      const regex = new RegExp(errorPattern, 'gi')
      if (regex.test(corrected)) {
        corrected = correction
        console.log(`⚙️ OCR-korrektion: "${text}" → "${correction}"`)
        return correction
      }
    }
    
    // Vanliga OCR-fel och deras korrigeringar
    const ocrCorrections = {
      // Siffror som blir bokstäver
      '0': ['o', 'O'], '1': ['l', 'I', '|'], '5': ['s', 'S'], '8': ['B'], '6': ['G'],
      
      // Bokstäver som blir siffror
      'o': ['0'], 'l': ['1', 'I'], 's': ['5'], 'g': ['9'], 'z': ['2'],
      
      // Vanliga svenska bokstavsfel
      'ä': ['a', 'ae'], 'ö': ['o', 'oe'], 'å': ['a', 'aa'],
      'c': ['e'], 'e': ['c'], 'n': ['h'], 'h': ['n'], 'm': ['rn'],
      'u': ['v'], 'v': ['u'], 'w': ['vv'], 'k': ['lc'], 'g': ['q'],
      
      // Speciella tecken som försvinner eller blir fel
      '\u00a0': ' ', '­': '', '​': '', // Icke-synliga tecken
    }
    
    // Applicera grundläggande korrigeringar
    for (const [correct, errors] of Object.entries(ocrCorrections)) {
      for (const error of errors) {
        corrected = corrected.replace(new RegExp(error, 'gi'), correct)
      }
    }
    
    return corrected
  }
  
  // Phonetic matching för svenska ord (Double Metaphone-inspirerad)
  getSoundex(word) {
    if (!word) return ''
    
    let soundex = word.toLowerCase()
      .replace(/[^åäöa-z]/g, '')
      // Svenska ljud
      .replace(/ck/g, 'k')
      .replace(/ch/g, 'sh')
      .replace(/sch/g, 'sh') 
      .replace(/tj/g, 'sh')
      .replace(/kj/g, 'sh')
      .replace(/sk/g, 'sh')
      .replace(/ä/g, 'e')
      .replace(/ö/g, 'o')
      .replace(/å/g, 'o')
      // Liknande ljud
      .replace(/[bp]/g, 'b')
      .replace(/[dt]/g, 't')
      .replace(/[kg]/g, 'k')
      .replace(/[fv]/g, 'f')
      .replace(/[sz]/g, 's')
      .replace(/[mn]/g, 'm')
      .replace(/[lr]/g, 'l')
      
    return soundex.substring(0, 4)
  }
  
  // Kontextuell intelligens för produktgissning
  findBestMatch(garbledText, candidates) {
    const garbled = garbledText.toLowerCase().trim()
    let bestMatch = null
    let bestScore = 0
    
    for (const candidate of candidates) {
      const cand = candidate.toLowerCase()
      let score = 0
      
      // Exakt match
      if (garbled === cand) return candidate
      
      // Substring match
      if (garbled.includes(cand) || cand.includes(garbled)) {
        score += 0.8
      }
      
      // Fuzzy match med Levenshtein
      const similarity = 1 - (this.levenshteinDistance(garbled, cand) / Math.max(garbled.length, cand.length))
      score += similarity * 0.6
      
      // Phonetic match
      if (this.getSoundex(garbled) === this.getSoundex(cand)) {
        score += 0.4
      }
      
      // Första bokstäver matchar
      if (garbled[0] === cand[0]) {
        score += 0.2
      }
      
      // Samma längd ger bonus
      if (Math.abs(garbled.length - cand.length) <= 2) {
        score += 0.1
      }
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = candidate
      }
    }
    
    return bestScore > 0.5 ? bestMatch : null
  }
  
  // Avancerad AI för sömlös produktigenkänning med otydlighetshantering
  isLikelyFoodProduct(productName) {
    if (!productName || productName.length < 2) return false
    
    // ***KRITISK SÄKERHETSCHECK*** - först validera att det är ett vettigt produktnamn
    if (!this.isValidProductName(productName)) {
      console.log(`🚨 Avvisar nonsens-produktnamn: "${productName}"`)
      return false
    }
    
    // Först korrigera OCR-fel
    const correctedName = this.correctOCRErrors(productName)
    const name = correctedName.toLowerCase().trim()
    
    // Definitivt INTE matvaror (hög precision med fuzzy matching)
    const definitelyNotFood = [
      'påse', 'plastpåse', 'kasse', 'bärare', 'papperspåse', 'shopping', 'bag',
      'diskmedel', 'tvättmedel', 'städ', 'rengöring', 'kemikalie', 'spray',
      'tandkräm', 'tandborste', 'schampo', 'tvål', 'deodorant', 'shampoo',
      'batterier', 'glödlampa', 'tidning', 'magasin', 'present', 'gåva',
      'blommor', 'växt', 'leksak', 'cigaretter', 'tobak', 'lighter',
      'verktyg', 'skruv', 'spik', 'järn', 'plast', 'metall', 'elektronik'
    ]
    
    // Fuzzy matching för icke-matvaror
    if (definitelyNotFood.some(item => this.fuzzyMatch(name, item, 0.8))) {
      console.log(`🚫 Fuzzy match icke-matvara: "${productName}"`)
      return false
    }
    
    // Omfattande matvaruindikatorer med svenska termer, varumärken och synonymer
    // PLUS OCR-trasiga versioner för fuzzy matching
    const foodIndicators = [
      // OCR-trasiga versioner av vanliga produkter
      'ritik', 'akrit', 'iakrit', 'lakrit', // För lakritsmix
      'vokado', 'avoka', 'avoca', 'avokndo', // För avokado  
      'gurka', 'gurca', 'gurk', 'gur', 'urka', // För gurka
      'vamp', 'svanp', 'svam', 'champ', 'chanp', // För svamp
      'bnan', 'bana', 'banan', 'banana', // För banan
      
      // Frukt & grönt (svenska och internationella namn)
      'äpple', 'apple', 'päron', 'pears', 'banan', 'banana', 'apelsin', 'orange', 
      'citron', 'lemon', 'lime', 'kiwi', 'mango', 'ananas', 'pineapple',
      'vindruv', 'grapes', 'melon', 'vattenmelon', 'watermelon', 'cantaloupe',
      'jordgubb', 'strawberry', 'hallon', 'raspberry', 'blåbär', 'blueberry', 
      'lingon', 'cranberry', 'björnbär', 'blackberry', 'vinbär', 'currant',
      'tomat', 'tomato', 'körsbärstomat', 'cocktailtomat', 'plommtomat', 'tomatkvist',
      'gurka', 'cucumber', 'minigurka', 'mini gurka', 'växthus gurka', 'slanggurka',
      'paprika', 'pepper', 'chili', 'spetspaprika', 'romano paprika', '3-färg paprika',
      'lök', 'onion', 'rödlök', 'vitlök', 'garlic', 'morot', 'carrot', 'primörmorötter',
      'potatis', 'potato', 'sötpotatis', 'sweet potato', 'rotselleri', 'celery',
      'broccoli', 'blomkål', 'cauliflower', 'kål', 'cabbage', 'vitkål', 'rödkål',
      'sallad', 'lettuce', 'iceberg', 'rucola', 'arugula', 'spenat', 'spinach', 'babyspenat',
      'dill', 'persilja', 'parsley', 'basilika', 'basil', 'oregano', 'timjan', 'thyme',
      'purjolök', 'leek', 'selleri', 'rädisa', 'radish', 'rödbetor', 'beetroot',
      'palsternacka', 'parsnip', 'kålrot', 'swede', 'pumpa', 'pumpkin',
      'zucchini', 'squash', 'aubergine', 'eggplant', 'avokado', 'avocado', 'hass avokado', 'mogna avokado',
      // Svamp
      'svamp', 'mushroom', 'champinjon', 'champignon', 'kantarell', 'shiitake',
      'ostronsvamp', 'portabello', 'portobello', 'enoki', 'cremini', 'button mushroom',
      
      // Kött & chark (svenska termer + varumärken)
      'kött', 'meat', 'nötkött', 'beef', 'fläsk', 'pork', 'lamm', 'lamb',
      'kyckling', 'chicken', 'kalkon', 'turkey', 'and', 'duck', 'gås', 'goose',
      'korv', 'sausage', 'prinskorv', 'falukorv', 'salami', 'chorizo', 'pepperoni',
      'skinka', 'ham', 'bacon', 'fläsk', 'kassler', 'rökt', 'smoked',
      'köttbullar', 'meatballs', 'köttfärs', 'mince', 'färs', 'ground',
      'fläskfilé', 'pork tenderloin', 'nötfilé', 'beef fillet', 'entrecote',
      'kyckling', 'kycklingfilé', 'chicken breast', 'kycklinglår', 'chicken thigh',
      // Svenska köttvarumärken
      'scan', 'danish crown', 'krönjägaren', 'levängers', 'gunnarshög',
      
      // Fisk & skaldjur
      'fisk', 'lax', 'torsk', 'sill', 'makrill', 'tonfisk', 'räkor', 'kräftor',
      'musslor', 'hummer', 'krabba', 'abborre', 'gädda',
      
      // Mejeri (svenska termer + varumärken)
      'mjölk', 'milk', 'standardmjölk', 'mellanmjölk', 'lättmjölk', 'minimjölk',
      'havremjölk', 'oat milk', 'mandelmjölk', 'almond milk', 'sojamjölk', 'soy milk',
      'grädde', 'cream', 'vispgrädde', 'whipping cream', 'matlagningsgrädde',
      'filmjölk', 'soured milk', 'kefir', 'buttermilk', 'kärnmjölk',
      'yoghurt', 'yogurt', 'naturell', 'natural', 'grekisk', 'greek', 'probiotisk',
      'kvarg', 'quark', 'cottage cheese', 'keso', 'ricotta',
      // Osttyper
      'ost', 'cheese', 'cheddar', 'gouda', 'brie', 'camembert', 'roquefort',
      'herrgård', 'präst', 'västerbotten', 'grädd', 'hård', 'mjölk',
      'mozzarella', 'parmesan', 'feta', 'getost', 'chevre', 'blue cheese',
      // Smör & margarin
      'smör', 'butter', 'margarin', 'margarine', 'bregott', 'flora', 'lätta',
      'crème fraiche', 'philadelphia', 'sourcream', 'gräddfil',
      // Svenska mejerivarumärken
      'arla', 'skånemejerier', 'norrmejerier', 'falsterbo', 'längkärra',
      'krono', 'milko', 'garant', 'eldorado',
      
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
      
      // Drycker (med svenska varumärken)
      'juice', 'äppeljuice', 'apelsinjuice', 'tranbärsjuice', 'ananasjuice',
      'bravo', 'tropicana', 'god morgon', 'froosh', 'innocent', 'råjuice',
      'läsk', 'coca cola', 'pepsi', 'sprite', 'fanta', 'festis', 'julmust',
      '7up', 'mirinda', 'schweppes', 'trocadero', 'pommac', 'champis',
      'vatten', 'mineralvatten', 'ramlösa', 'loka', 'evian', 'bonaqua',
      'källvatten', 'naturell', 'kolsyrat', 'still', 'sparkling',
      // Varma drycker
      'kaffe', 'coffee', 'espresso', 'cappuccino', 'latte', 'americano',
      'gevalia', 'löfbergs', 'zoegas', 'arvid nordquist', 'classic',
      'te', 'tea', 'earl grey', 'grön te', 'green tea', 'rooibos', 'chai',
      'lipton', 'tetley', 'twinings', 'örtte', 'kusmi',
      // Alkohol
      'öl', 'beer', 'folköl', 'lättöl', 'starköl', 'ipa', 'lager',
      'carlsberg', 'heineken', 'stella artois', 'brooklyn', 'spendrups',
      'vin', 'wine', 'rödvin', 'red wine', 'vitt vin', 'white wine',
      'rosé', 'champagne', 'prosecco', 'cava', 'sprit', 'vodka', 'whiskey',
      
      // Bröd & bakverk (svenska varumärken)
      'bröd', 'bread', 'limpa', 'tunnbröd', 'knäckebröd', 'rye bread',
      'polarbröd', 'skogaholm', 'wasa', 'leksands', 'fin crisp', 'ryvita',
      'hamburgerbröd', 'toast', 'bagel', 'croissant', 'scones', 'muffins',
      
      // Sötsaker & snacks (svenska varumärken)
      'choklad', 'chocolate', 'marabou', 'fazer', 'lindt', 'toblerone',
      'godis', 'candy', 'lösgodis', 'haribo', 'malaco', 'cloetta',
      'lakrits', 'lakritsmix', 'licorice', 'salmiak', 'djungelvraal',
      'saltlakrits', 'lakritshjul', 'lakritsbåtar', 'ahlgrens',
      'kex', 'cookies', 'digestive', 'maria', 'ballerina', 'göteborgs',
      'chips', 'estrella', 'ojä', 'taffel', 'pringles', 'cheez doodles',
      'popcorn', 'nötter', 'nuts', 'mandel', 'cashew', 'pistasch',
      
      // Fryst & glass
      'fryst', 'frozen', 'frysta', 'köttbullar', 'pizza', 'pannkakor',
      'glass', 'ice cream', 'magnum', 'ben jerry', 'häagen dazs', 'gb',
      'struts', '88:an', 'nogger', 'cornetto', 'päron split',
      
      // Kryddor & såser (svenska varumärken)
      'krydda', 'spice', 'santa maria', 'ica basic', 'garant',
      'ketchup', 'senap', 'mustard', 'majonnäs', 'mayonnaise', 'felix',
      'sojasås', 'soy sauce', 'sriracha', 'tabasco', 'worcester',
      
      // Specialkost & hälsa
      'glutenfri', 'gluten free', 'laktosfri', 'lactose free', 'vegansk', 'vegan',
      'vegetarisk', 'vegetarian', 'eko', 'organic', 'krav', 'färsk', 'fresh',
      'naturell', 'natural', 'hälsokost', 'superfood', 'protein',
      
      // Barnmat
      'baby', 'barnmat', 'baby food', 'välling', 'gröt', 'porridge',
      'semper', 'nestle', 'follow', 'hipp', 'blådra', 'näringsdryck',
      
      // Fisk & skaldjur (utökade)
      'fisk', 'fish', 'lax', 'salmon', 'torsk', 'cod', 'sill', 'herring',
      'makrill', 'mackerel', 'tonfisk', 'tuna', 'räkor', 'shrimp',
      'kräftor', 'crayfish', 'musslor', 'mussels', 'ostron', 'oysters'
    ]
    
    // Använd avancerad produktanalys
    const analysis = this.analyzeProductName(correctedName)
    
    // Intelligent matching med flera metoder
    
    // 1. Direkta fuzzy matches mot matvaruindikatorer (lägre tröskel för OCR-fel)
    const fuzzyMatches = foodIndicators.filter(indicator => 
      this.fuzzyMatch(name, indicator, 0.4) // Sänkt från 0.6 till 0.4
    )
    
    if (fuzzyMatches.length > 0) {
      console.log(`🎯 Fuzzy match matvaror: ${fuzzyMatches.join(', ')} för "${productName}" (korrigerat: "${correctedName}")`)
      return true
    }
    
    // 2. Intelligent best match med OCR-korrektion
    const bestMatch = this.findBestMatch(name, foodIndicators)
    if (bestMatch) {
      console.log(`🤖 Intelligent match: "${productName}" → "${bestMatch}" (OCR-korrigerat: "${correctedName}")`)
      return true
    }
    
    // 3. Partiell matching - hitta delar av ord
    const partialMatches = foodIndicators.filter(indicator => {
      const parts = name.split(/[\s\-_]+/)
      return parts.some(part => part.length > 2 && indicator.includes(part))
    })
    
    if (partialMatches.length > 0) {
      console.log(`📍 Partiell match: "${productName}" matchar delar av [${partialMatches.join(', ')}]`)
      return true
    }
    
    // 4. Kontextuell inferens baserat på ordstruktur
    const contextualClues = this.analyzeWordStructure(name)
    if (contextualClues.isFoodLike) {
      console.log(`🔍 Kontextuell inferens: "${productName}" har matvaruliknande struktur (${contextualClues.reasons.join(', ')})`)
      return true
    }
    
    // 5. Använd AI-analys med konfidensgrad
    if (analysis.confidence >= 0.2) { // Sänkt tröskel ännu mer för OCR-fel
      console.log(`🤖 AI-analys: ${Math.round(analysis.confidence * 100)}% säker på "${productName}" (${analysis.categories.join(', ')})`);
      return true
    }
    
    // Varumärke ger hög troliga
    if (analysis.brandMatch) {
      console.log(`🎆 Känt varumärke "${analysis.brandMatch}" för "${productName}"`);
      return true
    }
    
    // Heuristik för svenska matvarunamn
    if (name.length <= 15) {
      const foodEndings = ['mjölk', 'ost', 'kött', 'fisk', 'bröd', 'juice', 'gryn', 'olja']
      if (foodEndings.some(ending => name.endsWith(ending))) {
        console.log(`🔍 Matvarusuffix hittad i "${productName}"`);
        return true
      }
    }
    
    // ***TRÄNINGSDATA-BASERAD*** Validering - jämför mot verkliga kvitton
    const trainingAnalysis = analyzeAgainstTrainingData(productName)
    if (trainingAnalysis.confidence >= 0.3) {
      console.log(`🎯 Träningsdata-match (${Math.round(trainingAnalysis.confidence * 100)}%): "${productName}" liknar [${trainingAnalysis.matches.join(', ')}]`);
      return true
    }
    
    console.log(`🚫 Filtrerar definitivt bort: "${productName}"`);
    return false
  }

  // Fuzzy string matching för intelligent produktigenkänning
  fuzzyMatch(str1, str2, threshold = 0.7) {
    if (!str1 || !str2) return false
    
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
    
    // Exakt match
    if (s1 === s2) return true
    
    // Substring match
    if (s1.includes(s2) || s2.includes(s1)) return true
    
    // Levenshtein distance för fuzzy matching
    const distance = this.levenshteinDistance(s1, s2)
    const maxLen = Math.max(s1.length, s2.length)
    const similarity = 1 - (distance / maxLen)
    
    return similarity >= threshold
  }
  
  // Levenshtein distance algoritm
  levenshteinDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
  
  // Intelligent produktnamnsanalys med NLP-liknande tekniker
  analyzeProductName(name) {
    const analysis = {
      originalName: name,
      confidence: 0,
      foodProbability: 0,
      categories: [],
      brandMatch: null,
      cleanedName: this.cleanProductName(name)
    }
    
    const lowerName = name.toLowerCase()
    
    // Kategoriklassificering
    const categories = {
      'frukt_gront': ['frukt', 'grön', 'sallad', 'tomat', 'gurka', 'potatis'],
      'mejeri': ['mjölk', 'ost', 'yoghurt', 'smör', 'grädde'],
      'kott_fisk': ['kött', 'fisk', 'kyckling', 'korv', 'skinka'],
      'brod_spannmal': ['bröd', 'pasta', 'ris', 'havregryn'],
      'drycker': ['juice', 'läsk', 'vatten', 'kaffe', 'te'],
      'godis_snacks': ['choklad', 'godis', 'chips', 'kex']
    }
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        analysis.categories.push(category)
        analysis.foodProbability += 0.2
      }
    }
    
    // Varumärkesigenkänning
    const brands = ['arla', 'fazer', 'marabou', 'felix', 'scan', 'ica', 'coop']
    for (const brand of brands) {
      if (lowerName.includes(brand)) {
        analysis.brandMatch = brand
        analysis.foodProbability += 0.3
        break
      }
    }
    
    // Specialmarkeringar
    const specialMarkers = ['eko', 'krav', 'glutenfri', 'laktosfri']
    if (specialMarkers.some(marker => lowerName.includes(marker))) {
      analysis.foodProbability += 0.2
    }
    
    analysis.confidence = Math.min(analysis.foodProbability, 1.0)
    
    return analysis
  }
  
  // Kontextuell ordstrukturanalys för att gissa om något är mat
  analyzeWordStructure(name) {
    const analysis = {
      isFoodLike: false,
      reasons: []
    }
    
    if (!name || name.length < 3) return analysis
    
    const lowerName = name.toLowerCase()
    
    // Svenska matvarusuffix
    const foodSuffixes = ['kött', 'fisk', 'mjölk', 'bröd', 'ost', 'juice', 'olja', 'gryn', 'mjöl']
    if (foodSuffixes.some(suffix => lowerName.endsWith(suffix))) {
      analysis.isFoodLike = true
      analysis.reasons.push('har matsuffix')
    }
    
    // Svenska matvaruprefix
    const foodPrefixes = ['fisk', 'kött', 'frukt', 'grönt', 'mejeri']
    if (foodPrefixes.some(prefix => lowerName.startsWith(prefix))) {
      analysis.isFoodLike = true
      analysis.reasons.push('har matprefix')
    }
    
    // Sammansatta ord med matvardelar
    const foodParts = ['äpple', 'kött', 'mjölk', 'ost', 'bröd', 'fisk', 'kyckling']
    const words = lowerName.split(/[\s-]+/)
    if (words.some(word => foodParts.includes(word))) {
      analysis.isFoodLike = true
      analysis.reasons.push('innehåller matvarsdel')
    }
    
    // Typiska svenska matvaruord-mönster
    if (lowerName.match(/^[a-zåäö]{4,15}$/)) {
      // Enkla ord utan siffror - ofta matvaror
      if (!lowerName.match(/(disk|städ|kemisk|plast|metall|elektronik)/)) {
        analysis.isFoodLike = true
        analysis.reasons.push('enkelt svenskt ord')
      }
    }
    
    // Dubbla vokaler (svenska mönster)
    if (lowerName.match(/[aeiouåäö]{2,}/)) {
      analysis.isFoodLike = true
      analysis.reasons.push('dubbla vokaler')
    }
    
    // Typiska svenska slutljud
    if (lowerName.match(/(ning|het|skap|dom)$/)) {
      analysis.isFoodLike = false // Dessa är sällan mat
    } else if (lowerName.match(/(or|ar|er|ad|at)$/)) {
      analysis.isFoodLike = true
      analysis.reasons.push('svenskt ordslut')
    }
    
    return analysis
  }

  cleanProductName(name) {
    if (!name) return ''
    
    // Först korrigera OCR-fel
    let cleaned = this.correctOCRErrors(name)
    
    // Ta bort vanliga kvitto-prefix/suffix och kvantiteter
    cleaned = cleaned
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
      .replace(/[*\^\~\`]+/g, '') // Ta bort diverse symboler som kan komma från OCR
      .replace(/[\u00a0\u2000-\u200f\u2028-\u202f]/g, ' ') // Ta bort konstiga mellanslag
      .replace(/\s+/g, ' ') // Normalisera mellanslag
      .replace(/[^a-zA-ZåäöÅÄÖ\s\-]/g, '') // Ta bort konstiga tecken, behåll bara bokstäver
      .trim()
      .toLowerCase() // Normalisera till gemener
      .replace(/^(\w)/, (match) => match.toUpperCase()) // Stor bokstav först
    
    // Extra validering och korrektion
    if (cleaned.length < 2) return name // Returnera original om för kort
    
    return cleaned
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
    if (!name || typeof name !== 'string') return false
    
    const trimmed = name.trim()
    
    // Grundläggande längdkontroll - mer generös
    if (trimmed.length < 2 || trimmed.length > 50) return false
    
    // Måste innehålla minst 2 bokstäver
    const letterCount = (trimmed.match(/[a-zA-ZåäöÅÄÖ]/g) || []).length
    if (letterCount < 2) return false
    
    // Får inte bara vara ett pris
    if (/^\d+[.,]\d{2}$/.test(trimmed)) return false
    
    // Får inte vara bara siffror
    if (/^\d+$/.test(trimmed)) return false
    
    // Får inte vara bara symboler/mellanslag
    if (!/[a-zA-ZåäöÅÄÖ]/.test(trimmed)) return false
    
    // Extrema fall - bara repeterade bokstäver
    const lowerName = trimmed.toLowerCase().replace(/\s/g, '')
    if (/^([a-zåäö])\1+$/.test(lowerName) && lowerName.length > 2) {
      console.log(`🚫 Filtrerar bort repeterad nonsens: "${name}"`)
      return false
    }
    
    // Låt träningsdatan göra resten av jobbet!
    return true
  }
  
  // Säkerhetskontroll för att identifiera definitivt INTE matvaror
  isDefinitelyNotFood(productName) {
    if (!productName) return true
    
    const name = productName.toLowerCase().trim()
    
    // Betalningsrelaterat
    const paymentKeywords = [
      'mottaget', 'kontokort', 'bankkort', 'kort', 'card', 'swish', 'kontant', 'cash',
      'betalning', 'payment', 'betalt', 'paid', 'kredit', 'debit'
    ]
    
    // ICA-tjänster och bonusprogram
    const serviceKeywords = [
      'ica aptiten', 'ica banken', 'ica försäkring', 'stamkund', 'medlem',
      'bonuscheck', 'kvittolotteri', 'kundklubb', 'bonus check', 'aptiten'
    ]
    
    // Kvittoinformation
    const receiptKeywords = [
      'organisationsnummer', 'org nr', 'telefon', 'tel', 'adress', 'address',
      'kvitto', 'receipt', 'tack för', 'thank you', 'välkommen åter',
      'moms', 'vat', 'totalt', 'total', 'summa', 'sum', 'att betala'
    ]
    
    // Kampanjer och erbjudanden
    const promotionKeywords = [
      'kampanj', 'erbjudande', 'rabatt', 'spar', 'bonus', 'save', 'offer'
    ]
    
    const allKeywords = [...paymentKeywords, ...serviceKeywords, ...receiptKeywords, ...promotionKeywords]
    
    // Kolla om något nyckelord finns i produktnamnet
    if (allKeywords.some(keyword => name.includes(keyword))) {
      return true
    }
    
    // Kolla för bara siffror eller organisationsnummer-liknande
    if (/^\d{3}\s*\d{2}\s*\d{5}$/.test(name)) return true // Organisationsnummer
    if (/^\d{4,}$/.test(name)) return true // Långa siffror
    if (/^\d+[.,]\d{2}\s*kr?$/.test(name)) return true // Bara priser
    
    return false
  }

  // Extrahera kärn-produktnamnet genom att ta bort priser, kvantiteter och symboler
  extractCoreProductName(name) {
    if (!name) return ''
    
    let cleaned = name.trim()
    
    // Ta bort ledande symboler som * eller -
    cleaned = cleaned.replace(/^[*\-+#@&%]+\s*/, '')
    
    // Ta bort pris-mönster (X.XX kr, X,XX kr, XX.XX, etc.)
    cleaned = cleaned.replace(/\s*\d+[.,]\d{1,2}\s*(kr|sek|:\-|$)/gi, '')
    
    // Ta bort enbart siffror i slutet (priser utan kr)
    cleaned = cleaned.replace(/\s*\d+[.,]\d{2}\s*$/, '')
    
    // Ta bort kvantitets-mönster (2st, 1kg, 3x, 25t, etc.)
    cleaned = cleaned.replace(/\s*\d+\s*(st|kg|g|l|ml|cl|x|t|pack|påse|burk)\b/gi, '')
    
    // Ta bort procent och specialtecken
    cleaned = cleaned.replace(/[%#@&*+\-=<>{}\[\]\|\\~/]+/g, ' ')
    
    // Ta bort extra siffror och konstiga sekvenser
    cleaned = cleaned.replace(/\s*\d{3,}\s*/g, ' ') // Långa siffersekvenser
    
    // Normalisera mellanslag och trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    // Om resultatet är för kort, behåll mer av originalet
    if (cleaned.length < 3 && name.length > 3) {
      // Försök enklare rensning
      cleaned = name.replace(/^[*\-+]+\s*/, '')
                    .replace(/\s*\d+[.,]\d{2}.*$/, '')
                    .replace(/[%*\-+=]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
    }
    
    return cleaned || name.trim()
  }
  
  // Extrahera kvantitet från produktnamn
  extractQuantityFromName(name) {
    // Leta efter mönster som "2st", "1kg", "3x", etc.
    const quantityMatch = name.match(/(\d+)\s*(st|kg|g|l|ml|cl|x|t|pack|påse|burk)/i)
    if (quantityMatch) {
      return parseInt(quantityMatch[1])
    }
    
    // Leta efter siffror före produktnamnet
    const frontNumberMatch = name.match(/^[*\-+]*\s*(\d+)\s*\w/)
    if (frontNumberMatch) {
      return parseInt(frontNumberMatch[1])
    }
    
    return 1 // Standard kvantitet
  }

  cleanProductName(name) {
    return name.trim()
      .replace(/[^a-zA-ZåäöÅÄÖ\s\-]/g, '') // Ta bort konstiga tecken
      .replace(/\s+/g, ' ') // Normalisera mellanslag
      .trim()
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