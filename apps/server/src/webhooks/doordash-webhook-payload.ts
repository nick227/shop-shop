/**
 * Normalize DoorDash Drive webhook JSON — field names vary by doc/version
 * (e.g. event_name vs event_type, external_delivery_id vs delivery_external_id).
 */

export type NormalizedDoorDashWebhook = Readonly<{
  externalDeliveryId: string
  eventName: string
  eventId: string | undefined
  raw: Record<string, unknown>
}>

export function normalizeDoorDashWebhookPayload(body: unknown): NormalizedDoorDashWebhook | null {
  if (body === null || typeof body !== 'object') {
    return null
  }
  const o = body as Record<string, unknown>

  const externalDeliveryId =
    pickString(o, 'external_delivery_id') ??
    pickString(o, 'delivery_external_id') ??
    pickString(o, 'externalDeliveryId')

  const eventName =
    pickString(o, 'event_name') ??
    pickString(o, 'event_type') ??
    pickString(o, 'eventType')

  if (!externalDeliveryId || !eventName) {
    return null
  }

  const eventId = pickString(o, 'event_id') ?? pickString(o, 'eventId')

  return {
    externalDeliveryId,
    eventName,
    eventId,
    raw: o,
  }
}

function pickString(o: Record<string, unknown>, key: string): string | undefined {
  const v = o[key]
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

/**
 * Maps DoorDash Drive event names (including uppercase classic/webhook examples) to the
 * lowercase strings consumed by `doordashDriveMockAdapter.mapWebhookEvent`.
 */
export function doorDashEventToAdapterType(eventName: string): string {
  const u = eventName.trim().toUpperCase()

  if (u === 'DASHER_DROPPED_OFF') {
    return 'delivered'
  }
  if (u === 'DELIVERY_CANCELLED' || u === 'DELIVERY_CANCELED') {
    return 'canceled'
  }
  if (u === 'FAILED' || u === 'DELIVERY_FAILED') {
    return 'failed'
  }

  if (
    u === 'DASHER_PICKED_UP' ||
    u === 'DASHER_CONFIRMED' ||
    u === 'DASHER_CONFIRMED_PICKUP_ARRIVAL' ||
    u.startsWith('DASHER_ENROUTE') ||
    u === 'PICKUP_READY' ||
    u === 'DASHER_ON_THE_WAY' ||
    u === 'DASHER_ARRIVED_AT_PICKUP' ||
    u === 'DASHER_ARRIVED_AT_DROPOFF'
  ) {
    return 'picked_up'
  }

  const legacy = eventName.trim().toLowerCase()
  switch (legacy) {
    case 'picked_up':
    case 'delivered':
    case 'canceled':
    case 'cancelled':
    case 'failed':
      return legacy === 'cancelled' ? 'canceled' : legacy
    case 'pickup_ready':
    case 'dasher_on_the_way':
    case 'dasher_arrived_at_pickup':
    case 'dasher_arrived_at_dropoff':
      return 'picked_up'
    default:
      return legacy
  }
}
