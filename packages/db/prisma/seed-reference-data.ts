/**
 * Reference data seed — canonical lookup tables that must exist in every environment.
 *
 * Run after every `prisma migrate deploy`:
 *   node --import tsx prisma/seed-reference-data.ts
 *
 * Safe to re-run at any time (all operations are upserts).
 */
import { PrismaClient } from '../src/generated/client/index.js'
import { seedCanonicalTags } from '../src/scripts/seed-tags.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('📦 Applying reference data...\n')
  await seedCanonicalTags(prisma)
  console.log('\n✅ Reference data complete.')
}

main()
  .catch((error: unknown) => {
    console.error('❌ Reference seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
