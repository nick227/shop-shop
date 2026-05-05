import { PrismaClient } from '../src/generated/client/index.js'
import { cleanSeedTables } from './seed-tables.js'
import { seedFullDemo } from './seed-demo.js'
import { seedAustinStores } from '../src/scripts/seed-austin-stores.js'
import { seedGeocodingCache } from '../seed-geocoding-cache.js'
import { seedCityCache } from '../seed-city-cache.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Seeding database...\n')

  console.log('[1/5] Cleaning tables...')
  await cleanSeedTables(prisma)

  console.log('[2/5] Core demo accounts + schema coverage...')
  await seedFullDemo(prisma)

  console.log('[3/5] Austin store catalog...')
  await seedAustinStores(prisma)

  console.log('[4/5] Geocoding cache — ZIP codes...')
  await seedGeocodingCache(prisma)

  console.log('[5/5] Geocoding cache — cities...')
  await seedCityCache(prisma)

  console.log('\n✅ Seed complete.\n')
  console.log('Accounts (password: Test123456!)')
  console.log('  customer@seed.local')
  console.log('  vendor@seed.local')
  console.log('  affiliate@seed.local')
  console.log('  vendor-{store-slug}@test.com  (Austin stores — one per store)')
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
