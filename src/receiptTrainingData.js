// Verkliga kvittodata för att träna AI:n att förstå kvittostrukturer
export const digitalReceiptExamples = [
  {
    store: "ICA Maxi",
    date: "2024-01-15",
    products: [
      "BANANER KLASS 1",
      "GURKA MINI 500G",
      "*AVOKADO READY TO EAT",
      "TOMAT KVIST 500G",
      "LAKRITSMIX 200G",
      "CHAMPINJONER 250G",
      "MJÖLK ARLA KO 3% 1L",
      "SMÖR BREGOTT 500G",
      "BRÖD POLAR LIMPA",
      "ÄPPLEN ROYAL GALA 1KG",
      "POTATIS FAST 2KG",
      "LÖKGUL 1KG NET",
      "MORÖTTER 1KG",
      "KÖTT FLÄSKFILÉ 400G",
      "KYCKLING HELFIL 500G",
      "OST HERRGÅRD 17% 500G",
      "PASTA BARILLA PENNE 500G",
      "RIS JASMIN 1KG",
      "OLJA ZETA OLIVOLJA 500ML"
    ]
  },
  {
    store: "Coop",
    date: "2024-02-03", 
    products: [
      "Banan Eko",
      "Paprika Röd 3-pack",
      "Sallad Iceberg",
      "Yoghurt Arla Naturell 1kg",
      "Grädde Vispgrädde 5dl",
      "Kött Nötfärs 500g",
      "Fisk Lax Färsk 300g",
      "Ägg Frigående 12-pack",
      "Juice Bravo Apelsin 1L",
      "Kaffe Gevalia Mellanrost",
      "Socker Dansukker 1kg",
      "Mjöl Kungsörnen Vetemjöl 2kg",
      "Tomat Krossad Felix 400g",
      "Pasta Garofalo Spagetti",
      "Olivolja Zeta Extra Virgin"
    ]
  },
  {
    store: "Willys",
    date: "2024-02-20",
    products: [
      "BANAN EKO 1KG",
      "CITRON 500G NET",
      "KIWI 6-PACK",
      "FILMJÖLK ARLA 3% 1L",
      "KVARG NATURELL 500G",
      "KORV FALUKORV SCAN 800G",
      "RÄKOR NORDSJÖ 300G",
      "BRÖD SKOGAHOLM LIMPA",
      "MÜSLI KELLOGGS 500G",
      "HONUNG SVENSK 500G",
      "GURKA MINI",
      "PAPRIKA GUL",
      "CHAMPINJON SKIVAD 250G",
      "LAXFILÉ FÄRSK 400G",
      "YOGHURT GREKISK 200G"
    ]
  },
  {
    store: "Hemköp", 
    date: "2024-03-01",
    products: [
      "Äpplen Granny Smith 1kg",
      "Blåbär Frysta 500g",
      "Spenat Baby 125g",
      "Rucola Färsk 80g",
      "Mjölk Laktosfri 3% 1L",
      "Ost Västerbotten 300g",
      "Smörgåsmargarin Flora 400g",
      "Kött Köttfärs Blandfärs 500g",
      "Kyckling Kycklingfilé 600g",
      "Fisk Torskfilé 400g",
      "Nudlar Ramen 5-pack",
      "Ris Basmati Uncle Bens 1kg",
      "Sås Sojasås Kikkoman",
      "Krydda Salladskrydda Santa Maria"
    ]
  },
  {
    store: "Lidl",
    date: "2024-03-15", 
    products: [
      "Bio Bananer 1kg",
      "Avocado Ready to Eat 2st",
      "Lime 4-pack",
      "Paprika Mix 500g",
      "Mjölkdryck Haver 1L",
      "Crème Fraiche 34% 2dl",
      "Köttbullar Frysta 1kg",
      "Kassler Rökt 300g",
      "Tunnbröd Polarbröd 4-pack",
      "Havregryn Stora 1.5kg",
      "Marmelad Jordgubb 450g",
      "Tomat Passerade 500g",
      "Bulgur 500g",
      "Linser Röda 500g"
    ]
  }
];

