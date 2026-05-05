/**
 * Prune Database to Main Stores
 * Keeps only: Sushi Zen, Burger Heaven, Tony's Pizza Palace
 * Deletes all other test stores
 */
import { prisma } from '../client.js'

const STORES_TO_KEEP = [
  'Sushi Zen',
  'Burger Heaven',
  "Tony's Pizza Palace"
]

// Real coordinates and addresses for the 3 main stores
const STORE_DATA = {
  'Sushi Zen': {
    street: '789 Ocean Dr',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
  },
  'Burger Heaven': {
    street: '456 Burger Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    latitude: 34.0522,
    longitude: -118.2437,
  },
  "Tony's Pizza Palace": {
    street: '123 Pizza Lane',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    latitude: 40.7505,
    longitude: -73.9934,
  },
}

async function pruneDatabase() {
  console.log('🗑️  Pruning database to main stores only...\n')

  // Get all stores
  const allStores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  console.log(`Total stores in database: ${allStores.length}`)

  // Find stores to keep
  const storesToKeep = allStores.filter(s => STORES_TO_KEEP.includes(s.name))
  const storesToDelete = allStores.filter(s => !STORES_TO_KEEP.includes(s.name))

  console.log(`Stores to keep: ${storesToKeep.length}`)
  console.log(`Stores to delete: ${storesToDelete.length}\n`)

  if (storesToKeep.length === 0) {
    console.error('❌ No stores found to keep! Aborting to prevent data loss.')
    return
  }

  storesToKeep.forEach(s => console.log(`  ✓ Keeping: ${s.name}`))
  console.log()

  // Delete stores we don't want to keep
  console.log('Deleting other stores...')
  
  for (const store of storesToDelete) {
    try {
      await prisma.store.delete({
        where: { id: store.id },
      })
      console.log(`  ✗ Deleted: ${store.name}`)
    } catch (error) {
      console.error(`  ⚠️  Could not delete ${store.name}:`, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  console.log(`\n✓ Deleted ${storesToDelete.length} stores\n`)

  // Update the 3 main stores with real coordinates
  console.log('📍 Updating main stores with real coordinates...\n')

  for (const storeName of STORES_TO_KEEP) {
    const storeData = STORE_DATA[storeName as keyof typeof STORE_DATA]
    
    try {
      const updated = await prisma.store.updateMany({
        where: { name: storeName },
        data: {
          latitude: storeData.latitude,
          longitude: storeData.longitude,
          addressStreet: storeData.street,
          addressCity: storeData.city,
          addressState: storeData.state,
          addressZip: storeData.zip,
          addressCountry: 'US',
          geocodedAt: new Date(),
          geocodeSource: 'manual',
        },
      })

      if (updated.count > 0) {
        console.log(`✓ ${storeName}`)
        console.log(`  ${storeData.street}, ${storeData.city}, ${storeData.state} ${storeData.zip}`)
        console.log(`  Coordinates: ${storeData.latitude}, ${storeData.longitude}\n`)
      }
    } catch (error) {
      console.error(`✗ Failed to update ${storeName}:`, error)
    }
  }

  // Verify final state
  const finalStores = await prisma.store.findMany({
    select: {
      name: true,
      latitude: true,
      longitude: true,
      addressCity: true,
      addressState: true,
    },
  })

  console.log('='.repeat(60))
  console.log('📊 FINAL DATABASE STATE')
  console.log('='.repeat(60))
  console.log(`Total stores: ${finalStores.length}\n`)

  finalStores.forEach(store => {
    console.log(`${store.name}`)
    console.log(`  Location: ${store.addressCity}, ${store.addressState}`)
    console.log(`  Coordinates: ${store.latitude}, ${store.longitude}`)
    console.log(`  Has coordinates: ${store.latitude ? '✓' : '✗'}\n`)
  })

  console.log('✓ Database pruning complete!')
}

// Run the script
pruneDatabase()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

