import React, { useState } from 'react'

// Komponent för att låta användare justera AI-beräknade utgångsdatum
const ExpirySettings = ({ item, onUpdate, onClose }) => {
  const [newDate, setNewDate] = useState(item.expiresAt || '')
  const [reason, setReason] = useState('')

  const handleSave = () => {
    if (!newDate) return
    
    const updatedItem = {
      ...item,
      expiresAt: newDate,
      manuallyAdjusted: true,
      adjustmentReason: reason
    }
    
    console.log(`📝 Manuell justering av ${item.name}: ${item.expiresAt} → ${newDate}`)
    if (reason) console.log(`💭 Anledning: ${reason}`)
    
    onUpdate(updatedItem)
    onClose()
  }

  const suggestDates = [
    { label: 'Idag', days: 0 },
    { label: 'Imorgon', days: 1 },
    { label: '3 dagar', days: 3 },
    { label: '1 vecka', days: 7 },
    { label: '2 veckor', days: 14 },
    { label: '1 månad', days: 30 }
  ]

  const setQuickDate = (days) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setNewDate(date.toISOString().split('T')[0])
  }

  return (
    <div className="expiry-settings-overlay">
      <div className="expiry-settings-modal">
        <div className="settings-header">
          <h3>📅 Justera utgångsdatum</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="settings-content">
          <div className="product-info">
            <h4>{item.name}</h4>
            <p>
              <span className="current-category">{item.category || '❓ Okänd'}</span>
              <br />
              <span className="current-date">Nuvarande: {item.expiresAt}</span>
            </p>
          </div>
          
          <div className="quick-dates">
            <label>Snabbval:</label>
            <div className="quick-buttons">
              {suggestDates.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setQuickDate(days)}
                  className="quick-date-btn"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="manual-date">
            <label htmlFor="manual-date-input">Eller välj exakt datum:</label>
            <input
              id="manual-date-input"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="reason-input">
            <label htmlFor="reason-input">Anledning (valfritt):</label>
            <input
              id="reason-input"
              type="text"
              placeholder="T.ex. 'Öppnad förpackning', 'Fryst tidigare'..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          
          <div className="settings-actions">
            <button onClick={onClose} className="cancel-btn">
              Avbryt
            </button>
            <button 
              onClick={handleSave} 
              className="save-btn"
              disabled={!newDate}
            >
              💾 Spara
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpirySettings