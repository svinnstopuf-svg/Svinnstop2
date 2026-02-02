// Family Premium Cache Sync Utility
import { premiumService } from './premiumService'
import { getFamilyData } from './familyService'

/**
 * Force refresh family premium cache
 * Call this after joining/creating a family or when family premium changes
 */
export async function refreshFamilyPremiumCache() {
  const familyData = getFamilyData()
  
  if (!familyData.familyId) {
    // Not in a family - clear cache
    localStorage.removeItem('svinnstop_family_premium_cache')
    console.log('🧹 Family premium cache cleared (not in family)')
    return
  }
  
  try {
    // Check family premium status
    const benefits = await premiumService.hasFamilyPremiumBenefits()
    
    // Update cache
    const cache = {
      active: benefits.hasBenefits && benefits.source === 'family',
      timestamp: Date.now()
    }
    
    localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify(cache))
    
    if (benefits.hasBenefits && benefits.source === 'family') {
      console.log('👨‍👩‍👧‍👦 Family premium cache updated - benefits active')
    } else {
      console.log('ℹ️ Family premium cache updated - no benefits')
    }
    
    return benefits
  } catch (error) {
    console.error('❌ Failed to refresh family premium cache:', error)
    return null
  }
}
