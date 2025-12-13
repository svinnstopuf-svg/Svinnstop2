import React, { useState } from 'react'
import { isPremiumActive, getPremiumStatus, getDaysLeftOfPremium } from './premiumService'
import './UpgradeModal.css'

/**
 * UpgradeModal - Modal för att uppgradera till Premium
 * 
 * Visar:
 * - Premium features
 * - Pris (29 kr/mån)
 * - Stripe betalning (kommer snart)
 * - Referral alternativ
 */
export default function UpgradeModal({ isOpen, onClose, onReferralClick }) {
  const [paymentMethod, setPaymentMethod] = useState('stripe') // 'stripe' or 'referral'
  const [selectedPlan, setSelectedPlan] = useState('family') // 'individual' or 'family'
  const isPremium = isPremiumActive()
  const premiumStatus = getPremiumStatus()
  const daysLeft = getDaysLeftOfPremium()
  
  if (!isOpen) return null
  
  // Om användaren redan har premium, visa status
  if (isPremium) {
    return (
      <div className="upgrade-modal-overlay">
        <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
          <button 
            className="upgrade-modal-close" 
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onClose()
            }}
            type="button"
          >
            ×
          </button>
          
          <div className="upgrade-modal-premium-active">
            <h2>Du har Premium!</h2>
            
            {premiumStatus.lifetimePremium ? (
              <p className="premium-status">
                <strong>Lifetime Premium</strong> - Tack för ditt fantastiska stöd!
              </p>
            ) : (
              <p className="premium-status">
                Din premium är aktiv i <strong>{daysLeft} dagar</strong>
                {premiumStatus.source === 'referral' && ' (från referrals)'}
                {premiumStatus.source === 'stripe' && ' (prenumeration)'}
              </p>
            )}
            
            <div className="premium-features-active">
              <h3>Dina Premium-fördelar:</h3>
              <ul>
                <li>✓ Obegränsat antal varor</li>
                <li>✓ Ingen reklam</li>
                <li>✓ Receptförslag från kylskåp</li>
                <li>✓ Familjesynkronisering</li>
                <li>✓ Achievements & badges</li>
                <li>✓ Statistik & besparingar</li>
                <li>✓ Leaderboard</li>
                <li>✓ Push-notifikationer</li>
              </ul>
            </div>
            
            {!premiumStatus.lifetimePremium && (
              <p className="premium-extend-hint">
                Bjud in fler vänner för att förlänga din premium
              </p>
            )}
            
            <button className="upgrade-modal-btn secondary" onClick={onClose}>
              Stäng
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Premium upgrade modal
  return (
    <div className="upgrade-modal-overlay">
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="upgrade-modal-close" 
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onClose()
          }}
          type="button"
        >
          ×
        </button>
        
        <div className="upgrade-modal-header">
          <h2>Uppgradera till Premium</h2>
          <p className="upgrade-subtitle">Få ut maximalt av Svinnstop</p>
        </div>
        
        {/* Plan Selection */}
        <div className="plan-selection">
          <button
            className={`plan-option ${selectedPlan === 'individual' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('individual')}
          >
            <div className="plan-header">
              <span className="plan-name">Individual</span>
            </div>
            <div className="plan-price">29 kr/mån</div>
            <div className="plan-desc">För dig själv</div>
          </button>
          
          <button
            className={`plan-option ${selectedPlan === 'family' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('family')}
          >
            <div className="plan-header">
              <span className="plan-name">Family</span>
              <span className="plan-badge">BÄST VÄRDE</span>
            </div>
            <div className="plan-price">49 kr/mån</div>
            <div className="plan-desc">Upp till 5 familjemedlemmar</div>
          </button>
        </div>
        
        <div className="upgrade-features">
          <h3>Premium inkluderar:</h3>
          <ul>
            <li>
              <div>
                <strong>Obegränsat antal varor</strong>
                <p>Perfekt för stora hushåll och familjer</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Ingen reklam</strong>
                <p>Ren och smidig upplevelse</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Receptförslag från kylskåp</strong>
                <p>Få inspiration och använd vad du har</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Familjesynkronisering</strong>
                <p>Dela kylskåp och inköpslista i realtid</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Achievements & Badges</strong>
                <p>Lås upp 25+ unika utmärkelser</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Statistik & Besparingar</strong>
                <p>Se hur mycket du sparar i kr & kg</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Leaderboard</strong>
                <p>Tävla mot andra och jämför framsteg</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Push-notifikationer</strong>
                <p>Påminnelser innan mat går ut</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="upgrade-payment-methods">
          <button
            className={`payment-method-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('stripe')}
          >
            <span className="payment-icon">💳</span>
            <span>Betala med kort</span>
          </button>
          
          <button
            className={`payment-method-btn ${paymentMethod === 'referral' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('referral')}
          >
            <span className="payment-icon">🎁</span>
            <span>Bjud in vänner</span>
          </button>
        </div>
        
        {paymentMethod === 'stripe' && (
          <div className="upgrade-stripe-section">
            <button className="upgrade-modal-btn primary" disabled>
              Betalningar kommer snart
            </button>
            <p className="payment-coming-soon">
              Vi arbetar på att aktivera betalningar. Under tiden kan du bjuda in vänner för att få premium gratis!
            </p>
          </div>
        )}
        
        {paymentMethod === 'referral' && (
          <div className="upgrade-referral-section">
            <h4>Få Premium gratis</h4>
            <div className="referral-tiers">
              <div className="referral-tier">
                <div>
                  <strong>1 vän</strong>
                  <p>7 dagar Premium</p>
                </div>
              </div>
              <div className="referral-tier">
                <div>
                  <strong>3 vänner</strong>
                  <p>30 dagar Premium</p>
                </div>
              </div>
              <div className="referral-tier">
                <div>
                  <strong>10 vänner</strong>
                  <p>90 dagar Premium</p>
                </div>
              </div>
              <div className="referral-tier highlight">
                <div>
                  <strong>50 vänner</strong>
                  <p>Lifetime Premium</p>
                </div>
              </div>
            </div>
            
            <button 
              className="upgrade-modal-btn primary"
              onClick={() => {
                onClose()
                if (onReferralClick) onReferralClick()
              }}
            >
              Börja bjuda in vänner
            </button>
          </div>
        )}
        
        <div className="upgrade-social-proof">
          <p><strong>4.8/5</strong> från användare</p>
          <p>Genomsnittlig besparing: <strong>847 kr/mån</strong></p>
        </div>
      </div>
    </div>
  )
}
