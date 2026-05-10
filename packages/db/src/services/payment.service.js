import { prisma } from '../client.js';
import { createPaymentIntent as stripeCreatePaymentIntent, retrievePaymentIntent as stripeRetrievePaymentIntent, createConnectAccount as stripeCreateConnectAccount, createAccountLink as stripeCreateAccountLink, retrieveAccount as stripeRetrieveAccount, createRefund as stripeCreateRefund, createExpressLoginLink, } from '../adapters/payments.adapter.js';
import { orderService } from './order.service.js';
import { publishOrderCreated } from './order-realtime.publisher.js';
import { buildAffiliateCommissionCandidatesForOrder, upsertCommissionCandidate, } from './affiliate-commission.service.js';
function parseTeamPermissionsJson(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((p) => typeof p === 'string');
}
/** Owner, admin, or team member with finance scope (matches apps/server storeAccess finance). */
export async function assertUserCanManageStoreFinance(userId, storeId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (user?.role === 'ADMIN')
        return;
    const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { ownerUserId: true },
    });
    if (!store) {
        throw new Error('Store not found');
    }
    if (store.ownerUserId === userId)
        return;
    const member = await prisma.teamMember.findFirst({
        where: { storeId, userId, isActive: true },
        select: { permissionsJson: true },
    });
    if (!member) {
        throw new Error('Unauthorized: Store finance access required');
    }
    const perms = parseTeamPermissionsJson(member.permissionsJson);
    if (perms.includes('VIEW_FINANCE') || perms.includes('FULL_ACCESS'))
        return;
    throw new Error('Unauthorized: Store finance access required');
}
export function storeAcceptsOnlineCardPayments(store) {
    return Boolean(store.stripeAccountId && store.stripeOnboarded && store.stripeChargesEnabled);
}
export async function persistStripeAccountSnapshotOnStore(storeId, account) {
    await prisma.store.update({
        where: { id: storeId },
        data: {
            stripeOnboarded: account.details_submitted ?? false,
            stripeChargesEnabled: account.charges_enabled ?? false,
            stripePayoutsEnabled: account.payouts_enabled ?? false,
            stripeRequirementsJson: {
                currentlyDue: account.requirements?.currently_due ?? [],
                eventuallyDue: account.requirements?.eventually_due ?? [],
                pastDue: account.requirements?.past_due ?? [],
                disabledReason: account.requirements?.disabled_reason ?? null,
            },
            stripeLastSyncedAt: new Date(),
        },
    });
}
export const processOrderPayment = async (input) => {
    const pm = input.paymentMethodId?.trim();
    if (!pm || !pm.startsWith('pm_')) {
        throw new Error('INVALID_STRIPE_PAYMENT_METHOD');
    }
    if (pm === 'cod_test' || pm.startsWith('cod_')) {
        throw new Error('INVALID_STRIPE_PAYMENT_METHOD');
    }
    // Fetch order with store info
    const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
            store: true,
            user: true,
        },
    });
    if (!order) {
        throw new Error('Order not found');
    }
    if (order.userId !== input.userId) {
        throw new Error('Unauthorized: Order does not belong to user');
    }
    if (order.paymentStatus === 'PAID') {
        throw new Error('Order already paid');
    }
    if (!storeAcceptsOnlineCardPayments(order.store)) {
        throw new Error('STORE_CARD_PAYMENTS_UNAVAILABLE');
    }
    // Idempotency: return existing PaymentIntent if one was already created
    if (order.stripePaymentIntentId) {
        const existing = await stripeRetrievePaymentIntent(order.stripePaymentIntentId);
        if (existing.status !== 'canceled') {
            console.log(JSON.stringify({
                event: 'payment.intent.reused',
                orderId: order.id,
                paymentIntentId: existing.id,
                status: existing.status,
                timestamp: new Date().toISOString(),
            }));
            return {
                paymentIntentId: existing.id,
                clientSecret: existing.client_secret,
                amount: existing.amount,
                status: existing.status,
            };
        }
        // Existing PI was canceled — fall through to create a fresh one
    }
    // Prepare payment intent parameters — route to Connect account + platform fee (service dollars → cents once in adapter).
    const params = {
        amount: order.total,
        orderId: order.id,
        paymentMethodId: pm,
        connectedAccountId: order.store.stripeAccountId,
        applicationFeeAmount: order.serviceFeeAmount,
        idempotencyKey: `paymentintent-order-${order.id}`,
    };
    const result = await stripeCreatePaymentIntent(params);
    await prisma.order.update({
        where: { id: order.id },
        data: {
            stripePaymentIntentId: result.paymentIntentId,
        },
    });
    return result;
};
export const initiateStripeConnect = async (input) => {
    const store = await prisma.store.findUnique({
        where: { id: input.storeId },
        include: { owner: true },
    });
    if (!store) {
        throw new Error('Store not found');
    }
    await assertUserCanManageStoreFinance(input.userId, input.storeId);
    if (store.stripeAccountId) {
        // Account already exists, just create new onboarding link
        const linkResult = await stripeCreateAccountLink({
            accountId: store.stripeAccountId,
            returnUrl: input.returnUrl,
            refreshUrl: input.refreshUrl,
        });
        return {
            accountId: store.stripeAccountId,
            onboardingUrl: linkResult.url,
        };
    }
    // Create new Stripe Connect account
    const accountParams = {
        email: store.owner.email,
        businessType: input.businessType || 'individual',
    };
    const accountResult = await stripeCreateConnectAccount(accountParams);
    // Save account ID to store
    await prisma.store.update({
        where: { id: store.id },
        data: {
            stripeAccountId: accountResult.accountId,
            stripeOnboarded: false, // Not onboarded until webhook confirms
        },
    });
    // Create onboarding link
    const linkParams = {
        accountId: accountResult.accountId,
        returnUrl: input.returnUrl,
        refreshUrl: input.refreshUrl,
    };
    const linkResult = await stripeCreateAccountLink(linkParams);
    return {
        accountId: accountResult.accountId,
        onboardingUrl: linkResult.url,
    };
};
export const checkStripeConnectStatus = async (storeId, userId) => {
    const store = await prisma.store.findUnique({
        where: { id: storeId },
    });
    if (!store) {
        throw new Error('Store not found');
    }
    await assertUserCanManageStoreFinance(userId, storeId);
    if (!store.stripeAccountId) {
        return {
            connected: false,
            onboarded: false,
            chargesEnabled: false,
            payoutsEnabled: false,
        };
    }
    const account = await stripeRetrieveAccount(store.stripeAccountId);
    await persistStripeAccountSnapshotOnStore(store.id, account);
    let dashboardUrl;
    try {
        const dash = await createExpressLoginLink(store.stripeAccountId);
        dashboardUrl = dash.url;
    }
    catch {
        dashboardUrl = undefined;
    }
    return {
        connected: true,
        stripeAccountId: store.stripeAccountId,
        onboarded: Boolean(account.details_submitted),
        chargesEnabled: Boolean(account.charges_enabled),
        payoutsEnabled: Boolean(account.payouts_enabled),
        requirements: {
            currentlyDue: account.requirements?.currently_due ?? [],
            eventuallyDue: account.requirements?.eventually_due ?? [],
            pastDue: account.requirements?.past_due ?? [],
            disabledReason: account.requirements?.disabled_reason ?? null,
        },
        ...(dashboardUrl ? { dashboardUrl } : {}),
    };
};
export const refundOrder = async (input) => {
    const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: { store: true },
    });
    if (!order) {
        throw new Error('Order not found');
    }
    // Only vendor or admin can refund
    if (order.store.ownerUserId !== input.userId) {
        throw new Error('Unauthorized: Only store owner can issue refunds');
    }
    if (order.paymentStatus !== 'PAID') {
        throw new Error('Order not paid, cannot refund');
    }
    if (!order.stripePaymentIntentId) {
        throw new Error('No payment intent found for order');
    }
    // Create refund in Stripe
    const refund = await stripeCreateRefund(order.stripePaymentIntentId, input.amount);
    // Update order status
    await prisma.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: 'REFUNDED',
            stripeRefundId: refund.id,
        },
    });
    return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
    };
};
// ========================================
// Webhook Processing
// ========================================
/**
 * Build and persist V2 commission candidates for a paid order.
 * Errors are swallowed so a commission failure never breaks the payment webhook response.
 */
