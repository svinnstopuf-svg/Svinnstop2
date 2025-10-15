import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes } from './recipes'
import BarcodeScanner from './BarcodeScanner'
import ExpirySettings from './ExpirySettings'
import { lookupProduct } from './productAPI'
import { calculateSmartExpiryDate, getSmartProductCategory, learnFromUserAdjustment } from './smartExpiryAI'
import { getExpirationDateGuess } from './expirationDateAI'
import './mobile.css'

// Pro-svenska med Google Translate samarbete
// Låt Google göra jobbet åt oss!

// Enkel funktion - ingen aggressiv textmanipulering
function justText(text) {
  return text || ''
}
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

// Formatera antal och vara på ett naturligt sätt som Google Translate kan hantera
function formatIngredientAmount(word, count) {
  // Använd naturlig svenska som Google förstår bättre
  if (count === 1) {
    return `1 ${word}`
  }
  // För flera, låt Google Translate hantera grammatiken naturligt
  return `${count} ${word}`
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
  const [showScanner, setShowScanner] = useState(false)
  const [scanningProduct, setScanningProduct] = useState(false)
  const [scanSuccessful, setScanSuccessful] = useState(false)
  const [showExpirySettings, setShowExpirySettings] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  // Automatiskt utgångsdatum-scanning stöd
  const [pendingProducts, setPendingProducts] = useState([])
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [isDateScanningMode, setIsDateScanningMode] = useState(false)
  
  // Debug-state för kvittoscanning
  const [debugInfo, setDebugInfo] = useState([])
  const [showDebug, setShowDebug] = useState(true)

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

  const onChange = e => {
    const { name, value } = e.target
    if (name === 'quantity') {
      const numValue = parseFloat(value)
      setForm(f => ({ ...f, [name]: isNaN(numValue) ? 0 : Math.max(0, numValue) }))
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
    setItems(prev => [...prev, { id, ...form, unit }])
    setForm({ 
      name: '', 
      quantity: 0, 
      expiresAt: '' 
    })
    
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
  
  // Hantera automatisk datumscanning
  const handleDateScanComplete = (scannedDate) => {
    if (!isDateScanningMode || pendingProducts.length === 0) {
      // Vanlig datumscanning (inte automatisk sekvens)
      setForm(prev => ({ ...prev, expiresAt: scannedDate }))
      setScanSuccessful(true)
      return
    }
    
    const currentProduct = pendingProducts[currentProductIndex]
    
    // Uppdatera den aktuella produkten med det scannade datumet
    const updatedProduct = {
      ...currentProduct,
      expiresAt: scannedDate
    }
    
    // Lägg till produkten i listan
    setItems(prev => [...prev, updatedProduct])
    console.log(`✅ ${currentProduct.name} tillagd med utgångsdatum: ${scannedDate}`)
    
    // Gå till nästa produkt
    const nextIndex = currentProductIndex + 1
    
    if (nextIndex < pendingProducts.length) {
      // Det finns fler produkter att scanna
      setCurrentProductIndex(nextIndex)
      console.log(`🔄 Fortsatt till produkt ${nextIndex + 1}/${pendingProducts.length}: ${pendingProducts[nextIndex].name}`)
    } else {
      // Alla produkter är klara
      console.log('✅ Alla produkter har fått utgångsdatum')
      
      // Rensa automatisk scanning-state
      setPendingProducts([])
      setCurrentProductIndex(0)
      setIsDateScanningMode(false)
      setScanSuccessful(true)
      
      // Stäng scanner och refresha sidan när hela sekvensen är klar
      setTimeout(() => {
        console.log('Automatisk datumscanning klar - refreshar sidan')
        window.location.reload()
      }, 500) // Kort delay så användaren ser att det är klart
    }
  }

  // Debug-funktioner
  const addDebugInfo = (title, content) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, { timestamp, title, content }].slice(-20)) // Behåll senaste 20
  }
  
  const clearDebugInfo = () => {
    setDebugInfo([])
  }
  
  // Kvittoscanning
  const handleReceiptScan = async (products, hasExpirationDate = false) => {
    try {
      console.log(`🧾 Kvittoscanning: Hittade ${products.length} produkter`)
      addDebugInfo('🧾 Kvittoscanning resultat', `Hittade ${products.length} produkter:\n${products.map(p => `- ${p.name} (${p.price} kr)`).join('\n')}`)
      
      // Kolla om produkter redan har utgångsdatum (AI-gissning)
      if (hasExpirationDate) {
        const readyProducts = products.map(product => {
          const categoryResult = getSmartProductCategory(product.name, null)
          
          return {
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
            name: product.name,
            quantity: product.quantity || 1,
            unit: product.unit || 'st',
            price: product.price,
            category: categoryResult.category,
            expiresAt: product.expiresAt,
            confidence: null,
            aiMethod: product.aiMethod || 'ai_suggested',
            adjustments: []
          }
        })
        
        // Lägg till produkter direkt
        setItems(prev => [...prev, ...readyProducts])
        setScanSuccessful(true)
        
        console.log('✨ Produkter med AI-datum tillagda:', readyProducts.map(p => `${p.name}: ${p.expiresAt}`).join(', '))
        
        // Stäng scanner efter kort fördröjning
        setTimeout(() => {
          setShowScanner(false)
        }, 1000)
        
        return
      }
      
      // Förbered produkter för automatisk utgångsdatumscanning
      const preparedProducts = products.map(product => {
        const categoryResult = getSmartProductCategory(product.name, null)
        
        return {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          name: product.name,
          quantity: product.quantity || 1,
          unit: product.unit || 'st',
          price: product.price,
          category: categoryResult.category,
          expiresAt: null, // Kommer att sättas genom datumscanning
          confidence: null,
          aiMethod: 'manual_scan',
          aiSuggestion: product.aiSuggestion || null, // Spara AI-förslaget för senare användning
          adjustments: []
        }
      })
      
      // Ställ in för automatisk datumscanning
      setPendingProducts(preparedProducts)
      setCurrentProductIndex(0)
      setIsDateScanningMode(true)
      
      // Inte stäng scanner - låt den växla till datumläge
      console.log('📋 Startar automatisk datumscanning för:', preparedProducts.map(p => p.name).join(', '))
      console.log('Scanner hålls öppen för datumscanning av', preparedProducts.length, 'produkter')
      
    } catch (error) {
      console.error('Fel vid kvittoscanning:', error)
      alert('Något gick fel vid kvittoscanning.')
    }
  }

  // Streckkodsscanning
  const handleScanBarcode = async (barcode) => {
    try {
      setScanningProduct(true)
      console.log('📱 Skannad streckkod:', barcode)
      
      // Hämta produktinformation
      const productInfo = await lookupProduct(barcode)
      
      let itemName, itemQuantity
      
      if (productInfo) {
        // Känd produkt från databasen
        itemName = productInfo.name
        itemQuantity = productInfo.quantity || 1
        console.log('✅ Känd produkt funnen:', itemName)
      } else {
        // Okänd produkt - använd streckkoden
        itemName = `Okänd produkt ${barcode}`
        itemQuantity = 1
        console.log('⚠️ Okänd produkt - använder streckkod som namn')
      }
      
      // 🤖 Använd smart AI för att beräkna utgångsdatum
      const smartResult = calculateSmartExpiryDate(itemName, productInfo)
      const categoryResult = getSmartProductCategory(itemName, productInfo)
      
      console.log(`🎯 Produktkategori: ${categoryResult.category} (konfidenz: ${categoryResult.confidence}%)`)
      console.log(`📅 Smart AI-beräknat utgångsdatum: ${smartResult.date} (${smartResult.method})`)
      
      // Förbered produkt för automatisk utgångsdatumscanning
      const preparedProduct = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name: itemName,
        quantity: itemQuantity,
        unit: SV_UNITS[getSuggestedUnitKey(itemName)] || SV_UNITS.defaultUnit,
        category: categoryResult.category,
        expiresAt: null, // Kommer att sättas genom datumscanning
        confidence: null,
        aiMethod: 'manual_scan',
        adjustments: []
      }
      
      // Ställ in för automatisk datumscanning
      setPendingProducts([preparedProduct])
      setCurrentProductIndex(0)
      setIsDateScanningMode(true)
      
      // Inte stäng scanner - låt den växla till datumläge
      console.log('📋 Startar automatisk datumscanning för:', itemName)
      console.log('Scanner hålls öppen för datumscanning')
      
    } catch (error) {
      console.error('Fel vid produktsökning:', error)
      alert('Något gick fel vid produktsökning. Försök igen.')
    } finally {
      setScanningProduct(false)
    }
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
        <h2>Lägg till vara</h2>
        <form onSubmit={onAdd}>
          <div className="form-grid">
            <div className="form-row">
              <label>
                <span>Namn</span>
                <div className="name-input-container">
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={onChange} 
                    placeholder="Vad har du köpt? (t.ex. mjölk, äpplen, bröd)"
                    autoFocus
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="scan-button"
                    title="Scanna streckkod"
                    disabled={scanningProduct}
                  >
                    {scanningProduct ? '⌛' : '📱'}
                  </button>
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
            <button type="submit">➕ Lägg till vara</button>
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
      
      {showDebug && debugInfo.length > 0 && (
        <section className="card debug-section">
          <div className="debug-header">
            <h2>🔍 Debug: Kvittoscanning</h2>
            <div className="debug-controls">
              <button onClick={clearDebugInfo} className="debug-btn">Rensa</button>
              <button onClick={() => setShowDebug(false)} className="debug-btn">Dölj</button>
            </div>
          </div>
          <div className="debug-content">
            {debugInfo.map((info, i) => (
              <div key={i} className="debug-item">
                <div className="debug-time">{info.timestamp}</div>
                <div className="debug-title">{info.title}</div>
                <div className="debug-content-text">{info.content}</div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {!showDebug && (
        <button 
          onClick={() => setShowDebug(true)} 
          className="show-debug-btn"
          style={{position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000}}
        >
          🔍 Debug
        </button>
      )}

      <footer className="muted">Data sparas i din webbläsare (localStorage).</footer>
    </div>
    
    <BarcodeScanner 
      isOpen={showScanner}
      onClose={() => {
        console.log('🔴 Kröss-knapp tryckt - stänger scanner och återvänder till huvudapp')
        
        // Rensa alltid automatisk scanning-state vid manuell stängning
        if (isDateScanningMode) {
          console.log('Avbryter automatisk datumscanning')
          setPendingProducts([])
          setCurrentProductIndex(0)
          setIsDateScanningMode(false)
        }
        
        // Rensa scanner-state
        setShowScanner(false)
        setScanSuccessful(false)
        
        // Refresha ALLTID för att säkerställa att användaren kommer tillbaka till huvudappen
        console.log('Refreshar sidan för att säkerställa återgång till huvudapp')
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }}
      onScan={handleScanBarcode}
      onReceiptScan={handleReceiptScan}
      onDateScan={handleDateScanComplete}
      onDebug={addDebugInfo}
      isDateScanningMode={isDateScanningMode}
      currentProduct={isDateScanningMode && pendingProducts.length > 0 ? {
        ...pendingProducts[currentProductIndex],
        aiSuggestion: getExpirationDateGuess(pendingProducts[currentProductIndex].name)
      } : null}
      productProgress={isDateScanningMode ? `${currentProductIndex + 1}/${pendingProducts.length}` : null}
    />
    
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
