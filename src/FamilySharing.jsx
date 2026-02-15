import React, { useState, useEffect, useRef } from 'react'
import { familyService, ROLES, getFamilyData } from './familyService'
import { refreshFamilyPremiumCache } from './familyPremiumSync'
import { database } from './firebaseConfig'
import { ref, onValue } from 'firebase/database'
import { Users, Home, UserPlus, CheckCircle, AlertCircle, XCircle, RefreshCw, Copy, Crown, Shield, User, Trash2, Info, Package } from 'lucide-react'
import { useToast } from './components/ToastContainer'
import './familySharing.css'

export default function FamilySharing({ items, onFamilyChange }) {
  const toast = useToast()
  const [familyData, setFamilyData] = useState(null)
  const [view, setView] = useState('overview') // 'overview', 'create', 'join'
  const [formData, setFormData] = useState({
    familyName: '',
    creatorName: '',
    joinCode: '',
    memberName: ''
  })
  const [message, setMessage] = useState(null)
  const [membersKey, setMembersKey] = useState(0) // FIX: Key för att tvinga clean re-render
  const isLeavingRef = useRef(false) // FIX: Flagga för att förhindra uppdateringar efter att man lämnat

  // Initial load
  useEffect(() => {
    loadFamilyData()
    
    // Kolla om vi just lämnade familjegruppen (efter reload)
    const leftFamily = sessionStorage.getItem('svinnstop_left_family')
    if (leftFamily) {
      sessionStorage.removeItem('svinnstop_left_family')
      toast.success('✅ Du har lämnat familjegruppen')
    }
  }, [])
  
  // ENKEL realtids-lyssnare på familjemedlemmar (precis som inköpslistan)
  useEffect(() => {
    // Vänta tills familyData är laddad och har ett familyId
    if (!familyData?.familyId || !familyData?.syncEnabled) {
      console.log('👂 FamilySharing: Skipping listener - no familyId or sync disabled')
      return
    }
    
    console.log('👂 FamilySharing: Starting DIRECT Firebase listener for members on', familyData.familyId)
    const myMemberId = familyData.myMemberId
    let previousMemberCount = familyData.members?.length || 0
    let previousMemberIds = (familyData.members || []).map(m => m.id).sort().join(',')
    let isFirstLoad = true
    
    const membersRef = ref(database, `families/${familyData.familyId}/members`)
    const unsubscribe = onValue(membersRef, (snap) => {
      // FIX: Ignorera uppdateringar om vi håller på att lämna
      if (isLeavingRef.current) {
        console.log('🚫 FamilySharing: Ignoring update - user is leaving')
        return
      }
      
      const membersObj = snap.val() || {}
      const members = Object.values(membersObj)
      
      console.log('🔥 FamilySharing: Firebase members update:', members.length, 'members')
      
      // Kolla om JAG har blivit borttagen
      const iAmStillMember = members.some(m => m.id === myMemberId)
      if (!iAmStillMember && myMemberId) {
        console.log('⚠️ You have been removed from the family - reloading')
        // Rensa localStorage och ladda om
        localStorage.removeItem('svinnstop_family_data')
        localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ active: false, timestamp: Date.now() }))
        alert('⚠️ Du har tagits bort från familjegruppen')
        window.location.reload()
        return
      }
      
      // Uppdatera medlemslistan med isMe-flagga
      const updatedMembers = members.map(m => ({ ...m, isMe: m.id === myMemberId }))
      
      // Hitta min nya roll (kan ha ändrats om jag blev ägare)
      const myMemberData = members.find(m => m.id === myMemberId)
      const myNewRole = myMemberData?.role || familyData.myRole
      
      // LOGG: Visa om rollen ändrades
      if (myNewRole !== familyData.myRole) {
        console.log('👑 FamilySharing: Role changed from', familyData.myRole, 'to', myNewRole)
      }
      console.log('👤 FamilySharing: My data:', { myMemberId, myNewRole, members: members.map(m => ({ id: m.id, name: m.name, role: m.role })) })
      
      // Uppdatera localStorage
      const updatedLocalData = {
        ...familyData,
        members: updatedMembers,
        myRole: myNewRole,
        lastSyncAt: new Date().toISOString()
      }
      localStorage.setItem('svinnstop_family_data', JSON.stringify(updatedLocalData))
      
      // Uppdatera state DIREKT (som inköpslistan gör)
      setFamilyData(prev => ({
        ...prev,
        members: updatedMembers,
        myRole: myNewRole
      }))
      
      // FIX: Öka key för att tvinga React att göra clean re-render (undviker Google Translate-konflikt)
      setMembersKey(prev => prev + 1)
      
      // Visa toast om någon lämnade/gick med (inte första laddningen)
      if (!isFirstLoad) {
        const currentMemberIds = members.map(m => m.id).sort().join(',')
        if (currentMemberIds !== previousMemberIds) {
          if (members.length < previousMemberCount) {
            toast.info('👋 En medlem har lämnat familjegruppen')
          } else if (members.length > previousMemberCount) {
            toast.success('🎉 En ny medlem har gått med i familjegruppen!')
          }
          previousMemberIds = currentMemberIds
        }
        previousMemberCount = members.length
      }
      isFirstLoad = false
    })
    
    return () => {
      console.log('👋 FamilySharing: Stopping Firebase listener')
      unsubscribe()
    }
  }, [familyData?.familyId, familyData?.syncEnabled]) // Kör om när familyId eller sync ändras

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
      
      // Uppdatera family premium cache
      refreshFamilyPremiumCache()
        .then(() => console.log('✅ Family premium cache refreshed after create'))
        .catch(err => console.warn('⚠️ Could not refresh family premium cache:', err))
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
      
      // Uppdatera family premium cache och kolla om familjen har premium
      refreshFamilyPremiumCache()
        .then((benefits) => {
          console.log('✅ Family premium cache refreshed after join')
          
          // Visa meddelande om familjen har Family Premium
          if (benefits && benefits.hasBenefits && benefits.source === 'family') {
            setTimeout(() => {
              toast.success('🎉 Välkommen till familjen! Familjen har Family Premium och du har nu tillgång till alla premium-funktioner!')
            }, 500)
          }
        })
        .catch(err => console.warn('⚠️ Could not refresh family premium cache:', err))
    } else {
      setMessage({
        type: 'error',
        text: `❌ ${result.error}`
      })
    }
  }

  async function handleLeaveFamily() {
    const confirmed = confirm('Är du säker på att du vill lämna familjegruppen?')
    
    if (confirmed) {
      // FIX: Sätt flagga INNAN vi lämnar för att förhindra Firebase-uppdateringar
      isLeavingRef.current = true
      
      const result = await familyService.leaveFamily()
      
      if (result.success) {
        // Rensa family premium cache
        localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify({ active: false, timestamp: Date.now() }))
        
        // Spara flagga för att visa meddelande efter reload
        sessionStorage.setItem('svinnstop_left_family', 'true')
        
        // Ladda om sidan DIREKT för att rensa alla states och listeners
        window.location.reload()
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

  async function handleRemoveMember(memberId) {
    const result = await familyService.removeMember(memberId)
    
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
  
  async function handleTransferOwnership(memberId, memberName) {
    const result = await familyService.transferOwnership(memberId)
    
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
    <div className="family-sharing notranslate" translate="no" suppressHydrationWarning>
      {message && (
        <div className={`family-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Not in a family - Show create/join options */}
      {!isInFamily && view === 'overview' && (
        <div className="family-overview-empty">
          <div className="empty-state">
            <div className="empty-icon"><Users size={64} strokeWidth={1.5} /></div>
            <h3>Dela med familjen</h3>
            <p>Skapa eller gå med i en familjegrupp för att dela matvarulistan med hela hushållet.</p>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-primary"
              onClick={() => setView('create')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <Home size={20} /> Skapa familjegrupp
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setView('join')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <UserPlus size={20} /> Gå med i grupp
            </button>
          </div>

          <div className="benefits-list">
            <h4>Fördelar med Family Sharing:</h4>
            <ul>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} strokeWidth={2} /> Synkad matvarulista för hela familjen</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} strokeWidth={2} /> Alla kan lägga till och ta bort varor</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} strokeWidth={2} /> Se vad som finns hemma när du handlar</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} strokeWidth={2} /> Färre dubbelköp och mindre svinn</li>
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

          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Home size={24} /> Skapa familjegrupp</h3>
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

          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UserPlus size={24} /> Gå med i familjegrupp</h3>
          <p className="form-description">Ange koden du fick från familjemedlem</p>
          <div className="form-info-box">
            <span className="info-icon"><Info size={18} /></span>
            <span>Max 5 medlemmar per familjegrupp</span>
          </div>

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
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Home size={24} /> {familyData.familyName}</h2>
              <div className="family-code">
                <span>Kod: <strong>{familyData.familyCode}</strong></span>
                <button 
                  className="copy-btn"
                  onClick={handleCopyCode}
                  title="Kopiera kod"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="role-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {familyData.myRole === ROLES.OWNER && <><Crown size={16} /> Ägare</>}
              {familyData.myRole === ROLES.ADMIN && <><Shield size={16} /> Admin</>}
              {familyData.myRole === ROLES.MEMBER && <><User size={16} /> Medlem</>}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="family-stats">
              <div className="stat-box">
                <div className="stat-icon"><Users size={24} strokeWidth={2} /></div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalMembers}</div>
                  <div className="stat-label">Medlemmar</div>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon"><Package size={24} strokeWidth={2} /></div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalItems}</div>
                  <div className="stat-label">Varor</div>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon"><RefreshCw size={24} strokeWidth={2} /></div>
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
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><RefreshCw size={20} /> Auto-synk</h4>
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
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <RefreshCw size={18} /> Synka nu
            </button>
          )}

          {/* Members List */}
          <div className="members-section" key={`members-section-${membersKey}`}>
            <div className="section-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={22} /> Medlemmar ({familyData.members.length}/5)</h3>
              {isOwner && (
                <button 
                  className="share-code-btn"
                  onClick={handleShareCode}
                  disabled={familyData.members.length >= 5}
                  title={familyData.members.length >= 5 ? 'Familjen är full (max 5 medlemmar)' : 'Bjud in medlem'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={16} /> Bjud in
                </button>
              )}
            </div>
            {familyData.members.length >= 5 && (
              <div className="form-info-box warning">
                <span className="info-icon"><AlertCircle size={18} /></span>
                <span>Familjen är full. Max 5 medlemmar tillåts.</span>
              </div>
            )}

            <div className="members-list notranslate" translate="no">
              {familyData.members.map(member => (
                <div 
                  key={`member-${member.id}`} 
                  className={`member-card ${!member.isMe && isOwner ? 'clickable' : ''}`}
                  onClick={() => {
                    if (!member.isMe && isOwner) {
                      // Show transfer ownership option
                      const shouldTransfer = confirm(
                        `${member.name}\n\n` +
                        `Roll: ${member.role === ROLES.OWNER ? 'Ägare' : member.role === ROLES.ADMIN ? 'Admin' : 'Medlem'}\n\n` +
                        `Vill du överföra ägandet till ${member.name}?\n\n` +
                        `Du kommer bli vanlig medlem och ${member.name} blir ny ägare.`
                      )
                      if (shouldTransfer) {
                        handleTransferOwnership(member.id, member.name)
                      }
                    }
                  }}
                >
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.role === ROLES.OWNER && <Crown size={20} />}
                      {member.role === ROLES.ADMIN && <Shield size={20} />}
                      {member.role === ROLES.MEMBER && <User size={20} />}
                    </div>
                    <div className="member-details">
                      <div className="member-name notranslate" translate="no">
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

                  {/* Papperskorg - för dig själv = lämna, för andra = ta bort (endast ägare) */}
                  {(member.id === familyData.myMemberId || member.isMe) ? (
                    <button
                      className="remove-member-btn leave-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLeaveFamily()
                      }}
                      title="Lämna familjegrupp"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : isOwner && (
                    <button
                      className="remove-member-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Är du säker på att du vill ta bort ${member.name} från familjegruppen?`)) {
                          handleRemoveMember(member.id)
                        }
                      }}
                      title="Ta bort medlem"
                    >
                      <Trash2 size={18} />
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
              <small>Ägandet överförs automatiskt till nästa medlem</small>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
