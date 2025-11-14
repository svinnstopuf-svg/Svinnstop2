// Leaderboard & Competitions Service
// Låter användare tävla med vänner om vem som sparar mest

import { database, auth } from './firebaseConfig'
import { ref, set, get, onValue, update, push } from 'firebase/database'

// Get user-specific storage key
function getUserStorageKey() {
  const user = auth.currentUser
  if (!user) {
    console.warn('⚠️ getUserStorageKey called before auth ready')
    return null // Returnera null istället för fallback
  }
  return `svinnstop_leaderboard_${user.uid}`
}

const STORAGE_KEY = 'svinnstop_leaderboard'
const FRIENDS_KEY = 'svinnstop_friends'

// Competition timeframes
export const TIMEFRAMES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'all_time'
}

// Generera unik handle (t.ex. alex-1234)
async function generateUniqueHandle(displayName) {
  const baseName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '')
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const randomNum = Math.floor(1000 + Math.random() * 9000) // 4 siffror
    const handle = `${baseName}-${randomNum}`
    
    // Kolla om handlen redan finns
    const handleRef = ref(database, `handles/${handle}`)
    const handleSnap = await get(handleRef)
    
    if (!handleSnap.exists()) {
      return handle
    }
    
    attempts++
  }
  
  // Fallback: lägg till timestamp
  return `${baseName}-${Date.now().toString().slice(-4)}`
}

// Migrera befintliga användarnamn till handle-system (körs en gång)
export async function migrateUsernameToIndex() {
  const user = auth.currentUser
  if (!user) {
    console.warn('⚠️ No user authenticated for username migration')
    return
  }

  const data = getLeaderboardData()
  if (!data.myStats.username) {
    console.warn('⚠️ No username set for migration')
    return
  }

  try {
    console.log('🔄 Migrating username to handle system:', data.myStats.username)
    
    // Generera handle om det inte finns
    let handle = data.myStats.handle
    if (!handle) {
      handle = await generateUniqueHandle(data.myStats.username)
      data.myStats.handle = handle
      saveLeaderboardData(data)
      console.log('✅ Generated new handle:', handle)
    }
    
    // Synka profil till Firebase med handle
    const profileRef = ref(database, `users/${user.uid}/profile`)
    await set(profileRef, {
      displayName: data.myStats.username,
      handle: handle,
      userId: data.myStats.userId,
      createdAt: data.myStats.joinedAt
    })
    console.log('✅ Firebase: Profile synced with handle')
    
    // Skapa handle index
    const handleIndexRef = ref(database, `handles/${handle}`)
    await set(handleIndexRef, {
      uid: user.uid,
      displayName: data.myStats.username
    })
    console.log('✅ Firebase: Handle index created for', handle)
  } catch (error) {
    console.error('❌ Firebase: Failed to migrate username', error)
  }
}

// Hämta leaderboard data
export function getLeaderboardData() {
  try {
    const storageKey = getUserStorageKey()
    if (!storageKey) {
      console.warn('⚠️ Cannot get leaderboard data: user not authenticated')
      return null // Returnera null om ingen user
    }
    const data = localStorage.getItem(storageKey)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Kunde inte läsa leaderboard data:', error)
  }

  return {
    myStats: {
      username: null,
      userId: null,
      itemsSaved: 0,
      moneySaved: 0,
      streak: 0,
      joinedAt: new Date().toISOString()
    },
    competitions: [], // Active competitions
    friends: [],
    lastUpdated: new Date().toISOString()
  }
}

// Spara leaderboard data
function saveLeaderboardData(data) {
  try {
    const storageKey = getUserStorageKey()
    if (!storageKey) {
      console.warn('⚠️ Cannot save leaderboard data: user not authenticated')
      return
    }
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(storageKey, JSON.stringify(data))
  } catch (error) {
    console.error('Kunde inte spara leaderboard data:', error)
  }
}

