// AI Recipe Generator med OpenAI
// Genererar personliga recept baserat på användarens ingredienser

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export const generateAIRecipe = async (selectedIngredients, preferences = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API-nyckel saknas. Lägg till VITE_OPENAI_API_KEY i .env')
  }

  // Formatera ingredienser för prompt
  const ingredientsList = selectedIngredients
    .map(item => `${item.name} (${item.quantity} ${item.unit})`)
    .join(', ')

  const prompt = `Du är en kock som skapar recept. Skapa ett unikt och detaljerat recept baserat på dessa ingredienser:

${ingredientsList}

${preferences.cuisine ? `Kökstyp: ${preferences.cuisine}` : ''}
${preferences.difficulty ? `Svårighetsgrad: ${preferences.difficulty}` : ''}
${preferences.time ? `Maximal tid: ${preferences.time} minuter` : ''}

Svara i följande JSON-format:
{
  "name": "Receptnamn på svenska",
  "description": "Kort beskrivning av rätten",
  "servings": 2,
  "prepTime": "15 min",
  "cookTime": "30 min",
  "difficulty": "Medel",
  "ingredients": [
    {"item": "ingrediens", "amount": "mängd"}
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "nutrition": {
    "calories": "500",
    "protein": "25g",
    "carbs": "40g",
    "fat": "20g"
  },
  "tips": ["Tips 1", "Tips 2"]
}

Använd ALLA angivna ingredienser. Lägg till vanliga kryddor och basics (salt, peppar, olja) om det behövs.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Billigare och snabbare än gpt-4
        messages: [
          {
            role: 'system',
            content: 'Du är en professionell kock som skapar kreativa och genomförbara recept på svenska. Svara alltid med valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Lite kreativitet
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API-fel')
    }

    const data = await response.json()
    const recipeText = data.choices[0].message.content.trim()
    
    // Extrahera JSON från svar (ta bort eventuella markdown-backticks)
    const jsonMatch = recipeText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Kunde inte hitta JSON i OpenAI:s svar')
    }

    const recipe = JSON.parse(jsonMatch[0])
    
    // Lägg till metadata
    recipe.id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    recipe.source = 'AI-genererat'
    recipe.isAI = true
    recipe.createdAt = Date.now()
    recipe.usedIngredients = selectedIngredients

    return {
      success: true,
      recipe: recipe
    }

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
