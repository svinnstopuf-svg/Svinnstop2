// Multilingual recipes
export const recipes = {
  en: [
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
  ],
  
  sv: [
    {
      id: 1,
      name: 'Enkel Tomatpasta',
      servings: 2,
      ingredients: [
        { name: 'tomat', quantity: 3, unit: 'stycken' },
        { name: 'pasta', quantity: 200, unit: 'g' },
        { name: 'vitlök', quantity: 2, unit: 'klyftor' }
      ],
      instructions: 'Koka 200g pasta. Stek 2 hackade vitlöksklyftor, tillsätt 3 tärnade tomater. Koka 10 minuter. Blanda med pastan och servera.',
      cookingTime: '20 minuter',
      difficulty: 'Lätt'
    },
    {
      id: 2,
      name: 'Fluffiga Bananpannkakor',
      servings: 2,
      ingredients: [
        { name: 'banan', quantity: 2, unit: 'stycken' },
        { name: 'ägg', quantity: 2, unit: 'stycken' },
        { name: 'mjöl', quantity: 100, unit: 'g' },
        { name: 'mjölk', quantity: 150, unit: 'ml' }
      ],
      instructions: 'Mosa 2 bananer. Blanda med 2 ägg, 100g mjöl och 150ml mjölk. Stek pannkakor i panna i 3 minuter på varje sida.',
      cookingTime: '15 minuter',
      difficulty: 'Lätt'
    },
    {
      id: 3,
      name: 'Grönsaksomelette',
      servings: 1,
      ingredients: [
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'lök', quantity: 1, unit: 'liten' },
        { name: 'paprika', quantity: 1, unit: 'stycke' },
        { name: 'ost', quantity: 50, unit: 'g' }
      ],
      instructions: 'Vispa 3 ägg. Stek hackad lök och paprika. Häll äggen över grönsakerna, tillsätt 50g ost. Vik ihop och servera.',
      cookingTime: '10 minuter',
      difficulty: 'Medel'
    },
    {
      id: 4,
      name: 'Avokadotoast',
      servings: 1,
      ingredients: [
        { name: 'bröd', quantity: 2, unit: 'skivor' },
        { name: 'avokado', quantity: 1, unit: 'stycke' },
        { name: 'citron', quantity: 0.5, unit: 'stycke' }
      ],
      instructions: 'Rosta 2 brödskivor. Mosa 1 avokado med saft från halv citron. Bred på rosten och krydda med salt och peppar.',
      cookingTime: '5 minuter',
      difficulty: 'Lätt'
    },
    {
      id: 5,
      name: 'Snabb Kycklingwok',
      servings: 2,
      ingredients: [
        { name: 'kyckling', quantity: 300, unit: 'g' },
        { name: 'broccoli', quantity: 200, unit: 'g' },
        { name: 'vitlök', quantity: 2, unit: 'klyftor' },
        { name: 'sojasås', quantity: 3, unit: 'msk' }
      ],
      instructions: 'Skär 300g kyckling i remsor. Wokar med 2 hackade vitlöksklyftor. Tillsätt 200g broccoli och 3 msk sojasås. Koka tills mört.',
      cookingTime: '15 minuter',
      difficulty: 'Medel'
    },
    {
      id: 6,
      name: 'Äggröra',
      servings: 1,
      ingredients: [
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'mjölk', quantity: 50, unit: 'ml' }
      ],
      instructions: 'Vispa 3 ägg med 50ml mjölk. Koka i smörad panna på låg värme, rör konstant tills krämigt.',
      cookingTime: '5 minuter',
      difficulty: 'Lätt'
    },
    {
      id: 7,
      name: 'Enkelt Bananbröd',
      servings: 6,
      ingredients: [
        { name: 'banan', quantity: 3, unit: 'mogna stycken' },
        { name: 'mjöl', quantity: 200, unit: 'g' },
        { name: 'ägg', quantity: 1, unit: 'stycke' },
        { name: 'mjölk', quantity: 100, unit: 'ml' }
      ],
      instructions: 'Mosa 3 mogna bananer. Blanda med 1 ägg, 200g mjöl och 100ml mjölk. Grädda på 180°C i 45 minuter.',
      cookingTime: '60 minuter',
      difficulty: 'Medel'
    }
  ],
  
  de: [
    {
      id: 1,
      name: 'Einfache Tomatenpasta',
      servings: 2,
      ingredients: [
        { name: 'tomate', quantity: 3, unit: 'Stück' },
        { name: 'nudeln', quantity: 200, unit: 'g' },
        { name: 'knoblauch', quantity: 2, unit: 'Zehen' }
      ],
      instructions: '200g Nudeln kochen. 2 gehackte Knoblauchzehen anbraten, 3 gewürfelte Tomaten hinzufügen. 10 Minuten kochen. Mit Nudeln mischen und servieren.',
      cookingTime: '20 Minuten',
      difficulty: 'Einfach'
    },
    {
      id: 2,
      name: 'Fluffige Bananenpfannkuchen',
      servings: 2,
      ingredients: [
        { name: 'banane', quantity: 2, unit: 'Stück' },
        { name: 'ei', quantity: 2, unit: 'Stück' },
        { name: 'mehl', quantity: 100, unit: 'g' },
        { name: 'milch', quantity: 150, unit: 'ml' }
      ],
      instructions: '2 Bananen zerdrücken. Mit 2 Eiern, 100g Mehl und 150ml Milch mischen. Pfannkuchen in der Pfanne je 3 Minuten pro Seite braten.',
      cookingTime: '15 Minuten',
      difficulty: 'Einfach'
    },
    {
      id: 3,
      name: 'Gemüse-Omelette',
      servings: 1,
      ingredients: [
        { name: 'ei', quantity: 3, unit: 'Stück' },
        { name: 'zwiebel', quantity: 1, unit: 'kleine' },
        { name: 'paprika', quantity: 1, unit: 'Stück' },
        { name: 'käse', quantity: 50, unit: 'g' }
      ],
      instructions: '3 Eier verquirlen. Gehackte Zwiebel und Paprika anbraten. Eier über das Gemüse gießen, 50g Käse hinzufügen. Zusammenklappen und servieren.',
      cookingTime: '10 Minuten',
      difficulty: 'Mittel'
    },
    {
      id: 4,
      name: 'Avocado-Toast',
      servings: 1,
      ingredients: [
        { name: 'brot', quantity: 2, unit: 'Scheiben' },
        { name: 'avocado', quantity: 1, unit: 'Stück' },
        { name: 'zitrone', quantity: 0.5, unit: 'Stück' }
      ],
      instructions: '2 Brotscheiben toasten. 1 Avocado mit Saft einer halben Zitrone zerdrücken. Auf Toast streichen und mit Salz und Pfeffer würzen.',
      cookingTime: '5 Minuten',
      difficulty: 'Einfach'
    },
    {
      id: 5,
      name: 'Schnelles Hähnchen-Pfannengericht',
      servings: 2,
      ingredients: [
        { name: 'hähnchen', quantity: 300, unit: 'g' },
        { name: 'brokkoli', quantity: 200, unit: 'g' },
        { name: 'knoblauch', quantity: 2, unit: 'Zehen' },
        { name: 'sojasoße', quantity: 3, unit: 'EL' }
      ],
      instructions: '300g Hähnchen in Streifen schneiden. Mit 2 gehackten Knoblauchzehen anbraten. 200g Brokkoli und 3 EL Sojasoße hinzufügen. Kochen bis zart.',
      cookingTime: '15 Minuten',
      difficulty: 'Mittel'
    },
    {
      id: 6,
      name: 'Rührei',
      servings: 1,
      ingredients: [
        { name: 'ei', quantity: 3, unit: 'Stück' },
        { name: 'milch', quantity: 50, unit: 'ml' }
      ],
      instructions: '3 Eier mit 50ml Milch verquirlen. In butteriger Pfanne bei niedriger Hitze kochen, ständig rühren bis cremig.',
      cookingTime: '5 Minuten',
      difficulty: 'Einfach'
    },
    {
      id: 7,
      name: 'Einfaches Bananenbrot',
      servings: 6,
      ingredients: [
        { name: 'banane', quantity: 3, unit: 'reife Stück' },
        { name: 'mehl', quantity: 200, unit: 'g' },
        { name: 'ei', quantity: 1, unit: 'Stück' },
        { name: 'milch', quantity: 100, unit: 'ml' }
      ],
      instructions: '3 reife Bananen zerdrücken. Mit 1 Ei, 200g Mehl und 100ml Milch mischen. Bei 180°C für 45 Minuten backen.',
      cookingTime: '60 Minuten',
      difficulty: 'Mittel'
    }
  ]
}

export function suggestRecipes(items) {
  if (items.length === 0) return []
  
  // Always use Swedish recipes
  const languageRecipes = recipes.sv
  
  // Create a map of available ingredients with their quantities
  const availableIngredients = new Map()
  items.forEach(item => {
    const name = item.name.toLowerCase().trim()
    availableIngredients.set(name, item.quantity)
  })
  
  // Filter recipes where we have ALL required ingredients
  const viableRecipes = languageRecipes.filter(recipe => {
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
