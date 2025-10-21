import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes, recipes } from './recipes'
import { fetchPopularRecipes } from './recipeAPI'
import ExpirySettings from './ExpirySettings'
import ShoppingList from './ShoppingList'
import { calculateSmartExpiryDate, getSmartProductCategory, learnFromUserAdjustment } from './smartExpiryAI'
import { searchFoods, getExpiryDateSuggestion } from './foodDatabase'
import { notificationService } from './notificationService'
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
function getSuggestedUnitKey(itemName) {
  if (!itemName.trim()) return 'defaultUnit'
  
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
  
  // Ris/Pasta/Sädesslag
  if (name.includes('rice') || name.includes('ris') || name.includes('reis') ||
      name.includes('pasta') || name.includes('pasta') || name.includes('nudeln') ||
      name.includes('flour') || name.includes('mjöl') || name.includes('mehl')) {
    return 'grams'
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
const SV_UNITS = {
  liters: 'liter',
  loaves: 'limpor',
  kg: 'kg',
  grams: 'gram',
  pieces: 'stycken',
  cans: 'burkar',
  defaultUnit: 'st'
}

// Förkortningar för enheter
function abbreviateUnit(unit) {
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
  const [activeTab, setActiveTab] = useState('add')
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkExpiryDate, setBulkExpiryDate] = useState('')
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [recipeTab, setRecipeTab] = useState('mine') // 'mine' eller 'recommended'
  const [internetRecipes, setInternetRecipes] = useState([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [recipeCategory, setRecipeCategory] = useState('alla') // Filter för receptkategorier

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
      try { setItems(JSON.parse(saved)) } catch {}
    }
    
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Kolla systempreferens
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
    
    // Ladda senaste aktiva tab
    const savedTab = localStorage.getItem('svinnstop_active_tab')
    if (savedTab && ['add', 'shopping', 'inventory', 'recipes'].includes(savedTab)) {
      setActiveTab(savedTab)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
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
  
  // Hämta populära recept från internet vid start
  useEffect(() => {
    const loadInternetRecipes = async () => {
      setLoadingRecipes(true)
      try {
        const recipes = await fetchPopularRecipes(20)
        setInternetRecipes(recipes)
      } catch (error) {
        console.error('Kunde inte ladda recept:', error)
      } finally {
        setLoadingRecipes(false)
      }
    }
    
    loadInternetRecipes()
  }, [])
  
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
    if (name === 'quantity') {
      const numValue = parseFloat(value)
      setForm(f => ({ ...f, [name]: isNaN(numValue) ? 0 : Math.max(0, numValue) }))
    } else if (name === 'name') {
      setForm(f => ({ ...f, [name]: value }))
      
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
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const onAdd = e => {
    e.preventDefault()
    if (!form.name || !form.expiresAt || form.quantity <= 0) return
    
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    const unitKey = getSuggestedUnitKey(form.name)
    const unit = SV_UNITS[unitKey] || SV_UNITS.defaultUnit
    
    const newItem = { id, ...form, unit }
    
    // Lägg till vara i inventariet
    setItems(prev => {
      const updated = [...prev, newItem]
      
      // Uppdatera notifikationer för utgångsdatum
      if (notificationsEnabled) {
        notificationService.scheduleExpiryNotifications(updated)
      }
      
      return updated
    })
    
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

  const onRemove = id => {
    const itemToRemove = items.find(item => item.id === id)
    if (itemToRemove) {
      // Spara åtgärd för att ångra
      saveAction({
        type: 'DELETE_SINGLE',
        data: { item: itemToRemove },
        timestamp: Date.now()
      })
    }
    setItems(prev => prev.filter(i => i.id !== id))
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
    const originalItem = editingItem
    
    // Lär AI:n från justeringen
    learnFromUserAdjustment(
      originalItem.name,
      originalItem.expiresAt,
      updatedItem.expiresAt,
      originalItem.category,
      updatedItem.adjustmentReason || ''
    )
    
    // Uppdatera item i listan
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
    
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
    console.log(`✅ ${inventoryItem.name} lades till i ditt kölskåp med utgångsdatum ${inventoryItem.expiresAt}`)
  }
  
  // Aktivera notifikationer
  const enableNotifications = async () => {
    const success = await notificationService.requestPermission()
    if (success) {
      setNotificationsEnabled(true)
      notificationService.scheduleExpiryNotifications(items)
      notificationService.showTestNotification()
      
      // Spara inställning
      localStorage.setItem('svinnstop_notifications_enabled', 'true')
    }
  }
  
  // Avaktivera notifikationer
  const disableNotifications = () => {
    setNotificationsEnabled(false)
    // Rensa alla schemalagda notifikationer
    notificationService.clearScheduledNotifications()
    
    // Spara inställning
    localStorage.setItem('svinnstop_notifications_enabled', 'false')
  }
  
  // Välja matvaruförslag
  const selectFoodSuggestion = (food) => {
    const suggestion = getExpiryDateSuggestion(food.name)
    
    setForm({
      name: food.name,
      quantity: 1,
      expiresAt: suggestion.date
    })
    
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
      
      if (!existingItem) {
        const newShoppingItem = {
          id: Date.now() + Math.random(),
          name: ingredient.name,
          category: 'recept',
          emoji: '📋',
          unit: ingredient.unit,
          quantity: ingredient.quantity,
          completed: false,
          isFood: true,
          addedAt: Date.now()
        }
        
        currentShoppingList.unshift(newShoppingItem)
      } else {
        // Uppdatera kvantiteten om varan redan finns
        existingItem.quantity = Math.max(existingItem.quantity, ingredient.quantity)
      }
    })
    
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

  const suggestions = useMemo(() => suggestRecipes(items), [items])
  
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
      const recipeCategory = recipe.category?.toLowerCase() || ''
      
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

  return (
    <>
      
      <div className="settings-menu-container">
        <button 
          className="settings-toggle" 
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          title="Inställningar"
          aria-label="Öppna inställningsmeny"
        >
          ⚙️
        </button>
        
        {showSettingsMenu && (
          <div className="settings-dropdown">
            <button 
              className="settings-menu-item"
              onClick={() => {
                toggleTheme();
                setShowSettingsMenu(false);
              }}
            >
              <span className="menu-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="menu-text">{theme === 'dark' ? 'Ljust läge' : 'Mörkt läge'}</span>
            </button>
            
            <button 
              className="settings-menu-item"
              onClick={() => {
                if (notificationsEnabled) {
                  disableNotifications();
                } else {
                  enableNotifications();
                }
                setShowSettingsMenu(false);
              }}
            >
              <span className="menu-icon">{notificationsEnabled ? '🔕' : '🔔'}</span>
              <span className="menu-text">{notificationsEnabled ? 'Avaktivera notiser' : 'Aktivera notiser'}</span>
            </button>
          </div>
        )}
      </div>
      
      <button 
        className="undo-btn" 
        onClick={undoLastAction}
        disabled={!canUndo}
        title={'Ångra senaste borttagning'}
        aria-label={'Ångra senaste borttagning'}
      >
        {'↶️ Ångra'}
      </button>
      
    <div className="container">
      <header>
        <div className="header-content">
          <div className="header-text">
            <h1 className="app-title"><span className="notranslate">Svinnstop</span></h1>
            <p>{'Spåra din inköpta mat, utgångsdatum och se receptidéer.'}</p>
          </div>
        </div>
      </header>
      
      {/* Enhanced Tab Navigation */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="tab-icon">📦</span>
          <span className="tab-label">Mina varor</span>
          {items.length > 0 && <span className="tab-badge">{items.length}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <span className="tab-icon">➕</span>
          <span className="tab-label">Lägg in</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <span className="tab-icon">🛍️</span>
          <span className="tab-label">Inköpslista</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          <span className="tab-icon">🍳</span>
          <span className="tab-label">Recept</span>
          {suggestions.length > 0 && <span className="tab-badge">{suggestions.length}</span>}
        </button>
      </nav>
      
      {/* Tab Content */}
      <div className="tab-content">
        
        {/* Lägg till vara flik */}
        {activeTab === 'add' && (
          <div className="tab-panel">
            <section className="card add-item-card">
              <div className="card-header">
                <h2>➕ Lägg in vara</h2>
                <p className="card-subtitle">Fyll i information om varan du vill lägga till</p>
              </div>
              
              <form onSubmit={onAdd} className="add-form">
                <div className="form-section">
                  <label className="form-label">
                    <span className="label-text">🏷️ Namn på vara</span>
                    <div className="input-with-suggestions">
                      <input 
                        name="name" 
                        value={form.name} 
                        onChange={onChange} 
                        placeholder="t.ex. mjölk, äpplen, kött..."
                        autoFocus
                        required
                        autoComplete="off"
                        className="form-input"
                      />
                      {showFoodSuggestions && foodSuggestions.length > 0 && (
                        <div className="food-suggestions">
                          <div className="suggestions-header">Förslag:</div>
                          {foodSuggestions.map(food => (
                            <button
                              key={food.name}
                              type="button"
                              className="food-suggestion"
                              onClick={() => selectFoodSuggestion(food)}
                            >
                              <span className="suggestion-emoji">{food.emoji}</span>
                              <span className="suggestion-name">{food.name}</span>
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
                    <span className="label-text">📊 Antal</span>
                    <div className="quantity-input-container">
                      <input 
                        type="number" 
                        name="quantity" 
                        min="0" 
                        step="0.1"
                        inputMode="decimal"
                        value={form.quantity} 
                        onChange={onChange}
                        onFocus={(e) => e.target.select()}
                        placeholder="1"
                        className="form-input quantity-input"
                        required
                      />
                      <span className="unit-display">{suggestedUnit}</span>
                    </div>
                  </label>
                  
                  <label className="form-label">
                    <span className="label-text">📅 Utgångsdatum</span>
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
                    ➕ Lägg in i mitt kylskåp
                  </button>
                  {form.name && form.expiresAt && form.quantity > 0 && (
                    <div className="form-preview">
                      <small>✨ Lägger till: <strong>{form.quantity} {suggestedUnit} {form.name}</strong> som går ut <strong>{form.expiresAt}</strong></small>
                    </div>
                  )}
                </div>
              </form>
            </section>
          </div>
        )}
        
        {/* Inköpslista flik */}
        {activeTab === 'shopping' && (
          <div className="tab-panel">
            <ShoppingList 
              onDirectAddToInventory={handleDirectAddToInventory}
            />
          </div>
        )}
        
        {/* Mina varor flik */}
        {activeTab === 'inventory' && (
          <div className="tab-panel">
            <section className="card inventory-card">
              <div className="card-header">
                <div className="header-main">
                  <h2>📦 Mina varor</h2>
                  {items.length > 0 && (
                    <div className="inventory-stats">
                      <span className="stat-item">{items.length} varor totalt</span>
                      <span className="stat-item">{filtered.filter(i => daysUntil(i.expiresAt) <= 3 && daysUntil(i.expiresAt) >= 0).length} går ut snart</span>
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
                      {bulkEditMode ? '✕ Avsluta redigering' : '📋 Redigera flera'}
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
                      📦 Alla varor
                    </button>
                    <button 
                      className={`filter-tab ${filter === 'expiring' ? 'active' : ''}`}
                      onClick={() => setFilter('expiring')}
                    >
                      ⚠️ Går ut snart
                    </button>
                    <button 
                      className={`filter-tab ${filter === 'expired' ? 'active' : ''}`}
                      onClick={() => setFilter('expired')}
                    >
                      ❌ Utgångna
                    </button>
                  </div>
                </div>
              </div>
              {bulkEditMode && (
                <div className="bulk-edit-panel">
                  <div className="bulk-edit-header">
                    <div className="bulk-status">
                      <span className="bulk-icon">📋</span>
                      <span className="bulk-text">Redigerings-läge</span>
                      <span className="bulk-count">{selectedItems.size} av {filtered.length} valda</span>
                    </div>
                  </div>
                  
                  <div className="bulk-actions-row">
                    <button onClick={selectAllVisible} className="bulk-action-btn">
                      ✓ Välj alla synliga
                    </button>
                    <button onClick={deselectAll} className="bulk-action-btn">
                      ✕ Rensa urval
                    </button>
                  </div>
                  
                  {selectedItems.size > 0 && (
                    <div className="bulk-date-section">
                      <div className="bulk-date-header">
                        <h4>📅 Ändra utgångsdatum</h4>
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
                          ✅ Uppdatera {selectedItems.size} varor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <p>
                    <span>{items.length === 0 
                      ? '🍽️ Inga varor ännu. Börja genom att lägga till din första vara i "Lägg till"-fliken!'
                      : searchQuery.trim() 
                        ? `🔍 Inga varor hittades för "${searchQuery}". Försök med andra sökord.`
                        : '📋 Inga varor matchar det valda filtret. Försök med ett annat filter.'}</span>
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
                            <strong>{i.name}</strong>
                            <span className="item-quantity">{i.quantity} {i.unit}</span>
                          </div>
                          <div className="item-sub">
                            <span className="item-expiry">Utgång: {i.expiresAt || '—'}</span>
                            <span className="status">{status}</span>
                          </div>
                        </div>
                        {!bulkEditMode && (
                          <div className="item-actions">
                          <button 
                            className="edit-btn" 
                            onClick={() => handleEditExpiry(i)}
                            title="Justera utgångsdatum"
                            aria-label="Justera utgångsdatum"
                          >
                            📝
                          </button>
                          <button 
                            className="remove-btn" 
                            onClick={() => onRemove(i.id)}
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
                <h2>🍳 Recept</h2>
                <p className="section-subtitle">Hitta inspiration för din matlagning</p>
              </div>
              
              {/* Sub-tabs för recept */}
              <div className="recipe-tabs">
                <button 
                  className={`recipe-tab-btn ${recipeTab === 'mine' ? 'active' : ''}`}
                  onClick={() => setRecipeTab('mine')}
                >
                  🍽️ Mina recept
                  {suggestions.length > 0 && <span className="tab-count">{suggestions.length}</span>}
                </button>
                <button 
                  className={`recipe-tab-btn ${recipeTab === 'recommended' ? 'active' : ''}`}
                  onClick={() => setRecipeTab('recommended')}
                >
                  🍳 Rekommenderade
                  <span className="tab-count">{recommendedRecipes.length}</span>
                </button>
              </div>
              
              {/* Mina recept tab */}
              {recipeTab === 'mine' && (
                <div className="recipe-tab-content">
                  {suggestions.length === 0 ? (
                    <div className="empty-recipes">
                      <p>{items.length === 0 
                        ? '📦 Lägg till varor i ditt kölskåp för att få personliga receptförslag!' 
                        : '🔍 Inga recept hittades med dina nuvarande matvaror. Försök lägga till fler basvaror som ägg, mjölk eller pasta!'}
                      </p>
                    </div>
                  ) : (
                    <div className="recipes">
                      {suggestions.map(r => (
                        <div key={r.id} className={`recipe-card ${r.hasExpiringIngredients ? 'urgent-recipe' : ''}`}>
                          <div className="recipe-header">
                            <h3>{r.name}</h3>
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
                                  <span className="ingredient-amount">
                                    {ingredient.quantity} {ingredient.unit}
                                  </span>
                                  <span className="ingredient-name">{ingredient.name}</span>
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
                      className={`category-filter-btn ${recipeCategory === 'alla' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('alla')}
                    >
                      🍽️ Alla
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'thai' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('thai')}
                    >
                      🌶️ Thai
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'italienskt' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('italienskt')}
                    >
                      🍝 Italienskt
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'husmanskost' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('husmanskost')}
                    >
                      🇸🇪 Husmanskost
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'vegetariskt' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('vegetariskt')}
                    >
                      🥗 Vegetariskt
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'kyckling' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('kyckling')}
                    >
                      🍗 Kyckling
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'fisk' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('fisk')}
                    >
                      🐟 Fisk & Skaldjur
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'snabbt' ? 'active' : ''}`}
                      onClick={() => setRecipeCategory('snabbt')}
                    >
                      ⚡ Snabbt
                    </button>
                    <button 
                      className={`category-filter-btn ${recipeCategory === 'dessert' ? 'active' : ''}`}
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
                      <p>😔 Inga recept hittades i kategorin "{recipeCategory}". Försök en annan kategori!</p>
                    </div>
                  ) : (
                  <div className="recipes">
                    {recommendedRecipes.map(r => (
                      <div key={r.id} className="recipe-card recommended-recipe">
                        <div className="recipe-header">
                          <h3>{r.name}</h3>
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
                                <span className="ingredient-amount">
                                  {ingredient.quantity} {ingredient.unit}
                                </span>
                                <span className="ingredient-name">{ingredient.name}</span>
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
    </>
  )
}
