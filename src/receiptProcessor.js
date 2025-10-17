import { createWorker } from 'tesseract.js'
import { analyzeAgainstTrainingData, cleanReceiptProductName } from './receiptTrainingData.js'
import { extractProductsFromReceipt, identifyStoreType } from './receiptAnalysisTraining.js'
import { STRICT_FOOD_VALIDATOR } from './comprehensiveFoodDatabase.js'

// Kvitto-processor som använder OCR för att läsa produkter från kvitton
export class ReceiptProcessor {
  constructor() {
    this.worker = null
    this.debugMode = false // Debug avstängt för produktion
  }


  async initialize() {
    if (this.worker) return

    this.worker = await createWorker()
    await this.worker.loadLanguage('swe+eng') // Svenska och engelska
    await this.worker.initialize('swe+eng')
    
  // Balanserade OCR-inställningar för både hastighet och kvalitet
    await this.worker.setParameters({
      // Grundläggande inställningar - optimerade för bättre läsbarhet
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-€kr%*/() ',
      tessedit_pageseg_mode: 6, // Uniform text block - bäst för kvitton
      tessedit_ocr_engine_mode: 1, // LSTM + Legacy hybrid
      preserve_interword_spaces: 1,
      
      // Förbättrad igenkänning utan överoptimering
      classify_enable_learning: 1,
      classify_enable_adaptive_matcher: 1,
      
      // Behåll viktiga ordböcker för bättre ordförståelse
      load_punc_dawg: 1, // Interpunktion
      load_number_dawg: 1, // Siffror och priser
      load_system_dawg: 1, // Systemordbok för vanliga ord - AKTIVERAD för bättre igenkänning
      load_freq_dawg: 1, // Frekvensordbok för svenska ord - AKTIVERAD
      
      // Mindre aggressiv brushantering för bättre ordläsning
      textord_noise_sizelimit: 1.0, // Mindre aggressiv brusreducering
      textord_noise_normratio: 2.0,
      textord_min_linesize: 1.0, // Standard storlek för text
      
      // Standardinställningar för bättre stabilitet
      tesseract_minimum_word_size: 2, // Kräv minst 2 tecken för ord
      
      // Deaktivera onödiga debug-funktioner
      tessedit_create_hocr: 0,
      tessedit_create_tsv: 0,
      tessedit_dump_pageseg_images: 0
    })
    
  }

  async processReceipt(imageElement) {
    try {
      await this.initialize()
      
      console.log('📄 Startar MULTI-PASS kvittoscanning...')
      
      // Använd alltid multi-pass strategi för bästa resultat
      return await this.processReceiptMultiPass(imageElement)
        
    } catch (error) {
      console.error('OCR misslyckades:', error)
      return []
    }
  }
  
  // NY MULTI-PASS STRATEGI
  async processReceiptMultiPass(imageElement) {
    console.log('🎯 MULTI-PASS: Startar intelligent kvittoscanning...')
    
    const imageHeight = imageElement.naturalHeight || imageElement.height
    const imageWidth = imageElement.naturalWidth || imageElement.width
    
    console.log(`📏 Kvittostorlek: ${imageWidth}x${imageHeight}`)
    
    // PASS 1: Förbehandla och identifiera produktområdet
    console.log('🔍 PASS 1: Identifierar produktområdet...')
    const preprocessedImage = this.preprocessImage(imageElement, 'standard')
    const productRegion = this.identifyProductRegion(preprocessedImage)
    
    // PASS 2: Extrahera produkter med optimal OCR
    console.log('📝 PASS 2: Extraherar produkter...')
    const allProductLines = await this.extractProductLines(productRegion || preprocessedImage)
    
    // PASS 3: Validera och rensa produkter
    console.log('🧠 PASS 3: Validerar mot matvarudatabas...')
    const validFoodProducts = this.validateAndCleanProducts(allProductLines)
    
    console.log(`✅ MULTI-PASS KLAR: ${validFoodProducts.length} giltiga matvaror funna`)
    return validFoodProducts
  }
  
