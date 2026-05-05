/**
 * Verification script to check seeded data
 */
import { PrismaClient } from '../generated/client/index.js'

const prisma = new PrismaClient()

async function verifySeededData() {
  console.log('🔍 Verifying seeded data...\n')
  
  // Check users
  const users = await prisma.user.findMany({
    include: {
      storesOwned: true
    }
  })
  console.log(`👤 Users: ${users.length}`)
  users.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - ${user.storesOwned.length} stores`)
  })
  
  // Check stores
  const stores = await prisma.store.findMany({
    include: {
      items: true,
      media: true,
      posts: true
    }
  })
  console.log(`\n🏪 Stores: ${stores.length}`)
  stores.forEach(store => {
    console.log(`   - ${store.name} (${store.addressCity}, ${store.addressState})`)
    console.log(`     Items: ${store.items.length}, Media: ${store.media.length}, Posts: ${store.posts.length}`)
  })
  
  // Check items with dietary info
  const items = await prisma.item.findMany({
    include: {
      media: true
    }
  })
  console.log(`\n🍽️ Items: ${items.length}`)
  
  // Show sample items with dietary info
  const sampleItems = items.slice(0, 5)
  console.log('\n📋 Sample Items with Dietary Info:')
  sampleItems.forEach(item => {
    const dietary = item.optionsJson?.dietary || {}
    console.log(`   - ${item.title} ($${item.price})`)
    console.log(`     Vegan: ${dietary.isVegan}, Vegetarian: ${dietary.isVegetarian}`)
    console.log(`     Gluten-Free: ${dietary.isGlutenFree}, Spicy Level: ${dietary.spicyLevel || 0}`)
    console.log(`     Allergens: ${dietary.allergens?.join(', ') || 'None'}`)
  })
  
  // Check media assets
  const mediaAssets = await prisma.mediaAsset.findMany()
  console.log(`\n🖼️ Media Assets: ${mediaAssets.length}`)
  
  // Show sample placehold.co URLs
  const sampleMedia = mediaAssets.slice(0, 3)
  console.log('\n📸 Sample Media URLs:')
  sampleMedia.forEach(media => {
    console.log(`   - ${media.url}`)
  })
  
  // Check posts
  const posts = await prisma.post.findMany()
  console.log(`\n📱 River Posts: ${posts.length}`)
  
  console.log('\n✅ Verification complete!')
}

verifySeededData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
