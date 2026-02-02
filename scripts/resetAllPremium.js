// Reset All Premium - Admin Script
// Detta script rensar alla premium och family premium från Firebase Realtime Database
// VARNING: Detta påverkar ALLA användare i databasen

const admin = require('firebase-admin')
const serviceAccount = require('../serviceAccountKey.json')

// Initiera Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://svinnstop-default-rtdb.europe-west1.firebasedatabase.app'
})

const db = admin.database()

async function resetAllPremium() {
  console.log('🔥 Startar premium-reset...')
  console.log('⚠️  Detta kommer ta bort ALL premium data från alla användare!')
  console.log('')
  
  try {
    // Hämta alla användare
    const usersRef = db.ref('users')
    const snapshot = await usersRef.once('value')
    
    if (!snapshot.exists()) {
      console.log('ℹ️  Inga användare hittades i databasen')
      process.exit(0)
    }
    
    const users = snapshot.val()
    const userIds = Object.keys(users)
    
    console.log(`📊 Hittade ${userIds.length} användare`)
    console.log('')
    
    let premiumCount = 0
    let familyPremiumCount = 0
    let stripeCount = 0
    
    // Räkna hur många som har premium
    for (const uid of userIds) {
      const user = users[uid]
      if (user.premium) {
        premiumCount++
        if (user.premium.stripeCustomerId) {
          stripeCount++
        }
      }
      if (user.familyPremium) {
        familyPremiumCount++
      }
    }
    
    console.log(`📈 Statistik innan reset:`)
    console.log(`   - ${premiumCount} användare med premium`)
    console.log(`   - ${familyPremiumCount} användare med family premium`)
    console.log(`   - ${stripeCount} användare med Stripe-prenumerationer`)
    console.log('')
    
    // Bekräftelse
    console.log('⏳ Väntar 5 sekunder innan reset...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Ta bort premium och familyPremium för alla användare
    const updates = {}
    for (const uid of userIds) {
      updates[`users/${uid}/premium`] = null
      updates[`users/${uid}/familyPremium`] = null
    }
    
    console.log('🗑️  Tar bort premium-data...')
    await db.ref().update(updates)
    
    console.log('')
    console.log('✅ Premium-reset slutförd!')
    console.log(`   - ${premiumCount} premium-konton borttagna`)
    console.log(`   - ${familyPremiumCount} family premium-konton borttagna`)
    console.log('')
    console.log('ℹ️  OBS: Användare med aktiva Stripe-prenumerationer kommer')
    console.log('   få tillbaka premium när deras prenumeration förnyas.')
    console.log('   För att stoppa detta permanent, avbryt prenumerationerna i Stripe Dashboard.')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Fel vid premium-reset:', error)
    process.exit(1)
  }
}

resetAllPremium()
