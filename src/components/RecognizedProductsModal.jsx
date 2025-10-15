import React, { useState, useEffect } from 'react'
import { X, Clock, Calendar, Brain, CheckCircle, AlertCircle } from 'lucide-react'
import { getExpirationDateGuess } from '../expirationDateAI.js'

const RecognizedProductsModal = ({ isOpen, onClose, recognizedProducts, onProductSelect }) => {
  const [productsWithAI, setProductsWithAI] = useState([])

  useEffect(() => {
    if (recognizedProducts?.length > 0) {
      // Lägg till AI-gissningar för alla produkter
      const enhanced = recognizedProducts.map(product => {
        const aiGuess = getExpirationDateGuess(product.name)
        return {
          ...product,
          aiSuggestion: aiGuess
        }
      })
      setProductsWithAI(enhanced)
    }
  }, [recognizedProducts])

  if (!isOpen || !recognizedProducts?.length) return null

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'hög': return 'text-green-600 bg-green-50'
      case 'medel': return 'text-yellow-600 bg-yellow-50'
      case 'låg': return 'text-orange-600 bg-orange-50'
      default: return 'text-red-600 bg-red-50'
    }
  }

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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-7 h-7" />
                Igenkända Produkter
              </h2>
              <p className="text-green-100 mt-1">
                Scannern hittade {recognizedProducts.length} produkt{recognizedProducts.length !== 1 ? 'er' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Products List */}
        <div className="overflow-y-auto max-h-[70vh] p-6">
          <div className="space-y-4">
            {productsWithAI.map((product, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onProductSelect && onProductSelect(product)}
              >
                <div className="flex items-start justify-between">
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {getCategoryIcon(product.aiSuggestion.category)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {product.quantity} {product.unit}
                        </p>
                      </div>
                    </div>

                    {/* AI Suggestion */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          AI-förslag för bäst före:
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(product.aiSuggestion.confidence)}`}>
                          {product.aiSuggestion.confidence} säkerhet
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            {formatDate(product.aiSuggestion.date)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>
                            {product.aiSuggestion.daysFromNow} dagar från idag
                          </span>
                        </div>
                        
                        <div className="md:col-span-2">
                          <p className="text-gray-600 text-xs">
                            {product.aiSuggestion.reason}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Typiskt intervall: {product.aiSuggestion.range}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className="ml-4">
                    {index === 0 ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Vald</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Klicka för att välja</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>AI-datum baserat på produkttyp och hållbarhet</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecognizedProductsModal