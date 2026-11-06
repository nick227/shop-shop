/**
 * Launch path for a delivery order, end to end against recorded Stripe and geocoder contracts:
 * a precisely located address is judged against the store's radius or drawn areas (edges included),
 * the shopper is quoted with Stripe Tax, the card is charged once with the platform's fee routed by
 * Connect, a declined card or 3-D Secure retry pays the same order, a refund reverses the vendor's
 * transfer, and nothing is charged when Stripe isn't configured.
 *
 * No network: the Stripe client and the address provider are substitutes that record what was asked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import Fastify from 'fastify'

vi.mock('../config/stripeConnectUrls.js', () => ({
  resolveStripeConnectUrls: vi.fn(() => ({ returnUrl: 'http://x/success', refreshUrl: 'http://x/refresh' })),
  isCodPaymentsEnabled: vi.fn(() => false),
}))
vi.mock('@packages/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@packages/db')>()
  return { ...actual, publishOrderCreated: vi.fn(async () => undefined) }
})

import { createRefund, handlePaymentIntentSucceeded, prisma, setStripeClientForTesting, Decimal } from '@packages/db'
import { completeCheckout, createCheckoutSession, quoteCheckout } from '../services/checkout.service.js'
import { setAddressProviderForTesting, type AddressProvider, type AddressQuery } from '../commerce/addressProvider.js'
import { deliveryZoneRoutes } from '../routes/delivery-zone.route.js'
import { optionalAuthenticate } from '../middleware/auth.js'
import { authHeaders, cleanupTestData, createEnrolledVendor, createAuthenticatedUser, createTestItem, createTestStore } from './helpers.js'

const STORE = { lat: 30.3107, lng: -97.724 }
const MILE_LAT = 1 / 69.055 // degrees of latitude per mile
const north = (miles: number) => ({ lat: STORE.lat + miles * MILE_LAT, lng: STORE.lng })

// A precise geocoder: each street line maps to an exact point.
const points: Record<string, { lat: number; lng: number }> = {}
const precise: AddressProvider = {
  name: 'mapbox',
  suggests: true,
  suggest: async () => [],
  locate: async (address: AddressQuery) => (points[address.line1] ? { ...points[address.line1], precision: 'address' } : null),
}
const address = (line1: string, at: { lat: number; lng: number }) => {
  points[line1] = at
  return { line1, city: 'Austin', state: 'TX', postalCode: '78751' }
}

// A Stripe stand-in that records calls and answers like the API.
type Call = { method: string; params: Record<string, any>; options?: Record<string, any> }
let calls: Call[] = []
let nextCreate: (params: Record<string, any>) => any = () => ({ status: 'succeeded' })
let nextConfirm: (params: Record<string, any>) => any = () => ({ status: 'succeeded' })
const intents = new Map<string, any>()
let serial = 0
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(serial += 1)}`
const fakeStripe = {
  tax: {
    calculations: {
      create: vi.fn(async (params: Record<string, any>) => {
        calls.push({ method: 'tax.calculations.create', params })
        const taxable = params.line_items.reduce((sum: number, l: { amount: number }) => sum + l.amount, 0) + (params.shipping_cost?.amount ?? 0)
        return { id: uid('taxcalc'), tax_amount_exclusive: Math.round(taxable * 0.0825) }
      }),
    },
  },
  paymentIntents: {
    create: vi.fn(async (params: Record<string, any>, options?: Record<string, any>) => {
      calls.push({ method: 'paymentIntents.create', params, options })
      const id = uid('pi')
      const outcome = nextCreate(params)
      const intent = { id, client_secret: `${id}_secret`, amount: params.amount, application_fee_amount: params.application_fee_amount, transfer_data: params.transfer_data, payment_method: params.payment_method, ...outcome }
      intents.set(id, intent)
      if (outcome.decline) {
        intent.status = 'requires_payment_method'
        throw Object.assign(new Error(outcome.decline), { type: 'StripeCardError', raw: { payment_intent: { id } } })
      }
      return intent
    }),
    retrieve: vi.fn(async (id: string) => intents.get(id)),
    confirm: vi.fn(async (id: string, params: Record<string, any>) => {
      calls.push({ method: 'paymentIntents.confirm', params: { id, ...params } })
      const intent = { ...intents.get(id), payment_method: params.payment_method, ...nextConfirm(params) }
      intents.set(id, intent)
      return intent
    }),
  },
  refunds: {
    create: vi.fn(async (params: Record<string, any>) => {
      calls.push({ method: 'refunds.create', params })
      return { id: uid('re'), status: 'succeeded' }
    }),
  },
}

describe('delivery launch path', () => {
  const env = { ...process.env }
  let shopperId: string
  let storeId: string
  let burger: string
  let account: string

  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_contract123'
    process.env.TAX_PROVIDER = 'stripe'
    process.env.ALLOW_APPROXIMATE_DELIVERY = 'false'
    setStripeClientForTesting(fakeStripe)
    setAddressProviderForTesting(precise)
  })

  afterAll(async () => {
    process.env = env
    setStripeClientForTesting(null)
    setAddressProviderForTesting(null)
    await cleanupTestData()
  })

  beforeEach(async () => {
    calls = []
    nextCreate = () => ({ status: 'succeeded' })
    nextConfirm = () => ({ status: 'succeeded' })
    account = `acct_${Date.now()}${Math.random().toString(36).slice(2, 8)}`
    shopperId = (await createAuthenticatedUser('USER')).id
    const owner = await createAuthenticatedUser('VENDOR')
    storeId = (await createTestStore(owner.id, { isPublished: true })).id
    await prisma.store.update({
      where: { id: storeId },
      data: {
        deliveryEnabled: true,
        pickupEnabled: true,
        deliveryDistance: 2,
        deliveryCharge: 3,
        latitude: STORE.lat,
        longitude: STORE.lng,
        addressStreet: '4400 Duval St',
        addressCity: 'Austin',
        addressState: 'TX',
        addressZip: '78751',
        commissionRate: 10,
        stripeAccountId: account,
        stripeOnboarded: true,
        stripeChargesEnabled: true,
      },
    })
    burger = (await createTestItem(storeId, { title: 'Burger', price: '12.50' })).id
  })

  const items = () => [{ itemId: burger, quantity: 2 }]
  const quoteTo = (to: ReturnType<typeof address>) => quoteCheckout({ items: items(), deliveryType: 'DELIVERY', deliveryAddress: to }, shopperId)
  const card = (token: string) => ({ type: 'CREDIT_CARD', token })
  const checkout = async (to: ReturnType<typeof address>, token = 'pm_card_visa') => {
    const session = await createCheckoutSession(shopperId, { items: items(), deliveryType: 'DELIVERY', deliveryMode: 'STORE_MANAGED_DELIVERY', deliveryAddress: to, paymentMethod: card(token) })
    return { session, complete: (pm = token) => completeCheckout(shopperId, { sessionId: session.sessionId, paymentMethod: card(pm), tipAmount: 0, paymentRail: 'CARD' }) }
  }

  describe('eligibility on exact positions', () => {
    it('holds the radius to the exact distance, not a rounded one', async () => {
      expect((await quoteTo(address('1 Inside Radius', north(1.97)))).fulfillment.delivery).toMatchObject({ available: true, fee: 3, distanceMiles: 2 })
      const beyond = await quoteTo(address('1 Just Beyond', north(2.04)))
      expect(beyond.blocked).toMatchObject({ code: 'OUTSIDE_DELIVERY_AREA' })
    })

    it('judges a drawn area right at its edges', async () => {
      // A square whose north edge is 1 mile north of the store.
      const edge = STORE.lat + MILE_LAT
      const ring = [[-97.74, 30.30], [-97.70, 30.30], [-97.70, edge], [-97.74, edge], [-97.74, 30.30]]
      await prisma.deliveryZone.create({ data: { storeId, name: 'Hyde Park', polygonJson: { type: 'Polygon', coordinates: [ring] }, baseFee: 1.5 } })
      const inside = await quoteTo(address('1 Inside Edge', { lat: edge - 0.00005, lng: STORE.lng }))
      expect(inside.blocked).toBeNull()
      expect(inside.fulfillment.delivery).toMatchObject({ available: true, fee: 1.5 })
      const outside = await quoteTo(address('1 Outside Edge', { lat: edge + 0.00005, lng: STORE.lng }))
      expect(outside.blocked).toMatchObject({ code: 'OUTSIDE_DELIVERY_AREA' })
      // Zones replace the radius: within 2 miles but outside the area is refused.
      expect((await quoteTo(address('1 In Radius Not Area', north(1.5)))).blocked).toMatchObject({ code: 'OUTSIDE_DELIVERY_AREA' })
    })

    it('shows the vendor the same answer the shopper gets', async () => {
      const app = Fastify({ logger: false })
      app.addHook('preHandler', optionalAuthenticate)
      await app.register(deliveryZoneRoutes, { prefix: '/api' })
      const vendor = await createEnrolledVendor()
      await prisma.store.update({ where: { id: storeId }, data: { ownerUserId: vendor.id } })
      const to = address('4500 Duval St', north(0.4))
      const preview = await app.inject({ method: 'POST', url: `/api/stores/${storeId}/delivery-preview`, headers: authHeaders(vendor.token), payload: { address: to, subtotal: 25 } })
      const quoted = await quoteTo(to)
      expect(preview.json()).toMatchObject({ destination: { approximate: false }, eligibility: { available: true, fee: quoted.deliveryFee } })
      await app.close()
    })
  })

  it('quotes with Stripe Tax, charges that total once with the platform fee routed to the vendor, and marks it paid', async () => {
    const to = address('4500 Duval St', north(0.4))
    const quoted = await quoteTo(to)
    expect(quoted.blocked).toBeNull()
    expect(quoted.taxEstimated ?? false).toBe(false)
    const taxCall = calls.find((c) => c.method === 'tax.calculations.create')!
    expect(taxCall.params.shipping_cost).toEqual({ amount: 300 })
    expect(taxCall.params.customer_details.address).toMatchObject({ line1: '4500 Duval St', postal_code: '78751' })

    const { complete } = await checkout(to)
    const done = (await complete()) as { order: { id: string }; payment: { status: string } }
    expect(done.payment.status).toBe('succeeded')
    const order = await prisma.order.findUniqueOrThrow({ where: { id: done.order.id } })
    expect(Number(order.total)).toBe(quoted.total)
    expect(order.taxProvider).toBe('stripe')
    expect(order.taxCalculationId).toMatch(/^taxcalc_/)
    expect(order.deliveryLatitude).toBeCloseTo(to && points['4500 Duval St'].lat, 6)

    const charges = calls.filter((c) => c.method === 'paymentIntents.create')
    expect(charges).toHaveLength(1)
    expect(charges[0].params).toMatchObject({
      amount: Math.round(quoted.total * 100),
      currency: 'usd',
      payment_method: 'pm_card_visa',
      confirm: true,
      transfer_data: { destination: account },
      // 0% shopper service fee at launch + 10% vendor commission on the 25.00 subtotal.
      application_fee_amount: 250,
      metadata: { orderId: order.id },
    })
    expect(charges[0].options?.idempotencyKey).toContain(order.id)

    await handlePaymentIntentSucceeded(order.stripePaymentIntentId!)
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ paymentStatus: 'PAID', status: 'PLACED' })
  })

  it('pays the same order after a declined card, with no second order or second intent', async () => {
    const to = address('4500 Duval St', north(0.4))
    nextCreate = () => ({ decline: 'Your card was declined.' })
    const { session, complete } = await checkout(to, 'pm_card_chargeDeclined')
    await expect(complete()).rejects.toMatchObject({ statusCode: 402, message: 'Your card was declined.' })
    const pending = await prisma.order.findFirstOrThrow({ where: { cartId: session.sessionId } })
    expect(pending).toMatchObject({ status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID' })
    const declinedIntent = calls.find((c) => c.method === 'paymentIntents.create') && [...intents.keys()].at(-1)
    expect(pending.stripePaymentIntentId).toBe(declinedIntent)

    const retried = (await complete('pm_card_visa')) as { order: { id: string }; payment: { status: string } }
    expect(retried.order.id).toBe(pending.id)
    expect(retried.payment.status).toBe('succeeded')
    expect(calls.filter((c) => c.method === 'paymentIntents.create')).toHaveLength(1)
    expect(calls.find((c) => c.method === 'paymentIntents.confirm')?.params).toEqual({ id: declinedIntent, payment_method: 'pm_card_visa' })
    expect(await prisma.order.count({ where: { cartId: session.sessionId } })).toBe(1)
  })

  it('hands the browser a 3-D Secure step, and a retry with the same card doesn’t re-confirm', async () => {
    const to = address('4500 Duval St', north(0.4))
    nextCreate = () => ({ status: 'requires_action' })
    const { complete } = await checkout(to, 'pm_card_threeDSecure2Required')
    const first = (await complete()) as { payment: { status: string; clientSecret: string } }
    expect(first.payment).toMatchObject({ status: 'requires_action', clientSecret: expect.stringMatching(/_secret$/) })
    const again = (await complete()) as { payment: { status: string } }
    expect(again.payment.status).toBe('requires_action')
    expect(calls.some((c) => c.method === 'paymentIntents.confirm')).toBe(false)
  })

  it('reverses the vendor transfer and returns the platform fee on a full refund; partial keeps the fee', async () => {
    const to = address('4500 Duval St', north(0.4))
    const { complete } = await checkout(to)
    const done = (await complete()) as { order: { id: string } }
    const order = await prisma.order.findUniqueOrThrow({ where: { id: done.order.id } })
    await createRefund(order.stripePaymentIntentId!, undefined, 'refund-full')
    expect(calls.at(-1)?.params).toEqual({ payment_intent: order.stripePaymentIntentId, reverse_transfer: true, refund_application_fee: true })
    await createRefund(order.stripePaymentIntentId!, new Decimal(5), 'refund-part')
    expect(calls.at(-1)?.params).toEqual({ payment_intent: order.stripePaymentIntentId, amount: 500, reverse_transfer: true })
  })

  it('creates no order and charges nothing when Stripe isn’t configured', async () => {
    const to = address('4500 Duval St', north(0.4))
    setStripeClientForTesting(null)
    process.env.STRIPE_SECRET_KEY = 'your_stripe_secret_key'
    process.env.TAX_PROVIDER = 'estimate'
    try {
      const { session, complete } = await checkout(to)
      await expect(complete()).rejects.toMatchObject({ statusCode: 503 })
      expect(await prisma.order.count({ where: { cartId: session.sessionId } })).toBe(0)
    } finally {
      process.env.STRIPE_SECRET_KEY = 'sk_test_contract123'
      process.env.TAX_PROVIDER = 'stripe'
      setStripeClientForTesting(fakeStripe)
    }
  })

  it('refuses delivery when the address can only be placed approximately', async () => {
    setAddressProviderForTesting({ ...precise, locate: async () => ({ ...north(0.4), precision: 'street' }) })
    try {
      expect((await quoteTo({ line1: '4500 Duval', city: 'Austin', state: 'TX', postalCode: '78751' })).blocked).toMatchObject({ code: 'ADDRESS_NOT_VERIFIED' })
    } finally {
      setAddressProviderForTesting(precise)
    }
  })
})
