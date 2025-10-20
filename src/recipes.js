// Utökad svensk receptsamling med kokbok-kvalitet
export const recipes = {
  sv: [
    {
      id: 1,
      name: 'Krämig Tomatpasta med Färska Tomater',
      servings: 2,
      ingredients: [
        { name: 'tomat', quantity: 4, unit: 'stycken' },
        { name: 'pasta', quantity: 200, unit: 'g' },
        { name: 'vitlök', quantity: 3, unit: 'klyftor' },
        { name: 'grädde', quantity: 1, unit: 'dl' },
        { name: 'basilika', quantity: 1, unit: 'kruka' }
      ],
      instructions: 'Koka 200g pasta enligt anvisning. Stek 3 hackade vitlöksklyftor i olivolja. Tillsätt 4 tärnade tomater och koka 8-10 min. Häll i grädde och låt sjuda 2-3 min. Smaka av med salt, peppar och färsk basilika. Blanda med pastan.',
      cookingTime: '20 minuter',
      difficulty: 'Lätt',
      tags: ['snabbt', 'vegetariskt', 'komfortmat']
    },
    {
      id: 2,
      name: 'Fluffiga Bananpannkakor med Kanel',
      servings: 2,
      ingredients: [
        { name: 'banan', quantity: 2, unit: 'stycken' },
        { name: 'ägg', quantity: 2, unit: 'stycken' },
        { name: 'mjöl', quantity: 100, unit: 'g' },
        { name: 'mjölk', quantity: 150, unit: 'ml' },
        { name: 'smör', quantity: 25, unit: 'g' }
      ],
      instructions: 'Mosa 2 mogna bananer smidigt. Vispa ihop med 2 ägg, 100g mjöl, 150ml mjölk och 1 tsk kanel. Vila smeten 10 min. Stek tjocka pannkakor i smör, 3 min per sida på medelvärme. Servera med sylt eller honung.',
      cookingTime: '25 minuter',
      difficulty: 'Lätt',
      tags: ['frukost', 'barnvänligt', 'söt']
    },
    {
      id: 3,
      name: 'Perfekt Grönsaksomelette',
      servings: 1,
      ingredients: [
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'lök', quantity: 0.5, unit: 'stycken' },
        { name: 'paprika', quantity: 1, unit: 'stycke' },
        { name: 'ost', quantity: 50, unit: 'g' },
        { name: 'smör', quantity: 15, unit: 'g' }
      ],
      instructions: 'Stek hackad lök och paprika mjuk i smör. Vispa 3 ägg med salt och peppar. Häll äggen över grönsakerna, låt stelna på botten. Strö över riven ost. Vik ihop försiktigt och glid över på tallrik. Garnera med färska örter.',
      cookingTime: '12 minuter',
      difficulty: 'Medel',
      tags: ['protein', 'lunch', 'vegetariskt']
    },
    {
      id: 4,
      name: 'Avokadotoast Deluxe',
      servings: 1,
      ingredients: [
        { name: 'bröd', quantity: 2, unit: 'skivor' },
        { name: 'avokado', quantity: 1, unit: 'stycke' },
        { name: 'citron', quantity: 0.5, unit: 'stycke' },
        { name: 'tomat', quantity: 1, unit: 'stycke' },
        { name: 'ägg', quantity: 1, unit: 'stycke' }
      ],
      instructions: 'Rosta brödet gyllenbrunt. Mosa avokado med citronsaft, salt och peppar. Pochera ägget 3-4 min. Bred avokado på rosten, lägg på tunna tomatskivor och det pocherade ägget. Strö över flingsalt och svartpeppar.',
      cookingTime: '10 minuter',
      difficulty: 'Medel',
      tags: ['frukost', 'nyttigt', 'instagrammat']
    },
    {
      id: 5,
      name: 'Asiatisk Kycklingwok med Grönsaker',
      servings: 2,
      ingredients: [
        { name: 'kyckling', quantity: 300, unit: 'g' },
        { name: 'broccoli', quantity: 200, unit: 'g' },
        { name: 'paprika', quantity: 1, unit: 'stycke' },
        { name: 'vitlök', quantity: 3, unit: 'klyftor' },
        { name: 'soja', quantity: 3, unit: 'msk' },
        { name: 'ris', quantity: 150, unit: 'g' }
      ],
      instructions: 'Koka ris enligt anvisning. Skär kyckling i remsor, salta och peppra. Wokar kycklingen het i olja 3-4 min. Tillsätt hackad vitlök, broccoli och paprika. Wokar 3-4 min till. Häll i soja och wokar 1 min. Servera över ris.',
      cookingTime: '20 minuter',
      difficulty: 'Medel',
      tags: ['middag', 'hälsosamt', 'asiatiskt']
    },
    {
      id: 6,
      name: 'Krämig Äggröra med Örter',
      servings: 1,
      ingredients: [
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'mjölk', quantity: 50, unit: 'ml' },
        { name: 'smör', quantity: 20, unit: 'g' },
        { name: 'bröd', quantity: 2, unit: 'skivor' }
      ],
      instructions: 'Vispa ägg med mjölk, salt och peppar. Smält smör i panna på låg värme. Häll i äggblandningen och rör försiktigt med träslev. Ta av och på från värmen för krämig konsistens. Rör tills önskad fasthet. Servera på rostat bröd med gräslök.',
      cookingTime: '8 minuter',
      difficulty: 'Lätt',
      tags: ['frukost', 'protein', 'klassisk']
    },
    {
      id: 7,
      name: 'Saftigt Bananbröd med Valnötter',
      servings: 8,
      ingredients: [
        { name: 'banan', quantity: 3, unit: 'mogna stycken' },
        { name: 'mjöl', quantity: 200, unit: 'g' },
        { name: 'ägg', quantity: 2, unit: 'stycken' },
        { name: 'mjölk', quantity: 100, unit: 'ml' },
        { name: 'smör', quantity: 75, unit: 'g' }
      ],
      instructions: 'Sätt ugn på 180°C. Smält smöret och låt svalna. Mosa bananer klumpfritt. Blanda torrvaror. Vispa ägg och mjölk, tillsätt smält smör och bananer. Vänd ner mjölblandningen försiktigt. Häll i smörad form. Grädda 50-55 min. Stick med sticka för test.',
      cookingTime: '75 minuter',
      difficulty: 'Medel',
      tags: ['bakning', 'fika', 'förråd']
    },
    {
      id: 8,
      name: 'Klassisk Köttfärssås',
      servings: 4,
      ingredients: [
        { name: 'kött', quantity: 500, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'morötter', quantity: 2, unit: 'stycken' },
        { name: 'tomat', quantity: 400, unit: 'g krossade' },
        { name: 'pasta', quantity: 400, unit: 'g' }
      ],
      instructions: 'Brunlägg köttfärs på hög värme. Tillsätt hackad lök och morötter, stek mjuk 5 min. Häll i krossade tomater, krydda med oregano, basilika, salt och peppar. Sjud på låg värme 20-30 min. Smaka av. Servera med nykokta pasta och riven parmesan.',
      cookingTime: '45 minuter',
      difficulty: 'Lätt',
      tags: ['middag', 'familjemiddag', 'barnvänligt']
    },
    {
      id: 9,
      name: 'Krämig Champinjonsoppa',
      servings: 4,
      ingredients: [
        { name: 'champinjoner', quantity: 400, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'mjöl', quantity: 2, unit: 'msk' },
        { name: 'grädde', quantity: 2, unit: 'dl' },
        { name: 'smör', quantity: 50, unit: 'g' }
      ],
      instructions: 'Skiva champinjoner och lök. Stek i smör tills vätskan kokt bort. Pudra över mjöl, rör om. Tillsätt buljong gradvis under omrörning. Sjud 10 min. Häll i grädde och värm. Smaka av med salt, peppar och timjan. Mixa hälften för tjockare soppa.',
      cookingTime: '30 minuter',
      difficulty: 'Medel',
      tags: ['soppa', 'vegetariskt', 'vardagsmat']
    },
    {
      id: 10,
      name: 'Svensk Pannbiff med Lök',
      servings: 2,
      ingredients: [
        { name: 'kött', quantity: 300, unit: 'g' },
        { name: 'lök', quantity: 2, unit: 'stycken' },
        { name: 'potatis', quantity: 600, unit: 'g' },
        { name: 'smör', quantity: 30, unit: 'g' },
        { name: 'grädde', quantity: 1, unit: 'dl' }
      ],
      instructions: 'Koka potatis. Skiva löken tjockt och stek mjuk i smör. Salta och peppra köttet, stek 2-3 min per sida. Vila köttet. Koka upp stekskyarna med grädde. Servera med kokt potatis, stekt lök och såsen. Garnera med persilja.',
      cookingTime: '35 minuter',
      difficulty: 'Medel',
      tags: ['husmanskost', 'middag', 'klassisk']
    },
    {
      id: 11,
      name: 'Fräsch Grekisk Sallad',
      servings: 2,
      ingredients: [
        { name: 'tomat', quantity: 3, unit: 'stycken' },
        { name: 'gurka', quantity: 1, unit: 'stycke' },
        { name: 'feta', quantity: 150, unit: 'g' },
        { name: 'lök', quantity: 0.5, unit: 'röd' },
        { name: 'olivolja', quantity: 3, unit: 'msk' }
      ],
      instructions: 'Skär tomater i klyftor, gurka i halvmånar. Skiva rödlök tunt. Blanda grönsaker i skål. Smula över feta. Vispa olivolja med citronsaft, oregano, salt och peppar. Häll över salladen och blanda försiktigt. Vila 15 min före servering.',
      cookingTime: '15 minuter',
      difficulty: 'Lätt',
      tags: ['sallad', 'vegetariskt', 'medelhavet']
    },
    {
      id: 12,
      name: 'Korvstroganoff',
      servings: 3,
      ingredients: [
        { name: 'korv', quantity: 400, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'paprika', quantity: 1, unit: 'röd' },
        { name: 'grädde', quantity: 2, unit: 'dl' },
        { name: 'ris', quantity: 200, unit: 'g' }
      ],
      instructions: 'Koka ris. Skär korv och paprika i remsor, lök i klyftor. Stek korv först, lägg åt sidan. Stek lök och paprika mjuka. Tillsätt korv, häll i grädde och sjud 5 min. Krydda med paprikapulver, salt och peppar. Servera med ris.',
      cookingTime: '25 minuter',
      difficulty: 'Lätt',
      tags: ['vardagsmat', 'barnvänligt', 'snabbt']
    }
  ]
}

