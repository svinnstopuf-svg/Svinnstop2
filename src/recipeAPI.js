// API för att hämta populära recept från internet
// Använder TheMealDB API (gratis, ingen API-nyckel krävs)

const CACHE_KEY = 'svinnstop_cached_recipes'
const CACHE_VERSION = 'v9' // Öka denna för att ogiltigförklara gammal cache
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 timmar

// Översättning från engelska till svenska
const translateIngredient = (ingredient) => {
  const translations = {
    // FIX: Lägg till fler specifika översättningar
    'chicken': 'kyckling',
    'chicken breast': 'kycklingfilé',
    'chicken thigh': 'kycklinglår',
    'beef': 'nötkött',
    'ground beef': 'köttfärs',
    'pork': 'fläsk',
    'fish': 'fisk',
    'salmon': 'lax',
    'shrimp': 'räkor',
    'prawns': 'räkor',
    'egg': 'ägg',
    'eggs': 'ägg',
    'milk': 'mjölk',
    'cream': 'grädde',
    'heavy cream': 'vispgrädde',
    'double cream': 'vispgrädde',
    'sour cream': 'gräddfil',
    'butter': 'smör',
    'cheese': 'ost',
    'parmesan': 'parmesan',
    'mozzarella': 'mozzarella',
    'feta': 'fetaost',
    'pasta': 'pasta',
    'spaghetti': 'spaghetti',
    'noodles': 'nudlar',
    'rice noodles': 'risnudlar',
    'rice': 'ris',
    'jasmine rice': 'jasminris',
    'potato': 'potatis',
    'potatoes': 'potatis',
    'sweet potato': 'sötpotatis',
    'tomato': 'tomat',
    'tomatoes': 'tomater',
    'cherry tomatoes': 'körsbärstomater',
    'tomato paste': 'tomatpuré',
    'tomato puree': 'tomatpuré',
    'crushed tomatoes': 'krossade tomater',
    'onion': 'lök',
    'onions': 'lök',
    'red onion': 'rödlök',
    'spring onion': 'salladslök',
    'shallot': 'schalottenlök',
    'garlic': 'vitlök',
    'garlic clove': 'vitlöksklyfta',
    'carrot': 'morot',
    'carrots': 'morötter',
    'broccoli': 'broccoli',
    'pepper': 'paprika',
    'bell pepper': 'paprika',
    'red pepper': 'röd paprika',
    'green pepper': 'grön paprika',
    'chili': 'chili',
    'chilli': 'chili',
    'mushroom': 'champinjoner',
    'mushrooms': 'champinjoner',
    'bread': 'bröd',
    'flour': 'mjöl',
    'plain flour': 'vetemjöl',
    'self-raising flour': 'bakpulvermjöl',
    'sugar': 'socker',
    'brown sugar': 'farinsocker',
    'caster sugar': 'strösocker',
    'icing sugar': 'florsocker',
    'salt': 'salt',
    'sea salt': 'havssalt',
    'pepper': 'peppar',
    'black pepper': 'svartpeppar',
    'white pepper': 'vitpeppar',
    // FIX: Specifika oljor istället för vagt "oljor"
    'oil': 'matolja',
    'olive oil': 'olivolja',
    'vegetable oil': 'rapsolja',
    'sunflower oil': 'solrosolja',
    'sesame oil': 'sesamolja',
    'coconut oil': 'kokosolja',
    'peanut oil': 'jordnötsolja',
    'oils': 'matolja', // FIX: Plural av oil
    'water': 'vatten',
    'lemon': 'citron',
    'lemon juice': 'citronsaft',
    'lime': 'lime',
    'lime juice': 'limesaft',
    'avocado': 'avokado',
    'banana': 'banan',
    'apple': 'äpple',
    'peanuts': 'jordnötter',
    'peanut butter': 'jordnötssmör',
    'spinach': 'spenat',
    'lettuce': 'sallad',
    'cucumber': 'gurka',
    'soy sauce': 'soja',
    'light soy sauce': 'ljus soja',
    'dark soy sauce': 'mörk soja',
    'fish sauce': 'fisksås',
    'oyster sauce': 'ostronsås',
    'ginger': 'ingefära',
    'fresh ginger': 'färsk ingefära',
    'parsley': 'persilja',
    'fresh parsley': 'färsk persilja',
    'basil': 'basilika',
    'fresh basil': 'färsk basilika',
    'oregano': 'oregano',
    'thyme': 'timjan',
    'rosemary': 'rosmarin',
    'coriander': 'koriander',
    'cilantro': 'koriander',
    'bacon': 'bacon',
    'streaky bacon': 'sidfläsk',
    'ham': 'skinka',
    'yogurt': 'yoghurt',
    'greek yogurt': 'turkisk yoghurt',
    'natural yogurt': 'naturell yoghurt',
    'honey': 'honung',
    'nuts': 'nötter',
    'coconut': 'kokos',
    'coconut milk': 'kokosmölk',
    'coconut cream': 'kokosgrädde',
    'desiccated coconut': 'kokos (torkad)',
    'corn': 'majs',
    'sweetcorn': 'majs',
    'mais': 'majs',
    'zucchini': 'zucchini',
    'courgette': 'zucchini',
    'aubergine': 'aubergine',
    'eggplant': 'aubergine',
    'cornstarch': 'majsstärkelse',
    'corn starch': 'majsstärkelse',
    // FIX: Vanliga felöversättningar från Google Translate
    'millilitre': 'milliliter',
    'millilitres': 'milliliter',
    'milliliter': 'milliliter',
    'milliliters': 'milliliter',
    'ml': 'ml',
    // FIX: "slabb" och andra oklarheter
    'stock': 'buljong',
    'chicken stock': 'kycklingbuljong',
    'vegetable stock': 'grönsaksbuljong',
    'beef stock': 'nötköttbuljong',
    'stock cube': 'buljongtärning',
    'bouillon': 'buljong',
    'broth': 'buljong',
    'wine': 'vin',
    'red wine': 'rödvin',
    'white wine': 'vitvin',
    'vinegar': 'vinäger',
    'white wine vinegar': 'vitvinvinäger',
    'balsamic vinegar': 'balsamvinäger',
    'rice vinegar': 'risvinäger'
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
    'millilitre': 'ml',
    'millilitres': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'litre': 'liter',
    'litres': 'liter',
    'liter': 'liter',
    'liters': 'liter',
    // FIX: Vanliga felöversättningar som blir "miljoner" eller "militär"
    'million': 'milliliter',
    'millions': 'milliliter',
    'miljoner': 'milliliter',
    'militär': 'milliliter',
    'military': 'milliliter',
    'g': 'g',
    'kg': 'kg',
    'pinch': 'nypa',
    'pinches': 'nypor',
    'slice': 'skiva',
    'slices': 'skivor',
    'clove': 'klyfta',
    'cloves': 'klyftor',
    'piece': 'stycke',
    'pieces': 'stycken',
    'whole': 'hel',
    'halved': 'halverad',
    'chopped': 'hackad',
    'diced': 'tärnad',
    'sliced': 'skivad',
    'to taste': 'efter smak',
    'as needed': 'efter behov',
    'goz': 'g',  // Felstavning av oz
    'grams': 'g',
    'gram': 'g',
    'drizzle': 'skål',
    'handful': 'näve',
    'bunch': 'knippe'
  }
  
  const lower = measure.toLowerCase().trim()
  
  // Försök hitta enhet i strängen
  for (const [eng, swe] of Object.entries(translations)) {
    if (lower.includes(eng)) {
      return swe
    }
  }
  
  return translations[lower] || measure
}

