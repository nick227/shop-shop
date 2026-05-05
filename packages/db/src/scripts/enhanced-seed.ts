/**
 * Enhanced Database Seeding Script
 * Creates diverse stores and items with proper relationships and placehold.co images
 * Includes dietary information, allergens, and geographic diversity
 */
import { PrismaClient, Role, MediaKind } from '../generated/client/index.js'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

// Diverse store types with realistic data
const STORE_TYPES = {
  PIZZA: {
    name: 'Mario\'s Authentic Pizza',
    description: 'Wood-fired Neapolitan pizza with imported Italian ingredients',
    categories: ['Pizza', 'Pasta', 'Salads', 'Appetizers'],
    items: [
      { title: 'Margherita Pizza', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 16.99, category: 'Pizza', isVegan: false, isVegetarian: true, isGlutenFree: false, allergens: ['gluten', 'dairy'], spicyLevel: 0 },
      { title: 'Pepperoni Pizza', description: 'Classic pepperoni with mozzarella', price: 18.99, category: 'Pizza', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['gluten', 'dairy', 'pork'], spicyLevel: 0 },
      { title: 'Quattro Stagioni', description: 'Artichokes, mushrooms, olives, prosciutto', price: 22.99, category: 'Pizza', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['gluten', 'dairy', 'pork'], spicyLevel: 0 },
      { title: 'Spaghetti Carbonara', description: 'Creamy pasta with pancetta and pecorino', price: 15.99, category: 'Pasta', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['gluten', 'dairy', 'eggs', 'pork'], spicyLevel: 0 },
      { title: 'Caesar Salad', description: 'Romaine, parmesan, croutons, house dressing', price: 9.99, category: 'Salads', isVegan: false, isVegetarian: true, isGlutenFree: false, allergens: ['dairy', 'eggs', 'gluten'], spicyLevel: 0 },
      { title: 'Garlic Bread', description: 'Fresh baked with garlic butter', price: 6.99, category: 'Appetizers', isVegan: false, isVegetarian: true, isGlutenFree: false, allergens: ['gluten', 'dairy'], spicyLevel: 0 },
    ]
  },
  BURGER: {
    name: 'Smith\'s Gourmet Burgers',
    description: 'Premium grass-fed beef burgers with craft beer selection',
    categories: ['Burgers', 'Fries', 'Shakes', 'Sides'],
    items: [
      { title: 'Classic Cheeseburger', description: 'Beef patty, American cheese, lettuce, tomato', price: 12.99, category: 'Burgers', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['gluten', 'dairy', 'eggs'], spicyLevel: 0 },
      { title: 'Bacon BBQ Burger', description: 'Beef patty, bacon, cheddar, BBQ sauce', price: 15.99, category: 'Burgers', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['gluten', 'dairy', 'pork'], spicyLevel: 2 },
      { title: 'Mushroom Swiss Burger', description: 'Beef patty, sautéed mushrooms, Swiss cheese', price: 14.99, category: 'Burgers', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['gluten', 'dairy'], spicyLevel: 0 },
      { title: 'Veggie Burger', description: 'Plant-based patty, avocado, sprouts', price: 13.99, category: 'Burgers', isVegan: true, isVegetarian: true, isGlutenFree: true, allergens: ['soy'], spicyLevel: 0 },
      { title: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with sea salt', price: 5.99, category: 'Fries', isVegan: true, isVegetarian: true, isGlutenFree: true, allergens: [], spicyLevel: 0 },
      { title: 'Chocolate Milkshake', description: 'Thick and creamy chocolate milkshake', price: 4.99, category: 'Shakes', isVegan: false, isVegetarian: true, isGlutenFree: true, allergens: ['dairy'], spicyLevel: 0 },
    ]
  },
  SUSHI: {
    name: 'Tanaka Sushi Bar',
    description: 'Fresh sushi and sashimi prepared by master chefs',
    categories: ['Rolls', 'Sashimi', 'Nigiri', 'Appetizers'],
    items: [
      { title: 'California Roll', description: 'Crab, avocado, cucumber', price: 8.99, category: 'Rolls', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['fish', 'soy'], spicyLevel: 0 },
      { title: 'Spicy Tuna Roll', description: 'Fresh tuna with spicy mayo', price: 9.99, category: 'Rolls', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['fish', 'soy', 'eggs'], spicyLevel: 3 },
      { title: 'Dragon Roll', description: 'Shrimp tempura, eel, avocado', price: 16.99, category: 'Rolls', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['fish', 'shellfish', 'soy'], spicyLevel: 0 },
      { title: 'Salmon Sashimi', description: '6 pieces of fresh Atlantic salmon', price: 14.99, category: 'Sashimi', isVegan: false, isVegetarian: false, isGlutenFree: true, allergens: ['fish'], spicyLevel: 0 },
      { title: 'Tuna Sashimi', description: '6 pieces of fresh yellowfin tuna', price: 15.99, category: 'Sashimi', isVegan: false, isVegetarian: false, isGlutenFree: true, allergens: ['fish'], spicyLevel: 0 },
      { title: 'Miso Soup', description: 'Traditional Japanese soup with tofu', price: 3.99, category: 'Appetizers', isVegan: true, isVegetarian: true, isGlutenFree: false, allergens: ['soy'], spicyLevel: 0 },
    ]
  },
  COFFEE: {
    name: 'Brew & Grind Coffee',
    description: 'Artisan coffee roasted in-house with fresh pastries',
    categories: ['Coffee', 'Espresso', 'Pastries', 'Breakfast'],
    items: [
      { title: 'Espresso', description: 'Bold and rich single shot', price: 3.50, category: 'Espresso', isVegan: true, isVegetarian: true, isGlutenFree: true, allergens: [], spicyLevel: 0 },
      { title: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 4.50, category: 'Coffee', isVegan: false, isVegetarian: true, isGlutenFree: true, allergens: ['dairy'], spicyLevel: 0 },
      { title: 'Oat Milk Latte', description: 'Espresso with creamy oat milk', price: 5.25, category: 'Coffee', isVegan: true, isVegetarian: true, isGlutenFree: false, allergens: ['gluten'], spicyLevel: 0 },
      { title: 'Croissant', description: 'Buttery flaky French croissant', price: 3.50, category: 'Pastries', isVegan: false, isVegetarian: true, isGlutenFree: false, allergens: ['gluten', 'dairy', 'eggs'], spicyLevel: 0 },
      { title: 'Avocado Toast', description: 'Smashed avocado on artisan bread', price: 7.50, category: 'Breakfast', isVegan: true, isVegetarian: true, isGlutenFree: false, allergens: ['gluten'], spicyLevel: 0 },
      { title: 'Vegan Muffin', description: 'Blueberry muffin made without dairy', price: 3.00, category: 'Pastries', isVegan: true, isVegetarian: true, isGlutenFree: false, allergens: ['gluten'], spicyLevel: 0 },
    ]
  },
  THAI: {
    name: 'Bangkok Kitchen',
    description: 'Authentic Thai cuisine with bold flavors and fresh ingredients',
    categories: ['Curry', 'Noodles', 'Rice Dishes', 'Appetizers'],
    items: [
      { title: 'Green Curry', description: 'Coconut curry with vegetables and Thai basil', price: 11.99, category: 'Curry', isVegan: true, isVegetarian: true, isGlutenFree: true, allergens: ['coconut'], spicyLevel: 4 },
      { title: 'Pad Thai', description: 'Stir-fried rice noodles with shrimp and tofu', price: 10.99, category: 'Noodles', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['fish', 'shellfish', 'soy', 'eggs'], spicyLevel: 2 },
      { title: 'Drunken Noodles', description: 'Spicy basil noodles with chicken', price: 11.50, category: 'Noodles', isVegan: false, isVegetarian: false, isGlutenFree: false, allergens: ['soy'], spicyLevel: 5 },
      { title: 'Basil Fried Rice', description: 'Jasmine rice with Thai basil and vegetables', price: 9.99, category: 'Rice Dishes', isVegan: true, isVegetarian: true, isGlutenFree: true, allergens: ['soy'], spicyLevel: 3 },
      { title: 'Spring Rolls', description: 'Fresh vegetables wrapped in rice paper', price: 6.99, category: 'Appetizers', isVegan: true, isVegetarian: true, isGlutenFree: true, allergens: [], spicyLevel: 0 },
      { title: 'Tom Yum Soup', description: 'Spicy and sour soup with mushrooms', price: 7.99, category: 'Appetizers', isVegan: true, isVegetarian: true, isGlutenFree: true, allergens: ['soy'], spicyLevel: 4 },
    ]
  }
}

// Geographic locations for diversity
const LOCATIONS = [
  { city: 'New York', state: 'NY', zip: '10001', lat: 40.7589, lng: -73.9851, street: '123 Broadway' },
  { city: 'Los Angeles', state: 'CA', zip: '90001', lat: 34.0522, lng: -118.2437, street: '456 Sunset Blvd' },
  { city: 'San Francisco', state: 'CA', zip: '94102', lat: 37.7749, lng: -122.4194, street: '789 Market St' },
  { city: 'Austin', state: 'TX', zip: '78701', lat: 30.2672, lng: -97.7431, street: '321 Congress Ave' },
  { city: 'Seattle', state: 'WA', zip: '98101', lat: 47.6062, lng: -122.3321, street: '654 Pike St' },
]

// Color schemes for placehold.co images
const IMAGE_COLORS = {
  store: ['0066cc', 'ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57', 'ff9ff3', '54a0ff'],
  item: ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57', 'ff9ff3', '54a0ff', '5f27cd'],
  text: ['white', 'black', '333333', '666666']
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...')
  
  await prisma.postLike.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.item.deleteMany()
  await prisma.mediaAsset.deleteMany()
  await prisma.store.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ Database cleaned')
}

async function createUsers() {
  console.log('👤 Creating users...')
  
  const passwordHash = await hash('Test123456!', 10)
  
  const users = [
    {
      email: 'customer@test.com',
      name: 'Test Customer',
      phone: '555-0101',
      role: 'USER' as const,
    },
    {
      email: 'pizza@test.com',
      name: 'Mario Rossi',
      phone: '555-0102',
      role: 'VENDOR' as const,
      isCompany: true,
      companyName: 'Mario\'s Pizza Co.',
    },
    {
      email: 'burger@test.com',
      name: 'John Smith',
      phone: '555-0103',
      role: 'VENDOR' as const,
      isCompany: true,
      companyName: 'Smith\'s Burger Joint',
    },
    {
      email: 'sushi@test.com',
      name: 'Yuki Tanaka',
      phone: '555-0104',
      role: 'VENDOR' as const,
      isCompany: true,
      companyName: 'Tanaka Sushi Inc.',
    },
    {
      email: 'coffee@test.com',
      name: 'Sarah Johnson',
      phone: '555-0105',
      role: 'VENDOR' as const,
      isCompany: true,
      companyName: 'Brew & Grind LLC',
    },
    {
      email: 'thai@test.com',
      name: 'Pim Chen',
      phone: '555-0106',
      role: 'VENDOR' as const,
      isCompany: true,
      companyName: 'Bangkok Kitchen Inc.',
    },
  ]

  const createdUsers = []
  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
      },
    })
    createdUsers.push(user)
  }

  console.log(`✅ Created ${createdUsers.length} users`)
  return createdUsers
}

