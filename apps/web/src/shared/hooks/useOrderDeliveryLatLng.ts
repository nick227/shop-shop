import { useMemo } from 'react'
import type { LatLng } from '@shared/lib/utils/maps'
import { coerceValidLatLng, coerceValidLatLngFromGeo } from '@shared/lib/utils/maps'

export interface OrderDeliveryLocationInput {
  readonly deliveryLatitude?: string | number | null
  readonly deliveryLongitude?: string | number | null
  readonly addressSnapshot?: unknown
}

/**
 * Delivery coordinates: read Order fields first (canonical); snapshot.geo only for legacy orders.
 */
export function useOrderDeliveryLatLng(order: OrderDeliveryLocationInput): LatLng | undefined {
  return useMemo(() => resolveOrderDeliveryLatLng(order), [
    order.deliveryLatitude,
    order.deliveryLongitude,
    order.addressSnapshot,
  ])
}

export function resolveOrderDeliveryLatLng(order: OrderDeliveryLocationInput): LatLng | undefined {
  const fromOrder = coerceValidLatLng({
    latitude: order.deliveryLatitude ?? undefined,
    longitude: order.deliveryLongitude ?? undefined,
  })
  if (fromOrder) return fromOrder

  const geo =
    order.addressSnapshot && typeof order.addressSnapshot === 'object' && 'geo' in order.addressSnapshot
      ? (order.addressSnapshot as { geo?: unknown }).geo
      : undefined

  return coerceValidLatLngFromGeo(geo)
}
