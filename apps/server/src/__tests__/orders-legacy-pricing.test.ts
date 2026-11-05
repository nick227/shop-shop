/**
 * The generic POST /orders path prices exactly like checkout: same quote, same commission, same
 * delivery rules. It used to apply its own 10% tax and flat fees.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { prisma } from '@packages/db'
import { registerResource } from '../routes/loader.js'
import { orderResource } from '../resources/order.resource.js'
import { optionalAuthenticate } from '../middleware/auth.js'
import { quoteCheckout } from '../services/checkout.service.js'
import { authHeaders, cleanupTestData, createAuthenticatedUser, createTestCart, createTestItem, createTestStore } from './helpers.js'

describe('POST /orders pricing', () => {
  const app = Fastify({ logger: false })
  let user: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let storeId: string
  let itemId: string

  beforeAll(async () => {
    app.addHook('preHandler', optionalAuthenticate)
    await registerResource(app, orderResource)
    await app.ready()
    user = await createAuthenticatedUser('USER')
    const owner = await createAuthenticatedUser('VENDOR')
    storeId = (await createTestStore(owner.id, { isPublished: true })).id
    await prisma.store.update({
      where: { id: storeId },
      data: { addressState: 'TX', deliveryEnabled: true, deliveryDistance: 2, deliveryCharge: 3, latitude: 30.3107, longitude: -97.724 },
    })
    itemId = (await createTestItem(storeId, { title: 'Plate', price: '12.00' })).id
  })

  afterAll(async () => {
    await cleanupTestData()
    await app.close()
  })

  const cartWith = async () => {
    const cart = await createTestCart(user.id, storeId)
    await prisma.cartItem.create({ data: { cartId: cart.id, itemId, quantity: 2, unitPrice: 12, titleSnapshot: 'Plate' } })
    return cart.id
  }

  it('charges what checkout quotes for the same cart', async () => {
    const cartId = await cartWith()
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: authHeaders(user.token),
      payload: { cartId, deliveryType: 'PICKUP', tip: '2.00' },
    })
    expect(response.statusCode).toBe(201)
    const created = JSON.parse(response.body) as { id: string }
    const order = await prisma.order.findUniqueOrThrow({ where: { id: created.id } })
    const quote = await quoteCheckout({ items: [{ itemId, quantity: 2 }], deliveryType: 'PICKUP', tipAmount: 2 }, user.id)
    expect(Number(order.total)).toBe(quote.total)
    expect(Number(order.tax)).toBe(quote.tax)
    expect(order.taxProvider).toBe('estimate')
    expect(Number(order.serviceFeeAmount)).toBe(0)
    expect(Number(order.vendorCommissionAmount)).toBeGreaterThan(0)
  })

  it('needs a saved address for delivery, like checkout', async () => {
    const cartId = await cartWith()
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: authHeaders(user.token),
      payload: { cartId, deliveryType: 'DELIVERY', deliveryLatitude: 30.31, deliveryLongitude: -97.72 },
    })
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(await prisma.order.count({ where: { cartId } })).toBe(0)
  })
})
