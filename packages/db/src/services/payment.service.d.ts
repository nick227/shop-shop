import { Decimal } from 'decimal.js';
import { retrieveAccount as stripeRetrieveAccount } from '../adapters/payments.adapter.js';
/** Owner, admin, or team member with finance scope (matches apps/server storeAccess finance). */
export declare function assertUserCanManageStoreFinance(userId: string, storeId: string): Promise<void>;
export declare function storeAcceptsOnlineCardPayments(store: {
    stripeAccountId: string | null;
    stripeOnboarded: boolean;
    stripeChargesEnabled: boolean;
}): boolean;
export declare function persistStripeAccountSnapshotOnStore(storeId: string, account: Awaited<ReturnType<typeof stripeRetrieveAccount>>): Promise<void>;
export interface ProcessOrderPaymentInput {
    orderId: string;
    userId: string;
    paymentMethodId?: string;
}
export interface ProcessOrderPaymentResult {
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
    status: string;
}
export declare const processOrderPayment: (input: ProcessOrderPaymentInput) => Promise<ProcessOrderPaymentResult>;
export interface InitiateStripeConnectInput {
    storeId: string;
    userId: string;
    businessType?: 'individual' | 'company';
    returnUrl: string;
    refreshUrl: string;
}
export interface InitiateStripeConnectResult {
    accountId: string;
    onboardingUrl: string;
}
export declare const initiateStripeConnect: (input: InitiateStripeConnectInput) => Promise<InitiateStripeConnectResult>;
export interface StripeConnectStatusApiResult {
    connected: boolean;
    stripeAccountId?: string;
    onboarded: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements?: {
        currentlyDue: string[];
        eventuallyDue: string[];
        pastDue?: string[];
        disabledReason?: string | null;
    };
    dashboardUrl?: string;
}
export declare const checkStripeConnectStatus: (storeId: string, userId: string) => Promise<StripeConnectStatusApiResult>;
export interface RefundOrderInput {
    orderId: string;
    userId: string;
    amount?: Decimal;
    reason?: string;
}
export declare const refundOrder: (input: RefundOrderInput) => Promise<{
    refundId: string;
    amount: number;
    status: string | null;
}>;
export declare const handlePaymentIntentSucceeded: (paymentIntentId: string) => Promise<void>;
export declare const handlePaymentIntentFailed: (paymentIntentId: string) => Promise<void>;
export declare const handleAccountUpdated: (accountId: string) => Promise<void>;
//# sourceMappingURL=payment.service.d.ts.map