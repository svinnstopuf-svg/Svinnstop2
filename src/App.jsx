import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes } from './recipes'

// Swedish text protection system - ULTRA AGGRESSIVE MODE
const SWEDISH_TRANSLATIONS = {
  // Common mistranslations
  'days left': 'dagar kvar',
  'day left': 'dag kvar',
  'items': 'varor',
  'item': 'vara',
  'quantity': 'antal',
  'pieces': 'stycken',
  'expired': 'utgången',
  'expires today': 'går ut idag',
  'add item': 'lägg till vara',
  'name': 'namn',
  'purchase date': 'inköpsdatum',
  'expiry date': 'utgångsdatum',
  'expiry': 'utgång',
  'recipe suggestions': 'receptförslag',
  'ingredients needed': 'ingredienser som behövs',
  'instructions': 'instruktioner',
  'servings': 'portioner',
  'you have': 'du har',
  'minutes': 'minuter',
  'easy': 'lätt',
  'medium': 'medel',
  'hard': 'svår',
  'all': 'alla',
  'search': 'sök',
  'select': 'välj',
  'exit': 'avsluta',
  'export': 'exportera',
  'delete': 'ta bort',
  'undo': 'ångra',
  'remove': 'ta bort',
  'Remove': 'Ta bort',
  'REMOVE': 'TA BORT',
  'Delete': 'Ta bort',
  'DELETE': 'TA BORT',
  'bulk': 'massa',
  'toggle': 'växla',
  'button': 'knapp',
  'click': 'klicka',
  'selected': 'vald',
  'count': 'antal',
  'total': 'totalt',
  'confirm': 'bekräfta',
  'cancel': 'avbryt',
  'loading': 'laddar',
  'error': 'fel',
  'success': 'lyckades',
  'warning': 'varning',
  'info': 'information'
}

