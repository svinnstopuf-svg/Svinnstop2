import React, { useState, useEffect } from 'react'
import { searchShoppingItems } from './shoppingDatabase'
import { getExpiryDateSuggestion } from './foodDatabase'
import { SV_UNITS, getSuggestedUnitKey } from './App'

export default function ShoppingList({ onAddToInventory, onDirectAddToInventory }) {
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

  // Hantera input-ändringar och visa förslag
  const handleInputChange = (e) => {
    const value = e.target.value
    setNewItem(value)
    
    if (value.trim().length > 0) {
      const shoppingSuggestions = searchShoppingItems(value.trim())
      setSuggestions(shoppingSuggestions)
      setShowSuggestions(shoppingSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }
  
  // Lägg till vara från förslag
  const addFromSuggestion = (item) => {
    const unitKey = getSuggestedUnitKey(item.name)
    const unit = SV_UNITS[unitKey] || SV_UNITS.defaultUnit
    
    const newShoppingItem = {
      id: Date.now() + Math.random(), // Mer unik ID
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      unit: unit,
      quantity: 1,
      completed: false,
      isFood: item.isFood || false,
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

    const unitKey = getSuggestedUnitKey(newItem.trim())
    const unit = SV_UNITS[unitKey] || SV_UNITS.defaultUnit

    const newShoppingItem = {
      id: Date.now() + Math.random(),
      name: newItem.trim(),
      category: 'övrigt',
      emoji: '📦',
      unit: unit,
      quantity: 1,
      completed: false,
      isFood: false,
      addedAt: Date.now()
    }

    setShoppingItems(prev => [newShoppingItem, ...prev])
    setNewItem('')
    setShowSuggestions(false)
    setSuggestions([])
  }
  
  // Ta bort vara
  const removeItem = (itemId) => {
    setShoppingItems(prev => prev.filter(item => item.id !== itemId))
  }
  
  // Markera vara som klar/ej klar
  const toggleCompleted = (itemId) => {
    const item = shoppingItems.find(item => item.id === itemId)
    
    setShoppingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, completed: !item.completed }
        : item
    ))
    
    // Om det är en matvara som markeras som klar, lägg direkt i inventariet
    if (item && !item.completed && item.isFood && onDirectAddToInventory) {
      // Få föreslaget utgångsdatum från matvarudatabasen
      const suggestion = getExpiryDateSuggestion(item.name)
      
      // Skapa ett komplett inventarie-objekt
      const inventoryItem = {
        id: Date.now() + Math.random(),
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || suggestion.defaultUnit,
        expiresAt: suggestion.date,
        category: suggestion.category,
        emoji: suggestion.emoji
      }
      
      // Lägg direkt i inventariet
      onDirectAddToInventory(inventoryItem)
    }
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
        <h2>🛍️ Inköpslista</h2>
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
            
            {/* Sökförslag */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="food-suggestions">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--input-bg)'}}>
                  <span style={{fontSize: '11px', fontWeight: 600, color: 'var(--muted)'}}>Förslag:</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowSuggestions(false)
                      setSuggestions([])
                    }}
                    style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--muted)', padding: '0 4px'}}
                    title="Stäng förslag"
                  >
                    ✕
                  </button>
                </div>
                {suggestions.map((item, index) => (
                  <button
                    key={`${item.name}-${item.category}-${index}`}
                    type="button"
                    className="food-suggestion"
                    onClick={() => addFromSuggestion(item)}
                  >
                    <span className="suggestion-name notranslate" translate="no">{item.name}</span>
                    <span className="suggestion-category">{item.category}</span>
                    {!item.isFood && <span className="non-food-badge">Ej mat</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button type="submit" disabled={!newItem.trim()} className="btn-glass">
            ➥ Lägg till
          </button>
        </div>
      </form>

      <div className="shopping-items">
        {shoppingItems.length === 0 ? (
          <div className="empty-shopping-list">
            <p>Din inköpslista är tom</p>
          </div>
        ) : (
          shoppingItems.map(item => (
            <div key={item.id} className={`shopping-item ${item.completed ? 'completed' : ''} ${item.isFood ? 'food-item' : 'non-food-item'}`}>
              <div className="item-main" style={{alignItems: 'center'}}>
                <input
                  type="checkbox"
                  checked={item.completed || false}
                  onChange={() => toggleCompleted(item.id)}
                  className="shopping-checkbox"
                  id={`shopping-${item.id}`}
                />
                <label htmlFor={`shopping-${item.id}`} className="item-content-wrapper" style={{alignItems: 'center'}}>
                  <div className="item-left" style={{alignItems: 'center'}}>
                    <div className="item-info">
                      <span className="item-name notranslate" translate="no" style={{fontSize: '17px', fontWeight: 600}}>{item.name}</span>
                    </div>
                  </div>
                </label>
                <span className="item-quantity-display notranslate" translate="no" style={{fontSize: '13px', fontWeight: 500, alignSelf: 'center'}}>
                  {item.quantity} {item.quantity === 1 && item.unit === 'stycken' ? 'stycke' : item.unit}
                </span>
                <div className="item-actions">
                  <div className="qty-control">
                    <button 
                      className="qty-btn qty-minus"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Use step of 1 for pieces (stycken), 0.5 for other units
                        const step = item.unit === 'stycken' || item.unit === 'st' ? 1 : 0.5
                        const minValue = item.unit === 'stycken' || item.unit === 'st' ? 1 : 0.5
                        const currentQty = Number(item.quantity) || 1
                        const newQuantity = Math.max(minValue, currentQty - step)
                        
                        setShoppingItems(prev => {
                          const updated = prev.map(i => 
                            i.id === item.id ? {...i, quantity: newQuantity} : i
                          )
                          return updated
                        })
                      }}
                      disabled={item.completed || item.quantity <= (item.unit === 'stycken' || item.unit === 'st' ? 1 : 0.5)}
                      title="Minska"
                      aria-label="Minska antal"
                    >
                      −
                    </button>
                    <button 
                      className="qty-btn qty-plus"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Use step of 1 for pieces (stycken), 0.5 for other units
                        const step = item.unit === 'stycken' || item.unit === 'st' ? 1 : 0.5
                        const currentQty = Number(item.quantity) || 1
                        const newQuantity = currentQty + step
                        
                        setShoppingItems(prev => {
                          const updated = prev.map(i => 
                            i.id === item.id ? {...i, quantity: newQuantity} : i
                          )
                          return updated
                        })
                      }}
                      disabled={item.completed}
                      title="Öka"
                      aria-label="Öka antal"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="trash-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItem(item.id)
                    }}
                    title="Ta bort vara"
                    aria-label="Ta bort vara"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Hjälptext */}
      <div className="shopping-help">
        <p>💡 <strong>Så funkar det:</strong></p>
        <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
          <li><strong>🍽️ Matvaror:</strong> När du bockar av → Läggs direkt i "Mina varor" med smart utgångsdatum</li>
          <li><strong>🧯 Andra varor:</strong> När du bockar av → Stannar i listan (rensa med "🗑️ Rensa klara")</li>
          <li><strong>🔍 Söktips:</strong> Börja skriva för att få förslag på varor från databasen</li>
        </ul>
      </div>
    </section>
  )
}
