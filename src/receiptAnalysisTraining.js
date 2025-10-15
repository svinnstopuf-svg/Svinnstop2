// Verkliga kvittostrukturer för att förbättra OCR-läsning
export const realReceiptPatterns = {
  // ICA-kvitton (mycket vanliga)
  ica: {
    storeName: /ICA\s+(MAXI|SUPERMARKET|KVANTUM|NÄRA)/i,
    productPatterns: [
      // Standard ICA-format: "PRODUKTNAMN    12.90" (blandat case OK)
      /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})\s{2,}(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
      // Med kvantitet: "BANANER KLASS 1  1.234 KG  15.90"
      /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-]{2,30})\s+\d+[.,]\d{3}\s*KG\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
      // Rabatt-format med asterisk: "*Lakritsmix ICA Basic  19.90"
      /^\*([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-]{2,30})\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
      // Utan pris: "BANAN KLASS 1"
      /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})$/i
    ],
    // Typiska ICA-produktnamn mönster
    namePatterns: [
      /^[A-ZÅÄÖ]+(\s+[A-ZÅÄÖ]+)*(\s+\d+[A-Z]*)?$/, // "MJÖLK ARLA 3%"
      /^[A-ZÅÄÖ]+\s+(KLASS\s+\d+|EKO|BIO)$/, // "BANANER KLASS 1"
      /^\*[A-ZÅÄÖ].*$/ // "*AVOKADO READY TO EAT"
    ]
  },

  // Coop-kvitton
  coop: {
    storeName: /COOP\s+(EXTRA|KONSUM|FORUM)/i,
    productPatterns: [
      // Coop blandat case: "Bananer Eko    8.90"
      /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})\s{2,}(\d+[.,]\d{2})(?:\s*kr)?\s*$/,
      // Med vikt: "Tomater kvist 0.456 kg 12.50"
      /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-]{2,30})\s+\d+[.,]\d{3}\s*kg\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/,
      // Enkel format: "Banan Fynd"
      /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})$/
    ]
  },

  // Willys-kvitton
  willys: {
    storeName: /WILLYS/i,
    productPatterns: [
      // Willys versaler: "BANAN EKO 1KG    12.90"
      /^([A-ZÅÄÖ][A-ZÅÄÖ\s\-0-9]{2,35})\s{2,}(\d+[.,]\d{2})\s*kr?\s*$/,
      // Med NET: "CITRON 500G NET    8.90"
      /^([A-ZÅÄÖ][A-ZÅÄÖ\s\-0-9]{2,30})\s+NET\s+(\d+[.,]\d{2})\s*kr?\s*$/,
      // Engelska namn: "BANANA ORGANIC 1KG............12.90"
      /^([A-Z][A-Z\s]{2,35})\.*(\d+[.,]\d{2})\s*kr?\s*$/
    ]
  },

  // Hemköp-kvitton
  hemkop: {
    storeName: /HEMKÖP/i,
    productPatterns: [
      // Hemköp blandat: "Äpplen Granny Smith 1kg  15.90"
      /^([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\s\-0-9]{2,35})\s{2,}(\d+[.,]\d{2})\s*kr?\s*$/,
      // Med symboler: "① Bananer Klass I"
      /^[①-⑳]\s*([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\s\-]{2,30})\s*(\d+[.,]\d{2})?\s*kr?\s*$/
    ]
  },

  // Lidl-kvitton
  lidl: {
    storeName: /LIDL/i,
    productPatterns: [
      // Lidl format: "Bio Bananer 1kg    12.90"
      /^([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\s\-0-9]{2,35})\s{2,}(\d+[.,]\d{2})\s*kr?\s*$/,
      // Med pil: "→ BIO BANANER 1KG"
      /^→\s*([A-ZÅÄÖ][A-ZÅÄÖ\s\-0-9]{2,30})\s*(\d+[.,]\d{2})?\s*kr?\s*$/
    ]
  },

  // City Gross-kvitton
  cityGross: {
    storeName: /CITY\s+GROSS/i,
    productPatterns: [
      // Med symbol: "◆ Bananer Chiquita 1kg 12,90"
      /^◆\s*([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\s\-0-9]{2,35})\s+(\d+[.,]\d{2})\s*kr?\s*$/,
      // Standard: "Bananer Chiquita 1kg    12.90"
      /^([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\s\-0-9]{2,35})\s{2,}(\d+[.,]\d{2})\s*kr?\s*$/
    ]
  }
}

