import React, { useState, useEffect } from 'react'
import { 
  achievementService, 
  CATEGORIES, 
  BADGE_TIERS 
} from './achievementService'
import './achievements.css'

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [achievements, setAchievements] = useState([])
  const [stats, setStats] = useState(null)
  const [tierProgress, setTierProgress] = useState({})
  const [achievementScore, setAchievementScore] = useState({ score: 0, maxScore: 0, percentage: 0 })

  useEffect(() => {
    loadAchievements()
  }, [])

  function loadAchievements() {
    const allAchievements = achievementService.getAllAchievements()
    const data = achievementService.getAchievementData()
    const tierData = achievementService.getUnlockedByTier()
    const scoreData = achievementService.getAchievementScore()

    setAchievements(allAchievements)
    setStats(data.stats)
    setTierProgress(tierData)
    setAchievementScore(scoreData)
  }

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory)

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const overallProgress = Math.round((unlockedCount / totalCount) * 100)

  return (
    <div className="achievements-page">
      {/* Header with overall stats */}
      <div className="achievements-header">
        <h1>🏆 Achievements & Badges</h1>
        
        <div className="overall-stats">
          <div className="stat-card">
            <div className="stat-value">{achievementScore.score}</div>
            <div className="stat-label">Poäng</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{unlockedCount}/{totalCount}</div>
            <div className="stat-label">Upplåsta</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{overallProgress}%</div>
            <div className="stat-label">Completion</div>
          </div>
        </div>

        {/* Score progress bar */}
        <div className="score-progress">
          <div className="progress-label">
            <span>Total Progress</span>
            <span>{achievementScore.percentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${achievementScore.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="tier-progress-section">
        <h2>Badge Tiers</h2>
        <div className="tier-cards">
          {Object.values(BADGE_TIERS).map(tier => {
            const progress = tierProgress[tier.name] || { unlocked: 0, total: 0, percentage: 0 }
            return (
              <div key={tier.name} className="tier-card">
                <div 
                  className="tier-badge"
                  style={{ backgroundColor: tier.color }}
                >
                  {tier.name}
                </div>
                <div className="tier-stats">
                  <div className="tier-count">{progress.unlocked}/{progress.total}</div>
                  <div className="tier-progress-bar">
                    <div 
                      className="tier-progress-fill"
                      style={{ 
                        width: `${progress.percentage}%`,
                        backgroundColor: tier.color
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-tabs">
        <button
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          Alla
        </button>
        {Object.values(CATEGORIES).map(category => (
          <button
            key={category}
            className={selectedCategory === category ? 'active' : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Achievement List */}
      <div className="achievements-grid">
        {filteredAchievements.map(achievement => (
          <AchievementCard 
            key={achievement.id} 
            achievement={achievement}
          />
        ))}
      </div>

      {/* User stats summary */}
      {stats && (
        <div className="stats-summary">
          <h2>Dina Statistik</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-icon">💾</span>
              <span className="stat-text">{stats.itemsSaved} varor räddade</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-text">{stats.totalSaved} kr sparat</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🍳</span>
              <span className="stat-text">{stats.recipesCooked || 0} recept lagade</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔥</span>
              <span className="stat-text">{stats.currentStreak || 0} dagars streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📦</span>
              <span className="stat-text">{stats.maxActiveItems || 0} max aktiva varor</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">👥</span>
              <span className="stat-text">{stats.referralsCount || 0} vänner inbjudna</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AchievementCard({ achievement }) {
  const isUnlocked = achievement.unlocked
  const progress = achievement.progress
  const progressPercent = achievement.progressPercent

  return (
    <div className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
      <div className="achievement-icon">
        {isUnlocked ? achievement.icon : '🔒'}
      </div>
      
      <div className="achievement-content">
        <div className="achievement-header">
          <h3 className="achievement-title">{achievement.title}</h3>
          <div 
            className="achievement-tier-badge"
            style={{ backgroundColor: achievement.tier.color }}
          >
            {achievement.tier.name}
          </div>
        </div>
        
        <p className="achievement-description">{achievement.description}</p>
        
        {!isUnlocked && (
          <div className="achievement-progress">
            <div className="progress-text">
              {progress.current} / {progress.target}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        {isUnlocked && achievement.unlockedAt && (
          <div className="unlocked-date">
            Upplåst {new Date(achievement.unlockedAt).toLocaleDateString('sv-SE')}
          </div>
        )}
      </div>
    </div>
  )
}