// Sätt användarnamn - Firebase version med handle
export async function setUsername(username) {
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return { success: false, error: 'Ogiltigt användarnamn' }
  }

  const data = getLeaderboardData()
  
  // Generera userId om det inte finns
  if (!data.myStats.userId) {
    data.myStats.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generera unik handle
  const handle = await generateUniqueHandle(username.trim())
  
  data.myStats.username = username.trim() // Display name
  data.myStats.handle = handle // Unik handle
  saveLeaderboardData(data)

  // Synka till Firebase
  const user = auth.currentUser
  if (user) {
    try {
      // Spara i users/{uid}/profile
      const userRef = ref(database, `users/${user.uid}/profile`)
      await set(userRef, {
        displayName: username.trim(),
        handle: handle,
        userId: data.myStats.userId,
        createdAt: data.myStats.joinedAt
      })
      
      // Skapa handle index för sökning (istället för username)
      const handleIndexRef = ref(database, `handles/${handle}`)
      await set(handleIndexRef, {
        uid: user.uid,
        displayName: username.trim()
      })
      
      console.log('✅ Firebase: Username synced with handle:', handle)
    } catch (error) {
      console.error('❌ Firebase: Failed to sync username', error)
    }
  }

  return {
    success: true,
    username: username.trim(),
    handle: handle,
    userId: data.myStats.userId
  }
}

// Uppdatera mina stats (anropas från savingsTracker och achievementService)
export async function updateMyStats(updates) {
  const data = getLeaderboardData()
  
  data.myStats = {
    ...data.myStats,
    ...updates
  }

  saveLeaderboardData(data)
  
  // Synka till Firebase
  const user = auth.currentUser
  if (user) {
    try {
      const statsRef = ref(database, `users/${user.uid}/stats`)
      await set(statsRef, {
        itemsSaved: data.myStats.itemsSaved || 0,
        moneySaved: data.myStats.moneySaved || 0,
        streak: data.myStats.streak || 0,
        lastUpdated: new Date().toISOString()
      })
      console.log('✅ Firebase: Stats synced')
    } catch (error) {
      console.error('❌ Firebase: Failed to sync stats', error)
    }
  }
  
  return data.myStats
}

// Lägg till vän via användarnamn - Firebase version
export async function addFriend(friendUsername) {
  if (!friendUsername || typeof friendUsername !== 'string') {
    return { success: false, error: 'Ogiltigt användarnamn' }
  }

  const data = getLeaderboardData()

  // Kolla om jag har ett användarnamn
  if (!data.myStats.username) {
    return {
      success: false,
      error: 'Du måste sätta ditt användarnamn först'
    }
  }

  // Kolla om jag försöker lägga till mig själv
  if (friendUsername.toLowerCase() === data.myStats.username.toLowerCase()) {
    return {
      success: false,
      error: 'Du kan inte lägga till dig själv som vän'
    }
  }

  // Kolla om vännen redan finns
  const existingFriend = data.friends.find(
    f => f.username.toLowerCase() === friendUsername.toLowerCase()
  )

  if (existingFriend) {
    return {
      success: false,
      error: 'Denna vän finns redan i din lista'
    }
  }

  // Sök efter användare i Firebase
  const user = auth.currentUser
  if (!user) {
    return { success: false, error: 'Du måste vara inloggad' }
  }

  try {
    // Sök via handle (t.ex. alex-1234)
    const handleIndexRef = ref(database, `handles/${friendUsername.toLowerCase()}`)
    const indexSnap = await get(handleIndexRef)
    
    if (!indexSnap.exists()) {
      return { success: false, error: `Användaren "${friendUsername}" hittades inte. Använd formatet: namn-1234` }
    }
    
    const { uid: friendUserId, displayName } = indexSnap.val()
    console.log('✅ Found user via handle:', friendUsername, '(', displayName, ')', friendUserId)
    
    // Hämta användarens profil
    console.log('🔍 Fetching profile for user:', friendUserId)
    const friendProfileSnap = await get(ref(database, `users/${friendUserId}/profile`))
    if (!friendProfileSnap.exists()) {
      console.error('❌ Profile not found for user:', friendUserId)
      return { success: false, error: 'Användarprofil hittades inte' }
    }
    
    const friendProfile = friendProfileSnap.val()
    console.log('✅ Profile found:', friendProfile)
    
    // Lägg till vän i Firebase (bådå sidorna)
    const friendRef = ref(database, `users/${user.uid}/friends/${friendUserId}`)
    await set(friendRef, {
      userId: friendUserId,
      username: friendProfile.username,
      addedAt: new Date().toISOString(),
      status: 'active'
    })
    
    // Lägg också till mig som vän hos den andra användaren
    const myProfileSnap = await get(ref(database, `users/${user.uid}/profile`))
    if (myProfileSnap.exists()) {
      const myProfile = myProfileSnap.val()
      const reverseFriendRef = ref(database, `users/${friendUserId}/friends/${user.uid}`)
      await set(reverseFriendRef, {
        userId: user.uid,
        username: myProfile.username,
        addedAt: new Date().toISOString(),
        status: 'active'
      })
      console.log('✅ Firebase: Bidirectional friendship created')
    }
    
    // Hämta vänens stats
    const friendStatsSnap = await get(ref(database, `users/${friendUserId}/stats`))
    const friendStats = friendStatsSnap.exists() ? friendStatsSnap.val() : {}
    
    const newFriend = {
      userId: friendUserId,
      username: friendProfile.username,
      itemsSaved: friendStats.itemsSaved || 0,
      moneySaved: friendStats.moneySaved || 0,
      streak: friendStats.streak || 0,
      addedAt: new Date().toISOString(),
      status: 'active'
    }

    data.friends.push(newFriend)
    saveLeaderboardData(data)
    
    console.log('✅ Firebase: Friend added')

    return {
      success: true,
      friend: newFriend
    }
  } catch (error) {
    console.error('❌ Firebase: Failed to add friend', error)
    return { success: false, error: 'Kunde inte lägga till vän' }
  }
}

