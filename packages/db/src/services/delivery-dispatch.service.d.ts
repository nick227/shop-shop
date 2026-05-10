import type { DeliveryJob, DeliveryProvider, OrderStatus } from '../generated/client/index.js';
export type DispatchDeliveryInput = Readonly<{
    orderId: string;
    provider: DeliveryProvider;
    requestedByUserId?: string;
    assignedToUserId?: string;
}>;
export type CancelDeliveryJobInput = Readonly<{
    deliveryJobId: string;
    reason?: string;
}>;
/**
 * Cancels a delivery job via the registered provider adapter (sandbox mocks in dev).
 * Does not change Order status — only the DeliveryJob row.
 */
export declare function cancelDeliveryJob(input: CancelDeliveryJobInput): Promise<DeliveryJob>;
export declare function dispatchOrderDelivery(input: DispatchDeliveryInput): Promise<DeliveryJob>;
export type ProviderWebhookApplyInput = Readonly<{
    deliveryJobId: string;
    eventType: string;
    payload: unknown;
}>;
/**
 * Apply a provider webhook event to a DeliveryJob and (optionally) the Order.
 *
 * Mapping rules:
 * - provider picked_up → order OUT_FOR_DELIVERY
 * - provider delivered → order DELIVERED
 * - provider failed/canceled → do NOT cancel the order
 */
export declare function applyDeliveryProviderWebhookEvent(input: ProviderWebhookApplyInput): Promise<{
    deliveryJob: DeliveryJob;
    mappedOrderStatus?: OrderStatus;
}>;
//# sourceMappingURL=delivery-dispatch.service.d.ts.map