  // PASS 1: Identifiera produktområdet (skippa header/footer)
  identifyProductRegion(canvas) {
    console.log('🎯 Letar efter produktområdet i kvittot...')
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    // Skippa övre 15% (butiknamn, datum) och nedre 20% (totalsumma, betalning)
    const skipTop = Math.floor(height * 0.15)
    const skipBottom = Math.floor(height * 0.20)
    const productHeight = height - skipTop - skipBottom
    
    if (productHeight <= 0) {
      console.log('⚠️ För litet område - använder hela bilden')
      return canvas
    }
    
    // Skapa ny canvas med bara produktområdet
    const productCanvas = document.createElement('canvas')
    const productCtx = productCanvas.getContext('2d')
    
    productCanvas.width = width
    productCanvas.height = productHeight
    
    productCtx.drawImage(canvas, 0, -skipTop)
    
    console.log(`✂️ Produktområde: ${width}x${productHeight} (skippa topp: ${skipTop}px, botten: ${skipBottom}px)`)
    return productCanvas
  }
  
  // PASS 2: Extrahera produktrader med strukturmedvetenhet
  async extractProductLines(canvas) {
    console.log('🗺 Extraherar produktrader med strukturanalys...')
    
    // Enkel OCR med fokus på hastighet
    const { data: { text } } = await this.worker.recognize(canvas, {
      tessedit_pageseg_mode: 6, // Uniform text block
      tessedit_ocr_engine_mode: 1,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-€kr%() '
    })
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2)
    console.log(`📝 Hittade ${lines.length} textrader`)
    
    // Analysera radstruktur: leta efter mönster som "Produktnamn ... Pris"
    const productLines = []
    
    for (const line of lines) {
      if (this.looksLikeProductLine(line)) {
        productLines.push(line)
      }
    }
    
