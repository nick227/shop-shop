/**
 * CLI for cron (e.g. every 2–5 min). Loads repo-root `.env`.
 *
 *   pnpm --filter @packages/db ingest:river
 *   pnpm ingest:river   # from monorepo root
 *
 * Env: `DATABASE_URL`, optional `RIVER_INGEST_RESTOCK=true`, `RIVER_AUTO_PRODUCT_COOLDOWN_HOURS`.
 */
import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../../../.env') })

async function main(): Promise<void> {
  const [{ prisma }, { runRiverIngestion }] = await Promise.all([
    import('../client.js'),
    import('../services/river-ingest.runner.js'),
  ])

  try {
    const result = await runRiverIngestion(prisma)
    // eslint-disable-next-line no-console -- CLI output
    console.log(JSON.stringify({ ok: true, ...result }))
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- CLI errors
    console.error(err)
    process.exitCode = 1
  })
