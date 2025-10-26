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

describe('Cart Routes - Basic Operations', () => {
  const app = Fastify({ logger: false })
  let user: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let vendor: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let item1Id: string
  let item2Id: string

  beforeAll(async () => {
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()

    user = await createAuthenticatedUser('USER')
    vendor = await createAuthenticatedUser('VENDOR')
    
    const store = await createTestStore(vendor.id)
    storeId = store.id
    
    const item1 = await createTestItem(storeId, { title: 'Item 1', price: '15.99' })
    const item2 = await createTestItem(storeId, { title: 'Item 2', price: '9.99' })
    item1Id = item1.id
    item2Id = item2.id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  describe('POST /carts - Add Item', () => {
    it('should create cart and add first item', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item1Id,
          quantity: 2,
          notes: 'Extra sauce please',
        },
      })

      expect(response.statusCode).toBe(201)
      const cart = JSON.parse(response.body)

      expect(cart.id).toBeTruthy()
      expect(cart.userId).toBe(user.id)
      expect(cart.storeId).toBe(storeId)
      expect(cart.status).toBe('ACTIVE')
      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].quantity).toBe(2)
      expect(cart.items[0].notes).toBe('Extra sauce please')
      expect(cart.itemCount).toBe(2)
      expect(cart.subtotal).toBeTruthy()
    })

    it('should reuse existing cart for same store', async () => {
      const response1 = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 1 },
      })
      const cart1 = JSON.parse(response1.body)

      const response2 = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item2Id, quantity: 1 },
      })
      const cart2 = JSON.parse(response2.body)

      expect(cart1.id).toBe(cart2.id)
      expect(cart2.items).toHaveLength(2)
    })

    it('should handle options and notes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item1Id,
          quantity: 1,
          optionsJson: { size: 'large', extras: ['cheese', 'bacon'] },
          notes: 'Well done',
        },
      })

      expect(response.statusCode).toBe(201)
      const cart = JSON.parse(response.body)
      
      const cartItem = cart.items.find((i: { itemId: string }) => i.itemId === item1Id)
      expect(cartItem.optionsJson).toEqual({ size: 'large', extras: ['cheese', 'bacon'] })
      expect(cartItem.notes).toBe('Well done')
    })

    it('should reject quantity less than 1', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item1Id,
          quantity: 0,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject quantity over 99', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item1Id,
          quantity: 100,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject invalid item ID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: 'invalid-uuid',
          quantity: 1,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        payload: {
          storeId,
          itemId: item1Id,
          quantity: 1,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /carts/:id', () => {
    let cartId: string

    beforeAll(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 1 },
      })
      cartId = JSON.parse(response.body).id
    })

    it('should retrieve cart with full details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/carts/${cartId}`,
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(200)
      const cart = JSON.parse(response.body)

      expect(cart.id).toBe(cartId)
      expect(cart.items).toBeTruthy()
      expect(Array.isArray(cart.items)).toBe(true)
      expect(cart.items[0]).toHaveProperty('currentItem')
      expect(cart.items[0].currentItem).toHaveProperty('price')
      expect(cart.itemCount).toBeTruthy()
      expect(cart.subtotal).toBeTruthy()
    })

    it('should return 404 for non-existent cart', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/carts/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /carts - List', () => {
    it('should list only active user carts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/carts',
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body.data).toBeTruthy()
      expect(Array.isArray(body.data)).toBe(true)
      
      // All carts should belong to user and be active
      body.data.forEach((cart: { userId: string; status: string }) => {
        expect(cart.userId).toBe(user.id)
        expect(cart.status).toBe('ACTIVE')
      })
    })

    it('should not show other users carts', async () => {
      const otherUser = await createAuthenticatedUser('USER')
      
      const response = await app.inject({
        method: 'GET',
        url: '/carts',
        headers: authHeaders(otherUser.token),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      // Should not include the original user's carts
      const hasOtherUserCart = body.data.some((cart: { userId: string }) => cart.userId === user.id)
      expect(hasOtherUserCart).toBe(false)
    })
  })

  describe('DELETE /carts/:id - Clear Cart', () => {
    it('should clear all items from cart', async () => {
      // Create cart with items
      const createResponse = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 2 },
      })
      const cartId = JSON.parse(createResponse.body).id

      await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item2Id, quantity: 1 },
      })

      // Clear cart
      const response = await app.inject({
        method: 'DELETE',
        url: `/carts/${cartId}`,
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(204)
    })

    it('should reject clearing other users cart', async () => {
      // Create cart
      const createResponse = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 1 },
      })
      const cartId = JSON.parse(createResponse.body).id

      // Try to delete with different user
      const otherUser = await createAuthenticatedUser('USER')
      const response = await app.inject({
        method: 'DELETE',
        url: `/carts/${cartId}`,
        headers: authHeaders(otherUser.token),
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
