import React from 'react'
import { isPremiumActive } from './premiumService'
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
  const isPremium = isPremiumActive()
  
  // Om premium är aktivt, visa innehållet direkt
  if (isPremium) {
    return <>{children}</>
  }
  
  // Annars visa paywall overlay
  const messages = {
    recipes: {
      icon: '👨‍🍳',
      title: 'Receptförslag kräver Premium',
      description: 'Få smarta receptförslag baserat på vad du har i kylskåpet. Slipp matsvinn och hitta inspiration!',
      features: [
        'Receptförslag från ditt kylskåp',
        'Populära recept från internet',
        'Automatisk inköpslista från recept'
      ]
    },
    notifications: {
      icon: '🔔',
      title: 'Notifikationer kräver Premium',
      description: 'Få påminnelser innan mat går ut. Aldrig mer slängd mat!',
      features: [
        'Push-notiser om utgående varor',
        'Dagliga påminnelser',
        'Anpassningsbara varningar'
      ]
    },
    leaderboard: {
      icon: '🏆',
      title: 'Leaderboard kräver Premium',
      description: 'Tävla mot andra användare och se hur mycket du sparar!',
      features: [
        'Globala topplistan',
        'Jämför med vänner',
        'Veckoliga utmaningar'
      ]
    },
    achievements: {
      icon: '🏅',
      title: 'Achievements kräver Premium',
      description: 'Lås upp badges och följ din progress!',
      features: [
        '25+ unika badges',
        'Brons till Diamant tiers',
        'Spåra dina framsteg'
      ]
    },
    statistics: {
      icon: '📊',
      title: 'Statistik kräver Premium',
      description: 'Se hur mycket pengar och mat du har sparat!',
      features: [
        'Månatlig sparstatistik',
        'Total besparing i kr & kg',
        'Historiska data'
      ]
    },
    item_limit: {
      icon: '📦',
      title: 'Gränsen nådd (10/10 varor)',
      description: 'Uppgradera till Premium för obegränsat antal varor i ditt kylskåp!',
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
              <li key={idx}>
                <span className="checkmark">✓</span> {feat}
              </li>
            ))}
            <li><span className="checkmark">✓</span> Obegränsat antal varor</li>
            <li><span className="checkmark">✓</span> Ingen reklam</li>
            <li><span className="checkmark">✓</span> Familjesynkronisering</li>
          </ul>
        </div>
        
        <div className="premium-feature-pricing">
          <span className="price">29 kr/mån</span>
        </div>
        
        <button 
          className="premium-feature-upgrade-btn"
          onClick={onUpgradeClick}
        >
          Uppgradera till Premium
        </button>
        
        <p className="premium-feature-referral-hint">
          💡 Eller bjud in en vän och få 7 dagar gratis!
        </p>
      </div>
    </div>
  )
}
