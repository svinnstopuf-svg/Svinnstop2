/**
 * Family Premium Service
 * Hanterar family premium pricing logik
 * 
 * Priser:
 * - Individual Premium: 29 kr/mån
 * - Family Premium: 49 kr/mån (alltid samma pris, oavsett tidigare status)
 */

import { getPremiumStatus } from './premiumService'

/**
 * Hämta Family Premium pris
 * @returns {Object} { price, description, alreadyHasFamily }
 */
export function calculateFamilyUpgradePrice() {
  const premiumStatus = getPremiumStatus()
  
  // Om användaren redan har Family Premium
  if (premiumStatus.premiumType === 'family') {
    return {
      price: 0,
      description: 'Du har redan Family Premium!',
      alreadyHasFamily: true
    }
  }
  
  // Alla andra fall: Family Premium kostar 49 kr/mån
  return {
    price: 49,
    description: 'Family Premium - Full access för upp till 5 familjemedlemmar'
  }
}

/**
 * Kolla om användaren kan köpa Family Premium
 * @returns {boolean}
 */
export function canUpgradeToFamily() {
  const premiumStatus = getPremiumStatus()
  return premiumStatus.premiumType !== 'family'
}

/**
 * Få beskrivning av nuvarande premium status
 * @returns {string}
 */
export function getPremiumDescription() {
  const premiumStatus = getPremiumStatus()
  
  if (!premiumStatus.active) {
    return 'Ingen premium'
  }
  
  if (premiumStatus.lifetimePremium) {
    if (premiumStatus.premiumType === 'family') {
      return 'Lifetime Family Premium'
    }
    return 'Lifetime Individual Premium'
  }
  
  if (premiumStatus.premiumType === 'family') {
    return 'Family Premium (49 kr/mån)'
  }
  
  if (premiumStatus.premiumType === 'individual') {
    if (premiumStatus.source === 'referral') {
      const daysLeft = Math.ceil((new Date(premiumStatus.premiumUntil) - new Date()) / (1000 * 60 * 60 * 24))
      return `Individual Premium från referrals (${daysLeft} dagar kvar)`
    }
    return 'Individual Premium (29 kr/mån)'
  }
  
  return 'Premium aktiv'
}
