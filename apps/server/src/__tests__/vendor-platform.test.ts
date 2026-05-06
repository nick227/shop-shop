import { randomUUID } from 'crypto'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { registerAllResources } from '../routes/loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import {
  createAuthenticatedUser,
  authHeaders,
  createTestStore,
  createTestItem,
  cleanupTestData,
  type TestUser,
} from './helpers.js'

/**
 * Open Platform Vendor Test Suite
 * 
 * Tests the new open platform model where any authenticated user
 * can become a vendor by creating stores and items.
 * 
 * Key principles tested:
 * - Any user (USER, VENDOR, ADMIN) can create stores
 * - Ownership checks prevent unauthorized modifications
 * - Users can manage their own stores and items
 * - Cross-user access is properly blocked
 */
describe('Open Platform - Vendor Functionality', () => {
  let app: FastifyInstance
  let regularUser: TestUser
  let vendorUser: TestUser
  let adminUser: TestUser

  function newStorePayload(name: string, slug: string, description: string) {
    return {
      name,
      slug,
      description,
      phone: '5550100',
      email: 'store-open@test.com',
      website: 'https://example.test',
      pickupEnabled: true,
      deliveryEnabled: false,
      addressStreet: '100 Congress Ave',
      addressCity: 'Austin',
      addressState: 'TX',
      addressZip: '78701',
    }
  }

  beforeAll(async () => {
    // Create isolated Fastify instance
    app = Fastify({ logger: false })
    
    // Register middleware
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)
    
    // Register all resource routes
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()
    
    // Create test users
    regularUser = await createAuthenticatedUser('USER')
    vendorUser = await createAuthenticatedUser('VENDOR')
    adminUser = await createAuthenticatedUser('ADMIN')
  })
  
  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  describe('Store Creation - Open Platform', () => {
    it('should allow USER role to create stores', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(regularUser.token),
        payload: newStorePayload('User Restaurant', `user-store-${Date.now()}`, 'Created by regular user'),
      })

      expect(response.statusCode).toBe(201)
      const store = JSON.parse(response.body)
      expect(store.name).toBe('User Restaurant')
      expect(store.ownerUserId).toBe(regularUser.id)
    })

    it('should allow VENDOR role to create stores', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendorUser.token),
        payload: newStorePayload('Vendor Restaurant', `vendor-store-${Date.now()}`, 'Created by vendor user'),
      })

      expect(response.statusCode).toBe(201)
      const store = JSON.parse(response.body)
      expect(store.name).toBe('Vendor Restaurant')
      expect(store.ownerUserId).toBe(vendorUser.id)
    })

    it('should allow ADMIN role to create stores', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(adminUser.token),
        payload: newStorePayload('Admin Restaurant', `admin-store-${Date.now()}`, 'Created by admin'),
      })

      expect(response.statusCode).toBe(201)
      const store = JSON.parse(response.body)
      expect(store.name).toBe('Admin Restaurant')
      expect(store.ownerUserId).toBe(adminUser.id)
    })

    it('should enforce unique slug constraints', async () => {
      const slug = `duplicate-slug-${Date.now()}-${randomUUID().slice(0, 8)}`
      
      // First creation succeeds
      const first = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(regularUser.token),
        payload: newStorePayload('First Store', slug, 'First'),
      })
      expect(first.statusCode).toBe(201)

      // Duplicate fails
      const second = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(regularUser.token),
        payload: newStorePayload('Second Store', slug, 'Second'),
      })
      expect(second.statusCode).toBe(409)
    })
  })

  describe('Store Ownership & Access Control', () => {
    let userStore: any
    let vendorStore: any

    beforeAll(async () => {
      userStore = await createTestStore(regularUser.id, { slug: `user-store-${Date.now()}` })
      vendorStore = await createTestStore(vendorUser.id, { slug: `vendor-store-${Date.now()}` })
    })

    it('should allow owner to update their store', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${userStore.id}`,
        headers: authHeaders(regularUser.token),
        payload: {
          description: 'Updated by owner',
        },
      })

      expect(response.statusCode).toBe(200)
      const updated = JSON.parse(response.body)
      expect(updated.description).toBe('Updated by owner')
    })

    it('should block non-owner from updating store', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStore.id}`,
        headers: authHeaders(regularUser.token),
        payload: {
          description: 'Attempted unauthorized update',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow ADMIN to update any store', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${userStore.id}`,
        headers: authHeaders(adminUser.token),
        payload: {
          description: 'Updated by admin',
        },
      })

      expect(response.statusCode).toBe(200)
      const updated = JSON.parse(response.body)
      expect(updated.description).toBe('Updated by admin')
    })

    it('should block store deletion by owners (ADMIN only)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/stores/${userStore.id}`,
        headers: authHeaders(regularUser.token),
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow ADMIN to delete stores', async () => {
      const tempStore = await createTestStore(regularUser.id, { slug: `temp-${Date.now()}` })
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/stores/${tempStore.id}`,
        headers: authHeaders(adminUser.token),
      })

      expect(response.statusCode).toBe(204)
    })
  })

  describe('Item Management - Open Platform', () => {
    let userStore: any

    beforeAll(async () => {
      userStore = await createTestStore(regularUser.id, { slug: `items-store-${Date.now()}` })
    })

    it('should allow store owner to create items', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/items',
        headers: authHeaders(regularUser.token),
        payload: {
          storeId: userStore.id,
          title: 'Pizza',
          description: 'Delicious pizza',
          price: '12.99',
        },
      })

      expect(response.statusCode).toBe(201)
      const item = JSON.parse(response.body)
      expect(item.title).toBe('Pizza')
      expect(item.price).toBe('12.99')
    })

    it('should block non-owner from creating items in store', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/items',
        headers: authHeaders(vendorUser.token),
        payload: {
          storeId: userStore.id,
          title: 'Unauthorized Item',
          price: '9.99',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should allow owner to update their items', async () => {
      const item = await createTestItem(userStore.id, { title: 'Burger' })
      
      const response = await app.inject({
        method: 'PATCH',
        url: `/items/${item.id}`,
        headers: authHeaders(regularUser.token),
        payload: {
          price: '15.99',
        },
      })

      expect(response.statusCode).toBe(200)
      const updated = JSON.parse(response.body)
      expect(updated.price).toBe('15.99')
    })

    it('should allow owner to delete their items', async () => {
      const item = await createTestItem(userStore.id, { title: 'Temp Item' })
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/items/${item.id}`,
        headers: authHeaders(regularUser.token),
      })

      expect(response.statusCode).toBe(204)
    })
  })

  describe('Multi-Store Management', () => {
    it('should allow user to create multiple stores', async () => {
      const stores = []
      
      for (let i = 0; i < 3; i++) {
        const response = await app.inject({
          method: 'POST',
          url: '/stores',
          headers: authHeaders(regularUser.token),
          payload: {
            name: `Multi Store ${i}`,
            slug: `multi-store-${Date.now()}-${i}`,
          },
        })

        expect(response.statusCode).toBe(201)
        stores.push(JSON.parse(response.body))
      }

      expect(stores).toHaveLength(3)
      expect(stores.every(s => s.ownerUserId === regularUser.id)).toBe(true)
    })

    it('should allow user to manage all their stores independently', async () => {
      const store1 = await createTestStore(regularUser.id, { slug: `independent-1-${Date.now()}` })
      const store2 = await createTestStore(regularUser.id, { slug: `independent-2-${Date.now()}` })

      // Update store 1
      const update1 = await app.inject({
        method: 'PATCH',
        url: `/stores/${store1.id}`,
        headers: authHeaders(regularUser.token),
        payload: { description: 'Store 1 updated' },
      })
      expect(update1.statusCode).toBe(200)

      // Update store 2  
      const update2 = await app.inject({
        method: 'PATCH',
        url: `/stores/${store2.id}`,
        headers: authHeaders(regularUser.token),
        payload: { description: 'Store 2 updated' },
      })
      expect(update2.statusCode).toBe(200)

      // Verify independence
      const get1 = await app.inject({
        method: 'GET',
        url: `/stores/${store1.id}`,
      })
      const get2 = await app.inject({
        method: 'GET',
        url: `/stores/${store2.id}`,
      })

      const s1 = JSON.parse(get1.body)
      const s2 = JSON.parse(get2.body)
      
      expect(s1.description).toBe('Store 1 updated')
      expect(s2.description).toBe('Store 2 updated')
    })
  })

  describe('Public Store Access', () => {
    let publicStore: any

    beforeAll(async () => {
      publicStore = await createTestStore(regularUser.id, { 
        slug: `public-store-${Date.now()}`,
        isPublished: true,
      })
    })

    it('should allow unauthenticated users to view published stores', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/stores/${publicStore.id}`,
      })

      expect(response.statusCode).toBe(200)
      const store = JSON.parse(response.body)
      expect(store.id).toBe(publicStore.id)
    })

    it('should allow unauthenticated users to list stores', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/stores',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.data)).toBe(true)
    })

    it('should include stripe fields (nullable) in response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/stores/${publicStore.id}`,
      })

      const store = JSON.parse(response.body)
      // Stripe fields are included but initially null
      // This is expected - fields exist in schema but are optional
      expect(store).toHaveProperty('stripeAccountId')
      expect(store.stripeAccountId).toBeNull()
    })
  })

  describe('Vendor Portal Access', () => {
    it('should confirm any authenticated user can access vendor endpoints', async () => {
      // All three user types should be able to access vendor-specific routes
      const users = [regularUser, vendorUser, adminUser]

      for (const user of users) {
        const response = await app.inject({
          method: 'GET',
          url: '/vendor/orders/pending-count',
          headers: authHeaders(user.token),
        })

        // Should return 200 or 404 (no store), not 403 (forbidden)
        expect([200, 404]).toContain(response.statusCode)
      }
    })
  })

  describe('Role Backwards Compatibility', () => {
    it('should continue to work with existing VENDOR role users', async () => {
      // VENDOR role should work exactly like USER role in open platform
      const store = await createTestStore(vendorUser.id, { slug: `compat-${Date.now()}` })
      
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${store.id}`,
        headers: authHeaders(vendorUser.token),
        payload: {
          description: 'Updated by vendor role',
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should treat USER and VENDOR roles equally for store operations', async () => {
      const userStore = await createTestStore(regularUser.id, { slug: `equal-user-${Date.now()}` })
      const vendorStore = await createTestStore(vendorUser.id, { slug: `equal-vendor-${Date.now()}` })

      // Both should be able to update their stores
      const userUpdate = await app.inject({
        method: 'PATCH',
        url: `/stores/${userStore.id}`,
        headers: authHeaders(regularUser.token),
        payload: { prepTimeMin: 30 },
      })

      const vendorUpdate = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStore.id}`,
        headers: authHeaders(vendorUser.token),
        payload: { prepTimeMin: 30 },
      })

      expect(userUpdate.statusCode).toBe(200)
      expect(vendorUpdate.statusCode).toBe(200)
    })
  })
})

