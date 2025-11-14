import React, { useState, useEffect } from 'react'
import { leaderboardService, TIMEFRAMES } from './leaderboardService'
import { getSavingsData } from './savingsTracker'
import { achievementService } from './achievementService'
import './leaderboard.css'

export default function Leaderboard() {
  const [view, setView] = useState('leaderboard') // 'leaderboard', 'friends', 'create'
  const [leaderboardData, setLeaderboardData] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [timeframe, setTimeframe] = useState(TIMEFRAMES.ALL_TIME)
  const [friendUsername, setFriendUsername] = useState('')
  const [message, setMessage] = useState(null)
  const [username, setUsernameInput] = useState('')

  useEffect(() => {
    loadData()
    
    // Lyssna på vänners stats i realtid
    const unsubscribe = leaderboardService.listenToFriendsStats((friends) => {
      setLeaderboardData(prev => ({ ...prev, friends }))
      const board = leaderboardService.getLeaderboard(timeframe)
      setLeaderboard(board)
    })
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [timeframe])

  function loadData() {
    const data = leaderboardService.getLeaderboardData()
    const board = leaderboardService.getLeaderboard(timeframe)
    
    // Sync with current savings data
    const savingsData = getSavingsData()
    const achievementData = achievementService.getAchievementData()
    
    leaderboardService.updateMyStats({
      itemsSaved: savingsData.itemsSaved,
      moneySaved: savingsData.totalSaved,
      streak: achievementData.stats.currentStreak || 0
    })
    
    setLeaderboardData(data)
    setLeaderboard(board)
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
        text: `✅ Välkommen ${result.username}! Nu kan du tävla med vänner!` 
      })
      loadData()
      setUsernameInput('')
    } else {
      setMessage({ type: 'error', text: `❌ ${result.error}` })
    }
  }

  async function handleAddFriend() {
    if (!friendUsername.trim()) {
      setMessage({ type: 'error', text: '❌ Ange ett användarnamn' })
      return
    }

    const result = await leaderboardService.addFriend(friendUsername)
    
    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `✅ ${result.friend.username} har lagts till!` 
      })
      loadData()
      setFriendUsername('')
    } else {
      setMessage({ type: 'error', text: `❌ ${result.error}` })
    }
  }

  function handleRemoveFriend(userId) {
    const confirmed = confirm('Är du säker på att du vill ta bort denna vän?')
    
    if (confirmed) {
      const result = leaderboardService.removeFriend(userId)
      
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Vän borttagen' })
        loadData()
      } else {
        setMessage({ type: 'error', text: `❌ ${result.error}` })
      }
    }
  }

  function handleGenerateMockFriends() {
    const result = leaderboardService.generateMockFriends(5)
    setMessage({ 
      type: 'success', 
      text: `✅ ${result.count} demo-vänner skapade!` 
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
  const myRank = leaderboardService.getMyRank(timeframe)

  // Rank emoji
  function getRankEmoji(rank) {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
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
            <h3>🎮 Välkommen till topplistan!</h3>
            <p>Sätt ditt användarnamn för att börja tävla med vänner</p>
            
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
            >
              🏆 Topplista
            </button>
            <button
              className={view === 'friends' ? 'active' : ''}
              onClick={() => setView('friends')}
            >
              👥 Vänner ({leaderboardData.friends.length})
            </button>
          </div>

          {/* Leaderboard View */}
          {view === 'leaderboard' && (
            <div className="leaderboard-view">
              {/* My Rank Card */}
              <div className="my-rank-card">
                <div className="rank-badge">{getRankEmoji(myRank.rank)}</div>
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
                      {getRankEmoji(user.rank)}
                    </div>
                    <div className="item-info">
                      <div className="item-username">
                        {user.username || 'Okänd användare'}
                        {user.isMe && <span className="me-badge">Du</span>}
                      </div>
                      <div className="item-stats">
                        <span>💾 {user.itemsSaved} varor</span>
                        <span>💰 {Math.round(user.moneySaved)} kr</span>
                        <span>🔥 {user.streak} dagar</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.length === 1 && (
                <div className="empty-leaderboard">
                  <p>👥 Lägg till vänner för att se dem på topplistan!</p>
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
                <div className="add-friend-form">
                  <input
                    type="text"
                    placeholder="Användarnamn..."
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
                      <div className="friend-avatar">👤</div>
                      <div className="friend-info">
                        <div className="friend-username">{friend.username}</div>
                        <div className="friend-stats">
                          <span>💾 {friend.itemsSaved}</span>
                          <span>💰 {Math.round(friend.moneySaved)} kr</span>
                          <span>🔥 {friend.streak}d</span>
                        </div>
                      </div>
                      <button
                        className="remove-friend-btn"
                        onClick={() => handleRemoveFriend(friend.userId)}
                        title="Ta bort vän"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-friends">
                  <div className="empty-icon">👥</div>
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
