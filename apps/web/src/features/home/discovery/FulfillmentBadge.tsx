import { fulfillmentBadge, type StoreFulfillment } from '@features/stores/fulfillmentStatus'

/** The shop's delivery and pickup state, in shopper terms. Renders nothing without a status. */
export function FulfillmentBadge({ fulfillment }: { readonly fulfillment: StoreFulfillment | undefined }) {
  const badge = fulfillmentBadge(fulfillment)
  if (!badge) return null
  return <span className={`fulfillment-badge is-${badge.tone}`}>{badge.label}</span>
}
