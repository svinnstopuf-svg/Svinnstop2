import React, { useEffect, useMemo, useState, useRef } from 'react'
import { ShoppingCart, Home, ChefHat, User, Undo2, Sparkles, UserCircle2, Sun, Moon, Bell, BellOff, TrendingUp, Trophy, Users, Gift, HelpCircle, Bot, X, AlertTriangle, Clock, Flame, UtensilsCrossed, BarChart3, Search, Zap, Package, ShoppingBag, Lock, CreditCard } from 'lucide-react';
import { suggestRecipes, recipes } from './recipes'
import { fetchPopularRecipes } from './recipeAPI'
import ExpirySettings from './ExpirySettings'
import ShoppingList from './ShoppingList'
import GuideWelcome from './GuideWelcome'
import GuideBadge from './GuideBadge'
import NotificationPrompt from './NotificationPrompt'
import AdvancedStats from './AdvancedStats'
import WeeklyEmailSignup from './WeeklyEmailSignup'
import ReferralProgram from './ReferralProgram'
import AchievementsPage from './AchievementsPage'
import FamilySharing from './FamilySharing'
import Leaderboard from './Leaderboard'
import ManageSubscriptionPage from './ManageSubscriptionPage'
import FAQ from './FAQ'
import ConfirmDialog from './ConfirmDialog'
import UpgradeModal from './UpgradeModal'
import PremiumFeature from './PremiumFeature'
import AuthModal from './components/AuthModal'
import AdBanner from './AdBanner'
import AIRecipeGenerator from './AIRecipeGenerator'
import AchievementCelebration from './AchievementCelebration'
import OfflineBanner from './components/OfflineBanner'
import Spinner from './components/Spinner'
import { useToast } from './components/ToastContainer'
import { getSavedAIRecipes, deleteAIRecipe } from './aiRecipeService'
import * as adService from './adService'
import { calculateSmartExpiryDate, getSmartProductCategory, learnFromUserAdjustment } from './smartExpiryAI'
import { searchFoods, getExpiryDateSuggestion, learnIngredientsFromRecipe } from './foodDatabase'
import { setCustomExpiryRule } from './userItemsService'
import { notificationService } from './notificationService'
import { savingsTracker } from './savingsTracker'
import { achievementService } from './achievementService'
import { syncInventoryToFirebase, listenToInventoryChanges } from './inventorySync'
import { getFamilyData } from './familyService'
import { initAuth, auth, signOut } from './firebaseConfig'
import { referralService } from './referralService'
import { premiumService } from './premiumService'
import { leaderboardService } from './leaderboardService'
import { sortInventoryItems } from './sortingUtils'
import { userItemsService } from './userItemsService'
import { syncUserItemsToFirebase, syncCustomExpiryRulesToFirebase, listenToCustomExpiryRulesChanges } from './shoppingListSync'
import { performInitialUserSync, syncInventoryToUser, syncAchievementsToUser, syncSavingsToUser, listenToUserInventoryChanges, mergeWithTimestamp } from './userDataSync'
import { exportCustomExpiryRules, importCustomExpiryRules } from './userItemsService'
import * as analytics from './analyticsService'
import './mobile.css'
import './newFeatures.css'
import './premiumRequired.css'

// Pro-svenska med Google Translate samarbete
// Låt Google göra jobbet åt oss!

// Enkla svenska funktioner utan textmanipulering
function formatDaysLeft(days) {
  return days === 1 ? '1 dag kvar' : `${days} dagar kvar`
}

function svDifficultyLabel(raw) {
  const v = String(raw || '').toLowerCase()
  if (v === 'easy' || v === 'lätt') return 'Lätt'
  if (v === 'medium' || v === 'medel') return 'Medel'
  if (v === 'hard' || v === 'svår') return 'Svår'
  return 'Medel'
}

function svDifficultyClass(raw) {
  const v = String(raw || '').toLowerCase()
  if (v === 'easy' || v === 'lätt') return 'lätt'
  if (v === 'medium' || v === 'medel') return 'medel'
  if (v === 'hard' || v === 'svår') return 'svår'
  return 'medel'
}

function svTimeLabel(raw) {
  const s = String(raw || '')
  return s
    .replace(/\bminutes\b/gi, 'minuter')
    .replace(/\bminute\b/gi, 'minut')
    .replace(/\bhours\b/gi, 'timmar')
    .replace(/\bhour\b/gi, 'timme')
}

function daysUntil(dateStr) {
  // Räkna kalenderdagar: 27 dec - 13 dec = 14 dagar
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, month, day] = dateStr.split('-').map(Number)
  const expiryDate = new Date(year, month - 1, day)
  expiryDate.setHours(0, 0, 0, 0)
  const diff = Math.round((expiryDate - today) / (1000 * 60 * 60 * 24))
  return diff
}


// Hämta föreslagen enhetsnyckel för antal-etikett baserat på varans namn
export function getSuggestedUnitKey(itemName) {
  if (!itemName || typeof itemName !== 'string' || !itemName.trim()) return 'defaultUnit'
  
  const name = itemName.toLowerCase()
  
  // Stöd för flerspråkig vardetektering
  const isLiquid = name.includes('milk') || name.includes('mjölk') || name.includes('milch') ||
                   name.includes('juice') || name.includes('saft') || name.includes('saft') ||
                   name.includes('water') || name.includes('vatten') || name.includes('wasser') ||
                   name.includes('oil') || name.includes('olja') ||
                   name.includes('cream') || name.includes('grädde') || name.includes('sahne') ||
                   name.includes('soup') || name.includes('soppa') || name.includes('suppe')
  
  const isBread = name.includes('bread') || name.includes('bröd') || name.includes('brot') ||
                  name.includes('bun') || name.includes('bulle') || name.includes('brötchen')
  
  const isMeat = name.includes('chicken') || name.includes('kyckling') || name.includes('hähnchen') ||
                 name.includes('beef') || name.includes('nötkött') || name.includes('rindfleisch') ||
                 name.includes('meat') || name.includes('kött') || name.includes('fleisch')
  
  const isEgg = name.includes('egg') || name.includes('ägg') || name.includes('ei')
  
  if (isLiquid) return 'liters'
  if (isBread) return 'loaves'
  if (isMeat) return 'kg'
  if (isEgg) return 'pieces'
  
  // Mejeri (fast)
  if (name.includes('cheese') || name.includes('ost') || name.includes('käse') ||
      name.includes('butter') || name.includes('smör') || name.includes('butter') ||
      name.includes('yogurt') || name.includes('yoghurt') || name.includes('joghurt')) {
    return 'grams'
  }
  
  // Ris/Pasta/Sädesslag - använd kg för större förpackningar
  if (name.includes('rice') || name.includes('ris') || name.includes('reis') ||
      name.includes('pasta') || name.includes('pasta') || name.includes('nudeln') ||
      name.includes('flour') || name.includes('mjöl') || name.includes('mehl')) {
    return 'kg'
  }
  
  // Konserver
  if (name.includes('can') || name.includes('burk') || name.includes('dose') ||
      name.includes('tin') || name.includes('konserv') || name.includes('büchse')) {
    return 'cans'
  }
  
  // Standard
  return 'pieces'
}

const STORAGE_KEY = 'svinnstop_items'
const THEME_KEY = 'svinnstop_theme'

// Svensk enhets-karta (används för UI-tips och lagrad enhet)
export const SV_UNITS = {
  liters: 'liter',
  loaves: 'limpor',
  kg: 'kg',
  grams: 'gram',
  pieces: 'stycken',
  cans: 'burkar',
  defaultUnit: 'st'
}

// Förkortningar för enheter
export function abbreviateUnit(unit) {
  if (!unit) return ''
  
  const unitLower = unit.toLowerCase()
  const abbreviations = {
    'stycken': 'st',
    'stycke': 'st',
    'liter': 'L',
    'limpor': 'st',
    'limpa': 'st',
    'kilogram': 'kg',
    'gram': 'g',
    'burkar': 'st',
    'burk': 'st',
    'milliliter': 'ml',
    'centiliter': 'cl',
    'deciliter': 'dl',
    'skivor': 'st',
    'skiva': 'st',
    'klyftor': 'st',
    'klyfta': 'st',
    'matskedar': 'msk',
    'matsked': 'msk',
    'teskedar': 'tsk',
    'tesked': 'tsk'
  }
  
  return abbreviations[unitLower] || unit
}

// SECURITY FIX: Sync referral premium to main premium service
function syncReferralPremiumToMain() {
  try {
    const referralData = referralService.getReferralData()
    
    // Check if user has premium from referrals
    if (referralData.lifetimePremium) {
      console.log('🔒 SECURITY: Syncing lifetime premium from referrals')
      premiumService.activateLifetimePremium('referral')
    } else if (referralData.premiumUntil) {
      const expiryDate = new Date(referralData.premiumUntil)
      const now = new Date()
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
      
      if (daysLeft > 0) {
        console.log(`🔒 SECURITY: Syncing ${daysLeft} days of premium from referrals`)
        premiumService.activatePremium(daysLeft, 'referral')
      } else {
        console.log('⏰ Referral premium has expired')
      }
    }
  } catch (error) {
    console.error('❌ Failed to sync referral premium:', error)
  }
}

// Helper function: Check if user has premium (own OR family)
function hasAnyPremium() {
  // Quick synchronous check using cached data
  const benefits = premiumService.hasFamilyPremiumBenefitsSync()
  return benefits.hasBenefits
}

