import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import {
  createAuthenticatedUser,
  authHeaders,
  createTestStore,
  createTestItem,
  cleanupTestData,
} from '../__tests__/helpers.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

describe('Item Routes E2E', () => {
  const app = Fastify({ logger: false })
  let vendor: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let vendor2: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let admin: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let itemId: string

  beforeAll(async () => {
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()

    vendor = await createAuthenticatedUser('VENDOR')
    vendor2 = await createAuthenticatedUser('VENDOR')
    admin = await createAuthenticatedUser('ADMIN')
    
    const store = await createTestStore(vendor.id)
    storeId = store.id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  describe('POST /items', () => {
    it('should create item as vendor', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/items',
        headers: authHeaders(vendor.token),
        payload: {
          storeId,
          title: 'Burger',
          price: '12.99',
          description: 'Delicious burger',
          category: 'ENTREE',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)

      expect(body.title).toBe('Burger')
      expect(body.storeId).toBe(storeId)
      itemId = body.id
    })

    it('should create item with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/items',
        headers: authHeaders(vendor.token),
        payload: {
          storeId,
          title: 'Simple Item',
          price: '5.00',
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/items',
        payload: {
          storeId,
          title: 'Test',
          price: '10.00',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /items/:id', () => {
    beforeAll(async () => {
      const item = await createTestItem(storeId)
      itemId = item.id
    })

    it('should get item by id (public)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/items/${itemId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(itemId)
    })
  })

  describe('GET /items', () => {
    it('should list items', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/items',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body.data).toBeTruthy()
      expect(Array.isArray(body.data)).toBe(true)
    })

    it('should filter by store', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/items?storeId=${storeId}`,
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('PATCH /items/:id', () => {
    let updateItemId: string

    beforeAll(async () => {
      const item = await createTestItem(storeId)
      updateItemId = item.id
    })

    it('should update own item as vendor', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/items/${updateItemId}`,
        headers: authHeaders(vendor.token),
        payload: {
          price: '15.99',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.price).toBe('15.99')
    })

    it('should allow admin to update any item', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/items/${updateItemId}`,
        headers: authHeaders(admin.token),
        payload: {
          price: '20.00',
        },
      })

      expect(response.statusCode).toBe(200)
    })

    it('should reject other vendor updating item', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/items/${updateItemId}`,
        headers: authHeaders(vendor2.token),
        payload: {
          price: '25.00',
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('DELETE /items/:id', () => {
    it('should delete item as admin', async () => {
      const item = await createTestItem(storeId)

      const response = await app.inject({
        method: 'DELETE',
        url: `/items/${item.id}`,
        headers: authHeaders(admin.token),
      })

      expect(response.statusCode).toBe(204)
    })

    it('should allow vendor deleting own item', async () => {
      const item = await createTestItem(storeId)

      const response = await app.inject({
        method: 'DELETE',
        url: `/items/${item.id}`,
        headers: authHeaders(vendor.token),
      })

      expect(response.statusCode).toBe(204)
    })

    it('should reject other vendor deleting item', async () => {
      const item = await createTestItem(storeId)

      const response = await app.inject({
        method: 'DELETE',
        url: `/items/${item.id}`,
        headers: authHeaders(vendor2.token),
      })

      expect(response.statusCode).toBe(403)
    })
  })
})

