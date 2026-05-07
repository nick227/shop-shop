import { PrismaClient } from '../src/generated/client/index.js'
import { cleanSeedTables } from './seed-tables.js'
import { seedFullDemo } from './seed-demo.js'
import { seedAustinStores } from '../src/scripts/seed-austin-stores.js'
import { seedUsers } from '../src/scripts/seed-users.js'
import { seedGeocodingCache } from '../seed-geocoding-cache.js'
import { seedCityCache } from '../seed-city-cache.js'
import { seedCanonicalTags } from '../src/scripts/seed-tags.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Seeding database...\n')

  console.log('[1/7] Cleaning tables...')
  await cleanSeedTables(prisma)

  console.log('[2/7] Canonical search tags...')
  await seedCanonicalTags(prisma)

  console.log('[3/7] Comprehensive user accounts...')
  await seedUsers(prisma)

  console.log('[4/7] Core demo accounts + schema coverage...')
  await seedFullDemo(prisma)

  console.log('[5/7] Austin store catalog...')
  await seedAustinStores(prisma)

  console.log('[6/7] Geocoding cache — ZIP codes...')
  await seedGeocodingCache(prisma)

  console.log('[7/7] Geocoding cache — cities...')
  await seedCityCache(prisma)

  console.log('\n✅ Seed complete.\n')
  console.log('Accounts (password: Test123456!)')
  console.log('  admin@seed.local (God-level admin)')
  console.log('  admin2@seed.local (Platform admin)')
  console.log('  staff@seed.local (Support staff)')
  console.log('  customer@seed.local (Regular customer)')
  console.log('  vendor@seed.local (Active vendor)')
  console.log('  vendor-pending@seed.local (Pending vendor)')
  console.log('  affiliate@seed.local (Active affiliate)')
  console.log('  affiliate-pending@seed.local (Pending affiliate)')
  console.log('  rider@seed.local (Delivery rider)')
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