// Beräkna dagar tills utgång
function daysUntil(dateStr) {
  const today = new Date()
  const date = new Date(dateStr)
  const diff = Math.ceil((date - new Date(today.toDateString())) / (1000 * 60 * 60 * 24))
  return diff
}

export function suggestRecipes(items) {
  if (items.length === 0) return []
  
  // Använd alltid svenska recept
  const languageRecipes = recipes.sv
  
  // Skapa en karta över tillgängliga ingredienser med deras mängder och utgångsdatum
  const availableIngredients = new Map()
  items.forEach(item => {
    const name = item.name.toLowerCase().trim()
    availableIngredients.set(name, {
      quantity: item.quantity,
      expiresAt: item.expiresAt,
      daysLeft: daysUntil(item.expiresAt)
    })
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
  
  // Beräkna prioritet baserat på utgångsdatum och sortera
  const prioritizedRecipes = viableRecipes.map(recipe => {
    // Hitta ingredienser som snart går ut
    let urgencyScore = 0
    let expiringIngredients = 0
    
    recipe.ingredients.forEach(ingredient => {
      const ingredientName = ingredient.name.toLowerCase()
      
      for (const [availableName, itemData] of availableIngredients) {
        if (availableName.includes(ingredientName) || ingredientName.includes(availableName)) {
          const daysLeft = itemData.daysLeft
          
          // Högre poäng för ingredienser som går ut snart
          if (daysLeft <= 1) {
            urgencyScore += 10 // Går ut idag/imorgon
            expiringIngredients++
          } else if (daysLeft <= 3) {
            urgencyScore += 5 // Går ut inom 3 dagar
            expiringIngredients++
          } else if (daysLeft <= 7) {
            urgencyScore += 2 // Går ut inom en vecka
          }
          break
        }
      }
    })
    
    return {
      ...recipe,
      urgencyScore,
      expiringIngredients
    }
  })
  
  // Sortera efter urgency (högst först), sedan efter antal portioner
  return prioritizedRecipes
    .sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) {
        return b.urgencyScore - a.urgencyScore // Högsta urgency först
      }
      return a.servings - b.servings // Mindre portioner först vid lika urgency
    })
    .slice(0, 5) // Visa fler recept nu när vi har bättre prioritering
    .map(recipe => ({
      ...recipe,
      // Lägg till info om vilka av dina varor som kommer användas
      usedIngredients: recipe.ingredients.map(ingredient => {
        const matchingItem = items.find(item => {
          const itemName = item.name.toLowerCase()
          const ingredientName = ingredient.name.toLowerCase()
          return itemName.includes(ingredientName) || ingredientName.includes(itemName)
        })
        
        const daysLeft = matchingItem ? daysUntil(matchingItem.expiresAt) : null
        
        return {
          ...ingredient,
          availableQuantity: matchingItem ? matchingItem.quantity : 0,
          availableUnit: matchingItem ? matchingItem.unit : ingredient.unit,
          itemName: matchingItem ? matchingItem.name : ingredient.name,
          daysLeft: daysLeft,
          isExpiring: daysLeft !== null && daysLeft <= 3,
          isExpired: daysLeft !== null && daysLeft < 0
        }
      }),
      // Lägg till varning om receptet använder ingredienser som snart går ut
      hasExpiringIngredients: recipe.expiringIngredients > 0,
      expiringIngredientsCount: recipe.expiringIngredients
    }))
}