async function createStores(users: any[]) {
  console.log('🏪 Creating stores...')
  
  const storeTypes = Object.keys(STORE_TYPES)
  const createdStores = []
  
  for (let i = 0; i < storeTypes.length; i++) {
    const storeTypeKey = storeTypes[i]
    const storeType = STORE_TYPES[storeTypeKey as keyof typeof STORE_TYPES]
    const location = LOCATIONS[i % LOCATIONS.length]
    const user = users[i + 1] // Skip customer user
    
    const store = await prisma.store.create({
      data: {
        ownerUserId: user.id,
        name: storeType.name,
        slug: storeType.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: storeType.description,
        isPublished: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        prepTimeMin: 15 + Math.floor(Math.random() * 30),
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        addressStreet: location.street,
        addressCity: location.city,
        addressState: location.state,
        addressZip: location.zip,
        addressCountry: 'US',
        geocodedAt: new Date(),
        geocodeSource: 'manual',
        phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        email: user.email,
        deliveryDistance: 5 + Math.floor(Math.random() * 10),
        deliveryCharge: 2.99 + Math.floor(Math.random() * 3),
        commissionRate: 8 + Math.floor(Math.random() * 7),
        hoursJson: {
          monday: { open: '10:00', close: '22:00' },
          tuesday: { open: '10:00', close: '22:00' },
          wednesday: { open: '10:00', close: '22:00' },
          thursday: { open: '10:00', close: '22:00' },
          friday: { open: '10:00', close: '23:00' },
          saturday: { open: '09:00', close: '23:00' },
          sunday: { open: '09:00', close: '21:00' },
        },
        feesJson: {
          deliveryFee: 2.99 + Math.floor(Math.random() * 3),
          serviceFee: 1.50 + Math.floor(Math.random() * 2),
          minimumOrder: 10.00 + Math.floor(Math.random() * 10),
        },
      },
    })
    
    // Add store cover image with varied colors
    const storeColor = IMAGE_COLORS.store[i % IMAGE_COLORS.store.length]
    const textColor = IMAGE_COLORS.text[i % IMAGE_COLORS.text.length]
    const storeCoverUrl = `https://placehold.co/1200x400/${storeColor}/${textColor}?text=${encodeURIComponent(storeType.name)}`
    
    await prisma.mediaAsset.create({
      data: {
        storeId: store.id,
        kind: MediaKind.IMAGE,
        url: storeCoverUrl,
        altText: `${storeType.name} cover photo`,
        sortIndex: 0,
      },
    })
    
    createdStores.push(store)
    console.log(`✅ Created: ${storeType.name} in ${location.city}, ${location.state}`)
  }

  console.log(`✅ Created ${createdStores.length} stores`)
  return createdStores
}

