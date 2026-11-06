import { type Prisma, prisma } from '@packages/db'
import { isCodPaymentsEnabled } from '../config/stripeConnectUrls.js'

/**
 * Shopper-facing fulfillment state. It says what a shopper can do, never why setup is
 * incomplete: no Stripe, DoorDash, or readiness detail leaves the server.
 */
export type FulfillmentAvailability = 'available' | 'temporarily_unavailable' | 'not_offered'

export interface StoreFulfillment {
  readonly delivery: FulfillmentAvailability
  readonly pickup: FulfillmentAvailability
}

/**
 * Stores that can take a delivery order: delivery switched on, a delivery fee set, a delivery
 * area checkout can measure against (an active zone, or a radius around a located store), and
 * a Stripe account that can take the card payment. Mirrors `deliveryEligibility`.
 *
 * This ranks and labels stores. It never decides whether a store appears in discovery.
 */
export const DELIVERY_READY_STORE_WHERE: Prisma.StoreWhereInput = {
  deliveryEnabled: true,
  deliveryCharge: { not: null },
  stripeAccountId: { not: null },
  stripeOnboarded: true,
  stripeChargesEnabled: true,
  OR: [
    { deliveryZones: { some: { isActive: true } } },
    { deliveryDistance: { gt: 0 }, latitude: { not: null }, longitude: { not: null } },
  ],
}

export function wantsDeliveryFirst(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

export interface FulfillmentInput {
  readonly deliveryEnabled?: unknown
  readonly pickupEnabled?: unknown
  readonly acceptingOrders?: unknown
  readonly stripeAccountId?: unknown
  readonly stripeOnboarded?: unknown
  readonly stripeChargesEnabled?: unknown
}

export function storeFulfillment(store: FulfillmentInput, deliveryReady: boolean, codEnabled = isCodPaymentsEnabled()): StoreFulfillment {
  const paused = store.acceptingOrders === false
  const takesCards = Boolean(store.stripeAccountId && store.stripeOnboarded && store.stripeChargesEnabled)
  const delivery: FulfillmentAvailability = store.deliveryEnabled !== true
    ? 'not_offered'
    : paused || !deliveryReady ? 'temporarily_unavailable' : 'available'
  const pickup: FulfillmentAvailability = store.pickupEnabled !== true
    ? 'not_offered'
    : paused || !(takesCards || codEnabled) ? 'temporarily_unavailable' : 'available'
  return { delivery, pickup }
}

const DELIVERY_RANK: Record<FulfillmentAvailability, number> = { available: 0, temporarily_unavailable: 1, not_offered: 2 }

/** Delivery-ready stores first. Stable, so distance or recency order holds inside each group. */
export function rankDeliveryFirst<T extends { fulfillment: StoreFulfillment }>(stores: readonly T[]): T[] {
  return stores
    .map((store, index) => ({ store, index }))
    .sort((a, b) => DELIVERY_RANK[a.store.fulfillment.delivery] - DELIVERY_RANK[b.store.fulfillment.delivery] || a.index - b.index)
    .map(({ store }) => store)
}

export async function deliveryReadyStoreIds(ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const rows = await prisma.store.findMany({
    where: { id: { in: [...ids] }, ...DELIVERY_READY_STORE_WHERE },
    select: { id: true },
  })
  return new Set(rows.map((row) => row.id))
}

export async function withFulfillment<T extends FulfillmentInput & { id: string }>(stores: readonly T[]): Promise<Array<T & { fulfillment: StoreFulfillment }>> {
  const ready = await deliveryReadyStoreIds(stores.map((store) => store.id))
  return stores.map((store) => ({ ...store, fulfillment: storeFulfillment(store, ready.has(store.id)) }))
}
