/**
 * Order Service
 * Handles order operations with real-time broadcasting
 */
import type { Order, OrderStatus, OrderEvent } from '../generated/client/index.js';
export interface BroadcastFunction {
    (topic: string, event: {
        type: string;
        timestamp: string;
        payload: Record<string, unknown>;
    }): void;
}
export interface CreateOrderEventInput {
    orderId: string;
    status: OrderStatus;
    note?: string;
}
export interface UpdateOrderStatusInput {
    orderId: string;
    newStatus: OrderStatus;
    note?: string;
    changedBy?: string;
}
export declare class OrderService {
    /**
     * Create order event (audit trail) and broadcast
     */
    createOrderEvent(input: CreateOrderEventInput): Promise<OrderEvent>;
    /**
     * Transition order to a new status.
     * Validates the transition, writes the audit event, logs, and broadcasts.
     * This is the single entry point for all programmatic status changes.
     */
    transitionOrderStatus(input: UpdateOrderStatusInput): Promise<Order>;
    /**
     * @deprecated Use transitionOrderStatus — kept for internal backward-compat callers.
     */
    updateOrderStatus(input: UpdateOrderStatusInput): Promise<Order>;
    /**
     * Broadcast new order creation to vendor
     */
    broadcastNewOrder(orderId: string): Promise<void>;
    /**
     * Get order with full details
     */
    getOrderById(orderId: string): Promise<({
        items: ({
            item: {
                title: string;
                id: string;
                price: import("@packages/db/generated/client/runtime/library.js").Decimal;
            } | null;
        } & {
            id: string;
            optionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
            itemId: string | null;
            bundleId: string | null;
            quantity: number;
            notes: string | null;
            titleSnapshot: string;
            unitPrice: import("@packages/db/generated/client/runtime/library.js").Decimal;
            orderId: string;
            bundleSnapshot: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        })[];
        user: {
            name: string | null;
            id: string;
            email: string;
        };
        store: {
            name: string;
            id: string;
            phone: string | null;
            slug: string;
        };
        address: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            phone: string | null;
            isActive: boolean;
            label: string | null;
            contactName: string | null;
            line1: string;
            line2: string | null;
            city: string;
            state: string;
            postalCode: string;
            country: string;
            instructions: string | null;
            geo: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
            isDefault: boolean;
            externalRef: string | null;
            archivedAt: Date | null;
        } | null;
        events: {
            status: import("../generated/client/index.js").$Enums.OrderStatus;
            id: string;
            createdAt: Date;
            note: string | null;
            orderId: string;
        }[];
    } & {
        status: import("../generated/client/index.js").$Enums.OrderStatus;
        deliveryType: import("../generated/client/index.js").$Enums.DeliveryType;
        deliveryLatitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        deliveryLongitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        tip: import("@packages/db/generated/client/runtime/library.js").Decimal;
        id: string;
        referredByReferralCode: string | null;
        affiliateAttributionSource: import("../generated/client/index.js").$Enums.AffiliateAttributionSource | null;
        deliveryMode: import("../generated/client/index.js").$Enums.DeliveryMode;
        paymentStatus: import("../generated/client/index.js").$Enums.PaymentStatus;
        subtotal: import("@packages/db/generated/client/runtime/library.js").Decimal;
        fees: import("@packages/db/generated/client/runtime/library.js").Decimal;
        tax: import("@packages/db/generated/client/runtime/library.js").Decimal;
        total: import("@packages/db/generated/client/runtime/library.js").Decimal;
        serviceFeePercent: import("@packages/db/generated/client/runtime/library.js").Decimal;
        serviceFeeAmount: import("@packages/db/generated/client/runtime/library.js").Decimal;
        netToVendor: import("@packages/db/generated/client/runtime/library.js").Decimal;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        stripeTransferId: string | null;
        stripeApplicationFeeId: string | null;
        stripeRefundId: string | null;
        addressSnapshot: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        deliveryDistanceMiles: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        estimatedDeliveryAt: Date | null;
        cancelReason: string | null;
        canceledBy: string | null;
        canceledAt: Date | null;
        refundReason: string | null;
        refundedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        storeId: string;
        cartId: string | null;
        referredByAffiliateId: string | null;
        assignedToUserId: string | null;
        addressId: string | null;
    }) | null>;
    /**
     * Get orders for customer
     */
    getCustomerOrders(userId: string, filters?: {
        status?: OrderStatus;
    }): Promise<({
        items: {
            id: string;
            optionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
            itemId: string | null;
            bundleId: string | null;
            quantity: number;
            notes: string | null;
            titleSnapshot: string;
            unitPrice: import("@packages/db/generated/client/runtime/library.js").Decimal;
            orderId: string;
            bundleSnapshot: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        }[];
        store: {
            name: string;
            id: string;
            slug: string;
        };
    } & {
        status: import("../generated/client/index.js").$Enums.OrderStatus;
        deliveryType: import("../generated/client/index.js").$Enums.DeliveryType;
        deliveryLatitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        deliveryLongitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        tip: import("@packages/db/generated/client/runtime/library.js").Decimal;
        id: string;
        referredByReferralCode: string | null;
        affiliateAttributionSource: import("../generated/client/index.js").$Enums.AffiliateAttributionSource | null;
        deliveryMode: import("../generated/client/index.js").$Enums.DeliveryMode;
        paymentStatus: import("../generated/client/index.js").$Enums.PaymentStatus;
        subtotal: import("@packages/db/generated/client/runtime/library.js").Decimal;
        fees: import("@packages/db/generated/client/runtime/library.js").Decimal;
        tax: import("@packages/db/generated/client/runtime/library.js").Decimal;
        total: import("@packages/db/generated/client/runtime/library.js").Decimal;
        serviceFeePercent: import("@packages/db/generated/client/runtime/library.js").Decimal;
        serviceFeeAmount: import("@packages/db/generated/client/runtime/library.js").Decimal;
        netToVendor: import("@packages/db/generated/client/runtime/library.js").Decimal;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        stripeTransferId: string | null;
        stripeApplicationFeeId: string | null;
        stripeRefundId: string | null;
        addressSnapshot: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        deliveryDistanceMiles: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        estimatedDeliveryAt: Date | null;
        cancelReason: string | null;
        canceledBy: string | null;
        canceledAt: Date | null;
        refundReason: string | null;
        refundedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        storeId: string;
        cartId: string | null;
        referredByAffiliateId: string | null;
        assignedToUserId: string | null;
        addressId: string | null;
    })[]>;
    /**
     * Get orders for vendor
     */
    getVendorOrders(storeId: string, filters?: {
        status?: OrderStatus;
    }): Promise<({
        items: {
            id: string;
            optionsJson: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
            itemId: string | null;
            bundleId: string | null;
            quantity: number;
            notes: string | null;
            titleSnapshot: string;
            unitPrice: import("@packages/db/generated/client/runtime/library.js").Decimal;
            orderId: string;
            bundleSnapshot: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        }[];
        user: {
            name: string | null;
            id: string;
            phone: string | null;
        };
        address: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            phone: string | null;
            isActive: boolean;
            label: string | null;
            contactName: string | null;
            line1: string;
            line2: string | null;
            city: string;
            state: string;
            postalCode: string;
            country: string;
            instructions: string | null;
            geo: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
            isDefault: boolean;
            externalRef: string | null;
            archivedAt: Date | null;
        } | null;
    } & {
        status: import("../generated/client/index.js").$Enums.OrderStatus;
        deliveryType: import("../generated/client/index.js").$Enums.DeliveryType;
        deliveryLatitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        deliveryLongitude: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        tip: import("@packages/db/generated/client/runtime/library.js").Decimal;
        id: string;
        referredByReferralCode: string | null;
        affiliateAttributionSource: import("../generated/client/index.js").$Enums.AffiliateAttributionSource | null;
        deliveryMode: import("../generated/client/index.js").$Enums.DeliveryMode;
        paymentStatus: import("../generated/client/index.js").$Enums.PaymentStatus;
        subtotal: import("@packages/db/generated/client/runtime/library.js").Decimal;
        fees: import("@packages/db/generated/client/runtime/library.js").Decimal;
        tax: import("@packages/db/generated/client/runtime/library.js").Decimal;
        total: import("@packages/db/generated/client/runtime/library.js").Decimal;
        serviceFeePercent: import("@packages/db/generated/client/runtime/library.js").Decimal;
        serviceFeeAmount: import("@packages/db/generated/client/runtime/library.js").Decimal;
        netToVendor: import("@packages/db/generated/client/runtime/library.js").Decimal;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        stripeTransferId: string | null;
        stripeApplicationFeeId: string | null;
        stripeRefundId: string | null;
        addressSnapshot: import("@packages/db/generated/client/runtime/library.js").JsonValue | null;
        deliveryDistanceMiles: import("@packages/db/generated/client/runtime/library.js").Decimal | null;
        estimatedDeliveryAt: Date | null;
        cancelReason: string | null;
        canceledBy: string | null;
        canceledAt: Date | null;
        refundReason: string | null;
        refundedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        storeId: string;
        cartId: string | null;
        referredByAffiliateId: string | null;
        assignedToUserId: string | null;
        addressId: string | null;
    })[]>;
    /**
     * Get pending orders count for vendor
     */
    getPendingOrdersCount(storeId: string): Promise<number>;
    /**
     * Cancel order
     */
    cancelOrder(orderId: string, reason?: string, canceledBy?: string): Promise<Order>;
}
export declare const orderService: OrderService;
/** Wire broker once (e.g. WebSocket fan-out). Same hook used by HTTP order resources. */
export declare function setOrderServiceBroadcast(broadcast: BroadcastFunction): void;
//# sourceMappingURL=order.service.d.ts.map