// Ta bort vän
export function removeFriend(userId) {
  const data = getLeaderboardData()

  const friendIndex = data.friends.findIndex(f => f.userId === userId)

  if (friendIndex === -1) {
    return { success: false, error: 'Vän hittades inte' }
  }

  data.friends.splice(friendIndex, 1)
  saveLeaderboardData(data)

  return {
    success: true,
    message: 'Vän borttagen'
  }
}

// Hämta leaderboard för en specifik tidsperiod
export function getLeaderboard(timeframe = TIMEFRAMES.ALL_TIME) {
  const data = getLeaderboardData()

  // Bygg en kombinerad lista av mig och mina vänner
  const allUsers = [
    {
      ...data.myStats,
      isMe: true
    },
    ...data.friends.map(f => ({
      ...f,
      isMe: false
    }))
  ]

  // Sortera baserat på itemsSaved (kan ändras till moneySaved eller streak)
  const sorted = allUsers.sort((a, b) => b.itemsSaved - a.itemsSaved)

  // Lägg till ranking
  const ranked = sorted.map((user, index) => ({
    ...user,
    rank: index + 1
  }))

  return ranked
}

// Skapa en tävling
export function createCompetition(name, timeframe, metric = 'itemsSaved') {
  const data = getLeaderboardData()

  if (!data.myStats.username) {
    return {
      success: false,
      error: 'Du måste sätta ditt användarnamn först'
    }
  }

  if (data.friends.length === 0) {
    return {
      success: false,
      error: 'Du måste ha minst en vän för att skapa en tävling'
    }
  }

  const competition = {
    id: `comp_${Date.now()}`,
    name: name,
    createdBy: data.myStats.userId,
    timeframe: timeframe,
    metric: metric, // 'itemsSaved', 'moneySaved', 'streak'
    participants: [
      data.myStats.userId,
      ...data.friends.map(f => f.userId)
    ],
    startDate: new Date().toISOString(),
    endDate: calculateEndDate(timeframe),
    status: 'active', // 'active', 'completed'
    leaderboard: []
  }

  data.competitions.push(competition)
  saveLeaderboardData(data)

  return {
    success: true,
    competition: competition
  }
}

// Beräkna slutdatum baserat på timeframe
function calculateEndDate(timeframe) {
  const now = new Date()
  
  switch (timeframe) {
    case TIMEFRAMES.WEEKLY:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    case TIMEFRAMES.MONTHLY:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    case TIMEFRAMES.ALL_TIME:
      return null // Ingen slutdatum
    default:
      return null
  }
}

