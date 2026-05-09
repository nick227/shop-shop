import { afterAll } from 'vitest'
import { config } from 'dotenv'
import { resolve } from 'path'
import { prisma } from '@packages/db'

// Load .env from project root
config({ path: resolve(process.cwd(), '../../.env') })

// Also try loading from packages/db if the above fails
if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), '../../node_modules/@packages/db/.env') })
}

// Ensure DATABASE_URL is set for tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://root@localhost:3306/delivery_app'
}

// Ensure required test environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '0' // Random port for tests
process.env.WEB_PORT = process.env.WEB_PORT || '5177'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-min-32-characters-long-for-testing'
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-min-32-characters-long-for-ci'
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || `http://localhost:${process.env.WEB_PORT || '5177'}`

afterAll(async () => {
  await prisma.$disconnect()
})
