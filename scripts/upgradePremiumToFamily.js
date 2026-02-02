// Upgrade Premium to Family - Admin Script
// Detta script uppgraderar en specifik användares premium till Family Premium
// Användbart när någon har gammal premium utan premiumType satt

const admin = require('firebase-admin')
const serviceAccount = require('../serviceAccountKey.json')

// Initiera Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://svinnstop-default-rtdb.europe-west1.firebasedatabase.app'
})

const db = admin.database()

// ÄNDRA DETTA TILL DITT USER ID (finns i localStorage eller Firebase Console)
const TARGET_USER_ID = process.argv[2] // Skicka som argument: node scripts/upgradePremiumToFamily.js <userId>

if (!TARGET_USER_ID) {
  console.error('❌ Du måste ange ett user ID!')
  console.log('')
  console.log('Användning:')
  console.log('  node scripts/upgradePremiumToFamily.js <userId>')
  console.log('')
  console.log('Hitta ditt user ID genom att öppna appen och köra i console:')
  console.log('  firebase.auth().currentUser.uid')
  process.exit(1)
}

async function upgradePremiumToFamily() {
  console.log('🔥 Startar family premium upgrade...')
  console.log(`👤 User ID: ${TARGET_USER_ID}`)
  console.log('')
  
  try {
    // Hämta användarens nuvarande premium data
    const premiumRef = db.ref(`users/${TARGET_USER_ID}/premium`)
    const snapshot = await premiumRef.once('value')
    
    if (!snapshot.exists()) {
      console.log('❌ Användaren har ingen premium data i Firebase')
      console.log('ℹ️  Kör först appen så att premium synkas från localStorage till Firebase')
      process.exit(1)
    }
    
    const premiumData = snapshot.val()
    
    console.log('📊 Nuvarande premium status:')
    console.log(`   - Active: ${premiumData.active}`)
    console.log(`   - Lifetime: ${premiumData.lifetimePremium || false}`)
    console.log(`   - Premium Until: ${premiumData.premiumUntil || 'N/A'}`)
    console.log(`   - Source: ${premiumData.source || 'unknown'}`)
    console.log(`   - Premium Type: ${premiumData.premiumType || 'INTE SATT (gammalt format)'}`)
    console.log('')
    
    // Uppdatera till Family Premium
    const updatedPremium = {
      ...premiumData,
      premiumType: 'family', // Sätt till family
      lastUpdated: new Date().toISOString()
    }
    
    console.log('✏️  Uppdaterar till Family Premium...')
    await premiumRef.update(updatedPremium)
    
    console.log('')
    console.log('✅ Premium uppgraderat till Family Premium!')
    console.log('ℹ️  Nu bör din familj ha tillgång till premium-funktioner')
    console.log('')
    console.log('Nästa steg:')
    console.log('1. Ladda om appen')
    console.log('2. Kontrollera att din familj har tillgång till premium-funktioner')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Fel vid upgrade:', error)
    process.exit(1)
  }
}

upgradePremiumToFamily()
