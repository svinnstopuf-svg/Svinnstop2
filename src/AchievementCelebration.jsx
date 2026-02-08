import React, { useEffect, useState } from 'react'
import { Trophy, Sparkles } from 'lucide-react'
import './AchievementCelebration.css'

export default function AchievementCelebration({ achievement, onClose }) {
  const [show, setShow] = useState(false)
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    if (achievement) {
      setShow(true)
      // Generate confetti pieces
      const pieces = []
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          size: 8 + Math.random() * 8,
          color: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#98FB98'][Math.floor(Math.random() * 5)]
        })
      }
      setConfetti(pieces)

      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [achievement])

  const handleClose = () => {
    setShow(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  if (!achievement) return null

  return (
    <div className={`achievement-overlay ${show ? 'show' : ''}`} onClick={handleClose}>
      {/* Confetti pieces */}
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color
          }}
        />
      ))}

      <div className={`achievement-modal ${show ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="achievement-icon-large">{achievement.icon}</div>
        
        <div className="achievement-badge">
          <span className="badge-tier" style={{ color: achievement.tier?.color || '#FFD700' }}>
            {achievement.tier?.name || 'Badge'}
          </span>
        </div>

        <h2 className="achievement-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}><Trophy size={28} strokeWidth={2} /> Achievement Unlocked!</h2>
        <h3 className="achievement-name">{achievement.title}</h3>
        <p className="achievement-description">{achievement.description}</p>

        <button className="achievement-close-btn" onClick={handleClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          Awesome! <Sparkles size={18} />
        </button>
      </div>
    </div>
  )
}
