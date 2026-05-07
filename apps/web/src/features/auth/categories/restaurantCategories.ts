/**
 * Restaurant Categories
 * Comprehensive restaurant category definitions for food ordering systems
 * Enhanced with realistic and varied restaurant types
 */

export const RESTAURANT_CATEGORIES = [
  // Core Menu Categories
  { value: 'appetizers', label: '🥗 Appetizers' },
  { value: 'entrees', label: '🍽️ Main Entrees' },
  { value: 'sandwiches', label: '🥪 Sandwiches & Wraps' },
  { value: 'salads', label: '🥗 Salads & Bowls' },
  { value: 'soups', label: '🍲 Soups & Stews' },
  { value: 'sides', label: '🍟 Sides & Accompaniments' },
  { value: 'desserts', label: '🍰 Desserts & Sweets' },
  { value: 'beverages', label: '🥤 Beverages & Drinks' },
  { value: 'breakfast', label: '🍳 Breakfast & Brunch' },
  { value: 'specials', label: '⭐ Chef Specials & Features' },

  // Cuisine-Specific Categories
  { value: 'pasta', label: '🍝 Pasta & Noodles' },
  { value: 'pizza', label: '🍕 Pizza & Flatbreads' },
  { value: 'burgers', label: '🍔 Burgers & Sliders' },
  { value: 'seafood', label: '🦐 Seafood & Fish' },
  { value: 'steak-house', label: '🥩 Steak & Grill House' },
  { value: 'bbq-grill', label: '🔥 BBQ & Smokehouse' },
  { value: 'mexican', label: '🌮 Mexican & Latin American' },
  { value: 'italian', label: '🍝 Italian & Mediterranean' },
  { value: 'asian', label: '🥢 Asian & Pacific Rim' },
  { value: 'mediterranean', label: '🫒 Mediterranean & Greek' },
  { value: 'american', label: '🇺🇸 American Comfort Food' },
  { value: 'southern', label: '🍗 Southern & Soul Food' },
  { value: 'cajun-creole', label: '🌶️ Cajun & Creole' },
  { value: 'fusion', label: '🍽️ Fusion & Contemporary' },
  { value: 'farm-to-table', label: '🌾 Farm to Table & Organic' },
  { value: 'gourmet', label: '🍽️ Gourmet & Fine Dining' },

  // Dietary & Lifestyle Categories
  { value: 'vegetarian', label: '🌱 Vegetarian & Plant-Based' },
  { value: 'vegan', label: '🥬 Vegan & Plant-Powered' },
  { value: 'gluten-free', label: '🌾 Gluten-Free & Celiac Friendly' },
  { value: 'keto-friendly', label: '🥑 Keto & Low-Carb' },
  { value: 'paleo-friendly', label: '🥩 Paleo & Grain-Free' },
  { value: 'dairy-free', label: '🥛 Dairy-Free & Lactose-Free' },
  { value: 'nut-free', label: '🥜 Nut-Free & Allergy-Friendly' },
  { value: 'low-sodium', label: '🧂 Low-Sodium & Heart-Healthy' },
  { value: 'low-calorie', label: '🔢 Low-Calorie & Light' },
  { value: 'high-protein', label: '💪 High-Protein & Fitness' },
  { value: 'organic', label: '🌱 Organic & Sustainable' },
  { value: 'whole30', label: '🥗 Whole30 & Clean Eating' },

  // Service Style Categories
  { value: 'kids-menu', label: '👶 Kids Menu & Family Friendly' },
  { value: 'tapas-small-plates', label: '🍤 Tapas & Small Plates' },
  { value: 'raw-bar', label: '🦪 Raw Bar & Oyster Bar' },
  { value: 'comfort-food', label: '🍲 Comfort Food & Homestyle' },
  { value: 'healthy-light', label: '🥗 Healthy & Light Options' },
  { value: 'late-night', label: '🌙 Late Night & After Hours' },
  { value: 'brunch', label: '🥞 Brunch & Weekend' },
  { value: 'happy-hour', label: '🍻 Happy Hour & Social Hour' },
  { value: 'catering', label: '🍱 Catering & Group Orders' },
  { value: 'takeout-delivery', label: '🚚 Takeout & Delivery' },

  // Ethnic & Regional Categories
  { value: 'french-cuisine', label: '🥐 French Cuisine & Bistro' },
  { value: 'japanese', label: '🍱 Japanese & Sushi' },
  { value: 'chinese', label: '🥡 Chinese & Dim Sum' },
  { value: 'thai', label: '🍜 Thai & Southeast Asian' },
  { value: 'indian', label: '🍛 Indian & South Asian' },
  { value: 'korean', label: '🥘 Korean & BBQ' },
  { value: 'vietnamese', label: '🍲 Vietnamese & Pho' },
  { value: 'greek', label: '🫒 Greek & Mediterranean' },
  { value: 'spanish', label: '🥘 Spanish & Tapas' },
  { value: 'middle-eastern', label: '🥙 Middle Eastern & Levantine' },
  { value: 'caribbean', label: '🥘 Caribbean & Island' },
  { value: 'african', label: '🌍 African & Heritage' },
  { value: 'eastern-european', label: '🥘 Eastern European' },
  { value: 'latin-american', label: '🌮 Latin American & Hispanic' },
  { value: 'south-american', label: '🌮 South American & Andean' },

  // Modern & Trend Categories
  { value: 'food-truck', label: '🚚 Food Truck & Street Food' },
  { value: 'fast-casual', label: '🍔 Fast Casual & Quick Service' },
  { value: 'craft-beer', label: '🍺 Craft Beer & Pub Food' },
  { value: 'cocktail-lounge', label: '🍸 Cocktail Lounge & Small Plates' },
  { value: 'wine-bar', label: '🍷 Wine Bar & Charcuterie' },
  { value: 'coffee-shop', label: '☕ Coffee Shop & Café' },
  { value: 'tea-house', label: '🍵 Tea House & Bubble Tea' },
  { value: 'juice-bar', label: '🧃 Juice Bar & Smoothies' },
  { value: 'dessert-bar', label: '🍰 Dessert Bar & Patisserie' },
  { value: 'bakery-cafe', label: '🥐 Bakery & Café' },

  // Specialized Categories
  { value: 'seasonal-menu', label: '🍂 Seasonal & Limited Time' },
  { value: 'tasting-menu', label: '🍽️ Tasting Menu & Chef Table' },
  { value: 'wine-pairing', label: '🍷 Wine Pairing & Sommelier' },
  { value: 'chef-table', label: '👨‍🍳 Chef Table & Omakase' },
  { value: 'build-your-own', label: '🔨 Build Your Own & Custom' },
  { value: 'family-style', label: '👨‍👩‍👧‍👦 Family Style & Sharing' },
  { value: 'corporate-catering', label: '💼 Corporate Catering & Events' },
  { value: 'event-catering', label: '🎪 Event Catering & Parties' },
  { value: 'wedding-catering', label: '💒 Wedding Catering & Receptions' },

  // Time-Based Categories
  { value: 'early-bird', label: '🐦 Early Bird Specials' },
  { value: 'lunch-special', label: '🍽️ Lunch Specials & Express' },
  { value: 'dinner-service', label: '🌆 Dinner Service & Evening' },
  { value: 'after-hours', label: '🌙 After Hours & Late Menu' },
  { value: 'weekend-brunch', label: '🥞 Weekend Brunch & Holiday' },
  { value: 'holiday-specials', label: '🎄 Holiday Specials & Festive' },

  // Beverage-Focused Categories
  { value: 'craft-cocktails', label: '🍸 Craft Cocktails & Mixology' },
  { value: 'local-brews', label: '🍺 Local Brews & Craft Beer' },
  { value: 'imported-beers', label: '🌍 Imported Beers & International' },
  { value: 'natural-wines', label: '🍷 Natural & Organic Wines' },
  { value: 'premium-spirits', label: '🥃 Premium Spirits & Top Shelf' },
  { value: 'non-alcoholic', label: '🧃 Non-Alcoholic & Mocktails' },
  { value: 'coffee-specialty', label: '☕ Specialty Coffee & Espresso' },
  { value: 'tea-premium', label: '🍵 Premium Tea & Herbal' },
  { value: 'fresh-juices', label: '🧃 Fresh Juices & Smoothies' },
  { value: 'functional-beverages', label: '⚡ Functional & Health Drinks' },

  // Health & Wellness Categories
  { value: 'superfood-bowls', label: '🌿 Superfood Bowls & Acai' },
  { value: 'protein-bowls', label: '💪 Protein Bowls & Fitness' },
  { value: 'detox-cleanse', label: '🍋 Detox & Cleanse Programs' },
  { value: 'meal-prep', label: '🥡 Meal Prep & Pre-Packaged' },
  { value: 'nutrition-plans', label: '📊 Nutrition Plans & Calorie-Counted' },
  { value: 'allergy-friendly', label: '🌾 Allergy-Friendly & Free-From' },
  { value: 'diabetic-friendly', label: '🩸 Diabetic-Friendly & Low-Sugar' },
  { value: 'athlete-fuel', label: '🏃 Athlete Fuel & Performance' },

  // Entertainment & Experience Categories
  { value: 'interactive-dining', label: '🎪 Interactive Dining & Entertainment' },
  { value: 'themed-nights', label: '🎭 Themed Nights & Events' },
  { value: 'cooking-classes', label: '👨‍🍳 Cooking Classes & Demos' },
  { value: 'wine-tasting', label: '🍷 Wine Tasting & Education' },
  { value: 'beer-tasting', label: '🍺 Beer Tasting & Flights' },
  { value: 'food-pairing', label: '🍽️ Food Pairing Experiences' },
  { value: 'chef-demonstrations', label: '👨‍🍳 Chef Demonstrations & Live Cooking' },

  // Technology & Modern Categories
  { value: 'ghost-kitchen', label: '👻 Ghost Kitchen & Virtual Brands' },
  { value: 'delivery-only', label: '🚚 Delivery-Only & Cloud Kitchens' },
  { value: 'dark-kitchen', label: '🌙 Dark Kitchen & Delivery Brands' },
  { value: 'virtual-restaurant', label: '💻 Virtual Restaurant & Online' },
  { value: 'subscription-meals', label: '📦 Subscription Meals & Kits' },
  { value: 'meal-kits', label: '🥡 Meal Kits & DIY Cooking' },
  { value: 'smart-ordering', label: '📱 Smart Ordering & Kiosks' },
  { value: 'contactless-dining', label: '📲 Contactless Dining & QR Code' },

  // Sustainable & Ethical Categories
  { value: 'sustainable', label: '🌍 Sustainable & Eco-Friendly' },
  { value: 'local-sourcing', label: '🏠 Local Sourcing & Farm Partners' },
  { value: 'zero-waste', label: '♻️ Zero Waste & Food Recovery' },
  { value: 'plant-forward', label: '🌱 Plant-Forward & Vegetable-Centric' },
  { value: 'ethical-sourcing', label: '🤝 Ethical Sourcing & Fair Trade' },
  { value: 'carbon-neutral', label: '🌍 Carbon Neutral & Climate-Friendly' },
  { value: 'upcycled', label: '♻️ Upcycled & Food Recovery' },

  // Premium & Luxury Categories
  { value: 'luxury-dining', label: '💎 Luxury Dining & Fine Dining' },
  { value: 'private-dining', label: '🔒 Private Dining & Members Club' },
  { value: 'concierge-service', label: '🤵 Concierge Service & VIP' },
  { value: 'bespoke-experiences', label: '🎨 Bespoke Experiences & Custom' },
  { value: 'exclusive-events', label: '🎪 Exclusive Events & Private Functions' },
  { value: 'premium-tasting', label: '🍷 Premium Tasting & Sommelier' },
  { value: 'luxury-catering', label: '💒 Luxury Catering & High-End' },

  // Niche & Specialty Categories
  { value: 'food-hall', label: '🏪 Food Hall & Market' },
  { value: 'pop-up', label: '🎪 Pop-Up & Temporary' },
  { value: 'food-truck-park', label: '🚚 Food Truck Park & Mobile Market' },
  { value: 'community-kitchen', label: '🏠 Community Kitchen & Shared Space' },
  { value: 'ghost-brand', label: '👻 Ghost Brand & Virtual Restaurant' },
  { value: 'regional-chain', label: '🏪 Regional Chain & Local Favorite' },
  { value: 'independent', label: '🏠 Independent & Local Owned' },
  { value: 'family-owned', label: '👨‍👩‍👧‍👦 Family Owned & Operated' },
  { value: 'woman-owned', label: '👩 Woman Owned & Led' },
  { value: 'minority-owned', label: '🌍 Minority Owned & Diverse' },
  { value: 'b-corp', label: '🏢 B Corp & Certified Business' },
  { value: 'non-profit', label: '🤝 Non-Profit & Social Enterprise' },

  // Alternative & Emerging Categories
  { value: 'cell-based', label: '🧫 Cell-Based & Cultivated' },
  { value: 'lab-grown', label: '🧪 Lab-Grown & Alternative Protein' },
  { value: 'insect-protein', label: '🦗 Insect Protein & Alternative' },
  { value: 'algae-based', label: '🌿 Algae-Based & Sustainable' },
  { value: 'mushroom-based', label: '🍄 Mushroom-Based & Mycoprotein' },
  { value: 'fermented', label: '🥛 Fermented & Probiotic' },
  { value: 'ancient-grains', label: '🌾 Ancient Grains & Heritage' },
  { value: 'future-food', label: '🚀 Future Food & Innovation' },
  { value: 'space-food', label: '🚀 Space Food & Astronaut' },
  { value: '3d-printed', label: '🖨️ 3D Printed Food & Custom' },
  { value: 'personalized-nutrition', label: '🧬 Personalized Nutrition & DNA-Based' },

  // Cultural & Heritage Categories
  { value: 'heritage-recipes', label: '📜 Heritage Recipes & Traditional' },
  { value: 'indigenous-cuisine', label: '🌍 Indigenous Cuisine & Native' },
  { value: 'cultural-fusion', label: '🌍 Cultural Fusion & Heritage' },
  { value: 'immigrant-cuisine', label: '🌍 Immigrant Cuisine & Diaspora' },
  { value: 'regional-heritage', label: '🗺️ Regional Heritage & Local' },
  { value: 'family-recipes', label: '👨‍👩‍👧‍👦 Family Recipes & Generational' },
  { value: 'street-food', label: '🚚 Street Food & Hawker' },
  { value: 'village-cuisine', label: '🏠 Village Cuisine & Rural' },
  { value: 'tribal-cuisine', label: '🏠 Tribal Cuisine & Community' },
  { value: 'historical-recreation', label: '📜 Historical Recreation & Period' },
  { value: 'festival-food', label: '🎉 Festival Food & Celebration' },
  { value: 'ceremonial-food', label: '🎊 Ceremonial Food & Ritual' }
]

export type RestaurantCategory = typeof RESTAURANT_CATEGORIES[number]

export function getRestaurantCategories(): typeof RESTAURANT_CATEGORIES {
  return RESTAURANT_CATEGORIES
}

export function getRestaurantCategoryByValue(value: string): RestaurantCategory | undefined {
  return RESTAURANT_CATEGORIES.find(category => category.value === value)
}

export function getRestaurantCategoriesByType(type: string): typeof RESTAURANT_CATEGORIES {
  // Filter categories based on type keywords
  return RESTAURANT_CATEGORIES.filter(category => 
    category.value.toLowerCase().includes(type.toLowerCase())
  )
}

export function isRestaurantCategory(value: string): boolean {
  return RESTAURANT_CATEGORIES.some(category => category.value === value)
}
