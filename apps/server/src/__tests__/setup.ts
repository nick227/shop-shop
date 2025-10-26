import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
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
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || `http://localhost:${process.env.WEB_PORT || '5177'}`

// Global test setup
beforeAll(async () => {
  // Setup test environment
})

afterAll(async () => {
  // Final cleanup and disconnect
  await cleanupAllTestData()
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean database before each test to avoid unique constraint violations
  await cleanupAllTestData()
})

afterEach(async () => {
  // Cleanup after each test
  await cleanupAllTestData()
})

// Comprehensive cleanup function
async function cleanupAllTestData() {
  // Delete in correct order to respect foreign key constraints
  await prisma.mediaAsset.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.orderEvent.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.cart.deleteMany({})
  await prisma.address.deleteMany({})
  await prisma.item.deleteMany({})
  await prisma.promotion.deleteMany({})
  await prisma.store.deleteMany({})
  await prisma.user.deleteMany({})
}

