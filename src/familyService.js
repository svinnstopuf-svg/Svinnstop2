// Family Sharing Service - Collaborative Food Inventory
// Allows families to share and sync their food inventory

import { database } from './firebaseConfig'
import { ref, set, get, onValue, update, push, child } from 'firebase/database'

const STORAGE_KEY = 'svinnstop_family_data'

// Roller
export const ROLES = {
  OWNER: 'owner',      // Skapade gruppen, full kontroll
  ADMIN: 'admin',      // Kan lägga till/ta bort medlemmar
  MEMBER: 'member'     // Kan lägga till/ta bort varor
}

// Generera unik family code
export function generateFamilyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exkludera förvirrande tecken
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Hämta family data
export function getFamilyData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Kunde inte läsa family data:', error)
  }

  // Default structure
  return {
    familyId: null,
    familyCode: null,
    familyName: null,
    myRole: null,
    members: [],
    invitePending: false,
    syncEnabled: false,
    lastSyncAt: null,
    createdAt: null
  }
}

// Spara family data
function saveFamilyData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Kunde inte spara family data:', error)
  }
}

// Skapa en ny familjegrupp (Firebase)
export async function createFamily(familyName, creatorName) {
  if (!familyName || !creatorName) {
    return { success: false, error: 'Familjenamn och ditt namn krävs' }
  }

  const data = getFamilyData()

  // Kolla om användaren redan är i en grupp
  if (data.familyId) {
    return { 
      success: false, 
      error: 'Du är redan medlem i en familjegrupp' 
    }
  }

  const familyId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const familyCode = generateFamilyCode()

  const memberId = `member_${Date.now()}`
  const now = new Date().toISOString()

  // Skriv till Firebase
  const familyRef = ref(database, `families/${familyId}`)
  const codeRef = ref(database, `codes/${familyCode}`)

  const familyPayload = {
    familyId,
    familyCode,
    familyName,
    createdAt: now,
    members: {
      [memberId]: {
        id: memberId,
        name: creatorName,
        role: ROLES.OWNER,
        joinedAt: now
      }
    }
  }

  await set(familyRef, familyPayload)
  await set(codeRef, { familyId, familyName, createdAt: now })

  // Spara lokalt
  data.familyId = familyId
  data.familyCode = familyCode
  data.familyName = familyName
  data.myRole = ROLES.OWNER
  data.members = [
    { id: memberId, name: creatorName, role: ROLES.OWNER, joinedAt: now, isMe: true }
  ]
  data.syncEnabled = true
  data.createdAt = now

  saveFamilyData(data)

  return { success: true, familyCode, familyName }
}

// Gå med i en familjegrupp (Firebase)
export async function joinFamily(familyCode, memberName) {
  if (!familyCode || !memberName) {
    return { success: false, error: 'Familjekod och ditt namn krävs' }
  }

  const data = getFamilyData()

  // Kolla om användaren redan är i en grupp
  if (data.familyId) {
    return { 
      success: false, 
      error: 'Du är redan medlem i en familjegrupp. Lämna den först.' 
    }
  }

  // I en riktig app skulle detta göra ett API-anrop för att validera koden
  // och hämta familjeinfo. Här simulerar vi det.
  
  // Simulera att koden är giltig (i verkligheten skulle detta valideras mot backend)
  const uppercaseCode = familyCode.toUpperCase().replace(/\s/g, '')
  
  if (uppercaseCode.length !== 6) {
    return { success: false, error: 'Ogiltig kod. Koden ska vara 6 tecken.' }
  }

  // Validera koden i Firebase
  const codeSnap = await get(ref(database, `codes/${uppercaseCode}`))
  if (!codeSnap.exists()) {
    return { success: false, error: 'Fel kod. Kontrollera och försök igen.' }
  }
  const { familyId, familyName } = codeSnap.val()

  const memberId = `member_${Date.now()}`
  const now = new Date().toISOString()

  // Lägg till medlem i familj i Firebase
  const memberRef = ref(database, `families/${familyId}/members/${memberId}`)
  await set(memberRef, {
    id: memberId,
    name: memberName,
    role: ROLES.MEMBER,
    joinedAt: now
  })

  // Spara lokalt
  data.familyId = familyId
  data.familyCode = uppercaseCode
  data.familyName = familyName
  data.myRole = ROLES.MEMBER
  data.members = [ { id: memberId, name: memberName, role: ROLES.MEMBER, joinedAt: now, isMe: true } ]
  data.syncEnabled = true
  data.createdAt = now
  data.invitePending = false

  saveFamilyData(data)

  return { success: true, familyName, familyCode: uppercaseCode }
}

