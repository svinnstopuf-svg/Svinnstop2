import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes } from './recipes'

// Anti-translation Swedish text helpers
function antiTranslate(text) {
  // Insert zero-width spaces and use CSS to hide/show parts
  return text
    .replace(/dagar/g, 'dag\u200Bar')
    .replace(/kvar/g, 'kv\u200Bar')
    .replace(/utgången/gi, 'utg\u200Bången')
    .replace(/varor/g, 'var\u200Bor')
    .replace(/antal/gi, 'ant\u200Bal')
    .replace(/stycken/g, 'styck\u200Ben')
    .replace(/portioner/g, 'port\u200Bioner')
    .replace(/minuter/g, 'min\u200Buter')
    .replace(/ingredienser/g, 'ingred\u200Bienser')
    .replace(/instruktioner/g, 'instru\u200Bktioner')
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

// Get suggested unit key for quantity label based on item name
function getSuggestedUnitKey(itemName) {
  if (!itemName.trim()) return 'defaultUnit'
  
  const name = itemName.toLowerCase()
  
  // Support multiple languages for item detection
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
  
  // Dairy (solid)
  if (name.includes('cheese') || name.includes('ost') || name.includes('käse') ||
      name.includes('butter') || name.includes('smör') || name.includes('butter') ||
      name.includes('yogurt') || name.includes('yoghurt') || name.includes('joghurt')) {
    return 'grams'
  }
  
  // Rice/Pasta/Grains
  if (name.includes('rice') || name.includes('ris') || name.includes('reis') ||
      name.includes('pasta') || name.includes('pasta') || name.includes('nudeln') ||
      name.includes('flour') || name.includes('mjöl') || name.includes('mehl')) {
    return 'grams'
  }
  
  // Canned goods
  if (name.includes('can') || name.includes('burk') || name.includes('dose') ||
      name.includes('tin') || name.includes('konserv') || name.includes('büchse')) {
    return 'cans'
  }
  
  // Default
  return 'pieces'
}

const STORAGE_KEY = 'svinnstop_items'
const THEME_KEY = 'svinnstop_theme'

// Swedish units map (used for UI hints and stored unit)
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

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setItems(JSON.parse(saved)) } catch {}
    }
    
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Apply theme to document and save to localStorage
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
      // Save action for undo
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
  

  // Undo/Redo functionality
  const saveAction = (action) => {
    setActionHistory(prev => {
      const newHistory = [...prev, action].slice(-10) // Keep last 10 actions
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

  // Bulk operations
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
      
      // Save action for undo
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
      // Restore single deleted item
      setItems(prev => [...prev, lastAction.data.item])
    } else if (lastAction.type === 'DELETE_BULK') {
      // Restore bulk deleted items
      setItems(prev => [...prev, ...lastAction.data.items])
    }
    
    // Remove the action from history
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
    
    // Apply status filter
    if (filter === 'expiring') {
      result = result.filter(i => daysUntil(i.expiresAt) <= 3 && daysUntil(i.expiresAt) >= 0)
    } else if (filter === 'expired') {
      result = result.filter(i => new Date(i.expiresAt) < now)
    }
    
    // Apply search filter
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
  
  // Get suggested unit based on current item name
  const suggestedUnitKey = useMemo(() => {
    const key = getSuggestedUnitKey(form.name)
    console.log('Suggested unit key:', key, 'for item:', form.name)
    return key
  }, [form.name])
  const suggestedUnit = useMemo(() => {
    const unit = SV_UNITS[suggestedUnitKey] || SV_UNITS.defaultUnit
    console.log('Suggested unit (SV):', unit, 'for key:', suggestedUnitKey)
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
