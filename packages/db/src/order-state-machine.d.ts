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
export type OrderStatusValue = 'PENDING_PAYMENT' | 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELED' | 'COMPLETED';
export declare const ORDER_TRANSITIONS: Readonly<Record<OrderStatusValue, readonly OrderStatusValue[]>>;
export declare function canTransitionTo(currentStatus: string, newStatus: string): {
    valid: boolean;
    reason?: string;
};
export declare function assertValidTransition(currentStatus: string, newStatus: string): void;
export declare function isTerminalStatus(status: string): boolean;
//# sourceMappingURL=order-state-machine.d.ts.map