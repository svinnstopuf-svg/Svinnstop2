import React, { useState } from 'react'
import { setCustomExpiryRule } from './userItemsService'

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
    
    // TYST AUTO-LEARNING: Spara automatiskt som custom regel om datumet ändrades
    if (item.expiresAt !== newDate) {
      // Räkna kalenderdagar: 27 dec - 13 dec = 14 dagar (oavsett tid på dygnet)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [year, month, day] = newDate.split('-').map(Number)
      const newDateObj = new Date(year, month - 1, day)
      newDateObj.setHours(0, 0, 0, 0)
      const daysFromToday = Math.round((newDateObj - today) / (1000 * 60 * 60 * 24))
      
      // Spara automatiskt som custom regel (tyst, ingen UI)
      setCustomExpiryRule(item.name, daysFromToday)
      console.log(`🧠 Appen lärde sig: ${item.name} = ${daysFromToday} dagar`)
    }
    
    // Uppdatera varan
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
    // Använd lokal tid för att undvika UTC-problem
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    setNewDate(`${year}-${month}-${day}`)
  }

  return (
    <>
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
    </>
  )
}

export default ExpirySettings