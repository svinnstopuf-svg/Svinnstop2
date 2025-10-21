// API för att hämta populära recept från internet
// Använder TheMealDB API (gratis, ingen API-nyckel krävs)

const CACHE_KEY = 'svinnstop_cached_recipes'
const CACHE_VERSION = 'v7' // Öka denna för att ogiltigförklara gammal cache
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 timmar

// Översättning från engelska till svenska
const translateIngredient = (ingredient) => {
  const translations = {
    'chicken': 'kyckling',
    'chicken breast': 'kycklingfilé',
    'beef': 'nötkött',
    'ground beef': 'köttfärs',
    'pork': 'fläsk',
    'fish': 'fisk',
    'salmon': 'lax',
    'shrimp': 'räkor',
    'egg': 'ägg',
    'eggs': 'ägg',
    'milk': 'mjölk',
    'cream': 'grädde',
    'heavy cream': 'vispgrädde',
    'butter': 'smör',
    'cheese': 'ost',
    'parmesan': 'parmesan',
    'mozzarella': 'mozzarella',
    'pasta': 'pasta',
    'spaghetti': 'spaghetti',
    'rice': 'ris',
    'potato': 'potatis',
    'potatoes': 'potatis',
    'tomato': 'tomat',
    'tomatoes': 'tomater',
    'tomato paste': 'tomatpuré',
    'onion': 'lök',
    'onions': 'lök',
    'garlic': 'vitlök',
    'garlic clove': 'vitlöksklyfta',
    'carrot': 'morot',
    'carrots': 'morötter',
    'broccoli': 'broccoli',
    'pepper': 'paprika',
    'bell pepper': 'paprika',
    'red pepper': 'röd paprika',
    'mushroom': 'champinjoner',
    'mushrooms': 'champinjoner',
    'bread': 'bröd',
    'flour': 'mjöl',
    'sugar': 'socker',
    'salt': 'salt',
    'pepper': 'peppar',
    'black pepper': 'svartpeppar',
    'oil': 'olja',
    'olive oil': 'olivolja',
    'vegetable oil': 'matolja',
    'water': 'vatten',
    'lemon': 'citron',
    'lime': 'lime',
    'avocado': 'avokado',
    'banana': 'banan',
    'apple': 'äpple',
    'spinach': 'spenat',
    'lettuce': 'sallad',
    'cucumber': 'gurka',
    'soy sauce': 'soja',
    'ginger': 'ingefära',
    'parsley': 'persilja',
    'basil': 'basilika',
    'oregano': 'oregano',
    'thyme': 'timjan',
    'bacon': 'bacon',
    'ham': 'skinka',
    'yogurt': 'yoghurt',
    'honey': 'honung',
    'nuts': 'nötter',
    'coconut': 'kokos',
    'zucchini': 'zucchini',
    'aubergine': 'aubergine',
    'eggplant': 'aubergine'
  }
  
  const lower = ingredient.toLowerCase().trim()
  
  // Exakt matchning först
  if (translations[lower]) {
    return translations[lower]
  }
  
  // Delvis matchning
  for (const [eng, swe] of Object.entries(translations)) {
    if (lower.includes(eng)) {
      return swe
    }
  }
  
  return ingredient
}

// Översätt mått till svenska
const translateMeasure = (measure) => {
  const translations = {
    'cup': 'dl',
    'cups': 'dl',
    'tablespoon': 'msk',
    'tablespoons': 'msk',
    'tbsp': 'msk',
    'teaspoon': 'tsk',
    'teaspoons': 'tsk',
    'tsp': 'tsk',
    'oz': 'g',
    'ounce': 'g',
    'ounces': 'g',
    'lb': 'kg',
    'pound': 'kg',
    'pounds': 'kg',
    'ml': 'ml',
    'g': 'g',
    'kg': 'kg',
    'pinch': 'nypa',
    'pinches': 'nypor',
    'slice': 'skiva',
    'slices': 'skivor',
    'clove': 'klyfta',
    'cloves': 'klyftor',
    'piece': 'stycke',
    'pieces': 'stycken'
  }
  
  const lower = measure.toLowerCase().trim()
  return translations[lower] || measure
}

