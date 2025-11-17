import { database } from './firebaseConfig'
import { ref, set, onValue, remove } from 'firebase/database'
import { getFamilyData } from './familyService'

// Synka inköpslista till Firebase
export async function syncShoppingListToFirebase(shoppingList) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    return
  }

  try {
    const shoppingRef = ref(database, `families/${family.familyId}/shoppingList`)
    await set(shoppingRef, shoppingList)
    console.log('✅ Firebase: Shopping list synced', shoppingList.length, 'items')
  } catch (error) {
    console.error('❌ Firebase: Failed to sync shopping list', error)
  }
}

// Lyssna på inköpslista-ändringar från Firebase
export function listenToShoppingListChanges(callback) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    console.log('⚠️ Firebase: Not listening to shopping list - no family or sync disabled')
    return null
  }

  console.log('👂 Firebase: Starting to listen for shopping list changes', family.familyId)
  const shoppingRef = ref(database, `families/${family.familyId}/shoppingList`)
  return onValue(shoppingRef, (snap) => {
    const data = snap.val()
    if (data) {
      console.log('✅ Firebase: Shopping list updated from Firebase', data.length, 'items')
      callback(data)
    } else {
      console.log('⚠️ Firebase: No shopping list data in Firebase')
    }
  }, (error) => {
    console.error('❌ Firebase: Error listening to shopping list', error)
  })
}

// Synka sparade inköpslistor (templates) till Firebase
export async function syncSavedListsToFirebase(savedLists) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    return
  }

  try {
    const savedListsRef = ref(database, `families/${family.familyId}/savedShoppingLists`)
    await set(savedListsRef, savedLists)
    console.log('✅ Firebase: Saved shopping lists synced', savedLists.length, 'lists')
  } catch (error) {
    console.error('❌ Firebase: Failed to sync saved shopping lists', error)
  }
}

// Lyssna på sparade inköpslistor-ändringar från Firebase
export function listenToSavedListsChanges(callback) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    console.log('⚠️ Firebase: Not listening to saved lists - no family or sync disabled')
    return null
  }

  console.log('👂 Firebase: Starting to listen for saved shopping lists changes', family.familyId)
  const savedListsRef = ref(database, `families/${family.familyId}/savedShoppingLists`)
  return onValue(savedListsRef, (snap) => {
    const data = snap.val()
    if (data) {
      console.log('✅ Firebase: Saved shopping lists updated from Firebase', data.length, 'lists')
      callback(data)
    } else {
      console.log('⚠️ Firebase: No saved shopping lists in Firebase')
    }
  }, (error) => {
    console.error('❌ Firebase: Error listening to saved shopping lists', error)
  })
}

// Ta bort inköpslista från Firebase när familj lämnas
export async function clearShoppingListFromFirebase() {
  const family = getFamilyData()
  if (!family.familyId) {
    return
  }

  try {
    const shoppingRef = ref(database, `families/${family.familyId}/shoppingList`)
    const savedListsRef = ref(database, `families/${family.familyId}/savedShoppingLists`)
    await remove(shoppingRef)
    await remove(savedListsRef)
    console.log('✅ Firebase: Shopping list data cleared')
  } catch (error) {
    console.error('❌ Firebase: Failed to clear shopping list data', error)
  }
}
