/**
 * AdBanner Component - Displays Google AdSense banner ads
 * Only visible to free users, hidden for premium users
 */

import React, { useEffect, useRef } from 'react'
import * as adService from './adService'
import * as premiumService from './premiumService'
import './AdBanner.css'

const AdBanner = ({ 
  slot = 'XXXXXXX', // AdSense ad slot ID (replace when you get it)
  format = 'auto',
  responsive = true,
  className = ''
}) => {
  const adRef = useRef(null)
  const isPremium = premiumService.isPremiumActive()

  useEffect(() => {
    // Don't show ads to premium users
    if (isPremium) {
      return
    }

    // Don't show if ads should not be displayed
    if (!adService.shouldShowAds()) {
      return
    }

    // Push ad to AdSense queue
    const timer = setTimeout(() => {
      try {
        if (adRef.current && !adRef.current.hasAttribute('data-ad-initialized')) {
          adRef.current.setAttribute('data-ad-initialized', 'true')
          adService.pushAd()
        }
      } catch (error) {
        console.warn('⚠️ Failed to display ad:', error)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isPremium])

  // Don't render anything for premium users
  if (isPremium) {
    return null
  }

  // Don't render if ads should not be shown
  if (!adService.shouldShowAds()) {
    return null
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense client ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}

export default AdBanner
