import React, { useState } from 'react'
import { isPremiumActive, getPremiumStatus, getDaysLeftOfPremium } from './premiumService'
import { calculateFamilyUpgradePrice, getPremiumDescription } from './familyPremiumService'
import { Check, CreditCard, Gift, DollarSign, Globe } from 'lucide-react'
import StripeCheckout from './StripeCheckout'
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
  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const isPremium = isPremiumActive()
  const premiumStatus = getPremiumStatus()
  const daysLeft = getDaysLeftOfPremium()
  const familyPricing = calculateFamilyUpgradePrice()
  
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
            
            <p className="premium-status">
              <strong>{getPremiumDescription()}</strong>
            </p>
            {premiumStatus.lifetimePremium ? (
              <p className="premium-type">
                Tack för ditt fantastiska stöd!
              </p>
            ) : (
              <p className="premium-type">
                {daysLeft} dagar kvar
                {premiumStatus.source === 'referral' && ' (från referrals)'}
                {premiumStatus.source === 'stripe' && ' (prenumeration)'}
              </p>
            )}
            
            {/* Visa Family Upgrade om användaren har Individual Premium */}
            {premiumStatus.premiumType === 'individual' && !showStripeCheckout && (
              <div className="family-upgrade-offer">
                <h3>Uppgradera till Family Premium?</h3>
                <p>{familyPricing.description}</p>
                <div className="family-upgrade-price">
                  <span className="price-amount">{familyPricing.price} kr/mån</span>
                  {familyPricing.futurePrice && (
                    <span className="future-price">Sedan {familyPricing.futurePrice} kr/mån när referral premium tar slut</span>
                  )}
                </div>
                <button 
                  className="upgrade-modal-btn primary"
                  onClick={() => setShowStripeCheckout(true)}
                >
                  Uppgradera till Family
                </button>
              </div>
            )}
            
            {/* Stripe Checkout för Family Upgrade */}
            {showStripeCheckout && premiumStatus.premiumType === 'individual' && (
              <StripeCheckout
                premiumType="family_upgrade"
                onClose={() => setShowStripeCheckout(false)}
              />
            )}
            
            <div className="premium-features-active">
              <h3>Dina Premium-fördelar:</h3>
              <ul>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> AI-genererade recept från dina ingredienser</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Obegränsat antal varor i kylskåpet</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Familjesynkronisering (upp till 5 medlemmar)</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Ingen reklam</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Avancerad statistik & miljöpåverkan</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> 25+ Achievements & badges</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Topplista</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Push-notifikationer</li>
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
          <div className="mission-statement">
            <h2>Uppgradera till Premium</h2>
            <p className="upgrade-mission">Kämpa mot matsvinnet. Spara pengar.</p>
            <p className="upgrade-subtitle">Tillsammans kan vi göra skillnad - både för din plånbok och vår planet</p>
          </div>
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
            <div className="plan-price">
              {familyPricing.isUpgrade && premiumStatus.premiumType === 'individual' ? (
                <>
                  <span className="upgrade-price">{familyPricing.price} kr/mån</span>
                  <span className="upgrade-label">Upgrade</span>
                </>
              ) : (
                '49 kr/mån'
              )}
            </div>
            <div className="plan-desc">
              {familyPricing.isUpgrade && premiumStatus.premiumType === 'individual' ? (
                familyPricing.isLifetimeUpgrade ? 
                  'Lägg till family-features (lifetime)' : 
                  'Lägg till family-features (+20 kr)'
              ) : (
                'Upp till 5 familjemedlemmar'
              )}
            </div>
          </button>
        </div>
        
        <div className="upgrade-features">
          <h3>Premium inkluderar:</h3>
          <ul>
            <li>
              <div>
                <strong>AI-genererade recept från dina ingredienser</strong>
                <p>Få personliga receptförslag baserat på vad du har hemma - inget slöseri</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Obegränsat antal varor i kylskåpet</strong>
                <p>Perfekt för stora hushåll och familjer - inga begränsningar</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Familjesynkronisering i realtid</strong>
                <p>Dela kylskåp och inköpslista med upp till 5 familjemedlemmar</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Ingen reklam</strong>
                <p>100% reklamfri upplevelse</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Avancerad statistik & miljöpåverkan</strong>
                <p>Se dina besparingar i kronor, kg och CO₂-påverkan</p>
              </div>
            </li>
            <li>
              <div>
                <strong>25+ Achievements & exklusiva badges</strong>
                <p>Lås upp unika utmärkelser och visa dina framsteg</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Topplista</strong>
                <p>Tävla mot andra användare och jämför dina framsteg</p>
              </div>
            </li>
            <li>
              <div>
                <strong>Push-notifikationer</strong>
                <p>Smarta påminnelser innan mat går ut</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="upgrade-payment-methods">
          <button
            className={`payment-method-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('stripe')}
          >
            <span className="payment-icon"><CreditCard size={20} /></span>
            <span>Betala med kort</span>
          </button>
          
          <button
            className={`payment-method-btn ${paymentMethod === 'referral' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('referral')}
          >
            <span className="payment-icon"><Gift size={20} /></span>
            <span>Bjud in vänner</span>
          </button>
        </div>
        
        {paymentMethod === 'stripe' && (
          <div className="upgrade-stripe-section">
            <button 
              className="upgrade-modal-btn primary"
              onClick={() => setShowStripeCheckout(true)}
            >
              Fortsätt till betalning
            </button>
            <p className="payment-info">
              Säker betalning via Stripe. Avsluta när som helst.
            </p>
          </div>
        )}
        
        {/* Stripe Checkout Modal */}
        {showStripeCheckout && (
          <StripeCheckout
            premiumType={selectedPlan}
            onClose={() => setShowStripeCheckout(false)}
          />
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
              <div className="referral-tier referral-tier-special">
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
        
        <div className="upgrade-impact">
          <h4>Din insats gör verklig skillnad</h4>
          <div className="impact-stats">
            <div className="impact-stat">
              <div className="impact-icon"><DollarSign size={32} strokeWidth={2} /></div>
              <div className="impact-value">~847 kr</div>
              <div className="impact-label">Genomsnittlig besparing/mån</div>
            </div>
            <div className="impact-stat">
              <div className="impact-icon"><Globe size={32} strokeWidth={2} /></div>
              <div className="impact-value">~12 kg</div>
              <div className="impact-label">Mindre matsvinn/mån</div>
            </div>
          </div>
          <p className="impact-description">
            Varje krona du sparar är mat som inte slungas bort. Premium hjälper dig maximera både din ekonomi och din miljöpåverkan.
          </p>
        </div>
        
        <div className="upgrade-social-proof">
          <p><strong>4.8/5</strong> från användare som kämpar mot matsvinnet</p>
        </div>
      </div>
    </div>
  )
}
