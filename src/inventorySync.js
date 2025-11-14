import { database } from './firebaseConfig'
import { ref, set, onValue, remove } from 'firebase/database'
import { getFamilyData } from './familyService'

// Synka inventarie till Firebase
export async function syncInventoryToFirebase(inventory) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    return
  }

  try {
    const inventoryRef = ref(database, `families/${family.familyId}/inventory`)
    await set(inventoryRef, inventory)
    console.log('✅ Firebase: Inventory synced', inventory.length, 'items')
  } catch (error) {
    console.error('❌ Firebase: Failed to sync inventory', error)
  }
}

// Lyssna på inventarie-ändringar från Firebase
export function listenToInventoryChanges(callback) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    console.log('⚠️ Firebase: Not listening to inventory - no family or sync disabled')
    return null
  }

  console.log('👂 Firebase: Starting to listen for inventory changes', family.familyId)
  const inventoryRef = ref(database, `families/${family.familyId}/inventory`)
  return onValue(inventoryRef, (snap) => {
    const data = snap.val()
    if (data) {
      console.log('✅ Firebase: Inventory updated from Firebase', data.length, 'items')
      callback(data)
    } else {
      console.log('⚠️ Firebase: No inventory data in Firebase')
    }
  }, (error) => {
    console.error('❌ Firebase: Error listening to inventory', error)
  })
}

// Ta bort inventarie från Firebase när familj lämnas
export async function clearInventoryFromFirebase() {
  const family = getFamilyData()
  if (!family.familyId) {
    return
  }

  const inventoryRef = ref(database, `families/${family.familyId}/inventory`)
  await remove(inventoryRef)
}
