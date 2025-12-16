import React, { useState } from 'react'
import { generateAIRecipe, saveAIRecipe } from './aiRecipeService'
import { premiumService } from './premiumService'

export default function AIRecipeGenerator({ inventory, onClose, onRecipeGenerated }) {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [preferences, setPreferences] = useState({
    cuisine: '',
    difficulty: '',
    time: ''
  })
  const [ingredientMode, setIngredientMode] = useState('staples') // 'strict', 'staples', 'creative'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)

  const isPremium = premiumService.isPremiumActive()

  const toggleIngredient = (item) => {
    setSelectedIngredients(prev => {
      const exists = prev.find(i => i.id === item.id)
      if (exists) {
        return prev.filter(i => i.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }

  const handleGenerate = async () => {
    if (!isPremium) {
      setError('AI-receptgenerering kräver Premium. Uppgradera för att använda denna funktion!')
      return
    }

    if (selectedIngredients.length === 0) {
      setError('Välj minst en ingrediens')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await generateAIRecipe(selectedIngredients, preferences, ingredientMode)
      
      if (result.success) {
        setGeneratedRecipe(result.recipe)
        // Spara automatiskt
        saveAIRecipe(result.recipe)
        if (onRecipeGenerated) {
          onRecipeGenerated(result.recipe)
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Ett oväntat fel uppstod: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndClose = () => {
    if (generatedRecipe) {
      saveAIRecipe(generatedRecipe)
    }
    onClose()
  }

  // Om recept genererats, visa det
  if (generatedRecipe) {
    return (
      <div className="ai-recipe-overlay">
        <div className="ai-recipe-modal">
          <div className="modal-header">
            <h2>{generatedRecipe.name}</h2>
            <button onClick={handleSaveAndClose} className="close-btn">×</button>
          </div>

          <div className="recipe-content">
            <div className="recipe-meta">
              <span>Förberedelse: {generatedRecipe.prepTime}</span>
              <span>Tillagning: {generatedRecipe.cookTime}</span>
              <span>Portioner: {generatedRecipe.servings}</span>
              <span>{generatedRecipe.difficulty}</span>
            </div>

            <p className="recipe-description">{generatedRecipe.description}</p>

            <div className="recipe-section">
              <h3>Ingredienser</h3>
              <ul>
                {generatedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx}>{ing.amount} {ing.item}</li>
                ))}
              </ul>
            </div>

            <div className="recipe-section">
              <h3>Instruktioner</h3>
              <ol>
                {generatedRecipe.instructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            {generatedRecipe.nutrition && (
              <div className="recipe-section nutrition">
                <h3>Näringsinformation (per portion)</h3>
                <div className="nutrition-grid">
                  <div><strong>Kalorier:</strong> {generatedRecipe.nutrition.calories}</div>
                  <div><strong>Protein:</strong> {generatedRecipe.nutrition.protein}</div>
                  <div><strong>Kolhydrater:</strong> {generatedRecipe.nutrition.carbs}</div>
                  <div><strong>Fett:</strong> {generatedRecipe.nutrition.fat}</div>
                </div>
              </div>
            )}

            {generatedRecipe.tips && generatedRecipe.tips.length > 0 && (
              <div className="recipe-section">
                <h3>Tips</h3>
                <ul>
                  {generatedRecipe.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={handleSaveAndClose} className="btn-primary btn-large">
              Spara recept
            </button>
          </div>
        </div>

        <style jsx>{`
          .ai-recipe-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            padding: 20px;
          }

          .ai-recipe-modal {
            background: var(--card-bg);
            border-radius: 16px;
            max-width: 700px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          }

          .modal-header {
            padding: 24px;
            border-bottom: 2px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background: var(--card-bg);
            z-index: 10;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 24px;
            color: var(--text);
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: var(--muted);
            padding: 0;
            width: 36px;
            height: 36px;
          }

          .close-btn:hover {
            color: var(--text);
          }

          .recipe-content {
            padding: 24px;
          }

          .recipe-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 20px;
            font-size: 14px;
            color: var(--muted);
          }

          .recipe-description {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: var(--text);
          }

          .recipe-section {
            margin-bottom: 28px;
          }

          .recipe-section h3 {
            font-size: 20px;
            margin: 0 0 16px 0;
            color: var(--text);
          }

          .recipe-section ul,
          .recipe-section ol {
            margin: 0;
            padding-left: 24px;
          }

          .recipe-section li {
            margin-bottom: 10px;
            line-height: 1.6;
            color: var(--text);
          }

          .nutrition-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            background: var(--bg);
            padding: 16px;
            border-radius: 8px;
          }

          .nutrition-grid div {
            font-size: 14px;
            color: var(--text);
          }

          .btn-primary {
            width: 100%;
            padding: 14px 24px;
            font-size: 16px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
        `}</style>
      </div>
    )
  }

  // Ingrediensväljare
  return (
    <div className="ai-recipe-overlay">
      <div className="ai-recipe-modal">
        <div className="modal-header">
          <h2>AI Receptgenerator</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="generator-content">
          {!isPremium && (
            <div className="premium-warning">
              AI-receptgenerering kräver Premium. Uppgradera för att få personliga recept!
            </div>
          )}

          <div className="section">
            <h3>1. Välj ingredienser från ditt kylskåp</h3>
            <div className="ingredient-grid">
              {inventory.map(item => (
                <button
                  key={item.id}
                  className={`ingredient-card ${selectedIngredients.find(i => i.id === item.id) ? 'selected' : ''}`}
                  onClick={() => toggleIngredient(item)}
                  disabled={loading}
                >
                  <div className="ingredient-name">{item.name}</div>
                </button>
              ))}
            </div>
            {selectedIngredients.length > 0 && (
              <p className="selection-count">{selectedIngredients.length} ingredienser valda</p>
            )}
          </div>

          <div className="section">
            <h3>2. Ingrediensflexibilitet</h3>
            <div className="ingredient-mode">
              <label className={`mode-option ${ingredientMode === 'strict' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="strict"
                  checked={ingredientMode === 'strict'}
                  onChange={(e) => setIngredientMode(e.target.value)}
                  disabled={loading}
                />
                <div className="mode-content">
                  <strong>Endast valda ingredienser</strong>
                  <span>Använd bara det du valt, inga tillägg</span>
                </div>
              </label>

              <label className={`mode-option ${ingredientMode === 'staples' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="staples"
                  checked={ingredientMode === 'staples'}
                  onChange={(e) => setIngredientMode(e.target.value)}
                  disabled={loading}
                />
                <div className="mode-content">
                  <strong>Tillåt basvaror</strong>
                  <span>Kan lägga till salt, peppar, olja, vitlök etc.</span>
                </div>
              </label>

              <label className={`mode-option ${ingredientMode === 'creative' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="creative"
                  checked={ingredientMode === 'creative'}
                  onChange={(e) => setIngredientMode(e.target.value)}
                  disabled={loading}
                />
                <div className="mode-content">
                  <strong>Kreativt läge</strong>
                  <span>Kan föreslå extra ingredienser för bättre resultat</span>
                </div>
              </label>
            </div>
          </div>

          <div className="section">
            <h3>3. Preferenser (valfritt)</h3>
            <div className="preferences-grid">
              <div>
                <label>Kökstyp</label>
                <select
                  value={preferences.cuisine}
                  onChange={(e) => setPreferences(prev => ({ ...prev, cuisine: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">Ingen preferens</option>
                  <option value="Svenskt">Svenskt</option>
                  <option value="Italienskt">Italienskt</option>
                  <option value="Asiatiskt">Asiatiskt</option>
                  <option value="Mexikanskt">Mexikanskt</option>
                  <option value="Medelhavet">Medelhavet</option>
                </select>
              </div>

              <div>
                <label>Svårighetsgrad</label>
                <select
                  value={preferences.difficulty}
                  onChange={(e) => setPreferences(prev => ({ ...prev, difficulty: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">Ingen preferens</option>
                  <option value="Lätt">Lätt</option>
                  <option value="Medel">Medel</option>
                  <option value="Avancerad">Avancerad</option>
                </select>
              </div>

              <div>
                <label>Max tid (minuter)</label>
                <select
                  value={preferences.time}
                  onChange={(e) => setPreferences(prev => ({ ...prev, time: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">Ingen preferens</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="actions">
            <button onClick={onClose} className="btn-secondary" disabled={loading}>
              Avbryt
            </button>
            <button
              onClick={handleGenerate}
              className="btn-primary"
              disabled={loading || selectedIngredients.length === 0}
            >
              {loading ? 'Genererar recept...' : 'Generera recept'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ai-recipe-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          padding: 20px;
        }

        .ai-recipe-modal {
          background: var(--card-bg);
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 2px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          background: var(--card-bg);
          z-index: 10;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: var(--text);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: var(--muted);
          padding: 0;
          width: 36px;
          height: 36px;
        }

        .close-btn:hover {
          color: var(--text);
        }

        .generator-content {
          padding: 24px;
        }

        .premium-warning {
          background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
          color: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: center;
          font-weight: 600;
        }

        .section {
          margin-bottom: 28px;
        }

        .section h3 {
          font-size: 18px;
          margin: 0 0 16px 0;
          color: var(--text);
        }

        .ingredient-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .ingredient-card {
          background: var(--bg);
          border: 2px solid var(--border);
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ingredient-card:hover:not(:disabled) {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .ingredient-card.selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
        }

        .ingredient-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ingredient-name {
          font-size: 14px;
          font-weight: 600;
        }

        .selection-count {
          font-size: 14px;
          color: var(--accent);
          margin: 0;
          font-weight: 600;
        }

        .ingredient-mode {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mode-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: var(--bg);
          border: 2px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-option:hover {
          border-color: var(--accent);
          transform: translateX(4px);
        }

        .mode-option.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .mode-option input[type="radio"] {
          margin-top: 2px;
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .mode-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mode-content strong {
          font-size: 15px;
          color: var(--text);
          display: block;
        }

        .mode-content span {
          font-size: 13px;
          color: var(--muted);
        }

        .preferences-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .preferences-grid label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
        }

        .preferences-grid select {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--input-bg);
          color: var(--text);
          font-size: 14px;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
          color: #c00;
          text-align: center;
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--border);
        }

        @media (max-width: 768px) {
          .ai-recipe-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .generator-content {
            padding: 16px;
          }

          .ingredient-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 8px;
          }

          .ingredient-card {
            padding: 10px 12px;
          }

          .ingredient-name {
            font-size: 13px;
          }

          .preferences-grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .recipe-content {
            padding: 16px;
          }

          .recipe-meta {
            gap: 8px;
            font-size: 12px;
          }

          .nutrition-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