// Förbättrade mönster för produktextraktion
export const advancedProductPatterns = [
  // Specifika mönster för OCR-utdatan vi ser
  {
    // "Avokado 25%19,90 39,80" - Produkt med procent och multipla priser
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s]{2,20})\s+\d+%\d+[.,]\d{2}\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },
  {
    // "Gurka 2st15,00 30,00" - Specifikt för Gurka med kvantitet och sammanklistrade priser
    pattern: /^(Gurka|gurka)\s+\d+st\d+[.,]\d{2}\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },
  {
    // Generellt mönster: "Produkt XstYY,ZZ AA,BB" 
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s]{2,20})\s+\d+st\d+[.,]\d{2}\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },
  {
    // "Gurka 2st 15,00 30,00" - Med mellanslag efter st
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s]{2,20})\s+\d+st\s+\d+[.,]\d{2}\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },
  {
    // "LakritsMix 39,90" - Enkelt produkt med pris
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s]{2,25})\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },
  {
    // "*Avokado 25%19,90 39,80" - Med asterisk
    pattern: /^\*\s*([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s]{2,20})\s+.*?(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },
  // Kvitton med symboler först (original)
  {
    pattern: /^([*\-+>@#&→▪•◆≫①-⑳])\s*([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})\s*(\d+[.,]\d{2})?(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      symbol: match[1],
      name: match[2].trim(),
      price: match[3] ? parseFloat(match[3].replace(',', '.')) : null
    })
  },

  // Kvitton med pris och prickar
  {
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})\.{3,}(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },

  // Standard kvittoformat med mellanslag
  {
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})\s{2,}(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },

  // Med kvantitet och vikt
  {
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-]{2,30})\s+\d+[.,]\d{3}\s*(kg|KG)\s+(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      unit: 'kg',
      price: parseFloat(match[3].replace(',', '.'))
    })
  },

  // Fallback för produkter med "st" som vi kanske missar
  {
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s]{2,15}).*?st.*?(\d+[.,]\d{2})(?:\s*kr)?\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.'))
    })
  },
  
  // Enkla produktnamn ("Banan", "Svamp Champinjon")
  {
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s]{1,30})\s*$/i,
    extract: (match) => {
      const name = match[1].trim()
      // Extra validering för enkla produktnamn
      if (name.length >= 3 && /^[A-Za-zÅÄÖåäö\s]+$/.test(name)) {
        return {
          name: name,
          price: null
        }
      }
      return null
    }
  },
  
  // Produkter utan pris (fallback)
  {
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-0-9]{2,35})\s*$/i,
    extract: (match) => ({
      name: match[1].trim(),
      price: null
    })
  },

  // Kommaseparerade listor: "Banan, Gurka, Avokado"
  {
    pattern: /^([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö\s\-,]{5,60})$/i,
    extract: (match) => {
      const text = match[1].trim()
      if (text.includes(',') && text.split(',').length <= 6) {
        return {
          isCommaList: true,
          items: text.split(',').map(item => ({ name: item.trim(), price: null }))
        }
      }
      return { name: text, price: null }
    }
  }
]

// Vanliga kvitto-störningar som ska ignoreras
export const receiptNoise = [
  // Kvittohuvud och sidfot
  /^(KVITTO|RECEIPT|BON|NOTA)$/i,
  /^(TACK|THANK\s+YOU|VÄLKOMMEN\s+ÅTER)$/i,
  /^(MOMSR\.|VAT|TVA).*$/i,
  /^(TOTALT?|TOTAL|SUM|SUMMA).*$/i,
  /^(ATT\s+BETALA|TO\s+PAY).*$/i,
  /^(KONTANT|CASH|KORT|CARD|SWISH).*$/i,
  /^(MOTTAGET|RECEIVED|PAYMENT).*$/i,
  /^(KONTOKORT|BANKKORT|DEBIT|CREDIT).*$/i,
  
  // Datum och tid
  /^\d{4}-\d{2}-\d{2}.*$/,
  /^\d{2}[\/\.\-]\d{2}[\/\.\-]\d{2,4}.*$/,
  /^\d{1,2}:\d{2}(:\d{2})?.*$/,
  
  // Referensnummer
  /^(REF|TRANS|KUTT|BELEG)[\s\.:]*\d+.*$/i,
  /^\d{4,}$/,
  
  // Streck och separatorer
  /^[\-=_*\+]{3,}$/,
  /^\s*[\-=_*\+\s]*\s*$/,
  
  // Butiksinformation
  /^(ORG\.?\s*NR|ORGANISATIONSNUMMER).*$/i,
  /^(ADRESS|ADDRESS).*$/i,
  /^(TELEFON|PHONE|TEL).*$/i,
  /^\d{3}\s*\d{2}\s*\d{5}$/, // Organisationsnummer
  
  // Kampanjer och erbjudanden
  /^(KAMPANJ|ERBJUDANDE|OFFER|RABATT).*$/i,
  /^(SPAR|SAVE|BONUS).*$/i,
  
  // ICA-specifika tjänster och bonusprogram
  /^(ICA\s+)?(KORT|STAMKUND|MEDLEM|MEMBER).*$/i,
  /^(ICA\s+)?(APTITEN|BANKEN|BANK|FÖRSÄKRING|INSURANCE).*$/i,
  /^(BONUSCHECK|BONUS\s+CHECK|KVITTOLOTTERI).*$/i,
  /^(KUNDKLUBB|CUSTOMER\s+CLUB).*$/i,
  
  // Bara siffror eller symboler
  /^\d+[.,]\d{2}\s*kr?\s*$/,
  /^[^A-ZÅÄÖa-zåäö]*$/
]

