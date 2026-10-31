import { PrismaClient } from '../src/generated/client/index.js'
import { cleanSeedTables } from './seed-tables.js'
import { seedFullDemo } from './seed-demo.js'
import { seedAustinStores } from '../src/scripts/seed-austin-stores.js'
import { seedUsers } from '../src/scripts/seed-users.js'
import { seedCanonicalTags } from '../src/scripts/seed-tags.js'
import { seedGeocodingCache } from '../seed-geocoding-cache.js'
import { seedCityCache } from '../seed-city-cache.js'
import { ensureOfficialPlatformStore } from '../src/scripts/seed-official-platform-store.js'
import { seedCustomers } from '../src/scripts/seed-customers.js'
import { seedSiteActivity } from '../src/scripts/seed-activity.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('Seeding database...\n')

  console.log('[1/9] Cleaning tables...')
  await cleanSeedTables(prisma)

  console.log('[2/9] Canonical tags...')
  await seedCanonicalTags(prisma)

  console.log('[3/9] User accounts...')
  await seedUsers(prisma)

  console.log('[4/9] Customers...')
  await seedCustomers(prisma)

  console.log('[5/9] Official platform store...')
  await ensureOfficialPlatformStore(prisma)

  console.log('[6/9] Demo catalog...')
  await seedFullDemo(prisma)

  console.log('[7/9] Austin stores and products...')
  await seedAustinStores(prisma)

  console.log('[8/9] Site activity...')
  await seedSiteActivity(prisma)

  console.log('[9/9] Geocoding cache...')
  await seedGeocodingCache(prisma)
  await seedCityCache(prisma)

  console.log('\nSeed complete.\n')
  console.log('Accounts (password: Test123456!)')
  console.log('  admin@seed.local (God-level admin)')
  console.log('  admin2@seed.local (Platform admin)')
  console.log('  staff@seed.local (Support staff)')
  console.log('  customer@seed.local (Regular customer)')
  console.log('  maya.chen@seed.local, jordan.lee@seed.local, sam.patel@seed.local')
  console.log('  riley.nguyen@seed.local, alex.brooks@seed.local')
  console.log('  vendor@seed.local (Active vendor, owns Seed Bistro North and South)')
  console.log('  vendor-pending@seed.local (Pending vendor)')
  console.log('  affiliate@seed.local (Active affiliate)')
  console.log('  affiliate-pending@seed.local (Pending affiliate)')
  console.log('  rider@seed.local (Delivery rider)')
  console.log('  vendor-{store-slug}@test.com  (Austin stores - one per store)')
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
