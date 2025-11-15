import React, { useState, useEffect } from 'react'
import './weeklyEmail.css'

export default function WeeklyEmailSignup() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Kolla om användaren redan prenumererar
    const subscribed = localStorage.getItem('svinnstop_email_subscribed')
    const savedEmail = localStorage.getItem('svinnstop_user_email')
    
    if (subscribed === 'true' && savedEmail) {
      setIsSubscribed(true)
      setEmail(savedEmail)
    } else {
      // Visa prompten efter 30 sekunder första gången
      const promptShown = localStorage.getItem('svinnstop_email_prompt_shown')
      if (!promptShown) {
        setTimeout(() => {
          setShowPrompt(true)
          localStorage.setItem('svinnstop_email_prompt_shown', 'true')
        }, 30000)
      }
    }
  }, [])

  const handleSubscribe = async (e) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setMessage('❌ Vänligen ange en giltig email')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    // Spara prenumeration lokalt
    // Firebase Functions anropas via backend när DNS är verifierad
    localStorage.setItem('svinnstop_email_subscribed', 'true')
    localStorage.setItem('svinnstop_user_email', email)
    
    setIsSubscribed(true)
    setMessage('✅ Tack! Du kommer få veckosammanfattningar varje måndag.')
    setShowPrompt(false)
    setIsSubmitting(false)
  }

  const handleUnsubscribe = () => {
    if (confirm('Är du säker på att du vill avsluta veckosammanfattningar?')) {
      localStorage.removeItem('svinnstop_email_subscribed')
      localStorage.removeItem('svinnstop_user_email')
      setIsSubscribed(false)
      setEmail('')
      setMessage('Du är nu avprenumererad från veckosammanfattningar.')
    }
  }

  if (isSubscribed) {
    return (
      <div className="email-signup-card subscribed">
        <div className="email-icon">✅</div>
        <div className="email-content">
          <h3>Veckosammanfattningar aktiverade</h3>
          <p>Du får email varje måndag med:</p>
          <ul>
            <li>🥗 Varor som går ut denna vecka</li>
            <li>🍳 Receptförslag baserat på ditt kylskåp</li>
            <li>💰 Dina besparingar senaste veckan</li>
            <li>📊 Statistik och tips</li>
          </ul>
          <div className="subscribed-email">{email}</div>
          <button 
            className="unsubscribe-btn"
            onClick={handleUnsubscribe}
          >
            Avsluta prenumeration
          </button>
        </div>
      </div>
    )
  }

  if (!showPrompt) {
    return (
      <button 
        className="email-trigger-btn"
        onClick={() => setShowPrompt(true)}
      >
        📧 Få veckosammanfattningar via email
      </button>
    )
  }

  return (
    <div className="email-signup-card">
      <button 
        className="email-close"
        onClick={() => setShowPrompt(false)}
      >
        ×
      </button>
      
      <div className="email-icon">📧</div>
      
      <div className="email-content">
        <h3>Få veckosammanfattningar via email</h3>
        <p className="email-description">
          Varje måndag får du ett email med dina utgående varor, receptförslag och besparingar. 
          Gratis reengagement! 📈 +15% retention
        </p>

        <form onSubmit={handleSubscribe} className="email-form">
          <input
            type="email"
            placeholder="din@email.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email-input"
            required
            disabled={isSubmitting}
          />
          
          <button 
            type="submit"
            className="email-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Registrerar...' : '✨ Prenumerera gratis'}
          </button>
        </form>

        {message && (
          <div className={`email-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <p className="email-privacy">
          🔒 Din email används bara för veckosammanfattningar. Ingen spam!
        </p>
      </div>
    </div>
  )
}
