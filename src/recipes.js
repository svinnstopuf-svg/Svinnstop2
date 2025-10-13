// Endast svenska recept
export const recipes = {
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
  ]
}

export function suggestRecipes(items) {
  if (items.length === 0) return []
  
  // Använd alltid svenska recept
  const languageRecipes = recipes.sv
  
  // Skapa en karta över tillgängliga ingredienser med deras mängder
  const availableIngredients = new Map()
  items.forEach(item => {
    const name = item.name.toLowerCase().trim()
    availableIngredients.set(name, item.quantity)
  })
  
  // Filtrera recept där vi har ALLA nödvändiga ingredienser
  const viableRecipes = languageRecipes.filter(recipe => {
    return recipe.ingredients.every(ingredient => {
      const ingredientName = ingredient.name.toLowerCase()
      
      // Kontrollera om vi har denna ingrediens (exakt matchning eller delvis matchning)
      for (const [availableName] of availableIngredients) {
        if (availableName.includes(ingredientName) || ingredientName.includes(availableName)) {
          return true
        }
      }
      return false
    })
  })
  
  // Sortera efter antal portioner (mindre recept först) och returnera topp 3
  return viableRecipes
    .sort((a, b) => a.servings - b.servings)
    .slice(0, 3)
    .map(recipe => ({
      ...recipe,
      // Lägg till info om vilka av dina varor som kommer användas
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
