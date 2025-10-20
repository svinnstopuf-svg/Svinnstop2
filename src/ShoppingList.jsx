import React, { useState, useEffect } from 'react'
import { searchFoods } from './foodDatabase'

// Kategorisering av matvaror vs andra varor
const FOOD_CATEGORIES = ['mejeri', 'kött', 'fisk', 'grönsak', 'frukt', 'bröd', 'spannmål', 'ägg', 'krydda', 'sås', 'olja']

function isFood(item) {
  if (!item.category) return false
  return FOOD_CATEGORIES.includes(item.category)
}

export default function ShoppingList({ onAddToInventory }) {
  const [shoppingItems, setShoppingItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Ladda inköpslista från localStorage
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
      const foodSuggestions = searchFoods(value.trim())
      setSuggestions(foodSuggestions)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // Lägg till vara från förslag
  const addFromSuggestion = (food) => {
    const newShoppingItem = {
      id: crypto.randomUUID(),
      name: food.name,
      category: food.category,
      emoji: food.emoji,
      unit: food.unit,
      completed: false,
      isFood: true,
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

    // Om det är en matvara som markeras som klar, skicka till inventarie
    if (item && !item.completed && item.isFood) {
      onAddToInventory({
        name: item.name,
        category: item.category,
        emoji: item.emoji,
        unit: item.unit
      })
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
          <input
            type="text"
            value={newItem}
            onChange={handleInputChange}
            placeholder="Lägg till vara i inköpslistan..."
            className="shopping-input"
            autoComplete="off"
          />
          <button type="submit" disabled={!newItem.trim()}>
            ➕ Lägg till
          </button>
        </div>

        {/* Förslag */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map(food => (
              <button
                key={food.name}
                type="button"
                className="suggestion-item"
                onClick={() => addFromSuggestion(food)}
              >
                <span className="suggestion-emoji">{food.emoji}</span>
                <span className="suggestion-name">{food.name}</span>
                <span className="suggestion-category">{food.category}</span>
              </button>
            ))}
          </div>
        )}
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
                    <span className="food-indicator">🍽️ Matavra</span>
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
        <p>💡 <strong>Tips:</strong> Matvaror som markeras som klara flyttas automatiskt till "Lägg till vara" för att ange utgångsdatum.</p>
      </div>
    </section>
  )
}