// Lämna familjegruppen
export function leaveFamily() {
  const data = getFamilyData()

  if (!data.familyId) {
    return { success: false, error: 'Du är inte medlem i någon grupp' }
  }

  // Om användaren är owner och det finns andra medlemmar
  if (data.myRole === ROLES.OWNER && data.members.length > 1) {
    return {
      success: false,
      error: 'Du måste antingen ta bort alla medlemmar eller överföra ägandet innan du lämnar'
    }
  }

  // Återställ till default
  const resetData = {
    familyId: null,
    familyCode: null,
    familyName: null,
    myRole: null,
    members: [],
    invitePending: false,
    syncEnabled: false,
    lastSyncAt: null,
    createdAt: null
  }

  saveFamilyData(resetData)

  return {
    success: true,
    message: 'Du har lämnat familjegruppen'
  }
}

// Aktivera/avaktivera synkronisering med realtime listener
export function toggleSync(enabled) {
  const data = getFamilyData()

  if (!data.familyId) {
    return { success: false, error: 'Du är inte medlem i någon grupp' }
  }

  data.syncEnabled = !!enabled
  saveFamilyData(data)

  if (enabled) {
    // Lyssna på ändringar i familjemedlemmar och spara lokalt
    const familyRef = ref(database, `families/${data.familyId}/members`)
    onValue(familyRef, (snap) => {
      const membersObj = snap.val() || {}
      const members = Object.values(membersObj)
      const d = getFamilyData()
      d.members = members.map(m => ({ ...m, isMe: m.id === d.members.find(x => x.isMe)?.id }))
      d.lastSyncAt = new Date().toISOString()
      saveFamilyData(d)
    })
  }

  return { success: true, enabled: data.syncEnabled }
  return {
    success: true,
    syncEnabled: enabled
  }
}

// Kolla om användaren är i en familj
export function isInFamily() {
  const data = getFamilyData()
  return !!data.familyId
}

// Hämta family code för delning
export function getShareableCode() {
  const data = getFamilyData()
  
  if (!data.familyCode) {
    return null
  }

  return {
    code: data.familyCode,
    familyName: data.familyName,
    shareText: `🏠 Gå med i min familjegrupp på Svinnstop!\n\nFamiljenamn: ${data.familyName}\nKod: ${data.familyCode}\n\nAnvänd koden i appen för att dela matvarulista!`
  }
}

// Simulera synkronisering av items (i produktion skulle detta använda Firebase/Supabase)
export function syncItems(localItems) {
  const data = getFamilyData()

  if (!data.familyId || !data.syncEnabled) {
    return { success: false, synced: false }
  }

  // I en riktig app skulle detta:
  // 1. Skicka lokala items till backend
  // 2. Hämta items från andra familjemedlemmar
  // 3. Merga items med conflict resolution
  
  data.lastSyncAt = new Date().toISOString()
  saveFamilyData(data)

  return {
    success: true,
    synced: true,
    lastSyncAt: data.lastSyncAt
  }
}

// Ta bort medlem (endast owner/admin)
export function removeMember(memberId) {
  const data = getFamilyData()

  if (!data.familyId) {
    return { success: false, error: 'Du är inte medlem i någon grupp' }
  }

  if (data.myRole !== ROLES.OWNER && data.myRole !== ROLES.ADMIN) {
    return { 
      success: false, 
      error: 'Du har inte behörighet att ta bort medlemmar' 
    }
  }

  const memberIndex = data.members.findIndex(m => m.id === memberId)
  
  if (memberIndex === -1) {
    return { success: false, error: 'Medlem hittades inte' }
  }

  const member = data.members[memberIndex]
  
  if (member.isMe) {
    return { success: false, error: 'Du kan inte ta bort dig själv' }
  }

  data.members.splice(memberIndex, 1)
  saveFamilyData(data)

  return {
    success: true,
    message: `${member.name} har tagits bort från gruppen`
  }
}

// Lägg till mock members för demo
export function addMockMember(name, role = ROLES.MEMBER) {
  const data = getFamilyData()

  if (!data.familyId) {
    return { success: false, error: 'Du är inte medlem i någon grupp' }
  }

  const newMember = {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name,
    role: role,
    joinedAt: new Date().toISOString(),
    isMe: false
  }

  data.members.push(newMember)
  saveFamilyData(data)

  return {
    success: true,
    member: newMember
  }
}

// Hämta statistik för familjen
export function getFamilyStats(items) {
  const data = getFamilyData()

  if (!data.familyId) {
    return null
  }

  return {
    totalMembers: data.members.length,
    totalItems: items.length,
    syncEnabled: data.syncEnabled,
    lastSync: data.lastSyncAt,
    familyName: data.familyName
  }
}

// Export service object
export const familyService = {
  getFamilyData,
  createFamily,
  joinFamily,
  leaveFamily,
  toggleSync,
  isInFamily,
  getShareableCode,
  syncItems,
  removeMember,
  addMockMember,
  getFamilyStats,
  ROLES
}
