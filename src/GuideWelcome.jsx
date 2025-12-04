import React from 'react'
import './GuideWelcome.css'

export default function GuideWelcome({ onStart, onSkip }) {
  return (
    <div className="guide-welcome-overlay">
      <div className="guide-welcome-dialog">
        <div className="guide-welcome-icon">🎓</div>
        <h2 className="guide-welcome-title">Välkommen till Svinnstop!</h2>
        <p className="guide-welcome-text">
          Vill du prova en snabb interaktiv guide som visar dig hur appen fungerar?
        </p>
        <p className="guide-welcome-subtext">
          Det tar bara någon minut och du lär dig alla viktiga funktioner.
        </p>
        <div className="guide-welcome-buttons">
          <button className="guide-btn guide-btn-secondary" onClick={onSkip}>
            Nej tack, jag testar själv
          </button>
          <button className="guide-btn guide-btn-primary" onClick={onStart}>
            Ja, visa mig! →
          </button>
        </div>
      </div>
    </div>
  )
}