// HELT OMSKRIVEN: Korrekt måttkonvertering
const parseMeasurement = (measureStr) => {
  if (!measureStr || measureStr.trim() === '') return { quantity: 1, unit: 'st' }
  
  // DEBUG: Logga input
  const originalInput = measureStr
  
  const str = measureStr.trim().toLowerCase()
  
  // Steg 1: Hantera icke-numeriska mått
  if (str.includes('taste') || str.includes('garnish') || str.includes('serve') || str.includes('needed')) {
    return { quantity: 1, unit: 'efter smak' }
  }
  if (str.includes('drizzle') || str.includes('splash')) return { quantity: 1, unit: 'skål' }
  if (str.includes('handful')) return { quantity: 1, unit: 'näve' }
  if (str.includes('bunch')) return { quantity: 1, unit: 'knippe' }
  if (str.includes('pinch')) return { quantity: 1, unit: 'nypa' }
  
  // Steg 2: Extrahera tal (hantera bråk, decimaler, och heltal)
  let quantity = 1
  
  // Hantera bråk (1/2, 1/4, 3/4, etc)
  const fractionMatch = str.match(/(\d+)\s*\/\s*(\d+)/)
  if (fractionMatch) {
    quantity = parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2])
  } else {
    // Hantera decimaler och heltal
    const numberMatch = str.match(/(\d+\.?\d*|\d*\.?\d+)/)
    if (numberMatch) {
      quantity = parseFloat(numberMatch[1])
    }
  }
  
  // Steg 3: Identifiera enhet OCH konvertera till metriskt
  
  // Viktenhet: oz (ounce) -> gram
  if ((str.includes('oz') || str.includes('ounce')) && !str.includes('goz')) {
    return { quantity: Math.round(quantity * 28.35), unit: 'g' }
  }
  
  // Viktenhet: lb (pound) -> gram
  if (str.includes('lb') || str.includes('pound')) {
    return { quantity: Math.round(quantity * 453.592), unit: 'g' }
  }
  
  // Volymenhet: cup -> dl
  if (str.includes('cup')) {
    return { quantity: Math.round(quantity * 2.366 * 10) / 10, unit: 'dl' }
  }
  
  // Volymenhet: tablespoon -> msk
  if (str.includes('tablespoon') || str.includes('tbsp')) {
    return { quantity, unit: 'msk' }
  }
  
  // Volymenhet: teaspoon -> tsk
  if (str.includes('teaspoon') || str.includes('tsp')) {
    return { quantity, unit: 'tsk' }
  }
  
  // Volymenhet: ml/liter
  if (str.includes('ml') || str.includes('millilitre')) {
    return { quantity, unit: 'ml' }
  }
  if (str.includes('litre') || str.includes('liter')) {
    return { quantity, unit: 'liter' }
  }
  
  // Viktenhet: gram/kg (redan metriskt)
  if (str.includes('gram') || (str.includes('g') && !str.includes('oz'))) {
    return { quantity, unit: 'g' }
  }
  if (str.includes('kg') || str.includes('kilogram')) {
    return { quantity, unit: 'kg' }
  }
  
  // Styckenheter
  if (str.includes('slice')) {
    return { quantity, unit: quantity === 1 ? 'skiva' : 'skivor' }
  }
  if (str.includes('clove')) {
    return { quantity, unit: quantity === 1 ? 'klyfta' : 'klyftor' }
  }
  if (str.includes('piece')) {
    return { quantity, unit: quantity === 1 ? 'stycke' : 'stycken' }
  }
  if (str.includes('whole')) {
    return { quantity, unit: 'hel' }
  }
  
  // Standard: Använd translateMeasure som fallback
  const unitMatch = str.replace(/[\d\s.\/]+/g, '').trim()
  const unit = unitMatch ? translateMeasure(unitMatch) : 'st'
  
  const result = { quantity, unit }
  
  // DEBUG: Logga endast om det är ett konstigt resultat (men inte gram/kg över 1000)
  if (quantity > 10000 && unit !== 'g' && unit !== 'kg') {
    console.warn('⚠️ Måttkonvertering:', {
      input: originalInput,
      output: result
    })
  }
  
  return result
}

// Översätt svårighetsgrad
const getSwedishDifficulty = (ingredientCount) => {
  if (ingredientCount <= 6) return 'Lätt'
  if (ingredientCount <= 10) return 'Medel'
  return 'Svår'
}

