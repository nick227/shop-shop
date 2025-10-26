/**
 * Database Seed Script - Clean Implementation
 * Removes all existing data and seeds with clean, valid stores and items
 */
import { PrismaClient } from '../src/generated/client/index.js'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...')
  
  // Delete in reverse dependency order to avoid foreign key constraints
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
  
  const stores = [
    {
      ownerUserId: users[1].id, // Pizza vendor
      name: 'Mario\'s Pizza Palace',
      slug: 'marios-pizza-palace',
      description: 'Authentic Italian pizza made with fresh ingredients and traditional recipes',
      isPublished: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      prepTimeMin: 25,
      commissionRate: null, // Uses default platform rate
      addressStreet: '123 Main Street',
      addressCity: 'New York',
      addressState: 'NY',
      addressZip: '10001',
      addressCountry: 'US',
      latitude: 40.7589,
      longitude: -73.9851,
      geocodedAt: new Date(),
      geocodeSource: 'manual',
      hoursJson: {
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '22:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '12:00', close: '21:00' },
      },
      feesJson: {
        deliveryFee: 2.99,
        serviceFee: 1.50,
        minimumOrder: 15.00,
      },
    },
    {
      ownerUserId: users[2].id, // Burger vendor
      name: 'Smith\'s Burger Joint',
      slug: 'smiths-burger-joint',
      description: 'Gourmet burgers made with premium beef and fresh toppings',
      isPublished: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      prepTimeMin: 20,
      commissionRate: 8.5, // Premium vendor rate
      addressStreet: '456 Oak Avenue',
      addressCity: 'Los Angeles',
      addressState: 'CA',
      addressZip: '90001',
      addressCountry: 'US',
      latitude: 34.0522,
      longitude: -118.2437,
      geocodedAt: new Date(),
      geocodeSource: 'manual',
      hoursJson: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '11:00', close: '21:00' },
      },
      feesJson: {
        deliveryFee: 3.50,
        serviceFee: 2.00,
        minimumOrder: 12.00,
      },
    },
    {
      ownerUserId: users[3].id, // Sushi vendor
      name: 'Tanaka Sushi Bar',
      slug: 'tanaka-sushi-bar',
      description: 'Fresh sushi and sashimi prepared by master chefs',
      isPublished: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      prepTimeMin: 30,
      commissionRate: 12.0, // New vendor rate
      addressStreet: '789 Ocean Drive',
      addressCity: 'San Francisco',
      addressState: 'CA',
      addressZip: '94102',
      addressCountry: 'US',
      latitude: 37.7749,
      longitude: -122.4194,
      geocodedAt: new Date(),
      geocodeSource: 'manual',
      hoursJson: {
        monday: { open: '12:00', close: '21:00' },
        tuesday: { open: '12:00', close: '21:00' },
        wednesday: { open: '12:00', close: '21:00' },
        thursday: { open: '12:00', close: '21:00' },
        friday: { open: '12:00', close: '22:00' },
        saturday: { open: '12:00', close: '22:00' },
        sunday: { open: '13:00', close: '20:00' },
      },
      feesJson: {
        deliveryFee: 4.99,
        serviceFee: 2.50,
        minimumOrder: 20.00,
      },
    },
  ]

  const createdStores = []
  for (const storeData of stores) {
    const store = await prisma.store.create({
      data: storeData,
    })
    createdStores.push(store)
  }

  console.log(`✅ Created ${createdStores.length} stores`)
  return createdStores
}

