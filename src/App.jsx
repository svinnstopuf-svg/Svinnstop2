import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes } from './recipes'
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
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [bulkExpiryDate, setBulkExpiryDate] = useState('')

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
      
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Växla till ljust läge' : 'Växla till mörkt läge'}
        aria-label={theme === 'dark' ? 'Växla till ljust läge' : 'Växla till mörkt läge'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      
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
          {!notificationsEnabled && (
            <button 
              onClick={enableNotifications}
              className="notification-toggle-header"
              title="Aktivera påminnelser om utgångsdatum"
            >
              🔔 Notiser
            </button>
          )}
        </div>
      </header>
      
      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ➕ Lägg till
        </button>
        <button 
          className={`tab-button ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          🛍️ Inköpslista
        </button>
        <button 
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Mina varor
        </button>
        <button 
          className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          🍳 Recept
        </button>
      </nav>
      
      {/* Tab Content */}
      <div className="tab-content">
        
        {/* Lägg till vara flik */}
        {activeTab === 'add' && (
          <div className="tab-panel">
            <section className="card">
        <h2>Lägg till vara</h2>
        <form onSubmit={onAdd}>
          <div className="form-grid">
            <div className="form-row">
              <label>
                <span>Namn</span>
                <div className="input-with-suggestions">
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={onChange} 
                    placeholder="Skriv varans namn för förslag... (t.ex. 'mjö' för mjölk)"
                    autoFocus
                    required
                    autoComplete="off"
                  />
                  {showFoodSuggestions && foodSuggestions.length > 0 && (
                    <div className="food-suggestions">
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
              <label>
                <span>Antal</span>
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
                    placeholder="0"
                  />
                  <span className="unit-display">{suggestedUnit}</span>
                </div>
              </label>
            </div>
            <div className="form-row">
              <label>
                <span>Utgångsdatum</span>
                <div className="expiry-input-container">
                  <input 
                    type="date" 
                    name="expiresAt" 
                    value={form.expiresAt} 
                    onChange={onChange}
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                  {form.name && (
                    <div className="expiry-helper">
                      <span className="helper-text">💡 Kolla förpackningen för exakt datum</span>
                      {suggestedUnit && (
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
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={!form.name || !form.expiresAt || form.quantity <= 0}>
              ➕ Lägg till vara
            </button>
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
            <section className="card">
              <div className="list-header">
                <div className="section-title">
                  <h2>Mina varor</h2>
                  <div className="header-actions">
                    <button 
                      onClick={toggleBulkEditMode}
                      className={`bulk-edit-toggle ${bulkEditMode ? 'active' : ''}`}
                      disabled={items.length === 0}
                      title={bulkEditMode ? 'Avsluta redigering' : 'Ändra utgångsdatum för flera varor'}
                    >
                      {bulkEditMode ? '✕ Avsluta' : '📋 Redigera flera'}
                    </button>
                  </div>
                </div>
                <div className="search-and-filters">
                  <input 
                    type="text" 
                    placeholder="Sök bland dina varor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <div className="filters">
                    <label><input type="radio" name="f" checked={filter === 'all'} onChange={() => setFilter('all')} /> <span>📦 Alla varor</span></label>
                    <label><input type="radio" name="f" checked={filter === 'expiring'} onChange={() => setFilter('expiring')} /> <span>⚠️ Går ut snart (3 dagar)</span></label>
                    <label><input type="radio" name="f" checked={filter === 'expired'} onChange={() => setFilter('expired')} /> <span>❌ Utgångna</span></label>
                  </div>
                </div>
                {bulkEditMode && (
                  <div className="bulk-edit-controls">
                    <div className="bulk-edit-info">
                      <span>📋 Redigerings-läge aktivt • {selectedItems.size} av {filtered.length} varor valda</span>
                    </div>
                    <div className="bulk-edit-actions">
                      <button onClick={selectAllVisible} className="bulk-btn secondary">✓ Välj alla synliga</button>
                      <button onClick={deselectAll} className="bulk-btn secondary">✕ Rensa urval</button>
                    </div>
                    {selectedItems.size > 0 && (
                      <div className="bulk-date-editor">
                        <label>
                          <span>Nytt utgångsdatum för {selectedItems.size} valda varor:</span>
                          <div className="bulk-date-input-container">
                            <input 
                              type="date" 
                              value={bulkExpiryDate} 
                              onChange={(e) => setBulkExpiryDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="bulk-date-input"
                            />
                            <button 
                              onClick={applyBulkExpiryDate}
                              className="apply-bulk-date-btn"
                              disabled={!bulkExpiryDate}
                            >
                              ✅ Tillämpa på {selectedItems.size} varor
                            </button>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                            <span className="muted">{i.quantity} {i.unit}</span>
                          </div>
                          <div className="item-sub">
                            <span>Utgång: {i.expiresAt || '—'}</span>
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
                <h2>🍳 Receptförslag</h2>
                {notificationsEnabled && (
                  <span className="notifications-active">🔔 Notiser aktiva</span>
                )}
              </div>
              {suggestions.length === 0 ? (
                <div className="empty-recipes">
                  <p>{items.length === 0 
                    ? '📦 Lägg till varor i ditt kölskåp för att få skräddarsydda receptförslag!' 
                    : '🔍 Inga recept hittades med dina nuvarande ingredienser. Försök lägga till fler basvaror som ägg, mjölk eller pasta!'}
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
                        <h4>Ingredienser som behövs:</h4>
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
