import { database } from './firebaseConfig'
import { ref, set, onValue, remove } from 'firebase/database'
import { getFamilyData } from './familyService'

// Synka inventarie till Firebase
export async function syncInventoryToFirebase(inventory) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    return
  }

  const inventoryRef = ref(database, `families/${family.familyId}/inventory`)
  await set(inventoryRef, inventory)
}

// Lyssna på inventarie-ändringar från Firebase
export function listenToInventoryChanges(callback) {
  const family = getFamilyData()
  if (!family.familyId || !family.syncEnabled) {
    return null
  }

  const inventoryRef = ref(database, `families/${family.familyId}/inventory`)
  return onValue(inventoryRef, (snap) => {
    const data = snap.val()
    if (data) {
      callback(data)
    }
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
