/**
 * Central order realtime payloads → topics (vendor / customer / order watchers).
 * Wired once via configureOrderRealtimePublisher (e.g. Fastify → WebSocket broker).
 */
export interface OrderRealtimeEvent {
    type: string;
    timestamp: string;
    payload: Record<string, unknown>;
}
export type OrderRealtimePublishFn = (topic: string, event: OrderRealtimeEvent) => void;
export declare function configureOrderRealtimePublisher(fn: OrderRealtimePublishFn): void;
/**
 * New order: vendor dashboard, customer confirmation, per-order subscribers.
 * Reloads order so item counts match persisted line items.
 */
export declare function publishOrderCreated(orderId: string): Promise<void>;
export interface PublishOrderStatusChangedOptions {
    note?: string;
    changedBy?: string;
}
/**
 * Status transitions: same three topics as OrderService previously used.
 */
export declare function publishOrderStatusChanged(orderId: string, oldStatus: string, newStatus: string, options?: PublishOrderStatusChangedOptions): Promise<void>;
//# sourceMappingURL=order-realtime.publisher.d.ts.map