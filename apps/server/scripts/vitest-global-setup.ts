import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '@packages/db'

function redactDatabaseUrl(raw: string): string {
  return raw.replace(/:([^:@/]+)@/, ':***@')
}

function isMissingSchemaMessage(message: string): boolean {
  return (
    /does not exist/i.test(message) ||
    /Unknown table/i.test(message) ||
    /P2021/i.test(message)
  )
}

/**
 * Runs once before all server test workers. Ensures DATABASE_URL points at a
 * database that has Prisma migrations applied (core tables exist).
 */
export default async function vitestGlobalSetup(): Promise<() => Promise<void>> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(__dirname, '../..')
  config({ path: path.join(repoRoot, '.env') })
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'mysql://root@localhost:3306/delivery_app'
  }

  const dbUrl = process.env.DATABASE_URL

  try {
    await prisma.$connect()
    await Promise.all([prisma.user.findFirst({ take: 1 }), prisma.systemSetting.findFirst({ take: 1 })])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (isMissingSchemaMessage(message)) {
      // eslint-disable-next-line no-console -- intentional operator-facing diagnostic
      console.error(
        [
          '',
          '━━ @apps/server tests: database schema is missing ━━',
          `DATABASE_URL (redacted): ${redactDatabaseUrl(dbUrl)}`,
          'Prisma could not read core tables (User, SystemSetting). The database is empty, wrong, or migrations were never applied.',
          '',
          'From the repo root, run:',
          '  pnpm db:migrate',
          'or (reset + migrate + generate + DTOs):',
          '  pnpm fresh',
          '',
        ].join('\n'),
      )
      throw new Error(
        'Server tests require a migrated MySQL database. Fix DATABASE_URL or run migrations (see stderr above).',
      )
    }
    throw error
  }

  return async () => {
    await prisma.$disconnect()
  }
}