// Konvertera mått till numeriska värden
const parseMeasurement = (measureStr) => {
  if (!measureStr || measureStr.trim() === '') return { quantity: 1, unit: 'st' }
  
  const str = measureStr.trim().toLowerCase()
  
  // Hantera bråk (1/2, 1/4, etc)
  const fractionMatch = str.match(/(\d+)\/(\d+)/)
  if (fractionMatch) {
    const quantity = parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2])
    const unitMatch = str.replace(/[\d\s.\/]+/g, '').trim()
    const unit = unitMatch ? translateMeasure(unitMatch) : 'st'
    return { quantity, unit }
  }
  
  // Försök extrahera tal
  const numberMatch = str.match(/(\d+\.?\d*|\d*\.?\d+)/)
  const quantity = numberMatch ? parseFloat(numberMatch[1]) : 1
  
  // Extrahera enhet
  const unitMatch = str.replace(/[\d\s.\/]+/g, '').trim()
  const unit = unitMatch ? translateMeasure(unitMatch) : 'st'
  
  return { quantity, unit }
}

// Översätt svårighetsgrad
const getSwedishDifficulty = (ingredientCount) => {
  if (ingredientCount <= 6) return 'Lätt'
  if (ingredientCount <= 10) return 'Medel'
  return 'Svår'
}

// Översätt receptnamn till svenska och gör dem aptitliga
const translateRecipeName = (englishName, category, area) => {
  // Specifika översättningar för populära recept
  const translations = {
    // Kycklingrätter
    'Teriyaki Chicken Casserole': 'Saftig Teriyaki-Kycklinggryta',
    'Chicken Couscous': 'Kryddig Kycklingcouscous med Grönsaker',
    'Chicken Handi': 'Indisk Kyckling i Kryddig Sås',
    'Katsu Chicken curry': 'Japansk Katsu-Curry med Kyckling',
    'Kung Pao Chicken': 'Kinesisk Kung Pao Kyckling',
    'Chicken Fajitas': 'Mexikanska Kycklingfajitas',
    'Chicken Alfredo Primavera': 'Krämig Kycklingpasta Alfredo',
    'Jerk Chicken': 'Karibisk Jerk-Marinerad Kyckling',
    
    // Pasta
    'Spaghetti Bolognese': 'Klassisk Italiensk Köttfärssås',
    'Carbonara': 'Krämig Pasta Carbonara med Bacon',
    'Lasagne': 'Ugnsgratinerad Italiensk Lasagne',
    'Rigatoni with fennel and mascarpone': 'Krämig Rigatoni med Fänkål',
    'Pasta and Beans': 'Italiensk Pasta e Fagioli',
    'Seafood fideuà': 'Spansk Skaldjurspasta',
    'Fettuccine Alfredo': 'Klassisk Fettuccine Alfredo',
    
    // Nötkött
    'Beef and Mustard Pie': 'Mustig Nötköttspaj med Senap',
    'Beef Wellington': 'Festlig Oxfilé i Smördeg',
    'Beef Stroganoff': 'Krämig Beef Stroganoff',
    'Beef Brisket Pot Roast': 'Långstek Oxbringa',
    'Massaman Beef curry': 'Thailändsk Massaman-Curry med Nötkött',
    
    // Fisk & skaldjur
    'Salmon Prawn Risotto': 'Krämig Lax- och Räkrisotto',
    'Grilled Portuguese sardines': 'Grillad Sardiner på Portugisiskt Vis',
    'Tuna Nicoise': 'Fransk Tonnfiskssallad Niçoise',
    'Salmon Avocado Salad': 'Färsk Laxsallad med Avokado',
    'Mediterranean Pasta Salad': 'Medelhavspasta med Tonfisk',
    
    // Thaimat
    'Thai Green Curry': 'Thailändsk Grön Curry',
    'Pad Thai': 'Klassisk Pad Thai med Räkor',
    'Thai Red Curry': 'Thailändsk Röd Curry',
    'Tom Yum Soup': 'Het och Sur Thaisoppa Tom Yum',
    'Tom Kha Gai': 'Kryddig Kokossoppa med Kyckling',
    'Massaman Beef': 'Mild Massaman-Curry med Nötkött',
    'Pad See Ew': 'Wokad Ris-Nudlar Pad See Ew',
    'Thai Fried Rice': 'Thailändskt Stekt Ris',
    
    // Vegetariskt
    'Mushroom & Chestnut Rotolo': 'Italiensk Svamprulad',
    'Vegetarian Casserole': 'Vegetarisk Grönsaksgryta',
    'Vegan Lasagne': 'Vegansk Lasagne med Grönsaker',
    'Spicy Arrabiata Penne': 'Het Penne Arrabiata',
    
    // Frukost
    'Pancakes': 'Fluffiga Amerikanska Pannkakor',
    'Breakfast Potatoes': 'Stekt Frukostpotatis med Lök',
    'Full English Breakfast': 'Engelsk Frukost',
    
    // Dessert
    'Apple Frangipan Tart': 'Fransk Äppelpaj med Mandel',
    'Bakewell tart': 'Engelsk Mandelkaka Bakewell',
    'Chocolate Gateau': 'Rik Fransk Chokladtårta',
    'Banana Pancakes': 'Söta Bananpannkakor',
    'Apam balik': 'Malaysisk Pannkaka med Jordötter',
    'Apple & Blackberry Crumble': 'Äppel- och Björnbärspaj med Smuldeg'
  }
  
  // Returnera översättning om den finns
  if (translations[englishName]) {
    return translations[englishName]
  }
  
  // Annars, använd originalnamnet
  return englishName
}

