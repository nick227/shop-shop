import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import {
  createAuthenticatedUser,
  authHeaders,
  createTestAddress,
  cleanupTestData,
} from '../__tests__/helpers.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

describe('Address Routes E2E', () => {
  const app = Fastify({ logger: false })
  let user: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let user2: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let addressId: string

  beforeAll(async () => {
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()

    user = await createAuthenticatedUser('USER')
    user2 = await createAuthenticatedUser('USER')
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  beforeEach(async () => {
    const { prisma } = await import('@packages/db')
    await prisma.address.deleteMany({
      where: { userId: { in: [user.id, user2.id] } },
    })
  })

  describe('POST /addresses', () => {
    it('should create address with all fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/addresses',
        headers: authHeaders(user.token),
        payload: {
          label: 'Home',
          contactName: 'John Doe',
          phone: '+14155551234',
          line1: '123 Main St',
          line2: 'Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
          instructions: 'Ring doorbell',
          isDefault: true,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)

      expect(body.id).toBeTruthy()
      expect(body.label).toBe('Home')
      expect(body.line1).toBe('123 Main St')
      expect(body.city).toBe('San Francisco')
      expect(body.isDefault).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addressId = body.id
    })

    it('should create address with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/addresses',
        headers: authHeaders(user.token),
        payload: {
          line1: '456 Oak Ave',
          city: 'Oakland',
          state: 'CA',
          postalCode: '94601',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.country).toBe('US')
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/addresses',
        payload: {
          line1: '123 Test St',
          city: 'City',
          state: 'CA',
          postalCode: '12345',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /addresses', () => {
    it('should list addresses', async () => {
      await createTestAddress(user.id)
      await createTestAddress(user.id)

      const response = await app.inject({
        method: 'GET',
        url: '/addresses',
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeTruthy()
      expect(Array.isArray(body.data)).toBe(true)
    })
  })

  describe('GET /addresses/:id', () => {
    it('should get address by id', async () => {
      const addr = await createTestAddress(user.id)

      const response = await app.inject({
        method: 'GET',
        url: `/addresses/${addr.id}`,
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(addr.id)
    })
  })

  describe('PATCH /addresses/:id', () => {
    it('should update address', async () => {
      const addr = await createTestAddress(user.id)

      const response = await app.inject({
        method: 'PATCH',
        url: `/addresses/${addr.id}`,
        headers: authHeaders(user.token),
        payload: {
          instructions: 'Updated instructions',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.instructions).toBe('Updated instructions')
    })
  })

  describe('DELETE /addresses/:id', () => {
    it('should soft delete address', async () => {
      const addr = await createTestAddress(user.id)

      const response = await app.inject({
        method: 'DELETE',
        url: `/addresses/${addr.id}`,
        headers: authHeaders(user.token),
      })

      // Soft delete throws custom error
      expect(response.statusCode).toBe(500)

      // Verify soft deleted
      const { prisma } = await import('@packages/db')
      const deleted = await prisma.address.findUnique({
        where: { id: addr.id },
      })

      expect(deleted?.isActive).toBe(false)
    })
  })
})
