import React, { useEffect, useState } from 'react'
import { calculateSmartExpiryDate } from './smartExpiryAI'
import { getExpiryDateSuggestion } from './foodDatabase'
import './smartSuggestion.css'

export default function SmartSuggestionWidget({ itemName, onApplySuggestion }) {
  const [suggestion, setSuggestion] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!itemName || itemName.trim().length < 2) {
      setShow(false)
      return
    }

    const timer = setTimeout(() => {
      try {
        const smartResult = calculateSmartExpiryDate(itemName, null)
        const dbSuggestion = getExpiryDateSuggestion(itemName)
        
        setSuggestion({
          date: smartResult.date,
          confidence: smartResult.confidence,
          method: smartResult.method,
          adjustments: smartResult.adjustments,
          baseDays: smartResult.baseDays,
          emoji: dbSuggestion.emoji,
          category: dbSuggestion.category
        })
        
        setShow(true)
      } catch (error) {
        console.error('Fel vid beräkning av förslag:', error)
        setShow(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [itemName])

  if (!show || !suggestion) return null

  const confidenceColor = 
    suggestion.confidence >= 80 ? 'high' :
    suggestion.confidence >= 60 ? 'medium' : 'low'

  return (
    <div className="smart-suggestion-widget">
      <div className="widget-pulse"></div>
      
      <div className="widget-content">
        <div className="widget-emoji">{suggestion.emoji}</div>
        
        <div className="widget-text">
          <div className="widget-title">
            🤖 Smart förslag
            {suggestion.adjustments > 0 && (
              <span className="learned-pill">📚 Inlärt</span>
            )}
          </div>
          
          <div className="widget-suggestion">
            Utgår om <strong>{suggestion.baseDays} dagar</strong> ({suggestion.date})
          </div>
          
          <div className={`widget-confidence ${confidenceColor}`}>
            {suggestion.confidence >= 80 ? '✅ Mycket säker' :
             suggestion.confidence >= 60 ? '👍 Ganska säker' : '🤔 Osäker'}
          </div>
        </div>
      </div>

      <button 
        className="widget-apply-btn"
        onClick={() => {
          onApplySuggestion({
            expiresAt: suggestion.date,
            quantity: 1
          })
        }}
      >
        ✨ Använd
      </button>

      <button 
        className="widget-dismiss"
        onClick={() => setShow(false)}
      >
        ×
      </button>
    </div>
  )
}
