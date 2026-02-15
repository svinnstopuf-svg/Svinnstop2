import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { auth } from './firebaseConfig'
import { Sparkles, X, Check, AlertCircle } from 'lucide-react'

// Initialize Stripe (test mode)
const stripePromise = loadStripe('pk_test_51SeFaRD8sKgXsuDA0jAGuLhGTCo7DUpeFAVFMpwElYy51lBG5GIUsNhAimj4kSGLnfkBNTUKxwR9eYo3k3ILlM1E00btEuNKXz')

const StripeCheckout = ({ onClose, premiumType = 'individual' }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('Du måste vara inloggad för att köpa Premium')
      }

      // Anropa Firebase Cloud Function för att skapa Stripe Checkout Session
      const response = await fetch('https://us-central1-svinnstop.cloudfunctions.net/createCheckoutSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          premiumType: premiumType, // 'individual' or 'family'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kunde inte skapa checkout session')
      }

      const data = await response.json()
      
      // Använd url om den finns, annars sessionId (fallback)
      if (data.url) {
        window.location.href = data.url
      } else if (data.sessionId) {
        // Fallback till gammal metod om backend returnerar sessionId
        const stripe = await stripePromise
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      } else {
        throw new Error('Ingen checkout URL mottagen')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Ett fel uppstod. Försök igen.')
      setLoading(false)
    }
  }

  const prices = {
    individual: { price: 29, name: 'Individual Premium' },
    family: { price: 49, name: 'Family Premium' }
  }

  const selectedPlan = prices[premiumType] || prices.individual

  return (
    <div className="stripe-checkout-overlay">
      <div className="stripe-checkout-modal">
        <div className="checkout-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={24} /> {selectedPlan.name}</h2>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>

        <div className="checkout-content">
          <div className="plan-summary">
            <h3>{selectedPlan.price} kr/mån</h3>
            <p className="plan-type">{selectedPlan.name}</p>
            {premiumType === 'family' && (
              <p className="upgrade-note">
                Upp till 5 familjemedlemmar
              </p>
            )}
          </div>

          <div className="features-list">
            <h4>Vad ingår:</h4>
            <ul>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Obegränsat antal varor</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Receptförslag baserat på ditt kylskåp</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Push-notifikationer om utgående varor</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Achievements</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Besparingsstatistik</li>
              {premiumType === 'family' && (
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} strokeWidth={2} /> Dela med upp till 5 familjemedlemmar</li>
              )}
            </ul>
          </div>

          {error && (
            <div className="checkout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="checkout-actions">
            <button onClick={onClose} className="cancel-btn" disabled={loading}>
              Avbryt
            </button>
            <button 
              onClick={handleCheckout} 
              className="checkout-btn"
              disabled={loading}
            >
              {loading ? 'Laddar...' : `Betala ${selectedPlan.price} kr/mån`}
            </button>
          </div>

          <p className="checkout-disclaimer">
            Månadsprenumeration. Avsluta när som helst. Säker betalning via Stripe.
          </p>
          
          <p className="test-mode-notice">
            TEST MODE
          </p>
        </div>
      </div>

      <style jsx>{`
        .stripe-checkout-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .stripe-checkout-modal {
          background: var(--card-bg);
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          max-height: 90vh;
          overflow-y: auto;
        }

        .checkout-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .checkout-header h2 {
          margin: 0;
          font-size: 24px;
          color: var(--text);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .close-btn:hover {
          color: var(--text);
        }

        .checkout-content {
          padding: 24px;
        }

        .plan-summary {
          text-align: center;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .plan-summary h3 {
          font-size: 36px;
          margin: 0 0 8px 0;
        }

        .plan-type {
          margin: 0;
          font-size: 18px;
          opacity: 0.9;
        }

        .upgrade-note {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .features-list {
          margin-bottom: 24px;
        }

        .features-list h4 {
          margin: 0 0 16px 0;
          color: var(--text);
        }

        .features-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features-list li {
          padding: 8px 0;
          color: var(--text);
          font-size: 15px;
        }

        .checkout-error {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          color: #c00;
        }

        .checkout-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .cancel-btn, .checkout-btn {
          flex: 1;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .cancel-btn:hover:not(:disabled) {
          background: var(--border);
        }

        .checkout-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .checkout-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .checkout-btn:disabled, .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .checkout-disclaimer {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin: 0 0 12px 0;
        }

        .test-mode-notice {
          text-align: center;
          font-size: 12px;
          color: #f90;
          background: #fff3e0;
          padding: 8px;
          border-radius: 6px;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default StripeCheckout