// Extrahera alla unika produktnamn för träning
export const trainingProductNames = digitalReceiptExamples
  .flatMap(receipt => receipt.products)
  .map(product => product.toLowerCase().trim());

// Vanliga kvittoformat och mönster
export const receiptPatterns = {
  // Kvantitetsformat som ofta förekommer
  quantities: [
    /\d+\s*kg/gi,         // "1 kg", "2kg"
    /\d+\s*g/gi,          // "500 g", "250g"
    /\d+\s*ml/gi,         // "500 ml", "1000ml"
    /\d+\s*l/gi,          // "1 l", "2L"
    /\d+\s*st/gi,         // "2 st", "12st"
    /\d+\s*pack/gi,       // "3-pack", "6 pack"
    /\d+\s*dl/gi,         // "5 dl", "3dl"
    /\d+\%/gi             // "3%", "17%"
  ],
  
  // Vanliga prefix som kan ignoreras/tas bort
  prefixes: [
    /^[\*\-\+\>\<\#\@\&]/,  // Symboler i början
    /^eko\s+/gi,             // "EKO "
    /^bio\s+/gi,             // "BIO "
    /^krav\s+/gi,            // "KRAV "
    /^\d+\s+/                // Nummer i början
  ],
  
  // Vanliga suffix som kan ignoreras
  suffixes: [
    /\s+klass\s+\d+$/gi,     // " KLASS 1"
    /\s+net$/gi,             // " NET"
    /\s+färsk$/gi,           // " FÄRSK"
    /\s+frysta?$/gi,         // " FRYSTA"
    /\s+eko$/gi              // " EKO"
  ],
  
  // Vanliga varumärken som förekommer på kvitton
  brands: [
    'arla', 'scan', 'felix', 'barilla', 'gevalia', 'kelloggs', 
    'bregott', 'flora', 'polar', 'skogaholm', 'zeta', 'garofalo',
    'bravo', 'kungsörnen', 'dansukker', 'kikkoman', 'uncle bens',
    'santa maria', 'nordsjö', 'marabou', 'fazer'
  ]
};

// Intelligenta rensningsregler baserat på kvittoanalys
export function cleanReceiptProductName(rawName) {
  let cleaned = rawName.toLowerCase().trim();
  
  // Ta bort vanliga prefix
  receiptPatterns.prefixes.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Ta bort vanliga suffix
  receiptPatterns.suffixes.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Ta bort kvantiteter (men behåll produktnamnet)
  receiptPatterns.quantities.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Normalisera mellanslag
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Analysera om ett produktnamn liknar de i träningsdatan
export function analyzeAgainstTrainingData(productName) {
  const cleanedName = cleanReceiptProductName(productName);
  const words = cleanedName.split(/\s+/);
  
  let confidence = 0;
  let matches = [];
  
  // Kolla mot träningsdata
  for (const trainingProduct of trainingProductNames) {
    const trainingCleaned = cleanReceiptProductName(trainingProduct);
    const trainingWords = trainingCleaned.split(/\s+/);
    
    // Direktmatch
    if (cleanedName === trainingCleaned) {
      return { confidence: 1.0, matches: [trainingProduct], reason: 'exact_match' };
    }
    
    // Partiell ordmatch
    const matchingWords = words.filter(word => 
      word.length > 2 && trainingWords.some(tw => 
        tw.includes(word) || word.includes(tw)
      )
    );
    
    if (matchingWords.length > 0) {
      const wordConfidence = matchingWords.length / Math.max(words.length, trainingWords.length);
      if (wordConfidence > confidence) {
        confidence = wordConfidence;
        matches = [trainingProduct];
      }
    }
  }
  
  // Kolla mot kända varumärken
  const brandMatch = receiptPatterns.brands.find(brand => 
    cleanedName.includes(brand)
  );
  
  if (brandMatch) {
    confidence = Math.max(confidence, 0.7);
    matches.push(`brand:${brandMatch}`);
  }
  
  return {
    confidence,
    matches,
    cleanedName,
    reason: confidence > 0.5 ? 'training_match' : confidence > 0.3 ? 'weak_match' : 'no_match'
  };
}