// ULTRA AGGRESSIVE text protection with zero-width characters
function antiTranslate(text) {
  if (!text) return text
  return String(text)
    // Grundläggande ord
    .replace(/dagar/gi, 'dag\u200Bar')
    .replace(/kvar/gi, 'kv\u200Bar')
    .replace(/utgången/gi, 'utg\u200Bången')
    .replace(/varor/gi, 'var\u200Bor')
    .replace(/antal/gi, 'ant\u200Bal')
    .replace(/stycken/gi, 'styck\u200Ben')
    .replace(/portioner/gi, 'port\u200Bioner')
    .replace(/minuter/gi, 'min\u200Buter')
    .replace(/ingredienser/gi, 'ingred\u200Bienser')
    .replace(/instruktioner/gi, 'instru\u200Bktioner')
    .replace(/receptförslag/gi, 'recept\u200Bförslag')
    .replace(/lägg till/gi, 'lägg\u200B till')
    .replace(/inköpsdatum/gi, 'ink\u200Böpsdatum')
    .replace(/utgångsdatum/gi, 'utg\u200Bångsdatum')
    // Fler ord som kan översättas
    .replace(/ta bort/gi, 'ta\u200B bort')
    .replace(/radera/gi, 'rad\u200Bera')
    .replace(/välj/gi, 'vä\u200Blj')
    .replace(/avsluta/gi, 'avs\u200Bluta')
    .replace(/exportera/gi, 'export\u200Bera')
    .replace(/ångra/gi, 'ång\u200Bra')
    .replace(/alla/gi, 'al\u200Bla')
    .replace(/sök/gi, 's\u200Bök')
    .replace(/namn/gi, 'na\u200Bmn')
    .replace(/lätt/gi, 'l\u200Bätt')
    .replace(/medel/gi, 'med\u200Bel')
    .replace(/svår/gi, 'sv\u200Bår')
    .replace(/utgång/gi, 'utg\u200Bång')
    .replace(/knapp/gi, 'kna\u200Bpp')
    .replace(/växla/gi, 'väx\u200Bla')
    .replace(/bekräfta/gi, 'bekr\u200Bäfta')
    .replace(/avbryt/gi, 'avb\u200Bryt')

// Store original Swedish text for restoration
const originalTexts = new Map()

function protectElement(element, originalText) {
  if (!element || !originalText) return
  originalTexts.set(element, originalText)
  element.setAttribute('data-original-sv', originalText)
}

// ULTRA AGGRESSIVE Swedish text restoration
function restoreSwedishText() {
  // First, restore all elements with original Swedish text
  document.querySelectorAll('[data-original-sv]').forEach(element => {
    const original = element.getAttribute('data-original-sv')
    if (element.textContent !== original && !element.textContent.includes('\u200B')) {
      element.textContent = original
    }
  })
  
  // ULTRA AGGRESSIVE: Scan ALL text nodes and fix translations
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )
  
  const textNodesToFix = []
  let node
  while (node = walker.nextNode()) {
    if (node.textContent && node.textContent.trim()) {
      textNodesToFix.push(node)
    }
  }
  
  // Fix each text node
  textNodesToFix.forEach(textNode => {
    let content = textNode.textContent
    let wasChanged = false
    
    // Replace ALL English words with Swedish
    Object.entries(SWEDISH_TRANSLATIONS).forEach(([english, swedish]) => {
      const regex = new RegExp('\\b' + english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')
      if (regex.test(content)) {
        content = content.replace(regex, swedish)
        wasChanged = true
      }
    })
    
    if (wasChanged) {
      textNode.textContent = content
    }
  })
  
  // Remove any Google Translate UI elements immediately
  const googleElements = document.querySelectorAll(
    '.skiptranslate, [class*="goog"], [id*="goog"], [class*="trans"], [id*="trans"], .translated-ltr, .translated-rtl'
  )
  googleElements.forEach(el => el.remove())
  
  // Force all elements to have Swedish lang attribute
  document.querySelectorAll('*').forEach(el => {
    if (el.hasAttribute('lang') && el.getAttribute('lang') !== 'sv') {
      el.setAttribute('lang', 'sv')
    }
  })
}

// Format Swedish-only "days left" string with anti-translation
function formatDaysLeft(days) {
  const text = days === 1 ? '1 dag kvar' : `${days} dagar kvar`
  return antiTranslate(text)
}

function svDifficultyLabel(raw) {
  const v = String(raw || '').toLowerCase()
  if (v === 'easy' || v === 'lätt') return antiTranslate('Lätt')
  if (v === 'medium' || v === 'medel') return antiTranslate('Medel')
  if (v === 'hard' || v === 'svår') return antiTranslate('Svår')
  return antiTranslate(raw || 'Medel')
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
  const translated = s
    .replace(/\bminutes\b/gi, 'minuter')
    .replace(/\bminute\b/gi, 'minut')
    .replace(/\bhours\b/gi, 'timmar')
    .replace(/\bhour\b/gi, 'timme')
  return antiTranslate(translated)
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

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', quantity: 0, purchasedAt: '', expiresAt: '' })
  const [filter, setFilter] = useState('all')
  const [theme, setTheme] = useState('dark')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  const [canUndo, setCanUndo] = useState(false)

  // Starta svenskt textskyddssystem
  useEffect(() => {
    // ULTRA AGGRESSIVE: Övervaka översättningsändringar var 100:e ms
    const textProtectionInterval = setInterval(restoreSwedishText, 100)
    
    // ULTRA AGGRESSIVE DOM-övervakning för översättningsförsök
    const textObserver = new MutationObserver((mutations) => {
      let shouldRestore = false
      mutations.forEach(mutation => {
        // Reagera på ALLA DOM-ändringar
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          shouldRestore = true
        }
        if (mutation.type === 'attributes') {
          const target = mutation.target
          // Reagera på ALLA attributändringar som kan indikera översättning
          if (target.className && (
            target.className.includes('translated') ||
            target.className.includes('goog') ||
            target.className.includes('trans')
          )) {
            shouldRestore = true
          }
          // Reagera på språkändringar
          if (mutation.attributeName === 'lang' && target.getAttribute('lang') !== 'sv') {
            target.setAttribute('lang', 'sv')
            shouldRestore = true
          }
        }
        
        // Kontrollera nya noder för Google Translate-element
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              if (node.className && (
                node.className.includes('goog') ||
                node.className.includes('trans') ||
                node.className.includes('skiptranslate')
              )) {
                node.remove()
                shouldRestore = true
              }
            }
          })
        }
      })
      if (shouldRestore) {
        // Kör omedelbart och sedan efter kort fördröjning
        restoreSwedishText()
        setTimeout(restoreSwedishText, 10)
        setTimeout(restoreSwedishText, 50)
      }
    })
    
    textObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    })
    
    return () => {
      clearInterval(textProtectionInterval)
      textObserver.disconnect()
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
  }

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
    setForm({ name: '', quantity: 0, purchasedAt: '', expiresAt: '' })
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

  const exportToCSV = () => {
    if (items.length === 0) {
      alert('Inga varor att exportera!')
      return
    }

    const headers = [
      'Namn',
      'Antal',
      'Inköpsdatum',
      'Utgångsdatum',
      'Dagar till utgång',
      'Status'
    ]
    const csvData = items.map(item => {
      const days = daysUntil(item.expiresAt)
      const status = days < 0 ? 'Utgången' : days === 0 ? 'Går ut idag' : `${days} dagar kvar`
      return [
        item.name,
        `${item.quantity} ${item.unit || ''}`.trim(),
        item.purchasedAt || 'Ej tillgänglig',
        item.expiresAt,
        days,
        status
      ]
    })

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `svinnstop-inventering-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        (i.purchasedAt && i.purchasedAt.includes(query)) ||
        (i.expiresAt && i.expiresAt.includes(query))
      )
    }
    
    return result
  }, [sorted, filter, searchQuery])

  const suggestions = useMemo(() => suggestRecipes(items), [items])
  
  // Hämta föreslagen enhet baserat på nuvarande varans namn
  const suggestedUnitKey = useMemo(() => {
    const key = getSuggestedUnitKey(form.name)
    console.log('Föreslagen enhetsnyckel:', key, 'för vara:', form.name)
    return key
  }, [form.name])
  const suggestedUnit = useMemo(() => {
    const unit = SV_UNITS[suggestedUnitKey] || SV_UNITS.defaultUnit
    console.log('Föreslagen enhet (SV):', unit, 'för nyckel:', suggestedUnitKey)
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
            <h1>Svinnstop</h1>
            <p>{'Spåra din inköpta mat, utgångsdatum och se receptidéer.'}</p>
          </div>
        </div>
      </header>

      <section className="card">
        <h2 className="notranslate" translate="no">{antiTranslate('Lägg till vara')}</h2>
        <form onSubmit={onAdd}>
          <div className="form-grid">
            <div className="form-row">
              <label>
                <span className="notranslate" translate="no">{antiTranslate('Namn')}</span>
                <input name="name" value={form.name} onChange={onChange} placeholder={'t.ex. mjölk, bröd, tomat'} required />
              </label>
              <label>
                <span className="label-title">
                  <span className="notranslate" translate="no">{antiTranslate('Antal')}</span> <span className="muted notranslate" translate="no">({antiTranslate(suggestedUnit)})</span>
                </span>
                <input 
                  type="number" 
                  name="quantity" 
                  min="0" 
                  step="0.1"
                  value={form.quantity} 
                  onChange={onChange}
                  onFocus={(e) => e.target.select()}
                  placeholder={`0 ${suggestedUnit}`}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                <span className="notranslate" translate="no">{antiTranslate('Inköpsdatum')}</span>
                <input type="date" name="purchasedAt" value={form.purchasedAt} onChange={onChange} />
              </label>
              <label>
                <span className="notranslate" translate="no">{antiTranslate('Utgångsdatum')}</span>
                <input type="date" name="expiresAt" value={form.expiresAt} onChange={onChange} required />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="notranslate" translate="no">{antiTranslate('Lägg till')}</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="list-header">
          <div className="section-title">
            <h2 className="notranslate" translate="no">{antiTranslate('Varor')}</h2>
            <div className="header-actions">
              <button 
                onClick={toggleBulkMode}
                className={`bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
                disabled={items.length === 0}
                title={bulkMode ? '✕ Avsluta' : '☑️ Välj'}
              >
                {bulkMode ? '✕ Avsluta' : '☑️ Välj'}
              </button>
              <button 
                onClick={exportToCSV} 
                className="export-btn"
                disabled={items.length === 0}
                title={'📊 Exportera CSV'}
              >
                {'📊 Exportera CSV'}
              </button>
            </div>
          </div>
          <div className="search-and-filters">
            <input 
              type="text" 
              placeholder={'Sök varor...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="filters">
              <label><input type="radio" name="f" checked={filter === 'all'} onChange={() => setFilter('all')} /> <span className="notranslate" translate="no">{antiTranslate('Alla')}</span></label>
              <label><input type="radio" name="f" checked={filter === 'expiring'} onChange={() => setFilter('expiring')} /> <span className="notranslate" translate="no">{antiTranslate('Går ut inom ≤ 3 dagar')}</span></label>
              <label><input type="radio" name="f" checked={filter === 'expired'} onChange={() => setFilter('expired')} /> <span className="notranslate" translate="no">{antiTranslate('Utgångna')}</span></label>
            </div>
            
            {bulkMode && (
              <div className="bulk-actions">
                <div className="bulk-info">
                  <span className="notranslate" translate="no">{antiTranslate(`${selectedItems.size} av ${filtered.length} varor valda`)}</span>
                </div>
                <div className="bulk-buttons">
                  <button onClick={selectAllVisible} className="bulk-btn secondary notranslate" translate="no">{antiTranslate('Välj alla')}</button>
                  <button onClick={deselectAll} className="bulk-btn secondary notranslate" translate="no">{antiTranslate('Avmarkera alla')}</button>
                  <button 
                    onClick={bulkDelete} 
                    className="bulk-btn danger"
                    disabled={selectedItems.size === 0}
                  >
                    <span className="notranslate" translate="no">{antiTranslate(`Ta bort valda (${selectedItems.size})`)}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p>
            <span className="notranslate" translate="no">{items.length === 0 
              ? antiTranslate('Inga varor ännu. Lägg till din första vara ovan.')
              : searchQuery.trim() 
                ? antiTranslate(`Inga varor hittades som matchar "${searchQuery}"`)
                : antiTranslate('Inga varor matchar det valda filtret.')}</span>
          </p>
        ) : (
          <ul className="items">
            {filtered.map(i => {
              const d = daysUntil(i.expiresAt)
              const status = d < 0 ? antiTranslate('Utgången') : d === 0 ? antiTranslate('Går ut idag') : formatDaysLeft(d)
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
                  <div className="item-main">
                    <strong>{i.name}</strong>
                    <span className="muted">{i.quantity} {i.unit}</span>
                  </div>
                  <div className="item-sub">
                    <span className="notranslate" translate="no">{antiTranslate('Utgång')}: {i.expiresAt || '—'}</span>
                    <span className="status notranslate" translate="no">{status}</span>
                  </div>
                  {!bulkMode && (
                    <button className="link" onClick={() => onRemove(i.id)}>×</button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="notranslate" translate="no">{antiTranslate('Receptförslag')}</h2>
        {suggestions.length === 0 ? (
          <p className="notranslate" translate="no">{items.length === 0 ? antiTranslate('Lägg till varor för att se receptförslag.') : antiTranslate('Inga recept hittades med dina nuvarande ingredienser. Försök lägga till fler varor!')}</p>
        ) : (
          <div className="recipes notranslate" translate="no">
            {suggestions.map(r => (
              <div key={r.id} className="recipe-card notranslate" translate="no">
                <div className="recipe-header">
                  <h3>{r.name}</h3>
                  <div className="recipe-meta">
                    <span className="servings notranslate" translate="no">👥 {r.servings} {antiTranslate('portioner')}</span>
                    <span className="time">⏱️ {svTimeLabel(r.cookingTime)}</span>
                    <span className={`difficulty ${svDifficultyClass(r.difficulty)}`}>📶 {svDifficultyLabel(r.difficulty)}</span>
                  </div>
                </div>
                
                <div className="recipe-ingredients">
                  <h4 className="notranslate" translate="no">{antiTranslate('Ingredienser som behövs:')}</h4>
                  <ul>
                    {r.usedIngredients.map((ingredient, idx) => (
                      <li key={idx} className="ingredient-item">
                        <span className="ingredient-amount">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        <span className="ingredient-name">{ingredient.name}</span>
                        <span className="ingredient-available">
                          <span className="notranslate" translate="no">({antiTranslate('du har')} {ingredient.availableQuantity} {ingredient.itemName})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="recipe-instructions">
                  <h4 className="notranslate" translate="no">{antiTranslate('Instruktioner:')}</h4>
                  <p>{r.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="muted notranslate" translate="no">{antiTranslate('Data sparas i din webbläsare (localStorage).')}</footer>
    </div>
    </>
  )
}
