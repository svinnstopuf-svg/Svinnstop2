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
  apiKey: "AIzaSyBAZ-C8LxZkZPAdaWC5HkKLeR0iHt-BbKo",
  authDomain: "svinnstop.firebaseapp.com",
  databaseURL: "https://svinnstop-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "svinnstop",
  storageBucket: "svinnstop.firebasestorage.app",
  messagingSenderId: "20081992396",
  appId: "1:20081992396:web:0dfed2d8d002c9c6dc5869"
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
