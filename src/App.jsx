import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { suggestRecipes } from './recipes'
import ExpirySettings from './ExpirySettings'
import { calculateSmartExpiryDate, getSmartProductCategory, learnFromUserAdjustment } from './smartExpiryAI'
import { searchFoods, getFoodDefaults, SHOPPING_TEMPLATES } from './swedishFoodDatabase'
import './mobile.css'

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
  const [bulkMode, setBulkMode] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  const [canUndo, setCanUndo] = useState(false)
  const [showExpirySettings, setShowExpirySettings] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Autocomplete and mobile UX states
  const [autocompleteResults, setAutocompleteResults] = useState([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [bulkInputMode, setBulkInputMode] = useState(false)
  const [lastAddedItem, setLastAddedItem] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [notification, setNotification] = useState(null)
  
  // Refs for better mobile UX
  const nameInputRef = useRef(null)
  const quantityInputRef = useRef(null)
  const expiryInputRef = useRef(null)
  const autocompleteRef = useRef(null)

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

  // Initiera tema från localStorage eller systempreferens
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
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Tillämpa tema på dokument och spara till localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Smart autocomplete search
  const handleNameInput = useCallback((e) => {
    const value = e.target.value
    setForm(f => ({ ...f, name: value }))
    
    if (value.length > 0) {
      const results = searchFoods(value)
      setAutocompleteResults(results)
      setShowAutocomplete(results.length > 0)
    } else {
      setShowAutocomplete(false)
      setAutocompleteResults([])
    }
  }, [])
  
  // Select from autocomplete
  const selectFood = useCallback((foodKey) => {
    const defaults = getFoodDefaults(foodKey)
    if (defaults) {
      setForm({
        name: defaults.name,
        quantity: defaults.quantity,
        expiresAt: defaults.expiresAt
      })
      setShowAutocomplete(false)
      // Auto-focus next field for mobile flow
      setTimeout(() => quantityInputRef.current?.focus(), 100)
    }
  }, [])
  
  const onChange = e => {
    const { name, value } = e.target
    if (name === 'quantity') {
      const numValue = parseFloat(value)
      setForm(f => ({ ...f, [name]: isNaN(numValue) ? 0 : Math.max(0, numValue) }))
    } else if (name === 'name') {
      handleNameInput(e)
      return
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  // Enhanced onAdd with mobile UX improvements
  const onAdd = e => {
    e.preventDefault()
    if (!form.name || !form.expiresAt || form.quantity <= 0) return
    
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    const unitKey = getSuggestedUnitKey(form.name)
    const unit = SV_UNITS[unitKey] || SV_UNITS.defaultUnit
    const newItem = { id, ...form, unit }
    
    setItems(prev => [...prev, newItem])
    setLastAddedItem(newItem)
    
    // Show success notification
    showNotification(`✅ ${form.name} tillagd!`)
    
    if (bulkInputMode) {
      // In bulk mode, keep same expiry date, clear name and quantity
      setForm({ 
        name: '', 
        quantity: 0, 
        expiresAt: form.expiresAt // Keep expiry for bulk input
      })
    } else {
      // Normal mode - clear everything
      setForm({ 
        name: '', 
        quantity: 0, 
        expiresAt: '' 
      })
    }
    
    // Auto-focus name field for next entry
    setTimeout(() => nameInputRef.current?.focus(), 100)
  }
  
  // Mobile keyboard handling
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (e.target.name === 'name' && form.name) {
        // Try autocomplete first
        if (autocompleteResults.length > 0) {
          selectFood(autocompleteResults[0].key)
          return
        }
        quantityInputRef.current?.focus()
      } else if (e.target.name === 'quantity' && form.quantity > 0) {
        expiryInputRef.current?.focus()
      } else if (e.target.name === 'expiresAt' && form.expiresAt) {
        // Submit if all fields filled
        if (form.name && form.quantity > 0) {
          onAdd(e)
        }
      }
    }
    
    // Ctrl+Enter for quick add from any field
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      if (form.name && form.quantity > 0 && form.expiresAt) {
        onAdd(e)
      }
    }
  }, [form, autocompleteResults, bulkInputMode])
  
  // Notification system
  const showNotification = useCallback((message) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 2000)
  }, [])
  
  // Copy last product for quick re-entry
  const copyLastProduct = useCallback(() => {
    if (lastAddedItem) {
      setForm({
        name: lastAddedItem.name,
        quantity: lastAddedItem.quantity,
        expiresAt: lastAddedItem.expiresAt
      })
      nameInputRef.current?.focus()
      showNotification(`📋 Kopierade ${lastAddedItem.name}`)
    }
  }, [lastAddedItem])
  
  // Quick template functions
  const applyTemplate = useCallback((templateKey) => {
    const template = SHOPPING_TEMPLATES[templateKey]
    if (!template) return
    
    const templateItems = []
    template.items.forEach(foodKey => {
      const defaults = getFoodDefaults(foodKey)
      if (defaults) {
        const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())
        const unitKey = getSuggestedUnitKey(defaults.name)
        const unit = SV_UNITS[unitKey] || SV_UNITS.defaultUnit
        templateItems.push({ id, ...defaults, unit })
      }
    })
    
    setItems(prev => [...prev, ...templateItems])
    setShowTemplates(false)
    showNotification(`📝 ${template.name} tillagd (${templateItems.length} varor)!`)
  }, [])
  
  // Hide autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowAutocomplete(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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


  // Massoperationer
  const toggleBulkMode = () => {
    setBulkMode(prev => !prev)
    setSelectedItems(new Set())
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

  const bulkDelete = () => {
    if (selectedItems.size === 0) return
    
    const confirmed = confirm(`Ta bort ${selectedItems.size} valda varor?`)
    if (confirmed) {
      const itemsToDelete = items.filter(item => selectedItems.has(item.id))
      
      // Spara åtgärd för att ångra
      saveAction({
        type: 'DELETE_BULK',
        data: { items: itemsToDelete },
        timestamp: Date.now()
      })
      
      setItems(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      setBulkMode(false)
    }
  }

  const undoLastAction = () => {
    if (actionHistory.length === 0) return
    
    const lastAction = actionHistory[actionHistory.length - 1]
    
    if (lastAction.type === 'DELETE_SINGLE') {
      // Återställ enskild raderad vara
      setItems(prev => [...prev, lastAction.data.item])
    } else if (lastAction.type === 'DELETE_BULK') {
      // Återställ massraderade varor
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
        </div>
      </header>

      <section className="card">
        <div className="form-header">
          <h2>Lägg till vara</h2>
          <div className="form-quick-actions">
            {lastAddedItem && (
              <button 
                type="button" 
                onClick={copyLastProduct}
                className="quick-action-btn"
                title="Kopiera senaste produkten"
              >
                📋 Kopiera
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setShowTemplates(!showTemplates)}
              className="quick-action-btn"
              title="Snabbmallar"
            >
              📝 Mallar
            </button>
            <button 
              type="button" 
              onClick={() => setBulkInputMode(!bulkInputMode)}
              className={`quick-action-btn ${bulkInputMode ? 'active' : ''}`}
              title="Flervaruläge - lägg till flera produkter snabbt"
            >
              {bulkInputMode ? '✅ Bulk PÅ' : '🚀 Bulk AV'}
            </button>
          </div>
        </div>
        
        {showTemplates && (
          <div className="templates-section">
            <h3>Snabbmallar</h3>
            <div className="template-buttons">
              {Object.entries(SHOPPING_TEMPLATES).map(([key, template]) => (
                <button 
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className="template-btn"
                >
                  {template.emoji} {template.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={onAdd}>
          <div className="form-grid">
            <div className="form-row">
              <label>
                <span>Namn {bulkInputMode && <small>(Bulk-läge: håll samma datum)</small>}</span>
                <div className="name-input-container" ref={autocompleteRef}>
                  <input 
                    ref={nameInputRef}
                    name="name" 
                    value={form.name} 
                    onChange={handleNameInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Vad har du köpt? (t.ex. mjölk, äpplen)"
                    autoFocus
                    required 
                    autoComplete="off"
                  />
                  {showAutocomplete && autocompleteResults.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {autocompleteResults.map((result, index) => (
                        <button
                          key={result.key}
                          type="button"
                          className={`autocomplete-item ${index === 0 ? 'highlighted' : ''}`}
                          onClick={() => selectFood(result.key)}
                        >
                          <span className="food-emoji">{result.emoji}</span>
                          <div className="food-details">
                            <div className="food-name">{result.name}</div>
                            <div className="food-meta">{result.defaultQuantity} {result.unit}</div>
                          </div>
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
                    ref={quantityInputRef}
                    type="number" 
                    name="quantity" 
                    min="0" 
                    step="0.1"
                    inputMode="decimal"
                    value={form.quantity} 
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
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
                    ref={expiryInputRef}
                    type="date" 
                    name="expiresAt" 
                    value={form.expiresAt} 
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    min={new Date().toISOString().split('T')[0]}
                    required 
                  />
                  {form.name && (
                    <div className="expiry-helper">
                      <span className="helper-text">💡 Kolla förpackningen för exakt datum</span>
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
          </div>
          <div className="form-actions">
            <button type="submit" disabled={!form.name || !form.expiresAt || form.quantity <= 0}>
              ➕ {bulkInputMode ? 'Lägg till & fortsätt' : 'Lägg till vara'}
            </button>
            {bulkInputMode && (
              <button 
                type="button" 
                onClick={() => setBulkInputMode(false)}
                className="secondary-btn"
              >
                ✅ Avsluta bulk-läge
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="list-header">
          <div className="section-title">
            <h2>Varor</h2>
            <div className="header-actions">
              <button 
                onClick={toggleBulkMode}
                className={`bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
                disabled={items.length === 0}
                title={bulkMode ? '✕ Avsluta markering' : '☑️ Markera flera'}
              >
                {bulkMode ? '✕ Klar' : '☑️ Markera flera'}
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
            
            {bulkMode && (
            <div className="bulk-actions">
                <div className="bulk-info">
                  <span>📋 {selectedItems.size} av {filtered.length} varor valda</span>
                </div>
                <div className="bulk-buttons">
                  <button onClick={selectAllVisible} className="bulk-btn secondary">✓ Välj alla synliga</button>
                  <button onClick={deselectAll} className="bulk-btn secondary">✕ Rensa urval</button>
                  <button 
                    onClick={bulkDelete} 
                    className="bulk-btn danger"
                    disabled={selectedItems.size === 0}
                  >
                    <span>🗑️ Ta bort ({selectedItems.size})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>
              <span>{items.length === 0 
                ? '🍽️ Inga varor ännu. Börja genom att lägga till din första vara ovan!'
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
                <li key={i.id} className={`${d < 0 ? 'expired' : d <= 3 ? 'expiring' : ''} ${bulkMode ? 'bulk-mode' : ''} ${selectedItems.has(i.id) ? 'selected' : ''}`}>
                  {bulkMode && (
                    <div className="item-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.has(i.id)}
                        onChange={() => toggleSelectItem(i.id)}
                        id={`item-${i.id}`}
                      />
                      <label htmlFor={`item-${i.id}`} className="checkbox-label"></label>
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
                  {!bulkMode && (
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

      <section className="card">
        <h2>🍳 Receptförslag</h2>
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
              <div key={r.id} className="recipe-card">
                <div className="recipe-header">
                  <h3>{r.name}</h3>
                  <div className="recipe-meta">
                    <span className="servings">👥 {r.servings} portioner</span>
                    <span className="time">⏱️ {svTimeLabel(r.cookingTime)}</span>
                    <span className={`difficulty ${svDifficultyClass(r.difficulty)}`}>📶 {svDifficultyLabel(r.difficulty)}</span>
                  </div>
                </div>
                
                <div className="recipe-ingredients">
                  <h4>Ingredienser som behövs:</h4>
                  <ul>
                    {r.usedIngredients.map((ingredient, idx) => (
                      <li key={idx} className="ingredient-item">
                        <span className="ingredient-amount">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        <span className="ingredient-name">{ingredient.name}</span>
                        <span className="ingredient-available">
                          <span>(Du har: {ingredient.availableQuantity} {abbreviateUnit(ingredient.availableUnit || ingredient.unit)} {ingredient.itemName})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="recipe-instructions">
                  <h4>Instruktioner:</h4>
                  <p>{r.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      

      <footer className="muted">Data sparas i din webbläsare (localStorage).</footer>
      
      {/* Notification system */}
      {notification && (
        <div className="notification-toast">
          {notification}
        </div>
      )}
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
