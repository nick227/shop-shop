/**
 * Delivery and tax at checkout: who can get delivery and for how much, what blocks it and why, how tax
 * follows the product and the place, and that production never charges an estimate unknowingly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../config/stripeConnectUrls.js', () => ({
  resolveStripeConnectUrls: vi.fn(() => ({ returnUrl: 'http://x/success', refreshUrl: 'http://x/refresh' })),
  isCodPaymentsEnabled: vi.fn(() => true),
}))
vi.mock('@packages/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@packages/db')>()
  return { ...actual, processOrderPayment: vi.fn(), publishOrderCreated: vi.fn(async () => undefined) }
})

import { prisma } from '@packages/db'
import { completeCheckout, createCheckoutSession, quoteCheckout } from './checkout.service.js'
import { STRIPE_TAX_CODES, configuredTaxProvider, estimateTax, stripeTax } from '../commerce/tax.js'
import { createAuthenticatedUser, createTestStore, createTestItem, cleanupTestData } from '../__tests__/helpers.js'

const HOME = { line1: '4500 Duval St', line2: 'Apt 2', city: 'Austin', state: 'TX', postalCode: '78751', instructions: 'Ring twice' }
const DOWNTOWN = { line1: '100 Congress Ave', city: 'Austin', state: 'TX', postalCode: '78701' }
const NOWHERE = { line1: '1 Unknown Rd', city: 'Austin', state: 'TX', postalCode: '78613' }
const COD = { type: 'CASH', token: 'cod_test' }

describe('delivery at checkout', () => {
  let userId: string
  let otherUserId: string
  let storeId: string
  let burger: string
  let soda: string

  beforeEach(async () => {
    userId = (await createAuthenticatedUser('USER')).id
    otherUserId = (await createAuthenticatedUser('USER')).id
    storeId = (await createTestStore(userId, { isPublished: true })).id
    await prisma.store.update({
      where: { id: storeId },
      data: {
        deliveryEnabled: true,
        pickupEnabled: true,
        deliveryDistance: 2,
        deliveryCharge: 3,
        deliveryMinimum: 15,
        latitude: 30.3107,
        longitude: -97.724,
        addressStreet: '4400 Duval St',
        addressCity: 'Austin',
        addressState: 'TX',
        addressZip: '78751',
      },
    })
    burger = (await createTestItem(storeId, { title: 'Burger', price: '10.00' })).id
    soda = (await createTestItem(storeId, { title: 'Soda', price: '2.00' })).id
  })

  afterEach(async () => {
    await cleanupTestData()
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } })
  })

  const quote = (items: { itemId: string; quantity: number }[], extra: Record<string, unknown> = {}) =>
    quoteCheckout({ items, deliveryType: 'DELIVERY', ...extra }, userId)

  it('asks for an address before promising delivery', async () => {
    const result = await quote([{ itemId: burger, quantity: 2 }])
    expect(result.blocked).toMatchObject({ code: 'ADDRESS_REQUIRED' })
    expect(result.fulfillment.pickup.available).toBe(true)
  })

  it('delivers inside the radius at the store’s fee', async () => {
    const result = await quote([{ itemId: burger, quantity: 2 }], { deliveryAddress: HOME })
    expect(result.blocked).toBeNull()
    expect(result.fulfillment.delivery).toMatchObject({ available: true, fee: 3 })
    expect(result.deliveryFee).toBe(3)
    expect(result.destination).toMatchObject({ address: { line2: 'Apt 2', instructions: 'Ring twice' }, approximate: true })
  })

  it('explains when an address is too far away', async () => {
    const result = await quote([{ itemId: burger, quantity: 2 }], { deliveryAddress: DOWNTOWN })
    expect(result.blocked).toMatchObject({ code: 'OUTSIDE_DELIVERY_AREA' })
    expect(result.blocked?.message).toMatch(/delivers within 2 miles/)
  })

  it('never delivers "anywhere" when the store has no radius or zones', async () => {
    await prisma.store.update({ where: { id: storeId }, data: { deliveryDistance: 0 } })
    const result = await quote([{ itemId: burger, quantity: 2 }], { deliveryAddress: HOME })
    expect(result.blocked).toMatchObject({ code: 'NO_DELIVERY_AREA' })
    // Said before any address, so checkout can offer pickup only.
    const noAddress = await quote([{ itemId: burger, quantity: 2 }])
    expect(noAddress.fulfillment.delivery).toMatchObject({ available: false, code: 'NO_DELIVERY_AREA' })
  })

  it('explains an address it can’t find', async () => {
    const result = await quote([{ itemId: burger, quantity: 2 }], { deliveryAddress: NOWHERE })
    expect(result.blocked).toMatchObject({ code: 'ADDRESS_NOT_FOUND' })
  })

  it('says how much more is needed for the delivery minimum', async () => {
    const result = await quote([{ itemId: burger, quantity: 1 }], { deliveryAddress: HOME })
    expect(result.blocked).toMatchObject({ code: 'BELOW_DELIVERY_MINIMUM' })
    expect(result.fulfillment.delivery).toMatchObject({ available: false, minimum: 15, shortBy: 5 })
  })

  it('prices by delivery zone when the store has zones', async () => {
    // A square around the store's ZIP centre.
    const ring = [[-97.74, 30.30], [-97.70, 30.30], [-97.70, 30.32], [-97.74, 30.32], [-97.74, 30.30]]
    await prisma.deliveryZone.create({
      data: { storeId, name: 'Hyde Park', polygonJson: { type: 'Polygon', coordinates: [ring] }, baseFee: 1.5, minOrder: 5 },
    })
    const inside = await quote([{ itemId: burger, quantity: 1 }], { deliveryAddress: HOME })
    expect(inside.fulfillment.delivery).toMatchObject({ available: true, fee: 1.5 })
    const outside = await quote([{ itemId: burger, quantity: 1 }], { deliveryAddress: DOWNTOWN })
    expect(outside.blocked).toMatchObject({ code: 'OUTSIDE_DELIVERY_AREA' })
  })

  it('offers only pickup at a pickup-only store, and only delivery at a delivery-only one', async () => {
    await prisma.store.update({ where: { id: storeId }, data: { deliveryEnabled: false } })
    const pickupOnly = await quote([{ itemId: burger, quantity: 2 }], { deliveryAddress: HOME })
    expect(pickupOnly.blocked).toMatchObject({ code: 'STORE_DOES_NOT_DELIVER' })
    await prisma.store.update({ where: { id: storeId }, data: { deliveryEnabled: true, pickupEnabled: false } })
    const deliveryOnly = await quoteCheckout({ items: [{ itemId: burger, quantity: 2 }], deliveryType: 'PICKUP' }, userId)
    expect(deliveryOnly.blocked).toMatchObject({ code: 'STORE_DOES_NOT_OFFER_PICKUP' })
  })

  it('says up front when the store isn’t taking orders', async () => {
    await prisma.store.update({ where: { id: storeId }, data: { acceptingOrders: false, ordersPausedReason: 'Back at 5pm' } })
    const result = await quoteCheckout({ items: [{ itemId: burger, quantity: 2 }], deliveryType: 'PICKUP' }, userId)
    expect(result.blocked).toEqual({ code: 'STORE_NOT_TAKING_ORDERS', message: 'Back at 5pm' })
  })

  it('uses a saved address only for its owner', async () => {
    const saved = await prisma.address.create({ data: { userId, ...HOME, country: 'US' } })
    const mine = await quote([{ itemId: burger, quantity: 2 }], { deliveryAddressId: saved.id })
    expect(mine.fulfillment.delivery.available).toBe(true)
    await expect(
      quoteCheckout({ items: [{ itemId: burger, quantity: 2 }], deliveryType: 'DELIVERY', deliveryAddressId: saved.id }, otherUserId),
    ).rejects.toThrow(/no longer available/)
  })

  it('creates a delivery order with the address, distance and fee it was quoted', async () => {
    const items = [{ itemId: burger, quantity: 2 }]
    const quoted = await quote(items, { deliveryAddress: HOME })
    const session = await createCheckoutSession(userId, {
      items,
      deliveryType: 'DELIVERY',
      deliveryMode: 'STORE_MANAGED_DELIVERY',
      deliveryAddress: HOME,
      paymentMethod: COD,
    })
    expect(session.total).toBe(quoted.total)
    const done = await completeCheckout(userId, { sessionId: session.sessionId, paymentMethod: COD, tipAmount: 0, paymentRail: 'COD' })
    const order = await prisma.order.findUniqueOrThrow({ where: { id: (done as { order: { id: string } }).order.id } })
    expect(order.deliveryType).toBe('DELIVERY')
    expect(Number(order.total)).toBe(quoted.total)
    expect(Number(order.fees)).toBe(3)
    expect(order.taxProvider).toBe('estimate')
    expect(order.addressSnapshot).toMatchObject({ line1: '4500 Duval St', line2: 'Apt 2', instructions: 'Ring twice' })
    expect(order.deliveryLatitude).not.toBeNull()
  })

  it('answers a repeated completion with the order it already placed', async () => {
    const session = await createCheckoutSession(userId, {
      items: [{ itemId: burger, quantity: 2 }],
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: COD,
    })
    const complete = () => completeCheckout(userId, { sessionId: session.sessionId, paymentMethod: COD, tipAmount: 0, paymentRail: 'COD' })
    const first = (await complete()) as { order: { id: string } }
    const again = (await complete()) as { order: { id: string } }
    expect(again.order.id).toBe(first.order.id)
    expect(await prisma.order.count({ where: { cartId: session.sessionId } })).toBe(1)
  })

  it('refuses to start delivery checkout the store can’t fulfill', async () => {
    await expect(
      createCheckoutSession(userId, {
        items: [{ itemId: burger, quantity: 2 }],
        deliveryType: 'DELIVERY',
        deliveryMode: 'STORE_MANAGED_DELIVERY',
        deliveryAddress: DOWNTOWN,
        paymentMethod: COD,
      }),
    ).rejects.toThrow(/miles away/)
  })

  it('stops completion when prices changed after checkout started', async () => {
    const session = await createCheckoutSession(userId, {
      items: [{ itemId: soda, quantity: 1 }],
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: COD,
    })
    await prisma.item.update({ where: { id: soda }, data: { price: '2.50' } })
    await expect(
      completeCheckout(userId, { sessionId: session.sessionId, paymentMethod: COD, tipAmount: 0, paymentRail: 'COD' }),
    ).rejects.toThrow(/Prices changed/)
  })

  it('taxes prepared food but not groceries in the estimate', async () => {
    await prisma.item.update({ where: { id: soda }, data: { taxCategory: 'GROCERY' } })
    const result = await quoteCheckout({ items: [{ itemId: burger, quantity: 1 }, { itemId: soda, quantity: 1 }], deliveryType: 'PICKUP' }, userId)
    // 8.25% of the 10.00 burger only.
    expect(result.tax).toBe(0.83)
    // A grocery store's items default to grocery.
    await prisma.store.update({ where: { id: storeId }, data: { storeType: 'GROCERY' } })
    await prisma.item.update({ where: { id: soda }, data: { taxCategory: null } })
    const grocery = await quoteCheckout({ items: [{ itemId: soda, quantity: 1 }], deliveryType: 'PICKUP' }, userId)
    expect(grocery.tax).toBe(0)
  })
})

describe('tax providers', () => {
  const input = {
    lines: [
      { reference: 'burger', amountCents: 1000, quantity: 1, category: 'PREPARED_FOOD' as const },
      { reference: 'milk', amountCents: 400, quantity: 2, category: 'GROCERY' as const },
    ],
    deliveryFeeCents: 300,
    destination: { line1: '4500 Duval St', city: 'Austin', state: 'TX', postalCode: '78751', country: 'US' },
    origin: { line1: '4400 Duval St', city: 'Austin', state: 'TX', postalCode: '78751', country: 'US' },
  }

  it('sends Stripe Tax each line’s product tax code, the destination and the delivery charge', async () => {
    const create = vi.fn(async () => ({ id: 'taxcalc_123', tax_amount_exclusive: 112 }))
    const result = await stripeTax(input, { tax: { calculations: { create } } })
    expect(result).toEqual({ taxCents: 112, provider: 'stripe', estimated: false, calculationId: 'taxcalc_123' })
    const params = (create.mock.calls[0] as unknown as [Record<string, any>])[0]
    expect(params.line_items).toEqual([
      expect.objectContaining({ amount: 1000, tax_code: STRIPE_TAX_CODES.PREPARED_FOOD, tax_behavior: 'exclusive' }),
      expect.objectContaining({ amount: 400, quantity: 2, tax_code: STRIPE_TAX_CODES.GROCERY }),
    ])
    expect(params.customer_details).toMatchObject({ address: { postal_code: '78751', state: 'TX' }, address_source: 'shipping' })
    expect(params.shipping_cost).toEqual({ amount: 300 })
  })

  it('fails instead of estimating when Stripe Tax fails', async () => {
    const create = vi.fn(async () => {
      throw new Error('Stripe Tax is not active')
    })
    await expect(stripeTax(input, { tax: { calculations: { create } } })).rejects.toThrow(/could not be calculated/)
  })

  it('labels the development estimate as an estimate', () => {
    // Texas: food 10.00 taxable, groceries exempt; delivery taxed in the taxable share (10/14 of 3.00).
    expect(estimateTax(input)).toEqual({ taxCents: Math.round((1000 + 300 * (1000 / 1400)) * 0.0825), provider: 'estimate', estimated: true, calculationId: null })
  })

  it('uses Stripe in production and refuses a silent estimate there', () => {
    expect(configuredTaxProvider({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe('stripe')
    expect(() => configuredTaxProvider({ NODE_ENV: 'production', TAX_PROVIDER: 'estimate' } as NodeJS.ProcessEnv)).toThrow(/not allowed in production/)
    expect(configuredTaxProvider({ NODE_ENV: 'production', TAX_PROVIDER: 'estimate', ALLOW_ESTIMATED_TAX: 'true' } as NodeJS.ProcessEnv)).toBe('estimate')
    expect(configuredTaxProvider({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe('estimate')
  })
})
