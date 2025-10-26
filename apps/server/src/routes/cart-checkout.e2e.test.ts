import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { registerAllResources } from './loader.js'
import { ALL_RESOURCES } from '../resources/index.js'
import {
  createAuthenticatedUser,
  authHeaders,
  createTestStore,
  createTestItem,
  createTestAddress,
  cleanupTestData,
} from '../__tests__/helpers.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { prisma } from '@packages/db'

/**
 * Complete E2E test suite for Cart → Checkout → Order flow
 */
describe('Cart & Checkout E2E Flow', () => {
  const app = Fastify({ logger: false })
  let user: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let vendor: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let item1Id: string
  let item2Id: string
  let item3Id: string
  let addressId: string

  beforeAll(async () => {
    app.decorate('authenticate', authenticate)
    app.decorate('requireRole', requireRole)
    await registerAllResources(app, ALL_RESOURCES)
    await app.ready()

    // Create test users
    user = await createAuthenticatedUser('USER')
    vendor = await createAuthenticatedUser('VENDOR')
    
    // Create test store
    const store = await createTestStore(vendor.id)
    storeId = store.id
    
    // Create multiple test items
    const item1 = await createTestItem(storeId, { title: 'Pizza', price: '12.99' })
    const item2 = await createTestItem(storeId, { title: 'Burger', price: '8.99' })
    const item3 = await createTestItem(storeId, { title: 'Fries', price: '3.99' })
    item1Id = item1.id
    item2Id = item2.id
    item3Id = item3.id

    // Create test delivery address
    const address = await createTestAddress(user.id, { isDefault: true })
    addressId = address.id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  describe('Step 1: Add Items to Cart', () => {
    let cartId: string

    it('should add first item to cart (creates new cart)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item1Id,
          quantity: 2,
          notes: 'Extra cheese please',
        },
      })

      expect(response.statusCode).toBe(201)
      const cart = JSON.parse(response.body)

      expect(cart.id).toBeTruthy()
      expect(cart.userId).toBe(user.id)
      expect(cart.storeId).toBe(storeId)
      expect(cart.status).toBe('ACTIVE')
      expect(cart.items).toBeTruthy()
      expect(cart.items.length).toBe(1)
      expect(cart.items[0].quantity).toBe(2)
      expect(cart.items[0].notes).toBe('Extra cheese please')
      expect(cart.itemCount).toBe(2)

      cartId = cart.id
    })

    it('should add second item to existing cart', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item2Id,
          quantity: 1,
        },
      })

      expect(response.statusCode).toBe(201)
      const cart = JSON.parse(response.body)

      expect(cart.id).toBe(cartId) // Same cart
      expect(cart.items.length).toBe(2)
      expect(cart.itemCount).toBe(3) // 2 + 1
    })

    it('should add third item to cart', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item3Id,
          quantity: 3,
        },
      })

      expect(response.statusCode).toBe(201)
      const cart = JSON.parse(response.body)

      expect(cart.items.length).toBe(3)
      expect(cart.itemCount).toBe(6) // 2 + 1 + 3
    })

    it('should update quantity when adding existing item', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item1Id, // Adding same item again
          quantity: 1,
        },
      })

      expect(response.statusCode).toBe(201)
      const cart = JSON.parse(response.body)

      // Should still have 3 unique items
      expect(cart.items.length).toBe(3)
      
      // But first item quantity should increase from 2 to 3
      const pizzaItem = cart.items.find((i: { itemId: string }) => i.itemId === item1Id)
      expect(pizzaItem.quantity).toBe(3)
      expect(cart.itemCount).toBe(7) // 3 + 1 + 3
    })

    it('should reject invalid quantity', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: {
          storeId,
          itemId: item1Id,
          quantity: 0, // Invalid
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
          quantity: 100, // Too high
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

  describe('Step 2: View Cart', () => {
    let cartId: string

    beforeEach(async () => {
      // Clean carts and create fresh one
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } })
      await prisma.cart.deleteMany({ where: { userId: user.id } })

      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 2 },
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
      expect(cart.itemCount).toBeTruthy()
      expect(cart.subtotal).toBeTruthy()
    })

    it('should list all user carts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/carts',
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body.data).toBeTruthy()
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThan(0)
    })

    it('should not allow viewing other users carts', async () => {
      const otherUser = await createAuthenticatedUser('USER')
      
      const response = await app.inject({
        method: 'GET',
        url: `/carts/${cartId}`,
        headers: authHeaders(otherUser.token),
      })

      // Should be 404 or 403
      expect([403, 404]).toContain(response.statusCode)
    })
  })

  describe('Step 3: Remove Items from Cart', () => {
    let cartId: string
    let cartItemId: string

    beforeEach(async () => {
      // Clean and create fresh cart with items
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } })
      await prisma.cart.deleteMany({ where: { userId: user.id } })

      const response = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 2 },
      })
      
      const cart = JSON.parse(response.body)
      cartId = cart.id
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cartItemId = cart.items[0].id

      // Add second item
      await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item2Id, quantity: 1 },
      })
    })

    it('should clear entire cart', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/carts/${cartId}`,
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(204)

      // Verify cart items are deleted
      const cartItems = await prisma.cartItem.findMany({
        where: { cartId }
      })
      expect(cartItems.length).toBe(0)
    })

    it('should not allow clearing other users cart', async () => {
      const otherUser = await createAuthenticatedUser('USER')
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/carts/${cartId}`,
        headers: authHeaders(otherUser.token),
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('Step 4: Checkout - Create Order from Cart', () => {
    let cartId: string

    beforeEach(async () => {
      // Create fresh cart with items for checkout
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } })
      await prisma.cart.deleteMany({ where: { userId: user.id } })

      // Add items to cart
      const response1 = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 2 },
      })
      cartId = JSON.parse(response1.body).id

      await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item2Id, quantity: 1 },
      })
    })

    it('should create order from cart (PICKUP)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(user.token),
        payload: {
          cartId,
          deliveryType: 'PICKUP',
          tip: '2.50',
        },
      })

      expect(response.statusCode).toBe(201)
      const order = JSON.parse(response.body)

      expect(order.id).toBeTruthy()
      expect(order.userId).toBe(user.id)
      expect(order.storeId).toBe(storeId)
      expect(order.cartId).toBe(cartId)
      expect(order.deliveryType).toBe('PICKUP')
      expect(order.status).toBe('PLACED')
      expect(order.paymentStatus).toBe('UNPAID')
      expect(parseFloat(order.tip)).toBe(2.50)
      expect(parseFloat(order.subtotal)).toBeGreaterThan(0)
      expect(parseFloat(order.total)).toBeGreaterThan(0)

      // Verify cart is marked as SUBMITTED
      const cart = await prisma.cart.findUnique({ where: { id: cartId } })
      expect(cart?.status).toBe('SUBMITTED')
    })

    it('should create order from cart (DELIVERY with address)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(user.token),
        payload: {
          cartId,
          deliveryType: 'DELIVERY',
          addressId,
          tip: '5.00',
        },
      })

      expect(response.statusCode).toBe(201)
      const order = JSON.parse(response.body)

      expect(order.deliveryType).toBe('DELIVERY')
      expect(order.addressId).toBe(addressId)
      expect(parseFloat(order.fees)).toBeGreaterThan(0) // Delivery fee
      expect(parseFloat(order.tip)).toBe(5.00)
    })

    it('should reject empty cart checkout', async () => {
      // Create empty cart
      const emptyCart = await prisma.cart.create({
        data: {
          userId: user.id,
          storeId,
          status: 'ACTIVE',
        },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(user.token),
        payload: {
          cartId: emptyCart.id,
          deliveryType: 'PICKUP',
        },
      })

      expect([400, 500]).toContain(response.statusCode)
    })

    it('should reject checkout of already submitted cart', async () => {
      // First checkout
      await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(user.token),
        payload: {
          cartId,
          deliveryType: 'PICKUP',
        },
      })

      // Try to checkout same cart again
      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(user.token),
        payload: {
          cartId,
          deliveryType: 'PICKUP',
        },
      })

      expect([400, 500]).toContain(response.statusCode)
    })

    it('should reject checkout of another users cart', async () => {
      const otherUser = await createAuthenticatedUser('USER')

      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(otherUser.token),
        payload: {
          cartId,
          deliveryType: 'PICKUP',
        },
      })

      expect([403, 500]).toContain(response.statusCode)
    })

    it('should require authentication for checkout', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        payload: {
          cartId,
          deliveryType: 'PICKUP',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Step 5: Verify Order After Checkout', () => {
    let orderId: string
    let cartId: string

    beforeEach(async () => {
      // Create cart and checkout to create order
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } })
      await prisma.cart.deleteMany({ where: { userId: user.id } })

      const cartResponse = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 2 },
      })
      cartId = JSON.parse(cartResponse.body).id

      const orderResponse = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(user.token),
        payload: {
          cartId,
          deliveryType: 'PICKUP',
          tip: '3.00',
        },
      })

      if (orderResponse.statusCode === 201) {
        orderId = JSON.parse(orderResponse.body).id
      }
    })

    it('should retrieve order details', async () => {
      if (!orderId) return

      const response = await app.inject({
        method: 'GET',
        url: `/orders/${orderId}`,
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(200)
      const order = JSON.parse(response.body)

      expect(order.id).toBe(orderId)
      expect(order.cartId).toBe(cartId)
      expect(order.status).toBe('PLACED')
    })

    it('should list user orders', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/orders',
        headers: authHeaders(user.token),
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      expect(body.data).toBeTruthy()
      expect(Array.isArray(body.data)).toBe(true)
    })
  })

  describe('Complete Flow: Add → Modify → Checkout', () => {
    it('should complete full cart to order flow', async () => {
      // Clean slate
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } })
      await prisma.cart.deleteMany({ where: { userId: user.id } })

      // Step 1: Add items
      const add1 = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item1Id, quantity: 2, notes: 'No onions' },
      })
      expect(add1.statusCode).toBe(201)
      const cart1 = JSON.parse(add1.body)

      const add2 = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item2Id, quantity: 1 },
      })
      expect(add2.statusCode).toBe(201)

      const add3 = await app.inject({
        method: 'POST',
        url: '/carts',
        headers: authHeaders(user.token),
        payload: { storeId, itemId: item3Id, quantity: 2 },
      })
      expect(add3.statusCode).toBe(201)
      const cart3 = JSON.parse(add3.body)
      
      // Verify cart state
      expect(cart3.items.length).toBe(3)
      expect(cart3.itemCount).toBe(5) // 2 + 1 + 2

      // Step 2: View cart
      const view = await app.inject({
        method: 'GET',
        url: `/carts/${cart1.id}`,
        headers: authHeaders(user.token),
      })
      expect(view.statusCode).toBe(200)

      // Step 3: Checkout
      const checkout = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: authHeaders(user.token),
        payload: {
          cartId: cart1.id,
          deliveryType: 'PICKUP',
          tip: '4.00',
        },
      })
      expect(checkout.statusCode).toBe(201)
      const order = JSON.parse(checkout.body)

      // Verify order
      expect(order.status).toBe('PLACED')
      expect(order.cartId).toBe(cart1.id)
      expect(parseFloat(order.tip)).toBe(4.00)

      // Verify cart is submitted
      const cartAfter = await prisma.cart.findUnique({
        where: { id: cart1.id }
      })
      expect(cartAfter?.status).toBe('SUBMITTED')
    })
  })
})

