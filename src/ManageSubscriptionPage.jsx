import React, { useEffect, useState } from 'react'
import { auth, database } from './firebaseConfig'
import { ref, get } from 'firebase/database'
import { premiumService } from './premiumService'
import { useToast } from './components/ToastContainer'
import Spinner from './components/Spinner'
import { Star } from 'lucide-react'

export default function ManageSubscriptionPage({ onBack, onShowUpgrade }) {
  const [premiumStatus, setPremiumStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchPremiumData = async () => {
      if (!auth.currentUser) {
        setLoading(false)
        return
      }

      try {
        const premiumRef = ref(database, `users/${auth.currentUser.uid}/premium`)
        const snapshot = await get(premiumRef)
        setPremiumStatus(snapshot.val() || {})
      } catch (err) {
        console.error('Failed to fetch premium data:', err)
        toast.error('Kunde inte hämta prenumerationsdata')
      } finally {
        setLoading(false)
      }
    }

    fetchPremiumData()
  }, [])

  if (loading) {
    return (
      <div className="tab-panel">
        <section className="card">
          <div className="card-header">
            <button 
              className="btn-secondary"
              onClick={onBack}
              style={{marginBottom: '16px'}}
            >
              ← Tillbaka till Profil
            </button>
            <h2>Hantera Prenumeration</h2>
          </div>
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spinner />
            <p>Laddar...</p>
          </div>
        </section>
      </div>
    )
  }

  const hasIndividualPremium = premiumStatus.premiumType === 'individual'

  return (
    <div className="tab-panel">
      <section className="card">
        <div className="card-header">
          <button 
            className="btn-secondary"
            onClick={onBack}
            style={{marginBottom: '16px'}}
          >
            ← Tillbaka till Profil
          </button>
          <h2>Hantera Prenumeration</h2>
          <p className="card-subtitle">Hantera din Stripe-prenumeration</p>
        </div>
        
        <div style={{ padding: '16px' }}>
          {/* Premium Status */}
          <div style={{
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Din prenumeration</h3>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Plan:</strong> {premiumStatus.premiumType === 'individual' ? 'Individual Premium' : 'Family Premium'}
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Pris:</strong> {premiumStatus.premiumType === 'individual' ? '29' : '49'} kr/månad
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {premiumService.getDaysLeftOfPremium()} dagar kvar
            </p>
          </div>
          
          {/* Uppgradera till Family (endast Individual) */}
          {hasIndividualPremium && (
            <div style={{
              padding: '16px',
              marginBottom: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid var(--primary-color)'
            }}>
              <h3 style={{ marginBottom: '8px', fontSize: '16px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} /> Uppgradera till Family Premium
              </h3>
              <p style={{ margin: '8px 0 12px', fontSize: '14px' }}>
                Dela premium med upp till 5 familjemedlemmar. Din nuvarande prenumeration ersätts.
              </p>
              <button
                className="btn-primary"
                onClick={onShowUpgrade}
                style={{ width: '100%' }}
              >
                Uppgradera till Family (49 kr/mån)
              </button>
            </div>
          )}
          
          {/* Öppna Stripe Customer Portal */}
          <div style={{
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Hantera betalning</h3>
            <p style={{ margin: '8px 0 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Avsluta prenumeration, ändra betalmetod eller se dina fakturor via Stripe.
            </p>
            <button
              className="btn-secondary"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const btn = e.currentTarget
                const originalText = btn.textContent
                btn.disabled = true
                btn.textContent = 'Laddar...'
                console.log('Opening portal for user:', auth.currentUser?.uid)
                try {
                  const response = await fetch('https://us-central1-svinnstop.cloudfunctions.net/createPortalSession', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: auth.currentUser.uid })
                  })
                  console.log('Portal response status:', response.status)
                  if (!response.ok) {
                    const errorData = await response.json()
                    console.error('Portal error:', errorData)
                    throw new Error(errorData.error || 'Kunde inte öppna prenumerationshantering')
                  }
                  const data = await response.json()
                  console.log('Portal URL:', data.url)
                  
                  // Öppna i samma flik på mobil, ny flik på desktop
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                  if (isMobile) {
                    window.location.href = data.url
                  } else {
                    const opened = window.open(data.url, '_blank')
                    if (!opened) {
                      console.error('Popup blocked, trying location.href')
                      window.location.href = data.url
                    }
                  }
                  toast.success('Öppnar prenumerationshantering...')
                } catch (err) {
                  console.error('Portal error:', err)
                  toast.error(err.message || 'Ett fel uppstod. Försök igen.')
                  btn.disabled = false
                  btn.textContent = originalText
                }
              }}
              style={{ width: '100%' }}
            >
              Öppna Stripe Customer Portal
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