// Översätt receptnamn till svenska och gör dem aptitliga
const translateRecipeName = (englishName, category, area) => {
  // OMFATTANDE ÖVERSÄTTNINGAR baserat på TheMealDB API:ets faktiska recept
  const translations = {
    // === KYCKLINGRÄTTER ===
    'Teriyaki Chicken Casserole': 'Teriyaki-Kycklinggryta',
    'Chicken Couscous': 'Kycklingcouscous med Grönsaker',
    'Chicken Handi': 'Indisk Kycklinggryta',
    'Katsu Chicken curry': 'Japansk Kyckling-Katsu Curry',
    'Kung Pao Chicken': 'Kung Pao Kyckling',
    'Kung Po Chicken': 'Kung Pao Kyckling',
    'Chicken Fajitas': 'Kycklingfajitas',
    'Chicken Alfredo Primavera': 'Kyckling Alfredo med Grönsaker',
    'Jerk Chicken': 'Jerk-Marinerad Kyckling',
    'Chicken Marengo': 'Kycklinggryta Marengo',
    'Chicken Congee': 'Kinesisk Risgröt med Kyckling',
    'Chicken Basquaise': 'Baskisk Kycklinggryta',
    'Brown Stew Chicken': 'Karibisk Kycklinggryta',
    'Chicken Enchilada Casserole': 'Kycklingenchilada-Gratäng',
    'Honey Teriyaki Chicken': 'Honung-Teriyaki Kyckling',
    'Kentucky Fried Chicken': 'Friterad Kyckling',
    'Chicken Parmentier': 'Kycklingpirå',
    'Chicken & mushroom Hotpot': 'Kyckling- och Svampgryta',
    'Chicken Quinoa Greek Salad': 'Grekisk Kycklings Quinoasallad',
    'Thai Green Curry': 'Thailändsk Grön Curry',
    'Massaman Beef': 'Massaman-Curry med Nötkött',
    
    
    // === PASTA ===
    'Spaghetti Bolognese': 'Spaghetti Bolognese',
    'Carbonara': 'Pasta Carbonara',
    'Lasagne': 'Lasagne',
    'Lasagna': 'Lasagne',
    'Rigatoni with fennel and mascarpone': 'Rigatoni med Fänkål och Mascarpone',
    'Pasta and Beans': 'Pasta med Bönor',
    'Seafood fideùà': 'Skaldjurspasta',
    'Seafood fideuà': 'Skaldjurspasta',
    'Fettuccine Alfredo': 'Fettuccine Alfredo',
    'Pasta with Pesto': 'Pasta med Pesto',
    'Penne Arrabiata': 'Penne Arrabiata',
    'Spicy Arrabiata Penne': 'Stark Penne Arrabiata',
    'Spinach & Ricotta Cannelloni': 'Cannelloni med Spenat och Ricotta',
    
    // === NÖTKÖTT ===
    'Beef and Mustard Pie': 'Nötköttspaj med Senap',
    'Beef Wellington': 'Oxfilé Wellington',
    'Beef Stroganoff': 'Biff Stroganoff',
    'Beef Brisket Pot Roast': 'Långstek Oxbringa',
    'Massaman Beef curry': 'Massaman-Curry med Nötkött',
    'Massaman Beef': 'Massaman-Curry med Nötkött',
    'Beef Banh Mi Bowls': 'Vietnamesisk Nötköttskål',
    'Beef Dumpling Stew': 'Nötköttsgryta med Dumplings',
    'Beef Sunday Roast': 'Stek med Nötkött',
    'Beef Bourguignon': 'Boeuf Bourguignon',
    'Beef Lo Mein': 'Wokad Nötkött med Nudlar',
    
    // === FISK & SKALDJUR ===
    'Salmon Prawn Risotto': 'Risotto med Lax och Räkor',
    'Grilled Portuguese sardines': 'Grillerade Sardiner',
    'Portuguese fish stew': 'Portugisisk Fiskgryta',
    'Tuna Nicoise': 'Sallad Niçoise med Tonfisk',
    'Salmon Avocado Salad': 'Laxsallad med Avokado',
    'Mediterranean Pasta Salad': 'Medelhavspasta',
    'Grilled Mac and Cheese Sandwich': 'Grillad Macka med Ost',
    'Kedgeree': 'Rökt Fisk med Ris',
    
    // === THAIMAT ===
    'Thai Green Curry': 'Grön Thaicurry',
    'Pad Thai': 'Pad Thai',
    'Thai Red Curry': 'Röd Thaicurry',
    'Tom Yum Soup': 'Tom Yum-Soppa',
    'Tom Kha Gai': 'Tom Kha Gai',
    'Pad See Ew': 'Pad See Ew',
    'Thai Fried Rice': 'Stekt Ris på Thailändskt Vis',
    
    // === VEGETARISKT ===
    'Mushroom & Chestnut Rotolo': 'Vegetarisk Pastarulle med Svamp',
    'Vegetarian Casserole': 'Vegetarisk Grönsaksgryta',
    'Vegan Lasagne': 'Vegansk Lasagne',
    'Spicy Arrabiata Penne': 'Stark Penne Arrabiata',
    'Vegetarian Chilli': 'Vegetarisk Chili',
    'Brie wrapped in prosciutto & brioche': 'Inbakad Brie',
    
    // === FRUKOST ===
    'Pancakes': 'Pannkakor',
    'Breakfast Potatoes': 'Frukostpotatis',
    'Full English Breakfast': 'Engelsk Frukost',
    'English Breakfast': 'Engelsk Frukost',
    'Bread omelette': 'Omelett med Bröd',
    'French Toast': 'Fransk Toast',
    
    // === DESSERT ===
    'Apple Frangipan Tart': 'Äppelpaj med Mandel',
    'Apple Frangipane Tart': 'Äppelpaj med Mandel',
    'Bakewell tart': 'Bakewell-Tårta',
    'Bakewell Tart': 'Bakewell-Tårta',
    'Chocolate Gateau': 'Chokladtårta',
    'Banana Pancakes': 'Bananpannkakor',
    'Apam balik': 'Malaysisk Pannkaka',
    'Apple & Blackberry Crumble': 'Äppel- och Björnbärspaj',
    'Carrot Cake': 'Morotskaka',
    'Chocolate Avocado Mousse': 'Chokladmousse med Avokado',
    'Key Lime Pie': 'Key Lime Pie',
    'Sticky Toffee Pudding': 'Sticky Toffee Pudding',
    'Treacle Tart': 'Sirapstårta',
    
    // === ÖVRIGT (VANLIGA RECEPT FRÅN API) ===
    'Corba': 'Turkisk Linsoppa',
    'Burek': 'Burek',
    'Tamiya': 'Egyptiska Falafel',
    'Dal fry': 'Indisk Linsärt',
    'Poutine': 'Kanadensisk Poutine',
    'Timbits': 'Kanadensiska Munkar',
    'Wontons': 'Wontons',
    'Kafteji': 'Tunisisk Grönsaksgryta',
    'Big Mac': 'Hamburgare',
    'Chicken Ham and Leek Pie': 'Kycklingpaj med Skinka och Purjolök',
    'Lamb tomato and sweet spices': 'Lamm med Tomat och Kryddor',
    'Lamb Biryani': 'Lamm Biryani',
    'Lamb Rogan josh': 'Lamm Rogan Josh',
    'Pork Cassoulet': 'Fransk Böngryta med Fläsk',
    'Rappie Pie': 'Rappie Pie',
    'Split Pea Soup': 'Ärtsoppa',
    'Three Fish Pie': 'Fiskpaj med Tre Sorters Fisk',
    'Sushi': 'Sushi',
    'Teriyaki Chicken': 'Teriyaki-Kyckling',
    'Mee goreng mamak': 'Malaysisk Wok-Nudlar'
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

// FIX: Exportera alla lokala svenska recept (skippa API helt)
export function getAllLocalSwedishRecipes() {
  // Kombinera alla lokala recept
  const allRecipes = [
    ...getSwedishFallbackRecipes(),
    ...getFallbackRecipes(),
    ...getAdditionalSwedishRecipes()
  ]
  
  return allRecipes
}

// Lägg till fler hårdkodade svenska recept
function getAdditionalSwedishRecipes() {
  return [
    {
      id: 'swedish-5',
      name: 'Ärtsoppa med Fläsk',
      servings: 4,
      ingredients: [
        { name: 'gula ärtor', quantity: 500, unit: 'g' },
        { name: 'rökt fläsk', quantity: 400, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'morot', quantity: 2, unit: 'stycken' },
        { name: 'timjan', quantity: 2, unit: 'msk' }
      ],
      instructions: 'Blötlägg ärtor över natten. Koka ärtor med fläsk, lök och morötter i 2 timmar. Ta ut fläsket och skiva. Mixa soppan slät. Servera med senap och knäckebröd.',
      cookingTime: '2.5 timmar',
      difficulty: 'Medel',
      tags: ['soppa', 'husmanskost', 'swedish']
    },
    {
      id: 'swedish-6',
      name: 'Stekt Strömming',
      servings: 2,
      ingredients: [
        { name: 'strömmingsfilé', quantity: 400, unit: 'g' },
        { name: 'mjöl', quantity: 1, unit: 'dl' },
        { name: 'smör', quantity: 50, unit: 'g' },
        { name: 'potatis', quantity: 600, unit: 'g' },
        { name: 'gräddfil', quantity: 2, unit: 'dl' }
      ],
      instructions: 'Vänd strömmingsfiléerna i mjöl, salt och peppar. Stek i smör 2-3 min per sida. Servera med kokt potatis, lingon och gräddfil.',
      cookingTime: '25 minuter',
      difficulty: 'Lätt',
      tags: ['fisk', 'husmanskost', 'swedish']
    },
    {
      id: 'swedish-7',
      name: 'Janssons Frestelse',
      servings: 4,
      ingredients: [
        { name: 'potatis', quantity: 800, unit: 'g' },
        { name: 'ansovis', quantity: 1, unit: 'burk' },
        { name: 'lök', quantity: 2, unit: 'stycken' },
        { name: 'grädde', quantity: 3, unit: 'dl' },
        { name: 'smör', quantity: 50, unit: 'g' }
      ],
      instructions: 'Sätt ugn på 200°C. Skala och strimla potatis och lök. Varva potatis, lök och ansjovis i smörd form. Häll över grädde. Grädda 60 min tills gyllene.',
      cookingTime: '75 minuter',
      difficulty: 'Lätt',
      tags: ['gratäng', 'husmanskost', 'swedish']
    },
    {
      id: 'swedish-8',
      name: 'Inkokt Lax med Dillstuva',
      servings: 4,
      ingredients: [
        { name: 'laxfilé', quantity: 600, unit: 'g' },
        { name: 'smör', quantity: 50, unit: 'g' },
        { name: 'mjöl', quantity: 3, unit: 'msk' },
        { name: 'fiskbuljong', quantity: 5, unit: 'dl' },
        { name: 'dill', quantity: 1, unit: 'knippe' }
      ],
      instructions: 'Koka laxen i lätt saltat vatten 8-10 min. Gör en vit sås av smör, mjöl och buljong. Tillsatt hackad dill. Servera med kokt potatis.',
      cookingTime: '30 minuter',
      difficulty: 'Medel',
      tags: ['fisk', 'husmanskost', 'swedish']
    },
    {
      id: 'swedish-9',
      name: 'Kalops',
      servings: 6,
      ingredients: [
        { name: 'nötkött', quantity: 800, unit: 'g' },
        { name: 'lök', quantity: 3, unit: 'stycken' },
        { name: 'morot', quantity: 3, unit: 'stycken' },
        { name: 'lagerblad', quantity: 3, unit: 'stycken' },
        { name: 'smör', quantity: 50, unit: 'g' }
      ],
      instructions: 'Skär köttet i bitar. Bryn i smör. Tillsatt lök, morots skivor, lagerblad, salt och peppar. Häll på vatten och sjud 2 timmar. Servera med kokt potatis och rödbetssallad.',
      cookingTime: '2.5 timmar',
      difficulty: 'Medel',
      tags: ['gryta', 'husmanskost', 'swedish']
    },
    {
      id: 'extra-1',
      name: 'Kryddig Linssoppa',
      servings: 4,
      ingredients: [
        { name: 'röda linser', quantity: 300, unit: 'g' },
        { name: 'tomat', quantity: 400, unit: 'g' },
        { name: 'kokosmjölk', quantity: 4, unit: 'dl' },
        { name: 'currypasta', quantity: 2, unit: 'msk' },
        { name: 'spenat', quantity: 100, unit: 'g' }
      ],
      instructions: 'Stek currypasta i olja. Tillsatt linser, krossade tomater och grönsaksbuljong. Sjud 20 min. Rör i kokosmjölk och spenat. Servera med naan-bröd.',
      cookingTime: '35 minuter',
      difficulty: 'Lätt',
      tags: ['soppa', 'vegetariskt', 'indiskt']
    },
    {
      id: 'extra-2',
      name: 'Laxpasta med Spenat',
      servings: 4,
      ingredients: [
        { name: 'pasta', quantity: 400, unit: 'g' },
        { name: 'rökt lax', quantity: 200, unit: 'g' },
        { name: 'spenat', quantity: 150, unit: 'g' },
        { name: 'crème fraiche', quantity: 2, unit: 'dl' },
        { name: 'citron', quantity: 1, unit: 'stycke' }
      ],
      instructions: 'Koka pastan. Stek spenat i smör. Tillsatt crème fraiche, lax i bitar och citronsaft. Värm. Blanda med pastan. Toppa med dill.',
      cookingTime: '20 minuter',
      difficulty: 'Lätt',
      tags: ['pasta', 'fisk', 'snabbt']
    },
    {
      id: 'extra-3',
      name: 'Halloumiburgare',
      servings: 4,
      ingredients: [
        { name: 'halloumi', quantity: 400, unit: 'g' },
        { name: 'hamburgerbröd', quantity: 4, unit: 'stycken' },
        { name: 'tomat', quantity: 2, unit: 'stycken' },
        { name: 'sallad', quantity: 1, unit: 'huvud' },
        { name: 'tzatziki', quantity: 2, unit: 'dl' }
      ],
      instructions: 'Skiva halloumin. Stek i torr panna tills gyllene. Rosta brödet. Bygg burgare med sallad, tomat, halloumi och tzatziki.',
      cookingTime: '15 minuter',
      difficulty: 'Lätt',
      tags: ['vegetariskt', 'snabbt', 'lunch']
    },
    {
      id: 'extra-4',
      name: 'Thailaändsk Kokosgrönsaksgryta',
      servings: 4,
      ingredients: [
        { name: 'kokosmjölk', quantity: 4, unit: 'dl' },
        { name: 'grön currypasta', quantity: 3, unit: 'msk' },
        { name: 'broccoli', quantity: 300, unit: 'g' },
        { name: 'paprika', quantity: 2, unit: 'stycken' },
        { name: 'jasminris', quantity: 300, unit: 'g' }
      ],
      instructions: 'Koka ris. Fräs currypasta. Tillsatt kokosmjölk och grönsaker. Sjud 10 min. Smaka av med fisksås och lime. Servera över ris med koriander.',
      cookingTime: '25 minuter',
      difficulty: 'Lätt',
      tags: ['vegetariskt', 'thailändskt', 'gryta']
    },
    {
      id: 'extra-5',
      name: 'Falukorvsgratäng',
      servings: 4,
      ingredients: [
        { name: 'falukorv', quantity: 500, unit: 'g' },
        { name: 'makaroner', quantity: 400, unit: 'g' },
        { name: 'tomat', quantity: 400, unit: 'g' },
        { name: 'räksmör', quantity: 200, unit: 'g' },
        { name: 'ost', quantity: 150, unit: 'g' }
      ],
      instructions: 'Sätt ugn på 200°C. Koka makaroner. Blanda med skivad korv, krossade tomater och räksmör. Lägg i form. Strö ost på. Grädda 25 min.',
      cookingTime: '40 minuter',
      difficulty: 'Lätt',
      tags: ['barnvänligt', 'gratäng', 'vardagsmat']
    },
    {
      id: 'extra-6',
      name: 'Ugnsbakad Lax med Citron',
      servings: 4,
      ingredients: [
        { name: 'laxfilé', quantity: 600, unit: 'g' },
        { name: 'citron', quantity: 2, unit: 'stycken' },
        { name: 'dill', quantity: 1, unit: 'knippe' },
        { name: 'olivolja', quantity: 3, unit: 'msk' },
        { name: 'potatis', quantity: 800, unit: 'g' }
      ],
      instructions: 'Sätt ugn på 200°C. Linjera långpanna med bakplåtspapper. Lägg laxen på pappret, ringla olivolja, salt och peppar. Lägg citronskivor och dill på. Baka 15-20 min. Servera med kokt potatis.',
      cookingTime: '30 minuter',
      difficulty: 'Lätt',
      tags: ['fisk', 'hälsosamt', 'snabbt']
    },
    {
      id: 'extra-7',
      name: 'Kebabpizza',
      servings: 4,
      ingredients: [
        { name: 'pizzadeg', quantity: 400, unit: 'g' },
        { name: 'kebabkött', quantity: 300, unit: 'g' },
        { name: 'tomatsås', quantity: 2, unit: 'dl' },
        { name: 'ost', quantity: 300, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'kebabsås', quantity: 2, unit: 'dl' }
      ],
      instructions: 'Sätt ugn på 250°C. Kavla ut degen och bred på tomatsås. Strö ost. Grilla kebabköttet och lägg på pizzan med skivad lök. Grilla 10-12 min. Ringla kebabsås över.',
      cookingTime: '25 minuter',
      difficulty: 'Medel',
      tags: ['pizza', 'snabbt', 'festmat']
    },
    {
      id: 'extra-8',
      name: 'Fiskgratäng',
      servings: 4,
      ingredients: [
        { name: 'torskfilé', quantity: 600, unit: 'g' },
        { name: 'räkor', quantity: 200, unit: 'g' },
        { name: 'grädde', quantity: 3, unit: 'dl' },
        { name: 'dill', quantity: 1, unit: 'knippe' },
        { name: 'potatis', quantity: 800, unit: 'g' },
        { name: 'ströbröd', quantity: 1, unit: 'dl' }
      ],
      instructions: 'Sätt ugn på 200°C. Koka potatis och skiva. Varva fisk, räkor och potatis i smörd form. Vispa grädde med hackad dill, salt och peppar. Häll över. Strö ströbröd. Grädda 35-40 min.',
      cookingTime: '60 minuter',
      difficulty: 'Medel',
      tags: ['fisk', 'gratäng', 'festmat']
    },
    {
      id: 'extra-9',
      name: 'Tacos med Köttfärs',
      servings: 4,
      ingredients: [
        { name: 'köttfärs', quantity: 500, unit: 'g' },
        { name: 'tacokrydda', quantity: 1, unit: 'påse' },
        { name: 'tacoskal', quantity: 12, unit: 'stycken' },
        { name: 'sallad', quantity: 1, unit: 'huvud' },
        { name: 'tomat', quantity: 3, unit: 'stycken' },
        { name: 'gräddfil', quantity: 2, unit: 'dl' },
        { name: 'ost', quantity: 200, unit: 'g' }
      ],
      instructions: 'Bryn köttfärs. Tillsatt tacokrydda och vatten enligt förpackning. Sjud 10 min. Värm tacoskalen. Skiva sallad och tomat. Riv ost. Bygg tacos med alla tillbehör.',
      cookingTime: '20 minuter',
      difficulty: 'Lätt',
      tags: ['mexikanskt', 'barnvänligt', 'snabbt']
    },
    {
      id: 'extra-10',
      name: 'Flygande Jakob',
      servings: 4,
      ingredients: [
        { name: 'kyckling', quantity: 600, unit: 'g' },
        { name: 'bacon', quantity: 200, unit: 'g' },
        { name: 'bananer', quantity: 2, unit: 'stycken' },
        { name: 'chilisås', quantity: 1, unit: 'dl' },
        { name: 'grädde', quantity: 3, unit: 'dl' },
        { name: 'jordötter', quantity: 1, unit: 'dl' },
        { name: 'ris', quantity: 300, unit: 'g' }
      ],
      instructions: 'Koka ris. Koka och strimla kyckling. Stek bacon knaprig. Sätt ugn på 225°C. Varva kyckling, bacon och banan i form. Vispa grädde med chilisås. Häll över. Strö jordötter. Grädda 20 min. Servera med ris.',
      cookingTime: '45 minuter',
      difficulty: 'Medel',
      tags: ['kyckling', 'klassiskt', 'swedish']
    },
    {
      id: 'extra-11',
      name: 'Lins- och Sötpotatissoppa',
      servings: 4,
      ingredients: [
        { name: 'röda linser', quantity: 250, unit: 'g' },
        { name: 'sötpotatis', quantity: 400, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'vitlök', quantity: 2, unit: 'klyftor' },
        { name: 'kokosmjölk', quantity: 4, unit: 'dl' },
        { name: 'grönsaksbuljong', quantity: 5, unit: 'dl' }
      ],
      instructions: 'Skala och tärna sötpotatis. Fräs hackad lök och vitlök. Tillsatt linser, sötpotatis och buljong. Koka 20 min. Häll i kokosmjölk och mixa slät. Smaka av med salt, peppar och lime.',
      cookingTime: '35 minuter',
      difficulty: 'Lätt',
      tags: ['soppa', 'vegetariskt', 'hälsosamt']
    },
    {
      id: 'extra-12',
      name: 'Citronkyckling med Ris',
      servings: 4,
      ingredients: [
        { name: 'kycklingfilé', quantity: 600, unit: 'g' },
        { name: 'citron', quantity: 2, unit: 'stycken' },
        { name: 'honung', quantity: 2, unit: 'msk' },
        { name: 'vitlök', quantity: 3, unit: 'klyftor' },
        { name: 'ris', quantity: 300, unit: 'g' },
        { name: 'grönsaker', quantity: 300, unit: 'g' }
      ],
      instructions: 'Koka ris. Skär kyckling i bitar. Marinera i citronsaft, honung, vitlök, salt och peppar i 15 min. Stek kycklingen 6-8 min. Wokar grönsaker. Servera allt tillsammans.',
      cookingTime: '30 minuter',
      difficulty: 'Lätt',
      tags: ['kyckling', 'hälsosamt', 'snabbt']
    },
    {
      id: 'extra-13',
      name: 'Rostbiff med Bearnaisesås',
      servings: 4,
      ingredients: [
        { name: 'nötkött', quantity: 800, unit: 'g' },
        { name: 'bearnaisesås', quantity: 2, unit: 'dl' },
        { name: 'potatis', quantity: 800, unit: 'g' },
        { name: 'gröna bönor', quantity: 300, unit: 'g' },
        { name: 'smör', quantity: 50, unit: 'g' }
      ],
      instructions: 'Sätt ugn på 150°C. Bryn köttet i smör på alla sidor. Stek i ugn till 52-55°C kärntemperatur (medium). Vila 10 min. Koka potatis och bönor. Skiva köttet. Servera med bearnaisesås.',
      cookingTime: '45 minuter',
      difficulty: 'Medel',
      tags: ['nötkött', 'festmat', 'klassiskt']
    },
    {
      id: 'extra-14',
      name: 'Tonfiskpasta',
      servings: 4,
      ingredients: [
        { name: 'pasta', quantity: 400, unit: 'g' },
        { name: 'tonfisk', quantity: 2, unit: 'burkar' },
        { name: 'tomatsås', quantity: 4, unit: 'dl' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'olivolja', quantity: 2, unit: 'msk' },
        { name: 'basilika', quantity: 1, unit: 'kruka' }
      ],
      instructions: 'Koka pasta. Fräs hackad lök i olivolja. Tillsatt tomatsås och tonfisk. Sjud 5 min. Krydda med salt, peppar och basilika. Blanda med pastan. Servera med riven parmesan.',
      cookingTime: '20 minuter',
      difficulty: 'Lätt',
      tags: ['pasta', 'snabbt', 'fisk']
    },
    {
      id: 'extra-15',
      name: 'Shakshouka',
      servings: 2,
      ingredients: [
        { name: 'ägg', quantity: 4, unit: 'stycken' },
        { name: 'tomat', quantity: 400, unit: 'g' },
        { name: 'paprika', quantity: 2, unit: 'stycken' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'vitlök', quantity: 2, unit: 'klyftor' },
        { name: 'kummin', quantity: 1, unit: 'tsk' },
        { name: 'bröd', quantity: 4, unit: 'skivor' }
      ],
      instructions: 'Fräs hackad lök, paprika och vitlök. Tillsatt krossade tomater, kummin, paprikapulver, salt och peppar. Sjud 10 min. Gör 4 hål och knäck ner äggen. Täck och låt äggen stelna 5-7 min. Servera med bröd.',
      cookingTime: '25 minuter',
      difficulty: 'Lätt',
      tags: ['vegetariskt', 'frukost', 'medelhavs']
    },
    {
      id: 'extra-16',
      name: 'Korv Stroganoff Deluxe',
      servings: 4,
      ingredients: [
        { name: 'falukorv', quantity: 500, unit: 'g' },
        { name: 'champinjoner', quantity: 250, unit: 'g' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'tomatpuré', quantity: 2, unit: 'msk' },
        { name: 'grädde', quantity: 3, unit: 'dl' },
        { name: 'soja', quantity: 1, unit: 'msk' },
        { name: 'ris', quantity: 300, unit: 'g' }
      ],
      instructions: 'Koka ris. Skär korv i remsor. Skiva champinjoner och lök. Stek korv, lägg åt sidan. Stek champinjoner och lök. Tillsatt tomatpuré och grädde. Sjud 5 min. Tillsatt korv och soja. Servera med ris.',
      cookingTime: '30 minuter',
      difficulty: 'Lätt',
      tags: ['vardagsmat', 'barnvänligt', 'snabbt']
    },
    {
      id: 'extra-17',
      name: 'Pulled Chicken Bowl',
      servings: 4,
      ingredients: [
        { name: 'kycklinglår', quantity: 600, unit: 'g' },
        { name: 'bbq-sås', quantity: 2, unit: 'dl' },
        { name: 'ris', quantity: 300, unit: 'g' },
        { name: 'majs', quantity: 1, unit: 'burk' },
        { name: 'svarta bönor', quantity: 1, unit: 'burk' },
        { name: 'avokado', quantity: 2, unit: 'stycken' },
        { name: 'lime', quantity: 2, unit: 'stycken' }
      ],
      instructions: 'Koka kycklinglåren i vatten 30 min. Riv köttet med två gafflar. Blanda med bbq-sås. Koka ris. Skölj majs och bönor. Bygg bowls med ris, kyckling, majs, bönor och avokado. Pressa lime över.',
      cookingTime: '45 minuter',
      difficulty: 'Lätt',
      tags: ['kyckling', 'hälsosamt', 'amerikanskt']
    },
    {
      id: 'extra-18',
      name: 'Vegetarisk Lasagne',
      servings: 6,
      ingredients: [
        { name: 'lasagneplattor', quantity: 12, unit: 'stycken' },
        { name: 'spenat', quantity: 400, unit: 'g' },
        { name: 'ricotta', quantity: 400, unit: 'g' },
        { name: 'tomatsås', quantity: 6, unit: 'dl' },
        { name: 'mozzarella', quantity: 300, unit: 'g' },
        { name: 'parmesan', quantity: 100, unit: 'g' }
      ],
      instructions: 'Sätt ugn på 200°C. Blanda ricotta med hackad spenat, salt och peppar. Varva tomatsås, lasagneplattor, ricottablandning och riven mozzarella i smörd form. Avsluta med ost. Grädda 40 min. Vila 10 min innan servering.',
      cookingTime: '65 minuter',
      difficulty: 'Medel',
      tags: ['vegetariskt', 'gratäng', 'italienskt']
    },
    {
      id: 'extra-19',
      name: 'Kycklingspätt',
      servings: 4,
      ingredients: [
        { name: 'kycklingfilé', quantity: 600, unit: 'g' },
        { name: 'paprika', quantity: 2, unit: 'stycken' },
        { name: 'lök', quantity: 1, unit: 'stycke' },
        { name: 'champinjoner', quantity: 200, unit: 'g' },
        { name: 'soja', quantity: 3, unit: 'msk' },
        { name: 'ris', quantity: 300, unit: 'g' }
      ],
      instructions: 'Koka ris. Skär kyckling, paprika, lök och champinjoner i bitar. Wokar kyckling först, lägg åt sidan. Wokar grönsaker 5 min. Tillsatt kyckling och soja. Wokar 2 min till. Servera med ris.',
      cookingTime: '25 minuter',
      difficulty: 'Lätt',
      tags: ['kyckling', 'wok', 'snabbt']
    },
    {
      id: 'extra-20',
      name: 'Falafel med Tzatziki',
      servings: 4,
      ingredients: [
        { name: 'kikärtor', quantity: 400, unit: 'g' },
        { name: 'vitlök', quantity: 3, unit: 'klyftor' },
        { name: 'koriander', quantity: 1, unit: 'knippe' },
        { name: 'kummin', quantity: 1, unit: 'tsk' },
        { name: 'pitabröd', quantity: 4, unit: 'stycken' },
        { name: 'tzatziki', quantity: 3, unit: 'dl' },
        { name: 'sallad', quantity: 200, unit: 'g' }
      ],
      instructions: 'Mixa kikärtor, vitlök, koriander, kummin, salt och peppar till en deg. Forma till bollar. Stek i olja 3-4 min per sida. Värm pitabröd. Fyll med falafel, sallad och tzatziki.',
      cookingTime: '30 minuter',
      difficulty: 'Medel',
      tags: ['vegetariskt', 'medelhavs', 'hälsosamt']
    },
    {
      id: 'dessert-1',
      name: 'Kladdkaka',
      servings: 8,
      ingredients: [
        { name: 'ägg', quantity: 2, unit: 'stycken' },
        { name: 'socker', quantity: 3, unit: 'dl' },
        { name: 'mjöl', quantity: 1.5, unit: 'dl' },
        { name: 'kakao', quantity: 4, unit: 'msk' },
        { name: 'smör', quantity: 100, unit: 'g' },
        { name: 'vaniljsocker', quantity: 1, unit: 'tsk' }
      ],
      instructions: 'Sätt ugn på 175°C. Smält smör och låt svalna. Vispa ägg och socker puffigt. Blanda mjöl, kakao och vaniljsocker. Rör ner i äggsmeten. Tillsatt smält smör. Häll i smörd form. Grädda 12-15 min (ska vara kladdig i mitten). Servera med vispgrädde.',
      cookingTime: '30 minuter',
      difficulty: 'Lätt',
      tags: ['dessert', 'bakning', 'choklad', 'swedish']
    },
    {
      id: 'dessert-2',
      name: 'Pannacotta med Bär',
      servings: 4,
      ingredients: [
        { name: 'grädde', quantity: 5, unit: 'dl' },
        { name: 'socker', quantity: 1, unit: 'dl' },
        { name: 'gelatin', quantity: 3, unit: 'blad' },
        { name: 'vaniljstång', quantity: 1, unit: 'stycke' },
        { name: 'hallon', quantity: 200, unit: 'g' }
      ],
      instructions: 'Blötlägg gelatin i kallt vatten. Koka grädde, socker och vanilj. Ta av från värmen. Krama ur gelatinet och rör ner. Häll i formar. Kyl 4 timmar. Vänd upp och ner på tallrik. Toppa med hallon.',
      cookingTime: '4.5 timmar',
      difficulty: 'Medel',
      tags: ['dessert', 'italienskt', 'elegant']
    },
    {
      id: 'dessert-3',
      name: 'Chokladbollar',
      servings: 20,
      ingredients: [
        { name: 'havregryn', quantity: 3, unit: 'dl' },
        { name: 'socker', quantity: 1.5, unit: 'dl' },
        { name: 'kakao', quantity: 3, unit: 'msk' },
        { name: 'smör', quantity: 100, unit: 'g' },
        { name: 'kallt kaffe', quantity: 3, unit: 'msk' },
        { name: 'kokos', quantity: 1, unit: 'dl' }
      ],
      instructions: 'Smält smör och låt svalna. Blanda havregryn, socker och kakao. Tillsatt smör och kaffe. Rör ihop. Rulla till bollar och vältra i kokos. Förvara i kylen.',
      cookingTime: '20 minuter',
      difficulty: 'Lätt',
      tags: ['dessert', 'fika', 'swedish', 'snabbt']
    },
    {
      id: 'dessert-4',
      name: 'Äppelpaj',
      servings: 8,
      ingredients: [
        { name: 'äpple', quantity: 5, unit: 'stycken' },
        { name: 'smör', quantity: 100, unit: 'g' },
        { name: 'mjöl', quantity: 2, unit: 'dl' },
        { name: 'havregryn', quantity: 1, unit: 'dl' },
        { name: 'socker', quantity: 1, unit: 'dl' },
        { name: 'kanel', quantity: 1, unit: 'tsk' }
      ],
      instructions: 'Sätt ugn på 200°C. Skala och skiva äpplen. Lägg i smörd form. Strö kanel och 2 msk socker. Smält smör. Blanda mjöl, havregryn och socker. Tillsatt smör. Smula över äpplena. Grädda 25-30 min. Servera med vaniljglass.',
      cookingTime: '45 minuter',
      difficulty: 'Lätt',
      tags: ['dessert', 'bakning', 'swedish']
    },
    {
      id: 'dessert-5',
      name: 'Tiramisu',
      servings: 6,
      ingredients: [
        { name: 'mascarpone', quantity: 500, unit: 'g' },
        { name: 'ägg', quantity: 4, unit: 'stycken' },
        { name: 'socker', quantity: 1, unit: 'dl' },
        { name: 'kaffe', quantity: 3, unit: 'dl' },
        { name: 'längfingrar', quantity: 200, unit: 'g' },
        { name: 'kakao', quantity: 2, unit: 'msk' }
      ],
      instructions: 'Separera äggulor och vitor. Vispa äggulor med socker. Rör i mascarpone. Vispa vitorna till hårt skum. Vänd ner i mascarponekrämen. Doppa längfingrar i kallt kaffe. Varva längfingrar och kräm. Kyl 4 timmar. Pudra kakao över innan servering.',
      cookingTime: '4.5 timmar',
      difficulty: 'Medel',
      tags: ['dessert', 'italienskt', 'elegant']
    },
    {
      id: 'dessert-6',
      name: 'Chokladmousse',
      servings: 4,
      ingredients: [
        { name: 'mörk choklad', quantity: 200, unit: 'g' },
        { name: 'grädde', quantity: 3, unit: 'dl' },
        { name: 'ägg', quantity: 2, unit: 'stycken' },
        { name: 'socker', quantity: 2, unit: 'msk' }
      ],
      instructions: 'Smält choklad över vattenbad. Låt svalna. Vispa grädden. Separera ägg. Vispa äggulor med socker. Rör i chokladen. Vänd försiktigt ner vispgrädde. Häll i glas. Kyl 2 timmar.',
      cookingTime: '2.5 timmar',
      difficulty: 'Medel',
      tags: ['dessert', 'choklad', 'elegant']
    },
    {
      id: 'dessert-7',
      name: 'Citronmåne',
      servings: 8,
      ingredients: [
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'socker', quantity: 2, unit: 'dl' },
        { name: 'mjöl', quantity: 1.5, unit: 'dl' },
        { name: 'bakpulver', quantity: 1, unit: 'tsk' },
        { name: 'citron', quantity: 2, unit: 'stycken' },
        { name: 'florsocker', quantity: 2, unit: 'dl' }
      ],
      instructions: 'Sätt ugn på 175°C. Vispa ägg och socker puffigt. Blanda mjöl och bakpulver. Vänd ner. Häll i smörd form. Grädda 25 min. Vispa florsocker med citronsaft. Stick hål i kakan. Häll glasyren över. Låt stelna.',
      cookingTime: '45 minuter',
      difficulty: 'Lätt',
      tags: ['dessert', 'bakning', 'citrus']
    },
    {
      id: 'dessert-8',
      name: 'Prinsesstårta Mini',
      servings: 6,
      ingredients: [
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'socker', quantity: 1.5, unit: 'dl' },
        { name: 'mjöl', quantity: 1, unit: 'dl' },
        { name: 'vaniljkräm', quantity: 3, unit: 'dl' },
        { name: 'grädde', quantity: 3, unit: 'dl' },
        { name: 'marsipan', quantity: 300, unit: 'g' },
        { name: 'sylt', quantity: 1, unit: 'dl' }
      ],
      instructions: 'Sätt ugn på 175°C. Vispa ägg och socker. Vänd ner mjöl. Grädda 25 min. Dela i två. Vispa grädde. Varva botten, sylt, vaniljkräm, vispgrädde och lock. Kavla ut grön marsipan. Täck tårtan. Pudra florsocker.',
      cookingTime: '60 minuter',
      difficulty: 'Svår',
      tags: ['dessert', 'bakning', 'swedish', 'festmat']
    },
    {
      id: 'dessert-9',
      name: 'Brownie',
      servings: 12,
      ingredients: [
        { name: 'mörk choklad', quantity: 200, unit: 'g' },
        { name: 'smör', quantity: 150, unit: 'g' },
        { name: 'ägg', quantity: 3, unit: 'stycken' },
        { name: 'socker', quantity: 3, unit: 'dl' },
        { name: 'mjöl', quantity: 1.5, unit: 'dl' },
        { name: 'kakao', quantity: 3, unit: 'msk' },
        { name: 'valnötter', quantity: 1, unit: 'dl' }
      ],
      instructions: 'Sätt ugn på 175°C. Smält choklad och smör. Låt svalna. Vispa ägg och socker. Tillsatt chokladblandningen. Blanda mjöl och kakao. Rör ner med hackade valnötter. Häll i form. Grädda 25-30 min. Låt svalna helt innan skärning.',
      cookingTime: '45 minuter',
      difficulty: 'Lätt',
      tags: ['dessert', 'choklad', 'amerikanskt']
    },
    {
      id: 'dessert-10',
      name: 'Crème Brûlée',
      servings: 4,
      ingredients: [
        { name: 'grädde', quantity: 5, unit: 'dl' },
        { name: 'äggulor', quantity: 5, unit: 'stycken' },
        { name: 'socker', quantity: 0.75, unit: 'dl' },
        { name: 'vaniljstång', quantity: 1, unit: 'stycke' },
        { name: 'farinsocker', quantity: 4, unit: 'msk' }
      ],
      instructions: 'Sätt ugn på 150°C. Koka grädde med vanilj. Vispa äggulor med socker. Häll grädden i dünstroåm. Sila. Häll i formar. Grädda i vattenbad 40-45 min. Kyl 4 timmar. Strö farinsocker. Karamellisera med brüléelämpor eller i ugn.',
      cookingTime: '5.5 timmar',
      difficulty: 'Svår',
      tags: ['dessert', 'franskt', 'elegant']
    }
  ]
}
