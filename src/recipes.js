export const recipes = [
  { id: 1, name: 'Tomato Pasta', ingredients: ['tomato', 'pasta', 'garlic'], instructions: 'Boil pasta, sauté garlic and tomatoes, mix and serve.' },
  { id: 2, name: 'Banana Pancakes', ingredients: ['banana', 'egg', 'flour', 'milk'], instructions: 'Mash bananas, mix with batter, cook on pan.' },
  { id: 3, name: 'Veggie Omelette', ingredients: ['egg', 'onion', 'bell pepper', 'cheese'], instructions: 'Whisk eggs, add chopped veggies, cook, add cheese.' },
  { id: 4, name: 'Avocado Toast', ingredients: ['bread', 'avocado', 'lemon'], instructions: 'Toast bread, mash avocado with lemon, spread and eat.' },
  { id: 5, name: 'Chicken Stir-fry', ingredients: ['chicken', 'soy sauce', 'garlic', 'broccoli'], instructions: 'Stir-fry chicken, add veggies and sauce, serve with rice.' }
]

export function suggestRecipes(items) {
  const names = items.map(i => i.name.toLowerCase())
  const suggestions = recipes.filter(r => r.ingredients.some(ing => names.some(n => n.includes(ing))))
  return suggestions.slice(0, 3)
}
