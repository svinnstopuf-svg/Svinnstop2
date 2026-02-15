import React, { useEffect, useState } from 'react'
import { syncPremiumFromFirebase } from './premiumService'

const PremiumSuccess = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Synka premium från Firebase efter betalning
    const syncPremium = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Vänta på webhook
        await syncPremiumFromFirebase()
        setLoading(false)
      } catch (error) {
        console.error('Failed to sync premium:', error)
        setLoading(false)
      }
    }

    syncPremium()
  }, [])

  const goToApp = () => {
    window.location.href = '/'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '20px',
      color: '#ffffff'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
      }}>
        {loading ? (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
            <h1 style={{ color: '#ffffff', marginBottom: '16px' }}>Aktiverar Premium...</h1>
            <p style={{ color: '#999999' }}>
              Vänligen vänta medan vi aktiverar din premium-prenumeration.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h1 style={{ color: '#ffffff', marginBottom: '16px' }}>Välkommen till Premium!</h1>
            <p style={{ color: '#999999', marginBottom: '24px' }}>
              Tack för ditt stöd! Din prenumeration är nu aktiv och du har full tillgång till alla premium-funktioner.
            </p>
            
            <div style={{
              background: '#0a0a0a',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h3 style={{ color: '#ffffff', marginTop: 0 }}>Vad händer nu?</h3>
              <ul style={{ color: '#ffffff', paddingLeft: '20px' }}>
                <li>✅ Obegränsat antal varor i kylskåpet</li>
                <li>✅ Receptförslag baserat på ditt kylskåp</li>
                <li>✅ Push-notifikationer om utgående varor</li>
                <li>✅ Achievements</li>
                <li>✅ Besparingsstatistik</li>
              </ul>
            </div>

            <button 
              onClick={goToApp}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Börja använda Svinnstop Premium
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PremiumSuccess