    console.log(`📦 ${productLines.length} rader ser ut som produkter`)
    return productLines
  }
  
  // Kontrollera om en rad ser ut som en produktrad
  looksLikeProductLine(line) {
    // Måste ha både text och pris för att vara en produktrad
    const hasPrice = /\d+[.,]\d{2}\s*(kr|:-|$)/i.test(line)
    const hasText = /[a-zåäö]{2,}/i.test(line)
    const isNotHeader = !/^[A-ZÅÄÖ\s]{5,}$/i.test(line) // Inte bara stora bokstäver
    const isNotTotal = !/^(summa|total|att betala|kort|kontant)/i.test(line)
    
    return hasPrice && hasText && isNotHeader && isNotTotal
  }
  
  // PASS 3: Validera produkter mot matvarudatabas
  validateAndCleanProducts(productLines) {
    console.log(`🧠 Validerar ${productLines.length} produktrader...`)
    
    const validProducts = []
    
    for (const line of productLines) {
      // Extrahera produktnamn (ta bort pris och kvantitet)
      const cleanedName = this.extractCoreProductName(line)
      
      if (!cleanedName || cleanedName.length < 2) continue
      
      // Kontrollera om det definitivt INTE är mat
      if (this.isDefinitelyNotFood(line)) {
        console.log(`🚫 Skippar icke-mat: "${line}"`)
        continue
      }
      
      // Validera mot matvarudatabas
      const isValidFood = STRICT_FOOD_VALIDATOR.isValidFoodProduct(cleanedName)
      
      if (isValidFood) {
        const product = {
          name: cleanedName,
          originalName: line,
          quantity: this.extractQuantityFromName(line),
          unit: this.guessUnit(line),
          price: this.extractPrice(line)
        }
        
        validProducts.push(product)
        console.log(`✅ GILTIG MAT: "${cleanedName}"`)
      } else {
        console.log(`❌ AVVISAD: "${cleanedName}" finns inte i matdatabasen`)
      }
    }
    
    return validProducts
  }
  
  // Extrahera pris från produktrad
  extractPrice(line) {
    const priceMatch = line.match(/(\d+[.,]\d{2})\s*(kr|:-|$)/i)
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(',', '.'))
    }
    return null
  }
  
  // Standard OCR för normala kvitton
  async processStandardReceipt(imageElement) {
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
      
      try {
        // Sätt olika OCR-parametrar för varje version
        await this.setOCRParameters(i)
        
        const startTime = Date.now()
        const { data: { text } } = await this.worker.recognize(version.image)
        const endTime = Date.now()
        
        console.log(`⚙️ OCR ${version.name}: ${Math.round(endTime - startTime)}ms`)
        
        // Extrahera produkter
        const products = this.parseReceiptText(text, version.name)
        
        allResults.push({
          version: version.name,
          text: text,
          products: products,
          score: this.scoreResult(text, products)
        })
        
        console.log(`📋 ${version.name}: ${products.length} produkter, poäng: ${allResults[allResults.length - 1].score}`)
        
      } catch (error) {
        console.error(`OCR ${version.name} misslyckades:`, error)
        allResults.push({ version: version.name, products: [], score: 0 })
      }
    }
    
    // Välj bästa resultatet baserat på poäng
    allResults.sort((a, b) => b.score - a.score)
    const bestResult = allResults[0]
    
    console.log(`🏆 Bäst resultat: ${bestResult.version} med ${bestResult.products.length} produkter`)
    return bestResult.products
  }
  
  // Segmenterad bearbetning för långa kvitton (40-100+ produkter)
  async processLongReceiptSegmented(imageElement) {
    console.log('🚀 Startar segmenterad bearbetning för långt kvitto...')
    
    // Förbehandla hela bilden först
    const preprocessedImage = this.preprocessImage(imageElement, 'standard')
    
    // Segmentera i överlappande delar
    const segments = this.segmentLongReceipt(preprocessedImage)
    console.log(`🔪 Kvitto uppdelat i ${segments.length} segment`)
    
    const allProducts = []
    
    // Bearbeta varje segment
    for (let i = 0; i < segments.length; i++) {
      console.log(`🔍 Bearbetar segment ${i + 1}/${segments.length}...`)
      
      try {
        // Använd bästa OCR-inställningar för segmentet
        await this.setOCRParameters(0) // Precision-läge
        
        const { data: { text } } = await this.worker.recognize(segments[i])
        
        if (text && text.trim().length > 10) {
          const segmentProducts = this.parseReceiptText(text, `Segment-${i + 1}`)
          console.log(`📊 Segment ${i + 1}: ${segmentProducts.length} produkter`)
          allProducts.push(...segmentProducts)
        }
        
      } catch (error) {
        console.error(`❌ Segment ${i + 1} misslyckades:`, error)
      }
    }
    
    // Intelligent deduplicering för överlappande segment
    const uniqueProducts = this.deduplicateProducts(allProducts)
    
    console.log(`✨ Långt kvitto klart: ${allProducts.length} → ${uniqueProducts.length} unika produkter`)
    return uniqueProducts
  }
  
  // Segmentera långa kvitton i hanterbara delar
  segmentLongReceipt(canvas) {
    const segments = []
    const maxSegmentHeight = 1800 // Optimal storlek för OCR
    const overlapHeight = 400 // Stort överlapp för att inte missa produkter
    
    if (canvas.height <= maxSegmentHeight) {
      return [canvas] // Kort kvitto - returnera som det är
    }
    
    let y = 0
    let segmentIndex = 0
    
    while (y < canvas.height) {
      const segmentCanvas = document.createElement('canvas')
      const segmentCtx = segmentCanvas.getContext('2d')
      
      const segmentHeight = Math.min(maxSegmentHeight, canvas.height - y)
      segmentCanvas.width = canvas.width
      segmentCanvas.height = segmentHeight
      
      // Kopiera segment från förbehandlad bild
      segmentCtx.drawImage(canvas, 0, y, canvas.width, segmentHeight, 0, 0, canvas.width, segmentHeight)
      
      segments.push(segmentCanvas)
      console.log(`📌 Segment ${segmentIndex + 1}: y=${y}, höjd=${segmentHeight}px`)
      
      // Nästa segment med överlappning
      y += maxSegmentHeight - overlapHeight
      segmentIndex++
      
      // Säkerhetsspärr för extremt långa kvitton
      if (segmentIndex > 20) {
        console.log('⚠️ Extremt långt kvitto - begränsar till 20 segment för prestanda')
        break
      }
      
      // Avbryt om vi nått slutet
      if (y >= canvas.height - 100) break
    }
    
    return segments
  }
  
  // Intelligent deduplicering för segment-överlappningar
  deduplicateProducts(allProducts) {
    const uniqueProducts = []
    const seenProducts = new Set()
    
    for (const product of allProducts) {
      // Skapa unik nyckel baserad på produktnamn och pris
      const normalizedName = product.name.toLowerCase().trim().replace(/\s+/g, ' ')
      const key = `${normalizedName}_${product.price || 0}_${product.unit || 'st'}`
      
      if (!seenProducts.has(key)) {
        seenProducts.add(key)
        uniqueProducts.push(product)
      }
    }
    
    return uniqueProducts
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

  // Förbättrat poängsättningssystem - optimerat för både korta och långa kvitton
  scoreResult(text, products) {
    let score = 0
    const lowerText = text.toLowerCase()
    
    // Poäng för antal produkter (skalat för långa kvitton)
    const productCount = products.length
    if (productCount > 20) {
      // Långa kvitton - mindre poäng per produkt men bonus för många produkter
      score += productCount * 8 + Math.min((productCount - 20) * 2, 100)
    } else {
      // Normala kvitton - standard poäng
      score += productCount * 12
    }
    
    // Poäng för textlängd (mer text = mer information) - skalat för långa kvitton
    const textLengthScore = Math.min(text.length / 15, text.length > 5000 ? 80 : 50)
    score += textLengthScore
    
    // Utökad lista med svenska matvaruord för bättre poängsättning
    const foodWords = [
      // Vanliga svenska matvaror
      'banan', 'svamp', 'champinjon', 'gurka', 'avokado', 'lakrits', 'bröd', 'mjölk', 'ost', 'kött',
      // Tillägg för bättre täckning
      'tomat', 'potatis', 'lök', 'morot', 'sallad', 'paprika', 'äpple', 'päron', 'citron', 'apelsin',
      'kyckling', 'fisk', 'ris', 'pasta', 'juice', 'yoghurt', 'smör', 'grädde', 'ägg', 'korv',
      'broccoli', 'blomkål', 'spenat', 'rucola', 'dill', 'persilja', 'vitlök', 'ingefära',
      // Vanliga ICA-varumärken
      'basic', 'selection', 'i love eco', 'garant', 'eldorado'
    ]
    
    let foodWordCount = 0
    foodWords.forEach(word => {
      if (lowerText.includes(word)) {
        foodWordCount++
        score += 6
      }
    })
    
    // Poäng för prisformat - förbättrat för svenska kvitton
    const pricePatterns = [
      /\d+[.,]\d{2}\s*kr/gi,           // "12.50 kr" eller "12,50kr"
      /\d+[.,]\d{2}\s*:-/gi,           // "12.50:-" (vanligt på kvitton)
      /\d+[.,]\d{2}\s*$/gm             // Pris i slutet av rad
    ]
    
    let totalPriceMatches = 0
    pricePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) totalPriceMatches += matches.length
    })
    
    score += totalPriceMatches * 4
    
    // Bonus för kvitton med bra förhållande mellan produkter och priser
    if (totalPriceMatches > 0 && productCount > 0) {
      const priceToProductRatio = totalPriceMatches / productCount
      if (priceToProductRatio >= 0.7 && priceToProductRatio <= 1.5) {
        score += 20 // Bonus för realistisk pris/produkt-kvot
      }
    }
    
    // Extra bonus för kvitton med många matvareindikatorer
    if (foodWordCount > 5) {
      score += Math.min((foodWordCount - 5) * 3, 30)
    }
    
    // Poäng för svenska kvittoindikatorer
    const receiptIndicators = ['ica', 'coop', 'willys', 'hemköp', 'maxi', 'kvantum', 'supermarket']
    receiptIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) score += 15
    })
    
    console.log(`🏆 Poängsättning: ${productCount} produkter, ${totalPriceMatches} priser, ${foodWordCount} matord → ${score} poäng`)
    return score
  }

  // ENKEL och SNABB bildbehandling optimerad för multi-pass strategi
  preprocessImage(imageElement, mode = 'standard') {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    const originalWidth = imageElement.naturalWidth || imageElement.width
    const originalHeight = imageElement.naturalHeight || imageElement.height
    
    // Balanserad skalning för hastighet och kvalitet
    const scale = originalHeight > 3000 ? 2.0 : originalHeight > 1500 ? 2.5 : 3.0
    
    canvas.width = originalWidth * scale
    canvas.height = originalHeight * scale
    
    console.log(`🔍 Snabb bildförbättring: ${originalWidth}x${originalHeight} → ${canvas.width}x${canvas.height} (${scale}x)`)
    
    // Hantverksskillnad för bästa kvalitet vid uppskalning
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Enkel men effektiv bildbehandling
    let avgBrightness = 0
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      avgBrightness += gray
    }
    avgBrightness /= (data.length / 4)
    
    // Minimal bearbetning för hastighet
    const needsEnhancement = avgBrightness < 130
    if (needsEnhancement) {
      console.log('💡 Tillämpar ljusförbättring...')
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        const enhanced = Math.min(255, gray * 1.2) // Enkel ljusförstärkning
        data[i] = data[i + 1] = data[i + 2] = enhanced
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    console.log('✨ Snabb bildbehandling klar')
    return canvas
  }
  
  // GAUSSIAN BLUR - Reducerar brus utan att förstora text för mycket
  applyGaussianBlur(data, width, height, sigma) {
    const kernel = this.createGaussianKernel(sigma)
    const kernelSize = kernel.length
    const radius = Math.floor(kernelSize / 2)
    const original = new Uint8ClampedArray(data)
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const i = (y * width + x) * 4
        let r = 0, g = 0, b = 0
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pi = ((y + ky - radius) * width + (x + kx - radius)) * 4
            const weight = kernel[ky][kx]
            r += original[pi] * weight
            g += original[pi + 1] * weight
            b += original[pi + 2] * weight
          }
        }
        
        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
      }
    }
  }
  
  // UNSHARP MASKING - Skärper text genom att subtrahera blänkad version
  applyUnsharpMask(data, width, height, amount, radius, threshold) {
    const original = new Uint8ClampedArray(data)
    const blurred = new Uint8ClampedArray(data)
    
    // Skapa blänkad version
    this.applyGaussianBlur(blurred, width, height, radius)
    
    // Unsharp mask: Original + Amount * (Original - Blurred)
    for (let i = 0; i < data.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) {
        const diff = original[i + channel] - blurred[i + channel]
        if (Math.abs(diff) >= threshold) {
          data[i + channel] = Math.max(0, Math.min(255, original[i + channel] + amount * diff))
        }
      }
    }
  }
  
  // CLAHE (Contrast Limited Adaptive Histogram Equalization) - Förbättrar lokal kontrast
  applyCLAHE(data, width, height) {
    const tileSize = 64 // Storlek på lokala områden
    const clipLimit = 3.0 // Begränsa förbättringen
    
    for (let ty = 0; ty < height; ty += tileSize) {
      for (let tx = 0; tx < width; tx += tileSize) {
        const endY = Math.min(ty + tileSize, height)
        const endX = Math.min(tx + tileSize, width)
        
        // Skapa histogram för denna tile
        const hist = new Array(256).fill(0)
        const pixelCount = (endY - ty) * (endX - tx)
        
        for (let y = ty; y < endY; y++) {
          for (let x = tx; x < endX; x++) {
            const i = (y * width + x) * 4
            const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
            hist[gray]++
          }
        }
        
        // Clip histogram
        const clipValue = (pixelCount * clipLimit) / 256
        let redistributed = 0
        for (let i = 0; i < 256; i++) {
          if (hist[i] > clipValue) {
            redistributed += hist[i] - clipValue
            hist[i] = clipValue
          }
        }
        
        // Redistribuera klippta värden jämnt
        const redistPerBin = redistributed / 256
        for (let i = 0; i < 256; i++) {
          hist[i] += redistPerBin
        }
        
        // Skapa CDF (Cumulative Distribution Function)
        const cdf = new Array(256)
        cdf[0] = hist[0]
        for (let i = 1; i < 256; i++) {
          cdf[i] = cdf[i - 1] + hist[i]
        }
        
        // Normalisera CDF
        for (let i = 0; i < 256; i++) {
          cdf[i] = (cdf[i] * 255) / pixelCount
        }
        
        // Tillämpa histogram equalization på tile
        for (let y = ty; y < endY; y++) {
          for (let x = tx; x < endX; x++) {
            const i = (y * width + x) * 4
            const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
            const enhanced = Math.round(cdf[gray])
            data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, enhanced))
          }
        }
      }
    }
  }
  
  // AVANCERAD KONTRAST - För hög kontrast-läge
  applyAdvancedContrast(data, width, height, isLowLight, isLowContrast) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      
      let enhanced
      if (isLowLight && isLowContrast) {
        // Extremt aggressiv förbättring
        enhanced = gray < 128 ? gray * 0.6 : Math.min(255, 128 + (gray - 128) * 2.0)
      } else if (isLowLight) {
        // Ljusförbättring
        enhanced = Math.min(255, gray * 1.4)
      } else if (isLowContrast) {
        // Kontrastförbättring
        enhanced = gray < 128 ? gray * 0.8 : 128 + (gray - 128) * 1.3
      } else {
        // Standard förbättring
        enhanced = gray < 128 ? gray * 0.9 : 128 + (gray - 128) * 1.1
      }
      
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, enhanced))
    }
  }
  
  // MORPHOLOGICAL FILTERING - Rengör text genom erosion/dilation
  applyMorphologicalFiltering(data, width, height, mode) {
    const kernel = mode === 'text_enhancement' ? 
      [[0, 1, 0], [1, 1, 1], [0, 1, 0]] : // Kors för textförbättring
      [[1, 1, 1], [1, 1, 1], [1, 1, 1]]   // 3x3 för brusreducering
    
    const temp = new Uint8ClampedArray(data)
    const kernelRadius = 1
    
    // Erosion följt av dilation (Opening)
    // Erosion
    for (let y = kernelRadius; y < height - kernelRadius; y++) {
      for (let x = kernelRadius; x < width - kernelRadius; x++) {
        const i = (y * width + x) * 4
        let minVal = 255
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            if (kernel[ky][kx]) {
              const pi = ((y + ky - kernelRadius) * width + (x + kx - kernelRadius)) * 4
              const gray = data[pi] * 0.299 + data[pi + 1] * 0.587 + data[pi + 2] * 0.114
              minVal = Math.min(minVal, gray)
            }
          }
        }
        
        temp[i] = temp[i + 1] = temp[i + 2] = minVal
      }
    }
    
    // Dilation
    for (let y = kernelRadius; y < height - kernelRadius; y++) {
      for (let x = kernelRadius; x < width - kernelRadius; x++) {
        const i = (y * width + x) * 4
        let maxVal = 0
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            if (kernel[ky][kx]) {
              const pi = ((y + ky - kernelRadius) * width + (x + kx - kernelRadius)) * 4
              const gray = temp[pi] * 0.299 + temp[pi + 1] * 0.587 + temp[pi + 2] * 0.114
              maxVal = Math.max(maxVal, gray)
            }
          }
        }
        
        data[i] = data[i + 1] = data[i + 2] = maxVal
      }
    }
  }
  
  // MJUK FÖRBÄTTRING - För soft-läge
  applyGentleEnhancement(data, width, height, avgBrightness) {
    const factor = avgBrightness < 100 ? 1.15 : avgBrightness < 150 ? 1.08 : 1.02
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const enhanced = gray * factor
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, enhanced))
    }
  }
  
  // ADAPTIV FÖRBÄTTRING - För standard-läge
  applyAdaptiveEnhancement(data, width, height, avgBrightness, contrast, isLowLight, isLowContrast) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      
      let enhanced = gray
      
      // Ljuskorrigering
      if (isLowLight) {
        enhanced *= 1.2
      }
      
      // Kontrastkorrigering
      if (isLowContrast) {
        enhanced = gray < 128 ? gray * 0.85 : 128 + (gray - 128) * 1.15
      }
      
      // Gamma-korrigering för olika ljusförhållanden
      const gamma = avgBrightness < 100 ? 0.8 : avgBrightness > 180 ? 1.2 : 1.0
      if (gamma !== 1.0) {
        enhanced = 255 * Math.pow(enhanced / 255, 1 / gamma)
      }
      
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, enhanced))
    }
  }
  
  // BILATERAL FILTER - Kant-bevarande mjukning
  applyBilateralFilter(data, width, height) {
    const original = new Uint8ClampedArray(data)
    const spatialSigma = 2.0
    const intensitySigma = 20.0
    const radius = 3
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const i = (y * width + x) * 4
        const centerGray = original[i] * 0.299 + original[i + 1] * 0.587 + original[i + 2] * 0.114
        
        let sumR = 0, sumG = 0, sumB = 0, weightSum = 0
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ni = ((y + dy) * width + (x + dx)) * 4
            const neighborGray = original[ni] * 0.299 + original[ni + 1] * 0.587 + original[ni + 2] * 0.114
            
            const spatialDist = Math.sqrt(dx * dx + dy * dy)
            const intensityDist = Math.abs(centerGray - neighborGray)
            
            const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * spatialSigma * spatialSigma))
            const intensityWeight = Math.exp(-(intensityDist * intensityDist) / (2 * intensitySigma * intensitySigma))
            const weight = spatialWeight * intensityWeight
            
            sumR += original[ni] * weight
            sumG += original[ni + 1] * weight
            sumB += original[ni + 2] * weight
            weightSum += weight
          }
        }
        
        data[i] = Math.max(0, Math.min(255, sumR / weightSum))
        data[i + 1] = Math.max(0, Math.min(255, sumG / weightSum))
        data[i + 2] = Math.max(0, Math.min(255, sumB / weightSum))
      }
    }
  }
  
  // GAUSSIAN KERNEL - Hjälpfunktion
  createGaussianKernel(sigma) {
    const size = Math.ceil(6 * sigma) | 1 // Säkerställ udda storlek
    const kernel = []
    const center = Math.floor(size / 2)
    let sum = 0
    
    for (let y = 0; y < size; y++) {
      kernel[y] = []
      for (let x = 0; x < size; x++) {
        const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2)
        const value = Math.exp(-(distance ** 2) / (2 * sigma ** 2))
        kernel[y][x] = value
        sum += value
      }
    }
    
    // Normalisera
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum
      }
    }
    
    return kernel
  }

  parseReceiptText(text, version = 'unknown') {
    const allLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const extractedProducts = extractProductsFromReceipt(allLines)
    
    
    const products = []
    
    for (const product of extractedProducts) {
      // Rensa produktnamn och extrahera kärnan
      const cleanedName = this.extractCoreProductName(product.name)
      const originalName = product.name
      
      // STRIKT validering mot omfattande matvarudatabas - som en människa skulle göra
      console.log(`🔍 Validerar: "${cleanedName}" (original: "${originalName}")`)
      
      // Först: kontrollera om det definitivt INTE är mat (kvittobrus, betalningsinfo, etc.)
      const isDefinitelyNotFood = this.isDefinitelyNotFood(originalName)
      
      if (isDefinitelyNotFood) {
        console.log(`🚫 Definitivt inte mat: "${originalName}"`)
        continue // Hoppa över icke-matvaror
      }
      
      // HUVUDVALIDERING: Strikt kontroll mot omfattande matvarudatabas
      const isValidFood = STRICT_FOOD_VALIDATOR.isValidFoodProduct(cleanedName)
      
      if (isValidFood) {
        // Produkten finns i vår omfattande matvarudatabas - lägg till den
        const standardProduct = {
          name: cleanedName, // Använd det rensade namnet
          originalName: originalName, // Behåll originalet för debugging
          quantity: product.quantity || this.extractQuantityFromName(originalName),
          unit: product.unit || this.guessUnit(originalName),
          price: product.price
        }
        products.push(standardProduct)
        console.log(`✅ GODKÄND MATVARA: "${cleanedName}" lagd till`)
      } else {
        console.log(`❌ AVVISAD: "${cleanedName}" finns inte i matvarudatabasen`)
      }
    }
    
    
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
  
  // UTVIDGAD säkerhetskontroll för att identifiera definitivt INTE matvaror
  isDefinitelyNotFood(productName) {
    if (!productName) return true
    
    const name = productName.toLowerCase().trim()
    
    // Betalningsrelaterat
    const paymentKeywords = [
      'mottaget', 'kontokort', 'bankkort', 'kort', 'card', 'swish', 'kontant', 'cash',
      'betalning', 'payment', 'betalt', 'paid', 'kredit', 'debit', 'visa', 'mastercard'
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
      'kampanj', 'erbjudande', 'rabatt', 'spar', 'bonus', 'save', 'offer',
      'rea', 'sale', 'extrapris', 'medlem pris'
    ]
    
    // Icke-matvaror som ofta finns på kvitton
    const nonFoodItems = [
      'påse', 'plastpåse', 'kasse', 'bärare', 'papperspåse', 'shopping bag',
      'diskmedel', 'tvättmedel', 'städ', 'rengöring', 'kemikalie', 'spray',
      'tandk räm', 'tandborste', 'schampo', 'tvål', 'deodorant', 'shampoo',
      'batterier', 'glödlampa', 'tidning', 'magasin', 'present', 'gåva',
      'blommor', 'växt', 'leksak', 'cigaretter', 'tobak', 'lighter',
      'verktyg', 'skruv', 'spik', 'järn', 'plast', 'metall', 'elektronik',
      'parfym', 'kosmetika', 'nagellack', 'smink', 'mascara', 'läppstift',
      'kondomer', 'preventivmedel', 'medicin', 'vit min', 'supplement',
      'folie', 'plastfolie', 'bakpapper', 'servetter', 'toalettpapper',
      'köksrullar', 'disktrasa', 'tvättlappar'
    ]
    
    const allKeywords = [...paymentKeywords, ...serviceKeywords, ...receiptKeywords, ...promotionKeywords, ...nonFoodItems]
    
    // Kolla om något nyckelord finns i produktnamnet
    if (allKeywords.some(keyword => name.includes(keyword))) {
      return true
    }
    
    // Kolla för bara siffror eller organisationsnummer-liknande
    if (/^\d{3}\s*\d{2}\s*\d{5}$/.test(name)) return true // Organisationsnummer
    if (/^\d{4,}$/.test(name)) return true // Långa siffror
    if (/^\d+[.,]\d{2}\s*kr?$/.test(name)) return true // Bara priser
    if (/^ref[\s.]*\d+/i.test(name)) return true // Referensnummer
    
    // Kolla för för korta eller konstiga strängar
    if (name.length < 2) return true
    if (/^[^a-zåäö]*$/.test(name)) return true // Ingen bokstav alls
    if (/^[-=_*+]{2,}$/.test(name)) return true // Bara symboler
    
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
  
  // Använd bara den ursprungliga metoden som fungerade
  return await receiptProcessor.processReceipt(imageElement)
}

// Fallback till standard-metod om robust misslyckas
export async function processReceiptImageStandard(imageElement) {
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