// Hämta recept från TheMealDB API
export async function fetchPopularRecipes(limit = 50) {
  try {
    // Kolla cache först
    const cached = getCachedRecipes()
    if (cached && cached.length > 0) {
      console.log('📦 Använder cachade recept från internet')
      return cached // Returnera alla cachade recept, utan begränsning
    }
    
    console.log('🌐 Hämtar populära recept från internet...')
    
    // Hämta flera kategorier för variation
    const categories = ['Chicken', 'Beef', 'Pasta', 'Seafood', 'Vegetarian', 'Breakfast', 'Dessert']
    const areas = ['Thai', 'Swedish'] // Lägg till specifika områden
    const allRecipes = []
    const seenIds = new Set() // För att undvika dubbletter baserat på API-ID
    const seenNames = new Set() // För att undvika dubbletter baserat på receptnamn
    
    for (const category of categories) {
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`)
        const data = await response.json()
        
        if (data.meals) {
          // Ta 3 recept från varje kategori
          const categoryRecipes = data.meals.slice(0, 3)
          
          // Hämta fullständig info för varje recept
          for (const meal of categoryRecipes) {
            // Skippa om vi redan har detta recept
            if (seenIds.has(meal.idMeal)) {
              continue
            }
            
            try {
              const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
              const detailData = await detailResponse.json()
              
              if (detailData.meals && detailData.meals[0]) {
                const recipe = convertToSwedishRecipe(detailData.meals[0])
                // Skippa om vi redan har ett recept med samma namn
                if (!seenNames.has(recipe.name)) {
                  seenIds.add(meal.idMeal)
                  seenNames.add(recipe.name)
                  allRecipes.push(recipe)
                }
              }
              
              // Liten fördröjning för att inte överbelasta API:et
              await new Promise(resolve => setTimeout(resolve, 100))
            } catch (err) {
              console.warn(`Kunde inte hämta detaljer för ${meal.strMeal}:`, err)
            }
          }
        }
      } catch (err) {
        console.warn(`Kunde inte hämta recept från kategori ${category}:`, err)
      }
    }
    
    // Hämta recept från specifika områden (Thai, Swedish, etc.)
    for (const area of areas) {
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`)
        const data = await response.json()
        
        if (data.meals) {
          // Ta 5 recept från varje område för att säkerställa tillräcklig täckning
          const areaRecipes = data.meals.slice(0, 5)
          
          for (const meal of areaRecipes) {
            if (seenIds.has(meal.idMeal)) {
              continue
            }
            
            try {
              const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
              const detailData = await detailResponse.json()
              
              if (detailData.meals && detailData.meals[0]) {
                const recipe = convertToSwedishRecipe(detailData.meals[0])
                // Skippa om vi redan har ett recept med samma namn
                if (!seenNames.has(recipe.name)) {
                  seenIds.add(meal.idMeal)
                  seenNames.add(recipe.name)
                  allRecipes.push(recipe)
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 100))
            } catch (err) {
              console.warn(`Kunde inte hämta detaljer för ${meal.strMeal}:`, err)
            }
          }
        }
      } catch (err) {
        console.warn(`Kunde inte hämta recept från område ${area}:`, err)
      }
    }
    
    // Lägg till svenska fallback-recept om inga svenska recept hittades
    const swedishRecipes = allRecipes.filter(r => r.area === 'Swedish' || r.tags.includes('swedish'))
    if (swedishRecipes.length < 3) {
      allRecipes.push(...getSwedishFallbackRecipes())
    }
    
    // Cacha resultatet
    if (allRecipes.length > 0) {
      cacheRecipes(allRecipes)
      console.log(`✅ Hämtade ${allRecipes.length} recept från internet`)
      return allRecipes // Returnera alla recept, utan begränsning
    }
    
    // Om inga recept hämtades, returnera fallback
    console.warn('⚠️ Inga recept kunde hämtas, använder fallback-recept')
    return getFallbackRecipes()
    
  } catch (error) {
    console.error('❌ Kunde inte hämta recept från internet:', error)
    return getFallbackRecipes()
  }
}

