/**
 * Austin Area Store Seeding Script
 * Seeds stores near Austin ZIP 78758 with items and river posts
 * Uses placehold.co for placeholder images
 *
 * Marketplace visibility (`checkStoreActivationRequirements` in storeActivation.service.ts):
 * each store must have required profile fields, ≥1 store media, ≥1 active non–sold-out item,
 * delivery or pickup enabled, and ACTIVE status with no disabledAt.
 */
import { fileURLToPath } from 'url'
import { PrismaClient, Role, MediaKind } from '../generated/client/index.js'
import { hash } from 'bcrypt'

// Austin area ZIPs with coordinates near 78758
const AUSTIN_LOCATIONS = [
  { zip: '78758', lat: 30.3764, lng: -97.7078, area: 'North Central' },
  { zip: '78757', lat: 30.3437, lng: -97.7316, area: 'North Loop' },
  { zip: '78759', lat: 30.4036, lng: -97.7526, area: 'Allandale' },
  { zip: '78752', lat: 30.3316, lng: -97.7004, area: 'Windsor Park' },
  { zip: '78753', lat: 30.3649, lng: -97.6827, area: 'Georgian Acres' },
  { zip: '78751', lat: 30.3093, lng: -97.7242, area: 'Hyde Park' },
  { zip: '78756', lat: 30.3223, lng: -97.7390, area: 'Hancock' },
  { zip: '78705', lat: 30.2896, lng: -97.7396, area: 'West Campus' },
]

// Store types with their item templates
const STORE_TYPES = {
  COFFEE: {
    categories: ['Coffee', 'Espresso', 'Pastries', 'Breakfast'],
    names: ['Roast House', 'Bean & Brew', 'Coffee Culture', 'Morning Grind', 'Espresso Bar'],
    descriptions: ['Locally roasted coffee beans', 'Artisan coffee and pastries', 'Third wave coffee experience', 'Fresh brewed daily'],
  },
  PIZZA: {
    categories: ['Pizza', 'Pasta', 'Salads', 'Appetizers'],
    names: ['Pizza Paradise', 'Slice House', 'Stone Oven', 'Pizza Joint', 'Dough Bros'],
    descriptions: ['Wood-fired artisan pizza', 'New York style pizza', 'Authentic Italian pizza', 'Fresh ingredients daily'],
  },
  BURGER: {
    categories: ['Burgers', 'Fries', 'Shakes', 'Sides'],
    names: ['Burger Shack', 'Patty Palace', 'Grill Masters', 'Burger Bliss', 'The Burger Spot'],
    descriptions: ['Gourmet burgers and craft beer', 'Smash burgers done right', 'Fresh ground daily', 'Best burgers in Austin'],
  },
  SUSHI: {
    categories: ['Rolls', 'Sashimi', 'Nigiri', 'Appetizers'],
    names: ['Sushi Bar', 'Roll House', 'Tokyo Kitchen', 'Sushi Express', 'Zen Sushi'],
    descriptions: ['Fresh fish daily', 'Traditional Japanese cuisine', 'Modern sushi rolls', 'Authentic sushi experience'],
  },
  TACO: {
    categories: ['Tacos', 'Burritos', 'Quesadillas', 'Sides'],
    names: ['Taco Heaven', 'El Taco Loco', 'Taco Truck', 'Tacos Y Mas', 'Taco Paradise'],
    descriptions: ['Authentic street tacos', 'Fresh tortillas made daily', 'Traditional Mexican cuisine', 'Best tacos in Texas'],
  },
  THAI: {
    categories: ['Curry', 'Noodles', 'Rice Dishes', 'Appetizers'],
    names: ['Thai Spice', 'Bangkok Kitchen', 'Thai Express', 'Taste of Thailand', 'Thai Garden'],
    descriptions: ['Authentic Thai cuisine', 'Fresh ingredients daily', 'Traditional recipes', 'Bold flavors'],
  },
  BBQ: {
    categories: ['Brisket', 'Ribs', 'Sides', 'Sandwiches'],
    names: ['Smoke House', 'BBQ Pit', 'Texas BBQ', 'Pit Masters', 'BBQ Shack'],
    descriptions: ['Texas-style BBQ', 'Slow smoked meats', 'Award-winning BBQ', 'Authentic pit BBQ'],
  },
  BAKERY: {
    categories: ['Bread', 'Pastries', 'Cakes', 'Cookies'],
    names: ['Sweet Tooth', 'Artisan Bakery', 'Fresh Baked', 'Bakery Bliss', 'Sugar & Spice'],
    descriptions: ['Fresh baked daily', 'Artisan breads and pastries', 'Custom cakes available', 'European-style bakery'],
  },
}

