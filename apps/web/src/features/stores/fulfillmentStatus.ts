/**
 * What a shopper can do with a store, as the server reports it. It never carries the reason a
 * store is not set up (payments, couriers, delivery area); the wording below stays shopper-level.
 * Checkout makes the final call, with the actual address.
 */
export type FulfillmentAvailability = 'available' | 'temporarily_unavailable' | 'not_offered'

export interface StoreFulfillment {
  readonly delivery: FulfillmentAvailability
  readonly pickup: FulfillmentAvailability
}

export type FulfillmentTone = 'ready' | 'limited' | 'closed'

/** A short label for cards. Undefined when the server sent no status. */
export function fulfillmentBadge(fulfillment: StoreFulfillment | undefined): { readonly label: string; readonly tone: FulfillmentTone } | undefined {
  if (!fulfillment) return undefined
  const { delivery, pickup } = fulfillment
  if (delivery === 'available') return { label: pickup === 'available' ? 'Delivery & pickup' : 'Delivery', tone: 'ready' }
  if (pickup === 'available') return { label: delivery === 'not_offered' ? 'Pickup only' : 'Pickup · no delivery now', tone: 'limited' }
  if (delivery === 'not_offered' && pickup === 'not_offered') return undefined
  return { label: 'Not taking orders', tone: 'closed' }
}

/** Sentences for the storefront when an option is missing. Null when there is nothing to explain. */
export function fulfillmentExplanation(fulfillment: StoreFulfillment | undefined): string | null {
  if (!fulfillment) return null
  const { delivery, pickup } = fulfillment
  if (delivery === 'available') return pickup === 'temporarily_unavailable' ? 'Pickup isn’t available right now. Delivery is.' : null
  if (delivery === 'temporarily_unavailable') {
    if (pickup === 'available') return 'Delivery isn’t available from this shop right now. You can still order for pickup.'
    return 'Delivery isn’t available from this shop right now.'
  }
  if (pickup === 'available') return 'This shop doesn’t deliver. Order ahead and pick up in store.'
  return null
}

const DELIVERY_RANK: Record<FulfillmentAvailability, number> = { available: 0, temporarily_unavailable: 1, not_offered: 2 }

/** Sort key for Delivery first. A store with no status sorts with the unavailable ones. */
export function deliveryRank(fulfillment: StoreFulfillment | undefined): number {
  return fulfillment ? DELIVERY_RANK[fulfillment.delivery] : 1
}
