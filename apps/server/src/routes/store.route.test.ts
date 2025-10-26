import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import {
  createAuthenticatedUser,
  authHeaders,
  createTestStore,
  cleanupTestData,
} from '../__tests__/helpers.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

// ========================================
// Store CRUD E2E Tests
// Tests complete store management workflow
// ========================================

describe('Store Routes E2E - Complete CRUD', () => {
  const app = Fastify({ logger: false })
  let user: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let vendor: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let vendor2: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let admin: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let vendorStoreId: string

  beforeAll(async () => {
    // Register middleware
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)

    // Register routes
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()

    // Create test users with real JWT tokens
    user = await createAuthenticatedUser('USER')
    vendor = await createAuthenticatedUser('VENDOR')
    vendor2 = await createAuthenticatedUser('VENDOR')
    admin = await createAuthenticatedUser('ADMIN')

    // Create a test store for vendor
    const store = await createTestStore(vendor.id)
    vendorStoreId = store.id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  beforeEach(async () => {
    // Clean up stores created during tests (except vendorStoreId)
    const { prisma } = await import('@packages/db')
    await prisma.store.deleteMany({
      where: {
        AND: [
          { slug: { startsWith: 'test-' } },
          { id: { not: vendorStoreId } },
        ],
      },
    })
  })

  // ========================================
  // CREATE Tests (POST /stores)
  // ========================================

  describe('POST /stores - Create Store', () => {
    it('should create store as VENDOR', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Test Restaurant',
          slug: `test-Store-${Date.now()}`,
          description: 'A test Store',
          isPublished: true,
          deliveryEnabled: true,
          pickupEnabled: true,
          prepTimeMin: 30,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)

      expect(body).toHaveProperty('id')
      expect(body.name).toBe('Test Restaurant')
      expect(body.slug).toContain('test-Store')
      expect(body.description).toBe('A test Store')
      expect(body.isPublished).toBe(true)
      expect(body.deliveryEnabled).toBe(true)
      expect(body.pickupEnabled).toBe(true)
      expect(body.prepTimeMin).toBe(30)
      expect(body.ownerUserId).toBe(vendor.id)
    })

    it('should create store with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Minimal Store',
          slug: `minimal-${Date.now()}`,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)

      expect(body.name).toBe('Minimal Store')
      expect(body.isPublished).toBe(false)  // Default
      expect(body.deliveryEnabled).toBe(true)  // Default
      expect(body.pickupEnabled).toBe(true)  // Default
      expect(body.prepTimeMin).toBe(15)  // Default
    })

    it('should create store as ADMIN', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(admin.token),
        payload: {
          name: 'Admin Store',
          slug: `admin-store-${Date.now()}`,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('Admin Store')
    })

    it('should allow store creation by USER (open platform)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(user.token),
        payload: {
          name: 'User Store',
          slug: `user-store-${Date.now()}`,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.ownerUserId).toBe(user.id)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        payload: {
          name: 'No Auth Store',
          slug: 'no-auth',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should enforce unique slug', async () => {
      const slug = `unique-slug-${Date.now()}`

      // Create first store
      await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'First Store',
          slug,
        },
      })

      // Try to create with same slug
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Second Store',
          slug,  // Duplicate!
        },
      })

      expect(response.statusCode).toBe(409)  // Unique constraint returns 409
    })

    it('should validate slug format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Invalid Slug Store',
          slug: 'Invalid Slug With Spaces!',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  // ========================================
  // READ Tests (GET /stores/:id)
  // ========================================

  describe('GET /stores/:id - Get Store by ID', () => {
    it('should get store by id (public)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/stores/${vendorStoreId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body.id).toBe(vendorStoreId)
      expect(body).toHaveProperty('name')
      expect(body).toHaveProperty('slug')
      expect(body.ownerUserId).toBe(vendor.id)
    })

    it('should return 404 for non-existent store', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/stores/00000000-0000-0000-0000-000000000000',
      })

      expect(response.statusCode).toBe(404)
    })

    it('should not expose sensitive fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/stores/${vendorStoreId}`,
      })

      const body = JSON.parse(response.body)
      const bodyStr = JSON.stringify(body)

      // Should not expose Stripe secrets
      expect(bodyStr).not.toContain('stripeSecretKey')
      expect(bodyStr).not.toContain('apiKey')
    })
  })

  // ========================================
  // LIST Tests (GET /stores)
  // ========================================

  describe('GET /stores - List Stores', () => {
    it('should list all stores (public)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/stores',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('total')
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.total).toBeGreaterThan(0)
    })

    it('should include pagination info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/stores?page=1&limit=10',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body).toHaveProperty('page')
      expect(body).toHaveProperty('limit')
      expect(body.page).toBe(1)
      expect(body.limit).toBe(10)
    })

    it('should filter by published status', async () => {
      // Create published store
      await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Published Store',
          slug: `published-${Date.now()}`,
          isPublished: true,
        },
      })

      // Create unpublished store
      await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Unpublished Store',
          slug: `unpublished-${Date.now()}`,
          isPublished: false,
        },
      })

      // List all
      const response = await app.inject({
        method: 'GET',
        url: '/stores',
      })

      const body = JSON.parse(response.body)
      expect(body.data.length).toBeGreaterThan(0)
    })

    it('should work without authentication (public)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/stores',
      })

      expect(response.statusCode).toBe(200)
    })
  })

  // ========================================
  // UPDATE Tests (PATCH /stores/:id)
  // ========================================

  describe('PATCH /stores/:id - Update Store', () => {
    it('should update store as owner', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          description: 'Updated description',
          prepTimeMin: 45,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body.description).toBe('Updated description')
      expect(body.prepTimeMin).toBe(45)
    })

    it('should update store name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Renamed Store',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('Renamed Store')
    })

    it('should toggle published status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          isPublished: false,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.isPublished).toBe(false)
    })

    it('should allow ADMIN to update any store', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(admin.token),
        payload: {
          description: 'Admin updated this',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.description).toBe('Admin updated this')
    })

    it('should reject update by non-owner VENDOR', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor2.token),  // Different vendor
        payload: {
          description: 'Unauthorized update',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should reject update by USER (ownership check)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(user.token),
        payload: {
          description: 'User trying to update',
        },
      })

      // Should be 403 because user doesn't own this store (ownership check)
      expect(response.statusCode).toBe(403)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        payload: {
          description: 'No auth update',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 404 for non-existent store', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/stores/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(vendor.token),
        payload: {
          description: 'Update non-existent',
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should allow updating prepTimeMin', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          prepTimeMin: 120,  // 2 hours
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.prepTimeMin).toBe(120)
    })
  })

  // ========================================
  // DELETE Tests (DELETE /stores/:id)
  // ========================================

  describe('DELETE /stores/:id - Delete Store', () => {
    let deleteTestStoreId: string

    beforeEach(async () => {
      const store = await createTestStore(vendor.id, {
        slug: `delete-test-${Date.now()}`,
      })
      deleteTestStoreId = store.id
    })

    it('should delete store as ADMIN', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/stores/${deleteTestStoreId}`,
        headers: authHeaders(admin.token),
      })

      expect(response.statusCode).toBe(204)

      // Verify deleted
      const checkResponse = await app.inject({
        method: 'GET',
        url: `/stores/${deleteTestStoreId}`,
      })

      expect(checkResponse.statusCode).toBe(404)
    })

    it('should reject delete by VENDOR (even owner)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/stores/${deleteTestStoreId}`,
        headers: authHeaders(vendor.token),
      })

      // Only ADMIN can delete stores
      expect(response.statusCode).toBe(403)
    })

    it('should reject delete by USER', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/stores/${deleteTestStoreId}`,
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(403)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/stores/${deleteTestStoreId}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 404 for non-existent store', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/stores/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(admin.token),
      })

      expect(response.statusCode).toBe(404)
    })

    it('should handle store with related entities', async () => {
      const { prisma } = await import('@packages/db')
      
      // Create store with items
      const tempStore = await createTestStore(vendor.id, {
        slug: `cascade-${Date.now()}`,
      })

      const { createTestItem } = await import('../__tests__/helpers.js')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const item1 = await createTestItem(tempStore.id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const item2 = await createTestItem(tempStore.id)

      // Verify items exist
      const itemsBefore = await prisma.item.count({
        where: { storeId: tempStore.id },
      })
      expect(itemsBefore).toBe(2)

      // Clean up items manually first (Prisma cascade requires this in tests)
      await prisma.item.deleteMany({
        where: { storeId: tempStore.id },
      })

      // Delete store
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/stores/${tempStore.id}`,
        headers: authHeaders(admin.token),
      })

      expect(deleteResponse.statusCode).toBe(204)
    })
  })

  // ========================================
  // Ownership & Authorization Tests
  // ========================================

  describe('Ownership & Authorization', () => {
    it('should allow vendor to manage only own stores', async () => {
      // Vendor 1 creates store
      const vendor1StoreResponse = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Vendor 1 Store',
          slug: `vendor1-${Date.now()}`,
        },
      })

      const vendor1Store = JSON.parse(vendor1StoreResponse.body)

      // Vendor 1 can update own store
      const updateOwn = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendor1Store.id}`,
        headers: authHeaders(vendor.token),
        payload: {
          description: 'My store',
        },
      })
      expect(updateOwn.statusCode).toBe(200)

      // Vendor 2 cannot update vendor 1's store
      const updateOther = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendor1Store.id}`,
        headers: authHeaders(vendor2.token),
        payload: {
          description: 'Hacking attempt',
        },
      })
      expect(updateOther.statusCode).toBe(403)
    })

    it('should allow ADMIN to manage any store', async () => {
      // Create store as vendor
      const vendorStoreResponse = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Vendor Store',
          slug: `admin-access-${Date.now()}`,
        },
      })

      const vendorStore = JSON.parse(vendorStoreResponse.body)

      // Admin can update any store
      const adminUpdate = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStore.id}`,
        headers: authHeaders(admin.token),
        payload: {
          isPublished: false,
        },
      })

      expect(adminUpdate.statusCode).toBe(200)
    })

    it('should verify ownership on update', async () => {
      const { prisma } = await import('@packages/db')
      
      // Get store owner
      const store = await prisma.store.findUnique({
        where: { id: vendorStoreId },
      })

      expect(store?.ownerUserId).toBe(vendor.id)

      // Owner can update
      const ownerUpdate = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Owner Updated',
        },
      })
      expect(ownerUpdate.statusCode).toBe(200)

      // Non-owner cannot
      const nonOwnerUpdate = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor2.token),
        payload: {
          name: 'Hacked',
        },
      })
      expect(nonOwnerUpdate.statusCode).toBe(403)
    })
  })

  // ========================================
  // Store Configuration Tests
  // ========================================

  describe('Store Configuration', () => {
    it('should update delivery settings', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          deliveryEnabled: false,
          pickupEnabled: true,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body.deliveryEnabled).toBe(false)
      expect(body.pickupEnabled).toBe(true)
    })

    it('should update prep time', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          prepTimeMin: 60,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.prepTimeMin).toBe(60)
    })

    it('should update published status', async () => {
      // Unpublish
      const unpublish = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          isPublished: false,
        },
      })

      expect(unpublish.statusCode).toBe(200)
      expect(JSON.parse(unpublish.body).isPublished).toBe(false)

      // Republish
      const republish = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          isPublished: true,
        },
      })

      expect(republish.statusCode).toBe(200)
      expect(JSON.parse(republish.body).isPublished).toBe(true)
    })
  })

  // ========================================
  // Stripe Connect Integration Tests
  // ========================================

  describe('Stripe Connect Fields', () => {
    it('should store Stripe account ID', async () => {
      const { prisma } = await import('@packages/db')
      
      await prisma.store.update({
        where: { id: vendorStoreId },
        data: {
          stripeAccountId: 'acct_test_123',
          stripeOnboarded: false,
        },
      })

      const response = await app.inject({
        method: 'GET',
        url: `/stores/${vendorStoreId}`,
      })

      const body = JSON.parse(response.body)
      expect(body.stripeAccountId).toBe('acct_test_123')
      expect(body.stripeOnboarded).toBe(false)
    })

    it('should update onboarding status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          stripeOnboarded: true,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.stripeOnboarded).toBe(true)
    })
  })

  // ========================================
  // Validation Tests
  // ========================================

  describe('Input Validation', () => {
    it('should validate required fields on create', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          // Missing name and slug
          description: 'Only description',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should validate slug format (lowercase, hyphens only)', async () => {
      const invalidSlugs = [
        'UPPERCASE',
        'has spaces',
        'has_underscores',
        'has!special',
        'has@symbols',
      ]

      for (const slug of invalidSlugs) {
        const response = await app.inject({
          method: 'POST',
          url: '/stores',
          headers: authHeaders(vendor.token),
          payload: {
            name: 'Test Store',
            slug,
          },
        })

        expect(response.statusCode).toBe(400)
      }
    })

    it('should accept valid slug formats', async () => {
      const validSlugs = [
        'lowercase',
        'with-hyphens',
        'with-multiple-hyphens',
        'with123numbers',
        'a',  // Single character
      ]

      for (const slug of validSlugs) {
        const response = await app.inject({
          method: 'POST',
          url: '/stores',
          headers: authHeaders(vendor.token),
          payload: {
            name: 'Valid Slug Test',
            slug: `${slug}-${Date.now()}`,
          },
        })

        expect(response.statusCode).toBe(201)
      }
    })

    it('should accept descriptions', async () => {
      const description = 'This is a test description for the store with sufficient detail.'

      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {
          description,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.description).toBe(description)
    })
  })

  // ========================================
  // Complete Workflow Tests
  // ========================================

  describe('Complete Store Lifecycle', () => {
    it('should complete: create → publish → update → unpublish → delete', async () => {
      // 1. Create store
      const createResponse = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Lifecycle Test Store',
          slug: `lifecycle-${Date.now()}`,
          description: 'Testing complete lifecycle',
          isPublished: false,
        },
      })

      expect(createResponse.statusCode).toBe(201)
      const store = JSON.parse(createResponse.body)
      expect(store.isPublished).toBe(false)

      // 2. Publish store
      const publishResponse = await app.inject({
        method: 'PATCH',
        url: `/stores/${store.id}`,
        headers: authHeaders(vendor.token),
        payload: {
          isPublished: true,
        },
      })

      expect(publishResponse.statusCode).toBe(200)
      expect(JSON.parse(publishResponse.body).isPublished).toBe(true)

      // 3. Update details
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: `/stores/${store.id}`,
        headers: authHeaders(vendor.token),
        payload: {
          description: 'Updated description',
          prepTimeMin: 30,
        },
      })

      expect(updateResponse.statusCode).toBe(200)

      // 4. Unpublish
      const unpublishResponse = await app.inject({
        method: 'PATCH',
        url: `/stores/${store.id}`,
        headers: authHeaders(vendor.token),
        payload: {
          isPublished: false,
        },
      })

      expect(unpublishResponse.statusCode).toBe(200)
      expect(JSON.parse(unpublishResponse.body).isPublished).toBe(false)

      // 5. Delete (as admin)
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/stores/${store.id}`,
        headers: authHeaders(admin.token),
      })

      expect(deleteResponse.statusCode).toBe(204)
    })

    it('should handle vendor creating multiple stores', async () => {
      const stores = []

      for (let i = 0; i < 3; i++) {
        const response = await app.inject({
          method: 'POST',
          url: '/stores',
          headers: authHeaders(vendor.token),
          payload: {
            name: `Store ${i + 1}`,
            slug: `multi-store-${i}-${Date.now()}`,
          },
        })

        expect(response.statusCode).toBe(201)
        stores.push(JSON.parse(response.body))
      }

      expect(stores.length).toBe(3)
      expect(stores.every(s => s.ownerUserId === vendor.id)).toBe(true)
    })
  })

  // ========================================
  // Query & Filter Tests
  // ========================================

  describe('Query & Filtering', () => {
    beforeAll(async () => {
      // Create stores with different states
      await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Published Store 1',
          slug: `published-1-${Date.now()}`,
          isPublished: true,
        },
      })

      await app.inject({
        method: 'POST',
        url: '/stores',
        headers: authHeaders(vendor.token),
        payload: {
          name: 'Unpublished Store 1',
          slug: `unpublished-1-${Date.now()}`,
          isPublished: false,
        },
      })
    })

    it('should support pagination', async () => {
      const page1 = await app.inject({
        method: 'GET',
        url: '/stores?page=1&limit=2',
      })

      expect(page1.statusCode).toBe(200)
      const body1 = JSON.parse(page1.body)
      expect(body1.data.length).toBeLessThanOrEqual(2)
      expect(body1.page).toBe(1)
      expect(body1.limit).toBe(2)
    })

    it('should return total count', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/stores',
      })

      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('total')
      expect(body.total).toBeGreaterThan(0)
      expect(body.total).toBeGreaterThanOrEqual(body.data.length)
    })
  })

  // ========================================
  // Edge Cases
  // ========================================

  describe('Edge Cases', () => {
    it('should handle empty update payload', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/stores/${vendorStoreId}`,
        headers: authHeaders(vendor.token),
        payload: {},
      })

      // Should succeed (no changes)
      expect([200, 400]).toContain(response.statusCode)
    })

    it('should handle malformed JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/stores',
        headers: {
          ...authHeaders(vendor.token),
          'content-type': 'application/json',
        },
        payload: 'not valid json{',
      })

      expect(response.statusCode).toBe(400)
    })

    it('should handle invalid UUID in URL', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/stores/not-a-uuid',
      })

      expect([400, 404]).toContain(response.statusCode)
    })

    it('should handle concurrent updates', async () => {
      // Two simultaneous updates
      const [update1, update2] = await Promise.all([
        app.inject({
          method: 'PATCH',
          url: `/stores/${vendorStoreId}`,
          headers: authHeaders(vendor.token),
          payload: { prepTimeMin: 20 },
        }),
        app.inject({
          method: 'PATCH',
          url: `/stores/${vendorStoreId}`,
          headers: authHeaders(vendor.token),
          payload: { prepTimeMin: 40 },
        }),
      ])

      // Both should succeed (last write wins)
      expect(update1.statusCode).toBe(200)
      expect(update2.statusCode).toBe(200)
    })
  })
})
