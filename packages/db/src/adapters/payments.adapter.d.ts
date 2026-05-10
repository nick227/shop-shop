import Stripe from 'stripe';
import { Decimal } from 'decimal.js';
export interface CreatePaymentIntentParams {
    amount: Decimal;
    currency?: string;
    orderId: string;
    customerId?: string;
    paymentMethodId?: string;
    connectedAccountId?: string;
    applicationFeeAmount?: Decimal;
    /** Stripe idempotency key for PaymentIntent create (retries, disconnect safety). */
    idempotencyKey?: string;
}
export interface CreatePaymentIntentResult {
    paymentIntentId: string;
    clientSecret: string;
    status: string;
    amount: number;
}
export interface CreateTransferParams {
    amount: Decimal;
    destination: string;
    sourceTransaction: string;
    orderId: string;
}
export interface CreateTransferResult {
    transferId: string;
    amount: number;
    status: string;
}
export interface CreateConnectAccountParams {
    email: string;
    businessType: 'individual' | 'company';
    country?: string;
}
export interface CreateConnectAccountResult {
    accountId: string;
}
export interface CreateAccountLinkParams {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
}
export interface CreateAccountLinkResult {
    url: string;
}
export declare const createPaymentIntent: (params: CreatePaymentIntentParams) => Promise<CreatePaymentIntentResult>;
export declare const retrievePaymentIntent: (paymentIntentId: string) => Promise<Stripe.PaymentIntent>;
export declare const cancelPaymentIntent: (paymentIntentId: string) => Promise<Stripe.PaymentIntent>;
export declare const createRefund: (paymentIntentId: string, amount?: Decimal) => Promise<Stripe.Refund>;
export declare const createTransfer: (params: CreateTransferParams) => Promise<CreateTransferResult>;
export declare const createConnectAccount: (params: CreateConnectAccountParams) => Promise<CreateConnectAccountResult>;
export declare const createAccountLink: (params: CreateAccountLinkParams) => Promise<CreateAccountLinkResult>;
export declare const retrieveAccount: (accountId: string) => Promise<Stripe.Account>;
/** Express / Connect dashboard — vendor manages payouts and bank details. */
export declare const createExpressLoginLink: (accountId: string) => Promise<{
    url: string;
}>;
export declare const constructWebhookEvent: (payload: string | Buffer, signature: string, secret: string) => Stripe.Event;
export declare const verifyWebhookSignature: (payload: string | Buffer, signature: string) => Stripe.Event;
export declare const createCustomer: (email: string, name?: string, metadata?: Record<string, string>) => Promise<Stripe.Customer>;
export declare const attachPaymentMethod: (paymentMethodId: string, customerId: string) => Promise<Stripe.PaymentMethod>;
export declare const setDefaultPaymentMethod: (customerId: string, paymentMethodId: string) => Promise<Stripe.Customer>;
//# sourceMappingURL=payments.adapter.d.ts.map