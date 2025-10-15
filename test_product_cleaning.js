// Test script för att testa produktnamnsrensning
import { ReceiptProcessor } from './src/receiptProcessor.js';

const processor = new ReceiptProcessor();

// Test produktnamn från ditt kvitto
const testProducts = [
  "*Avokado 25t...",
  "Banan",
  "Gurka 2st%15,0...",
  "LakritsMix 39,90", 
  "Svamp champinjon"
];

console.log('=== TEST AV PRODUKTNAMNSRENSNING ===\n');

for (const productName of testProducts) {
  const cleaned = processor.extractCoreProductName(productName);
  const quantity = processor.extractQuantityFromName(productName);
  
  console.log(`Original: "${productName}"`);
  console.log(`Rensat:   "${cleaned}"`);
  console.log(`Kvantitet: ${quantity}`);
  console.log('---');
}

console.log('\n=== TEST AV AI FOOD DETECTION ===\n');

for (const productName of testProducts) {
  const cleaned = processor.extractCoreProductName(productName);
  const isFood = processor.isLikelyFoodProduct(cleaned);
  
  console.log(`"${productName}" -> "${cleaned}" -> ${isFood ? '✅ MAT' : '❌ EJ MAT'}`);
}