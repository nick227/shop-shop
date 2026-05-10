import Stripe from 'stripe';
// ========================================
// Stripe Payments Adapter
// Handles all Stripe SDK operations
// ========================================
let stripeInstance = null;
const getStripe = () => {
    if (!stripeInstance) {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        stripeInstance = new Stripe(apiKey, {
            apiVersion: '2024-11-20.acacia', // Type mismatch with Stripe SDK version
            typescript: true,
        });
    }
    return stripeInstance;
};
// ========================================
// Payment Intent Operations
// ========================================
export const createPaymentIntent = async (params) => {
    const stripe = getStripe();
    // Convert Decimal to cents (integer)
    const amountInCents = params.amount.times(100).toNumber();
    const paymentIntentParams = {
        amount: amountInCents,
        currency: params.currency || 'usd',
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
        },
        metadata: {
            orderId: params.orderId,
        },
    };
    // Add customer if provided
    if (params.customerId) {
        paymentIntentParams.customer = params.customerId;
    }
    // Add payment method if provided
    if (params.paymentMethodId) {
        paymentIntentParams.payment_method = params.paymentMethodId;
        paymentIntentParams.confirm = true;
    }
    // Connect destination charges — transfer_data whenever we route to a connected account;
    // application fee is optional (omit when zero).
    if (params.connectedAccountId) {
        paymentIntentParams.transfer_data = {
            destination: params.connectedAccountId,
        };
        if (params.applicationFeeAmount && params.applicationFeeAmount.gt(0)) {
            paymentIntentParams.application_fee_amount = params.applicationFeeAmount.times(100).toNumber();
        }
    }
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, {
        ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
    });
    return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
    };
};
export const retrievePaymentIntent = async (paymentIntentId) => {
    const stripe = getStripe();
    return stripe.paymentIntents.retrieve(paymentIntentId);
};
export const cancelPaymentIntent = async (paymentIntentId) => {
    const stripe = getStripe();
    return stripe.paymentIntents.cancel(paymentIntentId);
};
// ========================================
// Refund Operations
// ========================================
export const createRefund = async (paymentIntentId, amount) => {
    const stripe = getStripe();
    const refundParams = {
        payment_intent: paymentIntentId,
    };
    if (amount) {
        refundParams.amount = amount.times(100).toNumber();
    }
    return stripe.refunds.create(refundParams);
};
// ========================================
// Transfer Operations (for marketplace payouts)
// ========================================
export const createTransfer = async (params) => {
    const stripe = getStripe();
    const amountInCents = params.amount.times(100).toNumber();
    const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'usd',
        destination: params.destination,
        source_transaction: params.sourceTransaction,
        metadata: {
            orderId: params.orderId,
        },
    });
    return {
        transferId: transfer.id,
        amount: transfer.amount,
        status: 'succeeded', // Transfers are immediate
    };
};
// ========================================
// Stripe Connect Operations
// ========================================
export const createConnectAccount = async (params) => {
    const stripe = getStripe();
    const account = await stripe.accounts.create({
        type: 'express',
        country: params.country || 'US',
        email: params.email,
        business_type: params.businessType,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
    });
    return {
        accountId: account.id,
    };
};
export const createAccountLink = async (params) => {
    const stripe = getStripe();
    const accountLink = await stripe.accountLinks.create({
        account: params.accountId,
        refresh_url: params.refreshUrl,
        return_url: params.returnUrl,
        type: 'account_onboarding',
    });
    return {
        url: accountLink.url,
    };
};
export const retrieveAccount = async (accountId) => {
    const stripe = getStripe();
    return stripe.accounts.retrieve(accountId);
};
/** Express / Connect dashboard — vendor manages payouts and bank details. */
export const createExpressLoginLink = async (accountId) => {
    const stripe = getStripe();
    const link = await stripe.accounts.createLoginLink(accountId);
    return { url: link.url };
};
// ========================================
// Webhook Operations
// ========================================
export const constructWebhookEvent = (payload, signature, secret) => {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(payload, signature, secret);
};
export const verifyWebhookSignature = (payload, signature) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }
    return constructWebhookEvent(payload, signature, webhookSecret);
};
// ========================================
// Customer Operations
// ========================================
export const createCustomer = async (email, name, metadata) => {
    const stripe = getStripe();
    return stripe.customers.create({
        email,
        name,
        metadata,
    });
};
export const attachPaymentMethod = async (paymentMethodId, customerId) => {
    const stripe = getStripe();
    return stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
    });
};
export const setDefaultPaymentMethod = async (customerId, paymentMethodId) => {
    const stripe = getStripe();
    return stripe.customers.update(customerId, {
        invoice_settings: {
            default_payment_method: paymentMethodId,
        },
    });
};
