// Family Sharing Service - Collaborative Food Inventory
// Allows families to share and sync their food inventory

import { database, auth } from './firebaseConfig'
import { ref, set, get, onValue, update, push, child } from 'firebase/database'
import { syncFamilyDataToUser } from './userDataSync'

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
    
    // NYTT: Synka till user cloud om inloggad
    const user = auth.currentUser
    if (user && !user.isAnonymous) {
      syncFamilyDataToUser(data)
        .catch(err => console.warn('⚠️ Could not sync family data to cloud:', err))
    }
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
  const userId = auth.currentUser?.uid || null

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
        userId: userId,
        name: creatorName,
        role: ROLES.OWNER,
        joinedAt: now
      }
    }
  }

  try {
    await set(familyRef, familyPayload)
    await set(codeRef, { familyId, familyName, createdAt: now })
    console.log('✅ Firebase: Family created successfully', familyId)
  } catch (error) {
    console.error('❌ Firebase: Failed to create family', error)
    return { success: false, error: 'Kunde inte skapa familjegrupp. Kontrollera Firebase-konfigurationen.' }
  }

  // Spara lokalt
  data.familyId = familyId
  data.familyCode = familyCode
  data.familyName = familyName
  data.myRole = ROLES.OWNER
  data.myMemberId = memberId
  data.members = [
    { id: memberId, name: creatorName, role: ROLES.OWNER, joinedAt: now, isMe: true }
  ]
  data.syncEnabled = true
  data.createdAt = now

  saveFamilyData(data)
  
  // FIX: Check if creator has Family Premium - set it on the family
  try {
    if (userId) {
      const userPremiumRef = ref(database, `users/${userId}/premium`)
      const userPremiumSnap = await get(userPremiumRef)
      
      if (userPremiumSnap.exists()) {
        const userPremium = userPremiumSnap.val()
        
        // If user has active Family Premium, set it on the family
        if (userPremium.active && userPremium.premiumType === 'family') {
          const familyPremiumRef = ref(database, `families/${familyId}/premium`)
          await set(familyPremiumRef, {
            active: true,
            premiumType: 'family',
            premiumUntil: userPremium.premiumUntil,
            source: userPremium.source || 'stripe',
            ownerId: userId,
            lastUpdated: new Date().toISOString()
          })
          console.log('✅ Family Premium set on newly created family')
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to set Family Premium on family:', error)
    // Don't fail the create operation - just log the error
  }

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
  let codeSnap
  try {
    codeSnap = await get(ref(database, `codes/${uppercaseCode}`))
    console.log('✅ Firebase: Code validation successful for', uppercaseCode)
  } catch (error) {
    console.error('❌ Firebase: Failed to validate code', error)
    return { success: false, error: 'Kunde inte ansluta till Firebase. Kontrollera din internetanslutning.' }
  }
  
  if (!codeSnap.exists()) {
    console.warn('⚠️ Firebase: Code not found', uppercaseCode)
    return { success: false, error: 'Fel kod. Kontrollera och försök igen.' }
  }
  const { familyId, familyName } = codeSnap.val()
  console.log('✅ Firebase: Joining family', familyId, familyName)

  // FIX: Kontrollera att familjen inte redan har 5 medlemmar (Family Premium max)
  const familyMembersSnap = await get(ref(database, `families/${familyId}/members`))
  if (familyMembersSnap.exists()) {
    const existingMembers = Object.values(familyMembersSnap.val())
    if (existingMembers.length >= 5) {
      return { success: false, error: 'Familjegruppen är full. Max 5 medlemmar är tillåtna med Family Premium.' }
    }
  }

  const memberId = `member_${Date.now()}`
  const now = new Date().toISOString()
  const userId = auth.currentUser?.uid || null

  // Lägg till medlem i familj i Firebase
  const memberRef = ref(database, `families/${familyId}/members/${memberId}`)
  try {
    await set(memberRef, {
      id: memberId,
      userId: userId,
      name: memberName,
      role: ROLES.MEMBER,
      joinedAt: now
    })
    console.log('✅ Firebase: Member added successfully', memberId)
  } catch (error) {
    console.error('❌ Firebase: Failed to add member', error)
    return { success: false, error: 'Kunde inte gå med i familjegrupp. Försök igen.' }
  }

  // Hämta ALLA medlemmar från Firebase
  const familySnap = await get(ref(database, `families/${familyId}/members`))
  const allMembers = []
  if (familySnap.exists()) {
    const membersObj = familySnap.val()
    Object.values(membersObj).forEach(member => {
      allMembers.push({
        ...member,
        isMe: member.id === memberId
      })
    })
  }

  // Spara lokalt med alla medlemmar
  data.familyId = familyId
  data.familyCode = uppercaseCode
  data.familyName = familyName
  data.myRole = ROLES.MEMBER
  data.myMemberId = memberId
  data.members = allMembers
  data.syncEnabled = true
  data.createdAt = now
  data.invitePending = false

  saveFamilyData(data)
  
  // FIX: Check if joining user has Family Premium - propagate to family
  try {
    if (userId) {
      const userPremiumRef = ref(database, `users/${userId}/premium`)
      const userPremiumSnap = await get(userPremiumRef)
      
      if (userPremiumSnap.exists()) {
        const userPremium = userPremiumSnap.val()
        
        // If user has active Family Premium, set it on the family
        if (userPremium.active && userPremium.premiumType === 'family') {
          const familyPremiumRef = ref(database, `families/${familyId}/premium`)
          await set(familyPremiumRef, {
            active: true,
            premiumType: 'family',
            premiumUntil: userPremium.premiumUntil,
            source: userPremium.source || 'stripe',
            ownerId: userId,
            lastUpdated: new Date().toISOString()
          })
          console.log('✅ Family Premium propagated to family from joining member')
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to propagate Family Premium to family:', error)
    // Don't fail the join operation - just log the error
  }

  return { success: true, familyName, familyCode: uppercaseCode }
}

// Lämna familjegruppen
export async function leaveFamily() {
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

  // FIX: Ta bort medlem från Firebase först
  const familyId = data.familyId
  const myMemberId = data.myMemberId
  
  try {
    // Ta bort medlemmen från Firebase
    const memberRef = ref(database, `families/${familyId}/members/${myMemberId}`)
    await set(memberRef, null) // Sätt till null för att ta bort
    console.log('✅ Firebase: Member removed successfully')
    
    // Om detta var sista medlemmen OCH owner, ta bort hela familjen
    if (data.myRole === ROLES.OWNER && data.members.length <= 1) {
      // Ta bort familj och kod
      const familyRef = ref(database, `families/${familyId}`)
      const codeRef = ref(database, `codes/${data.familyCode}`)
      await set(familyRef, null)
      await set(codeRef, null)
      console.log('✅ Firebase: Family deleted (last member left)')
    }
  } catch (error) {
    console.error('❌ Firebase: Failed to remove member', error)
    return { success: false, error: 'Kunde inte lämna familjegrupp. Försök igen.' }
  }

  // Återställ till default EFTER Firebase-ändring
  const resetData = {
    familyId: null,
    familyCode: null,
    familyName: null,
    myRole: null,
    myMemberId: null,
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

// Starta realtime-synkronisering av medlemmar
export function startMemberSync(callback) {
  const data = getFamilyData()
  
  if (!data.familyId || !data.syncEnabled) {
    return null
  }

  const familyRef = ref(database, `families/${data.familyId}/members`)
  return onValue(familyRef, (snap) => {
    const membersObj = snap.val() || {}
    const members = Object.values(membersObj)
    const d = getFamilyData()
    const myMemberId = d.myMemberId
    
    // FIX: Kolla om jag har blivit borttagen från familjen
    const iAmStillMember = members.some(m => m.id === myMemberId)
    
    if (!iAmStillMember && myMemberId) {
      console.log('⚠️ You have been removed from the family')
      
      // Återställ till default (jag är inte längre medlem)
      const resetData = {
        familyId: null,
        familyCode: null,
        familyName: null,
        myRole: null,
        myMemberId: null,
        members: [],
        invitePending: false,
        syncEnabled: false,
        lastSyncAt: null,
        createdAt: null
      }
      saveFamilyData(resetData)
      
      // Triggra callback med tom lista för att uppdatera UI
      if (callback) {
        callback([])
      }
      
      // Reloada sidan för att rensa alla listeners och states
      setTimeout(() => {
        alert('⚠️ Du har tagits bort från familjegruppen')
        window.location.reload()
      }, 100)
      
      return
    }
    
    // Normal uppdatering av medlemslista
    d.members = members.map(m => ({ ...m, isMe: m.id === myMemberId }))
    d.lastSyncAt = new Date().toISOString()
    saveFamilyData(d)
    
    if (callback) {
      callback(d.members)
    }
  })
}

// Aktivera/avaktivera synkronisering
export function toggleSync(enabled) {
  const data = getFamilyData()

  if (!data.familyId) {
    return { success: false, error: 'Du är inte medlem i någon grupp' }
  }

  data.syncEnabled = !!enabled
  saveFamilyData(data)

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

// Överför ägande till annan medlem (endast owner)
export async function transferOwnership(newOwnerMemberId) {
  const data = getFamilyData()

  if (!data.familyId) {
    return { success: false, error: 'Du är inte medlem i någon grupp' }
  }

  if (data.myRole !== ROLES.OWNER) {
    return { 
      success: false, 
      error: 'Endast ägaren kan överföra ägande' 
    }
  }

  const newOwner = data.members.find(m => m.id === newOwnerMemberId)
  
  if (!newOwner) {
    return { success: false, error: 'Medlem hittades inte' }
  }

  if (newOwner.isMe) {
    return { success: false, error: 'Du är redan ägare' }
  }

  try {
    // Uppdatera roller i Firebase
    const myMemberRef = ref(database, `families/${data.familyId}/members/${data.myMemberId}`)
    const newOwnerRef = ref(database, `families/${data.familyId}/members/${newOwnerMemberId}`)

    // Sätt mig till member
    await update(myMemberRef, { role: ROLES.MEMBER })
    // Sätt ny medlem till owner
    await update(newOwnerRef, { role: ROLES.OWNER })

    // Uppdatera lokalt
    data.myRole = ROLES.MEMBER
    data.members = data.members.map(m => {
      if (m.id === data.myMemberId) {
        return { ...m, role: ROLES.MEMBER }
      }
      if (m.id === newOwnerMemberId) {
        return { ...m, role: ROLES.OWNER }
      }
      return m
    })
    saveFamilyData(data)

    console.log('✅ Firebase: Ownership transferred successfully')

    return {
      success: true,
      message: `${newOwner.name} är nu ägare av gruppen`
    }
  } catch (error) {
    console.error('❌ Firebase: Failed to transfer ownership', error)
    return { success: false, error: 'Kunde inte överföra ägande. Försök igen.' }
  }
}

// Ta bort medlem (endast owner/admin)
export async function removeMember(memberId) {
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

  // FIX: Ta bort medlem från Firebase
  try {
    const memberRef = ref(database, `families/${data.familyId}/members/${memberId}`)
    await set(memberRef, null)
    console.log('✅ Firebase: Member removed successfully')
  } catch (error) {
    console.error('❌ Firebase: Failed to remove member', error)
    return { success: false, error: 'Kunde inte ta bort medlem. Försök igen.' }
  }

  // Uppdatera lokalt EFTER Firebase-ändring
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
  transferOwnership,
  toggleSync,
  startMemberSync,
  isInFamily,
  getShareableCode,
  syncItems,
  removeMember,
  addMockMember,
  getFamilyStats,
  ROLES
}