// Funktion för att identifiera butikstyp baserat på kvittotext
export function identifyStoreType(text) {
  const upperText = text.toUpperCase()
  
  for (const [storeKey, storeData] of Object.entries(realReceiptPatterns)) {
    if (storeData.storeName.test(upperText)) {
      return {
        type: storeKey,
        patterns: storeData.productPatterns,
        confidence: 'high'
      }
    }
  }
  
  // Fallback baserat på textmönster
  if (upperText.includes('MAXI') || upperText.includes('SUPERMARKET')) {
    return { type: 'ica', patterns: realReceiptPatterns.ica.productPatterns, confidence: 'medium' }
  }
  
  if (upperText.includes('EXTRA') || upperText.includes('KONSUM')) {
    return { type: 'coop', patterns: realReceiptPatterns.coop.productPatterns, confidence: 'medium' }
  }
  
  return { type: 'generic', patterns: advancedProductPatterns.map(p => p.pattern), confidence: 'low' }
}

// Förbättrad produktextraktion med butiksspecifik logik
export function extractProductsFromReceipt(receiptLines) {
  const allText = receiptLines.join('\n')
  const storeInfo = identifyStoreType(allText)
  
  
  const products = []
  const processedLines = new Set() // Undvik dubletter
  const skippedLines = [] // Håll reda på överhoppade rader
  
  for (let lineIndex = 0; lineIndex < receiptLines.length; lineIndex++) {
    const line = receiptLines[lineIndex].trim()
    
    if (!line) continue
    if (processedLines.has(line)) continue
    
    // Testa noise-filter
    const isNoise = receiptNoise.some(pattern => pattern.test(line))
    if (isNoise) {
      skippedLines.push({ line, reason: 'brus' })
      continue
    }
    
    // Testa butikspecifika mönster först
    let productFound = false
    
    if (storeInfo.type !== 'generic') {
      const storePatterns = realReceiptPatterns[storeInfo.type].productPatterns
      
      for (const pattern of storePatterns) {
        const match = line.match(pattern)
        if (match) {
          const product = extractProductFromMatch(match, pattern)
          if (product) {
            products.push(product)
            processedLines.add(line)
            productFound = true
            break
          }
        }
      }
    }
    
    // Om inget butikspecifikt mönster funkar, testa generiska
    if (!productFound) {
      for (const patternObj of advancedProductPatterns) {
        const match = line.match(patternObj.pattern)
        if (match) {
          const result = patternObj.extract(match)
          
          if (result.isCommaList) {
            // Hantera kommaseparerad lista
            result.items.forEach(item => {
              if (isValidProductName(item.name)) {
                products.push({
                  name: item.name,
                  price: item.price,
                  quantity: 1,
                  unit: 'st'
                })
              }
            })
          } else if (result.name && isValidProductName(result.name)) {
            products.push({
              name: result.name,
              price: result.price,
              quantity: 1,
              unit: result.unit || 'st'
            })
          }
          
          processedLines.add(line)
          productFound = true
          break
        }
      }
    }
  }
  
  
  return products
}

// Enkel validering av produktnamn
function isValidProductName(name) {
  if (!name || name.length < 2 || name.length > 50) return false
  
  const cleanName = name.toLowerCase().trim()
  
  // Måste innehålla minst 2 bokstäver
  const letterCount = (name.match(/[A-ZÅÄÖa-zåäö]/g) || []).length
  if (letterCount < 2) return false
  
  // Får inte bara vara ett pris
  if (/^\d+[.,]\d{2}$/.test(name.trim())) return false
  
  // Filter för betalningsrelaterade termer
  const paymentTerms = [
    'kort', 'card', 'kontokort', 'bankkort', 'mottaget', 'payment',
    'swish', 'kontant', 'cash', 'betalning', 'betalt', 'paid'
  ]
  
  if (paymentTerms.some(term => cleanName.includes(term))) {
    return false
  }
  
  // Filter för ICA-tjänster och bonusprogram (men INTE matvaror med ICA som varumärke)
  const icaServices = [
    'ica aptiten', 'ica banken', 'ica bank', 'ica försäkring', 'ica insurance',
    'ica stamkund', 'ica medlem', 'ica member', 'ica bonus', 'ica kvittolotteri', 'ica kundklubb'
  ]
  
  if (icaServices.some(service => cleanName.includes(service))) {
    return false
  }
  
  // Filter för kvittoinformation
  const receiptInfo = [
    'kvitto', 'receipt', 'organisationsnummer', 'org', 'telefon', 'phone',
    'adress', 'address', 'moms', 'vat', 'totalt', 'total', 'summa', 'sum'
  ]
  
  if (receiptInfo.some(info => cleanName.includes(info))) {
    return false
  }
  
  return true
}

// Hjälpfunktion för att extrahera produkt från regex-match
function extractProductFromMatch(match, pattern) {
  if (match.length >= 2) {
    const name = match[1].trim()
    const price = match[2] ? parseFloat(match[2].replace(',', '.')) : null
    
    if (isValidProductName(name)) {
      return {
        name: name,
        price: price,
        quantity: 1,
        unit: 'st'
      }
    }
  }
  return null
}