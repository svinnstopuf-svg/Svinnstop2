export const recipes = [
  {
    id: 1,
    name: 'Simple Tomato Pasta',
    servings: 2,
    ingredients: [
      { name: 'tomato', quantity: 3, unit: 'pieces' },
      { name: 'pasta', quantity: 200, unit: 'g' },
      { name: 'garlic', quantity: 2, unit: 'cloves' }
    ],
    instructions: 'Boil 200g pasta. Sauté 2 minced garlic cloves, add 3 diced tomatoes. Cook 10 minutes. Mix with pasta and serve.',
    cookingTime: '20 minutes',
    difficulty: 'Easy'
  },
  {
    id: 2,
    name: 'Fluffy Banana Pancakes',
    servings: 2,
    ingredients: [
      { name: 'banana', quantity: 2, unit: 'pieces' },
      { name: 'egg', quantity: 2, unit: 'pieces' },
      { name: 'flour', quantity: 100, unit: 'g' },
      { name: 'milk', quantity: 150, unit: 'ml' }
    ],
    instructions: 'Mash 2 bananas. Mix with 2 eggs, 100g flour, and 150ml milk. Cook pancakes in pan for 3 minutes each side.',
    cookingTime: '15 minutes',
    difficulty: 'Easy'
  },
  {
    id: 3,
    name: 'Veggie Omelette',
    servings: 1,
    ingredients: [
      { name: 'egg', quantity: 3, unit: 'pieces' },
      { name: 'onion', quantity: 1, unit: 'small' },
      { name: 'bell pepper', quantity: 1, unit: 'piece' },
      { name: 'cheese', quantity: 50, unit: 'g' }
    ],
    instructions: 'Beat 3 eggs. Sauté diced onion and bell pepper. Pour eggs over vegetables, add 50g cheese. Fold and serve.',
    cookingTime: '10 minutes',
    difficulty: 'Medium'
  },
  {
    id: 4,
    name: 'Avocado Toast',
    servings: 1,
    ingredients: [
      { name: 'bread', quantity: 2, unit: 'slices' },
      { name: 'avocado', quantity: 1, unit: 'piece' },
      { name: 'lemon', quantity: 0.5, unit: 'piece' }
    ],
    instructions: 'Toast 2 bread slices. Mash 1 avocado with juice of half lemon. Spread on toast and season with salt and pepper.',
    cookingTime: '5 minutes',
    difficulty: 'Easy'
  },
  {
    id: 5,
    name: 'Quick Chicken Stir-fry',
    servings: 2,
    ingredients: [
      { name: 'chicken', quantity: 300, unit: 'g' },
      { name: 'broccoli', quantity: 200, unit: 'g' },
      { name: 'garlic', quantity: 2, unit: 'cloves' },
      { name: 'soy sauce', quantity: 3, unit: 'tbsp' }
    ],
    instructions: 'Cut 300g chicken into strips. Stir-fry with 2 minced garlic cloves. Add 200g broccoli and 3 tbsp soy sauce. Cook until tender.',
    cookingTime: '15 minutes',
    difficulty: 'Medium'
  },
  {
    id: 6,
    name: 'Scrambled Eggs',
    servings: 1,
    ingredients: [
      { name: 'egg', quantity: 3, unit: 'pieces' },
      { name: 'milk', quantity: 50, unit: 'ml' }
    ],
    instructions: 'Beat 3 eggs with 50ml milk. Cook in buttered pan on low heat, stirring constantly until creamy.',
    cookingTime: '5 minutes',
    difficulty: 'Easy'
  },
  {
    id: 7,
    name: 'Simple Banana Bread',
    servings: 6,
    ingredients: [
      { name: 'banana', quantity: 3, unit: 'ripe pieces' },
      { name: 'flour', quantity: 200, unit: 'g' },
      { name: 'egg', quantity: 1, unit: 'piece' },
      { name: 'milk', quantity: 100, unit: 'ml' }
    ],
    instructions: 'Mash 3 ripe bananas. Mix with 1 egg, 200g flour, and 100ml milk. Bake at 180°C for 45 minutes.',
    cookingTime: '60 minutes',
    difficulty: 'Medium'
  }
]

export function suggestRecipes(items) {
  if (items.length === 0) return []
  
  // Create a map of available ingredients with their quantities
  const availableIngredients = new Map()
  items.forEach(item => {
    const name = item.name.toLowerCase().trim()
    availableIngredients.set(name, item.quantity)
  })
  
  // Filter recipes where we have ALL required ingredients
  const viableRecipes = recipes.filter(recipe => {
    return recipe.ingredients.every(ingredient => {
      const ingredientName = ingredient.name.toLowerCase()
      
      // Check if we have this ingredient (exact match or partial match)
      for (const [availableName] of availableIngredients) {
        if (availableName.includes(ingredientName) || ingredientName.includes(availableName)) {
          return true
        }
      }
      return false
    })
  })
  
  // Sort by number of servings (smaller recipes first) and return top 3
  return viableRecipes
    .sort((a, b) => a.servings - b.servings)
    .slice(0, 3)
    .map(recipe => ({
      ...recipe,
      // Add info about which of your items will be used
      usedIngredients: recipe.ingredients.map(ingredient => {
        const matchingItem = items.find(item => {
          const itemName = item.name.toLowerCase()
          const ingredientName = ingredient.name.toLowerCase()
          return itemName.includes(ingredientName) || ingredientName.includes(itemName)
        })
        return {
          ...ingredient,
          availableQuantity: matchingItem ? matchingItem.quantity : 0,
          itemName: matchingItem ? matchingItem.name : ingredient.name
        }
      })
    }))
}
