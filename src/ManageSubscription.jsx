import React, { useState } from 'react'
import { auth } from './firebaseConfig'
import { CreditCard, ExternalLink, Loader } from 'lucide-react'
import { useToast } from './components/ToastContainer'

export default function ManageSubscription({ premiumData }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Du måste vara inloggad')
      }

      // Skapa Stripe Checkout session för Family Premium
      const response = await fetch('https://us-central1-svinnstop.cloudfunctions.net/createCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email || '',
          premiumType: 'family'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kunde inte öppna betalning')
      }

      const data = await response.json()
      console.log('Checkout URL:', data.url)
      
      // Öppna Stripe Checkout
      window.location.href = data.url
      
      toast.success('Öppnar betalning...')
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error(err.message || 'Ett fel uppstod. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  // Visa bara knappen om användaren har en Stripe-prenumeration
  if (!premiumData || premiumData.source !== 'stripe' || !premiumData.stripeCustomerId) {
    return null
  }

  return (
    <div style={{
      marginTop: '16px',
      marginBottom: '16px',
      padding: '16px',
      background: 'rgba(16, 185, 129, 0.1)',
      borderRadius: '8px',
      border: 'none'
    }}>
      <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#e5e7eb' }}>
        <CreditCard size={20} /> Uppgradera till Family Premium
      </h4>
      <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#e5e7eb' }}>
        Dela premium med upp till 5 familjemedlemmar. Din nuvarande prenumeration ersätts.
      </p>
      <button
        onClick={handleManageSubscription}
        disabled={loading}
        className="btn-primary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? (
          <>
            <Loader size={16} className="spinning" />
            Laddar...
          </>
        ) : (
          <>
            <ExternalLink size={16} />
            Uppgradera till Family (49 kr/mån)
          </>
        )}
      </button>
      <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#e5e7eb', textAlign: 'center' }}>
        Säker betalning via Stripe
      </p>
    </div>
  )
}
