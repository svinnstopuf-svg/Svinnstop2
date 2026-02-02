// Clean all premium data from Firebase
// Run with: node scripts/cleanPremiumData.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://svinnstop-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

async function cleanAllPremiumData() {
  console.log('🧹 Starting premium data cleanup...\n');
  
  try {
    // 1. Clean all user premium data
    console.log('📋 Step 1: Cleaning user premium data...');
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');
    const users = usersSnapshot.val() || {};
    
    let userPremiumCount = 0;
    const userUpdates = {};
    
    for (const userId in users) {
      if (users[userId].premium) {
        userUpdates[`users/${userId}/premium`] = null;
        userPremiumCount++;
      }
    }
    
    if (userPremiumCount > 0) {
      await db.ref().update(userUpdates);
      console.log(`   ✅ Removed premium data from ${userPremiumCount} users`);
    } else {
      console.log('   ℹ️  No user premium data found');
    }
    
    // 2. Clean all family premium data
    console.log('\n📋 Step 2: Cleaning family premium data...');
    const familiesRef = db.ref('families');
    const familiesSnapshot = await familiesRef.once('value');
    const families = familiesSnapshot.val() || {};
    
    let familyPremiumCount = 0;
    const familyUpdates = {};
    
    for (const familyId in families) {
      if (families[familyId].premium) {
        familyUpdates[`families/${familyId}/premium`] = null;
        familyPremiumCount++;
      }
    }
    
    if (familyPremiumCount > 0) {
      await db.ref().update(familyUpdates);
      console.log(`   ✅ Removed premium data from ${familyPremiumCount} families`);
    } else {
      console.log('   ℹ️  No family premium data found');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(50));
    console.log(`   Users cleaned: ${userPremiumCount}`);
    console.log(`   Families cleaned: ${familyPremiumCount}`);
    console.log('\n💡 All premium data has been removed from Firebase');
    console.log('💡 Users will need to re-purchase premium subscriptions');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the cleanup
cleanAllPremiumData();