async function createMenuItems(stores: any[]) {
  console.log('🍕 Creating menu items...')
  
  const menuData = {
    pizza: [
      { title: 'Margherita Pizza', description: 'Classic pizza with San Marzano tomatoes, fresh mozzarella, and basil', price: 16.99, category: 'Pizza' },
      { title: 'Pepperoni Pizza', description: 'Traditional pepperoni with mozzarella and our signature sauce', price: 18.99, category: 'Pizza' },
      { title: 'Quattro Stagioni', description: 'Four seasons pizza with artichokes, mushrooms, olives, and prosciutto', price: 22.99, category: 'Pizza' },
      { title: 'Diavola Pizza', description: 'Spicy salami with mozzarella and red peppers', price: 19.99, category: 'Pizza' },
      { title: 'Garlic Bread', description: 'Fresh baked bread with garlic butter and herbs', price: 6.99, category: 'Sides' },
      { title: 'Caesar Salad', description: 'Crisp romaine lettuce with parmesan, croutons, and house dressing', price: 9.99, category: 'Salads' },
    ],
    burger: [
      { title: 'Classic Cheeseburger', description: 'Beef patty with American cheese, lettuce, tomato, and special sauce', price: 12.99, category: 'Burgers' },
      { title: 'Bacon BBQ Burger', description: 'Beef patty with bacon, cheddar, onion rings, and BBQ sauce', price: 15.99, category: 'Burgers' },
      { title: 'Mushroom Swiss Burger', description: 'Beef patty with sautéed mushrooms and Swiss cheese', price: 14.99, category: 'Burgers' },
      { title: 'Veggie Burger', description: 'Plant-based patty with avocado, sprouts, and chipotle mayo', price: 13.99, category: 'Burgers' },
      { title: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with sea salt', price: 5.99, category: 'Sides' },
      { title: 'Onion Rings', description: 'Beer-battered onion rings with ranch dipping sauce', price: 6.99, category: 'Sides' },
      { title: 'Chocolate Milkshake', description: 'Thick and creamy chocolate milkshake', price: 4.99, category: 'Drinks' },
    ],
    sushi: [
      { title: 'California Roll', description: 'Crab, avocado, and cucumber wrapped in rice and seaweed', price: 8.99, category: 'Rolls' },
      { title: 'Spicy Tuna Roll', description: 'Fresh tuna with spicy mayo and cucumber', price: 9.99, category: 'Rolls' },
      { title: 'Dragon Roll', description: 'Shrimp tempura, avocado, topped with eel and eel sauce', price: 16.99, category: 'Rolls' },
      { title: 'Salmon Sashimi', description: '6 pieces of fresh Atlantic salmon', price: 14.99, category: 'Sashimi' },
      { title: 'Tuna Sashimi', description: '6 pieces of fresh yellowfin tuna', price: 15.99, category: 'Sashimi' },
      { title: 'Miso Soup', description: 'Traditional Japanese soup with tofu and seaweed', price: 3.99, category: 'Soup' },
      { title: 'Edamame', description: 'Steamed soybeans with sea salt', price: 4.99, category: 'Appetizers' },
    ],
  }

  const menuTypes = ['pizza', 'burger', 'sushi'] as const
  let totalItems = 0

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    const menuType = menuTypes[i]
    const items = menuData[menuType]

    for (const itemData of items) {
      const { category, ...itemFields } = itemData
      await prisma.item.create({
        data: {
          ...itemFields,
          storeId: store.id,
          isActive: true,
          optionsJson: { category },
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
    {
      content: 'Check out our new special! Fresh ingredients delivered daily.',
      mediaUrls: [{ type: 'image', url: 'https://placehold.co/600x400/ff6b6b/white?text=Special+Offer' }],
    },
    {
      content: 'Behind the scenes in our kitchen. Quality is our priority!',
      mediaUrls: [{ type: 'image', url: 'https://placehold.co/600x400/4ecdc4/white?text=Kitchen+Tour' }],
    },
    {
      content: 'Thank you for your support! We appreciate our customers.',
      mediaUrls: [],
    },
  ]

  for (const store of stores) {
    for (const template of postTemplates) {
      await prisma.post.create({
        data: {
          storeId: store.id,
          content: template.content,
          mediaUrls: template.mediaUrls,
        },
      })
    }
  }

  console.log(`✅ Created ${stores.length * postTemplates.length} river posts`)
}

async function main() {
  try {
    console.log('🌱 Starting clean database seed...')
    
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
    console.log('\n✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Users: ${users.length} (1 customer, ${users.length - 1} vendors)`)
    console.log(`   Stores: ${stores.length} (Pizza, Burger, Sushi)`)
    console.log(`   Items: 20 menu items`)
    console.log(`   Posts: ${stores.length * 3} river posts`)
    console.log('\n🔑 Test Credentials:')
    console.log(`   Customer: customer@test.com / Test123456!`)
    console.log(`   Pizza Vendor: pizza@test.com / Test123456!`)
    console.log(`   Burger Vendor: burger@test.com / Test123456!`)
    console.log(`   Sushi Vendor: sushi@test.com / Test123456!`)
    console.log('\n🏪 Store URLs:')
    stores.forEach(store => {
      console.log(`   ${store.name}: http://localhost:5177/stores/${store.id}`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

