import React, { useEffect, useMemo, useState } from 'react'
import { suggestRecipes } from './recipes'

function daysUntil(dateStr) {
  const today = new Date()
  const date = new Date(dateStr)
  const diff = Math.ceil((date - new Date(today.toDateString())) / (1000 * 60 * 60 * 24))
  return diff
}

const STORAGE_KEY = 'svinnstop_items'
const THEME_KEY = 'svinnstop_theme'

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: '', quantity: 1, purchasedAt: '', expiresAt: '' })
  const [filter, setFilter] = useState('all')
  const [theme, setTheme] = useState('dark')
  const [searchQuery, setSearchQuery] = useState('')

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

  const onChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'quantity' ? Number(value) : value }))
  }

  const onAdd = e => {
    e.preventDefault()
    if (!form.name || !form.expiresAt) return
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    setItems(prev => [...prev, { id, ...form }])
    setForm({ name: '', quantity: 1, purchasedAt: '', expiresAt: '' })
  }

  const onRemove = id => setItems(prev => prev.filter(i => i.id !== id))

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
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
      
    <div className="container">
      <header>
        <h1>Svinnstop</h1>
        <p>Track your purchased food, expiry dates, and see recipe ideas.</p>
      </header>

      <section className="card">
        <h2>Add item</h2>
        <form onSubmit={onAdd} className="grid">
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} placeholder="e.g. tomato" required />
          </label>
          <label>
            Quantity
            <input type="number" name="quantity" min="1" value={form.quantity} onChange={onChange} />
          </label>
          <label>
            Purchase date
            <input type="date" name="purchasedAt" value={form.purchasedAt} onChange={onChange} />
          </label>
          <label>
            Expiry date
            <input type="date" name="expiresAt" value={form.expiresAt} onChange={onChange} required />
          </label>
          <div className="actions">
            <button type="submit">Add</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="list-header">
          <h2>Items</h2>
          <div className="search-and-filters">
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="filters">
              <label><input type="radio" name="f" checked={filter === 'all'} onChange={() => setFilter('all')} /> All</label>
              <label><input type="radio" name="f" checked={filter === 'expiring'} onChange={() => setFilter('expiring')} /> Expiring ≤ 3 days</label>
              <label><input type="radio" name="f" checked={filter === 'expired'} onChange={() => setFilter('expired')} /> Expired</label>
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p>
            {items.length === 0 
              ? "No items yet. Add your first item above." 
              : searchQuery.trim() 
                ? `No items found matching "${searchQuery}"` 
                : "No items match the selected filter."}
          </p>
        ) : (
          <ul className="items">
            {filtered.map(i => {
              const d = daysUntil(i.expiresAt)
              const status = d < 0 ? 'Expired' : d === 0 ? 'Expires today' : `${d} day${d === 1 ? '' : 's'} left`
              return (
                <li key={i.id} className={d < 0 ? 'expired' : d <= 3 ? 'expiring' : ''}>
                  <div className="item-main">
                    <strong>{i.name}</strong>
                    <span className="muted">Qty: {i.quantity}</span>
                  </div>
                  <div className="item-sub">
                    <span>Expiry: {i.expiresAt || '—'}</span>
                    <span className="status">{status}</span>
                  </div>
                  <button className="link" onClick={() => onRemove(i.id)}>Remove</button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Recipe suggestions</h2>
        {suggestions.length === 0 ? (
          <p>Add items to see suggested recipes.</p>
        ) : (
          <ul className="recipes">
            {suggestions.map(r => (
              <li key={r.id}>
                <strong>{r.name}</strong>
                <div className="muted">Ingredients: {r.ingredients.join(', ')}</div>
                <div className="muted">{r.instructions}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="muted">Data is saved in your browser (localStorage).</footer>
    </div>
    </>
  )
}
