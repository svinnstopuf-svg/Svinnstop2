import React from 'react'
import { isPremiumActive, hasFamilyPremiumBenefitsSync } from './premiumService'
import { Sparkles, Check, ChefHat, Bell, TrendingUp, Trophy, BarChart3, Package } from 'lucide-react'
import './PremiumFeature.css'

/**
 * PremiumFeature - HOC för att låsa funktioner bakom paywall
 * 
 * Usage:
 * <PremiumFeature feature="recipes">
 *   <RecipeComponent />
 * </PremiumFeature>
 */
export default function PremiumFeature({ 
  feature, 
  children, 
  onUpgradeClick,
  customMessage 
}) {
  // FIX: Kolla både egen premium OCH family premium
  const ownPremium = isPremiumActive()
  const familyBenefits = hasFamilyPremiumBenefitsSync()
  const isPremium = ownPremium || familyBenefits.hasBenefits
  
  // Om premium är aktivt, visa innehållet direkt
  if (isPremium) {
    return <>{children}</>
  }
  
  // Annars visa paywall overlay
  const messages = {
    recipes: {
      icon: <ChefHat size={48} />,
      title: 'Receptförslag kräver Premium',
      description: 'Få smarta receptförslag baserat på vad du har i kylskåpet. Slipp matsvinn och hitta inspiration',
      features: [
        'Receptförslag från ditt kylskåp',
        'Populära recept från internet',
        'Automatisk inköpslista från recept'
      ]
    },
    notifications: {
      icon: <Bell size={48} />,
      title: 'Notifikationer kräver Premium',
      description: 'Få påminnelser innan mat går ut. Aldrig mer slängd mat',
      features: [
        'Push-notiser om utgående varor',
        'Dagliga påminnelser',
        'Anpassningsbara varningar'
      ]
    },
    achievements: {
      icon: <Trophy size={48} />,
      title: 'Achievements kräver Premium',
      description: 'Lås upp badges och följ din progress',
      features: [
        '25+ unika badges',
        'Brons till Diamant tiers',
        'Spåra dina framsteg'
      ]
    },
    statistics: {
      icon: <BarChart3 size={48} />,
      title: 'Statistik kräver Premium',
      description: 'Se hur mycket pengar och mat du har sparat',
      features: [
        'Månatlig sparstatistik',
        'Total besparing i kr & kg',
        'Historiska data'
      ]
    },
    item_limit: {
      icon: <Package size={48} />,
      title: 'Gränsen nådd (10/10 varor)',
      description: 'Uppgradera till Premium för obegränsat antal varor i ditt kylskåp',
      features: [
        'Obegränsat antal varor',
        'Perfekt för stora hushåll',
        'Aldrig mer begränsningar'
      ]
    }
  }
  
  const message = customMessage || messages[feature] || messages.item_limit
  
  return (
    <div className="premium-feature-overlay">
      <div className="premium-feature-content">
        <div className="premium-feature-icon">{message.icon}</div>
        <h2 className="premium-feature-title">{message.title}</h2>
        <p className="premium-feature-description">{message.description}</p>
        
        <div className="premium-feature-list">
          <h3>Premium inkluderar:</h3>
          <ul>
            {message.features.map((feat, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={18} strokeWidth={2} style={{ flexShrink: 0 }} /> {feat}
              </li>
            ))}
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} style={{ flexShrink: 0 }} /> Obegränsat antal varor</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} style={{ flexShrink: 0 }} /> Familjesynkronisering</li>
          </ul>
        </div>
        
        <div className="premium-feature-pricing">
          <div className="pricing-options">
            <div className="pricing-option">
              <span className="plan-label">Individual</span>
              <span className="price">29 kr/mån</span>
            </div>
            <div className="pricing-option highlight">
              <span className="plan-label">Family</span>
              <span className="price">49 kr/mån</span>
              <span className="best-value">BÄST VÄRDE</span>
            </div>
          </div>
        </div>
        
        <button 
          className="premium-feature-upgrade-btn"
          onClick={onUpgradeClick}
        >
          Uppgradera till Premium
        </button>
        
        <p className="premium-feature-referral-hint">
          Eller bjud in en vän och få 7 dagar gratis
        </p>
      </div>
    </div>
  )
}