// Hämta aktiva tävlingar
export function getActiveCompetitions() {
  const data = getLeaderboardData()
  
  return data.competitions.filter(comp => {
    if (comp.status !== 'active') return false
    
    // Kolla om tävlingen har gått ut
    if (comp.endDate && new Date(comp.endDate) < new Date()) {
      comp.status = 'completed'
      saveLeaderboardData(data)
      return false
    }
    
    return true
  })
}

// Hämta leaderboard för en specifik tävling
export function getCompetitionLeaderboard(competitionId) {
  const data = getLeaderboardData()
  
  const competition = data.competitions.find(c => c.id === competitionId)
  
  if (!competition) {
    return null
  }

  // Bygg leaderboard baserat på participants
  const participants = [
    data.myStats,
    ...data.friends.filter(f => competition.participants.includes(f.userId))
  ]

  // Sortera baserat på metric
  const sorted = participants.sort((a, b) => {
    const aValue = a[competition.metric] || 0
    const bValue = b[competition.metric] || 0
    return bValue - aValue
  })

  // Lägg till ranking
  const ranked = sorted.map((user, index) => ({
    ...user,
    rank: index + 1,
    isMe: user.userId === data.myStats.userId
  }))

  return {
    competition: competition,
    leaderboard: ranked
  }
}

// Generera mock friends för demo
export function generateMockFriends(count = 5) {
  const data = getLeaderboardData()

  const names = [
    'Anna', 'Erik', 'Maria', 'Johan', 'Lisa',
    'Magnus', 'Emma', 'David', 'Sara', 'Peter',
    'Karin', 'Anders', 'Eva', 'Mikael', 'Hanna'
  ]

  for (let i = 0; i < count; i++) {
    const name = names[Math.floor(Math.random() * names.length)]
    const mockFriend = {
      userId: `user_mock_${Date.now()}_${i}`,
      username: `${name}${Math.floor(Math.random() * 100)}`,
      itemsSaved: Math.floor(Math.random() * 100),
      moneySaved: Math.floor(Math.random() * 2000),
      streak: Math.floor(Math.random() * 50),
      addedAt: new Date().toISOString(),
      status: 'active'
    }

    // Kolla så namnet inte redan finns
    const exists = data.friends.find(f => f.username === mockFriend.username)
    if (!exists) {
      data.friends.push(mockFriend)
    }
  }

  saveLeaderboardData(data)

  return {
    success: true,
    count: data.friends.length
  }
}

// Lyssna på vänners stats i realtid
export function listenToFriendsStats(callback) {
  const user = auth.currentUser
  if (!user) return null

  const friendsRef = ref(database, `users/${user.uid}/friends`)
  return onValue(friendsRef, async (snap) => {
    const friendsObj = snap.val() || {}
    const friendsList = []
    
    // Hämta stats för varje vän
    for (const [friendId, friendData] of Object.entries(friendsObj)) {
      try {
        const statsSnap = await get(ref(database, `users/${friendId}/stats`))
        const stats = statsSnap.exists() ? statsSnap.val() : {}
        
        friendsList.push({
          userId: friendId,
          username: friendData.username,
          itemsSaved: stats.itemsSaved || 0,
          moneySaved: stats.moneySaved || 0,
          streak: stats.streak || 0,
          addedAt: friendData.addedAt,
          status: friendData.status
        })
      } catch (error) {
        console.error('Failed to fetch friend stats:', error)
      }
    }
    
    console.log('✅ Firebase: Friends stats updated', friendsList.length)
    
    if (callback) {
      callback(friendsList)
    }
  })
}

// Hämta min position i leaderboard
export function getMyRank(timeframe = TIMEFRAMES.ALL_TIME) {
  const leaderboard = getLeaderboard(timeframe)
  const myEntry = leaderboard.find(entry => entry.isMe)
  
  return {
    rank: myEntry?.rank || 0,
    totalUsers: leaderboard.length
  }
}

// Export service object
export const leaderboardService = {
  getLeaderboardData,
  setUsername,
  updateMyStats,
  addFriend,
  removeFriend,
  getLeaderboard,
  createCompetition,
  getActiveCompetitions,
  getCompetitionLeaderboard,
  generateMockFriends,
  getMyRank,
  listenToFriendsStats,
  migrateUsernameToIndex,
  TIMEFRAMES
}
