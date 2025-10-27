import { useState } from 'react'
import './NotificationPrompt.css'

export default function NotificationPrompt({ onPermissionGranted, onDismiss }) {
  const [isRequesting, setIsRequesting] = useState(false)

  const handleEnableNotifications = async () => {
    setIsRequesting(true)
    
    try {
      // Begär tillstånd från användaren
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Spara att användaren har aktiverat notiser
        localStorage.setItem('svinnstop_notifications_prompted', 'granted')
        onPermissionGranted(true)
      } else {
        // Användaren nekade
        localStorage.setItem('svinnstop_notifications_prompted', 'denied')
        onPermissionGranted(false)
      }
    } catch (error) {
      console.error('Fel vid aktivering av notiser:', error)
      localStorage.setItem('svinnstop_notifications_prompted', 'error')
      onPermissionGranted(false)
    }
    
    setIsRequesting(false)
  }

  const handleDismiss = () => {
    // Spara att användaren stängde prompten (kan fråga igen senare)
    localStorage.setItem('svinnstop_notifications_prompted', 'dismissed')
    onDismiss()
  }

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt-container">
        <div className="notification-prompt-icon">🔔</div>
        
        <h2 className="notification-prompt-title">
          Missa aldrig när mat går ut!
        </h2>
        
        <p className="notification-prompt-description">
          Få smarta påminnelser innan din mat går ut och spara tusentals kronor varje år. 
          Vi skickar dagliga sammanfattningar och urgenta varningar.
        </p>
        
        <div className="notification-prompt-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">💰</span>
            <span className="benefit-text">Spara pengar</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">⏰</span>
            <span className="benefit-text">Perfekt timing</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎯</span>
            <span className="benefit-text">Aldrig mer svinn</span>
          </div>
        </div>
        
        <div className="notification-prompt-actions">
          <button 
            className="notification-enable-btn"
            onClick={handleEnableNotifications}
            disabled={isRequesting}
          >
            {isRequesting ? 'Aktiverar...' : '🔔 Aktivera notiser'}
          </button>
          
          <button 
            className="notification-dismiss-btn"
            onClick={handleDismiss}
            disabled={isRequesting}
          >
            Kanske senare
          </button>
        </div>
        
        <p className="notification-prompt-note">
          💡 Du kan alltid ändra detta i inställningar
        </p>
      </div>
    </div>
  )
}
