// OMFATTANDE databas med ALLA svenska matvaror - Som en människa skulle känna igen
// Denna databas används för strikt AI-validering av kvittoprodukter

export const COMPREHENSIVE_FOOD_DATABASE = {
  
  // FRUKT & BÄR
  fruits: [
    // Vanliga frukter
    'äpple', 'apple', 'äpplen', 'granny smith', 'red delicious', 'golden delicious',
    'päron', 'pear', 'päron klass', 'conference päron',
    'banan', 'banana', 'bananer', 'fairtrade banan', 'eko banan',
    'apelsin', 'orange', 'apelsiner', 'navel apelsin', 'blodapelsin',
    'mandarin', 'clementin', 'satsuma', 'mandarine',
    'citron', 'lemon', 'citroner', 'lime', 'limefrukt',
    'vindruv', 'grapes', 'blå vindruv', 'vita vindruv', 'röda vindruv',
    'kiwi', 'kiwifrukt', 'gul kiwi', 'grön kiwi',
    'mango', 'mangofrukt', 'kent mango', 'palmer mango',
    'ananas', 'pineapple', 'färsk ananas', 'ananasbitar',
    'melon', 'vattenmelon', 'honungsmelon', 'cantaloupe', 'galiaamelon',
    'avokado', 'avocado', 'hass avokado', 'fuerte avokado', 'eko avokado',
    'persika', 'peach', 'nektarin', 'plommon', 'aprikos',
    'körsbär', 'cherry', 'sötkörsbär', 'surkörsbär',
    'fikon', 'dadlar', 'dates', 'medjool dadlar',
    
    // Nordiska bär
    'jordgubb', 'strawberry', 'jordgubbar', 'svenska jordgubbar',
    'hallon', 'raspberry', 'svenska hallon', 'frysta hallon',
    'blåbär', 'blueberry', 'svenska blåbär', 'amerikanska blåbär',
    'lingon', 'cowberry', 'svenska lingon', 'rårörda lingon',
    'björnbär', 'blackberry', 'tranbär', 'cranberry',
    'vinbär', 'currant', 'röda vinbär', 'svarta vinbär', 'vita vinbär',
    'krusbär', 'gooseberry', 'hjortron', 'cloudberry',
    'åkerbär', 'dewberry', 'nypon', 'rosehip',
    
    // Exotiska frukter
    'dragon fruit', 'drakfrukt', 'passion fruit', 'passionsfrukt',
    'papaya', 'kokosnöt', 'coconut', 'lychee', 'rambutan',
    'stjärnfrukt', 'carambola', 'granatäpple', 'pomegranate'
  ],

  // GRÖNSAKER
  vegetables: [
    // Rotfrukter
    'potatis', 'potato', 'potatoes', 'mandelpotatis', 'färskpotatis', 'kryddpotatis',
    'almond potato', 'new potato', 'röd potatis', 'mjölig potatis', 'fast potatis',
    'sötpotatis', 'sweet potato', 'battat',
    'morot', 'carrot', 'morötter', 'primörer', 'primörmorötter', 'baby morötter',
    'palsternacka', 'parsnip', 'pastinack',
    'rotselleri', 'celeriac', 'sellerirot', 'knölselleri',
    'rödbetor', 'beetroot', 'rödbetar', 'gul rödbetor',
    'rova', 'swede', 'kålrova', 'kålrot',
    'rättika', 'radish', 'rädisa', 'rödis', 'daikon',
    'pepparrot', 'horseradish', 'färsk pepparrot',
    
    // Lökväxter
    'lök', 'onion', 'gul lök', 'röd lök', 'rödlök', 'red onion',
    'vitlök', 'garlic', 'färsk vitlök', 'kinesisk vitlök',
    'schalottenlök', 'shallot', 'schalott', 'salladslök',
    'purjolök', 'leek', 'baby leek', 'mini purjolök',
    'gräslök', 'chives', 'färsk gräslök',
    
    // Kålväxter
    'vitkål', 'white cabbage', 'spetskål', 'pointed cabbage',
    'rödkål', 'red cabbage', 'röd vitkål',
    'blomkål', 'cauliflower', 'vit blomkål', 'romanesco',
    'broccoli', 'broccoliblomma', 'baby broccoli', 'broccolini',
    'rosenkål', 'brussels sprouts', 'brysselkål',
    'grönkål', 'kale', 'svartkål', 'pak choi', 'bok choy',
    'kinakål', 'chinese cabbage', 'wombok', 'napa kål',
    'blåkål', 'savoy cabbage', 'savoykål',
    
    // Sallader
    'sallad', 'lettuce', 'isbergssallad', 'iceberg lettuce',
    'huvudsallad', 'butterhead lettuce', 'ekosallad',
    'rucola', 'arugula', 'rocket', 'ruccola',
    'spenat', 'spinach', 'babyspenat', 'baby spinach',
    'frisésallad', 'frisee', 'endive', 'radicchio',
    'fältsallad', 'corn salad', 'mâche', 'lamb lettuce',
    'vattenk', 'watercress', 'perilla', 'mizuna',
    
    // Fruktgrönsaker
    'tomat', 'tomato', 'tomater', 'körsbärstomat', 'cherry tomatoes',
    'cocktailtomat', 'plomtomat', 'plum tomatoes', 'beefsteak tomato',
    'san marzano', 'roma tomater', 'kvistomat', 'vine tomatoes',
    'gurka', 'cucumber', 'minigurka', 'mini cucumber',
    'slanggurka', 'telegraph cucumber', 'ekogurka',
    'paprika', 'bell pepper', 'röd paprika', 'gul paprika', 'grön paprika',
    'spetspaprika', 'romano paprika', 'mini paprika',
    'chili', 'chilli', 'chilipeppar', 'jalapeño', 'habanero',
    'serrano', 'cayenne', 'bird eye chili', 'thai chili',
    'aubergine', 'eggplant', 'äggplanta', 'mini aubergine',
    'zucchini', 'courgette', 'squash', 'pattypan',
    'pumpa', 'pumpkin', 'butternut squash', 'hokkaido pumpa',
    'delicata squash', 'acorn squash', 'musköt pumpa',
    
    // Baljväxter (färska)
    'ärtor', 'peas', 'sockerärt', 'mangetout', 'snow peas',
    'ärtskott', 'pea shoots', 'färska ärtor',
    'haricots verts', 'prinsessbönor', 'french beans',
    'bruna bönor', 'broad beans', 'fava beans',
    'edamamebönor', 'edamame', 'sojabönor',
    
    // Kryddväxter
    'basilika', 'basil', 'färsk basilika', 'thai basilika',
    'persilja', 'parsley', 'slätt persilja', 'krås persilja',
    'dill', 'färsk dill', 'dillkvistar',
    'koriander', 'cilantro', 'färsk koriander',
    'rosmarin', 'rosemary', 'färsk rosmarin',
    'timjan', 'thyme', 'färsk timjan', 'citronstimjan',
    'oregano', 'färsk oregano', 'mejram', 'marjoram',
    'salvie', 'sage', 'mynta', 'mint', 'pepparmynta',
    'citronmeliss', 'lemon balm', 'estragon', 'tarragon',
    
    // Andra grönsaker
    'sparris', 'asparagus', 'grön sparris', 'vit sparris',
    'kronärtskocka', 'artichoke', 'jerusalemärtskocka',
    'fänkål', 'fennel', 'färsk fänkål', 'fänkålsknopp',
    'rabarber', 'rhubarb', 'färsk rabarber',
    'majs', 'corn', 'majskolv', 'baby corn',
    'bambuskott', 'bamboo shoots', 'palmhjärtan'
  ],

  // SVAMP
  mushrooms: [
    'svamp', 'mushroom', 'mushrooms', 'champinjon', 'champignoner',
    'button mushroom', 'vita champinjoner', 'bruna champinjoner',
    'portabello', 'portobello', 'stora champinjoner',
    'shiitake', 'shiitakesvamp', 'ostronsvamp', 'oyster mushroom',
    'kantarell', 'chanterelle', 'svenska kantareller',
    'karljohan', 'porcini', 'stensopp', 'cep',
    'trattkantarell', 'funnel chanterelle', 'svart trumpetsvamp',
    'enoki', 'enokisvamp', 'needle mushroom',
    'cremini', 'baby bella', 'kastanjesvamp',
    'maitake', 'hen of the woods', 'shimeji'
  ],

  // KÖTT & CHARK
  meat: [
    // Nötkött
    'nötkött', 'beef', 'oxkött', 'kalv', 'kalvkött', 'veal',
    'entrecote', 'ribeye', 'filé', 'fillet', 'nötfilé', 'beef fillet',
    'ryggbiff', 'sirloin', 'fransyska', 'rump steak',
    'rostbiff', 'roast beef', 'oxbringa', 'brisket',
    'oxstek', 'pot roast', 'bog', 'chuck', 'flankstek',
    'nötfärs', 'ground beef', 'köttfärs', 'blandfärs',
    
    // Fläsk
    'fläsk', 'pork', 'fläskfilé', 'pork tenderloin',
    'fläskkött', 'fläskytterfilé', 'pork loin', 'fläskkarré',
    'fläskbog', 'pork shoulder', 'fläsksida', 'pork belly',
    'bacon', 'fläskbacon', 'kassler', 'rökt fläsk',
    'fläskfärs', 'ground pork', 'revben', 'ribs', 'spare ribs',
    
    // Lamm
    'lamm', 'lamb', 'lammkött', 'lammfilé', 'lamb fillet',
    'lammkotlett', 'lamb chops', 'lammbo', 'leg of lamb',
    'lammfärs', 'ground lamb', 'lammkorv', 'merguez',
    
    // Kyckling & Fågel
    'kyckling', 'chicken', 'kycklingfilé', 'chicken breast',
    'kycklinglår', 'chicken thigh', 'chicken leg',
    'kycklingvingar', 'chicken wings', 'hel kyckling', 'whole chicken',
    'kycklinglever', 'chicken liver', 'kycklingfärs', 'ground chicken',
    'kalkon', 'turkey', 'kalkonfilé', 'turkey breast',
    'and', 'duck', 'andbröst', 'duck breast', 'ankfilé',
    'gås', 'goose', 'vaktel', 'quail', 'fasan', 'pheasant',
    
    // Chark & Korv
    'skinka', 'ham', 'kokt skinka', 'rökt skinka', 'smoked ham',
    'lufttorkad skinka', 'prosciutto', 'serrano', 'parma skinka',
    'salami', 'chorizo', 'pepperoni', 'milano salami',
    'leberwurst', 'leverpastej', 'paté', 'foie gras',
    'korv', 'sausage', 'falukorv', 'isterband', 'prinskorv',
    'bratwurst', 'weisswurst', 'italiensk korv', 'merguez',
    'köttbullar', 'meatballs', 'frikadeller', 'wallenbergare'
  ],

  // FISK & SKALDJUR
  seafood: [
    // Fisk
    'lax', 'salmon', 'atlantisk lax', 'gravlax', 'regnbågslax',
    'torsk', 'cod', 'kolja', 'haddock', 'vitling', 'whiting',
    'sej', 'saithe', 'kummel', 'hake', 'långa', 'ling',
    'rödspätta', 'plaice', 'flundra', 'flounder', 'piggvar', 'turbot',
    'rödtunga', 'sole', 'halibut', 'helleflundra',
    'makrill', 'mackerel', 'sill', 'herring', 'ansjovis', 'anchovy',
    'sardiner', 'sardines', 'tonfisk', 'tuna', 'bonito',
    'abborre', 'perch', 'gös', 'zander', 'gädda', 'pike',
    'öring', 'trout', 'regnbågsbåge', 'arctic char', 'röding',
    'ål', 'eel', 'kongerål', 'conger eel', 'braxen', 'bream',
    
    // Skaldjur
    'räkor', 'shrimp', 'prawns', 'handflägrade räkor', 'cocktailräkor',
    'jätteräkor', 'king prawns', 'tigerräkor', 'tiger prawns',
    'hummer', 'lobster', 'kanadensisk hummer', 'sjökreps', 'langoustine',
    'kräftor', 'crayfish', 'signalkräfta', 'flodkräfta',
    'krabba', 'crab', 'taskrabba', 'dungeness crab', 'king crab',
    'musslor', 'mussels', 'blåmusslor', 'blue mussels',
    'ostron', 'oysters', 'kammusslor', 'scallops', 'pilgrimsmusslor',
    'havskräfta', 'norway lobster', 'pilgrimsmussla', 'scallop',
    'bläckfisk', 'squid', 'kalamar', 'bläckfiskringar'
  ],

  // MEJERI
  dairy: [
    // Mjölk
    'mjölk', 'milk', 'standardmjölk', 'mellanmjölk', 'lättmjölk',
    'minimjölk', 'whole milk', 'semi skimmed', 'skimmed milk',
    'laktosfri mjölk', 'lactose free milk', 'a2 mjölk',
    'ekologisk mjölk', 'organic milk', 'havremjölk', 'oat milk',
    'mandelmjölk', 'almond milk', 'sojamjölk', 'soy milk',
    'kokosmjölk', 'coconut milk', 'rismjölk', 'rice milk',
    
    // Grädde & Sura produkter
    'grädde', 'cream', 'vispgrädde', 'whipping cream',
    'matlagningsgrädde', 'cooking cream', 'creme fraiche', 'crème fraîche',
    'gräddfil', 'sour cream', 'filmjölk', 'buttermilk', 'kärnmjölk',
    'kefir', 'turkisk yoghurt', 'greek yogurt',
    
    // Yoghurt
    'yoghurt', 'yogurt', 'naturell yoghurt', 'natural yogurt',
    'vaniljyoghurt', 'vanilla yogurt', 'grekisk yoghurt', 'greek yogurt',
    'probiotisk yoghurt', 'probiotic yogurt', 'bifidus yoghurt',
    'blåbärsyoghurt', 'jordgubbsyoghurt', 'blandad frukt yoghurt',
    
    // Kvark & Färskost
    'kvarg', 'quark', 'naturell kvarg', 'vaniljkvarg',
    'cottage cheese', 'keso', 'ricotta', 'mascarpone',
    'philadelphia', 'färskost', 'cream cheese', 'smörost',
    
    // Ost
    'ost', 'cheese', 'hårdost', 'mjukost', 'halvhård ost',
    'herrgård', 'präst', 'västerbotten', 'grevé', 'svecia',
    'gouda', 'edam', 'cheddar', 'emmental', 'gruyere',
    'brie', 'camembert', 'roquefort', 'stilton', 'gorgonzola',
    'parmesan', 'parmigiano reggiano', 'pecorino', 'manchego',
    'feta', 'getost', 'chevre', 'mozzarella', 'burrata',
    'haloumi', 'halloumi', 'paneer', 'blåmögelost', 'blue cheese',
    
    // Smör
    'smör', 'butter', 'osaltat smör', 'saltat smör', 'bregott',
    'margarin', 'margarine', 'becel', 'flora', 'lätta'
  ],

  // ÄGG
  eggs: [
    'ägg', 'egg', 'eggs', 'hönsägg', 'chicken eggs',
    'ekologiska ägg', 'organic eggs', 'frigående ägg', 'free range eggs',
    'stora ägg', 'large eggs', 'medium ägg', 'små ägg',
    'vaktelägg', 'quail eggs', 'andägg', 'duck eggs'
  ],

  // BRÖD & BAKVERK
  bread: [
    // Bröd
    'bröd', 'bread', 'limpa', 'råglimpa', 'surdegsbröd', 'sourdough',
    'fullkornsbröd', 'wholemeal bread', 'graham bröd', 'graham bread',
    'vitt bröd', 'white bread', 'toast', 'toastbröd', 'hamburgerbröd',
    'korvbröd', 'hot dog bread', 'tunnbröd', 'flatbread',
    'pitabröd', 'pita bread', 'naan', 'tortilla', 'wraps',
    'focaccia', 'ciabatta', 'bagel', 'croissant', 'pain au chocolat',
    
    // Knäckebröd & Kex
    'knäckebröd', 'crispbread', 'wasa', 'leksands', 'finn crisp',
    'ryvita', 'kavring', 'skorpor', 'rusks',
    'kex', 'crackers', 'cream crackers', 'digestive',
    'maria kex', 'petit beurre', 'ballerina kex',
    
    // Bakverk
    'bulle', 'kanelbulle', 'cinnamon bun', 'wienerbrö', 'croissant',
    'muffin', 'scones', 'bagel', 'donut', 'munkar',
    'pepparkakor', 'gingerbread', 'småkakor', 'cookies'
  ],

  // SPANNMÅL & TORRVAROR
  grains: [
    // Ris
    'ris', 'rice', 'jasminris', 'jasmine rice', 'basmatiris', 'basmati rice',
    'rundkornigt ris', 'short grain rice', 'långkornigt ris', 'long grain rice',
    'brunris', 'brown rice', 'vildris', 'wild rice', 'risotto ris', 'arborio',
    
    // Pasta
    'pasta', 'spagetti', 'spaghetti', 'penne', 'fusilli', 'farfalle',
    'tagliatelle', 'linguine', 'lasagne', 'cannelloni', 'ravioli',
    'tortellini', 'macaroni', 'makaroner', 'rigatoni', 'gnocchi',
    
    // Andra spannmål
    'havregryn', 'oats', 'rolled oats', 'müsli', 'muesli', 'granola',
    'cornflakes', 'flingor', 'special k', 'all bran',
    'quinoa', 'bulgur', 'couscous', 'freekeh', 'farro',
    'amarant', 'amaranth', 'bovete', 'buckwheat', 'hirs', 'millet',
    'korn', 'barley', 'vete', 'wheat', 'råg', 'rye',
    
    // Mjöl
    'mjöl', 'flour', 'vetemjöl', 'wheat flour', 'rågjmöl', 'rye flour',
    'grahamsmjöl', 'graham flour', 'fullkornsmjöl', 'wholemeal flour',
    'mandelmjöl', 'almond flour', 'kokosmjöl', 'coconut flour'
  ],

  // NÖTTER & FRÖN
  nuts: [
    // Nötter
    'nötter', 'nuts', 'mandel', 'almonds', 'valnötter', 'walnuts',
    'hasselnötter', 'hazelnuts', 'cashewnötter', 'cashews',
    'pistaschnötter', 'pistachios', 'pekan nötter', 'pecans',
    'macadamianötter', 'macadamias', 'paranötter', 'brazil nuts',
    'jordnötter', 'peanuts', 'rostade nötter', 'roasted nuts',
    'saltade nötter', 'salted nuts', 'nötmix', 'mixed nuts',
    
    // Frön
    'solrosfrön', 'sunflower seeds', 'pumpakärnor', 'pumpkin seeds',
    'sesamfrön', 'sesame seeds', 'linfrön', 'flax seeds', 'linseed',
    'chiafrön', 'chia seeds', 'hampfrön', 'hemp seeds',
    'vallmofrön', 'poppy seeds', 'fenkolfrön', 'fennel seeds'
  ],

  // KONSERVER & INLAGDA VAROR
  preserved: [
    // Konserverade tomater
    'krossade tomater', 'crushed tomatoes', 'passata', 'tomato passata',
    'hela tomater', 'whole tomatoes', 'tomatpuré', 'tomato paste',
    'tomatsås', 'tomato sauce', 'pizza sås', 'pizza sauce',
    
    // Baljväxter
    'vita bönor', 'white beans', 'kidneybönor', 'kidney beans',
    'svarta bönor', 'black beans', 'cannellinibönor', 'cannellini beans',
    'kikärtor', 'chickpeas', 'linser', 'lentils', 'röda linser',
    'gula ärtor', 'yellow peas', 'gröna ärtor', 'green peas',
    'edamamebönor', 'edamame', 'hummus', 'falafelmix',
    
    // Andra konserver
    'majs', 'corn', 'sweetcorn', 'oliver', 'olives', 'kalamata oliver',
    'gröna oliver', 'green olives', 'svarta oliver', 'black olives',
    'kapris', 'capers', 'inlagd gurka', 'pickled cucumbers', 'cornichons',
    'silverrök', 'pickled onions', 'rödbetor', 'pickled beetroot',
    'surkål', 'sauerkraut', 'kimchi', 'miso'
  ],

  // DRYCKER
  beverages: [
    // Juice & Smoothies
    'juice', 'äppeljuice', 'apple juice', 'apelsinjuice', 'orange juice',
    'tranbärsjuice', 'cranberry juice', 'ananasjuice', 'pineapple juice',
    'tomatjuice', 'tomato juice', 'multivitaminjuice', 'multivitamin juice',
    'smoothie', 'grön smoothie', 'bär smoothie', 'protein smoothie',
    'must', 'äppelmost', 'druvsaft', 'grape juice',
    
    // Läskedrycker
    'läsk', 'soft drinks', 'cola', 'coca cola', 'pepsi', 'sprite',
    'fanta', '7up', 'schweppes', 'tonic', 'ginger ale',
    'energidryck', 'energy drink', 'red bull', 'monster',
    'sportdryck', 'sports drink', 'powerade', 'gatorade',
    
    // Vatten
    'vatten', 'water', 'mineralvatten', 'mineral water', 'källvatten',
    'kolsyrat vatten', 'sparkling water', 'ramlösa', 'loka', 'evian',
    'smaksatt vatten', 'flavored water', 'vitaminvatten', 'vitamin water',
    
    // Kaffe & Te
    'kaffe', 'coffee', 'espresso', 'bryggkaffe', 'filter coffee',
    'instant kaffe', 'koffeinfritt kaffe', 'decaf coffee',
    'te', 'tea', 'svart te', 'black tea', 'grönt te', 'green tea',
    'vitt te', 'white tea', 'rooibos', 'chai te', 'chai tea',
    'örtte', 'herbal tea', 'kamomillte', 'chamomile tea',
    'pepparmintte', 'peppermint tea', 'ingefärste', 'ginger tea',
    
    // Alkohol
    'öl', 'beer', 'lager', 'pilsner', 'ale', 'ipa', 'stout', 'porter',
    'folköl', 'lättöl', 'mellanöl', 'starköl', 'alkoholfritt öl',
    'vin', 'wine', 'rödvin', 'red wine', 'vitt vin', 'white wine',
    'rosé', 'rosévin', 'mousserande vin', 'sparkling wine',
    'champagne', 'prosecco', 'cava', 'glögg', 'mulled wine',
    'sprit', 'spirits', 'vodka', 'whiskey', 'gin', 'rom', 'rum',
    'brandy', 'konjak', 'cognac', 'likör', 'liqueur'
  ],

  // SÖTSAKER & SNACKS
  sweets: [
    // Choklad
    'choklad', 'chocolate', 'mjölkchoklad', 'milk chocolate',
    'mörk choklad', 'dark chocolate', 'vit choklad', 'white chocolate',
    'chokladkaka', 'chocolate bar', 'pralin', 'pralines', 'tryfflar',
    
    // Godis
    'godis', 'candy', 'lösgodis', 'pick and mix', 'gelégodis', 'gummy candy',
    'sura godis', 'sour candy', 'lakrits', 'liquorice', 'saltlakrits',
    'djungelvrål', 'lakritsskalle', 'lakritsmix', 'ahlgrens bilar',
    'sega råttor', 'malaco', 'cloetta', 'haribo', 'haribo björnar',
    
    // Snacks
    'chips', 'potato chips', 'popcorn', 'nötter', 'nuts',
    'torkad frukt', 'dried fruit', 'russin', 'raisins',
    'dadlar', 'dates', 'fikon', 'figs', 'aprikoser', 'dried apricots',
    'studenthavre', 'trail mix', 'müslibar', 'granola bar',
    'proteinbar', 'protein bar', 'nötbar', 'nut bar'
  ],

  // KRYDDOR & SÅSER
  spices: [
    // Grundkryddor
    'salt', 'havssalt', 'sea salt', 'himalayasalt', 'flingsalt',
    'peppar', 'pepper', 'svartpeppar', 'black pepper', 'vitpeppar', 'white pepper',
    'kanel', 'cinnamon', 'kardemumma', 'cardamom', 'kryddnejlika', 'cloves',
    'muskot', 'nutmeg', 'ingefära', 'ginger', 'gurkmeja', 'turmeric',
    'paprikapulver', 'paprika', 'cayennepeppar', 'cayenne pepper',
    'chilipulver', 'chili powder', 'currypulver', 'curry powder',
    
    // Örter
    'basilika', 'basil', 'oregano', 'rosmarin', 'rosemary',
    'timjan', 'thyme', 'salvie', 'sage', 'mynta', 'mint',
    'dill', 'persilja', 'parsley', 'koriander', 'cilantro',
    
    // Såser & Dressingar
    'ketchup', 'senap', 'mustard', 'majonnäs', 'mayonnaise',
    'sojasås', 'soy sauce', 'worcestersås', 'worcester sauce',
    'tabasco', 'sriracha', 'chilisås', 'chili sauce',
    'olivolja', 'olive oil', 'rapsolja', 'canola oil', 'solrosolja',
    'sesamolja', 'sesame oil', 'kokosolja', 'coconut oil',
    'vinäger', 'vinegar', 'balsamico', 'äppelcidervinäger'
  ],

  // FRYSTA VAROR
  frozen: [
    'fryst', 'frozen', 'frysta bär', 'frozen berries',
    'frysta grönsaker', 'frozen vegetables', 'fryst fisk', 'frozen fish',
    'frysta räkor', 'frozen shrimp', 'fryst kyckling', 'frozen chicken',
    'pizza', 'fryst pizza', 'frozen pizza', 'lasagne', 'fryst lasagne',
    'fish fingers', 'fiskpinnar', 'köttbullar', 'frozen meatballs',
    'glass', 'ice cream', 'sorbet', 'frozen yogurt',
    'ben & jerrys', 'häagen dazs', 'magnum', 'cornetto'
  ],

  // BABY & SPECIALKOST
  special: [
    'barnmat', 'baby food', 'välling', 'baby formula',
    'glutenfri', 'gluten free', 'laktosfri', 'lactose free',
    'vegansk', 'vegan', 'vegetarisk', 'vegetarian',
    'eko', 'organic', 'krav', 'fairtrade',
    'diabetiker', 'diabetic', 'light', 'lågfett', 'low fat'
  ],

  // VANLIGA SVENSKA VARUMÄRKEN
  brands: [
    // Mejeri
    'arla', 'skånemejerier', 'norrmejerier', 'milko', 'krono',
    'garant', 'eldorado', 'i love eco', 'ica basic', 'ica selection',
    
    // Kött
    'scan', 'danish crown', 'krönlätt', 'hk', 'tulip',
    
    // Bröd
    'pågen', 'schulstad', 'fazer', 'finax', 'lantmännen',
    
    // Konserver
    'felix', 'findus', 'matlust', 'zeunerts',
    
    // Frysta
    'findus', 'birds eye', 'oxen', 'dafgård'
  ]
};

