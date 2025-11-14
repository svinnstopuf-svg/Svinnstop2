import React, { useState, useEffect } from 'react'
import { familyService, ROLES } from './familyService'
import './familySharing.css'

export default function FamilySharing({ items, onFamilyChange }) {
  const [familyData, setFamilyData] = useState(null)
  const [view, setView] = useState('overview') // 'overview', 'create', 'join'
  const [formData, setFormData] = useState({
    familyName: '',
    creatorName: '',
    joinCode: '',
    memberName: ''
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadFamilyData()
    
    // Starta realtime synk om i familj
    const data = familyService.getFamilyData()
    if (data.familyId && data.syncEnabled) {
      const unsubscribe = familyService.startMemberSync((members) => {
        setFamilyData(prev => ({ ...prev, members }))
      })
      return unsubscribe
    }
  }, [])

  function loadFamilyData() {
    const data = familyService.getFamilyData()
    setFamilyData(data)
  }

  async function handleCreateFamily(e) {
    e.preventDefault()
    
    const result = await familyService.createFamily(
      formData.familyName,
      formData.creatorName
    )

    if (result.success) {
      setMessage({
        type: 'success',
        text: `✅ Familjegrupp "${result.familyName}" skapad! Dela koden: ${result.familyCode}`
      })
      loadFamilyData()
      setView('overview')
      setFormData({ familyName: '', creatorName: '', joinCode: '', memberName: '' })
      
      // Trigga Firebase sync
      if (onFamilyChange) {
        onFamilyChange()
      }
    } else {
      setMessage({
        type: 'error',
        text: `❌ ${result.error}`
      })
    }
  }

  async function handleJoinFamily(e) {
    e.preventDefault()
    
    const result = await familyService.joinFamily(
      formData.joinCode,
      formData.memberName
    )

    if (result.success) {
      setMessage({
        type: 'success',
        text: `✅ Du har gått med i "${result.familyName}"!`
      })
      loadFamilyData()
      setView('overview')
      setFormData({ familyName: '', creatorName: '', joinCode: '', memberName: '' })
      
      // Trigga Firebase sync
      if (onFamilyChange) {
        onFamilyChange()
      }
    } else {
      setMessage({
        type: 'error',
        text: `❌ ${result.error}`
      })
    }
  }

  function handleLeaveFamily() {
    const confirmed = confirm('Är du säker på att du vill lämna familjegruppen?')
    
    if (confirmed) {
      const result = familyService.leaveFamily()
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: '✅ Du har lämnat familjegruppen'
        })
        loadFamilyData()
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${result.error}`
        })
      }
    }
  }

  function handleToggleSync() {
    const result = familyService.toggleSync(!familyData.syncEnabled)
    
    if (result.success) {
      setMessage({
        type: 'success',
        text: result.syncEnabled ? '✅ Synk aktiverad' : '⚠️ Synk inaktiverad'
      })
      loadFamilyData()
    }
  }

  function handleShareCode() {
    const shareData = familyService.getShareableCode()
    
    if (!shareData) return

    if (navigator.share) {
      navigator.share({
        title: 'Gå med i min familjegrupp',
        text: shareData.shareText
      }).catch(err => {
        console.log('Share cancelled or failed:', err)
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.shareText)
      setMessage({
        type: 'success',
        text: '📋 Kod kopierad till urklipp!'
      })
    }
  }

  function handleCopyCode() {
    if (familyData.familyCode) {
      navigator.clipboard.writeText(familyData.familyCode)
      setMessage({
        type: 'success',
        text: '📋 Kod kopierad!'
      })
    }
  }

  function handleRemoveMember(memberId) {
    const result = familyService.removeMember(memberId)
    
    if (result.success) {
      setMessage({
        type: 'success',
        text: result.message
      })
      loadFamilyData()
    } else {
      setMessage({
        type: 'error',
        text: `❌ ${result.error}`
      })
    }
  }

  function handleManualSync() {
    const result = familyService.syncItems(items)
    
    if (result.success) {
      setMessage({
        type: 'success',
        text: '🔄 Synk klar!'
      })
      loadFamilyData()
    }
  }

  // Auto-hide message after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [message])

  const isInFamily = familyData && familyData.familyId
  const isOwner = familyData && familyData.myRole === ROLES.OWNER
  const stats = familyData ? familyService.getFamilyStats(items) : null

  return (
    <div className="family-sharing">
      {message && (
        <div className={`family-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Not in a family - Show create/join options */}
      {!isInFamily && view === 'overview' && (
        <div className="family-overview-empty">
          <div className="empty-state">
            <div className="empty-icon">👨‍👩‍👧‍👦</div>
            <h3>Dela med familjen</h3>
            <p>Skapa eller gå med i en familjegrupp för att dela matvarulistan med hela hushållet.</p>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-primary"
              onClick={() => setView('create')}
            >
              🏠 Skapa familjegrupp
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setView('join')}
            >
              👋 Gå med i grupp
            </button>
          </div>

          <div className="benefits-list">
            <h4>Fördelar med Family Sharing:</h4>
            <ul>
              <li>✅ Synkad matvarulista för hela familjen</li>
              <li>✅ Alla kan lägga till och ta bort varor</li>
              <li>✅ Se vad som finns hemma när du handlar</li>
              <li>✅ Färre dubbelköp och mindre svinn</li>
            </ul>
          </div>
        </div>
      )}

      {/* Create Family View */}
      {!isInFamily && view === 'create' && (
        <div className="family-form-container">
          <button 
            className="back-btn"
            onClick={() => setView('overview')}
          >
            ← Tillbaka
          </button>

          <h3>🏠 Skapa familjegrupp</h3>
          <p className="form-description">Skapa en grupp och bjud in familjemedlemmar</p>

          <form onSubmit={handleCreateFamily} className="family-form">
            <div className="form-group">
              <label htmlFor="familyName">Familjenamn</label>
              <input
                type="text"
                id="familyName"
                placeholder="t.ex. Svenssons hushåll"
                value={formData.familyName}
                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="creatorName">Ditt namn</label>
              <input
                type="text"
                id="creatorName"
                placeholder="t.ex. Anna"
                value={formData.creatorName}
                onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              Skapa grupp
            </button>
          </form>
        </div>
      )}

      {/* Join Family View */}
      {!isInFamily && view === 'join' && (
        <div className="family-form-container">
          <button 
            className="back-btn"
            onClick={() => setView('overview')}
          >
            ← Tillbaka
          </button>

          <h3>👋 Gå med i familjegrupp</h3>
          <p className="form-description">Ange koden du fick från familjemedlem</p>

          <form onSubmit={handleJoinFamily} className="family-form">
            <div className="form-group">
              <label htmlFor="joinCode">Familjekod</label>
              <input
                type="text"
                id="joinCode"
                placeholder="6-siffrig kod"
                value={formData.joinCode}
                onChange={(e) => setFormData({ ...formData, joinCode: e.target.value.toUpperCase() })}
                maxLength={6}
                required
              />
              <small>Koden består av 6 bokstäver/siffror</small>
            </div>

            <div className="form-group">
              <label htmlFor="memberName">Ditt namn</label>
              <input
                type="text"
                id="memberName"
                placeholder="t.ex. Erik"
                value={formData.memberName}
                onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              Gå med i grupp
            </button>
          </form>
        </div>
      )}

      {/* In a Family - Show family dashboard */}
      {isInFamily && (
        <div className="family-dashboard">
          {/* Header */}
          <div className="family-header">
            <div className="family-info">
              <h2>🏠 {familyData.familyName}</h2>
              <div className="family-code">
                <span>Kod: <strong>{familyData.familyCode}</strong></span>
                <button 
                  className="copy-btn"
                  onClick={handleCopyCode}
                  title="Kopiera kod"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="role-badge">
              {familyData.myRole === ROLES.OWNER && '👑 Ägare'}
              {familyData.myRole === ROLES.ADMIN && '🛡️ Admin'}
              {familyData.myRole === ROLES.MEMBER && '👤 Medlem'}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="family-stats">
              <div className="stat-box">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalMembers}</div>
                  <div className="stat-label">Medlemmar</div>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalItems}</div>
                  <div className="stat-label">Varor</div>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.syncEnabled ? 'På' : 'Av'}</div>
                  <div className="stat-label notranslate" translate="no">Synk</div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Toggle */}
          <div className="sync-control">
            <div className="sync-info">
              <h4>🔄 Auto-synk</h4>
              <p>Synka automatiskt med familjemedlemmar</p>
              {familyData.lastSyncAt && (
                <small>Senast: {new Date(familyData.lastSyncAt).toLocaleString('sv-SE')}</small>
              )}
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={familyData.syncEnabled}
                onChange={handleToggleSync}
              />
              <span className="slider"></span>
            </label>
          </div>

          {familyData.syncEnabled && (
            <button 
              className="sync-now-btn"
              onClick={handleManualSync}
            >
              🔄 Synka nu
            </button>
          )}

          {/* Members List */}
          <div className="members-section">
            <div className="section-header">
              <h3>👥 Medlemmar ({familyData.members.length})</h3>
              {isOwner && (
                <button 
                  className="share-code-btn"
                  onClick={handleShareCode}
                >
                  ➕ Bjud in
                </button>
              )}
            </div>

            <div className="members-list">
              {familyData.members.map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.role === ROLES.OWNER && '👑'}
                      {member.role === ROLES.ADMIN && '🛡️'}
                      {member.role === ROLES.MEMBER && '👤'}
                    </div>
                    <div className="member-details">
                      <div className="member-name">
                        {member.name}
                        {member.isMe && <span className="me-badge">Du</span>}
                      </div>
                      <div className="member-role">
                        {member.role === ROLES.OWNER && 'Ägare'}
                        {member.role === ROLES.ADMIN && 'Admin'}
                        {member.role === ROLES.MEMBER && 'Medlem'}
                      </div>
                      <small>Gick med {new Date(member.joinedAt).toLocaleDateString('sv-SE')}</small>
                    </div>
                  </div>

                  {!member.isMe && (isOwner || familyData.myRole === ROLES.ADMIN) && (
                    <button
                      className="remove-member-btn"
                      onClick={() => handleRemoveMember(member.id)}
                      title="Ta bort medlem"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leave Family Button */}
          <div className="danger-zone">
            <h4>⚠️ Farlig zon</h4>
            <button 
              className="btn-danger"
              onClick={handleLeaveFamily}
            >
              Lämna familjegrupp
            </button>
            {isOwner && familyData.members.length > 1 && (
              <small>Du måste ta bort alla medlemmar först</small>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
