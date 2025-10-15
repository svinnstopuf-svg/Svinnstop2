// Test den nya extraktion-logiken
import { extractProductsFromReceipt } from './src/receiptAnalysisTraining.js';

// Faktiska OCR-rader från kvittot
const ocrLines = [
  "ICA Supermarket Aptiten",
  "Avokado 25%19,90 39,80", 
  "Rabatt 3. avokado 2 för 35 -4,80",
  "Banan",
  "1 365 kg * 29,90 kr/kg 40,81", 
  "Gurka 2st15,00 30,00",
  "LakritsMix 39,90",
  "Plastkasse 4,00",
  "Svamp Champinjon",
  "0,410 kg * 79,90 kr/kg 32,76",
  "Totalt 182,47 kr"
];

console.log('=== TEST AV NY EXTRAKTION ===\n');

const extractedProducts = extractProductsFromReceipt(ocrLines);

console.log('\n=== EXTRAHERADE PRODUKTER ===');
extractedProducts.forEach((product, index) => {
  console.log(`${index + 1}. "${product.name}" - ${product.price ? product.price + ' kr' : 'inget pris'}`);
});

console.log(`\nTotalt: ${extractedProducts.length} produkter extraherade`);