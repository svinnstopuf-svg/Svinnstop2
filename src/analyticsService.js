// Analytics Service - Conversion Tracking with Google Analytics GA4
// Tracks critical user actions for optimization

const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX' // TODO: Replace with real GA4 ID

// Initialize Google Analytics
export function initAnalytics() {
  // Check if gtag is already loaded
  if (window.gtag) {
    console.log('✅ Analytics: Already initialized')
    return
  }

  // Load Google Analytics script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  window.gtag = function() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true
  })

  console.log('✅ Analytics: Initialized')
}

// Generic event tracking
export function trackEvent(eventName, eventParams = {}) {
  if (!window.gtag) {
    console.warn('⚠️ Analytics: gtag not loaded')
    return
  }

  window.gtag('event', eventName, eventParams)
  console.log('📊 Analytics:', eventName, eventParams)
}

// --- CONVERSION EVENTS ---

// Track premium upgrade (most important conversion)
export function trackPremiumUpgrade(plan, method) {
  trackEvent('purchase', {
    transaction_id: `premium_${Date.now()}`,
    value: plan === 'family' ? 49 : 29,
    currency: 'SEK',
    items: [{
      item_id: plan,
      item_name: plan === 'family' ? 'Family Premium' : 'Individual Premium',
      price: plan === 'family' ? 49 : 29
    }],
    payment_method: method, // 'stripe' or 'referral'
    premium_plan: plan
  })
  
  // Also track as conversion
  trackEvent('conversion', {
    conversion_type: 'premium_upgrade',
    plan: plan,
    method: method
  })
}

// Track referral usage
export function trackReferralUsed(code) {
  trackEvent('referral_used', {
    referral_code: code,
    event_category: 'engagement',
    event_label: 'viral_growth'
  })
}

// Track referral share
export function trackReferralShare(method) {
  trackEvent('share', {
    method: method, // 'copy', 'whatsapp', 'messenger', etc.
    content_type: 'referral_code',
    event_category: 'engagement'
  })
}

// --- FEATURE USAGE EVENTS ---

// Track AI recipe generation
export function trackAIRecipeGenerated(ingredientCount, mode) {
  trackEvent('ai_recipe_generated', {
    ingredient_count: ingredientCount,
    ingredient_mode: mode, // 'strict', 'staples', 'creative'
    event_category: 'feature_usage',
    premium_feature: true
  })
}

// Track recipe view
export function trackRecipeViewed(recipeSource) {
  trackEvent('recipe_viewed', {
    recipe_source: recipeSource, // 'mine', 'recommended', 'ai'
    event_category: 'feature_usage'
  })
}

// Track item added to inventory
export function trackItemAdded() {
  trackEvent('item_added', {
    event_category: 'engagement'
  })
}

// Track shopping list usage
export function trackShoppingListUsed() {
  trackEvent('shopping_list_used', {
    event_category: 'engagement'
  })
}

// Track family sharing activation
export function trackFamilySharingActivated() {
  trackEvent('family_sharing_activated', {
    event_category: 'engagement',
    premium_feature: true
  })
}

// Track notification activation
export function trackNotificationsEnabled() {
  trackEvent('notifications_enabled', {
    event_category: 'engagement',
    premium_feature: true
  })
}

// --- USER ENGAGEMENT ---

// Track app opened (session start)
export function trackAppOpened() {
  trackEvent('app_opened', {
    event_category: 'engagement'
  })
}

// Track user retention (days active)
export function trackUserRetention(daysActive) {
  if (daysActive === 1) {
    trackEvent('first_day_retention', { event_category: 'retention' })
  } else if (daysActive === 7) {
    trackEvent('week_retention', { event_category: 'retention' })
  } else if (daysActive === 30) {
    trackEvent('month_retention', { event_category: 'retention' })
  }
}

// Track upgrade modal shown
export function trackUpgradeModalShown(trigger) {
  trackEvent('upgrade_modal_shown', {
    trigger: trigger, // '10_item_limit', 'locked_feature', 'profile_cta', etc.
    event_category: 'conversion_funnel'
  })
}

// Track upgrade CTA clicked
export function trackUpgradeCTAClicked(location) {
  trackEvent('upgrade_cta_clicked', {
    location: location, // 'modal', 'profile', 'recipe_tab', etc.
    event_category: 'conversion_funnel'
  })
}

// --- ERRORS & ISSUES ---

// Track errors for debugging
export function trackError(errorType, errorMessage) {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    event_category: 'technical'
  })
}

// --- PAGE VIEWS ---

// Track page/tab navigation
export function trackPageView(pageName) {
  if (!window.gtag) return
  
  window.gtag('event', 'page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: `/${pageName}`
  })
}

export default {
  initAnalytics,
  trackEvent,
  trackPremiumUpgrade,
  trackReferralUsed,
  trackReferralShare,
  trackAIRecipeGenerated,
  trackRecipeViewed,
  trackItemAdded,
  trackShoppingListUsed,
  trackFamilySharingActivated,
  trackNotificationsEnabled,
  trackAppOpened,
  trackUserRetention,
  trackUpgradeModalShown,
  trackUpgradeCTAClicked,
  trackError,
  trackPageView
}
