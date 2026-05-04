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
 * COMPLETED is kept as a legacy terminal state for historical records.
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
  READY:            ['OUT_FOR_DELIVERY', 'CANCELED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        [],
  CANCELED:         [],
  COMPLETED:        [], // legacy terminal — no further transitions
}

export function canTransitionTo(
  currentStatus: string,
  newStatus: string,
): { valid: boolean; reason?: string } {
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

export function assertValidTransition(currentStatus: string, newStatus: string): void {
  const result = canTransitionTo(currentStatus, newStatus)
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
