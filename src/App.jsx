import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes } from './recipes'
import { getLanguage, t, plural } from './translations'

function daysUntil(dateStr) {
  const today = new Date()
  const date = new Date(dateStr)
  const diff = Math.ceil((date - new Date(today.toDateString())) / (1000 * 60 * 60 * 24))
  return diff
}

// Get suggested unit key for quantity label based on item name
function getSuggestedUnitKey(itemName) {
  if (!itemName.trim()) return 'quantity'
  
  const name = itemName.toLowerCase()
  
  // Support multiple languages for item detection
  const isLiquid = name.includes('milk') || name.includes('mjölk') || name.includes('milch') ||
                   name.includes('juice') || name.includes('saft') || name.includes('saft') ||
                   name.includes('water') || name.includes('vatten') || name.includes('wasser') ||
                   name.includes('oil') || name.includes('olja') || name.includes('öl') ||
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
  const [language, setLanguage] = useState('en')

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
    
    // Initialize language from browser
    setLanguage(getLanguage())
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Apply theme to document and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const onChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'quantity' ? Number(value) : value }))
  }

  const onAdd = e => {
    e.preventDefault()
    if (!form.name || !form.expiresAt || form.quantity <= 0) return
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    const unitKey = getSuggestedUnitKey(form.name)
    const unit = t(`units.${unitKey}`, language)
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
      alert(t('noItemsToExport', language))
      return
    }

    const headers = ['Name', 'Quantity', 'Purchase Date', 'Expiry Date', 'Days Until Expiry', 'Status']
    const csvData = items.map(item => {
      const days = daysUntil(item.expiresAt)
      const status = days < 0 ? 'Expired' : days === 0 ? 'Expires today' : `${days} days left`
      return [
        item.name,
        `${item.quantity} ${item.unit || ''}`.trim(),
        item.purchasedAt || 'N/A',
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
    link.setAttribute('download', `svinnstop-inventory-${new Date().toISOString().split('T')[0]}.csv`)
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
    
    const confirmed = confirm(t('bulkDeleteConfirm', language, { count: selectedItems.size, plural: plural(selectedItems.size) }))
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

  const suggestions = useMemo(() => suggestRecipes(items, language), [items, language])
  
  // Get suggested unit based on current item name
  const suggestedUnitKey = useMemo(() => getSuggestedUnitKey(form.name), [form.name])
  const suggestedUnit = useMemo(() => t(`units.${suggestedUnitKey}`, language), [suggestedUnitKey, language])

  return (
    <>
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      
      <button 
        className="undo-btn" 
        onClick={undoLastAction}
        disabled={!canUndo}
        title={t('undoTitle', language)}
        aria-label={t('undoTitle', language)}
      >
        {t('undoButton', language)}
      </button>
      
    <div className="container">
      <header>
        <h1>{t('appName', language)}</h1>
        <p>{t('appDescription', language)}</p>
      </header>

      <section className="card">
        <h2>{t('addItem', language)}</h2>
        <form onSubmit={onAdd} className="grid">
          <label>
            {t('name', language)}
            <input name="name" value={form.name} onChange={onChange} placeholder={t('namePlaceholder', language)} required />
          </label>
          <label>
            {t('quantity', language)} ({suggestedUnit})
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
          <label>
            {t('purchaseDate', language)}
            <input type="date" name="purchasedAt" value={form.purchasedAt} onChange={onChange} />
          </label>
          <label>
            {t('expiryDate', language)}
            <input type="date" name="expiresAt" value={form.expiresAt} onChange={onChange} required />
          </label>
          <div className="actions">
            <button type="submit">{t('addButton', language)}</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="list-header">
          <div className="section-title">
            <h2>{t('items', language)}</h2>
            <div className="header-actions">
              <button 
                onClick={toggleBulkMode}
                className={`bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
                disabled={items.length === 0}
                title={bulkMode ? t('exitButton', language) : t('selectButton', language)}
              >
                {bulkMode ? t('exitButton', language) : t('selectButton', language)}
              </button>
              <button 
                onClick={exportToCSV} 
                className="export-btn"
                disabled={items.length === 0}
                title={t('exportCSV', language)}
              >
                {t('exportCSV', language)}
              </button>
            </div>
          </div>
          <div className="search-and-filters">
            <input 
              type="text" 
              placeholder={t('searchPlaceholder', language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="filters">
              <label><input type="radio" name="f" checked={filter === 'all'} onChange={() => setFilter('all')} /> {t('all', language)}</label>
              <label><input type="radio" name="f" checked={filter === 'expiring'} onChange={() => setFilter('expiring')} /> {t('expiring', language)}</label>
              <label><input type="radio" name="f" checked={filter === 'expired'} onChange={() => setFilter('expired')} /> {t('expired', language)}</label>
            </div>
            
            {bulkMode && (
              <div className="bulk-actions">
                <div className="bulk-info">
                  <span>{t('selectedCount', language, { selected: selectedItems.size, total: filtered.length })}</span>
                </div>
                <div className="bulk-buttons">
                  <button onClick={selectAllVisible} className="bulk-btn secondary">{t('selectAll', language)}</button>
                  <button onClick={deselectAll} className="bulk-btn secondary">{t('deselectAll', language)}</button>
                  <button 
                    onClick={bulkDelete} 
                    className="bulk-btn danger"
                    disabled={selectedItems.size === 0}
                  >
                    {t('deleteSelected', language)} ({selectedItems.size})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p>
            {items.length === 0 
              ? t('noItems', language)
              : searchQuery.trim() 
                ? t('noSearchResults', language, { query: searchQuery })
                : t('noFilterResults', language)}
          </p>
        ) : (
          <ul className="items">
            {filtered.map(i => {
              const d = daysUntil(i.expiresAt)
              const status = d < 0 ? t('expired', language) : d === 0 ? t('expiresToday', language) : t('daysLeft', language, { days: d, plural: plural(d) })
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
                    <span>{t('expiry', language)}: {i.expiresAt || '—'}</span>
                    <span className="status">{status}</span>
                  </div>
                  {!bulkMode && (
                    <button className="link" onClick={() => onRemove(i.id)}>Remove</button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>{t('recipeSuggestions', language)}</h2>
        {suggestions.length === 0 ? (
          <p>{items.length === 0 ? t('noRecipesEmpty', language) : t('noRecipesFound', language)}</p>
        ) : (
          <div className="recipes">
            {suggestions.map(r => (
              <div key={r.id} className="recipe-card">
                <div className="recipe-header">
                  <h3>{r.name}</h3>
                  <div className="recipe-meta">
                    <span className="servings">👥 {r.servings} {t('servings', language, { plural: plural(r.servings) })}</span>
                    <span className="time">⏱️ {r.cookingTime}</span>
                    <span className={`difficulty ${r.difficulty.toLowerCase()}`}>📶 {r.difficulty}</span>
                  </div>
                </div>
                
                <div className="recipe-ingredients">
                  <h4>{t('ingredientsNeeded', language)}</h4>
                  <ul>
                    {r.usedIngredients.map((ingredient, idx) => (
                      <li key={idx} className="ingredient-item">
                        <span className="ingredient-amount">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                        <span className="ingredient-name">{ingredient.name}</span>
                        <span className="ingredient-available">
                          (you have: {ingredient.availableQuantity} {ingredient.itemName})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="recipe-instructions">
                  <h4>{t('instructions', language)}</h4>
                  <p>{r.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="muted">{t('dataStorage', language)}</footer>
    </div>
    </>
  )
}