// Hjälpfunktioner för AI-validering
export const STRICT_FOOD_VALIDATOR = {
  // Skapa en gemensam lista med alla matvaror
  getAllFoodItems() {
    const allItems = [];
    Object.values(COMPREHENSIVE_FOOD_DATABASE).forEach(category => {
      allItems.push(...category);
    });
    return [...new Set(allItems.map(item => item.toLowerCase()))];
  },

  // Strikt validering - produkten måste matcha något i databasen
  isValidFoodProduct(productName) {
    if (!productName || productName.length < 2) return false;
    
    const cleanName = productName.toLowerCase().trim()
      .replace(/[^a-zåäö\s]/g, '') // Ta bort allt utom bokstäver och mellanslag
      .replace(/\s+/g, ' '); // Normalisera mellanslag
    
    const allFoodItems = this.getAllFoodItems();
    
    // Exakt match
    if (allFoodItems.includes(cleanName)) {
      console.log(`✅ EXAKT MATCH: "${productName}" → "${cleanName}"`);
      return true;
    }
    
    // Partiell match - produktnamnet innehåller ett känt matvaruord
    const words = cleanName.split(' ');
    for (const word of words) {
      if (word.length >= 3 && allFoodItems.includes(word)) {
        console.log(`✅ ORDMATCH: "${productName}" innehåller matvaruordet "${word}"`);
        return true;
      }
    }
    
    // Substringmatch - ett matvaruord finns i produktnamnet
    for (const foodItem of allFoodItems) {
      if (foodItem.length >= 4) {
        if (cleanName.includes(foodItem) || foodItem.includes(cleanName)) {
          console.log(`✅ DELMATCH: "${productName}" matchar "${foodItem}"`);
          return true;
        }
      }
    }
    
    console.log(`❌ INGEN MATCH: "${productName}" (rensad: "${cleanName}") finns inte i matvarulistan`);
    return false;
  }
};