import { useState, useEffect } from 'react'
import { getSavingsData } from './savingsTracker'
import './SavingsBanner.css'

export default function SavingsBanner() {
  const [savingsData, setSavingsData] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const data = getSavingsData()
    setSavingsData(data)
  }, [])

  if (!savingsData) return null

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
  const currentMonthName = monthNames[savingsData.currentMonth.month]

  // Räkna senaste upplåsta achievement
  const latestAchievement = savingsData.achievements.length > 0 
    ? savingsData.achievements[savingsData.achievements.length - 1]
    : null

  return (
    <div className="savings-banner">
      <div className="savings-hero">
        <div className="savings-icon">💰</div>
        <div className="savings-main">
          <div className="savings-amount">
            {Math.round(savingsData.totalSaved)} kr
          </div>
          <div className="savings-label">Totalt sparat från matsvinn</div>
        </div>
      </div>

      <div className="savings-stats">
        <div className="stat-item">
          <div className="stat-value">{savingsData.itemsSaved}</div>
          <div className="stat-label">Varor räddade</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-value">{Math.round(savingsData.currentMonth.saved)} kr</div>
          <div className="stat-label">Denna månad ({currentMonthName})</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-value">{savingsData.achievements.length}</div>
          <div className="stat-label">Achievements</div>
        </div>
      </div>

      {latestAchievement && (
        <div className="latest-achievement">
          <span className="achievement-badge">🏆</span>
          <span className="achievement-text">
            Senaste: <strong>{latestAchievement.title}</strong>
          </span>
        </div>
      )}

      <button 
        className="savings-details-btn"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? '▲ Dölj detaljer' : '▼ Visa detaljer'}
      </button>

      {showDetails && (
        <div className="savings-details">
          <h4>📊 Dina besparingar</h4>
          <p className="savings-info">
            Du har sparat <strong>{Math.round(savingsData.totalSaved)} kr</strong> genom att 
            använda {savingsData.itemsSaved} varor innan de gick ut! 
            Det motsvarar ca <strong>{Math.round(savingsData.totalSaved / 50)} liter bensin</strong> eller{' '}
            <strong>{Math.round(savingsData.totalSaved / 100)} biobiljetter</strong>! 🎉
          </p>
          <p className="savings-note">
            <small>📊 Summan räknas konservativt (70% av varje varas värde) för att kompensera för delvis användning.</small>
          </p>
          
          {savingsData.currentMonth.items > 0 && (
            <div className="month-progress">
              <div className="progress-header">
                <span>Denna månad ({currentMonthName})</span>
                <span>{savingsData.currentMonth.items}/10 varor</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (savingsData.currentMonth.items / 10) * 100)}%` }}
                ></div>
              </div>
              <div className="progress-tip">
                {savingsData.currentMonth.items >= 10 
                  ? '🌟 Målet nått! Du är en champion!' 
                  : `Rädda ${10 - savingsData.currentMonth.items} varor till för "Månads-krigare" badge!`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
