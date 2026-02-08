import React, { useState, useEffect } from 'react'
import { 
  DollarSign, Package, Trophy, Lock, Sparkles,
  Leaf, Droplet, UtensilsCrossed, TrendingUp,
  Calendar, Zap, Users, Bell, Home as HomeIcon, ChefHat
} from 'lucide-react'
import { getSavingsData } from './savingsTracker'
import { achievementService } from './achievementService'
import { familyService } from './familyService'
import { premiumService } from './premiumService'
import Spinner from './components/Spinner'
import './AdvancedStats.css'

export default function AdvancedStats({ onUpgradeClick }) {
  const [savingsData, setSavingsData] = useState(null)
  const [achievementData, setAchievementData] = useState(null)
  const [familyData, setFamilyData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('all') // 'month', 'year', 'all'
  const [hasPremium, setHasPremium] = useState(false)
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false)

  useEffect(() => {
    loadData()
    checkPremium()
  }, [])
  
  function checkPremium() {
    const benefits = premiumService.hasFamilyPremiumBenefitsSync()
    setHasPremium(benefits.hasBenefits)
  }

  function loadData() {
    const savings = getSavingsData()
    const achievements = achievementService.getAchievementData()
    const family = familyService.getFamilyData()
    
    setSavingsData(savings)
    setAchievementData(achievements)
    setFamilyData(family)
  }

  // Premium check
  if (!hasPremium) {
    return (
      <div className="premium-locked">
        <div className="lock-icon"><Lock size={64} strokeWidth={1.5} /></div>
        <h3>Avancerad Statistik</h3>
        <p>Uppgradera till Premium för att se detaljerad statistik om dina besparingar, miljöpåverkan och framsteg.</p>
        <button className="upgrade-btn" onClick={onUpgradeClick}>
          <Sparkles size={18} /> Uppgradera till Premium
        </button>
        <div className="premium-features-preview">
          <h4>Inkluderar:</h4>
          <ul>
            <li>✓ Tidsperiod-väljare (månad, år, totalt)</li>
            <li>✓ Miljöpåverkan (CO₂, vatten, måltider)</li>
            <li>✓ Trendgraf över tid</li>
            <li>✓ Achievement-sammanfattning</li>
            <li>✓ Familjestatistik</li>
          </ul>
        </div>
      </div>
    )
  }
  
  if (!savingsData || !achievementData) {
    return <Spinner size={32} text="Laddar statistik..." />
  }
  
  // Safety check: Ensure savingsData has required structure
  if (!savingsData.currentMonth || typeof savingsData.currentMonth.month !== 'number') {
    console.error('Invalid savingsData structure:', savingsData)
    return <Spinner size={32} text="Laddar statistik..." />
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
  const currentMonthName = monthNames[savingsData.currentMonth.month]
  
  // Calculate period-specific stats
  const getDisplayStats = () => {
    switch (selectedPeriod) {
      case 'month':
        return {
          saved: Math.round(savingsData.currentMonth.saved),
          items: savingsData.currentMonth.items,
          label: currentMonthName
        }
      case 'year':
        const yearStart = new Date().getFullYear()
        const yearData = savingsData.history.filter(m => m.year === yearStart)
        const yearSaved = yearData.reduce((sum, m) => sum + m.saved, savingsData.currentMonth.saved)
        const yearItems = yearData.reduce((sum, m) => sum + m.items, savingsData.currentMonth.items)
        return {
          saved: Math.round(yearSaved),
          items: yearItems,
          label: yearStart
        }
      default:
        return {
          saved: Math.round(savingsData.totalSaved),
          items: savingsData.itemsSaved,
          label: 'Totalt'
        }
    }
  }

  const displayStats = getDisplayStats()
  
  // Environmental impact calculations
  const co2Saved = Math.round(displayStats.items * 2.5) // kg CO2 per item average
  const waterSaved = Math.round(displayStats.items * 50) // liters per item average
  const mealsCreated = Math.round(displayStats.items * 0.8) // meals from saved items

  // Achievement score - calculate based on period
  const achievementScore = achievementService.getAchievementScore()
  const unlockedAchievements = achievementData.unlocked.length
  const totalAchievements = achievementService.getAllAchievements().length
  
  // Calculate period-specific achievements
  const getPeriodAchievements = () => {
    if (selectedPeriod === 'all') {
      return {
        count: unlockedAchievements,
        label: 'Totalt'
      }
    }
    
    // Filter achievements based on unlock date
    const now = new Date()
    let startDate
    
    if (selectedPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (selectedPeriod === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1)
    }
    
    const periodAchievements = achievementData.unlocked.filter(a => {
      const unlockDate = new Date(a.unlockedAt)
      return unlockDate >= startDate
    })
    
    return {
      count: periodAchievements.length,
      label: selectedPeriod === 'month' ? currentMonthName : now.getFullYear()
    }
  }
  
  const periodAchievements = getPeriodAchievements()

  return (
    <div className="advanced-stats">
      {/* Period Selector */}
      <div className="period-selector">
        <button
          className={selectedPeriod === 'month' ? 'active' : ''}
          onClick={() => {
            setIsLoadingPeriod(true)
            setTimeout(() => {
              setSelectedPeriod('month')
              setIsLoadingPeriod(false)
            }, 100)
          }}
        >
          Denna månad
        </button>
        <button
          className={selectedPeriod === 'year' ? 'active' : ''}
          onClick={() => {
            setIsLoadingPeriod(true)
            setTimeout(() => {
              setSelectedPeriod('year')
              setIsLoadingPeriod(false)
            }, 100)
          }}
        >
          I år
        </button>
        <button
          className={selectedPeriod === 'all' ? 'active' : ''}
          onClick={() => {
            setIsLoadingPeriod(true)
            setTimeout(() => {
              setSelectedPeriod('all')
              setIsLoadingPeriod(false)
            }, 100)
          }}
        >
          Totalt
        </button>
      </div>
      
      {isLoadingPeriod && <Spinner size={24} text="Uppdaterar..." />}

      {/* Hero Stats */}
      <div className="stats-hero">
        <div className="hero-card primary">
          <div className="hero-icon"><DollarSign size={48} strokeWidth={2} /></div>
          <div className="hero-content">
            <div className="hero-value">{displayStats.saved} kr</div>
            <div className="hero-label">Sparat från matsvinn ({displayStats.label})</div>
          </div>
        </div>
        
        <div className="hero-card secondary">
          <div className="hero-icon"><Package size={48} strokeWidth={2} /></div>
          <div className="hero-content">
            <div className="hero-value">{displayStats.items}</div>
            <div className="hero-label">Varor räddade ({displayStats.label})</div>
          </div>
        </div>

        <div className="hero-card secondary">
          <div className="hero-icon"><Trophy size={48} strokeWidth={2} /></div>
          <div className="hero-content">
            <div className="hero-value">{periodAchievements.count}</div>
            <div className="hero-label">Utmärkelser ({periodAchievements.label})</div>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="stats-section">
        <h3 className="section-title"><Leaf size={24} style={{verticalAlign: 'middle', marginRight: '8px'}} />Miljöpåverkan</h3>
        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-icon"><Leaf size={48} strokeWidth={1.5} /></div>
            <div className="impact-value">{co2Saved} kg</div>
            <div className="impact-label">CO₂ sparat</div>
            <div className="impact-comparison">≈ {Math.round(co2Saved / 10)} träd planterade</div>
          </div>
          
          <div className="impact-card">
            <div className="impact-icon"><Droplet size={48} strokeWidth={1.5} /></div>
            <div className="impact-value">{waterSaved} L</div>
            <div className="impact-label">Vatten sparat</div>
            <div className="impact-comparison">≈ {Math.round(waterSaved / 200)} badkar</div>
          </div>
          
          <div className="impact-card">
            <div className="impact-icon"><UtensilsCrossed size={48} strokeWidth={1.5} /></div>
            <div className="impact-value">{mealsCreated}</div>
            <div className="impact-label">Måltider skapade</div>
            <div className="impact-comparison">≈ {Math.round(mealsCreated / 3)} dagars mat</div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {savingsData.history.length > 0 && (
        <div className="stats-section">
          <h3 className="section-title">
            <TrendingUp size={24} style={{verticalAlign: 'middle', marginRight: '8px'}} />Trend
          </h3>
          <p className="section-subtitle">Senaste månaderna</p>
          <div className="trend-chart">
            {savingsData.history.slice(-6).map((monthData, idx) => {
              const maxValue = Math.max(
                ...savingsData.history.slice(-6).map(m => m.saved),
                savingsData.currentMonth.saved
              )
              const height = maxValue > 0 ? (monthData.saved / maxValue) * 100 : 0
              
              return (
                <div key={idx} className="trend-bar-wrapper">
                  <div className="trend-bar-container">
                    <div 
                      className="trend-bar"
                      style={{ height: `${Math.max(height, 5)}%` }}
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
            <div className="trend-bar-wrapper current">
              <div className="trend-bar-container">
                <div 
                  className="trend-bar current"
                  style={{ 
                    height: `${savingsData.history.length > 0 ? Math.max((savingsData.currentMonth.saved / Math.max(...savingsData.history.slice(-6).map(m => m.saved), savingsData.currentMonth.saved)) * 100, 5) : 100}%` 
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

      {/* Achievements Summary */}
      <div className="stats-section">
        <h3 className="section-title"><Trophy size={24} style={{verticalAlign: 'middle', marginRight: '8px'}} />Achievements</h3>
        <div className="achievement-summary">
          <div className="achievement-progress-ring">
            <svg viewBox="0 0 100 100">
              <circle
                className="progress-ring-background"
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className="progress-ring-progress"
                cx="50"
                cy="50"
                r="45"
                strokeDasharray={`${achievementScore.percentage * 2.827} 282.7`}
              />
            </svg>
            <div className="progress-ring-text">
              <div className="progress-percentage">{achievementScore.percentage}%</div>
              <div className="progress-label">Avklarat</div>
            </div>
          </div>
          
          <div className="achievement-details">
            <div className="achievement-stat">
              <span className="achievement-stat-label">Upplåsta badges</span>
              <span className="achievement-stat-value">{unlockedAchievements}/{totalAchievements}</span>
            </div>
            <div className="achievement-stat">
              <span className="achievement-stat-label">Poäng</span>
              <span className="achievement-stat-value">{achievementScore.score}/{achievementScore.maxScore}</span>
            </div>
            <div className="achievement-stat">
              <span className="achievement-stat-label">Nuvarande streak</span>
              <span className="achievement-stat-value">{achievementData.stats.currentStreak || 0} 🔥</span>
            </div>
            <div className="achievement-stat">
              <span className="achievement-stat-label">Längsta streak</span>
              <span className="achievement-stat-value">{achievementData.stats.longestStreak || 0} 💪</span>
            </div>
          </div>
        </div>
      </div>

      {/* Family Stats */}
      {familyData && familyData.familyId && (
        <div className="stats-section family-section">
          <h3 className="section-title"><Users size={24} style={{verticalAlign: 'middle', marginRight: '8px'}} />Familjestatistik</h3>
          <div className="family-stats-card">
            <div className="family-header">
              <span className="family-icon"><HomeIcon size={32} /></span>
              <span className="family-name">{familyData.familyName}</span>
            </div>
            <div className="family-info">
              <div className="family-info-item">
                <span className="family-info-icon"><Users size={20} /></span>
                <span>{familyData.members.length} medlemmar</span>
              </div>
              <div className="family-info-item">
                <span className="family-info-icon"><Sparkles size={20} /></span>
                <span>Tillsammans minskar ni matsvinn!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="stats-section tips-section">
        <h3 className="section-title"><Zap size={24} style={{verticalAlign: 'middle', marginRight: '8px'}} />Tips för att fortsätta</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon"><Calendar size={28} /></span>
            <div className="tip-content">
              <div className="tip-title">Kolla kylskåpet regelbundet</div>
              <div className="tip-text">Gör det till en rutin att se över varor som snart går ut</div>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon"><ChefHat size={28} /></span>
            <div className="tip-content">
              <div className="tip-title">Använd receptfunktionen</div>
              <div className="tip-text">Hitta recept baserat på vad du har hemma</div>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon"><Bell size={28} /></span>
            <div className="tip-content">
              <div className="tip-title">Aktivera notifikationer</div>
              <div className="tip-text">Få påminnelser om varor som snart går ut</div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <p>📊 Besparingar räknas konservativt (70% av varje varas värde)</p>
        <p>🌱 Miljödata baserad på genomsnittlig matproduktion</p>
      </div>
    </div>
  )
}