// Konvertera TheMealDB-format till vårt svenska format
function convertToSwedishRecipe(meal) {
  const ingredients = []
  
  // TheMealDB har ingredienser som strIngredient1, strIngredient2, etc.
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    
    if (ingredient && ingredient.trim() !== '') {
      const { quantity, unit } = parseMeasurement(measure)
      
      ingredients.push({
        name: translateIngredient(ingredient),
        quantity: quantity,
        unit: unit
      })
    }
  }
  
  // Förkorta instruktioner om de är för långa
  let instructions = meal.strInstructions || 'Följ receptets instruktioner.'
  if (instructions.length > 500) {
    instructions = instructions.substring(0, 497) + '...'
  }
  
  // Generera tags baserat på kategori och område
  const tags = []
  if (meal.strCategory) tags.push(meal.strCategory.toLowerCase())
  if (meal.strArea && meal.strArea !== 'Unknown') tags.push(meal.strArea.toLowerCase())
  
  // Lägg till svenska tags baserat på ingredienser
  const ingredientNames = ingredients.map(i => i.name.toLowerCase()).join(' ')
  if (ingredientNames.includes('kyckling')) tags.push('kyckling')
  if (ingredientNames.includes('vegetar') || meal.strCategory === 'Vegetarian') tags.push('vegetariskt')
  if (ingredientNames.includes('pasta')) tags.push('pasta')
  if (ingredientNames.includes('snabb') || ingredients.length <= 6) tags.push('snabbt')
  
  return {
    id: `api-${meal.idMeal}`,
    name: translateRecipeName(meal.strMeal, meal.strCategory, meal.strArea),
    servings: 4,
    ingredients: ingredients,
    instructions: instructions,
    cookingTime: estimateCookingTime(ingredients.length),
    difficulty: getSwedishDifficulty(ingredients.length),
    tags: tags.slice(0, 4), // Max 4 tags
    category: meal.strCategory || 'Other',
    area: meal.strArea || 'International',
    image: meal.strMealThumb,
    source: 'TheMealDB',
    sourceUrl: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`
  }
}

// Uppskatta tillagningstid baserat på antal ingredienser
function estimateCookingTime(ingredientCount) {
  if (ingredientCount <= 5) return '15-20 minuter'
  if (ingredientCount <= 8) return '25-35 minuter'
  if (ingredientCount <= 12) return '40-50 minuter'
  return '60+ minuter'
}

// Cache-funktioner
function getCachedRecipes() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { recipes, timestamp, version } = JSON.parse(cached)
    const now = Date.now()
    
    // Kolla om cache är för gammal eller fel version
    if (version !== CACHE_VERSION || now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    return recipes
  } catch (error) {
    console.warn('Kunde inte läsa cache:', error)
    return null
  }
}

function cacheRecipes(recipes) {
  try {
    const cacheData = {
      recipes: recipes,
      timestamp: Date.now(),
      version: CACHE_VERSION
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('💾 Cachade recept för framtida användning')
  } catch (error) {
    console.warn('Kunde inte cacha recept:', error)
  }
}

// Rensa cache manuellt (kan användas för att tvinga uppdatering)
export function clearRecipeCache() {
  localStorage.removeItem(CACHE_KEY)
  console.log('🗑️ Receptcache rensad')
}

// Svenska husmanskost-recept som fallback
function getSwedishFallbackRecipes() {
  return [
    {
      id: 'swedish-1',
      name: 'Köttbullar med Brunsås',
      servings: 4,
      ingredients: [
        { name: 'köttfärs', quantity: 500, unit: 'g' },
        { name: 'ägg', quantity: 1, unit: 'stycke' },
        { name: 'brödsmulor', quantity: 1, unit: 'dl' },
        { name: 'mjölk', quantity: 1, unit: 'dl' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'smör', quantity: 50, unit: 'g' },
        { name: 'grädde', quantity: 2, unit: 'dl' },
        { name: 'soja', quantity: 1, unit: 'msk' }
      ],
      instructions: 'Blanda köttfärs, ägg, brödsmulor blötta i mjölk, hackad lök, salt och peppar. Rulla till bullar. Stek i smör tills genomstekta. Lägg åt sidan. Gör brunsås av stekskyarna, mjöl, buljong och grädde. Smaka av med soja. Servera med potatis, lingon och inlagd gurka.',
      cookingTime: '45 minuter',
      difficulty: 'Medel',
      tags: ['husmanskost', 'klassiskt', 'swedish'],
      category: 'Swedish',
      area: 'Swedish',
      source: 'Lokal databas'
    },
    {
      id: 'swedish-2',
      name: 'Pannbiff med Lök',
      servings: 4,
      ingredients: [
        { name: 'köttfärs', quantity: 600, unit: 'g' },
        { name: 'ägg', quantity: 1, unit: 'stycke' },
        { name: 'mjölk', quantity: 1, unit: 'dl' },
        { name: 'lök', quantity: 2, unit: 'stycken' },
        { name: 'smör', quantity: 50, unit: 'g' },
        { name: 'grädde', quantity: 2, unit: 'dl' }
      ],
      instructions: 'Blanda köttfärs, ägg, mjölk, salt och peppar. Forma till platta biffar. Stek i smör tills genomstekta. Lägg åt sidan. Skiva lök och stek mjuk. Häll på grädde och låt koka ihop. Lägg tillbaka biffarna och värm. Servera med potatis och grönsaker.',
      cookingTime: '30 minuter',
      difficulty: 'Lätt',
      tags: ['husmanskost', 'vardagsmat', 'swedish'],
      category: 'Swedish',
      area: 'Swedish',
      source: 'Lokal databas'
    },
    {
      id: 'swedish-3',
      name: 'Raggmunk med Fläsk',
      servings: 4,
      ingredients: [
        { name: 'potatis', quantity: 600, unit: 'g' },
        { name: 'ägg', quantity: 2, unit: 'stycken' },
        { name: 'mjölk', quantity: 2, unit: 'dl' },
        { name: 'mjöl', quantity: 1, unit: 'dl' },
        { name: 'fläsk', quantity: 400, unit: 'g' },
        { name: 'smör', quantity: 75, unit: 'g' }
      ],
      instructions: 'Riv potatisen grovt. Vispa ihop ägg, mjölk, mjöl, salt och peppar till en smet. Blanda i riven potatis. Stek fläsket knaprig, lägg åt sidan. Stek raggmunkarna i smör, ca 3 min per sida. Servera med stekt fläsk och lingonsylt.',
      cookingTime: '35 minuter',
      difficulty: 'Lätt',
      tags: ['husmanskost', 'klassiskt', 'swedish'],
      category: 'Swedish',
      area: 'Swedish',
      source: 'Lokal databas'
    },
    {
      id: 'swedish-4',
      name: 'Pytt i Panna',
      servings: 4,
      ingredients: [
        { name: 'potatis', quantity: 600, unit: 'g' },
        { name: 'kött', quantity: 300, unit: 'g' },
        { name: 'korv', quantity: 200, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'smör', quantity: 50, unit: 'g' },
        { name: 'ägg', quantity: 4, unit: 'stycken' }
      ],
      instructions: 'Skala och tärna potatis. Koka tills nästan möra. Tärna kött, korv och lök. Stek allt i smör på hög värme tills gyllenbrunt och knaprig. Krydda med salt och peppar. Stek äggulor. Servera med stekt ägg, rödbetssallad och inlagd gurka.',
      cookingTime: '30 minuter',
      difficulty: 'Lätt',
      tags: ['husmanskost', 'snabbt', 'swedish'],
      category: 'Swedish',
      area: 'Swedish',
      source: 'Lokal databas'
    }
  ]
}

// Fallback-recept om API misslyckas (använd befíntliga svenska recept)
function getFallbackRecipes() {
  return [
    {
      id: 'fallback-1',
      name: 'Krämig Pasta Carbonara',
      servings: 4,
      ingredients: [
        { name: 'pasta', quantity: 400, unit: 'g' },
        { name: 'bacon', quantity: 200, unit: 'g' },
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'parmesan', quantity: 100, unit: 'g' },
        { name: 'svartpeppar', quantity: 1, unit: 'tsk' }
      ],
      instructions: 'Koka pastan enligt anvisning. Stek bacon knaprig. Vispa ägg med riven parmesan. När pastan är klar, häll av vattnet och blanda direkt med äggblandningen (pastan ska vara het så äggen blir krämiga). Vänd ner bacon. Krydda med mycket svartpeppar.',
      cookingTime: '20 minuter',
      difficulty: 'Lätt',
      tags: ['pasta', 'snabbt', 'klassiskt', 'italienskt']
    },
    {
      id: 'fallback-2',
      name: 'Kycklingwok med Grönsaker',
      servings: 4,
      ingredients: [
        { name: 'kycklingfilé', quantity: 500, unit: 'g' },
        { name: 'broccoli', quantity: 300, unit: 'g' },
        { name: 'paprika', quantity: 2, unit: 'stycken' },
        { name: 'soja', quantity: 3, unit: 'msk' },
        { name: 'vitlök', quantity: 2, unit: 'klyftor' },
        { name: 'ingefära', quantity: 1, unit: 'msk' },
        { name: 'ris', quantity: 300, unit: 'g' }
      ],
      instructions: 'Koka ris. Skär kyckling i bitar och bryn i varm wokpanna. Tillsätt hackad vitlök och ingefära. Lägg i grönsakerna och wokar 4-5 min. Häll i soja och wokar ytterligare 2 min. Servera över ris.',
      cookingTime: '25 minuter',
      difficulty: 'Medel',
      tags: ['kyckling', 'asiatiskt', 'hälsosamt', 'wok']
    },
    {
      id: 'fallback-3',
      name: 'Klassisk Köttfärssås',
      servings: 4,
      ingredients: [
        { name: 'köttfärs', quantity: 500, unit: 'g' },
        { name: 'krossade tomater', quantity: 400, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'morot', quantity: 2, unit: 'stycken' },
        { name: 'vitlök', quantity: 2, unit: 'klyftor' },
        { name: 'tomatpuré', quantity: 2, unit: 'msk' },
        { name: 'pasta', quantity: 400, unit: 'g' }
      ],
      instructions: 'Bryn köttfärsen i en stekpanna. Tillsätt hackad lök, morötter och vitlök. Stek några minuter. Häll i tomatpuré, krossade tomater och krydda med oregano, basilika, salt och peppar. Låt puttra 20-30 min. Servera med nykokta pasta.',
      cookingTime: '45 minuter',
      difficulty: 'Lätt',
      tags: ['köttfärs', 'pasta', 'barnvänligt', 'klassiskt']
    }
  ]
}

// Hämta ett slumpmässigt recept
export async function fetchRandomRecipe() {
  try {
    const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php')
    const data = await response.json()
    
    if (data.meals && data.meals[0]) {
      return convertToSwedishRecipe(data.meals[0])
    }
  } catch (error) {
    console.error('Kunde inte hämta slumpmässigt recept:', error)
  }
  
  return null
}
