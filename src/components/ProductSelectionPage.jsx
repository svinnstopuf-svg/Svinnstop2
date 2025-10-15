import React from 'react'
import { ArrowLeft, Camera, Brain, Clock } from 'lucide-react'

const ProductSelectionPage = ({ 
  isOpen, 
  onClose, 
  recognizedProducts, 
  onScanDate, 
  onUseAI 
}) => {
  if (!isOpen || !recognizedProducts?.length) return null

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'frukt': return '🍎'
      case 'grönt': return '🥬'
      case 'citrus': return '🍋'
      case 'rotfrukt': return '🥕'
      case 'svamp': return '🍄'
      case 'mejeri': return '🥛'
      case 'kött': return '🥩'
      case 'fisk': return '🐟'
      case 'ägg': return '🥚'
      case 'bröd': return '🍞'
      case 'torrvaror': return '🌾'
      case 'sötsaker': return '🍫'
      case 'drycker': return '🥤'
      default: return '📦'
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="product-selection-overlay">
      <div className="product-selection-page">
        {/* Header */}
        <div className="selection-header">
          <button onClick={onClose} className="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2>Välj produkter och datum</h2>
        </div>

        {/* Products List */}
        <div className="products-section">
          <h3>Hittade produkter ({recognizedProducts.length})</h3>
          <div className="simple-products-list">
            {recognizedProducts.map((product, index) => (
              <div key={index} className="simple-product-card">
                <div className="product-basic-info">
                  <span className="product-icon">
                    {getCategoryIcon(product.aiSuggestion?.category)}
                  </span>
                  <div className="product-details">
                    <span className="product-name">{product.name}</span>
                    <span className="product-quantity">{product.quantity} {product.unit}</span>
                  </div>
                </div>
                
                {/* Date Selection for this product */}
                <div className="date-choice-buttons">
                  <button 
                    className="choice-btn scan-btn"
                    onClick={() => onScanDate(product)}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scanna datum</span>
                  </button>
                  
                  <button 
                    className="choice-btn ai-btn"
                    onClick={() => onUseAI(product)}
                  >
                    <Brain className="w-4 h-4" />
                    <div className="ai-info">
                      <span>AI-gissning</span>
                      <small>
                        {formatDate(product.aiSuggestion.date)} 
                        <Clock className="w-3 h-3 inline ml-1" />
                        {product.aiSuggestion.daysFromNow}d
                      </small>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductSelectionPage