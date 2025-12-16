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
        
        {/* Premium Pitch - Viral Growth */}
        <div className="guide-premium-pitch">
          <div className="pitch-icon">🎁</div>
          <div className="pitch-content">
            <h3>Få Premium gratis!</h3>
            <p>Bjud in vänner och få <strong>7 dagar Premium gratis</strong> per vän</p>
            <div className="pitch-benefits">
              <span>✅ Obegränsat antal varor</span>
              <span>✅ AI-receptförslag</span>
              <span>✅ Ingen reklam</span>
            </div>
          </div>
        </div>
        
        <div className="guide-welcome-buttons">
          <button className="guide-btn guide-btn-secondary" onClick={onSkip}>
            Hoppa över guiden
          </button>
          <button className="guide-btn guide-btn-primary" onClick={onStart}>
            Starta guiden →
          </button>
        </div>
        
        <p className="guide-welcome-footnote">
          Appen är gratis att använda. Premium är valfritt.
        </p>
      </div>
    </div>
  )
}
