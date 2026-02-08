import React, { useState, useEffect } from 'react'
import { referralService } from './referralService'
import { Crown, Gift, Share2, Copy, Info, BarChart3, Target, Trophy, Sparkles, Gem, Users, CheckCircle, Clock } from 'lucide-react'
import './referralProgram.css'

export default function ReferralProgram() {
  const [referralData, setReferralData] = useState(null)
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  const [latestReward, setLatestReward] = useState(null)
  const [showEnterCode, setShowEnterCode] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeMessage, setCodeMessage] = useState('')

  useEffect(() => {
    loadReferralData()
    checkUrlForReferralCode()
    
    // Lyssna på referrals i realtid
    const unsubscribeReferrals = referralService.listenToReferrals((referrals) => {
      console.log('🔄 Referrals updated from Firebase:', referrals.length)
      // Reload hela referralData för att få uppdaterade belöningar
      loadReferralData()
    })
    
    return () => {
      if (unsubscribeReferrals && typeof unsubscribeReferrals === 'function') {
        unsubscribeReferrals()
      }
    }
  }, [])

  function loadReferralData() {
    const data = referralService.getReferralData()
    setReferralData(data)
  }

  function checkUrlForReferralCode() {
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    
    if (refCode) {
      setCodeInput(refCode)
      setShowEnterCode(true)
    }
  }

  async function handleEnterCode(e) {
    e.preventDefault()
    
    const result = await referralService.useReferralCode(codeInput)
    
    if (result.success) {
      setCodeMessage(result.message)
      setTimeout(() => {
        setShowEnterCode(false)
        setCodeInput('')
        setCodeMessage('')
        loadReferralData()
      }, 2000)
    } else {
      setCodeMessage(result.error)
    }
  }

  async function handleShare() {
    const { text, url } = referralService.getShareableContent()
    
    // Försök med native sharing API först (mobil)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gå med i Svinnstop!', // Native share, can't add notranslate
          text: text,
          url: url
        })
      } catch (error) {
        // Användaren avbröt eller fel uppstod
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback: kopiera till clipboard
      try {
        await navigator.clipboard.writeText(text)
        alert('Text kopierad! Klistra in den var du vill dela.')
      } catch (error) {
        // Om clipboard också misslyckas, visa texten
        prompt('Kopiera denna text:', text)
      }
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(referralData.myCode)
      .then(() => {
        alert('Kod kopierad!')
      })
      .catch(() => {
        prompt('Din referral kod:', referralData.myCode)
      })
  }

  if (!referralData) {
    return <div>Laddar...</div>
  }
  
  // SECURITY FIX: Kolla att referrals är en array
  const referrals = Array.isArray(referralData.referrals) ? referralData.referrals : []
  const nextMilestone = referralService.getNextMilestone(referrals.length)
  const hasPremium = referralService.hasPremium()

  return (
    <div className="referral-program">
      {/* Premium Status */}
      {hasPremium && (
        <div className="premium-status-banner">
          <div className="premium-icon"><Crown size={32} strokeWidth={2} /></div>
          <div className="premium-text">
            <div className="premium-title">Premium Aktiverad!</div>
            <div className="premium-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {referralData.lifetimePremium 
                ? <><Gem size={16} /> Livstids Premium</> 
                : `Giltigt till ${new Date(referralData.premiumUntil).toLocaleDateString('sv-SE')}`
              }
            </div>
          </div>
        </div>
      )}

      {/* Min Referral Kod */}
      <div className="referral-card my-code-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Gift size={22} /> Din referral kod</h3>
        <p className="card-description">Dela med vänner och tjäna Premium gratis!</p>
        
        <div className="code-display">
          <div className="code-box">{referralData.myCode}</div>
        </div>

        <button className="share-btn" onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <Share2 size={18} /> Dela med vänner
        </button>
      </div>

      {/* Har du en kod? */}
      {!referralData.referredBy && (
        <div className="referral-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Gift size={22} /> Har du en referral kod?</h3>
          {!showEnterCode ? (
            <button 
              className="enter-code-trigger-btn"
              onClick={() => setShowEnterCode(true)}
            >
              Ange kod här
            </button>
          ) : (
            <form onSubmit={handleEnterCode} className="enter-code-form">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="XXXX1234"
                className="code-input"
                maxLength={8}
                autoFocus
              />
              <button type="submit" className="submit-code-btn">
                Aktivera
              </button>
              {codeMessage && (
                <div className="code-message">{codeMessage}</div>
              )}
            </form>
          )}
        </div>
      )}

      {/* Statistik */}
      <div className="referral-card stats-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={22} /> Dina referrals</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{referralData.activeReferrals || 0}</div>
            <div className="stat-label">Aktiva vänner</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">Totalt inbjudna</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{Array.isArray(referralData.rewards) ? referralData.rewards.length : 0}</div>
            <div className="stat-label">Belöningar</div>
          </div>
        </div>
        <p className="activity-requirement-hint" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={16} /> Referrals måste vara aktiva (3 varor, 2 dagar, 3 öppningar) för att räknas
        </p>
      </div>

      {/* Nästa Milestone */}
      {nextMilestone && (
        <div className="referral-card milestone-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={22} /> Nästa belöning</h3>
          <div className="milestone-content">
            <div className="milestone-progress">
              <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(referrals.length / nextMilestone.count) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {referrals.length} / {nextMilestone.count} vänner
            </div>
            </div>
            <div className="milestone-reward">
              <div className="reward-label">{nextMilestone.reward.label}</div>
              <div className="reward-remaining">
                Endast {nextMilestone.remaining} {nextMilestone.remaining === 1 ? 'vän' : 'vänner'} kvar!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Belöningsstruktur */}
      <div className="referral-card rewards-structure-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={22} /> Belöningar</h3>
        <div className="rewards-list">
          <div className={`reward-item ${referrals.length >= 1 ? 'unlocked' : ''}`}>
            <div className="reward-icon"><Sparkles size={20} /></div>
            <div className="reward-info">
              <div className="reward-title">1 vän</div>
              <div className="reward-desc">1 vecka Premium</div>
            </div>
            {referrals.length >= 1 && <div className="reward-check"><CheckCircle size={20} strokeWidth={2} /></div>}
          </div>
          
          <div className={`reward-item ${referrals.length >= 3 ? 'unlocked' : ''}`}>
            <div className="reward-icon"><Gift size={20} /></div>
            <div className="reward-info">
              <div className="reward-title">3 vänner</div>
              <div className="reward-desc">1 månad Premium</div>
            </div>
            {referrals.length >= 3 && <div className="reward-check"><CheckCircle size={20} strokeWidth={2} /></div>}
          </div>
          
          <div className={`reward-item ${referrals.length >= 10 ? 'unlocked' : ''}`}>
            <div className="reward-icon"><Trophy size={20} /></div>
            <div className="reward-info">
              <div className="reward-title">10 vänner</div>
              <div className="reward-desc">3 månader Premium</div>
            </div>
            {referrals.length >= 10 && <div className="reward-check"><CheckCircle size={20} strokeWidth={2} /></div>}
          </div>
          
          <div className={`reward-item ${referralData.lifetimePremium ? 'unlocked' : ''}`}>
            <div className="reward-icon"><Gem size={20} /></div>
            <div className="reward-info">
              <div className="reward-title">50 vänner</div>
              <div className="reward-desc">LIVSTIDS Premium!</div>
            </div>
            {referralData.lifetimePremium && <div className="reward-check"><CheckCircle size={20} strokeWidth={2} /></div>}
          </div>
        </div>
      </div>

      {/* Historik av referrals */}
      {referrals.length > 0 && (
        <div className="referral-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={22} /> Dina inbjudna vänner</h3>
          <div className="referrals-list">
            {referrals.map((ref, index) => (
              <div key={index} className="referral-list-item">
                <div className="referral-number">#{index + 1}</div>
                <div className="referral-date">
                  {new Date(ref.joinedAt).toLocaleDateString('sv-SE')}
                </div>
                <div className={`referral-status ${ref.status === 'active' ? 'active' : 'pending'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {ref.status === 'active' ? <><CheckCircle size={16} /> Aktiv</> : <><Clock size={16} /> Väntar</>}
                </div>
                {ref.status === 'pending' && (
                  <div className="referral-activity-hint">
                    Behöver: {ref.itemsAdded || 0}/3 varor, {ref.daysActive || 0}/2 dagar, {ref.appOpens || 0}/3 öppningar
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
