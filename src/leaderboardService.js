// Leaderboard & Competitions Service
// Låter användare tävla med vänner om vem som sparar mest

const STORAGE_KEY = 'svinnstop_leaderboard'
const FRIENDS_KEY = 'svinnstop_friends'

// Competition timeframes
export const TIMEFRAMES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'all_time'
}

// Hämta leaderboard data
export function getLeaderboardData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
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
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Kunde inte spara leaderboard data:', error)
  }
}

// Sätt användarnamn
export function setUsername(username) {
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return { success: false, error: 'Ogiltigt användarnamn' }
  }

  const data = getLeaderboardData()
  
  // Generera userId om det inte finns
  if (!data.myStats.userId) {
    data.myStats.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  data.myStats.username = username.trim()
  saveLeaderboardData(data)

  return {
    success: true,
    username: username.trim(),
    userId: data.myStats.userId
  }
}

// Uppdatera mina stats (anropas från savingsTracker och achievementService)
export function updateMyStats(updates) {
  const data = getLeaderboardData()
  
  data.myStats = {
    ...data.myStats,
    ...updates
  }

  saveLeaderboardData(data)
  return data.myStats
}

// Lägg till vän via användarnamn (i riktig app skulle detta vara API call)
export function addFriend(friendUsername) {
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

  // I riktig app skulle vi söka efter användaren via API
  // För demo skapar vi en mock friend
  const newFriend = {
    userId: `user_mock_${Date.now()}`,
    username: friendUsername,
    itemsSaved: Math.floor(Math.random() * 50),
    moneySaved: Math.floor(Math.random() * 1000),
    streak: Math.floor(Math.random() * 30),
    addedAt: new Date().toISOString(),
    status: 'active' // 'active', 'pending', 'blocked'
  }

  data.friends.push(newFriend)
  saveLeaderboardData(data)

  return {
    success: true,
    friend: newFriend
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
  TIMEFRAMES
}
