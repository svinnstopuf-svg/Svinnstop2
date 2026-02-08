import React, { useState, useEffect } from 'react'
import { leaderboardService, TIMEFRAMES } from './leaderboardService'
import { getSavingsData } from './savingsTracker'
import { achievementService } from './achievementService'
import { Trophy, Users, Medal, Save, DollarSign, Flame, User, Trash2, Award, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from './components/ToastContainer'
import './leaderboard.css'

export default function Leaderboard() {
  const toast = useToast()
  const [view, setView] = useState('leaderboard') // 'leaderboard', 'friends', 'create'
  const [leaderboardData, setLeaderboardData] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [timeframe, setTimeframe] = useState(TIMEFRAMES.ALL_TIME)
  const [friendUsername, setFriendUsername] = useState('')
  const [message, setMessage] = useState(null)
  const [username, setUsernameInput] = useState('')

  useEffect(() => {
    // Vänta på autentisering innan vi laddar data
    const checkAuthAndLoad = () => {
      const data = loadData()
      if (data !== null) {
        return true
      }
      return false
    }
    
    // Försök ladda direkt
    if (!checkAuthAndLoad()) {
      // Om autentisering inte klar, vänta och försök igen
      const authCheckInterval = setInterval(() => {
        if (checkAuthAndLoad()) {
          clearInterval(authCheckInterval)
        }
      }, 100)
      
      return () => clearInterval(authCheckInterval)
    }
    
    // Lyssna på vänners stats i realtid
    let previousFriendCount = leaderboardData?.friends.length || 0
    
    const unsubscribe = leaderboardService.listenToFriendsStats((friends) => {
      setLeaderboardData(prev => ({ ...prev, friends }))
      const board = leaderboardService.getLeaderboard(timeframe)
      setLeaderboard(board)
      
      // Visa notifikation om vänner läggs till eller tas bort
      if (previousFriendCount > 0) {
        if (friends.length < previousFriendCount) {
          toast.info(`👋 En vän har tagits bort från topplistan`)
        } else if (friends.length > previousFriendCount) {
          toast.success(`🎉 En ny vän har lagts till i topplistan!`)
        }
      }
      previousFriendCount = friends.length
    })
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [timeframe])

  function loadData() {
    const data = leaderboardService.getLeaderboardData()
    if (!data) {
      console.log('⏳ Waiting for authentication...')
      return null
    }
    
    const board = leaderboardService.getLeaderboard(timeframe)
    
    // Sync with current savings data
    const savingsData = getSavingsData()
    const achievementData = achievementService.getAchievementData()
    
    leaderboardService.updateMyStats({
      itemsSaved: savingsData.itemsSaved,
      moneySaved: savingsData.totalSaved,
      streak: achievementData.stats.currentStreak || 0
    })
    
    console.log('📊 Loaded leaderboard data:', {
      username: data.myStats.username,
      handle: data.myStats.handle
    })
    
    setLeaderboardData(data)
    setLeaderboard(board)
    return data
  }

  async function handleSetUsername() {
    if (!username.trim()) {
      setMessage({ type: 'error', text: '❌ Ange ett användarnamn' })
      return
    }

    const result = await leaderboardService.setUsername(username)
    
    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Välkommen ${result.username}! Din tag: ${result.handle}` 
      })
      loadData()
      setUsernameInput('')
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  async function handleAddFriend() {
    if (!friendUsername.trim()) {
      setMessage({ type: 'error', text: 'Ange ett användarnamn' })
      return
    }

    const result = await leaderboardService.addFriend(friendUsername)
    
    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `${result.friend.username} har lagts till!` 
      })
      loadData()
      setFriendUsername('')
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  function handleRemoveFriend(userId) {
    const confirmed = confirm('Är du säker på att du vill ta bort denna vän?')
    
    if (confirmed) {
      const result = leaderboardService.removeFriend(userId)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Vän borttagen' })
        loadData()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    }
  }

  function handleGenerateMockFriends() {
    const result = leaderboardService.generateMockFriends(5)
    setMessage({ 
      type: 'success', 
      text: `${result.count} demo-vänner skapade!` 
    })
    loadData()
  }

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const hasUsername = leaderboardData && leaderboardData.myStats.username
  const myRank = leaderboardData ? leaderboardService.getMyRank(timeframe) : { rank: 0, totalUsers: 0 }

  // Rank icon
  function getRankIcon(rank) {
    if (rank === 1) return <Medal size={24} strokeWidth={2} style={{ color: '#FFD700' }} />
    if (rank === 2) return <Medal size={24} strokeWidth={2} style={{ color: '#C0C0C0' }} />
    if (rank === 3) return <Medal size={24} strokeWidth={2} style={{ color: '#CD7F32' }} />
    return `#${rank}`
  }

  // Visa laddning om data ännu inte laddats
  if (!leaderboardData) {
    return (
      <div className="leaderboard-container">
        <div className="username-setup">
          <div className="setup-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={24} /> Laddar...</h3>
            <p>Väntar på autentisering</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard-container">
      {message && (
        <div className={`leaderboard-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Username Setup */}
      {!hasUsername && (
        <div className="username-setup">
          <div className="setup-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={24} /> Välkommen till topplistan!</h3>
            <p>Sätt ditt användarnamn för att börja tävla med vänner</p>
            <p style={{fontSize: '0.85rem', color: '#888'}}>Du får en unik tag (t.ex. Alex-1234) som används för att lägga till vänner</p>
            
            <div className="username-form">
              <input
                type="text"
                placeholder="Ditt användarnamn..."
                value={username}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
              />
              <button className="btn-primary" onClick={handleSetUsername}>
                Fortsätt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {hasUsername && (
        <>
          {/* Navigation */}
          <div className="leaderboard-nav">
            <button
              className={view === 'leaderboard' ? 'active' : ''}
              onClick={() => setView('leaderboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <Trophy size={18} /> Topplista
            </button>
            <button
              className={view === 'friends' ? 'active' : ''}
              onClick={() => setView('friends')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
            >
              <Users size={18} /> Vänner ({leaderboardData.friends.length})
            </button>
          </div>

          {/* Leaderboard View */}
          {view === 'leaderboard' && (
            <div className="leaderboard-view">
              {/* My Rank Card */}
              <div className="my-rank-card">
                <div className="rank-badge">{getRankIcon(myRank.rank)}</div>
                <div className="rank-info">
                  <div className="rank-label">Din placering</div>
                  <div className="rank-value">
                    {myRank.rank} av {myRank.totalUsers}
                  </div>
                </div>
              </div>

              {/* Timeframe Filter */}
              <div className="timeframe-filter">
                <button
                  className={timeframe === TIMEFRAMES.WEEKLY ? 'active' : ''}
                  onClick={() => setTimeframe(TIMEFRAMES.WEEKLY)}
                >
                  Vecka
                </button>
                <button
                  className={timeframe === TIMEFRAMES.MONTHLY ? 'active' : ''}
                  onClick={() => setTimeframe(TIMEFRAMES.MONTHLY)}
                >
                  Månad
                </button>
                <button
                  className={timeframe === TIMEFRAMES.ALL_TIME ? 'active' : ''}
                  onClick={() => setTimeframe(TIMEFRAMES.ALL_TIME)}
                >
                  All-time
                </button>
              </div>

              {/* Leaderboard List */}
              <div className="leaderboard-list">
                {leaderboard.map((user, index) => (
                  <div 
                    key={user.userId || index} 
                    className={`leaderboard-item ${user.isMe ? 'is-me' : ''} ${user.rank <= 3 ? 'top-three' : ''}`}
                  >
                    <div className="item-rank">
                      {getRankIcon(user.rank)}
                    </div>
                    <div className="item-info">
                      <div className="item-username">
                        {user.username || 'Okänd användare'}
                        {user.isMe && <span className="me-badge">Du</span>}
                      </div>
                      <div className="item-stats" style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Save size={14} /> {user.itemsSaved} varor</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} /> {Math.round(user.moneySaved)} kr</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={14} /> {user.streak} dagar</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.length === 1 && (
                <div className="empty-leaderboard">
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Users size={18} /> Lägg till vänner för att se dem på topplistan!</p>
                  <button 
                    className="btn-secondary"
                    onClick={() => setView('friends')}
                  >
                    Lägg till vänner
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Friends View */}
          {view === 'friends' && (
            <div className="friends-view">
              <div className="add-friend-section">
                <h3>Lägg till vän</h3>
                {leaderboardData.myStats.handle && (
                  <p style={{fontSize: '0.85rem', color: '#888', marginBottom: '8px'}}>
                    Din tag: <strong>{leaderboardData.myStats.handle}</strong>
                  </p>
                )}
                <div className="add-friend-form">
                  <input
                    type="text"
                    placeholder="t.ex. alex-1234"
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
                  />
                  <button className="btn-primary" onClick={handleAddFriend}>
                    Lägg till
                  </button>
                </div>
              </div>

              {/* Friends List */}
              {leaderboardData.friends.length > 0 ? (
                <div className="friends-list">
                  <h3>Dina vänner ({leaderboardData.friends.length})</h3>
                  {leaderboardData.friends.map(friend => (
                    <div key={friend.userId} className="friend-card">
                      <div className="friend-avatar"><User size={24} /></div>
                      <div className="friend-info">
                        <div className="friend-username">{friend.username}</div>
                        <div className="friend-stats" style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Save size={12} /> {friend.itemsSaved}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><DollarSign size={12} /> {Math.round(friend.moneySaved)} kr</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Flame size={12} /> {friend.streak}d</span>
                        </div>
                      </div>
                      <button
                        className="remove-friend-btn"
                        onClick={() => handleRemoveFriend(friend.userId)}
                        title="Ta bort vän"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-friends">
                  <div className="empty-icon"><Users size={48} strokeWidth={1.5} /></div>
                  <p>Du har inga vänner ännu</p>
                  <p className="empty-subtitle">
                    Lägg till vänner för att tävla om vem som sparar mest!
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
