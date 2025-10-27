// TEST: Verifiera att måttkonvertering fungerar korrekt

// Simulera parseMeasurement-funktionen
function parseMeasurement(measureStr) {
  if (!measureStr || measureStr.trim() === '') return { quantity: 1, unit: 'st' }
  
  const str = measureStr.trim().toLowerCase()
  
  // Steg 1: Hantera icke-numeriska mått
  if (str.includes('taste') || str.includes('garnish') || str.includes('serve') || str.includes('needed')) {
    return { quantity: 1, unit: 'efter smak' }
  }
  if (str.includes('drizzle') || str.includes('splash')) return { quantity: 1, unit: 'skål' }
  if (str.includes('handful')) return { quantity: 1, unit: 'näve' }
  if (str.includes('bunch')) return { quantity: 1, unit: 'knippe' }
  if (str.includes('pinch')) return { quantity: 1, unit: 'nypa' }
  
  // Steg 2: Extrahera tal
  let quantity = 1
  
  const fractionMatch = str.match(/(\d+)\s*\/\s*(\d+)/)
  if (fractionMatch) {
    quantity = parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2])
  } else {
    const numberMatch = str.match(/(\d+\.?\d*|\d*\.?\d+)/)
    if (numberMatch) {
      quantity = parseFloat(numberMatch[1])
    }
  }
  
  // Steg 3: Konvertera enheter
  if ((str.includes('oz') || str.includes('ounce')) && !str.includes('goz')) {
    return { quantity: Math.round(quantity * 28.35), unit: 'g' }
  }
  
  if (str.includes('lb') || str.includes('pound')) {
    return { quantity: Math.round(quantity * 453.592), unit: 'g' }
  }
  
  if (str.includes('cup')) {
    return { quantity: Math.round(quantity * 2.366 * 10) / 10, unit: 'dl' }
  }
  
  if (str.includes('tablespoon') || str.includes('tbsp')) {
    return { quantity, unit: 'msk' }
  }
  
  if (str.includes('teaspoon') || str.includes('tsp')) {
    return { quantity, unit: 'tsk' }
  }
  
  if (str.includes('ml') || str.includes('millilitre')) {
    return { quantity, unit: 'ml' }
  }
  
  if (str.includes('gram') || (str.includes('g') && !str.includes('oz'))) {
    return { quantity, unit: 'g' }
  }
  
  if (str.includes('slice')) {
    return { quantity, unit: quantity === 1 ? 'skiva' : 'skivor' }
  }
  
  return { quantity, unit: 'st' }
}

// TEST CASES
const testCases = [
  { input: '4 oz', expected: { quantity: 113, unit: 'g' } },
  { input: '1/2 cup', expected: { quantity: 1.2, unit: 'dl' } },
  { input: '2 tablespoons', expected: { quantity: 2, unit: 'msk' } },
  { input: '1 teaspoon', expected: { quantity: 1, unit: 'tsk' } },
  { input: '100g', expected: { quantity: 100, unit: 'g' } },
  { input: '1 lb', expected: { quantity: 454, unit: 'g' } },
  { input: '2 slices', expected: { quantity: 2, unit: 'skivor' } },
  { input: 'to taste', expected: { quantity: 1, unit: 'efter smak' } },
  { input: '3 cups', expected: { quantity: 7.1, unit: 'dl' } },
  { input: '1/4 teaspoon', expected: { quantity: 0.25, unit: 'tsk' } }
]

console.log('🧪 TESTAR MÅTTKONVERTERING:\n')

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = parseMeasurement(test.input)
  const quantityMatch = Math.abs(result.quantity - test.expected.quantity) < 0.2
  const unitMatch = result.unit === test.expected.unit
  
  if (quantityMatch && unitMatch) {
    console.log(`✅ Test ${index + 1}: "${test.input}" → ${result.quantity} ${result.unit}`)
    passed++
  } else {
    console.log(`❌ Test ${index + 1}: "${test.input}"`)
    console.log(`   Förväntade: ${test.expected.quantity} ${test.expected.unit}`)
    console.log(`   Fick: ${result.quantity} ${result.unit}`)
    failed++
  }
})

console.log(`\n📊 RESULTAT: ${passed}/${testCases.length} tester godkända`)

if (failed === 0) {
  console.log('🎉 ALLA TESTER GODKÄNDA!')
} else {
  console.log(`⚠️  ${failed} tester misslyckades`)
}
