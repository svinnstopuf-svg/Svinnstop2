/**
 * Ad Service - Manages Google AdSense ads display
 * Only shows ads to free users, premium users see no ads
 */

import * as premiumService from './premiumService'

let adsInitialized = false
let adsBlocked = false

/**
 * Initialize Google AdSense
 * Only loads AdSense if user is not premium
 */
export const initializeAds = async () => {
  console.log('🎯 Initializing AdSense...')
  
  // Check if user is premium
  const isPremium = premiumService.isPremiumActive()
  if (isPremium) {
    console.log('✅ Premium user - no ads will be shown')
    return
  }

  // Check if already initialized
  if (adsInitialized) {
    console.log('⚠️ AdSense already initialized')
    return
  }

  try {
    // Check if AdSense script is already loaded
    const existingScript = document.querySelector('script[src*="adsbygoogle.js"]')
    
    if (!existingScript) {
      // Create and inject AdSense script
      const script = document.createElement('script')
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
      script.async = true
      script.crossOrigin = 'anonymous'
      
      // Add your AdSense client ID here when you get it
      // script.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX')
      
      script.onerror = () => {
        console.warn('⚠️ AdSense script failed to load (might be blocked by adblocker)')
        adsBlocked = true
      }
      
      document.head.appendChild(script)
      console.log('✅ AdSense script injected')
    }

    adsInitialized = true
  } catch (error) {
    console.error('❌ Failed to initialize AdSense:', error)
    adsBlocked = true
  }
}

/**
 * Check if ads should be displayed
 * @returns {boolean}
 */
export const shouldShowAds = () => {
  const isPremium = premiumService.isPremiumActive()
  return !isPremium && !adsBlocked
}

/**
 * Push ad to display queue
 * Only pushes if user is not premium
 */
export const pushAd = () => {
  if (!shouldShowAds()) {
    return
  }

  try {
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      window.adsbygoogle.push({})
    }
  } catch (error) {
    console.warn('⚠️ Failed to push ad:', error)
  }
}

/**
 * Check if ads are blocked by adblocker
 * @returns {boolean}
 */
export const areAdsBlocked = () => {
  return adsBlocked
}

/**
 * Refresh ads when premium status changes
 */
export const refreshAdsOnPremiumChange = () => {
  const isPremium = premiumService.isPremiumActive()
  
  if (isPremium) {
    console.log('🎉 User upgraded to premium - hiding all ads')
    // Remove all ad elements from DOM
    const adElements = document.querySelectorAll('.adsbygoogle')
    adElements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.style.display = 'none'
      }
    })
  } else {
    console.log('📢 User downgraded from premium - showing ads')
    // Re-show ad containers
    const adContainers = document.querySelectorAll('.ad-container')
    adContainers.forEach(el => {
      el.style.display = 'block'
    })
  }
}