export default function App() {
  const toast = useToast()
  
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ 
    name: '', 
    quantity: 1, 
    expiresAt: '' 
  })
  const [filter, setFilter] = useState('all')
  const [theme, setTheme] = useState('dark')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [actionHistory, setActionHistory] = useState([])
  const [canUndo, setCanUndo] = useState(false)
  const [showExpirySettings, setShowExpirySettings] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [foodSuggestions, setFoodSuggestions] = useState([])
  const [showFoodSuggestions, setShowFoodSuggestions] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [pendingShoppingItem, setPendingShoppingItem] = useState(null)
  const [activeTab, setActiveTab] = useState('fridge')
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkExpiryDate, setBulkExpiryDate] = useState('')
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [recipeTab, setRecipeTab] = useState('mine') // 'mine' eller 'recommended'
  const [internetRecipes, setInternetRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [recipeCategory, setRecipeCategory] = useState('alla') // Filter för receptkategorier
  const [recipesLoaded, setRecipesLoaded] = useState(false) // FIX: Spåra om recept har laddats
  const [showGuideWelcome, setShowGuideWelcome] = useState(false) // Välkomstdialog
  const [guideActive, setGuideActive] = useState(false) // Om guiden är aktiv
  const [guideStep, setGuideStep] = useState(0) // Vilken guide-steg användaren är på
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false) // Notification permission prompt
  const [familySyncTrigger, setFamilySyncTrigger] = useState(0) // Trigger för att starta Firebase sync
  const [isAuthReady, setIsAuthReady] = useState(false) // Väntar på Firebase auth
  const [showInventoryDialog, setShowInventoryDialog] = useState(false) // Dialog för manuell kylskåpsvara
  const [pendingInventoryItem, setPendingInventoryItem] = useState(null)
  const [selectedInventoryUnit, setSelectedInventoryUnit] = useState('st')
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState('övrigt')
  const [currentDisplayUnit, setCurrentDisplayUnit] = useState('st') // Aktuell enhet som visas
  const [userSelectedUnit, setUserSelectedUnit] = useState(false) // Flagga om användaren manuellt valt enhet
  const [isInitialInventoryLoad, setIsInitialInventoryLoad] = useState(true) // Flagga för initial laddning
  const [showUpgradeModal, setShowUpgradeModal] = useState(false) // Premium upgrade modal
  const [shouldClearForm, setShouldClearForm] = useState(false) // Flagga för att rensa formulär
  const [showAIRecipeGenerator, setShowAIRecipeGenerator] = useState(false) // AI Recipe Generator modal
  const [savedAIRecipes, setSavedAIRecipes] = useState([]) // Sparade AI-recept
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState(null) // Valt sparat recept att visa
  const [showAuthModal, setShowAuthModal] = useState(false) // Email/password authentication modal
  const [authModalMode, setAuthModalMode] = useState('login') // 'login' eller 'signup'
  const [pendingFAQSection, setPendingFAQSection] = useState(null)
  const [activeAchievement, setActiveAchievement] = useState(null) // Achievement celebration
  // State för anpassad bekräftelsedialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  })

  // Enkelt setup - låt Google Translate göra sitt jobb
  useEffect(() => {
    // Sätt dokumentspråk till svenska
    document.documentElement.lang = 'sv'
    
    // Kontrollera att Google Translate cookie är satt till svenska
    const ensureSwedishCookie = () => {
      if (!document.cookie.includes('googtrans=/auto/sv')) {
        document.cookie = 'googtrans=/auto/sv; path=/; max-age=31536000'
      }
    }
    
    ensureSwedishCookie()
    // Kontrollera var 5:e sekund
    const cookieInterval = setInterval(ensureSwedishCookie, 5000)
    
    return () => {
      clearInterval(cookieInterval)
    }
  }, [])
  
  // Rensa formulär efter items-uppdatering (förhindrar DOM-fel)
  useEffect(() => {
    if (shouldClearForm) {
      setForm({ 
        name: '', 
        quantity: 1, 
        expiresAt: '' 
      })
      setFoodSuggestions([])
      setShowFoodSuggestions(false)
      setUserSelectedUnit(false)
      setSelectedInventoryCategory('övrigt')
      setShouldClearForm(false)
      
      // Fokusera tillbaka till namn-fältet
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="name"]')
        if (nameInput) nameInput.focus()
      }, 50)
    }
  }, [shouldClearForm])

  // Initiera tema och aktiv tab från localStorage eller systempreferens
  useEffect(() => {
    // Kolla om vi är i en familj med synk
    const family = getFamilyData()
    
    // Om i familj med sync, ladda localStorage OCH vänta på Firebase-uppdatering
    if (family.familyId && family.syncEnabled) {
      console.log('👨‍👩‍👧‍👦 Familj aktiv - laddar localStorage + Firebase sync')
      
      // Ladda från localStorage först (snabb laddning)
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            const validItems = parsed.filter(item => 
              item && 
              typeof item === 'object' && 
              item.id && 
              item.name && 
              item.quantity !== undefined && 
              item.expiresAt
            )
            setItems(validItems)
            console.log('💾 Laddade kylskåp från localStorage:', validItems.length, 'varor')
          }
        } catch (error) {
          console.error('Kunde inte ladda items från localStorage:', error)
        }
      }
      
      // Sätt timeout för att markera initial load som klar (tillfälle om Firebase är tom)
      setTimeout(() => {
        if (isInitialInventoryLoad) {
          console.log('⏰ Initial load timeout - tillåter nu sparning')
          setIsInitialInventoryLoad(false)
        }
      }, 2000) // 2 sekunder för Firebase att svara
      // isInitialInventoryLoad hålls true tills Firebase data kommer ELLER timeout
    } else {
      // Endast ladda localStorage om INTE i familj
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try { 
          const parsed = JSON.parse(saved)
          // FIX: Validera att parsed är en array och innehåller giltiga objekt
          if (Array.isArray(parsed)) {
            const validItems = parsed.filter(item => 
              item && 
              typeof item === 'object' && 
              item.id && 
              item.name && 
              item.quantity !== undefined && 
              item.expiresAt
            )
            setItems(validItems)
            console.log('💾 Laddade kylskåp från localStorage:', validItems.length, 'varor')
            
            // Om vi filtrerade bort ogiltiga items, uppdatera localStorage
            if (validItems.length !== parsed.length) {
              console.warn(`Rensade ${parsed.length - validItems.length} ogiltiga items`)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems))
            }
          } else {
            console.error('localStorage innehöll inte en giltig array')
            setItems([])
          }
        } catch (error) {
          console.error('Kunde inte ladda items från localStorage:', error)
          setItems([])
        }
      }
      setIsInitialInventoryLoad(false)
    }
    
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Kolla systempreferens
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
    
    // Kolla om URL:en innehåller en referral-kod eller payment status
    const urlParams = new URLSearchParams(window.location.search)
    const hasReferralCode = urlParams.has('ref')
    const paymentStatus = urlParams.get('payment')
    
    // Visa success-meddelande om betalning lyckades
    if (paymentStatus === 'success') {
      // Rensa URL direkt (förhindrar loop)
      window.history.replaceState({}, document.title, '/')
      
      setTimeout(() => {
        toast.success('🎉 Välkommen till Premium! Din prenumeration är nu aktiv och du har full tillgång till alla premium-funktioner.')
        
        // FIX: Vänta på Firebase sync innan reload (förhindrar vit skärm)
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }, 500)
    } else if (paymentStatus === 'cancelled') {
      setTimeout(() => {
        toast.warning('Betalningen avbröts. Inget har debiterats från ditt konto.')
        window.history.replaceState({}, document.title, '/')
      }, 500)
    }
    
    // FIX: Prioritera sparad tab för att behålla position vid refresh
    // Kolla först om användaren har en sparad tab (högsta prioritet vid refresh)
    const savedTab = localStorage.getItem('svinnstop_active_tab')
    const hasSeenGuide = localStorage.getItem('svinnstop_guide_seen')
    
    if (!hasSeenGuide) {
      // Första gången - visa välkomstdialog
      setShowGuideWelcome(true)
      setActiveTab('inventory') // Sätt till inventory-fliken
    } else if (hasReferralCode && !localStorage.getItem('svinnstop_referral_visited')) {
      // Första gången med referral-kod (men efter onboarding)
      console.log('🎁 First time referral code detected, navigating to referral tab')
      setActiveTab('referral')
      localStorage.setItem('svinnstop_referral_visited', 'true')
    } else if (savedTab && ['shopping', 'inventory', 'recipes', 'profile', 'family', 'achievements', 'savings', 'referral', 'leaderboard', 'faq'].includes(savedTab)) {
      // Ladda senaste aktiva tab (fungerar även vid refresh)
      console.log('✅ Restoring saved tab:', savedTab)
      setActiveTab(savedTab)
    } else {
      // Default till kylskåp om ingen sparad tab finns
      setActiveTab('inventory')
    }
    
    
  // Track daily login for achievements
    achievementService.trackDailyLogin()
    
    // Track app open for referral verification
    referralService.trackAppOpen()
    
    // Check premium expiry (SECURITY FIX)
    premiumService.checkPremiumExpiry()
    
    // Initialize AdSense (only for free users)
    adService.initializeAds()
    
    // Initialize Google Analytics
    analytics.initAnalytics()
    analytics.trackAppOpened()
    
    // Initialize Firebase Authentication
    initAuth()
      .then(user => {
        if (user) {
          console.log('🔐 Svinnstop authentication ready')
          
          // NYTT: Sync all user data from cloud if not anonymous
          if (!user.isAnonymous) {
            console.log('👤 User is logged in with email - syncing data from cloud...')
            
            // SECURITY FIX: Kolla om en ANNAN användare loggade in
            const lastUserId = localStorage.getItem('svinnstop_last_user_id')
            
            if (lastUserId && lastUserId !== user.uid) {
              console.log('🚨 DIFFERENT USER DETECTED - Clearing localStorage!')
              console.log(`Previous user: ${lastUserId}, New user: ${user.uid}`)
              
              // Rensa ALL localStorage förutom theme
              const savedTheme = localStorage.getItem('svinnstop_theme')
              localStorage.clear()
              if (savedTheme) {
                localStorage.setItem('svinnstop_theme', savedTheme)
              }
              
              console.log('✅ localStorage cleared - will load fresh data from cloud')
            }
            
            // Spara aktuell användare
            localStorage.setItem('svinnstop_last_user_id', user.uid)
            
            // SECURITY FIX: Markera att vi är i synkläge
            sessionStorage.setItem('svinnstop_syncing', 'true')
            
            performInitialUserSync()
              .then(async (cloudData) => {
                if (cloudData) {
                  console.log('🔄 Cloud data loaded - applying to localStorage...')
                  // Merge inventory
                  if (cloudData.inventory) {
                    const localItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
                    const merged = mergeWithTimestamp(localItems, cloudData.inventory)
                    
                    if (merged.source === 'cloud') {
                      console.log('🌍 Using cloud inventory (' + merged.data.length + ' items)')
                      setItems(merged.data)
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.data))
                      localStorage.setItem('svinnstop_last_modified', cloudData.inventory.lastModified.toString())
                    } else {
                      console.log('💾 Using local inventory (' + merged.data.length + ' items) and uploading to cloud')
                      // Upload local data to cloud
                      syncInventoryToUser(merged.data)
                      localStorage.setItem('svinnstop_last_modified', Date.now().toString())
                    }
                  } else {
                    // No cloud data, upload local data
                    const localItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
                    if (localItems.length > 0) {
                      console.log('⬆️ Uploading local inventory to cloud (' + localItems.length + ' items)')
                      syncInventoryToUser(localItems)
                      localStorage.setItem('svinnstop_last_modified', Date.now().toString())
                    }
                  }
                  
                  // Kolla family status INNAN vi uppdaterar localStorage
                  const hadNoFamilyBefore = !getFamilyData().familyId
                  
                  // Merge achievements
                  if (cloudData.achievements) {
                    console.log('🎯 Using cloud achievements')
                    localStorage.setItem('svinnstop_achievements', JSON.stringify(cloudData.achievements))
                  } else {
                    // No cloud data, upload local achievements
                    const localAchievements = localStorage.getItem('svinnstop_achievements')
                    if (localAchievements) {
                      console.log('⬆️ Uploading local achievements to cloud')
                      const parsed = JSON.parse(localAchievements)
                      syncAchievementsToUser(parsed)
                    }
                  }
                  
                  // Merge shopping list
                  if (cloudData.shoppingList) {
                    console.log('🛋️ Using cloud shopping list')
                    localStorage.setItem('svinnstop_shopping_list', JSON.stringify(cloudData.shoppingList.items || cloudData.shoppingList))
                  }
                  
                  // Merge family data
                  let needsReloadForFamily = false
                  if (cloudData.familyData && cloudData.familyData.familyId) {
                    console.log('👨‍👩‍👧‍👦 Using cloud family data')
                    const familyDataToSave = {
                      familyId: cloudData.familyData.familyId,
                      familyCode: cloudData.familyData.familyCode,
                      familyName: cloudData.familyData.familyName,
                      myRole: cloudData.familyData.myRole,
                      members: cloudData.familyData.members || [],
                      syncEnabled: true,
                      createdAt: cloudData.familyData.createdAt
                    }
                    localStorage.setItem('svinnstop_family_data', JSON.stringify(familyDataToSave))
                    
                    // Om vi inte hade family förut men har nu, måste vi reloada
                    if (hadNoFamilyBefore) {
                      needsReloadForFamily = true
                    }
                  }
                  
                  // Merge savings/stats
                  if (cloudData.stats) {
                    console.log('📊 Using cloud stats')
                    localStorage.setItem('svinnstop_stats', JSON.stringify(cloudData.stats))
                  }
                  
                  // Merge savings (besparingar)
                  if (cloudData.savings) {
                    console.log('💰 Using cloud savings')
                    localStorage.setItem('svinnstop_savings_data', JSON.stringify(cloudData.savings))
                  } else {
                    // No cloud data, upload local savings
                    const localSavings = localStorage.getItem('svinnstop_savings_data')
                    if (localSavings) {
                      try {
                        console.log('⬆️ Uploading local savings to cloud')
                        const parsed = JSON.parse(localSavings)
                        syncSavingsToUser(parsed)
                      } catch (e) {
                        console.warn('⚠️ Could not parse local savings')
                      }
                    }
                  }
                  
                  // Merge referral data - VIKTIGT: Cloud är källan till sanning
                  if (cloudData.referral && cloudData.referral.myCode) {
                    console.log('🎁 Using cloud referral data (source of truth)')
                    // Använd cloud-data DIREKT, skriv över lokal data helt
                    localStorage.setItem('svinnstop_referral_data', JSON.stringify(cloudData.referral))
                  } else {
                    // Om ingen cloud referral-data finns, kolla lokal data först
                    console.log('🎁 No cloud referral data found')
                    const localReferral = localStorage.getItem('svinnstop_referral_data')
                    let referralCodeToUse = null
                    
                    if (localReferral) {
                      try {
                        const parsed = JSON.parse(localReferral)
                        if (parsed.myCode && parsed.myCode !== '...') {
                          // Använd befintlig lokal kod
                          referralCodeToUse = parsed
                          console.log('💾 Using existing local referral code:', parsed.myCode)
                        }
                      } catch (e) {
                        console.warn('⚠️ Could not parse local referral data')
                      }
                    }
                    
                    // Om ingen kod finns, skapa en ny
                    if (!referralCodeToUse) {
                      // Import generateReferralCode från referralService
                      const referralModule = await import('./referralService')
                      const user = auth.currentUser
                      referralCodeToUse = {
                        myCode: referralModule.generateReferralCode(user?.uid),
                        referredBy: null,
                        referrals: [],
                        rewards: [],
                        premiumUntil: null,
                        lifetimePremium: false,
                        createdAt: new Date().toISOString()
                      }
                      console.log('✨ Created new referral code:', referralCodeToUse.myCode)
                    }
                    
                    // Synka till cloud och spara lokalt
                    const userDataSyncModule = await import('./userDataSync')
                    await userDataSyncModule.syncReferralDataToUser(referralCodeToUse)
                    localStorage.setItem('svinnstop_referral_data', JSON.stringify(referralCodeToUse))
                  }
                  
                  // Merge profile/leaderboard data
                  if (cloudData.profile && cloudData.profile.displayName) {
                    console.log('🏆 Using cloud profile/leaderboard data')
                    const user = auth.currentUser
                    if (user) {
                      const leaderboardKey = `svinnstop_leaderboard_${user.uid}`
                      const localLeaderboard = localStorage.getItem(leaderboardKey)
                      let leaderboardData = null
                      
                      if (localLeaderboard) {
                        try {
                          leaderboardData = JSON.parse(localLeaderboard)
                        } catch (e) {
                          leaderboardData = null
                        }
                      }
                      
                      // Skapa eller uppdatera leaderboard data med cloud profile
                      const updatedLeaderboard = {
                        myStats: {
                          username: cloudData.profile.displayName,
                          handle: cloudData.profile.handle,
                          userId: cloudData.profile.userId || user.uid,
                          itemsSaved: leaderboardData?.myStats?.itemsSaved || 0,
                          moneySaved: leaderboardData?.myStats?.moneySaved || 0,
                          streak: leaderboardData?.myStats?.streak || 0,
                          joinedAt: cloudData.profile.createdAt || new Date().toISOString()
                        },
                        competitions: leaderboardData?.competitions || [],
                        friends: leaderboardData?.friends || [],
                        lastUpdated: new Date().toISOString()
                      }
                      
                      localStorage.setItem(leaderboardKey, JSON.stringify(updatedLeaderboard))
                    }
                  }
                  
                  // SECURITY: Merge premium data from Firebase (källan till sanning)
                  if (cloudData.premium) {
                    console.log('🔒 Using cloud premium data (source of truth)')
                    // LocalStorage används ENDAST som cache - skriv över helt
                    localStorage.setItem('svinnstop_premium_data', JSON.stringify(cloudData.premium))
                  } else {
                    // Ingen premium i cloud = rensa lokal premium
                    console.log('🔓 No cloud premium - clearing local premium')
                    localStorage.removeItem('svinnstop_premium_data')
                    localStorage.removeItem('svinnstop_premium')
                    localStorage.removeItem('svinnstop_premium_expiry')
                  }
                  
                  console.log('✅ User data sync complete')
                  
                  // SECURITY FIX: Markera att sync är klar
                  sessionStorage.removeItem('svinnstop_syncing')
                  
                  // Reload om family data ändrades för att aktivera family sync
                  if (needsReloadForFamily) {
                    console.log('🔄 Family membership detected - reloading to activate sync...')
                    setTimeout(() => {
                      window.location.reload()
                    }, 500)
                  }
                } else {
                  console.log('⚠️ No cloud data found - will upload local data on next change')
                  // SECURITY FIX: Markera att sync är klar även om ingen cloud data
                  sessionStorage.removeItem('svinnstop_syncing')
                }
              })
              .catch(err => {
                console.warn('⚠️ Could not sync user data from cloud:', err)
                // SECURITY FIX: Rensa syncing-flagga även vid fel
                sessionStorage.removeItem('svinnstop_syncing')
              })
          }
          
          // Sync premium from Firebase (server-side truth)
          premiumService.syncPremiumFromFirebase()
            .then(() => {
              console.log('✅ Premium synced from server')
              // SECURITY FIX: Sync referral premium AFTER Firebase sync
              syncReferralPremiumToMain()
            })
            .catch(err => console.warn('⚠️ Could not sync premium from server:', err))
          
          // Synka referral-kod till Firebase
          referralService.syncReferralCodeToFirebase()
            .then(() => console.log('✅ Svinnstop referral code synced'))
            .catch(err => console.warn('⚠️ Svinnstop could not sync referral code:', err))
          
          // Migrera användarnamn till index
          leaderboardService.migrateUsernameToIndex()
            .then(() => console.log('✅ Svinnstop username index migrated'))
            .catch(err => console.warn('⚠️ Svinnstop could not migrate username:', err))
        } else {
          console.warn('⚠️ Svinnstop auth not initialized - app will work in local mode')
        }
        // Auth är klar (oavsett om det lyckades eller ej)
        setIsAuthReady(true)
      })
      .catch(error => {
        console.error('❌ Svinnstop failed to initialize auth:', error)
        console.warn('⚠️ Svinnstop will continue without authentication')
        // Auth är klar (misslyckades men vi fortsätte)
        setIsAuthReady(true)
      })
  }, [])
  
  // Lyssna på user inventory-ändringar från Firebase (realtid)
  useEffect(() => {
    const user = auth.currentUser
    if (!user || user.isAnonymous) {
      return
    }
    
    console.log('👂 Starting user inventory listener')
    const unsubscribe = listenToUserInventoryChanges((data) => {
      const { items: cloudItems, lastModified: cloudTimestamp } = data
      
      // Jämför med lokal timestamp
      const localTimestamp = parseInt(localStorage.getItem('svinnstop_last_modified') || '0')
      
      if (cloudTimestamp > localTimestamp) {
        console.log('🌍 User inventory updated from another device - applying changes')
        setItems(cloudItems)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudItems))
        localStorage.setItem('svinnstop_last_modified', cloudTimestamp.toString())
      }
    })
    
    return () => {
      if (unsubscribe) {
        console.log('👋 Stopping user inventory listener')
        unsubscribe()
      }
    }
  }, [isAuthReady]) // Kör efter auth är redo
  
  // Ladda sparade AI-recept från localStorage
  useEffect(() => {
    const recipes = getSavedAIRecipes()
    setSavedAIRecipes(recipes)
  }, [])
  
  // Lyssna på reopen auth modal event
  useEffect(() => {
    const handleReopenAuthModal = (event) => {
      const { mode } = event.detail
      console.log('🔄 Reopening auth modal with mode:', mode)
      setAuthModalMode(mode)
      setShowAuthModal(true)
    }
    
    window.addEventListener('reopenAuthModal', handleReopenAuthModal)
    return () => window.removeEventListener('reopenAuthModal', handleReopenAuthModal)
  }, [])
  
  // Lyssna på openFAQ event (från signup-formulär)
  useEffect(() => {
    const handleOpenFAQ = (event) => {
      console.log('💬 Opening FAQ:', event.detail)
      const { section } = event.detail
      
      // Spara vilken sektion som ska öppnas
      setPendingFAQSection(section)
      
      // Navigera till FAQ
      setActiveTab('faq')
    }
    
    window.addEventListener('openFAQ', handleOpenFAQ)
    return () => window.removeEventListener('openFAQ', handleOpenFAQ)
  }, [])
  
  // Skicka pending FAQ-sektion
  useEffect(() => {
    if (activeTab === 'faq' && pendingFAQSection) {
      // Skicka event till FAQ-komponenten
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openFAQ', { detail: { section: pendingFAQSection } }))
        setPendingFAQSection(null) // Rensa
      }, 100)
    }
  }, [activeTab, pendingFAQSection])
  
  // Lyssna på achievement unlocked events
  useEffect(() => {
    const handleAchievementUnlocked = (event) => {
      const achievement = event.detail
      console.log('🎉 Showing achievement celebration:', achievement.title)
      setActiveAchievement(achievement)
    }
    
    window.addEventListener('achievementUnlocked', handleAchievementUnlocked)
    return () => window.removeEventListener('achievementUnlocked', handleAchievementUnlocked)
  }, [])
  
  // Synka family premium status till localStorage cache OCH starta listener
  useEffect(() => {
    const familyData = getFamilyData()
    
    if (!familyData.familyId) {
      // Inte i en familj - rensa cache
      localStorage.removeItem('svinnstop_family_premium_cache')
      return
    }
    
    // Initial sync
    const syncFamilyPremiumCache = async () => {
      try {
        const benefits = await premiumService.hasFamilyPremiumBenefits()
        const cache = {
          active: benefits.hasBenefits && benefits.source === 'family',
          timestamp: Date.now()
        }
        localStorage.setItem('svinnstop_family_premium_cache', JSON.stringify(cache))
        
        if (benefits.hasBenefits && benefits.source === 'family') {
          console.log('👨‍👩‍👧‍👦 Family premium active - benefits granted')
        }
      } catch (error) {
        console.error('❌ Failed to sync family premium cache:', error)
      }
    }
    
    syncFamilyPremiumCache()
    
    // FIX: Starta Firebase listener för family premium (realtime)
    let unsubscribeFamilyPremium = null
    let previousPremiumState = null // Track previous state to detect changes
    
    premiumService.listenToFamilyPremiumChanges((benefits) => {
      console.log('🔥 Family Premium realtime update:', benefits)
      
      // Visa notifikation om familjen får premium (från inget premium till premium)
      if (previousPremiumState !== null && 
          !previousPremiumState.hasBenefits && 
          benefits.hasBenefits && 
          benefits.source === 'family') {
        setTimeout(() => {
          toast.success('🎉 Familjen har nu Family Premium! Du har nu tillgång till alla premium-funktioner.')
        }, 500)
      }
      
      previousPremiumState = benefits
    }).then(unsub => {
      unsubscribeFamilyPremium = unsub
      console.log('✅ Family Premium listener started')
    }).catch(err => {
      console.warn('⚠️ Could not setup family premium listener:', err)
    })
    
    // Synka varje 5 minuter (backup)
    const interval = setInterval(syncFamilyPremiumCache, 5 * 60 * 1000)
    
    return () => {
      clearInterval(interval)
      if (unsubscribeFamilyPremium) {
        console.log('👋 Stopping family premium listener')
        unsubscribeFamilyPremium()
      }
    }
  }, [familySyncTrigger])
  
  // Setup custom expiry rules sync callback
  useEffect(() => {
    // Setup global callback för userItemsService att trigga Firebase-synk
    window.syncCustomExpiryRules = (rules) => {
      const family = getFamilyData()
      if (family.familyId && family.syncEnabled) {
        // FÖRHINDRA LOOP: Kolla om detta kommer från Firebase
        if (window._customRulesFromFirebase) {
          console.log('🚫 Skippar Firebase-sync - custom rules kommer redan från Firebase')
          window._customRulesFromFirebase = false // Reset
          return
        }
        
        console.log('🔄 Synkar lokala custom rules till Firebase')
        syncCustomExpiryRulesToFirebase(rules)
      }
    }
    
    return () => {
      delete window.syncCustomExpiryRules
      delete window._customRulesFromFirebase
    }
  }, [])
  
  // Separat useEffect för Firebase sync som lyssnar på familySyncTrigger
  useEffect(() => {
    const family = getFamilyData()
    
    if (family.familyId && family.syncEnabled) {
      console.log('🔄 Starting Firebase inventory sync for family:', family.familyId)
      console.log('💾 Hybrid mode: localStorage för snabb laddning, Firebase för realtidssynk')
      
      const unsubscribe = listenToInventoryChanges((firebaseInventory) => {
        console.log('📥 Received inventory from Firebase:', firebaseInventory.length, 'items')
        
        // Sätt flagga att data kommer från Firebase
        itemsFromFirebase.current = true
        
        // Uppdatera state med Firebase-data (senaste sanning)
        setItems(firebaseInventory)
        
        // Spara OCKSÅ till localStorage så nästa reload är snabb
        localStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseInventory))
        
        // Markera att initial load är klar
        if (isInitialInventoryLoad) {
          setIsInitialInventoryLoad(false)
        }
      })
      
      // Lyssna på custom expiry rules från Firebase
      const unsubscribeRules = listenToCustomExpiryRulesChanges((firebaseRules) => {
        console.log('📥 Received custom expiry rules from Firebase:', Object.keys(firebaseRules).length, 'rules')
        importCustomExpiryRules(firebaseRules)
      })
      
      // Initial upload av lokala custom rules till Firebase
      const localRules = exportCustomExpiryRules()
      if (Object.keys(localRules).length > 0) {
        console.log('📤 Uploading local custom expiry rules to Firebase')
        syncCustomExpiryRulesToFirebase(localRules)
      }
      
      return () => {
        if (unsubscribe) {
          console.log('👋 Stopping Firebase inventory sync')
          unsubscribe()
        }
        if (unsubscribeRules) {
          console.log('👋 Stopping Firebase custom expiry rules sync')
          unsubscribeRules()
        }
      }
    } else {
      setIsInitialInventoryLoad(false)
    }
  }, [familySyncTrigger, isInitialInventoryLoad])

  // Auto-refresh när användaren kommer tillbaka till appen
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 App became visible, refreshing data...')
        
        const family = getFamilyData()
        
        // Endast ladda localStorage om INTE i familj
        if (!family.familyId || !family.syncEnabled) {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              if (Array.isArray(parsed)) {
                const validItems = parsed.filter(item => 
                  item && 
                  typeof item === 'object' && 
                  item.id && 
                  item.name && 
                  item.quantity !== undefined && 
                  item.expiresAt
                )
                setItems(validItems)
                console.log('💾 Laddade om från localStorage')
              }
            } catch (error) {
              console.error('Kunde inte ladda items:', error)
            }
          }
        } else {
          // Om i familj, triggera Firebase-sync istället
          console.log('🔄 Triggerar Firebase-sync...')
          setFamilySyncTrigger(prev => prev + 1)
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Ref för att spåra om data kommer från Firebase (förhindrar loop)
  const itemsFromFirebase = useRef(false)

  // FIX: Debounce localStorage writes för att undvika race conditions
  useEffect(() => {
    // Skippa initial load för att undvika att skriva över Firebase med gammalt localStorage
    if (isInitialInventoryLoad) {
      return
    }
    
    const timeoutId = setTimeout(() => {
      try {
        const family = getFamilyData()
        
        // Om data kommer från Firebase: SKIPPA synk tillbaka (förhindrar loop)
        if (family.familyId && family.syncEnabled && itemsFromFirebase.current) {
          console.log('🚫 Skippar Firebase-sync - data kommer redan från Firebase')
          itemsFromFirebase.current = false // Reset
          return
        }
        
        // Spara ALLTID till localStorage (både solo och familj)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        localStorage.setItem('svinnstop_last_modified', Date.now().toString())
        
        // Track max active items for achievements (ALLTID - personlig data)
        const achievementData = achievementService.getAchievementData()
        if (items.length > (achievementData.stats.maxActiveItems || 0)) {
          achievementService.updateStats({
            maxActiveItems: items.length
          })
        }
        
        // NYTT: Synka till user cloud om inloggad (inte anonym)
        const user = auth.currentUser
        if (user && !user.isAnonymous) {
          console.log('🔄 Syncing inventory to user cloud (' + items.length + ' items)')
          syncInventoryToUser(items)
        }
        
        // Synkronisera till Firebase om i familj
        if (family.familyId && family.syncEnabled) {
          console.log('🔄 Synkar lokal ändring till Firebase family')
          syncInventoryToFirebase(items)
        }
      } catch (error) {
        console.error('Kunde inte spara items till localStorage:', error)
        if (error.name === 'QuotaExceededError') {
          try {
            localStorage.removeItem('svinnstop_cached_recipes')
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
          } catch (e) {
            console.error('Kunde inte spara även efter rensning:', e)
          }
        }
      }
    }, 100) // 100ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [items, isInitialInventoryLoad])

  // Tillämpa tema på dokument och spara till localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])
  
  // Ladda notifikationsinställningar vid start
  useEffect(() => {
    const notificationsWereEnabled = localStorage.getItem('svinnstop_notifications_enabled') === 'true'
    if (notificationsWereEnabled) {
      // Försök återaktivera notifikationer
      notificationService.requestPermission().then(success => {
        if (success) {
          setNotificationsEnabled(true)
          notificationService.scheduleExpiryNotifications(items)
        }
      })
    }
  }, [])
  
  // Uppdatera notifikationer när varor ändras
  useEffect(() => {
    if (notificationsEnabled && items.length > 0) {
      notificationService.scheduleExpiryNotifications(items)
    }
  }, [items, notificationsEnabled])
  
  // Spara aktiv tab när den ändras
  useEffect(() => {
    localStorage.setItem('svinnstop_active_tab', activeTab)
  }, [activeTab])
  
  // FIX: Skippa API helt - använd bara lokala svenska recept
  useEffect(() => {
    // VIKTIGT: Rensa ALLTID gammal cache först (kör varje gång sidan laddas)
    localStorage.removeItem('svinnstop_cached_recipes')
    
    if (!recipesLoaded) {
      // Ladda lokala svenska recept direkt (inga API-anrop)
      import('./recipeAPI').then(module => {
        const localRecipes = module.getAllLocalSwedishRecipes()
        setInternetRecipes(localRecipes)
        setRecipesLoaded(true)
        console.log('🍳 Laddade ' + localRecipes.length + ' svenska recept (utan API)')
      })
    }
  }, [recipesLoaded])
  
  // Stäng inställningsmeny när man klickar utanför
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettingsMenu && !event.target.closest('.settings-menu-container')) {
        setShowSettingsMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettingsMenu])

  // State för att spåra om något lagts till i inköpslistan under guide
  const shoppingListItemsRef = useRef(0)

  // Guide: Lyssna på användaraktioner och avancera guiden
  useEffect(() => {
    if (!guideActive) return

    console.log('📖 Guide active - Current step:', guideStep)

    // Steg 0: Användaren har skrivit "Mjölk" i namnfältet
    if (guideStep === 0 && form.name.toLowerCase().includes('mjölk')) {
      console.log('✅ Steg 0: Mjölk skrivet')
      setTimeout(() => setGuideStep(1), 500)
    }

    // Steg 1: AI-förslag har klickats (detekteras genom att expiresAt har ett värde)
    if (guideStep === 1 && form.expiresAt) {
      console.log('✅ Steg 1: AI-förslag klickat')
      setTimeout(() => setGuideStep(2), 500)
    }

    // Steg 2: Vara har lagts till (items.length ökade)
    if (guideStep === 2 && items.some(item => item.name.toLowerCase().includes('mjölk'))) {
      console.log('✅ Steg 2: Vara tillagd')
      setTimeout(() => setGuideStep(3), 800)
    }

    // Steg 3: Inköpslista-fliken har öppnats
    if (guideStep === 3 && activeTab === 'shopping') {
      console.log('✅ Steg 3: Inköpslista öppnad')
      // Sätt referens för att spåra ökning i inköpslista
      shoppingListItemsRef.current = 0 // Reset
      setTimeout(() => setGuideStep(4), 500)
    }

    // Steg 4: Något har lagts till i inköpslistan (vi går direkt vidare efter 2 sekunder)
    if (guideStep === 4) {
      console.log('📝 Steg 4: Väntar på inköpslista...')
      const timer = setTimeout(() => {
        console.log('✅ Steg 4: Timeout - går vidare')
        setGuideStep(5)
      }, 5000) // Ge användaren 5 sekunder att lägga till något
      return () => clearTimeout(timer)
    }
    
    // Steg 5: "Rensa klara" har klickats (detekteras genom att kylskåpet fått nya varor)
    // Detta steg väntar på att användaren ska klicka "Rensa klara"
    // Vi kollar inte här eftersom det hanteras i ShoppingList-komponenten
    
    // Steg 6: Kylskåp-fliken har öppnats (färgkodning)
    if (guideStep === 6 && activeTab === 'inventory') {
      console.log('✅ Steg 6: Kylskåp öppnad')
      setTimeout(() => setGuideStep(7), 500)
    }
    
    // Steg 7: Guiden är klar
    if (guideStep === 7) {
      console.log('🎉 Steg 7: Guiden klar!')
      setTimeout(() => {
        setGuideActive(false)
        localStorage.setItem('svinnstop_guide_seen', 'true')
      }, 3000)
    }
  }, [guideActive, guideStep, form, items, activeTab])

  // Guide-instruktioner
  const getGuideInstruction = (step) => {
    const instructions = [
      'Skriv "Mjölk" i namnfältet',
      'Tryck på "🤖 AI-förslag" knappen',
      'Tryck på "Lägg till" för att spara varan',
      'Gå till Inköpslista-fliken',
      'Lägg till något i inköpslistan',
      'Bocka av varan och tryck "Rensa klara"',
      'Gå tillbaka till Kylskåp-fliken',
      'Klart! Du kan nu använda appen! 🎉'
    ]
    return instructions[step] || ''
  }

  const getGuideDetails = (step) => {
    const details = [
      'Här lägger du in varor i ditt kylskåp. Testa att skriva "Mjölk" så ser du hur det fungerar. Du får automatiska förslag när du skriver.',
      'AI:n föreslår ett rimligt utgångsdatum baserat på varan. Tryck på knappen så ser du hur den fyller i datumet automatiskt!',
      'Nu har du lagt in all information. Tryck på "Lägg till" så sparas varan i ditt kylskåp. Du kommer att se den nedan med färgkodning baserat på utgångsdatumet.',
      'Inköpslistan är perfekt för att planera vad du behöver köpa. Gå dit nu så visar vi hur den fungerar!',
      'Här lägger du till varor du behöver köpa. Lägg till något och gå vidare!',
      'När du handlat kan du bocka av varorna och trycka "Rensa klara". Då flyttas matvaror automatiskt till kylskåpet med AI-föreslaget utgångsdatum! Prova nu.',
      'Se hur varan du lade till färgkodas! 🟢 Grön = Fräscht, 🟡 Gul = Går ut snart, 🔴 Röd = Utgånget. Detta hjälper dig att äta rätt varor först!',
      'Nu vet du grunderna! Fortsätt använda appen för att spåra din mat och minska matsvinnet. Du hittar fler funktioner i profilen. Lycka till! 🌱'
    ]
    return details[step] || ''
  }

  const onChange = e => {
    const { name, value } = e.target
    
    // FIX: Använd functional update för att undvika stale state
    if (name === 'quantity') {
      // Tillåt tomt fält så användaren kan ta bort alla siffror
      if (value === '' || value === null || value === undefined) {
        setForm(prevForm => ({ 
          ...prevForm, 
          [name]: ''
        }))
      } else {
        const numValue = parseFloat(value)
        // Validera kvantitet: max 50 för att förhindra orealistiska värden
        const validatedValue = isNaN(numValue) ? 0 : Math.min(Math.max(0, numValue), 50)
        setForm(prevForm => ({ 
          ...prevForm, 
          [name]: validatedValue
        }))
      }
    } else if (name === 'name') {
      setForm(prevForm => ({ ...prevForm, [name]: value }))
      
      // DEBOUNCE suggestions för att undvika för många re-renders
      // Rensa tidigare timeout
      if (window.foodSuggestionsTimeout) {
        clearTimeout(window.foodSuggestionsTimeout)
      }
      
      // Sätt ny timeout
      window.foodSuggestionsTimeout = setTimeout(() => {
        if (value.trim().length > 0) {
          const suggestions = searchFoods(value.trim())
          setFoodSuggestions(suggestions)
          setShowFoodSuggestions(suggestions.length > 0)
          
          // Uppdatera endast kategori baserat på namnet
          const suggestion = getExpiryDateSuggestion(value.trim())
          if (suggestion.category) {
            setSelectedInventoryCategory(suggestion.category)
          }
        } else {
          setFoodSuggestions([])
          setShowFoodSuggestions(false)
        }
      }, 150) // 150ms debounce
    } else {
      setForm(prevForm => ({ ...prevForm, [name]: value }))
    }
  }

  // Stäng förslag och sätt defaults
  const closeFoodSuggestionsAndShowDialog = () => {
    setFoodSuggestions([])
    setShowFoodSuggestions(false)
    
    // Om namn finns, sätt defaults
    if (form.name.trim()) {
      const itemName = form.name.trim()
      const suggestion = getExpiryDateSuggestion(itemName)
      
      // Sätt defaults om inte ifyllda
      if (!form.quantity || form.quantity <= 0) {
        setForm(prev => ({ ...prev, quantity: 1 }))
      }
      
      if (!form.expiresAt && suggestion.date) {
        setForm(prev => ({ ...prev, expiresAt: suggestion.date }))
      }
      
      // Enheten förblir 'st' om användaren inte manuellt ändrat
      setSelectedInventoryCategory(suggestion.category || 'frukt')
    }
  }

  const onAdd = e => {
    e.preventDefault()
    console.log('=== onAdd TRIGGERED ===')
    console.log('Form values:', {
      name: form.name,
      expiresAt: form.expiresAt,
      quantity: form.quantity,
      type: typeof form.quantity
    })
    console.log('Selected category:', selectedInventoryCategory)
    console.log('Selected unit:', selectedInventoryUnit)
    
    if (!form.name || !form.expiresAt || form.quantity <= 0) {
      console.log('VALIDATION FAILED:', {
        noName: !form.name,
        noDate: !form.expiresAt,
        badQuantity: form.quantity <= 0
      })
      return
    }
    console.log('Validation passed, continuing...')
    
    // CHECK: 10-item limit for free users
    const isPremium = hasAnyPremium()
    const existingItemCheck = items.find(item => 
      item.name.toLowerCase() === form.name.trim().toLowerCase()
    )
    
    if (!isPremium && items.length >= 10 && !existingItemCheck) {
      // Show upgrade modal and inform user
      toast.warning('Du har nått gränsen på 10 varor! Uppgradera till Premium för obegränsat antal varor.')
      setShowUpgradeModal(true)
      console.log('🚫 Free user reached 10-item limit')
      return
    }
    
    // Använd värden från formuläret
    const itemName = form.name.trim()
    const itemQuantity = form.quantity
    const itemExpiresAt = form.expiresAt
    const finalUnit = selectedInventoryUnit
    const finalCategory = selectedInventoryCategory
    
    // TYST AUTO-LEARNING: Spara custom expiry rule om användaren har ändrat datum
    const defaultSuggestion = getExpiryDateSuggestion(itemName)
    if (defaultSuggestion && itemExpiresAt !== defaultSuggestion.date) {
      // Räkna kalenderdagar: 27 dec - 13 dec = 14 dagar (oavsett tid på dygnet)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [year, month, day] = itemExpiresAt.split('-').map(Number)
      const expiryDate = new Date(year, month - 1, day)
      expiryDate.setHours(0, 0, 0, 0)
      const daysFromToday = Math.round((expiryDate - today) / (1000 * 60 * 60 * 24))
      
      setCustomExpiryRule(itemName, daysFromToday)
      console.log(`🧠 onAdd: Lärde mig custom regel för \"${itemName}\": ${daysFromToday} dagar (användare valde ${itemExpiresAt} istället för ${defaultSuggestion.date})`)
    }
    
    // Emoji baserat på kategori
    const getCategoryEmoji = (cat) => {
      const emojiMap = {
        'frukt': '🍎',
        'grönsak': '🥬',
        'kött': '🥩',
        'fisk': '🐟',
        'mejeri': '🧀',
        'dryck': '🥤',
        'övrigt': '📦'
      }
      return emojiMap[cat] || '🍽️'
    }
    
    // Kolla om varan redan finns
    const existingItem = items.find(item => 
      item.name.toLowerCase() === itemName.toLowerCase()
    )
    
    // Lär appen om varan
    const userItemData = {
      name: itemName,
      category: finalCategory,
      emoji: getCategoryEmoji(finalCategory),
      unit: finalUnit,
      isFood: true
    }
    
    const result = userItemsService.addUserItem(userItemData)
    
    // Synka till Firebase
    if (result.success) {
      const family = getFamilyData()
      if (family.familyId && family.syncEnabled) {
        syncUserItemsToFirebase(result.items)
      }
    }
    
    if (existingItem) {
      // Uppdatera befintlig vara
      setItems(prev => {
        const updated = prev.map(item => 
          item.id === existingItem.id
            ? {
                ...item,
                quantity: itemQuantity,
                expiresAt: itemExpiresAt,
                unit: finalUnit,
                category: finalCategory,
                emoji: getCategoryEmoji(finalCategory)
              }
            : item
        )
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error('Kunde inte spara till localStorage:', error)
        }
        
        if (notificationsEnabled) {
          notificationService.scheduleExpiryNotifications(updated)
        }
        
        return updated
      })
    } else {
      // Skapa ny vara
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      const newItem = {
        id,
        name: itemName,
        quantity: itemQuantity,
        expiresAt: itemExpiresAt,
        unit: finalUnit,
        category: finalCategory,
        emoji: getCategoryEmoji(finalCategory)
      }
      
      setItems(prev => {
        const updated = [...prev, newItem]
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error('Kunde inte spara till localStorage:', error)
        }
        
        if (notificationsEnabled) {
          notificationService.scheduleExpiryNotifications(updated)
        }
        
        return updated
      })
      
      // Track item added for referral verification
      referralService.trackItemAdded()
    }
    
    // TRIGGA formulärrensning via useEffect efter React har renderat items
    setShouldClearForm(true)
  }

  const onRemove = async (id, event) => {
    try {
      if (event) {
        event.stopPropagation()
        event.preventDefault()
      }
      
      const itemToRemove = items.find(item => item.id === id)
      if (!itemToRemove) {
        console.error('Item not found with id:', id)
        return
      }
      
      // Track savings if item was used before expiry - ASK USER FIRST
      const daysLeft = daysUntil(itemToRemove.expiresAt)
      if (daysLeft >= 0) {
        // Kolla om det är första gången
        const hasSeenSavingsPrompt = localStorage.getItem('svinnstop_seen_savings_prompt')
        
        // Funktion som hanterar borttagningen efter användarens svar
        const handleRemoveWithSavings = (wasUsed) => {
          // Spara åtgärd för att ångra
          saveAction({
            type: 'DELETE_SINGLE',
            data: { item: itemToRemove },
            timestamp: Date.now()
          })
          
          // Endast spara besparingar om användaren bekräftar att de använde varan
          if (wasUsed) {
            const savingsResult = savingsTracker.trackSavedItem(itemToRemove.name, itemToRemove.quantity || 1)
            
            // Update achievement stats
            achievementService.updateStats({
              itemsSaved: savingsResult.itemsSaved,
              totalSaved: savingsResult.totalSaved
            })
          }
          
          // Uppdatera state och localStorage
          setItems(prev => {
            const updated = prev.filter(i => i.id !== id)
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            } catch (error) {
              console.error('Kunde inte spara till localStorage:', error)
            }
            return updated
          })
        }
        
        // Visa anpassad dialog
        if (!hasSeenSavingsPrompt) {
          // Första gången - visa utförlig förklaring
          setConfirmDialog({
            isOpen: true,
            title: `Använde du \"${itemToRemove.name}\"?`,
            message: `Ja = Varan användes (räknas som sparat)\\nNej = Varan slängdes (räknas ej)\\n\\nTips: Endast använda varor räknas som besparingar!`,
            onConfirm: () => {
              localStorage.setItem('svinnstop_seen_savings_prompt', 'true')
              handleRemoveWithSavings(true)
              setConfirmDialog({ ...confirmDialog, isOpen: false })
            },
            onCancel: () => {
              localStorage.setItem('svinnstop_seen_savings_prompt', 'true')
              handleRemoveWithSavings(false)
              setConfirmDialog({ ...confirmDialog, isOpen: false })
            },
            onDismiss: () => {
              // Klicka utanför = avbryt helt, ta inte bort varan
              setConfirmDialog({ ...confirmDialog, isOpen: false })
            }
          })
        } else {
          // Efterföljande gånger - enkel fråga
          setConfirmDialog({
            isOpen: true,
            title: '',
            message: `Använde du \"${itemToRemove.name}\"?`,
            onConfirm: () => {
              handleRemoveWithSavings(true)
              setConfirmDialog({ ...confirmDialog, isOpen: false })
            },
            onCancel: () => {
              handleRemoveWithSavings(false)
              setConfirmDialog({ ...confirmDialog, isOpen: false })
            },
            onDismiss: () => {
              // Klicka utanför = avbryt helt, ta inte bort varan
              setConfirmDialog({ ...confirmDialog, isOpen: false })
            }
          })
        }
      } else {
        // Varan har gått ut - ta bort direkt utan att fråga
        saveAction({
          type: 'DELETE_SINGLE',
          data: { item: itemToRemove },
          timestamp: Date.now()
        })
        
        setItems(prev => {
          const updated = prev.filter(i => i.id !== id)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          } catch (error) {
            console.error('Kunde inte spara till localStorage:', error)
          }
          return updated
        })
      }
      
    } catch (error) {
      console.error('Error in onRemove:', error)
      toast.error('Ett fel uppstod: ' + error.message)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }
  

  // Ångra/Gör om funktionalitet
  const saveAction = (action) => {
    setActionHistory(prev => {
      const newHistory = [...prev, action].slice(-10) // Behåll senaste 10 åtgärderna
      return newHistory
    })
    setCanUndo(true)
  }



  const undoLastAction = () => {
    if (actionHistory.length === 0) return
    
    const lastAction = actionHistory[actionHistory.length - 1]
    
    if (lastAction.type === 'DELETE_SINGLE') {
      // Återställ enskild raderad vara
      setItems(prev => [...prev, lastAction.data.item])
    } else if (lastAction.type === 'DELETE_BULK') {
      // Återställ flera raderade varor
      setItems(prev => [...prev, ...lastAction.data.items])
    }
    
    // Ta bort åtgärden från historiken
    setActionHistory(prev => prev.slice(0, -1))
    setCanUndo(actionHistory.length > 1)
  }
  
  // Hantera utgångsdatum justeringar
  const handleEditExpiry = (item) => {
    setEditingItem(item)
    setShowExpirySettings(true)
  }
  
  const handleExpiryUpdate = (updatedItem) => {
    // FIX: Validera att items existerar
    if (!updatedItem || !updatedItem.id) {
      console.error('Ogiltigt updatedItem:', updatedItem)
      return
    }
    
    const originalItem = editingItem
    
    // Lär AI:n från justeringen (gammal AI-motor)
    if (originalItem && originalItem.name) {
      learnFromUserAdjustment(
        originalItem.name,
        originalItem.expiresAt,
        updatedItem.expiresAt,
        originalItem.category,
        updatedItem.adjustmentReason || ''
      )
      
      // TYST AUTO-LEARNING: Spara också som custom regel (nytt system)
      if (originalItem.expiresAt !== updatedItem.expiresAt) {
        // Räkna kalenderdagar: 27 dec - 13 dec = 14 dagar (oavsett tid på dygnet)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const [year, month, day] = updatedItem.expiresAt.split('-').map(Number)
        const newDateObj = new Date(year, month - 1, day)
        newDateObj.setHours(0, 0, 0, 0)
        const daysFromToday = Math.round((newDateObj - today) / (1000 * 60 * 60 * 24))
        
        setCustomExpiryRule(originalItem.name, daysFromToday)
        console.log(`🧠 handleExpiryUpdate: Sparade custom regel: ${originalItem.name} = ${daysFromToday} dagar`)
      }
    }
    
    // Uppdatera item i listan
    setItems(prev => {
      const updated = prev.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
      
      // FIX: Spara direkt till localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Kunde inte spara efter uppdatering:', error)
      }
      
      return updated
    })
    
    console.log(`📝 Utgångsdatum uppdaterat för ${updatedItem.name}`)
  }
  
  // Bulk edit funktioner för utgångsdatum
  const toggleBulkEditMode = () => {
    setBulkEditMode(prev => {
      if (prev) {
        // Avsluta bulk edit mode
        setSelectedItems(new Set())
        setBulkExpiryDate('')
      } else {
        // Starta bulk edit mode - använd första valda varans datum om tillgängligt
        const firstSelectedId = Array.from(selectedItems)[0]
        const firstSelectedItem = firstSelectedId ? items.find(i => i.id === firstSelectedId) : null
        
        if (firstSelectedItem && firstSelectedItem.expiresAt) {
          setBulkExpiryDate(firstSelectedItem.expiresAt)
        } else {
          // Fallback till dagens datum
          const today = new Date()
          setBulkExpiryDate(today.toISOString().split('T')[0])
        }
      }
      return !prev
    })
  }
  
  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
        // Om det inte finns fler valda varor, återställ datum till idag
        if (newSet.size === 0) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const year = today.getFullYear()
          const month = String(today.getMonth() + 1).padStart(2, '0')
          const day = String(today.getDate()).padStart(2, '0')
          setBulkExpiryDate(`${year}-${month}-${day}`)
        } else {
          // Använd första kvarvarande varans datum
          const firstRemainingId = Array.from(newSet)[0]
          const firstItem = items.find(i => i.id === firstRemainingId)
          if (firstItem?.expiresAt) {
            setBulkExpiryDate(firstItem.expiresAt)
          }
        }
      } else {
        newSet.add(itemId)
        // Om detta är första varan som väljs, använd dess datum
        if (newSet.size === 1) {
          const selectedItem = items.find(i => i.id === itemId)
          if (selectedItem?.expiresAt) {
            setBulkExpiryDate(selectedItem.expiresAt)
          }
        }
      }
      return newSet
    })
  }
  
  const selectAllVisible = () => {
    const visibleIds = filtered.map(item => item.id)
    setSelectedItems(new Set(visibleIds))
  }
  
  const deselectAll = () => {
    setSelectedItems(new Set())
  }
  
  const applyBulkExpiryDate = () => {
    if (selectedItems.size === 0 || !bulkExpiryDate) return
    
    const confirmed = confirm(`Ändra utgångsdatum till ${bulkExpiryDate} för ${selectedItems.size} valda varor?`)
    if (confirmed) {
      // TYST AUTO-LEARNING: Spara custom expiry rules för varje vara
      // Räkna kalenderdagar: 27 dec - 13 dec = 14 dagar (oavsett tid på dygnet)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [year, month, day] = bulkExpiryDate.split('-').map(Number)
      const newDateObj = new Date(year, month - 1, day)
      newDateObj.setHours(0, 0, 0, 0)
      const daysFromToday = Math.round((newDateObj - today) / (1000 * 60 * 60 * 24))
      
      setItems(prev => prev.map(item => {
        if (selectedItems.has(item.id)) {
          // Spara custom regel för varje vald vara
          const defaultSuggestion = getExpiryDateSuggestion(item.name)
          if (defaultSuggestion && bulkExpiryDate !== defaultSuggestion.date) {
            setCustomExpiryRule(item.name, daysFromToday)
            console.log(`🧠 Bulk edit: Lärde mig custom regel för \"${item.name}\": ${daysFromToday} dagar`)
          }
          return { ...item, expiresAt: bulkExpiryDate }
        }
        return item
      }))
      
      // Rensa selection och avsluta bulk mode
      setSelectedItems(new Set())
      setBulkEditMode(false)
      setBulkExpiryDate('')
      
      // Uppdatera notifikationer
      if (notificationsEnabled) {
        const updatedItems = items.map(item => 
          selectedItems.has(item.id) ? { ...item, expiresAt: bulkExpiryDate } : item
        )
        notificationService.scheduleExpiryNotifications(updatedItems)
      }
      
      console.log(`✅ Ändrade utgångsdatum för ${selectedItems.size} varor`)
    }
  }
  
  const bulkDeleteItems = () => {
    if (selectedItems.size === 0) return
    
    // Spara för undo
    const itemsToDelete = items.filter(item => selectedItems.has(item.id))
    
    // Räkna varor som inte gått ut ännu
    const notExpiredItems = itemsToDelete.filter(item => daysUntil(item.expiresAt) >= 0)
    
    // Funktion som hanterar bulk-borttagning med besparingar
    const handleBulkRemoveWithSavings = (wereUsed) => {
      saveAction({
        type: 'DELETE_BULK',
        data: { items: itemsToDelete },
        timestamp: Date.now()
      })
      
      // Endast spara besparingar om användaren bekräftar
      if (wereUsed && notExpiredItems.length > 0) {
        let lastSavingsResult = null
        notExpiredItems.forEach(item => {
          lastSavingsResult = savingsTracker.trackSavedItem(item.name, item.quantity || 1)
        })
        
        // Update achievement stats after all items
        if (lastSavingsResult) {
          achievementService.updateStats({
            itemsSaved: lastSavingsResult.itemsSaved,
            totalSaved: lastSavingsResult.totalSaved
          })
        }
      }
      
      // Ta bort valda varor
      setItems(prev => {
        const updated = prev.filter(item => !selectedItems.has(item.id))
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error('Kunde inte spara efter borttagning:', error)
        }
        return updated
      })
      
      // Rensa selection och avsluta bulk mode
      setSelectedItems(new Set())
      setBulkEditMode(false)
      
      console.log(`✅ Tog bort ${itemsToDelete.length} varor`)
    }
    
    // Om det finns varor som inte gått ut, fråga om de användes
    if (notExpiredItems.length > 0) {
      // Kolla om det är första gången
      const hasSeenSavingsPrompt = localStorage.getItem('svinnstop_seen_savings_prompt')
      
      if (!hasSeenSavingsPrompt) {
        // Första gången - visa utförlig förklaring
        setConfirmDialog({
          isOpen: true,
          title: `Använde du dessa ${notExpiredItems.length} varor?`,
          message: `Ja = Varorna användes (räknas som sparat)\\nNej = Varorna slängdes (räknas ej)\\n\\nTips: Endast använda varor räknas som besparingar!`,
          onConfirm: () => {
            localStorage.setItem('svinnstop_seen_savings_prompt', 'true')
            handleBulkRemoveWithSavings(true)
            setConfirmDialog({ ...confirmDialog, isOpen: false })
          },
          onCancel: () => {
            localStorage.setItem('svinnstop_seen_savings_prompt', 'true')
            handleBulkRemoveWithSavings(false)
            setConfirmDialog({ ...confirmDialog, isOpen: false })
          },
          onDismiss: () => {
            // Klicka utanför = avbryt helt, ta inte bort varorna
            setConfirmDialog({ ...confirmDialog, isOpen: false })
          }
        })
      } else {
        // Efterföljande gånger - enkel fråga
        setConfirmDialog({
          isOpen: true,
          title: '',
          message: `Använde du dessa ${notExpiredItems.length} varor?`,
          onConfirm: () => {
            handleBulkRemoveWithSavings(true)
            setConfirmDialog({ ...confirmDialog, isOpen: false })
          },
          onCancel: () => {
            handleBulkRemoveWithSavings(false)
            setConfirmDialog({ ...confirmDialog, isOpen: false })
          },
          onDismiss: () => {
            // Klicka utanför = avbryt helt, ta inte bort varorna
            setConfirmDialog({ ...confirmDialog, isOpen: false })
          }
        })
      }
    } else {
      // Alla varor har gått ut - ta bort direkt
      handleBulkRemoveWithSavings(false)
    }
  }
  
  // Lägg matvaror direkt i inventariet från inköpslistan
  const handleDirectAddToInventory = (inventoryItem) => {
    setItems(prev => {
      const updated = [...prev, inventoryItem]
      
      // VIKTIGT: Spara till localStorage!
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Kunde inte spara till localStorage:', error)
      }
      
      // Uppdatera notifikationer för utgångsdatum
      if (notificationsEnabled) {
        notificationService.scheduleExpiryNotifications(updated)
      }
      
      return updated
    })
    
    // Visa bekräftelse
    console.log(`✅ ${inventoryItem.name} lades till i ditt kylskåp med utgångsdatum ${inventoryItem.expiresAt}`)
  }
  
  // Aktivera notifikationer
  const enableNotifications = async () => {
    try {
      const success = await notificationService.requestPermission()
      if (success) {
        setNotificationsEnabled(true)
        notificationService.scheduleExpiryNotifications(items)
        notificationService.showTestNotification()
        
        // Spara inställning
        localStorage.setItem('svinnstop_notifications_enabled', 'true')
        
        toast.success('Notifikationer aktiverade! Du kommer nu få påminnelser om utgående varor.')
      } else {
        toast.error('Kunde inte aktivera notifikationer. Kontrollera att du tillåter notifikationer i webbläsaren.')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      toast.error('Ett fel uppstod: ' + error.message)
    }
  }
  
  // Inaktivera notifikationer
  const disableNotifications = () => {
    try {
      setNotificationsEnabled(false)
      // Rensa alla schemalagda notifikationer
      notificationService.clearScheduledNotifications()
      
      // Spara inställning
      localStorage.setItem('svinnstop_notifications_enabled', 'false')
      
      toast.info('Notifikationer inaktiverade. Du kommer inte längre få påminnelser.')
    } catch (error) {
      console.error('Error disabling notifications:', error)
      toast.error('Ett fel uppstod: ' + error.message)
    }
  }
  
  // Välja matvaruuttagförslag
  const selectFoodSuggestion = (food) => {
    // FIX: Validera att food-objektet är giltigt
    if (!food || !food.name) {
      console.error('Ogiltigt matvaruuttagförslag:', food)
      return
    }
    
    const suggestion = getExpiryDateSuggestion(food.name)
    
    // STÄNG suggestions först
    setFoodSuggestions([])
    setShowFoodSuggestions(false)
    
    // FÖRDRÖJ state-uppdateringar för att undvika React DOM-fel
    setTimeout(() => {
      // FIX: Använd functional update för att undvika stale state
      setForm(prevForm => ({
        ...prevForm,
        name: food.name,
        quantity: 1,
        expiresAt: suggestion && suggestion.date ? suggestion.date : ''
      }))
      
      // Sätt kategori från suggestion så dropdown inte visas
      if (suggestion && suggestion.category) {
        setSelectedInventoryCategory(suggestion.category)
      }
      
      // Sätt korrekt enhet från suggestion (t.ex. L för mjölk)
      if (suggestion && suggestion.defaultUnit) {
        setSelectedInventoryUnit(suggestion.defaultUnit)
      }
      
      // Fokusera på quantity-fältet
      const quantityInput = document.querySelector('input[name="quantity"]')
      if (quantityInput) quantityInput.focus()
    }, 50)
  }
  
  // Lägg till matvaror från recept i inköpslistan
  const addMatvarorToShoppingList = (ingredients) => {
    const currentShoppingList = JSON.parse(localStorage.getItem('svinnstop_shopping_list') || '[]')
    
    ingredients.forEach(ingredient => {
      // Kolla om varan redan finns i inköpslistan
      const existingItem = currentShoppingList.find(item => 
        item.name.toLowerCase() === ingredient.name.toLowerCase()
      )
      
      // Normalisera enhet - fixa Google Translate-fel
      let normalizedUnit = ingredient.unit
      if (normalizedUnit === 'miljoner' || normalizedUnit === 'militär' || normalizedUnit === 'million') {
        normalizedUnit = 'ml'
      }
      
      if (!existingItem) {
        // Använd getExpiryDateSuggestion som redan finns i SWEDISH_FOODS eller AI
        const foodSuggestion = getExpiryDateSuggestion(ingredient.name)
        const emoji = foodSuggestion.emoji || '📋'
        
        const newShoppingItem = {
          id: Date.now() + Math.random(),
          name: ingredient.name,
          category: 'recept',
          emoji: emoji,
          unit: normalizedUnit,
          quantity: ingredient.quantity,
          completed: false,
          isFood: true,
          addedAt: Date.now()
        }
        
        currentShoppingList.unshift(newShoppingItem)
      } else {
        // Uppdatera kvantiteten om varan redan finns
        existingItem.quantity = Math.max(existingItem.quantity, ingredient.quantity)
        existingItem.unit = normalizedUnit
      }
    })
    
    // Lär appen om nya ingredienser från receptet EFTER att vi lagt till dem
    learnIngredientsFromRecipe(ingredients)
    
    // Spara uppdaterad lista
    localStorage.setItem('svinnstop_shopping_list', JSON.stringify(currentShoppingList))
    
    // Visa bekräftelse
    toast.success(`Lade till ${ingredients.length} matvaror i inköpslistan!`)
  }
  

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))
    return copy
  }, [items])

  const filtered = useMemo(() => {
    const now = new Date()
    let result = items
    
    // Tillämpa statusfilter
    if (filter === 'expiring') {
      result = result.filter(i => daysUntil(i.expiresAt) <= 3 && daysUntil(i.expiresAt) >= 0)
    } else if (filter === 'expired') {
      result = result.filter(i => new Date(i.expiresAt) < now)
    }
    
    // Tillämpa sökfilter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(i => 
        i.name.toLowerCase().includes(query) ||
        i.quantity.toString().includes(query) ||
        (i.expiresAt && i.expiresAt.includes(query))
      )
    }
    
    // Sortera efter kategori och alfabetisk ordning
    return sortInventoryItems(result)
  }, [items, filter, searchQuery])

  // Mina recept - använd endast recept från rekommenderade (internet-recept)
  const suggestions = useMemo(() => {
    if (internetRecipes.length === 0) return []
    return suggestRecipes(items, internetRecipes)
  }, [items, internetRecipes])
  
  // Rekommenderade recept från internet med kategorifilter
  const recommendedRecipes = useMemo(() => {
    let recipesToShow = []
    
    if (internetRecipes.length > 0) {
      recipesToShow = internetRecipes
    } else {
      // Fallback till lokala recept om internet-recept inte laddats än
      recipesToShow = recipes.sv || []
    }
    
    // Filtrera baserat på vald kategori
    if (recipeCategory === 'alla') {
      return recipesToShow
    }
    
    return recipesToShow.filter(recipe => {
      const recipeTags = recipe.tags || []
      const recipeArea = recipe.area?.toLowerCase() || ''
      const recipeCat = recipe.category?.toLowerCase() || ''
      
      switch (recipeCategory) {
        case 'thai':
          return recipeArea === 'thai' || recipeTags.includes('thai') || recipeTags.includes('asiatiskt')
        case 'italienskt':
          return recipeArea === 'italian' || recipeTags.includes('italian') || recipeTags.includes('pasta') || recipeTags.includes('pizza')
        case 'husmanskost':
          return recipeArea === 'swedish' || recipeTags.includes('swedish') || recipeTags.includes('husmanskost') || recipeTags.includes('klassiskt')
        case 'vegetariskt':
          return recipeTags.includes('vegetarian') || recipeTags.includes('vegetariskt')
        case 'kyckling':
          return recipeTags.includes('chicken') || recipeTags.includes('kyckling')
        case 'fisk':
          return recipeTags.includes('seafood') || recipeTags.includes('fisk') || recipeTags.includes('salmon') || recipeTags.includes('lax')
        case 'snabbt':
          return recipeTags.includes('snabbt') || recipeTags.includes('quick') || recipe.difficulty === 'Lätt'
        case 'dessert':
          return recipeTags.includes('dessert') || recipeTags.includes('efterrätt') || recipeTags.includes('sweet')
        default:
          return true
      }
    })
  }, [internetRecipes, recipeCategory])
  
  // Hämta föreslagen enhet baserat på nuvarande varans namn
  const suggestedUnitKey = useMemo(() => {
    const key = getSuggestedUnitKey(form.name)
    return key
  }, [form.name])
  const suggestedUnit = useMemo(() => {
    // Använd currentDisplayUnit om dialogen är öppen, annars föreslagen enhet
    if (showInventoryDialog) {
      return currentDisplayUnit
    }
    const unit = SV_UNITS[suggestedUnitKey] || SV_UNITS.defaultUnit
    return unit
  }, [suggestedUnitKey, showInventoryDialog, currentDisplayUnit])

  
  // Handle notification permission granted
  const handleNotificationPermission = async (granted) => {
    setShowNotificationPrompt(false)
    
    if (granted) {
      // Service worker är redan registrerad av notificationService.requestPermission()
      setNotificationsEnabled(true)
      localStorage.setItem('svinnstop_notifications_enabled', 'true')
      
      // Schemalägg notifikationer för befintliga varor
      if (items.length > 0) {
        notificationService.scheduleExpiryNotifications(items)
      }
      
      // Visa test-notifikation (kör asynkront)
      notificationService.showTestNotification().catch(err => {
        console.warn('Test-notifikation kunde inte visas:', err)
      })
    }
  }
  
  // Handle notification prompt dismiss
  const handleNotificationDismiss = () => {
    setShowNotificationPrompt(false)
  }

  // SECURITY: Visa login screen om användaren inte är inloggad
  // Ingen anonym auth - användare MÅSTE logga in
  // Men tillåt tillgång till FAQ/villkor/integritetspolicy
  // Scrolla till toppen när FAQ öppnas
  useEffect(() => {
    if (activeTab === 'faq') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [activeTab])
  
  if (isAuthReady && !auth.currentUser) {
    // Om användaren vill se FAQ, visa det utan inloggning
    if (activeTab === 'faq') {
      return (
        <div className="container" style={{ paddingTop: 0 }}>
          <div style={{
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('welcome')}
              style={{marginBottom: '16px', marginTop: '20px'}}
            >
              ← Tillbaka till start
            </button>
            <FAQ />
          </div>
        </div>
      )
    }
    
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'var(--bg-primary)',
        padding: '20px',
        paddingTop: '60px',
        textAlign: 'center',
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '900px',
          width: '100%',
          padding: '40px 20px'
        }}>
          {/* Hero Section */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ 
              fontSize: '56px', 
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>
              <span className="notranslate">Svinnstop</span>
            </h1>
            <p style={{ 
              fontSize: '24px', 
              marginBottom: '16px', 
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}>
              Minska matsvinnet. Spara pengar.
            </p>
            <p style={{ 
              fontSize: '16px',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 40px'
            }}>
              Håll koll på dina matvaror, få receptförslag och spåra besparingar. Tillsammans minskar vi matsvinnet.
            </p>
            
            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '48px' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setAuthModalMode('signup')
                  setShowAuthModal(true)
                }}
                style={{ 
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                Kom igång gratis
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setAuthModalMode('login')
                  setShowAuthModal(true)
                }}
                style={{ padding: '16px 32px', fontSize: '16px', fontWeight: '600' }}
              >
                Logga in
              </button>
            </div>
          </div>
          
          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              padding: '24px',
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <Home size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Kylskåpskoll</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Håll koll på alla dina matvaror och utgångsdatum på ett ställe
              </p>
            </div>
            
            <div style={{
              padding: '24px',
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <ChefHat size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>AI-Recept</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Få skräddarsydda receptförslag baserat på dina ingredienser
              </p>
            </div>
            
            <div style={{
              padding: '24px',
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <TrendingUp size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Spåra Besparingar</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Se hur mycket pengar och miljö du sparar genom att minska svinn
              </p>
            </div>
            
            <div style={{
              padding: '24px',
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <Users size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Familjesynk</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Dela kylskåp och inköpslistor med hela familjen i realtid
              </p>
            </div>
          </div>
          
          {/* Stats/Social Proof */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '64px',
            marginBottom: '48px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>0 kr</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Helt gratis att börja</div>
            </div>
            <div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>500+ kr</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sparad per månad</div>
            </div>
            <div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>30%</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Minskat matsvinn</div>
            </div>
          </div>
          
          {/* Footer Links */}
          <div style={{ 
            marginTop: '32px', 
            paddingTop: '32px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '14px', 
            color: 'var(--text-secondary)' 
          }}>
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setPendingFAQSection('terms')
                setActiveTab('faq')
              }}
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                marginRight: '16px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-color)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Användarvillkor
            </a>
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setPendingFAQSection('privacy')
                setActiveTab('faq')
              }}
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-color)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Integritetspolicy
            </a>
          </div>
        </div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authModalMode}
        />
      </div>
    )
  }

  return (
    <>
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Välkomstdialog */}
      {showGuideWelcome && (
        <GuideWelcome
          onStart={() => {
            setShowGuideWelcome(false)
            setGuideActive(true)
            setGuideStep(0)
          }}
          onSkip={() => {
            setShowGuideWelcome(false)
            localStorage.setItem('svinnstop_guide_seen', 'true')
          }}
        />
      )}

      {/* Guide Badge */}
      {guideActive && (
        <GuideBadge
          key={guideStep}
          step={guideStep + 1}
          totalSteps={8}
          instruction={getGuideInstruction(guideStep)}
          details={getGuideDetails(guideStep)}
          onClose={() => {
            setGuideActive(false)
            localStorage.setItem('svinnstop_guide_seen', 'true')
          }}
        />
      )}
      
      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <NotificationPrompt 
          onPermissionGranted={handleNotificationPermission}
          onDismiss={handleNotificationDismiss}
        />
      )}
      
      {/* Achievement Celebration */}
      {activeAchievement && (
        <AchievementCelebration
          achievement={activeAchievement}
          onClose={() => setActiveAchievement(null)}
        />
      )}
      
      <button
        className="undo-btn" 
        onClick={undoLastAction}
        disabled={!canUndo}
        title="Ångra senaste borttagning"
        aria-label="Ångra senaste borttagning"
      >
        <Undo2 size={18} /> Ångra
      </button>
      
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1 className="app-title"><span className="notranslate">Svinnstop</span></h1>
          <p className="app-mission">Minska matsvinnet. Spara pengar.</p>
          <p className="header-subtitle">Spåra din inköpta mat, utgångsdatum och se receptidéer</p>
        </div>
      </header>
      
      {/* Optimized 4-Tab Navigation */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <span className="tab-icon"><ShoppingCart size={20} /></span>
          <span className="tab-label">Inköpslista</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="tab-icon"><Home size={20} /></span>
          <span className="tab-label">Kylskåp</span>
          {items.length > 0 && <span className="tab-badge">{items.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          <span className="tab-icon"><ChefHat size={20} /></span>
          <span className="tab-label">Recept</span>
          {suggestions.length > 0 && <span className="tab-badge">{suggestions.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon"><User size={20} /></span>
          <span className="tab-label">Profil</span>
        </button>
      </nav>
      
      {/* Tab Content */}
      <div className="tab-content">
        
        {/* Inköpslista-fliken - primär användning */}
        {activeTab === 'shopping' && (
          <div className="tab-panel">
            <ShoppingList 
              onDirectAddToInventory={handleDirectAddToInventory}
              isPremium={hasAnyPremium()}
              currentInventoryCount={items.length}
              onShowUpgradeModal={() => setShowUpgradeModal(true)}
              guideActive={guideActive}
              guideStep={guideStep}
              onGuideAdvance={() => setGuideStep(6)}
            />
          </div>
        )}
        
        {/* Kylskåp-fliken - kombinerat: lägg till + mina varor */}
        {activeTab === 'inventory' && (
          <div className="tab-panel">
            <section className="card add-item-card">
              <div className="card-header">
                <h2>Lägg in vara</h2>
                <p className="card-subtitle">Fyll i information om varan</p>
              </div>
              
              <form onSubmit={onAdd} className="add-form">
                <div className="form-section">
                  <label className="form-label">
                    <span className="label-text">Namn på vara</span>
                    <div className="input-with-suggestions">
                      <input 
                        name="name" 
                        value={form.name} 
                        onChange={onChange} 
                        placeholder="t.ex. mjölk, äpplen, kött..."
                        required
                        autoComplete="off"
                        className="form-input"
                      />
                      {showFoodSuggestions && foodSuggestions.length > 0 && (
                        <div className="food-suggestions">
                          <div className="suggestions-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span>Förslag:</span>
                            <button 
                              type="button" 
                              onClick={closeFoodSuggestionsAndShowDialog}
                              style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--muted)', padding: '0 4px'}}
                              title="Stäng förslag"
                            >
                              ✕
                            </button>
                          </div>
                          {foodSuggestions.map((food, index) => (
                            <button
                              key={`${food.name}-${food.category}-${index}`}
                              type="button"
                              className="food-suggestion"
                              onClick={() => selectFoodSuggestion(food)}
                            >
                              <span className="suggestion-name notranslate" translate="no">{food.name}</span>
                              <span className="suggestion-category">{food.category}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                
                {/* Kategoriväljare - visas endast när kategorin är okänd (övrigt) */}
                {form.name && !showFoodSuggestions && selectedInventoryCategory === 'övrigt' && (
                  <div className="form-section" style={{marginTop: '16px'}}>
                    <label className="form-label">
                      <span className="label-text">Kategori (okänd vara)</span>
                      <select 
                        value={selectedInventoryCategory}
                        onChange={(e) => setSelectedInventoryCategory(e.target.value)}
                        className="form-input"
                      >
                        <option value="frukt">Frukt</option>
                        <option value="grönsak">Grönsak</option>
                        <option value="kött">Kött</option>
                        <option value="fisk">Fisk & skaldjur</option>
                        <option value="mejeri">Mejeri</option>
                        <option value="dryck">Dryck</option>
                        <option value="övrigt">Övrigt</option>
                      </select>
                    </label>
                  </div>
                )}
                
                <div className="form-row">
                  <label className="form-label">
                    <span className="label-text">Antal</span>
                    <div className="quantity-input-container">
                      <input 
                        type="number" 
                        name="quantity" 
                        min="0" 
                        step={suggestedUnitKey === 'pieces' ? '1' : '0.1'}
                        inputMode={suggestedUnitKey === 'pieces' ? 'numeric' : 'decimal'}
                        value={form.quantity} 
                        onChange={onChange}
                        onFocus={(e) => e.target.select()}
                        placeholder="1"
                        className="form-input quantity-input"
                        required
                      />
                      <select 
                        value={selectedInventoryUnit}
                        onChange={(e) => {
                          setSelectedInventoryUnit(e.target.value)
                          setCurrentDisplayUnit(e.target.value)
                          setUserSelectedUnit(true) // Markera att användaren har valt en enhet
                        }}
                        className="form-input"
                        style={{width: 'auto', minWidth: '80px', marginLeft: '8px'}}
                      >
                        <option value="st">st</option>
                        <option value="kg">kg</option>
                        <option value="hg">hg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="dl">dl</option>
                        <option value="cl">cl</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                  </label>
                  
                  <label className="form-label">
                    <span className="label-text">Utgångsdatum</span>
                    <div className="expiry-input-container">
                      <input 
                        type="date" 
                        name="expiresAt" 
                        value={form.expiresAt} 
                        onChange={onChange}
                        min={new Date().toISOString().split('T')[0]}
                        required 
                        className="form-input"
                      />
                      {form.name && (
                        <div className="expiry-helper">
                          <button 
                            type="button"
                            className="ai-suggestion-btn"
                            onClick={() => {
                              const suggestion = getExpiryDateSuggestion(form.name)
                              setForm(prev => ({ ...prev, expiresAt: suggestion.date }))
                              console.log(`🤖 AI-förslag: ${form.name} = ${suggestion.date}${suggestion.hasCustomRule ? ' (custom regel)' : ''}`)
                            }}
                            title="Använd AI-förslag som utgångspunkt"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                          >
                            <Bot size={16} /> AI-förslag
                          </button>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={!form.name || !form.expiresAt || form.quantity <= 0}
                    className="btn-primary btn-large"
                  >
                    Lägg till i kylskåp
                  </button>
                  <div className="form-preview" style={{color: form.name && form.expiresAt && form.quantity > 0 ? 'inherit' : 'var(--muted)'}}>
                    <small>
                      {form.name && form.expiresAt && form.quantity > 0 ? (
                        `Lägger till: ${form.quantity} ${selectedInventoryUnit} ${form.name} som går ut ${form.expiresAt}`
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} />
                          {!form.name ? 'Namn saknas' :
                          !form.expiresAt ? 'Utgångsdatum saknas' :
                          form.quantity <= 0 ? 'Antal måste vara större än 0' :
                          ''}
                        </span>
                      )}
                    </small>
                  </div>
                </div>
              </form>
            </section>
            
            {/* Mina varor section */}
            <section className="card inventory-card">
              <div className="card-header">
                <div className="header-main">
                  <h2>Mina varor</h2>
                  {items.length > 0 && (
                    <div className="inventory-stats">
                      <span className="stat-item"><span className="notranslate">{items.length} varor totalt</span></span>
                      <span className="stat-item"><span className="notranslate">{filtered.filter(i => daysUntil(i.expiresAt) <= 3 && daysUntil(i.expiresAt) >= 0).length} går ut snart</span></span>
                    </div>
                  )}
                </div>
                <div className="header-actions">
                  {items.length > 0 && (
                    <button 
                      onClick={toggleBulkEditMode}
                      className={`bulk-edit-toggle ${bulkEditMode ? 'active' : ''}`}
                      title={bulkEditMode ? 'Avsluta redigering' : 'Ändra utgångsdatum för flera varor'}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {bulkEditMode ? <><X size={16} /> Avsluta</> : 'Redigera varor'}
                    </button>
                  )}
                </div>
              </div>
              <div className="inventory-controls">
                <div className="search-section">
                  <div className="search-container">
                    <input 
                      type="text" 
                      placeholder="Sök bland dina varor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchQuery && (
                      <button 
                        className="search-clear"
                        onClick={() => setSearchQuery('')}
                        title="Rensa sökning"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="filter-section">
                  <div className="filter-tabs">
                    <button 
                      className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                      onClick={() => setFilter('all')}
                    >
                      <span className="notranslate">Alla</span>
                    </button>
                    <button 
                      className={`filter-tab ${filter === 'expiring' ? 'active' : ''}`}
                      onClick={() => setFilter('expiring')}
                    >
                      <span className="notranslate">Går ut snart</span>
                    </button>
                    <button 
                      className={`filter-tab ${filter === 'expired' ? 'active' : ''}`}
                      onClick={() => setFilter('expired')}
                    >
                      <span className="notranslate">Utgångna</span>
                    </button>
                  </div>
                </div>
              </div>
              {bulkEditMode && (
                <div className="bulk-edit-panel">
                  <div className="bulk-edit-header">
                    <div className="bulk-status">
                      <span className="bulk-text">Redigerings-läge</span>
                      <span className="bulk-count">{selectedItems.size} av {filtered.length} valda</span>
                    </div>
                  </div>
                  
                  <div className="bulk-actions-row">
                    <button onClick={selectAllVisible} className="bulk-action-btn">
                      Välj alla
                    </button>
                    <button onClick={deselectAll} className="bulk-action-btn">
                      Rensa urval
                    </button>
                  </div>
                  
                  {selectedItems.size > 0 && (
                    <>
                      <div className="bulk-date-section">
                        <div className="bulk-date-header">
                          <h4>Ändra utgångsdatum</h4>
                          <span className="selected-count">{selectedItems.size} varor valda</span>
                        </div>
                        <div className="bulk-date-controls">
                          <input 
                            type="date" 
                            value={bulkExpiryDate} 
                            onChange={(e) => setBulkExpiryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="bulk-date-input"
                            placeholder="Välj nytt datum"
                          />
                          <button 
                            onClick={applyBulkExpiryDate}
                            className="bulk-apply-btn"
                            disabled={!bulkExpiryDate}
                          >
                            Uppdatera {selectedItems.size} varor
                          </button>
                        </div>
                      </div>
                      
                      <div className="bulk-delete-section">
                        <button 
                          onClick={bulkDeleteItems}
                          className="bulk-delete-btn btn-danger"
                        >
                          Ta bort {selectedItems.size} valda varor
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <p>
                    <span>{items.length === 0 
                      ? 'Inga varor ännu. Börja genom att lägga till din första vara!'
                      : searchQuery.trim() 
                        ? `Inga varor hittades för "${searchQuery}". Försök med andra sökord.`
                        : 'Inga varor matchar det valda filtret. Försök med ett annat filter.'}</span>
                  </p>
                </div>
              ) : (
                <ul className="items">
                  {filtered.map(i => {
                    const d = daysUntil(i.expiresAt)
                    const status = d < 0 ? 'Utgången' : d === 0 ? 'Går ut idag' : formatDaysLeft(d)
                    return (
                      <li key={i.id} className={`${d < 0 ? 'expired' : d <= 3 ? 'expiring' : ''} ${bulkEditMode ? 'bulk-edit-mode' : ''} ${selectedItems.has(i.id) ? 'selected' : ''}`}>
                        {bulkEditMode && (
                          <div className="item-checkbox">
                            <input 
                              type="checkbox" 
                              checked={selectedItems.has(i.id)}
                              onChange={() => toggleSelectItem(i.id)}
                              id={`bulk-item-${i.id}`}
                            />
                            <label htmlFor={`bulk-item-${i.id}`} className="checkbox-label"></label>
                          </div>
                        )}
                        <div className="item-content">
                          <div className="item-main">
                            <strong className="notranslate" translate="no">{i.name}</strong>
                            <span className="item-quantity notranslate" translate="no">{i.quantity} {i.quantity === 1 && i.unit === 'stycken' ? 'stycke' : i.unit}</span>
                          </div>
                          <div className="item-sub">
                            <span className="status">{status}</span>
                          </div>
                        </div>
                        {!bulkEditMode && (
                          <div className="item-actions">
                          <button 
                            className="remove-btn" 
                            onClick={(e) => onRemove(i.id, e)}
                            title="Ta bort denna vara"
                            aria-label="Ta bort denna vara"
                          >
                            ×
                          </button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
            
            {/* Ad Banner - After inventory list */}
            <AdBanner className="bottom" />
          </div>
        )}
        
        {/* Recept flik */}
        {activeTab === 'recipes' && (
          <div className="tab-panel">
            <section className="card">
              <div className="section-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Recept {!hasAnyPremium() && <Lock size={18} />}</h2>
                <p className="section-subtitle">Hitta inspiration för din matlagning</p>
              </div>
              
              {!hasAnyPremium() ? (
                <div className="premium-required-message">
                  <div className="premium-required-content">
                    <div className="premium-icon"><ChefHat size={48} /></div>
                    <h3>Receptförslag kräver Premium</h3>
                    <p>Få smarta receptförslag baserat på vad du har i kylskåpet</p>
                    <button 
                      className="upgrade-btn-inline"
                      onClick={() => setShowUpgradeModal(true)}
                    >
                      Uppgradera till Premium
                    </button>
                  </div>
                </div>
              ) : (
                <>
                {/* Sub-tabs för recept */}
                <div className="recipe-tabs">
                <button 
                  className={`recipe-tab-btn ${recipeTab === 'mine' ? 'active' : ''}`}
                  onClick={() => {
                    setRecipeTab('mine')
                    setShowAIRecipeGenerator(false)
                  }}
                >
                  Mina recept
                  {suggestions.length > 0 && <span className="tab-count">{suggestions.length}</span>}
                </button>
                <button 
                  className={`recipe-tab-btn ${recipeTab === 'recommended' ? 'active' : ''}`}
                  onClick={() => {
                    setRecipeTab('recommended')
                    setShowAIRecipeGenerator(false)
                  }}
                >
                  Rekommenderade
                  <span className="tab-count">{recommendedRecipes.length}</span>
                </button>
                {items.length > 0 && (
                  <button 
                    className={`recipe-tab-btn ${recipeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => {
                      setRecipeTab('ai')
                      setShowAIRecipeGenerator(true)
                    }}
                  >
                    AI-Recept
                  </button>
                )}
                <button 
                  className={`recipe-tab-btn ${recipeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => {
                    setRecipeTab('saved')
                    setShowAIRecipeGenerator(false)
                    // Uppdatera listan när man klickar på fliken
                    const updated = getSavedAIRecipes()
                    setSavedAIRecipes(updated)
                  }}
                >
                  Sparade AI-recept
                  {savedAIRecipes.length > 0 && <span className="tab-count">{savedAIRecipes.length}</span>}
                </button>
              </div>
              
              {/* Ad Banner - Before recipes list */}
              <AdBanner className="top" />
              
              {/* Mina recept tab */}
              {recipeTab === 'mine' && (
                <div className="recipe-tab-content">
                  {suggestions.length === 0 ? (
                    <div className="empty-recipes">
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        {items.length === 0 
                        ? <><Package size={20} /> Lägg till varor i ditt kylskåp för att få personliga receptförslag!</> 
                        : <><Search size={20} /> Inga recept hittades med dina nuvarande varor. Försök lägga till fler basvaror som ägg, mjölk eller pasta!</>}
                      </p>
                    </div>
                  ) : (
                    <div className="recipes">
                      {suggestions.map(r => (
                        <div key={r.id} className={`recipe-card ${r.hasExpiringIngredients ? 'urgent-recipe' : ''}`}>
                          <div className="recipe-header">
                            <h3 className="notranslate">{r.name}</h3>
                            <div className="recipe-meta">
                              <span className="servings" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {r.servings} portioner</span>
                              <span className="time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {svTimeLabel(r.cookingTime)}</span>
                              <span className={`difficulty ${svDifficultyClass(r.difficulty)}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart3 size={14} /> {svDifficultyLabel(r.difficulty)}</span>
                              {r.hasExpiringIngredients && (
                                <span className="urgency-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14} /> Snart utgånget ({r.expiringIngredientsCount})</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="recipe-ingredients">
                            <h4>Matvaror som behövs:</h4>
                            <ul>
                              {r.usedIngredients.map((ingredient, idx) => (
                                <li key={idx} className={`ingredient-item ${ingredient.isExpiring ? 'expiring-ingredient' : ''} ${ingredient.isExpired ? 'expired-ingredient' : ''}`}>
                                  <span className="ingredient-amount notranslate">
                                    {ingredient.quantity} {ingredient.unit}
                                  </span>
                                  <span className="ingredient-name notranslate">{ingredient.name}</span>
                                  <span className="ingredient-available">
                                    <span>(Du har: {ingredient.availableQuantity} {abbreviateUnit(ingredient.availableUnit || ingredient.unit)} {ingredient.itemName})</span>
                                    {ingredient.isExpiring && (
                                      <span className="expiry-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Går ut om {ingredient.daysLeft} dag{ingredient.daysLeft !== 1 ? 'ar' : ''}</span>
                                    )}
                                    {ingredient.isExpired && (
                                      <span className="expired-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> Utgången</span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="recipe-instructions">
                            <h4>Instruktioner:</h4>
                            <p>{r.instructions}</p>
                          </div>
                          
                          {r.tags && (
                            <div className="recipe-tags">
                              {r.tags.map(tag => (
                                <span key={tag} className="recipe-tag">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Rekommenderade recept tab */}
              {recipeTab === 'recommended' && (
                <div className="recipe-tab-content">
                  {/* Kategorifilter */}
                  <div className="recipe-category-filters">
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'alla' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('alla')}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <UtensilsCrossed size={16} /> Alla
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'thai' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('thai')}
                    >
                      🌶️ Thai
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'italienskt' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('italienskt')}
                    >
                      🍝 Italienskt
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'husmanskost' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('husmanskost')}
                    >
                      🇸🇪 Husmanskost
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'vegetariskt' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('vegetariskt')}
                    >
                      🥗 Vegetariskt
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'kyckling' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('kyckling')}
                    >
                      🍗 Kyckling
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'fisk' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('fisk')}
                    >
                      🐟 Fisk & Skaldjur
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'snabbt' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('snabbt')}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Zap size={16} /> Snabbt
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'dessert' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('dessert')}
                    >
                      🍰 Dessert
                    </button>
                  </div>
                  
                  {loadingRecipes ? (
                    <Spinner size={32} text="Laddar populära recept från internet..." />
                  ) : recommendedRecipes.length === 0 ? (
                    <div className="empty-recipes">
                      <p>😔 Inga recept hittades i kategorin "{
                        recipeCategory === 'alla' ? 'Alla' :
                        recipeCategory === 'thai' ? 'Thai' :
                        recipeCategory === 'italienskt' ? 'Italienskt' :
                        recipeCategory === 'husmanskost' ? 'Husmanskost' :
                        recipeCategory === 'vegetariskt' ? 'Vegetariskt' :
                        recipeCategory === 'kyckling' ? 'Kyckling' :
                        recipeCategory === 'fisk' ? 'Fisk & Skaldjur' :
                        recipeCategory === 'snabbt' ? 'Snabbt' :
                        recipeCategory === 'dessert' ? 'Dessert' : recipeCategory
                      }". Försök en annan kategori!</p>
                    </div>
                  ) : (
                  <div className="recipes">
                    {recommendedRecipes.map(r => (
                      <div key={r.id} className="recipe-card recommended-recipe">
                        <div className="recipe-header">
                          <h3 className="notranslate">{r.name}</h3>
                          <div className="recipe-meta">
                            <span className="servings" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {r.servings} portioner</span>
                            <span className="time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {svTimeLabel(r.cookingTime)}</span>
                            <span className={`difficulty ${svDifficultyClass(r.difficulty)}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart3 size={14} /> {svDifficultyLabel(r.difficulty)}</span>
                          </div>
                        </div>
                        
                        <div className="recipe-ingredients">
                          <h4>Matvaror som behövs:</h4>
                          <ul>
                            {r.ingredients.map((ingredient, idx) => (
                              <li key={idx} className="ingredient-item">
                                <span className="ingredient-amount notranslate" translate="no">
                                  {ingredient.quantity} {ingredient.unit}
                                </span>
                                <span className="ingredient-name notranslate" translate="no">{ingredient.name}</span>
                              </li>
                            ))}
                          </ul>
                          <button 
                            className="add-to-shopping-btn"
                            onClick={() => addMatvarorToShoppingList(r.ingredients)}
                            title="Lägg till alla matvaror i inköpslistan"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                          >
                            <ShoppingBag size={16} /> Lägg till i inköpslista
                          </button>
                        </div>
                        
                        <div className="recipe-instructions">
                          <h4>Instruktioner:</h4>
                          <p>{r.instructions}</p>
                        </div>
                        
                        {r.tags && (
                          <div className="recipe-tags">
                            {r.tags.map(tag => (
                              <span key={tag} className="recipe-tag">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}
              
              {/* Sparade AI-recept tab */}
              {recipeTab === 'saved' && (
                <div className="recipe-tab-content">
                  {savedAIRecipes.length === 0 ? (
                    <div className="empty-recipes">
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><Bot size={20} /> Inga sparade AI-recept ännu!</p>
                      <p style={{fontSize: '14px', marginTop: '8px', color: 'var(--muted)'}}>Generera recept i AI-Recept-fliken för att spara dem här.</p>
                    </div>
                  ) : (
                    <div className="recipes">
                      {savedAIRecipes.map(r => (
                        <div key={r.id} className="recipe-card ai-recipe-card">
                          <div className="recipe-header">
                            <h3 className="notranslate">{r.name}</h3>
                            <button 
                              className="delete-recipe-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Radera recept',
                                  message: `Är du säker på att du vill radera "${r.name}"?`,
                                  onConfirm: () => {
                                    deleteAIRecipe(r.id)
                                    const updated = getSavedAIRecipes()
                                    setSavedAIRecipes(updated)
                                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null })
                                  },
                                  onCancel: () => {
                                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null })
                                  }
                                })
                              }}
                              title="Radera recept"
                            >
                              Ta bort
                            </button>
                          </div>
                          
                          <div className="recipe-meta">
                            <span className="servings" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {r.servings} portioner</span>
                            <span className="time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Förberedelse: {r.prepTime}</span>
                            <span className="time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={14} /> Tillagning: {r.cookTime}</span>
                            <span className="difficulty" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BarChart3 size={14} /> {r.difficulty}</span>
                          </div>
                          
                          <p className="recipe-description">{r.description}</p>
                          
                          {r.warning && (
                            <div className="ai-recipe-warning" style={{ display: 'flex', gap: '8px' }}>
                              <AlertTriangle size={18} strokeWidth={2} />
                              <div><strong>Obs:</strong> {r.warning}</div>
                            </div>
                          )}
                          
                          <button 
                            className="view-recipe-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Visar recept:', r.name, r)
                              setSelectedSavedRecipe(r)
                            }}
                          >
                            Visa fullständigt recept
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </section>
          </div>
        )}
        
        {/* Profil-flik - samlad plats för alla inställningar och funktioner */}
        {activeTab === 'profile' && (
          <div className="tab-panel">
            <section className="card">
              <div className="card-header">
                <h2>Profil & Inställningar</h2>
                <p className="card-subtitle">Hantera ditt konto och appinställningar</p>
              </div>

              {/* Mitt Konto - sektion */}
              <div style={{
                padding: '16px',
                marginBottom: '16px',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px'
              }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Mitt Konto</h3>
                {auth?.currentUser && !auth.currentUser.isAnonymous ? (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '8px'
                    }}>
                      <UserCircle2 size={24} strokeWidth={2} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          {auth.currentUser.email}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Inloggad med email
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setAuthModalMode('reset')
                          setShowAuthModal(true)
                        }}
                        style={{ flex: 1, fontSize: '14px' }}
                      >
                        Byt lösenord
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          if (window.confirm('Är du säker på att du vill logga ut?')) {
                            try {
                              await signOut(auth)
                              console.log('✅ Logged out')
                              toast.success('Du har loggats ut. Dina lokala data finns kvar och du kan logga in igen när som helst.')
                              window.location.reload()
                            } catch (error) {
                              console.error('❌ Logout error:', error)
                              toast.error('Kunde inte logga ut. Försök igen.')
                            }
                          }
                        }}
                        style={{ flex: 1, fontSize: '14px' }}
                      >
                        Logga ut
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Du använder ett anonymt konto. Skapa ett konto för att kunna logga in på flera enheter och få kvitton via email.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          console.log('👉 Skapa konto clicked')
                          setAuthModalMode('signup')
                          setShowAuthModal(true)
                          console.log('showAuthModal set to true, mode: signup')
                        }}
                        style={{ flex: 1 }}
                      >
                        Skapa konto
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          console.log('👉 Logga in clicked')
                          setAuthModalMode('login')
                          setShowAuthModal(true)
                          console.log('showAuthModal set to true, mode: login')
                        }}
                        style={{ flex: 1 }}
                      >
                        Logga in
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Snabblinkar till huvudfunktioner */}
              <div className="profile-menu">
                {!hasAnyPremium() && (
                  <button
                    className="profile-menu-item premium-highlight"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <span className="menu-icon"><Sparkles size={20} /></span>
                    <div className="menu-content">
                      <span className="menu-title">Uppgradera till Premium</span>
                      <span className="menu-description">Få tillgång till alla funktioner</span>
                    </div>
                    <span className="menu-arrow">›</span>
                  </button>
                )}
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    toggleTheme();
                  }}
                >
                  <span className="menu-icon">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</span>
                  <div className="menu-content">
                    <span className="menu-title">{theme === 'dark' ? 'Ljust läge' : 'Mörkt läge'}</span>
                    <span className="menu-description">Byt utseende på appen</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    const isPremium = hasAnyPremium()
                    if (!isPremium) {
                      setShowUpgradeModal(true)
                      return
                    }
                    if (notificationsEnabled) {
                      disableNotifications();
                    } else {
                      enableNotifications();
                    }
                  }}
                >
                  <span className="menu-icon">{notificationsEnabled ? <BellOff size={20} /> : <Bell size={20} />}</span>
                  <div className="menu-content">
                    <span className="menu-title">{notificationsEnabled ? 'Inaktivera notiser' : 'Aktivera notiser'}</span>
                    <span className="menu-description" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{notificationsEnabled ? 'Stäng av påminnelser' : 'Få påminnelser om utgående varor'} {!hasAnyPremium() && <Lock size={12} />}</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    const isPremium = hasAnyPremium()
                    if (!isPremium) {
                      setShowUpgradeModal(true)
                      return
                    }
                    setActiveTab('savings')
                  }}
                >
                  <span className="menu-icon"><TrendingUp size={20} /></span>
                  <div className="menu-content">
                    <span className="menu-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Avancerad Statistik {!hasAnyPremium() && <Lock size={14} />}</span>
                    <span className="menu-description">Besparingar, miljöpåverkan & framsteg</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    const isPremium = hasAnyPremium()
                    if (!isPremium) {
                      setShowUpgradeModal(true)
                      return
                    }
                    setActiveTab('achievements')
                  }}
                >
                  <span className="menu-icon"><Trophy size={20} /></span>
                  <div className="menu-content">
                    <span className="menu-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Utmärkelser {!hasAnyPremium() && <Lock size={14} />}</span>
                    <span className="menu-description">Dina prestationer</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    const isPremium = hasAnyPremium()
                    if (!isPremium) {
                      setShowUpgradeModal(true)
                      return
                    }
                    setActiveTab('leaderboard')
                  }}
                >
                  <span className="menu-icon"><Trophy size={20} /></span>
                  <div className="menu-content">
                    <span className="menu-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Topplista {!hasAnyPremium() && <Lock size={14} />}</span>
                    <span className="menu-description">Tävla med vänner</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('family')}
                >
                  <span className="menu-icon"><Users size={20} /></span>
                  <div className="menu-content">
                    <span className="menu-title">Familjegrupp</span>
                    <span className="menu-description">Dela med familjen</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('referral')}
                >
                  <span className="menu-icon"><Gift size={20} /></span>
                  <div className="menu-content">
                    <span className="menu-title">Bjud in vänner</span>
                    <span className="menu-description">Tjäna Premium gratis</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                {/* Visa Hantera Prenumeration för Stripe-kunder */}
                {(() => {
                  const premiumStatus = premiumService.getPremiumStatus()
                  if (premiumStatus.source === 'stripe' && premiumStatus.stripeCustomerId) {
                    return (
                      <button 
                        className="profile-menu-item"
                        onClick={() => setActiveTab('manage-subscription')}
                      >
                        <span className="menu-icon"><CreditCard size={20} /></span>
                        <div className="menu-content">
                          <span className="menu-title">Hantera Prenumeration</span>
                          <span className="menu-description">Uppgradera, avsluta eller ändra betalmetod</span>
                        </div>
                        <span className="menu-arrow">›</span>
                      </button>
                    )
                  }
                  return null
                })()}
                
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('faq')}
                >
                  <span className="menu-icon"><HelpCircle size={20} /></span>
                  <div className="menu-content">
                    <span className="menu-title">Hjälp & Information</span>
                    <span className="menu-description">Vanliga frågor och villkor</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                {/* TEMPORARILY HIDDEN - Email feature
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('email')}
                >
                  <span className="menu-icon">📧</span>
                  <div className="menu-content">
                    <span className="menu-title">Veckosammanfattning</span>
                    <span className="menu-description">Email varje måndag</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                */}
              </div>
            </section>
          </div>
        )}
        
        {/* Separata flikar för profilfunktioner (nås från profil-menyn) */}
        {activeTab === 'savings' && (
          <div className="tab-panel">
            <div className="card-header" style={{padding: '16px 16px 0'}}>
              <button 
                className="btn-secondary"
                onClick={() => setActiveTab('profile')}
                style={{marginBottom: '16px'}}
              >
                ← Tillbaka till Profil
              </button>
              <h2>Avancerad Statistik</h2>
              <p className="card-subtitle">Detaljerad översikt av dina besparingar, miljöpåverkan och framsteg</p>
            </div>
            
            <AdvancedStats onUpgradeClick={() => setShowUpgradeModal(true)} />
          </div>
        )}
        
        {/* TEMPORARILY HIDDEN - Email tab
        {activeTab === 'email' && (
          <div className="tab-panel">
            <section className="card">
              <div className="card-header">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('profile')}
                  style={{marginBottom: '16px'}}
                >
                  ← Tillbaka till Profil
                </button>
                <h2>Veckosammanfattning</h2>
                <p className="card-subtitle">Få ett email varje måndag med dina utgående varor och receptförslag</p>
              </div>
              
              <WeeklyEmailSignup />
            </section>
          </div>
        )}
        */}
        
        {activeTab === 'referral' && (
          <div className="tab-panel">
            <section className="card">
              <div className="card-header">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('profile')}
                  style={{marginBottom: '16px'}}
                >
                  ← Tillbaka till Profil
                </button>
                <h2>Bjud in vänner</h2>
                <p className="card-subtitle">Tjäna Premium gratis genom att bjuda in vänner!</p>
              </div>
              
              <ReferralProgram />
            </section>
          </div>
        )}
        
        {activeTab === 'faq' && (
          <div className="tab-panel">
            <section className="card">
              <div className="card-header">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('profile')}
                  style={{marginBottom: '16px'}}
                >
                  ← Tillbaka till Profil
                </button>
              </div>
              
              <FAQ />
            </section>
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div className="tab-panel">
            <button 
              className="btn-secondary"
              onClick={() => setActiveTab('profile')}
              style={{marginBottom: '16px', marginLeft: '16px'}}
            >
              ← Tillbaka till Profil
            </button>
            <AchievementsPage />
          </div>
        )}
        
        {activeTab === 'family' && (
          <div className="tab-panel">
            <section className="card">
              <div className="card-header">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('profile')}
                  style={{marginBottom: '16px'}}
                >
                  ← Tillbaka till Profil
                </button>
                <h2>Familjegrupp</h2>
                <p className="card-subtitle">Dela varulistan med hela familjen</p>
              </div>
              
              <FamilySharing 
                items={items} 
                onFamilyChange={() => setFamilySyncTrigger(prev => prev + 1)}
              />
            </section>
          </div>
        )}
        
        {activeTab === 'leaderboard' && (
          <div className="tab-panel">
            <section className="card">
              <div className="card-header">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('profile')}
                  style={{marginBottom: '16px'}}
                >
                  ← Tillbaka till Profil
                </button>
                <h2>Topplista</h2>
                <p className="card-subtitle">Tävla med dina vänner!</p>
              </div>
              
              <Leaderboard />
            </section>
          </div>
        )}
        
        {activeTab === 'manage-subscription' && (
          <ManageSubscriptionPage 
            onBack={() => setActiveTab('profile')}
            onShowUpgrade={() => {
              setShowUpgradeModal(true)
              setActiveTab('profile')
            }}
          />
        )}
      
      </div>
      

      <footer className="muted">Data sparas i din webbläsare (localStorage).</footer>
    </div>
    
    
    {showExpirySettings && editingItem && (
      <ExpirySettings 
        item={editingItem}
        onUpdate={handleExpiryUpdate}
        onClose={() => {
          setShowExpirySettings(false)
          setEditingItem(null)
        }}
      />
    )}
    
    <ConfirmDialog 
      isOpen={confirmDialog.isOpen}
      title={confirmDialog.title}
      message={confirmDialog.message}
      onConfirm={confirmDialog.onConfirm}
      onCancel={confirmDialog.onCancel}
      onDismiss={confirmDialog.onDismiss}
    />
    
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      onReferralClick={() => {
        setShowUpgradeModal(false)
        setActiveTab('referral')
      }}
    />
    
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      mode={authModalMode}
    />
    
    {showAIRecipeGenerator && (
      <AIRecipeGenerator
        inventory={items}
        onClose={() => {
          setShowAIRecipeGenerator(false)
          setRecipeTab('mine') // Återställ till första tab
        }}
        onRecipeGenerated={(recipe) => {
          console.log('✅ AI-recept genererat:', recipe.name)
          // Uppdatera listan över sparade recept
          const updated = getSavedAIRecipes()
          setSavedAIRecipes(updated)
        }}
      />
    )}
    
    {selectedSavedRecipe && (
      <div className="ai-recipe-overlay" onClick={() => setSelectedSavedRecipe(null)}>
        <div className="ai-recipe-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{selectedSavedRecipe.name}</h2>
            <button onClick={() => setSelectedSavedRecipe(null)} className="close-btn">×</button>
          </div>

          <div className="recipe-content">
            <div className="recipe-meta">
              <span>Förberedelse: {selectedSavedRecipe.prepTime}</span>
              <span>Tillagning: {selectedSavedRecipe.cookTime}</span>
              <span>Portioner: {selectedSavedRecipe.servings}</span>
              <span>{selectedSavedRecipe.difficulty}</span>
            </div>

            <p className="recipe-description">{selectedSavedRecipe.description}</p>

            {selectedSavedRecipe.warning && (
              <div className="warning-box" style={{ display: 'flex', gap: '8px' }}>
                <AlertTriangle size={18} strokeWidth={2} />
                <div><strong>Obs:</strong> {selectedSavedRecipe.warning}</div>
              </div>
            )}

            <div className="recipe-section">
              <h3>Ingredienser</h3>
              <ul>
                {selectedSavedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className={ing.optional ? 'optional-ingredient' : ''}>
                    {ing.amount} {ing.item}
                    {ing.optional && <span className="optional-badge">Valfri</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="recipe-section">
              <h3>Instruktioner</h3>
              <ol>
                {selectedSavedRecipe.instructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            {selectedSavedRecipe.nutrition && (
              <div className="recipe-section nutrition">
                <h3>Näringsinformation (per portion)</h3>
                <div className="nutrition-grid">
                  <div><strong>Kalorier:</strong> {selectedSavedRecipe.nutrition.calories}</div>
                  <div><strong>Protein:</strong> {selectedSavedRecipe.nutrition.protein}</div>
                  <div><strong>Kolhydrater:</strong> {selectedSavedRecipe.nutrition.carbs}</div>
                  <div><strong>Fett:</strong> {selectedSavedRecipe.nutrition.fat}</div>
                </div>
              </div>
            )}

            {selectedSavedRecipe.tips && selectedSavedRecipe.tips.length > 0 && (
              <div className="recipe-section">
                <h3>Tips</h3>
                <ul>
                  {selectedSavedRecipe.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    
    {/* Sticky Ad Banner - Always visible for free users */}
    <div className="sticky-ad-wrapper">
      <AdBanner className="sticky" />
    </div>
    </>
  )
}
