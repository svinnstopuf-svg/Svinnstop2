import React from 'react'
import './ConfirmDialog.css'

/**
 * Anpassad bekräftelsedialog med Ja/Nej knappar
 * Stödjer klick utanför för att avbryta
 */
export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  onDismiss  // Nytt: för att stänga utan att göra något
}) {
  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    // Klicka utanför dialogen för att avbryta helt (ingen förändring)
    if (e.target === e.currentTarget) {
      if (onDismiss) {
        onDismiss()
      } else {
        onCancel()
      }
    }
  }

  return (
    <div className="confirm-dialog-backdrop" onClick={handleBackdropClick}>
      <div className="confirm-dialog-box">
        {title && <h3 className="confirm-dialog-title notranslate">{title}</h3>}
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-buttons">
          <button 
            className="confirm-dialog-btn confirm-yes notranslate" 
            onClick={onConfirm}
          >
            Ja
          </button>
          <button 
            className="confirm-dialog-btn confirm-no notranslate" 
            onClick={onCancel}
          >
            Nej
          </button>
        </div>
      </div>
    </div>
  )
}