async function createMenuItems(stores: any[]) {
  console.log('🍽️ Creating menu items...')
  
  const storeTypes = Object.keys(STORE_TYPES)
  let totalItems = 0
  
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    const storeTypeKey = storeTypes[i]
    const storeType = STORE_TYPES[storeTypeKey as keyof typeof STORE_TYPES]
    
    for (let j = 0; j < storeType.items.length; j++) {
      const itemData = storeType.items[j]
      
      const item = await prisma.item.create({
        data: {
          storeId: store.id,
          title: itemData.title,
          description: itemData.description,
          price: itemData.price,
          isActive: true,
          isSoldOut: Math.random() < 0.05, // 5% chance sold out
          sortIndex: j,
          optionsJson: { 
            category: itemData.category,
            dietary: {
              isVegan: itemData.isVegan,
              isVegetarian: itemData.isVegetarian,
              isGlutenFree: itemData.isGlutenFree,
              isDairyFree: !itemData.allergens.includes('dairy'),
              spicyLevel: itemData.spicyLevel,
              allergens: itemData.allergens
            }
          },
          stockQty: Math.floor(Math.random() * 50) + 10,
        },
      })
      
      // Add item image with varied colors and sizes
      const itemColor = IMAGE_COLORS.item[j % IMAGE_COLORS.item.length]
      const textColor = IMAGE_COLORS.text[j % IMAGE_COLORS.text.length]
      const itemSize = 400 + Math.floor(Math.random() * 200)
      const itemImageUrl = `https://placehold.co/${itemSize}x${itemSize}/${itemColor}/${textColor}?text=${encodeURIComponent(itemData.title)}`
      
      await prisma.mediaAsset.create({
        data: {
          itemId: item.id,
          kind: MediaKind.IMAGE,
          url: itemImageUrl,
          altText: itemData.title,
          sortIndex: 0,
        },
      })
      
      totalItems++
    }
  }

  console.log(`✅ Created ${totalItems} menu items`)
}

