/**
 * Seeds minimal demo rows (2 stores, 2 items, 2 posts) while exercising
 * related models across the schema (affiliate, bundles, zones, orders, etc.).
 */
import { PrismaClient } from '../src/generated/client/index.js'
import { seedFullDemo } from './seed-demo.js'
import { cleanSeedTables } from './seed-tables.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Seeding full-schema demo (minimal counts)...')
  await cleanSeedTables(prisma)
  await seedFullDemo(prisma)
  console.log('✅ Seed complete.')
  console.log('')
  console.log('Accounts (password: Test123456!)')
  console.log('  customer@seed.local')
  console.log('  vendor@seed.local')
  console.log('  affiliate@seed.local')
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