async function runV2Commissions(orderId) {
    try {
        const candidates = await buildAffiliateCommissionCandidatesForOrder(orderId);
        await Promise.all(candidates.map((c) => upsertCommissionCandidate(c)));
    }
    catch (err) {
        console.error('[Payment] Commission creation failed for order', orderId, err);
    }
}
export const handlePaymentIntentSucceeded = async (paymentIntentId) => {
    const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true, status: true, paymentStatus: true },
    });
    if (!order) {
        console.warn(JSON.stringify({
            event: 'payment.intent.succeeded.no_order',
            paymentIntentId,
            timestamp: new Date().toISOString(),
        }));
        return;
    }
    // Already fully processed — idempotent path: ensure commissions exist and bail.
    if (order.paymentStatus === 'PAID' && order.status === 'PLACED') {
        await runV2Commissions(order.id);
        return;
    }
    console.log(JSON.stringify({
        event: 'payment.intent.succeeded',
        orderId: order.id,
        paymentIntentId,
        previousPaymentStatus: order.paymentStatus,
        timestamp: new Date().toISOString(),
    }));
    await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID' },
    });
    // Transition PENDING_PAYMENT → PLACED now that payment is confirmed
    if (order.status === 'PENDING_PAYMENT') {
        await orderService.transitionOrderStatus({
            orderId: order.id,
            newStatus: 'PLACED',
            note: 'Payment confirmed',
            changedBy: 'stripe',
        });
        // Broadcast the new order to vendor/customer (order is now live)
        await publishOrderCreated(order.id).catch((err) => {
            console.error('[Payment] publishOrderCreated failed:', err);
        });
    }
    // Create affiliate commissions for this paid order (idempotent upsert).
    await runV2Commissions(order.id);
};
export const handlePaymentIntentFailed = async (paymentIntentId) => {
    const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true, status: true },
    });
    if (!order) {
        console.warn(JSON.stringify({
            event: 'payment.intent.failed.no_order',
            paymentIntentId,
            timestamp: new Date().toISOString(),
        }));
        return;
    }
    console.log(JSON.stringify({
        event: 'payment.intent.failed',
        orderId: order.id,
        paymentIntentId,
        orderStatus: order.status,
        timestamp: new Date().toISOString(),
    }));
    // Record the payment failure in the audit trail without changing order status
    await prisma.orderEvent.create({
        data: {
            orderId: order.id,
            status: order.status,
            note: `Payment failed (PI: ${paymentIntentId})`,
        },
    });
};
export const handleAccountUpdated = async (accountId) => {
    const store = await prisma.store.findFirst({
        where: { stripeAccountId: accountId },
    });
    if (!store) {
        console.warn(`Store not found for account: ${accountId}`);
        return;
    }
    const account = await stripeRetrieveAccount(accountId);
    await persistStripeAccountSnapshotOnStore(store.id, account);
};
