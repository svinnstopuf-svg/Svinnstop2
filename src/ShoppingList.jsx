import React, { useState, useEffect } from 'react'
import { searchShoppingItems } from './shoppingDatabase'
import { getExpiryDateSuggestion } from './foodDatabase'
import { SV_UNITS, getSuggestedUnitKey } from './App'
import { increaseQuantity, decreaseQuantity, smartConvertUnit } from './unitConverter'
import { shoppingListService } from './shoppingListService'
import { syncShoppingListToFirebase, listenToShoppingListChanges, syncSavedListsToFirebase, listenToSavedListsChanges, syncUserItemsToFirebase, listenToUserItemsChanges } from './shoppingListSync'
import { getFamilyData } from './familyService'
import { userItemsService, searchUserItems } from './userItemsService'
import { sortShoppingItems } from './sortingUtils'

export default function ShoppingList({ onAddToInventory, onDirectAddToInventory }) {
  const [shoppingItems, setShoppingItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [savedLists, setSavedLists] = useState([])
  const [showSavedLists, setShowSavedLists] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveListName, setSaveListName] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [editingQuantity, setEditingQuantity] = useState(null) // ID för vara som redigeras
  const [tempQuantity, setTempQuantity] = useState('') // Temporärt värde under redigering
  const [showFoodTypeDialog, setShowFoodTypeDialog] = useState(false)
  const [pendingManualItem, setPendingManualItem] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState('st')
  
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
    // Ladda sparade listor
    setSavedLists(shoppingListService.getSavedShoppingLists())
  }, [])

  // Spara inköpslista till localStorage och synka med Firebase
  useEffect(() => {
    localStorage.setItem('svinnstop_shopping_list', JSON.stringify(shoppingItems))
    
    // Synka till Firebase om familj är aktiv
    const family = getFamilyData()
    if (family.familyId && family.syncEnabled) {
      syncShoppingListToFirebase(shoppingItems)
    }
  }, [shoppingItems])

  // Lyssna på Firebase-ändringar för inköpslistan
  useEffect(() => {
    const family = getFamilyData()
    if (!family.familyId || !family.syncEnabled) return

    const unsubscribe = listenToShoppingListChanges((remoteItems) => {
      // Undvik loopar genom att jämföra innehåll
      const localStr = JSON.stringify(shoppingItems)
      const remoteStr = JSON.stringify(remoteItems)
      if (localStr !== remoteStr) {
        setShoppingItems(remoteItems)
        setIsSyncing(true)
        setTimeout(() => setIsSyncing(false), 1000)
      }
    })

    return () => unsubscribe && unsubscribe()
  }, [])

  // Lyssna på Firebase-ändringar för sparade listor
  useEffect(() => {
    const family = getFamilyData()
    if (!family.familyId || !family.syncEnabled) return

    const unsubscribe = listenToSavedListsChanges((remoteLists) => {
      setSavedLists(remoteLists)
      // Uppdatera localStorage
      localStorage.setItem('svinnstop_saved_shopping_lists', JSON.stringify(remoteLists))
    })

    return () => unsubscribe && unsubscribe()
  }, [])

  // Lyssna på Firebase-ändringar för användarvaror
  useEffect(() => {
    const family = getFamilyData()
    if (!family.familyId || !family.syncEnabled) return

    const unsubscribe = listenToUserItemsChanges((remoteItems) => {
      userItemsService.importUserItems(remoteItems)
    })

    return () => unsubscribe && unsubscribe()
  }, [])

  // Hantera input-ändringar och visa förslag
  const handleInputChange = (e) => {
    const value = e.target.value
    setNewItem(value)
    
    if (value.trim().length > 0) {
      // Sök både i standarddatabasen OCH användarvaror
      const shoppingSuggestions = searchShoppingItems(value.trim())
      const userSuggestions = searchUserItems(value.trim())
      
      // Merga resultat, användarvaror först (de är mer relevanta)
      const allSuggestions = [...userSuggestions, ...shoppingSuggestions].slice(0, 10)
      
      setSuggestions(allSuggestions)
      setShowSuggestions(allSuggestions.length > 0)
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

    // Spara pending item och visa dialog
    setPendingManualItem({
      name: newItem.trim(),
      unit: unit
    })
    setSelectedUnit(unit) // Sätt förvald enhet
    setShowFoodTypeDialog(true)
  }

  // Bekräfta och lägg till manuell vara
  const confirmManualItem = (isFood) => {
    if (!pendingManualItem) return

    const finalUnit = selectedUnit || pendingManualItem.unit

    const newShoppingItem = {
      id: Date.now() + Math.random(),
      name: pendingManualItem.name,
      category: isFood ? 'mat' : 'övrigt',
      emoji: isFood ? '🍽️' : '📦',
      unit: finalUnit,
      quantity: 1,
      completed: false,
      isFood: isFood,
      addedAt: Date.now()
    }

    // Spara i användarvaror för självlärning
    const userItemData = {
      name: pendingManualItem.name,
      category: isFood ? 'mat' : 'övrigt',
      emoji: isFood ? '🍽️' : '📦',
      unit: finalUnit,
      isFood: isFood
    }
    
    const result = userItemsService.addUserItem(userItemData)
    
    // Synka till Firebase
    if (result.success) {
      const family = getFamilyData()
      if (family.familyId && family.syncEnabled) {
        syncUserItemsToFirebase(result.items)
      }
    }

    setShoppingItems(prev => [newShoppingItem, ...prev])
    setNewItem('')
    setShowSuggestions(false)
    setSuggestions([])
    setShowFoodTypeDialog(false)
    setPendingManualItem(null)
  }
  
  // Ta bort vara
  const removeItem = (itemId) => {
    setShoppingItems(prev => prev.filter(item => item.id !== itemId))
  }
  
  // Markera vara som klar/ej klar
  const toggleCompleted = (itemId) => {
    setShoppingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, completed: !item.completed }
        : item
    ))
    // Viktigt: Vi lägger INTE längre till matvaror i inventariet här.
    // Detta sker först när användaren klickar på "Rensa klara".
  }
  
  // Rensa alla klara varor OCH registrera matvaror som inköpta
  const clearCompleted = () => {
    // Först: lägg till alla KLARA matvaror i inventariet (endast en gång)
    if (onDirectAddToInventory) {
      shoppingItems
        .filter(item => item.completed && item.isFood)
        .forEach(item => {
          const suggestion = getExpiryDateSuggestion(item.name)
          const inventoryItem = {
            id: Date.now() + Math.random(),
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || suggestion.defaultUnit,
            expiresAt: suggestion.date,
            category: suggestion.category,
            emoji: suggestion.emoji
          }
          onDirectAddToInventory(inventoryItem)
        })
    }

    // Sedan: ta bort alla klara varor från inköpslistan
    setShoppingItems(prev => prev.filter(item => !item.completed))
  }

  // Spara nuvarande lista som mall
  const handleSaveList = () => {
    if (!saveListName.trim()) {
      alert('⚠️ Ange ett namn för listan')
      return
    }
    
    if (shoppingItems.length === 0) {
      alert('⚠️ Listan är tom. Lägg till varor först.')
      return
    }
    
    const result = shoppingListService.saveShoppingList(saveListName, shoppingItems)
    
    if (result.success) {
      setSavedLists(shoppingListService.getSavedShoppingLists())
      setSaveListName('')
      setShowSaveDialog(false)
      
      // Synka till Firebase
      const family = getFamilyData()
      if (family.familyId && family.syncEnabled) {
        syncSavedListsToFirebase(shoppingListService.getSavedShoppingLists())
      }
      
      alert(`✅ Lista "${result.list.name}" ${result.isUpdate ? 'uppdaterad' : 'sparad'}!`)
    } else {
      alert(`❌ ${result.error}`)
    }
  }

  // Ladda en sparad lista
  const handleLoadList = (listId) => {
    const list = shoppingListService.getSavedListById(listId)
    if (!list) {
      alert('❌ Lista hittades inte')
      return
    }
    
    // Lägg till varor från mallen med nya ID:n
    const newItems = list.items.map(item => ({
      ...item,
      id: Date.now() + Math.random(),
      completed: false,
      addedAt: Date.now()
    }))
    
    setShoppingItems(prev => [...newItems, ...prev])
    shoppingListService.incrementUsageCount(listId)
    setSavedLists(shoppingListService.getSavedShoppingLists())
    setShowSavedLists(false)
    
    // Synka till Firebase
    const family = getFamilyData()
    if (family.familyId && family.syncEnabled) {
      syncSavedListsToFirebase(shoppingListService.getSavedShoppingLists())
    }
  }

  // Ta bort sparad lista
  const handleDeleteSavedList = (listId, listName) => {
    if (!confirm(`🗑️ Ta bort sparad lista "${listName}"?`)) {
      return
    }
    
    const result = shoppingListService.deleteSavedList(listId)
    
    if (result.success) {
      setSavedLists(shoppingListService.getSavedShoppingLists())
      
      // Synka till Firebase
      const family = getFamilyData()
      if (family.familyId && family.syncEnabled) {
        syncSavedListsToFirebase(shoppingListService.getSavedShoppingLists())
      }
    } else {
      alert(`❌ ${result.error}`)
    }
  }

  // Börja redigera kvantitet
  const startEditingQuantity = (itemId, currentQuantity) => {
    setEditingQuantity(itemId)
    setTempQuantity(String(currentQuantity))
  }

  // Spara redigerad kvantitet
  const saveQuantityEdit = (itemId, item) => {
    const parsed = parseFloat(tempQuantity)
    
    if (isNaN(parsed) || parsed <= 0) {
      // Ogiltig input - återställ
      setEditingQuantity(null)
      setTempQuantity('')
      return
    }
    
    // Max-gräns baserat på enhet (rimliga värden)
    const unitLower = item.unit.toLowerCase()
    let maxValue = 999 // Default max
    
    if (unitLower === 'kg') {
      maxValue = 100 // Max 100 kg
    } else if (unitLower === 'g' || unitLower === 'gram') {
      maxValue = 10000 // Max 10 kg i gram
    } else if (unitLower === 'hg') {
      maxValue = 100 // Max 10 kg i hg
    } else if (unitLower === 'l' || unitLower === 'liter') {
      maxValue = 50 // Max 50 liter
    } else if (unitLower === 'ml' || unitLower === 'milliliter') {
      maxValue = 10000 // Max 10 liter i ml
    } else if (unitLower === 'dl' || unitLower === 'deciliter') {
      maxValue = 100 // Max 10 liter i dl
    } else if (unitLower === 'cl' || unitLower === 'centiliter') {
      maxValue = 500 // Max 5 liter i cl
    } else if (unitLower === 'stycken' || unitLower === 'st' || unitLower === 'styck') {
      maxValue = 100 // Max 100 stycken
    }
    
    if (parsed > maxValue) {
      alert(`⚠️ Max ${maxValue} ${item.unit} tillåtet. Försök med ett lägre värde.`)
      setEditingQuantity(null)
      setTempQuantity('')
      return
    }
    
    // Använd smart konvertering för det nya värdet
    const { quantity: newQuantity, unit: newUnit } = smartConvertUnit(parsed, item.unit)
    
    setShoppingItems(prev => prev.map(i => 
      i.id === itemId ? {...i, quantity: newQuantity, unit: newUnit} : i
    ))
    
    setEditingQuantity(null)
    setTempQuantity('')
  }

  // Avbryt redigering
  const cancelQuantityEdit = () => {
    setEditingQuantity(null)
    setTempQuantity('')
  }

  const completedCount = shoppingItems.filter(item => item.completed).length
  const totalCount = shoppingItems.length
  
  return (
    <section className="card shopping-list">
      <div className="section-header">
        <h2>🛍️ Inköpslista {isSyncing && <span style={{fontSize: '12px', color: 'var(--accent)'}}>↻ Synkar...</span>}</h2>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap'}}>
          {totalCount > 0 && (
            <>
              <span className="progress-text">
                {completedCount}/{totalCount} klara
              </span>
              {completedCount > 0 && (
                <button 
                  onClick={clearCompleted}
                  className="clear-completed-btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: '2px solid #059669',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s',
                    animation: completedCount >= totalCount / 2 ? 'pulse 2s infinite' : 'none'
                  }}
                  title="Klicka för att flytta matvaror till kylskåpet och rensa listan"
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  ✅ Rensa klara ({completedCount})
                </button>
              )}
              <button
                onClick={() => setShowSaveDialog(true)}
                className="btn-glass"
                style={{padding: '6px 12px', fontSize: '13px'}}
                title="Spara aktuell lista som mall"
              >
                💾 Spara lista
              </button>
            </>
          )}
          {savedLists.length > 0 && (
            <button
              onClick={() => setShowSavedLists(!showSavedLists)}
              className="btn-glass"
              style={{padding: '6px 12px', fontSize: '13px'}}
              title="Ladda sparad lista"
            >
              📁 Mina listor ({savedLists.length})
            </button>
          )}
        </div>
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

      {/* Dialog för matvara-typ och enhet */}
      {showFoodTypeDialog && pendingManualItem && (
        <div style={{marginBottom: '16px', padding: '20px', background: 'var(--card-bg)', border: '2px solid var(--accent)', borderRadius: '12px'}}>
          <h3 style={{margin: '0 0 8px 0', fontSize: '18px', textAlign: 'center'}}>🎯 Lägg till: "{pendingManualItem.name}"</h3>
          <p style={{margin: '0 0 20px 0', fontSize: '13px', color: 'var(--muted)', textAlign: 'center'}}>Hjälp appen att lära sig nya varor!</p>
          
          {/* Enhetsval */}
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px'}}>Enhet:</label>
            <select 
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px'}}
            >
              <option value="st">Stycken (st)</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="hg">Hektogram (hg)</option>
              <option value="g">Gram (g)</option>
              <option value="L">Liter (L)</option>
              <option value="dl">Deciliter (dl)</option>
              <option value="cl">Centiliter (cl)</option>
              <option value="ml">Milliliter (ml)</option>
            </select>
          </div>

          {/* Matvara-val */}
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px'}}>Är detta en matvara?</label>
            <p style={{fontSize: '12px', color: 'var(--muted)', marginBottom: '12px'}}>Om det är mat läggs den i kylskåpet när du bockat av den.</p>
            <div style={{display: 'flex', gap: '12px'}}>
              <button 
                onClick={() => confirmManualItem(true)}
                className="btn-glass"
                style={{flex: 1, padding: '12px', fontSize: '15px', background: 'var(--success)', border: '2px solid var(--success)'}}
              >
                🍽️ Ja, matvara
              </button>
              <button 
                onClick={() => confirmManualItem(false)}
                className="btn-glass"
                style={{flex: 1, padding: '12px', fontSize: '15px'}}
              >
                📦 Nej, annat
              </button>
            </div>
          </div>

          <button 
            onClick={() => { setShowFoodTypeDialog(false); setPendingManualItem(null) }}
            style={{width: '100%', marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--muted)', textDecoration: 'underline'}}
          >
            Avbryt
          </button>
        </div>
      )}

      {/* Dialog för att spara lista */}
      {showSaveDialog && (
        <div style={{marginBottom: '16px', padding: '16px', background: 'var(--card-bg)', border: '2px solid var(--accent)', borderRadius: '12px'}}>
          <h3 style={{margin: '0 0 12px 0', fontSize: '16px'}}>💾 Spara inköpslista</h3>
          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <input
              type="text"
              value={saveListName}
              onChange={(e) => setSaveListName(e.target.value)}
              placeholder="Namn på lista (t.ex. Veckohhandling)"
              style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)'}}
              autoFocus
            />
            <button onClick={handleSaveList} className="btn-glass" style={{padding: '10px 16px'}}>
              ✅ Spara
            </button>
            <button onClick={() => { setShowSaveDialog(false); setSaveListName('') }} className="btn-glass" style={{padding: '10px 16px'}}>
              ❌ Avbryt
            </button>
          </div>
          <p style={{margin: '8px 0 0 0', fontSize: '12px', color: 'var(--muted)'}}>Tips: Om namnet redan finns kommer listan att uppdateras.</p>
        </div>
      )}

      {/* Sparade listor */}
      {showSavedLists && savedLists.length > 0 && (
        <div style={{marginBottom: '16px', padding: '16px', background: 'var(--card-bg)', border: '2px solid var(--border)', borderRadius: '12px'}}>
          <h3 style={{margin: '0 0 12px 0', fontSize: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            📁 Mina sparade listor
            <button onClick={() => setShowSavedLists(false)} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--muted)'}}>✕</button>
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {savedLists.map(list => (
              <div key={list.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--input-bg)', borderRadius: '8px'}}>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 600, fontSize: '14px'}}>{list.name}</div>
                  <div style={{fontSize: '12px', color: 'var(--muted)', marginTop: '4px'}}>
                    {list.items.length} varor
                    {list.usageCount > 0 && ` • Använd ${list.usageCount} gång${list.usageCount > 1 ? 'er' : ''}`}
                  </div>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button 
                    onClick={() => handleLoadList(list.id)}
                    className="btn-glass"
                    style={{padding: '8px 12px', fontSize: '13px'}}
                  >
                    ✅ Använd
                  </button>
                  <button 
                    onClick={() => handleDeleteSavedList(list.id, list.name)}
                    className="trash-btn"
                    style={{padding: '8px 12px', fontSize: '16px'}}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="shopping-items">
        {shoppingItems.length === 0 ? (
          <div className="empty-shopping-list">
            <p>Din inköpslista är tom</p>
          </div>
        ) : (
          sortShoppingItems(shoppingItems).map(item => (
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
                {editingQuantity === item.id ? (
                  <div style={{display: 'flex', gap: '4px', alignItems: 'center', alignSelf: 'center'}}>
                    <input
                      type="number"
                      value={tempQuantity}
                      onChange={(e) => setTempQuantity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveQuantityEdit(item.id, item)
                        } else if (e.key === 'Escape') {
                          cancelQuantityEdit()
                        }
                      }}
                      onBlur={() => saveQuantityEdit(item.id, item)}
                      autoFocus
                      min="0.1"
                      step="0.1"
                      style={{
                        width: '60px',
                        padding: '4px 8px',
                        fontSize: '13px',
                        border: '2px solid var(--accent)',
                        borderRadius: '6px',
                        background: 'var(--input-bg)',
                        color: 'var(--text)',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{fontSize: '12px', color: 'var(--muted)'}}>
                      {item.unit}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!item.completed) {
                        startEditingQuantity(item.id, item.quantity)
                      }
                    }}
                    disabled={item.completed}
                    className="item-quantity-display notranslate"
                    translate="no"
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      alignSelf: 'center',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: item.completed ? 'transparent' : 'var(--input-bg)',
                      cursor: item.completed ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      ':hover': {
                        background: 'var(--accent)'
                      }
                    }}
                    title={item.completed ? '' : 'Klicka för att ändra mängd'}
                  >
                    {item.quantity} {item.quantity === 1 && item.unit === 'stycken' ? 'stycke' : item.unit}
                  </button>
                )}
                <div className="item-actions">
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
          <li><strong>🍽️ Matvaror:</strong> När du bockar av → Markeras som klara. <em>Först när du klickar på "🗑️ Rensa klara"</em> läggs de i "Mina varor" med smart utgångsdatum.</li>
          <li><strong>🧯 Andra varor:</strong> När du bockar av → Stannar i listan tills du klickar på "🗑️ Rensa klara"</li>
          <li><strong>🔍 Söktips:</strong> Börja skriva för att få förslag på varor från databasen</li>
          <li><strong>👆 Ändra mängd:</strong> Klicka på kvantiteten (t.ex. "5 kg") för att redigera den direkt!</li>
          <li><strong>💾 Spara listor:</strong> Skapar du samma inköpslista varje vecka? Spara den som mall och ladda nästa gång!</li>
          <li><strong>⚖️ Smart mått:</strong> Siffror konverteras automatiskt (t.ex. 1000g → 1kg) för bättre användbarhet</li>
          <li><strong>🔄 Synkronisering:</strong> Är du med i en familjegrupp? Inköpslistor synkas automatiskt mellan alla medlemmar!</li>
        </ul>
      </div>
    </section>
  )
}
