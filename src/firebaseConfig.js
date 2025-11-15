// Firebase Configuration for Svinnstop
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'

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
let auth
let functions

try {
  app = initializeApp(firebaseConfig)
  database = getDatabase(app)
  auth = getAuth(app)
  functions = getFunctions(app)
  console.log('✅ Firebase initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
  console.warn('⚠️ App will run in local-only mode without family sharing sync')
}

// Initialize anonymous authentication
export async function initAuth() {
  if (!auth) {
    console.warn('⚠️ Firebase auth not available')
    return null
  }

  try {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log('✅ Svinnstop: User authenticated', user.uid)
          unsubscribe()
          resolve(user)
        } else {
          // Sign in anonymously
          try {
            const userCredential = await signInAnonymously(auth)
            console.log('✅ Svinnstop: Anonymous sign-in successful', userCredential.user.uid)
            unsubscribe()
            resolve(userCredential.user)
          } catch (error) {
            console.error('❌ Svinnstop: Anonymous sign-in failed', error)
            console.warn('⚠️ Svinnstop will continue without authentication')
            unsubscribe()
            resolve(null)
          }
        }
      })
    })
  } catch (error) {
    console.error('❌ Svinnstop: Auth initialization failed', error)
    return null
  }
}

// Helper to call Firebase Functions
export function callFunction(functionName) {
  if (!functions) {
    throw new Error('Firebase Functions not initialized')
  }
  return httpsCallable(functions, functionName)
}

export { database, auth, functions }
export default app
