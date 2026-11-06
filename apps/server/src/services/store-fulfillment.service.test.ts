import { describe, expect, it, vi } from 'vitest'

vi.mock('@packages/db', () => ({ prisma: { store: { findMany: vi.fn() } } }))
vi.mock('../config/stripeConnectUrls.js', () => ({ isCodPaymentsEnabled: () => false }))

const { DELIVERY_READY_STORE_WHERE, rankDeliveryFirst, storeFulfillment, wantsDeliveryFirst } = await import('./store-fulfillment.service')

const cards = { stripeAccountId: 'acct_1', stripeOnboarded: true, stripeChargesEnabled: true }

describe('store fulfillment status', () => {
  it('reads the delivery-first query flag', () => {
    expect(wantsDeliveryFirst('true')).toBe(true)
    expect(wantsDeliveryFirst('1')).toBe(true)
    expect(wantsDeliveryFirst(undefined)).toBe(false)
    expect(wantsDeliveryFirst('false')).toBe(false)
  })

  it('keeps the readiness predicate to delivery on, a fee, a payable Stripe account, and an area', () => {
    expect(DELIVERY_READY_STORE_WHERE).toMatchObject({
      deliveryEnabled: true,
      deliveryCharge: { not: null },
      stripeAccountId: { not: null },
      stripeOnboarded: true,
      stripeChargesEnabled: true,
    })
    expect(DELIVERY_READY_STORE_WHERE.OR).toEqual([
      { deliveryZones: { some: { isActive: true } } },
      { deliveryDistance: { gt: 0 }, latitude: { not: null }, longitude: { not: null } },
    ])
  })

  it('labels a delivery-ready store as delivering', () => {
    expect(storeFulfillment({ deliveryEnabled: true, pickupEnabled: true, acceptingOrders: true, ...cards }, true, false))
      .toEqual({ delivery: 'available', pickup: 'available' })
  })

  it('labels a pickup-only store without offering delivery', () => {
    expect(storeFulfillment({ deliveryEnabled: false, pickupEnabled: true, acceptingOrders: true, ...cards }, false, false))
      .toEqual({ delivery: 'not_offered', pickup: 'available' })
  })

  it('treats incomplete delivery setup as temporarily unavailable, not as not offered', () => {
    expect(storeFulfillment({ deliveryEnabled: true, pickupEnabled: true, acceptingOrders: true, ...cards }, false, false).delivery)
      .toBe('temporarily_unavailable')
  })

  it('treats a merchant pause as temporarily unavailable for both', () => {
    expect(storeFulfillment({ deliveryEnabled: true, pickupEnabled: true, acceptingOrders: false, ...cards }, true, false))
      .toEqual({ delivery: 'temporarily_unavailable', pickup: 'temporarily_unavailable' })
  })

  it('needs a way to pay for pickup: cards, or cash on pickup when that is enabled', () => {
    const noCards = { deliveryEnabled: false, pickupEnabled: true, acceptingOrders: true }
    expect(storeFulfillment(noCards, false, false).pickup).toBe('temporarily_unavailable')
    expect(storeFulfillment(noCards, false, true).pickup).toBe('available')
  })

  it('ranks delivery-ready first and keeps the incoming order inside each group', () => {
    const at = (id: string, delivery: 'available' | 'temporarily_unavailable' | 'not_offered') =>
      ({ id, fulfillment: { delivery, pickup: 'available' as const } })
    const ranked = rankDeliveryFirst([
      at('near-pickup', 'not_offered'),
      at('near-paused', 'temporarily_unavailable'),
      at('mid-delivers', 'available'),
      at('far-delivers', 'available'),
    ])
    expect(ranked.map((store) => store.id)).toEqual(['mid-delivers', 'far-delivers', 'near-paused', 'near-pickup'])
  })
})
