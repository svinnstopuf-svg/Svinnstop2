// AI Recipe Generator med Cloud Function
// Genererar personliga recept baserat på användarens ingredienser

export const generateAIRecipe = async (selectedIngredients, preferences = {}, ingredientMode = 'staples') => {
  try {
    const response = await fetch('https://us-central1-svinnstop.cloudfunctions.net/generateAIRecipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selectedIngredients,
        preferences,
        ingredientMode
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Kunde inte generera recept')
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('AI Recipe Generation Error:', error)
    return {
      success: false,
      error: error.message || 'Kunde inte generera recept'
    }
  }
}

// Spara AI-recept till localStorage
export const saveAIRecipe = (recipe) => {
  try {
    const saved = JSON.parse(localStorage.getItem('svinnstop_ai_recipes') || '[]')
    
    // Lägg till eller uppdatera
    const existingIndex = saved.findIndex(r => r.id === recipe.id)
    if (existingIndex >= 0) {
      saved[existingIndex] = recipe
    } else {
      saved.unshift(recipe) // Nya recept först
    }
    
    // Begränsa till max 50 sparade AI-recept
    const limited = saved.slice(0, 50)
    localStorage.setItem('svinnstop_ai_recipes', JSON.stringify(limited))
    
    return { success: true, recipes: limited }
  } catch (error) {
    console.error('Save AI Recipe Error:', error)
    return { success: false, error: error.message }
  }
}

// Hämta sparade AI-recept
export const getSavedAIRecipes = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('svinnstop_ai_recipes') || '[]')
    return saved
  } catch (error) {
    console.error('Get AI Recipes Error:', error)
    return []
  }
}

// Ta bort AI-recept
export const deleteAIRecipe = (recipeId) => {
  try {
    const saved = JSON.parse(localStorage.getItem('svinnstop_ai_recipes') || '[]')
    const filtered = saved.filter(r => r.id !== recipeId)
    localStorage.setItem('svinnstop_ai_recipes', JSON.stringify(filtered))
    return { success: true, recipes: filtered }
  } catch (error) {
    console.error('Delete AI Recipe Error:', error)
    return { success: false, error: error.message }
  }
}
