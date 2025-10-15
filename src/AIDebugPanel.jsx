import React, { useState, useEffect } from 'react'
import { getAIStatistics, resetAILearning, cleanupLearningData, exportLearningData, importLearningData } from './smartExpiryAI'

const AIDebugPanel = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const statistics = getAIStatistics()
      setStats(statistics)
    }
  }, [isOpen])

  const handleReset = () => {
    if (confirm('⚠️ Detta kommer att rensa all AI-lärdata. Är du säker?')) {
      resetAILearning()
      setStats(getAIStatistics())
    }
  }

  const handleCleanup = () => {
    cleanupLearningData()
    setStats(getAIStatistics())
  }

  const handleExport = () => {
    const data = exportLearningData()
    setShowExport(data)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const success = importLearningData(e.target.result)
          if (success) {
            setStats(getAIStatistics())
            alert('✅ AI-lärdata importerad!')
          } else {
            alert('❌ Fel vid import av lärdata')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (!isOpen || !stats) return null

  return (
    <div className="debug-panel-overlay">
      <div className="debug-panel">
        <div className="debug-header">
          <h3>🤖 AI Debug Panel</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="debug-content">
          <div className="stats-section">
            <h4>📊 Statistik</h4>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-label">Totala justeringar:</span>
                <span className="stat-value">{stats.totalAdjustments}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Inlärda produkter:</span>
                <span className="stat-value">{stats.learnedProducts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Inlärda kategorier:</span>
                <span className="stat-value">{stats.learnedCategories}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Genomsnittlig konfidenz:</span>
                <span className="stat-value">{Math.round(stats.averageConfidence)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Mest justerade kategori:</span>
                <span className="stat-value">{stats.mostAdjustedCategory}</span>
              </div>
            </div>
          </div>

          {stats.recentPatterns.length > 0 && (
            <div className="patterns-section">
              <h4>🔄 Senaste justeringar</h4>
              <div className="patterns-list">
                {stats.recentPatterns.map((pattern, idx) => (
                  <div key={idx} className="pattern-item">
                    <span className="pattern-product">{pattern.productName}</span>
                    <span className="pattern-adjustment">
                      {pattern.daysDifference > 0 ? '+' : ''}{pattern.daysDifference} dagar
                    </span>
                    <span className="pattern-reason">{pattern.reason || 'Ingen anledning'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="debug-actions">
            <button onClick={handleCleanup} className="debug-btn secondary">
              🧹 Rensa gamla data
            </button>
            <button onClick={handleExport} className="debug-btn secondary">
              📤 Exportera data
            </button>
            <button onClick={handleImport} className="debug-btn secondary">
              📥 Importera data
            </button>
            <button onClick={handleReset} className="debug-btn danger">
              🔄 Återställ AI
            </button>
          </div>

          {showExport && (
            <div className="export-section">
              <h4>📋 Exporterad data</h4>
              <textarea
                readOnly
                value={showExport}
                className="export-textarea"
                onClick={(e) => e.target.select()}
              />
              <button 
                onClick={() => setShowExport(false)}
                className="debug-btn secondary"
              >
                ✕ Stäng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIDebugPanel