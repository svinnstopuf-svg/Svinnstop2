/**
 * Family Premium Service
 * Hanterar family premium upgrade pricing logik
 * 
 * Priser:
 * - Individual Premium: 29 kr/mån
 * - Family Premium: 49 kr/mån
 * - Family Upgrade (om du redan har Individual): +20 kr/mån
 */

import { getPremiumStatus } from './premiumService'

/**
 * Beräkna pris för family upgrade baserat på nuvarande premium status
 * @returns {Object} { price, description, isUpgrade }
 */
export function calculateFamilyUpgradePrice() {
  const premiumStatus = getPremiumStatus()
  
  // Scenario 1: Ingen premium - köp Family Premium direkt
  if (!premiumStatus.active) {
    return {
      price: 49,
      description: 'Family Premium - Full access för upp till 5 familjemedlemmar',
      isUpgrade: false,
      priceId: 'price_family_full' // Stripe price ID (sätts senare)
    }
  }
  
  // Scenario 2: Har Individual Premium (Stripe eller Referral) - uppgradera till Family
  if (premiumStatus.premiumType === 'individual') {
    // Om Lifetime Premium från referrals
    if (premiumStatus.lifetimePremium && premiumStatus.source === 'referral') {
      return {
        price: 20,
        description: 'Family Upgrade - Du har Lifetime Individual Premium, betala endast 20 kr/mån för family-features',
        isUpgrade: true,
        isLifetimeUpgrade: true,
        priceId: 'price_family_upgrade' // Stripe price ID (sätts senare)
      }
    }
    
    // Om tidsbegränsad Individual Premium (Stripe eller Referral)
    return {
      price: 20,
      description: 'Family Upgrade - Lägg till 20 kr/mån för family-features. När din nuvarande premium tar slut betalar du 49 kr/mån.',
      isUpgrade: true,
      isLifetimeUpgrade: false,
      priceId: 'price_family_upgrade', // Stripe price ID (sätts senare)
      futurePrice: 49 // Pris efter referral premium tar slut
    }
  }
  
  // Scenario 3: Har redan Family Premium
  if (premiumStatus.premiumType === 'family') {
    return {
      price: 0,
      description: 'Du har redan Family Premium!',
      isUpgrade: false,
      alreadyHasFamily: true
    }
  }
  
  // Fallback: Köp Family Premium direkt
  return {
    price: 49,
    description: 'Family Premium - Full access för upp till 5 familjemedlemmar',
    isUpgrade: false,
    priceId: 'price_family_full'
  }
}

/**
 * Kolla om användaren kan uppgradera till Family Premium
 * @returns {boolean}
 */
export function canUpgradeToFamily() {
  const premiumStatus = getPremiumStatus()
  
  // Kan uppgradera om:
  // 1. Ingen premium alls (köp direkt)
  // 2. Har Individual Premium (uppgradera)
  // Kan INTE uppgradera om:
  // - Har redan Family Premium
  
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

/**
 * Kolla om användaren har Lifetime Individual Premium
 * @returns {boolean}
 */
export function hasLifetimeIndividualPremium() {
  const premiumStatus = getPremiumStatus()
  return premiumStatus.lifetimePremium && premiumStatus.premiumType === 'individual'
}
