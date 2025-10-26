import Fastify, { FastifyInstance } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import cors from '@fastify/cors'
import { prisma, generateJWT, Decimal } from '@packages/db'
import type { Role } from '@packages/db/generated/client'

// ========================================
// Test Server Creation
// ========================================

/**
 * Create a test Fastify instance
 * Useful for integration tests
 */
export const createTestServer = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: false, // Disable logging in tests
  })

  await app.register(cors, { origin: true })
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: { title: 'Test API', version: '0.1.0' },
    },
  })
  await app.register(swaggerUI, { routePrefix: '/docs' })

  return app
}

// ========================================
// Test Authentication Helpers
// ========================================

export interface TestUser {
  id: string
  email: string
  name: string | null
  role: Role
  token: string
  password: string  // Plain password for login tests
}

/**
 * Creates a test user in the database and returns user + JWT token
 * Use this for testing authenticated routes
 */
export const createAuthenticatedUser = async (
  role: Role = 'USER',
  overrides?: {
    email?: string
    name?: string
    phone?: string
    password?: string
  }
): Promise<TestUser> => {
  const { randomUUID } = await import('crypto')
  const uniqueId = randomUUID()
  const email = overrides?.email || `test-${role.toLowerCase()}-${uniqueId}@test.com`
  const password = overrides?.password || 'TestPassword123!'

  // Use bcrypt to hash password (same as production)
  const bcrypt = await import('bcrypt')
  const passwordHash = await bcrypt.hash(password, 12)

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: overrides?.name || `Test ${role} User`,
      phone: overrides?.phone,
      role,
    },
  })

  // Generate real JWT token
  const token = generateJWT(user)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token,
    password,
  }
}

/**
 * Quick helper to get auth headers for requests
 */
export const authHeaders = (token: string) => ({
  authorization: `Bearer ${token}`,
})

/**
 * Create multiple test users at once
 */
export const createTestUsers = async () => {
  const user = await createAuthenticatedUser('USER')
  const vendor = await createAuthenticatedUser('VENDOR')
  const admin = await createAuthenticatedUser('ADMIN')

  return { user, vendor, admin }
}

// ========================================
// Test Data Helpers
// ========================================

/**
 * Create test store for a vendor
 */
export const createTestStore = async (vendorId: string, overrides?: {
  name?: string
  slug?: string
  isPublished?: boolean
}) => {
  const { randomUUID } = await import('crypto')
  const uniqueId = randomUUID()
  
  return prisma.store.create({
    data: {
      name: overrides?.name || `Test Store ${uniqueId}`,
      slug: overrides?.slug || `test-store-${uniqueId}`,
      ownerUserId: vendorId,
      isPublished: overrides?.isPublished ?? true,
    },
  })
}

/**
 * Create test item for a store
 */
export const createTestItem = async (storeId: string, overrides?: {
  title?: string
  price?: string
  isActive?: boolean
}) => {
  const { randomUUID } = await import('crypto')
  const uniqueId = randomUUID()
  
  return prisma.item.create({
    data: {
      storeId,
      title: overrides?.title || `Test Item ${uniqueId}`,
      price: new Decimal(overrides?.price || '19.99'),
      isActive: overrides?.isActive ?? true,
    },
  })
}

/**
 * Create test cart
 */
export const createTestCart = async (userId: string, storeId: string) => {
  return prisma.cart.create({
    data: {
      userId,
      storeId,
      status: 'ACTIVE',
    },
  })
}

/**
 * Create test order
 */
export const createTestOrder = async (userId: string, storeId: string, overrides?: {
  status?: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELED'
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED'
  total?: string
}) => {
  const total = new Decimal(overrides?.total || '50.00')
  const subtotal = total.mul(0.8)
  const fees = total.mul(0.1)
  const tax = total.mul(0.05)
  const tip = total.mul(0.05)
  
  return prisma.order.create({
    data: {
      userId,
      storeId,
      deliveryType: 'DELIVERY',
      status: overrides?.status || 'PLACED',
      paymentStatus: overrides?.paymentStatus || 'UNPAID',
      subtotal,
      fees,
      tax,
      tip,
      total,
      serviceFeePercent: new Decimal('5.00'),
      serviceFeeAmount: total.mul(0.05),
      netToVendor: total.mul(0.95),
    },
  })
}

/**
 * Create test address
 */
export const createTestAddress = async (userId: string, overrides?: {
  isDefault?: boolean
  line1?: string
}) => {
  const { randomUUID } = await import('crypto')
  const uniqueId = randomUUID()
  
  return prisma.address.create({
    data: {
      userId,
      line1: overrides?.line1 || `${uniqueId} Test St`,
      city: 'Test City',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      isDefault: overrides?.isDefault ?? false,
      isActive: true,
    },
  })
}

// ========================================
// Cleanup Helpers
// ========================================

/**
 * Delete all test users
 */
export const cleanupTestUsers = async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@test.com',
      },
    },
  })
}

/**
 * Delete all test data
 */
export const cleanupTestData = async () => {
  // Delete in correct order (foreign keys)
  await prisma.mediaAsset.deleteMany({
    where: {
      store: {
        slug: {
          startsWith: 'test-',
        },
      },
    },
  })
  await prisma.orderItem.deleteMany({})
  await prisma.orderEvent.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.cart.deleteMany({})
  await prisma.address.deleteMany({})
  await prisma.item.deleteMany({})
  await prisma.store.deleteMany({
    where: {
      slug: {
        startsWith: 'test-',
      },
    },
  })
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@test.com',
      },
    },
  })
}

// ========================================
// Legacy Helpers (backwards compatibility)
// ========================================

/**
 * @deprecated Use createAuthenticatedUser instead
 */
export const createMockToken = (userId: string, role: string = 'USER'): string => {
  return `mock-jwt-token-${userId}-${role}`
}

/**
 * @deprecated Use authHeaders instead
 */
export const createAuthHeaders = (token: string) => ({
  authorization: `Bearer ${token}`,
})
