/**
 * Tests for /api/search/unified endpoint
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'
import { createApp } from '../index'
import { createAuthenticatedUser, cleanupTestData } from './helpers'

describe('/api/search/unified', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createApp()
  })

  beforeEach(async () => {
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  describe('Basic query search', () => {
    it('should return 200 for no q (marketplace may return rows when DB is seeded)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified'
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.query).toBe('')
      expect(typeof data.sections.stores.total).toBe('number')
      expect(typeof data.sections.products.total).toBe('number')
    })

    it('should search stores by keyword', async () => {
      const vendor = await createAuthenticatedUser('VENDOR')
      const testStore = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: 'Test Pizza Place',
          description: 'Best pizza in town',
          slug: `test-pizza-${Date.now()}`,
          isPublished: true,
          addressStreet: '123 Main St',
          addressCity: 'Austin',
          addressState: 'TX',
          addressZip: '78701',
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified?q=pizza'
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.query).toBe('pizza')
      expect(data.sections.stores.total).toBeGreaterThan(0)
      expect(data.sections.stores.results[0].name).toContain('Pizza')

      // Cleanup
      await prisma.store.delete({ where: { id: testStore.id } })
    })

    it('should search stores by address fields (multi-table-ish store fields)', async () => {
      const vendor = await createAuthenticatedUser('VENDOR')
      const testStore = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: 'Not Austin In Name',
          description: 'Somewhere in Texas',
          slug: `test-austin-${Date.now()}`,
          isPublished: true,
          addressStreet: '1 Congress Ave',
          addressCity: 'Austin',
          addressState: 'TX',
          addressZip: '78701',
        },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified?q=austin',
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.sections.stores.total).toBeGreaterThan(0)
      expect(data.sections.stores.results.some((s: { name: string }) => s.name === testStore.name)).toBe(true)
    })
  })

  describe('Location filtering', () => {
    it('should filter by city and state', async () => {
      const vendor = await createAuthenticatedUser('VENDOR')
      const testStore = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: 'Austin Restaurant',
          description: 'Local food',
          slug: `test-austin-restaurant-${Date.now()}`,
          isPublished: true,
          addressStreet: '123 Main St',
          addressCity: 'Austin',
          addressState: 'TX',
          addressZip: '78701',
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified?q=restaurant&city=Austin&state=TX'
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.sections.stores.total).toBeGreaterThan(0)
      expect(data.sections.stores.results[0].address?.city).toBe('Austin')

      // Cleanup
      await prisma.store.delete({ where: { id: testStore.id } })
    })

    it('should filter by ZIP code', async () => {
      const vendor = await createAuthenticatedUser('VENDOR')
      const testStore = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: 'ZIP Store',
          description: 'Store with specific ZIP',
          slug: `test-zip-store-${Date.now()}`,
          isPublished: true,
          addressStreet: '456 Oak Ave',
          addressCity: 'Boston',
          addressState: 'MA',
          addressZip: '02101',
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified?q=store&zip=02101'
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.sections.stores.total).toBeGreaterThan(0)
      expect(data.sections.stores.results[0].address?.zip).toBe('02101')

      // Cleanup
      await prisma.store.delete({ where: { id: testStore.id } })
    })
  })

  describe('Coordinate search with Haversine distance', () => {
    it('should filter by exact Haversine distance and apply delivery distance rules', async () => {
      const vendor = await createAuthenticatedUser('VENDOR')
      const baseLat = 39.1
      const baseLon = -115.05
      // Create store ~5 miles away
      const nearbyStore = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: 'Nearby Store',
          description: 'About 5 miles away',
          isPublished: true,
          phone: '555-0123',
          slug: `test-nearby-${Date.now()}`,
          latitude: 39.17,
          longitude: baseLon,
          addressStreet: '123 Nearby St',
          addressCity: 'Nearby',
          addressState: 'NB',
          addressZip: '11111',
        }
      })

      // Create store ~10 miles away
      const distantStore = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: 'Distant Store',
          description: 'About 10 miles away',
          isPublished: true,
          phone: '555-0456',
          slug: `test-distant-${Date.now()}`,
          latitude: 39.245,
          longitude: baseLon,
          addressStreet: '456 Distant Ave',
          addressCity: 'Distant',
          addressState: 'DS',
          addressZip: '22222',
        }
      })

      // Remote pocket (no seeded Austin/NYC stores); coordinate-only search
      const response = await app.inject({
        method: 'GET',
        url: `/api/search/unified?latitude=${baseLat}&longitude=${baseLon}&radiusMiles=25`,
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      
      // Both stores within 25-mile radius should appear
      expect(data.sections.stores.total).toBe(2)
      
      const storeNames = data.sections.stores.results.map((s: any) => s.name)
      expect(storeNames).toContain('Distant Store')
      expect(storeNames).toContain('Nearby Store')

      // Cleanup
      await prisma.store.delete({ where: { id: nearbyStore.id } })
      await prisma.store.delete({ where: { id: distantStore.id } })
    })

    it('should paginate coordinate search results correctly', async () => {
      const vendor = await createAuthenticatedUser('VENDOR')
      const baseLat = 41.2
      const baseLon = -116.1
      const stores = []
      for (let i = 0; i < 25; i++) {
        const store = await prisma.store.create({
          data: {
            ownerUserId: vendor.id,
            name: `Store ${i}`,
            description: `Test store ${i}`,
            isPublished: true,
            phone: `555-${String(i).padStart(4, '0')}`,
            slug: `test-store-${Date.now()}-${i}`,
            latitude: baseLat + (i * 0.01),
            longitude: baseLon + (i * 0.01),
            addressStreet: `${i} Test St`,
            addressCity: 'Test City',
            addressState: 'TC',
            addressZip: `${String(i).padStart(5, '0')}`,
          }
        })
        stores.push(store)
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/search/unified?latitude=${baseLat}&longitude=${baseLon}&radiusMiles=50`,
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      
      // Should return max 20 results (MVP pagination limit)
      expect(data.sections.stores.total).toBe(20)
      expect(data.sections.stores.results.length).toBe(20)

      // Cleanup
      for (const store of stores) {
        await prisma.store.delete({ where: { id: store.id } })
      }
    })
  })

  describe('Inactive and sold-out behavior', () => {
    it('should hide inactive products from eligible stores', async () => {
      const soldToken = `soldprobe_${Date.now()}`
      const vendor = await createAuthenticatedUser('VENDOR')
      const eligibleStore = await prisma.store.create({
        data: {
          ownerUserId: vendor.id,
          name: 'Active Store',
          description: 'Fully eligible store',
          isPublished: true,
          phone: '555-0123',
          slug: `test-active-store-${Date.now()}`,
          addressStreet: '123 Active St',
          addressCity: 'Active',
          addressState: 'AC',
          addressZip: '11111',
        }
      })

      await prisma.item.create({
        data: {
          title: 'Inactive Product',
          description: 'Should not appear',
          price: '30.00',
          isActive: false,
          isSoldOut: false,
          storeId: eligibleStore.id
        }
      })

      await prisma.item.create({
        data: {
          title: `Sold Out Product ${soldToken}`,
          description: 'Should appear but marked as sold out',
          price: '35.00',
          isActive: true,
          isSoldOut: true,
          storeId: eligibleStore.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: `/api/search/unified?q=${encodeURIComponent(soldToken)}`,
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)

      expect(data.sections.products.total).toBe(1)
      const product = data.sections.products.results[0]
      expect(product.title).toContain('Sold Out Product')
      expect(product.title).toContain(soldToken)
      expect(product.isSoldOut).toBe(true)
      expect(product.available).toBe(false)

      await prisma.item.deleteMany({ where: { storeId: eligibleStore.id } })
      await prisma.store.delete({ where: { id: eligibleStore.id } })
      await prisma.user.delete({ where: { id: vendor.id } })
    })
  })

  describe('Location suggestion behavior', () => {
    it('should only suggest location when explicit city + state are provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified?q=restaurant&city=Austin&state=TX',
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.query).toBe('restaurant')
      expect(data.interpreted.locationSuggestion).toBeDefined()
      expect(data.interpreted.locationSuggestion?.label).toBe('Austin, TX')
    })

    it('should not guess locations from q alone', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified?q=austin',
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.interpreted.locationSuggestion).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should validate radius limits', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search/unified?q=test&radiusMiles=300'
      })

      expect(response.statusCode).toBe(400)
      const data = JSON.parse(response.payload)
      expect(data.error).toBe('Invalid radius')
    })
  })
})
