import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes, recipes } from './recipes'
import { fetchPopularRecipes } from './recipeAPI'
import ExpirySettings from './ExpirySettings'
import ShoppingList from './ShoppingList'
import Onboarding from './Onboarding'
import NotificationPrompt from './NotificationPrompt'
import SavingsBanner from './SavingsBanner'
import WeeklyEmailSignup from './WeeklyEmailSignup'
import ReferralProgram from './ReferralProgram'
import AchievementsPage from './AchievementsPage'
import FamilySharing from './FamilySharing'
import Leaderboard from './Leaderboard'
import ConfirmDialog from './ConfirmDialog'
import { calculateSmartExpiryDate, getSmartProductCategory, learnFromUserAdjustment } from './smartExpiryAI'
import { searchFoods, getExpiryDateSuggestion, learnIngredientsFromRecipe } from './foodDatabase'
import { notificationService } from './notificationService'
import { savingsTracker } from './savingsTracker'
import { achievementService } from './achievementService'
import { syncInventoryToFirebase, listenToInventoryChanges } from './inventorySync'
import { getFamilyData } from './familyService'
import { initAuth } from './firebaseConfig'
import { referralService } from './referralService'
import { leaderboardService } from './leaderboardService'
import './mobile.css'
import './newFeatures.css'

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
  const today = new Date()
  const date = new Date(dateStr)
  const diff = Math.ceil((date - new Date(today.toDateString())) / (1000 * 60 * 60 * 24))
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

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ 
    name: '', 
    quantity: 0, 
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
  const [showOnboarding, setShowOnboarding] = useState(false) // Onboarding flow
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false) // Notification permission prompt
  const [familySyncTrigger, setFamilySyncTrigger] = useState(0) // Trigger för att starta Firebase sync
  const [isAuthReady, setIsAuthReady] = useState(false) // Väntar på Firebase auth
  
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

  // Initiera tema och aktiv tab från localStorage eller systempreferens
  useEffect(() => {
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
    
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Kolla systempreferens
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
    
    // Kolla om URL:en innehåller en referral-kod
    const urlParams = new URLSearchParams(window.location.search)
    const hasReferralCode = urlParams.has('ref')
    
    // Kolla om användaren har sett onboarding
    const hasSeenOnboarding = localStorage.getItem('svinnstop_onboarding_seen')
    
    if (!hasSeenOnboarding) {
      // Första gången användaren kommer in
      setShowOnboarding(true)
      
      // Sätt default-flik baserat på om de har en referral-kod
      if (hasReferralCode) {
        setActiveTab('referral')
        console.log('🎁 Referral code detected in URL, will navigate to referral tab after onboarding')
      } else {
        setActiveTab('inventory') // Default till kylskåp
      }
    } else if (hasReferralCode) {
      // Inte första gången, men har referral-kod i URL
      console.log('🎁 Referral code detected in URL, navigating to referral tab')
      setActiveTab('referral')
    } else {
      // Ladda senaste aktiva tab
      const savedTab = localStorage.getItem('svinnstop_active_tab')
      if (savedTab && ['shopping', 'inventory', 'recipes', 'profile'].includes(savedTab)) {
        setActiveTab(savedTab)
      } else {
        setActiveTab('inventory') // Default till kylskåp
      }
    }
    
    // Kolla om vi ska visa notifikationsprompt
    // Visa efter onboarding eller när användaren lagt till första varan
    const notificationPrompted = localStorage.getItem('svinnstop_notifications_prompted')
    if (!notificationPrompted && hasSeenOnboarding) {
      // Visa prompten efter en kort delay så användaren hinner se appen först
      setTimeout(() => {
        setShowNotificationPrompt(true)
      }, 2000)
    }
    
  // Track daily login for achievements
    achievementService.trackDailyLogin()
    
    // Initialize Firebase Authentication
    initAuth()
      .then(user => {
        if (user) {
          console.log('🔐 Svinnstop authentication ready')
          
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
  
  // Separat useEffect för Firebase sync som lyssnar på familySyncTrigger
  useEffect(() => {
    const family = getFamilyData()
    
    if (family.familyId && family.syncEnabled) {
      console.log('🔄 Starting Firebase inventory sync for family:', family.familyId)
      const unsubscribe = listenToInventoryChanges((firebaseInventory) => {
        console.log('📥 Received inventory from Firebase:', firebaseInventory.length, 'items')
        setItems(firebaseInventory)
      })
      
      return () => {
        if (unsubscribe) {
          console.log('👋 Stopping Firebase inventory sync')
          unsubscribe()
        }
      }
    }
  }, [familySyncTrigger])

  // FIX: Debounce localStorage writes för att undvika race conditions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        
        // Track max active items for achievements
        const achievementData = achievementService.getAchievementData()
        if (items.length > (achievementData.stats.maxActiveItems || 0)) {
          achievementService.updateStats({
            maxActiveItems: items.length
          })
        }
        
        // Synkronisera till Firebase om i familj
        const family = getFamilyData()
        if (family.familyId && family.syncEnabled) {
          syncInventoryToFirebase(items)
        }
      } catch (error) {
        console.error('Kunde inte spara items till localStorage:', error)
        // Försök rensa gamla data om storage är full
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
  }, [items])

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

  const onChange = e => {
    const { name, value } = e.target
    
    // FIX: Använd functional update för att undvika stale state
    if (name === 'quantity') {
      const numValue = parseFloat(value)
      // Validera kvantitet: max 50 för att förhindra orealistiska värden
      const validatedValue = isNaN(numValue) ? 0 : Math.min(Math.max(0, numValue), 50)
      setForm(prevForm => ({ 
        ...prevForm, 
        [name]: validatedValue
      }))
    } else if (name === 'name') {
      setForm(prevForm => ({ ...prevForm, [name]: value }))
      
      // Visa matvaruförslag när användaren skriver
      if (value.trim().length > 0) {
        const suggestions = searchFoods(value.trim())
        setFoodSuggestions(suggestions)
        setShowFoodSuggestions(suggestions.length > 0)
      } else {
        setFoodSuggestions([])
        setShowFoodSuggestions(false)
      }
    } else {
      setForm(prevForm => ({ ...prevForm, [name]: value }))
    }
  }

  const onAdd = e => {
    e.preventDefault()
    if (!form.name || !form.expiresAt || form.quantity <= 0) return
    
    // FIX: Skapa en kopia av form-data INNAN vi rensar state
    const itemName = form.name.trim()
    const itemQuantity = form.quantity
    const itemExpiresAt = form.expiresAt
    
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    const unitKey = getSuggestedUnitKey(itemName)
    const unit = SV_UNITS[unitKey] || SV_UNITS.defaultUnit
    
    const newItem = { 
      id, 
      name: itemName, 
      quantity: itemQuantity, 
      expiresAt: itemExpiresAt, 
      unit 
    }
    
    // Lägg till vara i inventariet
    setItems(prev => {
      const updated = [...prev, newItem]
      
      // FIX: Spara till localStorage direkt för att undvika race condition
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
    
    // FIX: Rensa formuläret EFTER att vi skapat newItem
    setForm({ 
      name: '', 
      quantity: 0, 
      expiresAt: '' 
    })
    
    setFoodSuggestions([])
    setShowFoodSuggestions(false)
    
    // Fokusera tillbaka till namn-fältet för snabbare inmatning
    setTimeout(() => {
      const nameInput = document.querySelector('input[name="name"]')
      if (nameInput) nameInput.focus()
    }, 100)
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
      alert('❌ Ett fel uppstod: ' + error.message)
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
    
    // Lär AI:n från justeringen
    if (originalItem && originalItem.name) {
      learnFromUserAdjustment(
        originalItem.name,
        originalItem.expiresAt,
        updatedItem.expiresAt,
        originalItem.category,
        updatedItem.adjustmentReason || ''
      )
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
        // Starta bulk edit mode
        const today = new Date()
        const defaultDate = new Date(today)
        defaultDate.setDate(today.getDate() + 7)
        setBulkExpiryDate(defaultDate.toISOString().split('T')[0])
      }
      return !prev
    })
  }
  
  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
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
      setItems(prev => prev.map(item => {
        if (selectedItems.has(item.id)) {
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
        
        alert('✅ Notifikationer aktiverade! Du kommer nu få påminnelser om utgående varor.')
      } else {
        alert('❌ Kunde inte aktivera notifikationer. Kontrollera att du tillåter notifikationer i webbläsaren.')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('❌ Ett fel uppstod: ' + error.message)
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
      
      alert('❌ Notifikationer inaktiverade. Du kommer inte längre få påminnelser.')
    } catch (error) {
      console.error('Error disabling notifications:', error)
      alert('❌ Ett fel uppstod: ' + error.message)
    }
  }
  
  // Välja matvaruförslag
  const selectFoodSuggestion = (food) => {
    // FIX: Validera att food-objektet är giltigt
    if (!food || !food.name) {
      console.error('Ogiltigt matvaruförslag:', food)
      return
    }
    
    const suggestion = getExpiryDateSuggestion(food.name)
    
    // FIX: Använd functional update för att undvika stale state
    setForm(prevForm => ({
      ...prevForm,
      name: food.name,
      quantity: 1,
      expiresAt: suggestion && suggestion.date ? suggestion.date : ''
    }))
    
    setFoodSuggestions([])
    setShowFoodSuggestions(false)
    
    // Fokusera på quantity-fältet
    setTimeout(() => {
      const quantityInput = document.querySelector('input[name="quantity"]')
      if (quantityInput) quantityInput.focus()
    }, 100)
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
    alert(`✅ Lade till ${ingredients.length} matvaror i inköpslistan!`)
  }
  

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))
    return copy
  }, [items])

  const filtered = useMemo(() => {
    const now = new Date()
    let result = sorted
    
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
    
    return result
  }, [sorted, filter, searchQuery])

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
    const unit = SV_UNITS[suggestedUnitKey] || SV_UNITS.defaultUnit
    return unit
  }, [suggestedUnitKey])

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem('svinnstop_onboarding_seen', 'true')
    
    // Behåll aktiv flik som redan är satt (inventory eller referral)
    // Så att användaren hamnar på rätt ställe efter onboarding
    
    // Visa notifikationsprompt efter en kort delay
    setTimeout(() => {
      const notificationPrompted = localStorage.getItem('svinnstop_notifications_prompted')
      if (!notificationPrompted) {
        setShowNotificationPrompt(true)
      }
    }, 1500)
  }
  
  // Handle notification permission granted
  const handleNotificationPermission = async (granted) => {
    setShowNotificationPrompt(false)
    
    if (granted) {
      // Aktivera notifikationer i appen
      const success = await notificationService.requestPermission()
      if (success) {
        setNotificationsEnabled(true)
        localStorage.setItem('svinnstop_notifications_enabled', 'true')
        // Schemalägg notifikationer för befintliga varor
        if (items.length > 0) {
          notificationService.scheduleExpiryNotifications(items)
        }
        // Visa test-notifikation
        notificationService.showTestNotification()
      }
    }
  }
  
  // Handle notification prompt dismiss
  const handleNotificationDismiss = () => {
    setShowNotificationPrompt(false)
  }

  // Visa loading-skärm tills Firebase auth är klar
  if (!isAuthReady) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)'
      }}>
        <h1 style={{marginBottom: '20px'}} className="notranslate">Svinnstop</h1>
        <div style={{fontSize: '40px', marginBottom: '20px'}}>🔐</div>
        <p>Loggar in...</p>
      </div>
    )
  }

  return (
    <>
      {/* Onboarding Flow */}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <NotificationPrompt 
          onPermissionGranted={handleNotificationPermission}
          onDismiss={handleNotificationDismiss}
        />
      )}
      
      <button 
        className="undo-btn" 
        onClick={undoLastAction}
        disabled={!canUndo}
        title="Ångra senaste borttagning"
        aria-label="Ångra senaste borttagning"
      >
        ↶️ Ångra
      </button>
      
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1 className="app-title"><span className="notranslate">Svinnstop</span></h1>
          <p className="header-subtitle">Spåra din inköpta mat, utgångsdatum och se receptidéer</p>
        </div>
      </header>
      
      {/* Optimized 4-Tab Navigation */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">Inköpslista</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Kylskåp</span>
          {items.length > 0 && <span className="tab-badge">{items.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          <span className="tab-icon">🍳</span>
          <span className="tab-label">Recept</span>
          {suggestions.length > 0 && <span className="tab-badge">{suggestions.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">👤</span>
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
                              onClick={() => {
                                setShowFoodSuggestions(false)
                                setFoodSuggestions([])
                              }}
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
                      <span className="unit-display">{form.quantity === 1 && suggestedUnit === 'stycken' ? 'stycke' : suggestedUnit}</span>
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
                              const smartResult = calculateSmartExpiryDate(form.name, null)
                              setForm(prev => ({ ...prev, expiresAt: smartResult.date }))
                            }}
                            title="Använd AI-förslag som utgångspunkt"
                          >
                            🤖 AI-förslag
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
                  {form.name && form.expiresAt && form.quantity > 0 && (
                    <div className="form-preview">
                      <small>Lägger till: <strong>{form.quantity} {form.quantity === 1 && suggestedUnit === 'stycken' ? 'stycke' : suggestedUnit} {form.name}</strong> som går ut <strong>{form.expiresAt}</strong></small>
                    </div>
                  )}
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
                    >
                      {bulkEditMode ? '✕ Avsluta' : 'Redigera varor'}
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
                        ✕
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
          </div>
        )}
        
        {/* Recept flik */}
        {activeTab === 'recipes' && (
          <div className="tab-panel">
            <section className="card">
              <div className="section-header">
                <h2>Recept</h2>
                <p className="section-subtitle">Hitta inspiration för din matlagning</p>
              </div>
              
              {/* Sub-tabs för recept */}
              <div className="recipe-tabs">
                <button 
                  className={`recipe-tab-btn ${recipeTab === 'mine' ? 'active' : ''}`}
                  onClick={() => setRecipeTab('mine')}
                >
                  Mina recept
                  {suggestions.length > 0 && <span className="tab-count">{suggestions.length}</span>}
                </button>
                <button 
                  className={`recipe-tab-btn ${recipeTab === 'recommended' ? 'active' : ''}`}
                  onClick={() => setRecipeTab('recommended')}
                >
                  Rekommenderade
                  <span className="tab-count">{recommendedRecipes.length}</span>
                </button>
              </div>
              
              {/* Mina recept tab */}
              {recipeTab === 'mine' && (
                <div className="recipe-tab-content">
                  {suggestions.length === 0 ? (
                    <div className="empty-recipes">
                      <p>{items.length === 0 
                        ? '📦 Lägg till varor i ditt kylskåp för att få personliga receptförslag!' 
                        : '🔍 Inga recept hittades med dina nuvarande varor. Försök lägga till fler basvaror som ägg, mjölk eller pasta!'}
                      </p>
                    </div>
                  ) : (
                    <div className="recipes">
                      {suggestions.map(r => (
                        <div key={r.id} className={`recipe-card ${r.hasExpiringIngredients ? 'urgent-recipe' : ''}`}>
                          <div className="recipe-header">
                            <h3 className="notranslate">{r.name}</h3>
                            <div className="recipe-meta">
                              <span className="servings">👥 {r.servings} portioner</span>
                              <span className="time">⏱️ {svTimeLabel(r.cookingTime)}</span>
                              <span className={`difficulty ${svDifficultyClass(r.difficulty)}`}>📶 {svDifficultyLabel(r.difficulty)}</span>
                              {r.hasExpiringIngredients && (
                                <span className="urgency-badge">⚠️ Snart utgånget ({r.expiringIngredientsCount})</span>
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
                                      <span className="expiry-warning">⚠️ Går ut om {ingredient.daysLeft} dag{ingredient.daysLeft !== 1 ? 'ar' : ''}</span>
                                    )}
                                    {ingredient.isExpired && (
                                      <span className="expired-warning">🚨 Utgången</span>
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
                    >
                      🍽️ Alla
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
                    >
                      ⚡ Snabbt
                    </button>
                    <button 
                      className={`category-filter-btn notranslate ${recipeCategory === 'dessert' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('dessert')}
                    >
                      🍰 Dessert
                    </button>
                  </div>
                  
                  {loadingRecipes ? (
                    <div className="loading-recipes">
                      <p>🍳 Laddar populära recept från internet...</p>
                    </div>
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
                            <span className="servings">👥 {r.servings} portioner</span>
                            <span className="time">⏱️ {svTimeLabel(r.cookingTime)}</span>
                            <span className={`difficulty ${svDifficultyClass(r.difficulty)}`}>📶 {svDifficultyLabel(r.difficulty)}</span>
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
                          >
                            🛍️ Lägg till i inköpslista
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
              
              {/* Snabblänkar till huvudfunktioner */}
              <div className="profile-menu">
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    toggleTheme();
                  }}
                >
                  <span className="menu-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                  <div className="menu-content">
                    <span className="menu-title">{theme === 'dark' ? 'Ljust läge' : 'Mörkt läge'}</span>
                    <span className="menu-description">Byt utseende på appen</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => {
                    if (notificationsEnabled) {
                      disableNotifications();
                    } else {
                      enableNotifications();
                    }
                  }}
                >
                  <span className="menu-icon">{notificationsEnabled ? '🔕' : '🔔'}</span>
                  <div className="menu-content">
                    <span className="menu-title">{notificationsEnabled ? 'Inaktivera notiser' : 'Aktivera notiser'}</span>
                    <span className="menu-description">{notificationsEnabled ? 'Stäng av påminnelser' : 'Få påminnelser om utgående varor'}</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('savings')}
                >
                  <span className="menu-icon">💰</span>
                  <div className="menu-content">
                    <span className="menu-title">Mina besparingar</span>
                    <span className="menu-description">Se hur mycket du har sparat</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('achievements')}
                >
                  <span className="menu-icon">🏆</span>
                  <div className="menu-content">
                    <span className="menu-title">Utmärkelser</span>
                    <span className="menu-description">Dina prestationer</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('leaderboard')}
                >
                  <span className="menu-icon">🏆</span>
                  <div className="menu-content">
                    <span className="menu-title">Topplista</span>
                    <span className="menu-description">Tävla med vänner</span>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
                
                <button 
                  className="profile-menu-item"
                  onClick={() => setActiveTab('family')}
                >
                  <span className="menu-icon">👥</span>
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
                  <span className="menu-icon">🎁</span>
                  <div className="menu-content">
                    <span className="menu-title">Bjud in vänner</span>
                    <span className="menu-description">Tjäna Premium gratis</span>
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
            <section className="card">
              <div className="card-header">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('profile')}
                  style={{marginBottom: '16px'}}
                >
                  ← Tillbaka till Profil
                </button>
                <h2>Mina besparingar</h2>
                <p className="card-subtitle">Se hur mycket du har sparat genom att rädda mat från att slängas</p>
              </div>
              
              <SavingsBanner />
            </section>
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
    </>
  )
}
