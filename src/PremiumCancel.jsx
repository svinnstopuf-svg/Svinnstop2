import React from 'react'

const PremiumCancel = () => {
  const goToApp = () => {
    window.location.href = '/'
  }

  const tryAgain = () => {
    window.location.href = '/?upgrade=true'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>😔</div>
        <h1 style={{ color: 'var(--text)', marginBottom: '16px' }}>Betalningen avbröts</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Din betalning genomfördes inte. Inget har debiterats från ditt konto.
        </p>
        
        <div style={{
          background: 'var(--bg)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: 'var(--text)', marginTop: 0 }}>Varför uppgradera?</h3>
          <ul style={{ color: 'var(--text)', paddingLeft: '20px' }}>
            <li>💰 Spara i genomsnitt 847 kr/mån</li>
            <li>🌍 Minska matsvinnet med ~12 kg/mån</li>
            <li>🍳 Smarta receptförslag från ditt kylskåp</li>
            <li>✨ Obegränsat antal varor</li>
            <li>🔔 Push-notifikationer</li>
            <li>📊 Besparingsstatistik</li>
          </ul>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '16px' }}>
            <strong>Eller</strong> - Bjud in 1 vän och få 7 dagar Premium gratis!
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexDirection: 'column'
        }}>
          <button 
            onClick={tryAgain}
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
            Försök igen
          </button>

          <button 
            onClick={goToApp}
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Tillbaka till appen
          </button>
        </div>
      </div>
    </div>
  )
}

export default PremiumCancel
