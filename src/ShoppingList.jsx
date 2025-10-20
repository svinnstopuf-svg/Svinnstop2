import React, { useState, useEffect } from 'react'
import { searchShoppingItems, getShoppingCategories } from './shoppingDatabase'
import { getExpiryDateSuggestion } from './foodDatabase'

// Kategorisering av matvaror vs andra varor
const FOOD_CATEGORIES = ['mejeri', 'kött', 'fisk', 'grönsak', 'frukt', 'bröd', 'spannmål', 'ägg', 'krydda', 'sås', 'olja']

function isFood(item) {
  if (!item.category) return false
  return FOOD_CATEGORIES.includes(item.category)
}

export default function ShoppingList({ onAddToInventory, onDirectAddToInventory }) {
  const [shoppingItems, setShoppingItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Ladda inköpslista från localStorage och rekommendationer
  useEffect(() => {
    const saved = localStorage.getItem('svinnstop_shopping_list')
    if (saved) {
      try {
        setShoppingItems(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load shopping list:', e)
      }
    }
  }, [])

  // Spara inköpslista till localStorage
  useEffect(() => {
    localStorage.setItem('svinnstop_shopping_list', JSON.stringify(shoppingItems))
  }, [shoppingItems])

  // Hantera sökning och förslag
  const handleInputChange = (e) => {
    const value = e.target.value
    setNewItem(value)
    
    if (value.trim().length > 0) {
      const shoppingSuggestions = searchShoppingItems(value.trim())
      setSuggestions(shoppingSuggestions)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // Lägg till vara från förslag
  const addFromSuggestion = (item) => {
    const newShoppingItem = {
      id: crypto.randomUUID(),
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      unit: item.unit || 'st',
      completed: false,
      isFood: item.isFood,
      addedAt: Date.now()
    }
    
    setShoppingItems(prev => [newShoppingItem, ...prev])
    setNewItem('')
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Lägg till manuell vara
  const addManualItem = (e) => {
    e.preventDefault()
    if (!newItem.trim()) return

    const newShoppingItem = {
      id: crypto.randomUUID(),
      name: newItem.trim(),
      category: 'övrigt',
      emoji: '📦',
      unit: 'st',
      completed: false,
      isFood: false,
      addedAt: Date.now()
    }

    setShoppingItems(prev => [newShoppingItem, ...prev])
    setNewItem('')
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Markera vara som klar
  const toggleCompleted = (itemId) => {
    const item = shoppingItems.find(item => item.id === itemId)
    
    setShoppingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, completed: !item.completed }
        : item
    ))

    // Om det är en matvara som markeras som klar, lägg direkt i inventariet
    if (item && !item.completed && item.isFood) {
      // Få föreslaget utgångsdatum från matvarudatabasen
      const suggestion = getExpiryDateSuggestion(item.name)
      
      // Skapa ett komplett inventarie-objekt
      const inventoryItem = {
        id: crypto.randomUUID(),
        name: item.name,
        quantity: 1, // Standard kvantitet
        unit: suggestion.defaultUnit,
        expiresAt: suggestion.date,
        category: suggestion.category,
        emoji: suggestion.emoji
      }
      
      // Lägg direkt i inventariet istället för att gå via "Lägg till"-fliken
      if (onDirectAddToInventory) {
        onDirectAddToInventory(inventoryItem)
      }
    }
  }

  // Ta bort vara
  const removeItem = (itemId) => {
    setShoppingItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Rensa alla klara varor
  const clearCompleted = () => {
    setShoppingItems(prev => prev.filter(item => !item.completed))
  }

  const completedCount = shoppingItems.filter(item => item.completed).length
  const totalCount = shoppingItems.length

  return (
    <section className="card shopping-list">
      <div className="section-header">
        <h2>🛒 Inköpslista</h2>
        {totalCount > 0 && (
          <div className="shopping-stats">
            <span className="progress-text">
              {completedCount}/{totalCount} klara
            </span>
            {completedCount > 0 && (
              <button 
                onClick={clearCompleted}
                className="clear-completed-btn"
                title="Rensa alla klara varor"
              >
                🗑️ Rensa klara
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lägg till vara */}
      <form onSubmit={addManualItem} className="add-shopping-item">
        <div className="input-container">
          <div className="input-with-suggestions">
            <input
              type="text"
              value={newItem}
              onChange={handleInputChange}
              placeholder="Skriv varunamn för förslag... (t.ex. 'mjö' för mjölk)"
              className="shopping-input"
              autoComplete="off"
            />
            
            {/* Sökförslag - använder samma styling som matvaruförslagen */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="food-suggestions">
                {suggestions.map(item => (
                  <button
                    key={item.name}
                    type="button"
                    className="food-suggestion"
                    onClick={() => addFromSuggestion(item)}
                  >
                    <span className="suggestion-emoji">{item.emoji}</span>
                    <span className="suggestion-name">{item.name}</span>
                    <span className="suggestion-category">{item.category}</span>
                    {!item.isFood && <span className="non-food-badge">Ej mat</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button type="submit" disabled={!newItem.trim()}>
            ➥ Lägg till
          </button>
        </div>
      </form>

      {/* Lista över varor */}
      {shoppingItems.length === 0 ? (
        <div className="empty-shopping-list">
          <p>🛒 Din inköpslista är tom. Lägg till varor ovan!</p>
        </div>
      ) : (
        <div className="shopping-items">
          {shoppingItems.map(item => (
            <div 
              key={item.id} 
              className={`shopping-item ${item.completed ? 'completed' : ''} ${item.isFood ? 'food-item' : 'non-food-item'}`}
            >
              <div className="item-main">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleCompleted(item.id)}
                  className="shopping-checkbox"
                  id={`shopping-${item.id}`}
                />
                <label htmlFor={`shopping-${item.id}`} className="item-content">
                  <span className="item-emoji">{item.emoji}</span>
                  <span className="item-name">{item.name}</span>
                  {item.isFood && (
                    <span className="food-indicator">🍽️ Matavra → Mina varor</span>
                  )}
                </label>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="remove-shopping-item"
                title="Ta bort från inköpslista"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hjälptext */}
      <div className="shopping-help">
        <p>💡 <strong>Så funkar det:</strong></p>
        <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
          <li><strong>🍽️ Matvaror:</strong> När du bockar av → Läggs direkt i "Mina varor" med smart utgångsdatum</li>
          <li><strong>🧼 Andra varor:</strong> När du bockar av → Stannar i listan (rensa med "🗑️ Rensa klara")</li>
          <li><strong>🔍 Söktips:</strong> Börja skriva för att få förslag på varor från databasen</li>
        </ul>
      </div>
    </section>
  )
}