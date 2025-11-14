// Firebase Configuration for Svinnstop
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// TEMPORARY CONFIG - MÅSTE BYTAS UT MOT DIN EGEN FIREBASE CONFIG
// Gå till Firebase Console (https://console.firebase.google.com/)
// 1. Skapa ett nytt projekt
// 2. Gå till Project Settings > General
// 3. Under "Your apps", klicka på "</>" (Web app)
// 4. Kopiera firebaseConfig-objektet hit

const firebaseConfig = {
  // PLACEHOLDER - Byt ut mot din egen Firebase-konfiguration
  apiKey: "AIzaSyDEMO_KEY_REPLACE_ME",
  authDomain: "svinnstop-demo.firebaseapp.com",
  databaseURL: "https://svinnstop-demo-default-rtdb.firebaseio.com",
  projectId: "svinnstop-demo",
  storageBucket: "svinnstop-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// Initialize Firebase
let app
let database

try {
  app = initializeApp(firebaseConfig)
  database = getDatabase(app)
  console.log('✅ Firebase initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
  console.warn('⚠️ App will run in local-only mode without family sharing sync')
}

export { database }
export default app