async function createSamplePosts(stores: any[]) {
  console.log('📱 Creating sample river posts...')
  
  const postTemplates = [
    { content: 'Fresh batch just out of the kitchen! 🔥', imgWidth: 800, imgHeight: 600 },
    { content: 'Special deal today only! Come try our signature dish 😋', imgWidth: 600, imgHeight: 400 },
    { content: 'Behind the scenes in our kitchen 👨‍🍳', imgWidth: 800, imgHeight: 800 },
    { content: 'New menu item alert! What do you think? 🤔', imgWidth: 600, imgHeight: 600 },
    { content: 'Happy hour starts now! 🍻', imgWidth: 800, imgHeight: 600 },
    { content: 'Check out this beautiful presentation 📸', imgWidth: 1000, imgHeight: 667 },
    { content: 'We love our community! Thank you for your support ❤️', imgWidth: 800, imgHeight: 600 },
    { content: 'Cooking up something special today 🔪', imgWidth: 600, imgHeight: 800 },
  ]
  
  let postCount = 0
  
  for (const store of stores) {
    const numPosts = Math.floor(Math.random() * 4) + 2
    for (let p = 0; p < numPosts; p++) {
      const postTemplate = postTemplates[Math.floor(Math.random() * postTemplates.length)]
      const postColor = IMAGE_COLORS.store[Math.floor(Math.random() * IMAGE_COLORS.store.length)]
      const postImageUrl = `https://placehold.co/${postTemplate.imgWidth}x${postTemplate.imgHeight}/${postColor}/white?text=${encodeURIComponent(store.name + ' Post')}`
      
      await prisma.post.create({
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
  }
  
  console.log(`✅ Created ${postCount} river posts`)
}

async function main() {
  try {
    console.log('🌱 Starting enhanced database seed...\n')
    
    // 1. Clean existing data
    await cleanDatabase()
    
    // 2. Create users
    const users = await createUsers()
    
    // 3. Create stores
    const stores = await createStores(users)
    
    // 4. Create menu items
    await createMenuItems(stores)
    
    // 5. Create sample river posts
    await createSamplePosts(stores)
    
    // 6. Summary
    console.log('\n✅ Enhanced database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Users: ${users.length} (1 customer, ${users.length - 1} vendors)`)
    console.log(`   Stores: ${stores.length} (Pizza, Burger, Sushi, Coffee, Thai)`)
    console.log(`   Items: 30 menu items with dietary info`)
    console.log(`   Posts: ${stores.length * 3} river posts`)
    console.log('\n🔑 Test Credentials:')
    console.log(`   Customer: customer@test.com / Test123456!`)
    console.log(`   Pizza Vendor: pizza@test.com / Test123456!`)
    console.log(`   Burger Vendor: burger@test.com / Test123456!`)
    console.log(`   Sushi Vendor: sushi@test.com / Test123456!`)
    console.log(`   Coffee Vendor: coffee@test.com / Test123456!`)
    console.log(`   Thai Vendor: thai@test.com / Test123456!`)
    console.log('\n🏪 Store URLs:')
    stores.forEach(store => {
      console.log(`   ${store.name}: http://localhost:5177/stores/${store.id}`)
    })
    console.log('\n🖼️  All images use https://placehold.co/ with varied colors and sizes')
    console.log('✨ Enhanced with dietary info, allergens, and geographic diversity!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
