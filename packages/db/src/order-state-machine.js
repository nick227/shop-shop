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
export const ORDER_TRANSITIONS = {
    PENDING_PAYMENT: ['PLACED', 'CANCELED'],
    PLACED: ['ACCEPTED', 'CANCELED'],
    ACCEPTED: ['PREPARING', 'CANCELED'],
    PREPARING: ['READY', 'CANCELED'],
    READY: ['OUT_FOR_DELIVERY', 'CANCELED'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: [],
    CANCELED: [],
    COMPLETED: [], // legacy terminal — no further transitions
};
export function canTransitionTo(currentStatus, newStatus) {
    const allowed = ORDER_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
        const hint = allowed.length > 0
            ? `Allowed next states: [${allowed.join(', ')}]`
            : 'This is a terminal state';
        return {
            valid: false,
            reason: `Cannot transition order from ${currentStatus} to ${newStatus}. ${hint}.`,
        };
    }
    return { valid: true };
}
export function assertValidTransition(currentStatus, newStatus) {
    const result = canTransitionTo(currentStatus, newStatus);
    if (!result.valid) {
        const err = new Error(result.reason);
        err.name = 'InvalidOrderTransitionError';
        throw err;
    }
}
export function isTerminalStatus(status) {
    const transitions = ORDER_TRANSITIONS[status];
    return transitions !== undefined && transitions.length === 0;
}
