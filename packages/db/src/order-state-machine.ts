/**
 * Order State Machine
 * Single source of truth for valid order status transitions.
 *
 * PENDING_PAYMENT → PLACED (on Stripe payment_intent.succeeded)
 *      ↓
 * PLACED → ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
 *   ↓           ↓          ↓         ↓
 * CANCELED  CANCELED  CANCELED  CANCELED
 *
 * Pickup uses READY → COMPLETED (collected); historical COMPLETED records remain terminal.
 */

export type OrderStatusValue =
  | 'PENDING_PAYMENT'
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELED'
  | 'COMPLETED'

export const ORDER_TRANSITIONS: Readonly<Record<OrderStatusValue, readonly OrderStatusValue[]>> = {
  PENDING_PAYMENT:  ['PLACED', 'CANCELED'],
  PLACED:           ['ACCEPTED', 'CANCELED'],
  ACCEPTED:         ['PREPARING', 'CANCELED'],
  PREPARING:        ['READY', 'CANCELED'],
  READY:            ['OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELED:         [],
  COMPLETED:        [], // collected / historical terminal — no further transitions
}

export function canTransitionTo(
  currentStatus: string,
  newStatus: string,
  deliveryType?: string,
): { valid: boolean; reason?: string } {
  if ((newStatus === 'OUT_FOR_DELIVERY' && deliveryType === 'PICKUP') ||
      (newStatus === 'COMPLETED' && deliveryType === 'DELIVERY')) {
    return { valid: false, reason: 'Action does not match fulfillment method' }
  }
  const allowed = (ORDER_TRANSITIONS as Record<string, readonly string[]>)[currentStatus] ?? []

  if (!allowed.includes(newStatus)) {
    const hint =
      allowed.length > 0
        ? `Allowed next states: [${allowed.join(', ')}]`
        : 'This is a terminal state'
    return {
      valid: false,
      reason: `Cannot transition order from ${currentStatus} to ${newStatus}. ${hint}.`,
    }
  }

  return { valid: true }
}

export function assertValidTransition(currentStatus: string, newStatus: string, deliveryType?: string): void {
  const result = canTransitionTo(currentStatus, newStatus, deliveryType)
  if (!result.valid) {
    const err = new Error(result.reason)
    err.name = 'InvalidOrderTransitionError'
    throw err
  }
}

export function isTerminalStatus(status: string): boolean {
  const transitions = (ORDER_TRANSITIONS as Record<string, readonly string[]>)[status]
  return transitions !== undefined && transitions.length === 0
}

export function allowedOrderActions(order: { status: string; deliveryType: string }) {
  const labels: Record<string, string> = { ACCEPTED: 'Accept order', PREPARING: 'Start preparing', READY: 'Mark ready', COMPLETED: 'Confirm collected', OUT_FOR_DELIVERY: 'Send for delivery', DELIVERED: 'Confirm delivered', CANCELED: 'Cancel order' }
  return (ORDER_TRANSITIONS[order.status as OrderStatusValue] ?? [])
    .filter(status => status !== 'PLACED' && canTransitionTo(order.status, status, order.deliveryType).valid)
    .map(status => ({ status, label: labels[status], requiresPrepMinutes: status === 'ACCEPTED' }))
}