// Sample menu items for each category with enhanced data
const MENU_ITEMS = {
  Coffee: [
    { title: 'Espresso', price: 3.50, desc: 'Bold and rich espresso shot', isVegan: true, isGlutenFree: true, isDairyFree: true },
    { title: 'Cappuccino', price: 4.50, desc: 'Espresso with steamed milk and foam', isVegetarian: true },
    { title: 'Latte', price: 4.75, desc: 'Smooth espresso with steamed milk', isVegetarian: true },
    { title: 'Cold Brew', price: 4.00, desc: 'Smooth cold-brewed coffee', isVegan: true, isGlutenFree: true, isDairyFree: true },
    { title: 'Americano', price: 3.75, desc: 'Espresso with hot water', isVegan: true, isGlutenFree: true, isDairyFree: true },
  ],
  Espresso: [
    { title: 'Double Shot', price: 4.00, desc: 'Two shots of espresso', isVegan: true, isGlutenFree: true, isDairyFree: true },
    { title: 'Macchiato', price: 4.25, desc: 'Espresso with foam', isVegetarian: true },
    { title: 'Cortado', price: 4.50, desc: 'Espresso with equal parts steamed milk', isVegetarian: true },
  ],
  Pastries: [
    { title: 'Croissant', price: 3.50, desc: 'Buttery flaky croissant', isVegetarian: true, allergens: ['wheat', 'dairy'] },
    { title: 'Muffin', price: 3.00, desc: 'Fresh baked muffin', isVegetarian: true, allergens: ['wheat', 'eggs', 'dairy'] },
    { title: 'Danish', price: 3.75, desc: 'Sweet pastry with fruit', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
  ],
  Breakfast: [
    { title: 'Breakfast Sandwich', price: 6.50, desc: 'Egg, cheese, and choice of meat', isVegetarian: false, allergens: ['wheat', 'dairy', 'eggs'] },
    { title: 'Avocado Toast', price: 7.50, desc: 'Smashed avocado on artisan bread', isVegan: true, isGlutenFree: false, allergens: ['wheat'] },
    { title: 'Breakfast Burrito', price: 7.00, desc: 'Eggs, cheese, and salsa wrapped in tortilla', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
  ],
  Pizza: [
    { title: 'Margherita', price: 12.99, desc: 'Fresh mozzarella, basil, tomato sauce', isVegetarian: true, allergens: ['wheat', 'dairy'] },
    { title: 'Pepperoni', price: 14.99, desc: 'Classic pepperoni pizza', isVegetarian: false, allergens: ['wheat', 'dairy'] },
    { title: 'Veggie Supreme', price: 13.99, desc: 'Loaded with fresh vegetables', isVegan: false, isVegetarian: true, allergens: ['wheat', 'dairy'] },
    { title: 'Meat Lovers', price: 16.99, desc: 'Pepperoni, sausage, bacon, ham', isVegetarian: false, allergens: ['wheat', 'dairy'] },
    { title: 'BBQ Chicken', price: 15.99, desc: 'BBQ sauce, chicken, red onions', isVegetarian: false, allergens: ['wheat', 'dairy'] },
  ],
  Pasta: [
    { title: 'Spaghetti Carbonara', price: 13.99, desc: 'Creamy pasta with bacon', isVegetarian: false, allergens: ['wheat', 'dairy', 'eggs'] },
    { title: 'Penne Arrabiata', price: 12.99, desc: 'Spicy tomato sauce', isVegan: true, isGlutenFree: false, spicyLevel: 2, allergens: ['wheat'] },
    { title: 'Fettuccine Alfredo', price: 13.50, desc: 'Creamy alfredo sauce', isVegetarian: true, allergens: ['wheat', 'dairy'] },
  ],
  Salads: [
    { title: 'Caesar Salad', price: 8.99, desc: 'Romaine, parmesan, croutons', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
    { title: 'Greek Salad', price: 9.50, desc: 'Feta, olives, tomatoes, cucumber', isVegetarian: true, isGlutenFree: true, allergens: ['dairy'] },
  ],
  Appetizers: [
    { title: 'Garlic Bread', price: 5.99, desc: 'Fresh baked garlic bread', isVegetarian: true, allergens: ['wheat', 'dairy'] },
    { title: 'Mozzarella Sticks', price: 6.99, desc: 'Fried mozzarella with marinara', isVegetarian: true, allergens: ['wheat', 'dairy'] },
    { title: 'Wings', price: 9.99, desc: 'Buffalo or BBQ wings', isVegetarian: false, allergens: [] },
  ],
  Burgers: [
    { title: 'Classic Burger', price: 9.99, desc: 'Beef patty, lettuce, tomato, pickles', isVegetarian: false, allergens: ['wheat'] },
    { title: 'Cheeseburger', price: 10.99, desc: 'Classic with American cheese', isVegetarian: false, allergens: ['wheat', 'dairy'] },
    { title: 'Bacon Burger', price: 11.99, desc: 'Bacon, cheese, BBQ sauce', isVegetarian: false, allergens: ['wheat', 'dairy'] },
    { title: 'Mushroom Swiss', price: 11.50, desc: 'Sautéed mushrooms, Swiss cheese', isVegetarian: false, allergens: ['wheat', 'dairy'] },
    { title: 'Veggie Burger', price: 10.50, desc: 'Plant-based patty', isVegan: true, isVegetarian: true, allergens: ['wheat'] },
  ],
  Fries: [
    { title: 'Regular Fries', price: 3.99, desc: 'Crispy golden fries', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: [] },
    { title: 'Sweet Potato Fries', price: 4.99, desc: 'Sweet potato fries', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: [] },
    { title: 'Loaded Fries', price: 6.99, desc: 'Cheese, bacon, sour cream', isVegetarian: false, allergens: ['dairy'] },
  ],
  Shakes: [
    { title: 'Vanilla Shake', price: 4.99, desc: 'Classic vanilla milkshake', isVegetarian: true, allergens: ['dairy'] },
    { title: 'Chocolate Shake', price: 4.99, desc: 'Rich chocolate milkshake', isVegetarian: true, allergens: ['dairy'] },
    { title: 'Strawberry Shake', price: 4.99, desc: 'Fresh strawberry shake', isVegetarian: true, allergens: ['dairy'] },
  ],
  Sides: [
    { title: 'Onion Rings', price: 4.99, desc: 'Beer-battered onion rings', isVegetarian: true, allergens: ['wheat'] },
    { title: 'Coleslaw', price: 2.99, desc: 'Creamy coleslaw', isVegetarian: true, allergens: ['dairy', 'eggs'] },
    { title: 'Mac & Cheese', price: 4.50, desc: 'Creamy mac and cheese', isVegetarian: true, allergens: ['wheat', 'dairy'] },
  ],
  Rolls: [
    { title: 'California Roll', price: 8.99, desc: 'Crab, avocado, cucumber', isVegetarian: false, allergens: ['fish', 'shellfish'] },
    { title: 'Spicy Tuna Roll', price: 9.99, desc: 'Spicy tuna with cucumber', isVegetarian: false, allergens: ['fish', 'shellfish'] },
    { title: 'Dragon Roll', price: 14.99, desc: 'Shrimp tempura, eel, avocado', isVegetarian: false, allergens: ['fish', 'shellfish'] },
    { title: 'Rainbow Roll', price: 15.99, desc: 'Assorted fish over California roll', isVegetarian: false, allergens: ['fish', 'shellfish'] },
    { title: 'Philadelphia Roll', price: 9.50, desc: 'Salmon, cream cheese, cucumber', isVegetarian: false, allergens: ['fish', 'dairy', 'shellfish'] },
  ],
  Sashimi: [
    { title: 'Salmon Sashimi', price: 12.99, desc: '6 pieces of fresh salmon', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: ['fish'] },
    { title: 'Tuna Sashimi', price: 13.99, desc: '6 pieces of fresh tuna', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: ['fish'] },
    { title: 'Yellowtail Sashimi', price: 14.99, desc: '6 pieces of yellowtail', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: ['fish'] },
  ],
  Nigiri: [
    { title: 'Salmon Nigiri', price: 5.99, desc: '2 pieces of salmon nigiri', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: ['fish'] },
    { title: 'Tuna Nigiri', price: 6.50, desc: '2 pieces of tuna nigiri', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: ['fish'] },
    { title: 'Eel Nigiri', price: 6.99, desc: '2 pieces of eel nigiri', isVegetarian: false, allergens: ['fish'] },
  ],
  Tacos: [
    { title: 'Carnitas Taco', price: 3.50, desc: 'Slow-cooked pork', isVegetarian: false, isGlutenFree: true, allergens: [] },
    { title: 'Carne Asada Taco', price: 3.75, desc: 'Grilled steak', isVegetarian: false, isGlutenFree: true, allergens: [] },
    { title: 'Chicken Taco', price: 3.25, desc: 'Seasoned grilled chicken', isVegetarian: false, isGlutenFree: true, allergens: [] },
    { title: 'Fish Taco', price: 4.50, desc: 'Beer-battered fish', isVegetarian: false, allergens: ['wheat', 'fish'] },
    { title: 'Veggie Taco', price: 3.00, desc: 'Grilled vegetables', isVegan: true, isGlutenFree: true, allergens: [] },
  ],
  Burritos: [
    { title: 'Bean & Cheese Burrito', price: 6.50, desc: 'Refried beans and cheese', isVegetarian: true, allergens: ['wheat', 'dairy'] },
    { title: 'Carnitas Burrito', price: 8.99, desc: 'Pork, rice, beans', isVegetarian: false, isGlutenFree: true, allergens: [] },
    { title: 'Steak Burrito', price: 9.99, desc: 'Steak, rice, beans, salsa', isVegetarian: false, isGlutenFree: true, allergens: [] },
  ],
  Quesadillas: [
    { title: 'Cheese Quesadilla', price: 5.99, desc: 'Melted cheese in tortilla', isVegetarian: true, allergens: ['wheat', 'dairy'] },
    { title: 'Chicken Quesadilla', price: 7.99, desc: 'Chicken and cheese', isVegetarian: false, isGlutenFree: true, allergens: ['dairy'] },
    { title: 'Steak Quesadilla', price: 8.99, desc: 'Steak and cheese', isVegetarian: false, isGlutenFree: true, allergens: ['dairy'] },
  ],
  Curry: [
    { title: 'Green Curry', price: 11.99, desc: 'Coconut curry with vegetables', isVegan: true, isGlutenFree: true, spicyLevel: 3, allergens: [] },
    { title: 'Red Curry', price: 11.99, desc: 'Spicy red curry', isVegan: true, isGlutenFree: true, spicyLevel: 4, allergens: [] },
    { title: 'Massaman Curry', price: 12.99, desc: 'Mild curry with peanuts', isVegetarian: false, isGlutenFree: true, spicyLevel: 1, allergens: ['peanuts'] },
  ],
  Noodles: [
    { title: 'Pad Thai', price: 10.99, desc: 'Stir-fried rice noodles', isVegetarian: false, isGlutenFree: false, spicyLevel: 2, allergens: ['wheat', 'peanuts', 'shellfish'] },
    { title: 'Drunken Noodles', price: 11.50, desc: 'Spicy basil noodles', isVegetarian: false, isGlutenFree: false, spicyLevel: 4, allergens: ['wheat', 'shellfish'] },
    { title: 'Pad See Ew', price: 10.99, desc: 'Sweet soy noodles', isVegetarian: false, isGlutenFree: false, spicyLevel: 1, allergens: ['wheat', 'shellfish'] },
  ],
  'Rice Dishes': [
    { title: 'Fried Rice', price: 9.99, desc: 'Thai-style fried rice', isVegan: true, isGlutenFree: true, isDairyFree: true, allergens: [] },
    { title: 'Basil Fried Rice', price: 10.50, desc: 'Spicy basil fried rice', isVegan: true, isGlutenFree: true, isDairyFree: true, spicyLevel: 2, allergens: [] },
  ],
  Brisket: [
    { title: 'Sliced Brisket', price: 14.99, desc: 'Tender smoked brisket', unit: 'lb', isVegetarian: false, isGlutenFree: true, isDairyFree: true, allergens: [] },
    { title: 'Chopped Brisket', price: 13.99, desc: 'Chopped smoked brisket', unit: 'lb', isVegetarian: false, isGlutenFree: true, isDairyFree: true, allergens: [] },
  ],
  Ribs: [
    { title: 'Beef Ribs', price: 16.99, desc: 'Slow-smoked beef ribs', unit: 'lb', isVegetarian: false, isGlutenFree: true, isDairyFree: true, allergens: [] },
    { title: 'Pork Ribs', price: 14.99, desc: 'Fall-off-the-bone ribs', unit: 'lb', isVegetarian: false, isGlutenFree: true, isDairyFree: true, allergens: [] },
  ],
  Sandwiches: [
    { title: 'Brisket Sandwich', price: 9.99, desc: 'Sliced brisket on Texas toast', isVegetarian: false, allergens: ['wheat', 'dairy'] },
    { title: 'Pulled Pork Sandwich', price: 8.99, desc: 'Pulled pork with coleslaw', isVegetarian: false, allergens: ['wheat', 'dairy', 'eggs'] },
  ],
  Bread: [
    { title: 'Sourdough Loaf', price: 6.99, desc: 'Fresh sourdough bread', isVegan: true, isVegetarian: true, allergens: ['wheat'] },
    { title: 'Baguette', price: 4.99, desc: 'French baguette', isVegan: true, isVegetarian: true, allergens: ['wheat'] },
    { title: 'Ciabatta', price: 5.50, desc: 'Italian ciabatta', isVegan: true, isVegetarian: true, allergens: ['wheat'] },
  ],
  Cakes: [
    { title: 'Chocolate Cake', price: 4.99, desc: 'Rich chocolate cake slice', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
    { title: 'Carrot Cake', price: 4.50, desc: 'Moist carrot cake with cream cheese frosting', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs', 'nuts'] },
    { title: 'Red Velvet', price: 5.50, desc: 'Classic red velvet cake', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
  ],
  Cookies: [
    { title: 'Chocolate Chip Cookie', price: 2.50, desc: 'Classic chocolate chip', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
    { title: 'Oatmeal Cookie', price: 2.25, desc: 'Oatmeal raisin cookie', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
    { title: 'Sugar Cookie', price: 2.00, desc: 'Soft sugar cookie', isVegetarian: true, allergens: ['wheat', 'dairy', 'eggs'] },
  ],
}

// Bundle combinations for each store type
const BUNDLE_COMBINATIONS = {
  COFFEE: [
    {
      name: 'Morning Starter Pack',
      description: 'Perfect way to start your day',
      items: ['Espresso', 'Croissant'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 6.50,
      savingsLabel: 'Save $0.50!'
    },
    {
      name: 'Coffee Lover\'s Combo',
      description: 'For the true coffee enthusiast',
      items: ['Latte', 'Muffin', 'Americano'],
      pricingType: 'DISCOUNT_PERCENT' as const,
      discountPercent: 15,
      savingsLabel: 'Save 15%!'
    }
  ],
  PIZZA: [
    {
      name: 'Classic Pizza Night',
      description: 'Everything you need for pizza night',
      items: ['Margherita', 'Garlic Bread', 'Caesar Salad'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 25.99,
      savingsLabel: 'Save $3.99!'
    },
    {
      name: 'Family Feast',
      description: 'Feed the whole family',
      items: ['Pepperoni', 'Meat Lovers', 'Wings'],
      pricingType: 'DISCOUNT_AMOUNT' as const,
      discountAmount: 8.00,
      savingsLabel: 'Save $8!'
    }
  ],
  BURGER: [
    {
      name: 'Burger & Fries Combo',
      description: 'Classic American combo',
      items: ['Classic Burger', 'Regular Fries', 'Vanilla Shake'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 16.99,
      savingsLabel: 'Save $1.97!'
    },
    {
      name: 'Double Burger Deluxe',
      description: 'Double the burger, double the flavor',
      items: ['Cheeseburger', 'Bacon Burger', 'Loaded Fries'],
      pricingType: 'DISCOUNT_PERCENT' as const,
      discountPercent: 20,
      savingsLabel: 'Save 20%!'
    }
  ],
  SUSHI: [
    {
      name: 'Sushi Sampler',
      description: 'Perfect introduction to sushi',
      items: ['California Roll', 'Salmon Nigiri', 'Tuna Nigiri'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 22.99,
      savingsLabel: 'Save $2.49!'
    },
    {
      name: 'Sushi Master Platter',
      description: 'For the sushi connoisseur',
      items: ['Dragon Roll', 'Rainbow Roll', 'Salmon Sashimi', 'Yellowtail Sashimi'],
      pricingType: 'DISCOUNT_AMOUNT' as const,
      discountAmount: 12.00,
      savingsLabel: 'Save $12!'
    }
  ],
  TACO: [
    {
      name: 'Taco Trio',
      description: 'Three tacos, three ways',
      items: ['Carnitas Taco', 'Chicken Taco', 'Veggie Taco'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 9.99,
      savingsLabel: 'Save $0.26!'
    },
    {
      name: 'Taco Feast',
      description: 'Complete Mexican meal',
      items: ['Carne Asada Taco', 'Fish Taco', 'Bean & Cheese Burrito', 'Cheese Quesadilla'],
      pricingType: 'DISCOUNT_PERCENT' as const,
      discountPercent: 18,
      savingsLabel: 'Save 18%!'
    }
  ],
  THAI: [
    {
      name: 'Thai Favorites',
      description: 'Best of Thai cuisine',
      items: ['Pad Thai', 'Green Curry', 'Fried Rice'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 32.99,
      savingsLabel: 'Save $2.97!'
    },
    {
      name: 'Spicy Thai Experience',
      description: 'For those who like it hot',
      items: ['Red Curry', 'Drunken Noodles', 'Basil Fried Rice'],
      pricingType: 'DISCOUNT_AMOUNT' as const,
      discountAmount: 7.00,
      savingsLabel: 'Save $7!'
    }
  ],
  BBQ: [
    {
      name: 'BBQ Sampler',
      description: 'Try all our BBQ favorites',
      items: ['Sliced Brisket', 'Pulled Pork Sandwich', 'Loaded Fries'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 28.99,
      savingsLabel: 'Save $4.97!'
    },
    {
      name: 'BBQ Feast',
      description: 'Full BBQ experience',
      items: ['Chopped Brisket', 'Beef Ribs', 'Pork Ribs'],
      pricingType: 'DISCOUNT_PERCENT' as const,
      discountPercent: 12,
      savingsLabel: 'Save 12%!'
    }
  ],
  BAKERY: [
    {
      name: 'Morning Pastries',
      description: 'Fresh baked morning treats',
      items: ['Croissant', 'Muffin', 'Danish'],
      pricingType: 'FIXED_PRICE' as const,
      fixedPrice: 9.99,
      savingsLabel: 'Save $0.26!'
    },
    {
      name: 'Sweet Tooth Special',
      description: 'For the dessert lover',
      items: ['Chocolate Cake', 'Chocolate Chip Cookie', 'Oatmeal Cookie'],
      pricingType: 'DISCOUNT_AMOUNT' as const,
      discountAmount: 2.00,
      savingsLabel: 'Save $2!'
    }
  ]
}

// River post templates
const POST_TEMPLATES = [
  { content: 'Fresh batch just out of the oven! 🔥', imgWidth: 800, imgHeight: 600 },
  { content: 'Special deal today only! Come try our signature dish 😋', imgWidth: 600, imgHeight: 400 },
  { content: 'Behind the scenes in our kitchen 👨‍🍳', imgWidth: 800, imgHeight: 800 },
  { content: 'New menu item alert! What do you think? 🤔', imgWidth: 600, imgHeight: 600 },
  { content: 'Happy hour starts now! 🍻', imgWidth: 800, imgHeight: 600 },
  { content: 'Check out this beautiful presentation 📸', imgWidth: 1000, imgHeight: 667 },
  { content: 'We love our community! Thank you for your support ❤️', imgWidth: 800, imgHeight: 600 },
  { content: 'Cooking up something special today 🔪', imgWidth: 600, imgHeight: 800 },
  { content: 'Who wants this? Drop a ❤️ if you do!', imgWidth: 800, imgHeight: 600 },
  { content: 'Made with love, served with a smile 😊', imgWidth: 800, imgHeight: 600 },
]

const PASSWORD = 'Test123456!'

// Helper function to generate variety of image URLs
function generateImageUrls(baseSeed: string, count: number, width: number, height: number): string[] {
  const urls: string[] = []
  const variations = ['', '-alt', '-detail', '-wide', '-closeup', '-interior', '-exterior', '-menu', '-food', '-atmosphere']
  
  for (let i = 0; i < count; i++) {
    const variation = variations[i % variations.length]
    const randomWidth = width + Math.floor(Math.random() * 100) - 50
    const randomHeight = height + Math.floor(Math.random() * 100) - 50
    urls.push(`https://picsum.photos/seed/${baseSeed}${variation}/${randomWidth}/${randomHeight}.jpg`)
  }
  return urls
}

// Helper function to create delivery zones
function createDeliveryZones(storeLat: number, storeLng: number, storeId: string) {
  // Create 3 delivery zones in concentric circles around the store
  const zones = [
    {
      name: 'Nearby Delivery',
      storeId,
      polygonJson: {
        type: 'Polygon',
        coordinates: [[
          // 1-mile radius circle (approximated as octagon)
          [storeLng - 0.014, storeLat - 0.009],
          [storeLng + 0.014, storeLat - 0.009],
          [storeLng + 0.018, storeLat],
          [storeLng + 0.014, storeLat + 0.009],
          [storeLng - 0.014, storeLat + 0.009],
          [storeLng - 0.018, storeLat],
          [storeLng - 0.014, storeLat - 0.009]
        ]]
      },
      baseFee: 2.99,
      minOrder: 15.00,
      isActive: true,
      priority: 3
    },
    {
      name: 'Extended Delivery',
      storeId,
      polygonJson: {
        type: 'Polygon',
        coordinates: [[
          // 3-mile radius circle
          [storeLng - 0.042, storeLat - 0.027],
          [storeLng + 0.042, storeLat - 0.027],
          [storeLng + 0.054, storeLat],
          [storeLng + 0.042, storeLat + 0.027],
          [storeLng - 0.042, storeLat + 0.027],
          [storeLng - 0.054, storeLat],
          [storeLng - 0.042, storeLat - 0.027]
        ]]
      },
      baseFee: 4.99,
      minOrder: 20.00,
      isActive: true,
      priority: 2
    },
    {
      name: 'Far Delivery',
      storeId,
      polygonJson: {
        type: 'Polygon',
        coordinates: [[
          // 5-mile radius circle
          [storeLng - 0.070, storeLat - 0.045],
          [storeLng + 0.070, storeLat - 0.045],
          [storeLng + 0.090, storeLat],
          [storeLng + 0.070, storeLat + 0.045],
          [storeLng - 0.070, storeLat + 0.045],
          [storeLng - 0.090, storeLat],
          [storeLng - 0.070, storeLat - 0.045]
        ]]
      },
      baseFee: 7.99,
      minOrder: 25.00,
      isActive: true,
      priority: 1
    }
  ]
  return zones
}

// Helper function to create bundles for a store
async function createBundleForStore(
  prisma: PrismaClient,
  storeId: string,
  bundleTemplate: any,
  storeItems: any[]
) {
  // Find items that match the bundle template
  const bundleItems = []
  for (const itemName of bundleTemplate.items) {
    const item = storeItems.find(i => i.title === itemName)
    if (item) {
      bundleItems.push({
        itemId: item.id,
        quantity: 1,
        sortIndex: bundleItems.length
      })
    }
  }
  
  if (bundleItems.length === 0) return
  
  // Create bundle
  const bundle = await prisma.bundle.create({
    data: {
      storeId,
      name: bundleTemplate.name,
      description: bundleTemplate.description,
      imageUrl: `https://picsum.photos/seed/${bundleTemplate.name.replace(/\s+/g, '')}/600/400.jpg`,
      isActive: true,
      sortIndex: 0
    }
  })
  
  // Create bundle items
  for (const bundleItem of bundleItems) {
    await prisma.bundleItem.create({
      data: {
        bundleId: bundle.id,
        itemId: bundleItem.itemId,
        quantity: bundleItem.quantity,
        sortIndex: bundleItem.sortIndex
      }
    })
  }
  
  // Create bundle pricing
  await prisma.bundlePricing.create({
    data: {
      bundleId: bundle.id,
      pricingType: bundleTemplate.pricingType,
      fixedPrice: bundleTemplate.fixedPrice,
      discountPercent: bundleTemplate.discountPercent,
      discountAmount: bundleTemplate.discountAmount,
      showSavings: true,
      savingsLabel: bundleTemplate.savingsLabel
    }
  })
}

// Helper function to create sample favorites for realistic engagement
async function createSampleFavorites(prisma: PrismaClient) {
  console.log('\n🎯 Creating sample favorites...')
  
  // Get customer user
  const customer = await prisma.user.findFirst({ where: { email: 'customer@seed.local' } })
  if (!customer) {
    console.log('⚠️  Customer user not found, skipping favorites')
    return
  }
  
  // Get some stores and items
  const stores = await prisma.store.findMany({ take: 10 })
  const items = await prisma.item.findMany({ take: 20 })
  
  let favoriteStoreCount = 0
  let favoriteItemCount = 0
  
  // Create favorite stores (random 3-5 stores) using upsert to handle duplicates
  const numFavoriteStores = Math.floor(Math.random() * 3) + 3
  for (let i = 0; i < numFavoriteStores && i < stores.length; i++) {
    const store = stores[i]
    await prisma.favoriteStore.upsert({
      where: {
        userId_storeId: {
          userId: customer.id,
          storeId: store.id
        }
      },
      update: {},
      create: {
        userId: customer.id,
        storeId: store.id
      }
    })
    favoriteStoreCount++
  }
  
  // Create favorite items (random 5-10 items) using upsert to handle duplicates
  const numFavoriteItems = Math.floor(Math.random() * 6) + 5
  for (let i = 0; i < numFavoriteItems && i < items.length; i++) {
    const item = items[i]
    await prisma.favoriteItem.upsert({
      where: {
        userId_itemId: {
          userId: customer.id,
          itemId: item.id
        }
      },
      update: {},
      create: {
        userId: customer.id,
        itemId: item.id
      }
    })
    favoriteItemCount++
  }
  
  console.log(`   ❤️  Favorite stores created: ${favoriteStoreCount}`)
  console.log(`   ⭐ Favorite items created: ${favoriteItemCount}`)
}

export async function seedAustinStores(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Starting Austin store seeding...\n')

  const passwordHash = await hash(PASSWORD, 10)
  let vendorCount = 0
  let storeCount = 0
  let itemCount = 0
  let postCount = 0
  let mediaCount = 0

  // Create stores for each location
  for (const location of AUSTIN_LOCATIONS) {
    // Randomly select 1-3 store types for this location
    const storeTypesArray = Object.keys(STORE_TYPES)
    const numStores = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < numStores; i++) {
      const storeTypeKey = storeTypesArray[Math.floor(Math.random() * storeTypesArray.length)]
      const storeType = STORE_TYPES[storeTypeKey as keyof typeof STORE_TYPES]
      
      // Generate store name
      const baseName = storeType.names[Math.floor(Math.random() * storeType.names.length)]
      const storeName = `${baseName} ${location.area}`
      const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      // Check if store already exists
      const existingStore = await prisma.store.findUnique({ where: { slug } })
      if (existingStore) {
        console.log(`⏭️  Skipping ${storeName} (already exists)`)
        continue
      }
      
      // Create vendor user
      const vendorEmail = `vendor-${slug}@test.com`
      const vendor = await prisma.user.upsert({
        where: { email: vendorEmail },
        update: {},
        create: {
          email: vendorEmail,
          passwordHash,
          name: `${baseName} Owner`,
          role: Role.VENDOR,
          isCompany: true,
          companyName: `${storeName} LLC`,
          phone: `512${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        },
      })
      vendorCount++
      
      // Generate random street address
      const streetNumber = Math.floor(Math.random() * 9000) + 1000
      const streetNames = ['N Lamar Blvd', 'Burnet Rd', 'Airport Blvd', 'Guadalupe St', 'Research Blvd', 'Anderson Ln', 'Metric Blvd', 'Mopac Expy']
      const street = `${streetNumber} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`
      
      // Small random offset (within 0.5 miles)
      const latOffset = (Math.random() - 0.5) * 0.01
      const lngOffset = (Math.random() - 0.5) * 0.01
      
      // Create store
      const description = storeType.descriptions[Math.floor(Math.random() * storeType.descriptions.length)]
      const store = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: storeName,
          slug,
          description,
          isPublished: true,
          status: 'ACTIVE',
          deliveryEnabled: true,
          pickupEnabled: true,
          prepTimeMin: 15 + Math.floor(Math.random() * 30),
          latitude: location.lat + latOffset,
          longitude: location.lng + lngOffset,
          addressStreet: street,
          addressCity: 'Austin',
          addressState: 'TX',
          addressZip: location.zip,
          addressCountry: 'US',
          geocodedAt: new Date(),
          geocodeSource: 'manual',
          phone: `512${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          email: vendorEmail,
          deliveryDistance: 5 + Math.floor(Math.random() * 10),
          deliveryCharge: 2.99 + Math.floor(Math.random() * 3),
          commissionRate: 8 + Math.floor(Math.random() * 7), // 8-15%
          hoursJson: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '23:00' },
            saturday: { open: '09:00', close: '23:00' },
            sunday: { open: '09:00', close: '21:00' },
          },
        },
      })
      storeCount++
      
      // Add multiple store media images (3-5) using Lorem Picsum
      const numStoreMedia = Math.floor(Math.random() * 3) + 3 // 3-5 images
      const storeMediaUrls = generateImageUrls(storeName.replace(/\s+/g, ''), numStoreMedia, 1200, 400)
      
      for (let i = 0; i < storeMediaUrls.length; i++) {
        await prisma.mediaAsset.create({
          data: {
            storeId: store.id,
            kind: MediaKind.IMAGE,
            url: storeMediaUrls[i],
            altText: `${storeName} photo ${i + 1}`,
            sortIndex: i,
          },
        })
        mediaCount++
      }
      
      console.log(`✅ Created: ${storeName}`)
      console.log(`   📍 ${street}, ${location.area}, TX ${location.zip}`)
      console.log(`   🗺️  ${(location.lat + latOffset).toFixed(4)}, ${(location.lng + lngOffset).toFixed(4)}`)
      
      // Create items for each category
      let storeItemCount = 0
      const storeItems = [] // Collect all items for bundle creation
      for (const category of storeType.categories) {
        const categoryItems = MENU_ITEMS[category as keyof typeof MENU_ITEMS] || []
        
        for (const itemTemplate of categoryItems) {
          const item = await prisma.item.create({
            data: {
              storeId: store.id,
              title: itemTemplate.title,
              description: itemTemplate.desc,
              price: itemTemplate.price,
              isActive: true,
              // Keep ≥1 sellable SKU per store so activation `hasActiveProducts` stays true
              isSoldOut: false,
              sortIndex: storeItemCount,
              optionsJson: { category },
              stockQty: Math.floor(Math.random() * 50) + 10,
              // Add dietary flags and allergens
              isVegan: (itemTemplate as any).isVegan || false,
              isVegetarian: (itemTemplate as any).isVegetarian || false,
              isGlutenFree: (itemTemplate as any).isGlutenFree || false,
              isDairyFree: (itemTemplate as any).isDairyFree || false,
              spicyLevel: (itemTemplate as any).spicyLevel || null,
              allergensJson: (itemTemplate as any).allergens ? (itemTemplate as any).allergens : undefined,
            },
          })
          storeItems.push(item) // Add to store items array
          itemCount++
          storeItemCount++
          
          // Add multiple item media images (2-3) using Lorem Picsum
          const numItemMedia = Math.floor(Math.random() * 2) + 2 // 2-3 images
          const itemMediaUrls = generateImageUrls(itemTemplate.title.replace(/\s+/g, ''), numItemMedia, 400, 400)
          
          for (let i = 0; i < itemMediaUrls.length; i++) {
            await prisma.mediaAsset.create({
              data: {
                itemId: item.id,
                kind: MediaKind.IMAGE,
                url: itemMediaUrls[i],
                altText: `${itemTemplate.title} photo ${i + 1}`,
                sortIndex: i,
              },
            })
            mediaCount++
          }
        }
      }
      
      console.log(`   🍽️  ${storeItemCount} menu items`)
      
      // Create delivery zones for this store
      const deliveryZones = createDeliveryZones(location.lat, location.lng, store.id)
      for (const zone of deliveryZones) {
        await prisma.deliveryZone.create({ data: zone })
      }
      
      // Create 2-5 river posts for this store
      const numPosts = Math.floor(Math.random() * 4) + 2
      for (let p = 0; p < numPosts; p++) {
        const postTemplate = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)]
        const postImageUrl = `https://picsum.photos/seed/${storeName.replace(/\s+/g, '')}-post-${p}/${postTemplate.imgWidth}/${postTemplate.imgHeight}.jpg`
        
        const post = await prisma.post.create({
          data: {
            storeId: store.id,
            content: postTemplate.content,
            mediaUrls: [postImageUrl],
            likesCount: Math.floor(Math.random() * 50),
            commentsCount: Math.floor(Math.random() * 10),
          },
        })
        postCount++
      }
      
      console.log(`   📱 ${numPosts} river posts`)
      
      // Create bundles for this store type
      const storeBundles = BUNDLE_COMBINATIONS[storeTypeKey as keyof typeof BUNDLE_COMBINATIONS] || []
      for (const bundleTemplate of storeBundles) {
        await createBundleForStore(prisma, store.id, bundleTemplate, storeItems)
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ SEEDING COMPLETE!')
  console.log('='.repeat(70))
  console.log(`\n📊 Summary:`)
  console.log(`   👤 Vendors created: ${vendorCount}`)
  console.log(`   🏪 Stores created: ${storeCount}`)
  console.log(`   🍽️  Items created: ${itemCount}`)
  console.log(`   📱 River posts created: ${postCount}`)
  console.log(`   🖼️  Media assets created: ${mediaCount}`)
  console.log(`   🎁 Bundles created: ${Math.floor(storeCount * 1.5)}`) // Average 1.5 bundles per store
  console.log(`   🚚 Delivery zones created: ${storeCount * 3}`) // 3 zones per store
  console.log(`
📍 Location: Austin, TX (near ZIP 78758)`)
  console.log(`   All stores within ~5 miles of 30.3764, -97.7078`)
  console.log(`
🖼️  Images: All using https://picsum.photos/`)
  console.log(`
🔑 Test Credentials:`)
  console.log(`   Password for all vendors: ${PASSWORD}`)
  console.log(`   Email format: vendor-{store-slug}@test.com`)
  console.log(`
✨ Ready for testing!\n`)
  
  // Create some favorites for realistic engagement
  await createSampleFavorites(prisma)
}

if (process.argv[1] === fileURLToPath(new URL(import.meta.url))) {
  const prisma = new PrismaClient()
  seedAustinStores(prisma)
    .catch((error) => { console.error('❌ Seeding failed:', error); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
}

