import { useState, useEffect } from 'react'
import { getSavingsData } from './savingsTracker'
import { achievementService } from './achievementService'
import { familyService } from './familyService'
import './SavingsBanner.css'

export default function SavingsBanner() {
  const [savingsData, setSavingsData] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [achievementData, setAchievementData] = useState(null)
  const [familyData, setFamilyData] = useState(null)

  useEffect(() => {
    const data = getSavingsData()
    const achData = achievementService.getAchievementData()
    const famData = familyService.getFamilyData()
    setSavingsData(data)
    setAchievementData(achData)
    setFamilyData(famData)
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
          <div className="stat-label">Utmärkelser</div>
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
          {/* Real-world comparisons */}
          <div className="comparison-section">
            <h4>🌍 Verklig påverkan</h4>
            <p className="savings-info">
              Du har sparat <strong>{Math.round(savingsData.totalSaved)} kr</strong> genom att 
              använda {savingsData.itemsSaved} varor innan de gick ut!
            </p>
            <div className="comparison-grid">
              <div className="comparison-item">
                <div className="comparison-icon">⛽</div>
                <div className="comparison-value">{Math.round(savingsData.totalSaved / 50)} L</div>
                <div className="comparison-label">Bensin</div>
              </div>
              <div className="comparison-item">
                <div className="comparison-icon">🎬</div>
                <div className="comparison-value">{Math.round(savingsData.totalSaved / 100)}</div>
                <div className="comparison-label">Biobiljetter</div>
              </div>
              <div className="comparison-item">
                <div className="comparison-icon">☕</div>
                <div className="comparison-value">{Math.round(savingsData.totalSaved / 40)}</div>
                <div className="comparison-label">Kaffelånge</div>
              </div>
              <div className="comparison-item">
                <div className="comparison-icon">🍕</div>
                <div className="comparison-value">{Math.round(savingsData.totalSaved / 120)}</div>
                <div className="comparison-label">Pizzor</div>
              </div>
            </div>
          </div>

          {/* Trend chart - last 7 entries from history */}
          {savingsData.history && savingsData.history.length > 0 && (
            <div className="trend-section">
              <h4>📈 Trender</h4>
              <div className="trend-chart">
                {savingsData.history.slice(-7).map((monthData, idx) => {
                  const maxValue = Math.max(...savingsData.history.slice(-7).map(m => m.saved), savingsData.currentMonth.saved)
                  const height = maxValue > 0 ? (monthData.saved / maxValue) * 100 : 0
                  return (
                    <div key={idx} className="trend-bar-container">
                      <div className="trend-bar-wrapper">
                        <div 
                          className="trend-bar"
                          style={{ height: `${height}%` }}
                          title={`${monthNames[monthData.month]}: ${Math.round(monthData.saved)} kr`}
                        >
                          <span className="trend-value">{Math.round(monthData.saved)}</span>
                        </div>
                      </div>
                      <div className="trend-label">{monthNames[monthData.month]}</div>
                    </div>
                  )
                })}
                {/* Current month */}
                <div className="trend-bar-container current">
                  <div className="trend-bar-wrapper">
                    <div 
                      className="trend-bar current"
                      style={{ 
                        height: `${savingsData.history.length > 0 ? (savingsData.currentMonth.saved / Math.max(...savingsData.history.slice(-7).map(m => m.saved), savingsData.currentMonth.saved)) * 100 : 100}%` 
                      }}
                      title={`${currentMonthName}: ${Math.round(savingsData.currentMonth.saved)} kr`}
                    >
                      <span className="trend-value">{Math.round(savingsData.currentMonth.saved)}</span>
                    </div>
                  </div>
                  <div className="trend-label">{currentMonthName}</div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly comparison */}
          {savingsData.history && savingsData.history.length > 0 && (
            <div className="comparison-month-section">
              <h4>📅 Månadsjämförelse</h4>
              <div className="month-comparison">
                <div className="month-comp-item">
                  <div className="month-comp-label">Förra månaden</div>
                  <div className="month-comp-value">
                    {Math.round(savingsData.history[savingsData.history.length - 1]?.saved || 0)} kr
                  </div>
                  <div className="month-comp-items">
                    {savingsData.history[savingsData.history.length - 1]?.items || 0} varor
                  </div>
                </div>
                <div className="month-comp-divider">→</div>
                <div className="month-comp-item current">
                  <div className="month-comp-label">Denna månad</div>
                  <div className="month-comp-value">
                    {Math.round(savingsData.currentMonth.saved)} kr
                  </div>
                  <div className="month-comp-items">
                    {savingsData.currentMonth.items} varor
                  </div>
                </div>
              </div>
              {savingsData.currentMonth.saved > (savingsData.history[savingsData.history.length - 1]?.saved || 0) && (
                <div className="comparison-result positive">
                  🚀 Du sparar {Math.round(savingsData.currentMonth.saved - (savingsData.history[savingsData.history.length - 1]?.saved || 0))} kr mer denna månad!
                </div>
              )}
              {savingsData.currentMonth.saved < (savingsData.history[savingsData.history.length - 1]?.saved || 0) && (
                <div className="comparison-result">
                  💪 Fortsatt så når du förra månadens nivå!
                </div>
              )}
            </div>
          )}

          {/* Achievements & Streaks */}
          {achievementData && (
            <div className="achievements-section">
              <h4>🏆 Prestationer</h4>
              <div className="achievement-stats">
                <div className="achievement-stat">
                  <div className="achievement-stat-icon">🔥</div>
                  <div className="achievement-stat-content">
                    <div className="achievement-stat-value">{achievementData.stats.currentStreak || 0}</div>
                    <div className="achievement-stat-label">Dagars streak</div>
                  </div>
                </div>
                <div className="achievement-stat">
                  <div className="achievement-stat-icon">🎯</div>
                  <div className="achievement-stat-content">
                    <div className="achievement-stat-value">{achievementData.unlocked.length}</div>
                    <div className="achievement-stat-label">Upplåsta badges</div>
                  </div>
                </div>
                <div className="achievement-stat">
                  <div className="achievement-stat-icon">💪</div>
                  <div className="achievement-stat-content">
                    <div className="achievement-stat-value">{achievementData.stats.longestStreak || 0}</div>
                    <div className="achievement-stat-label">Längsta streak</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Family stats if in a family */}
          {familyData && familyData.familyId && (
            <div className="family-stats-section">
              <h4>👨‍👩‍👧‍👦 Familjestatistik</h4>
              <div className="family-stat-card">
                <div className="family-stat-header">
                  <span>🏠 {familyData.familyName}</span>
                  <span className="family-member-count">{familyData.members.length} medlemmar</span>
                </div>
                <p className="family-stat-note">
                  🎉 Tillsammans gör ni verklig skillnad! Varje familjemedlem bidrar till att minska matsvinn.
                </p>
              </div>
            </div>
          )}

          {/* Monthly progress */}
          {savingsData.currentMonth.items > 0 && (
            <div className="month-progress">
              <div className="progress-header">
                <span>Månadsmål ({currentMonthName})</span>
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

          <p className="savings-note">
            <small>📊 Summan räknas konservativt (70% av varje varas värde) för att kompensera för delvis användning.</small>
          </p>
        </div>
      )}
    </div>
  )
}
