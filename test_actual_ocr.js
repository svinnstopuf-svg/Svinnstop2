// Test med de faktiska OCR-resultaten från bilden
import { ReceiptProcessor } from './src/receiptProcessor.js';

const processor = new ReceiptProcessor();

// Faktiska OCR-resultat från bilden
const actualOCRProducts = [
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

console.log('=== TEST MED FAKTISKA OCR-RESULTAT ===\n');

for (const productName of actualOCRProducts) {
  console.log(`\n🔍 Analyserar: "${productName}"`);
  
  // Steg 1: Kolla om det är definitivt INTE mat
  const isDefinitelyNotFood = processor.isDefinitelyNotFood(productName);
  console.log(`   Definitivt INTE mat: ${isDefinitelyNotFood}`);
  
  if (isDefinitelyNotFood) {
    console.log(`   ❌ AVVISAD: ${productName} (definitivt inte mat)`);
    continue;
  }
  
  // Steg 2: Rensa produktnamnet  
  const cleaned = processor.extractCoreProductName(productName);
  console.log(`   Rensat namn: "${cleaned}"`);
  
  if (cleaned.length < 2) {
    console.log(`   ❌ AVVISAD: För kort rensat namn`);
    continue;
  }
  
  // Steg 3: Testa AI food detection
  const isFood = processor.isLikelyFoodProduct(cleaned);
  console.log(`   AI food detection: ${isFood}`);
  
  if (isFood) {
    console.log(`   ✅ GODKÄND: "${productName}" → "${cleaned}"`);
  } else {
    console.log(`   ❌ AVVISAD: AI säger inte mat`);
  }
}