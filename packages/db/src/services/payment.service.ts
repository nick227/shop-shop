import { prisma } from '../client.js'
import { Decimal } from 'decimal.js'
import {
  createPaymentIntent as stripeCreatePaymentIntent,
  retrievePaymentIntent as stripeRetrievePaymentIntent,
  createConnectAccount as stripeCreateConnectAccount,
  createAccountLink as stripeCreateAccountLink,
  retrieveAccount as stripeRetrieveAccount,
  createRefund as stripeCreateRefund,
  type CreatePaymentIntentParams,
  type CreateConnectAccountParams,
  type CreateAccountLinkParams,
} from '../adapters/payments.adapter.js'
import { orderService } from './order.service.js'
import { publishOrderCreated } from './order-realtime.publisher.js'

// ========================================
// Payment Service
// Business logic for payment processing
// ========================================

export interface ProcessOrderPaymentInput {
  orderId: string
  userId: string
  paymentMethodId?: string
}

export interface ProcessOrderPaymentResult {
  paymentIntentId: string
  clientSecret: string
  amount: number
  status: string
}

export const processOrderPayment = async (
  input: ProcessOrderPaymentInput
): Promise<ProcessOrderPaymentResult> => {
  // Fetch order with store info
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      store: true,
      user: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.userId !== input.userId) {
    throw new Error('Unauthorized: Order does not belong to user')
  }

  if (order.paymentStatus === 'PAID') {
    throw new Error('Order already paid')
  }

  // Idempotency: return existing PaymentIntent if one was already created
  if (order.stripePaymentIntentId) {
    const existing = await stripeRetrievePaymentIntent(order.stripePaymentIntentId)
    if (existing.status !== 'canceled') {
      console.log(
        JSON.stringify({
          event: 'payment.intent.reused',
          orderId: order.id,
          paymentIntentId: existing.id,
          status: existing.status,
          timestamp: new Date().toISOString(),
        }),
      )
      return {
        paymentIntentId: existing.id,
        clientSecret: existing.client_secret!,
        amount: existing.amount,
        status: existing.status,
      }
    }
    // Existing PI was canceled — fall through to create a fresh one
  }

  // Prepare payment intent parameters
  const params: CreatePaymentIntentParams = {
    amount: order.total,
    orderId: order.id,
    paymentMethodId: input.paymentMethodId,
  }

  // Add connected account for marketplace (if store has Stripe account)
  if (order.store.stripeAccountId && order.store.stripeOnboarded) {
    params.connectedAccountId = order.store.stripeAccountId
    params.applicationFeeAmount = order.serviceFeeAmount
  }

  // Create payment intent
  const result = await stripeCreatePaymentIntent(params)

  // Update order with payment intent ID
  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripePaymentIntentId: result.paymentIntentId,
    },
  })

  return result
}

// ========================================
// Stripe Connect Operations
// ========================================

export interface InitiateStripeConnectInput {
  storeId: string
  userId: string
  businessType?: 'individual' | 'company'
  returnUrl: string
  refreshUrl: string
}

export interface InitiateStripeConnectResult {
  accountId: string
  onboardingUrl: string
}

export const initiateStripeConnect = async (
  input: InitiateStripeConnectInput
): Promise<InitiateStripeConnectResult> => {
  // Verify store ownership
  const store = await prisma.store.findUnique({
    where: { id: input.storeId },
    include: { owner: true },
  })

  if (!store) {
    throw new Error('Store not found')
  }

  if (store.ownerUserId !== input.userId) {
    throw new Error('Unauthorized: Store does not belong to user')
  }

  if (store.stripeAccountId) {
    // Account already exists, just create new onboarding link
    const linkResult = await stripeCreateAccountLink({
      accountId: store.stripeAccountId,
      returnUrl: input.returnUrl,
      refreshUrl: input.refreshUrl,
    })

    return {
      accountId: store.stripeAccountId,
      onboardingUrl: linkResult.url,
    }
  }

  // Create new Stripe Connect account
  const accountParams: CreateConnectAccountParams = {
    email: store.owner.email,
    businessType: input.businessType || 'individual',
  }

  const accountResult = await stripeCreateConnectAccount(accountParams)

  // Save account ID to store
  await prisma.store.update({
    where: { id: store.id },
    data: {
      stripeAccountId: accountResult.accountId,
      stripeOnboarded: false, // Not onboarded until webhook confirms
    },
  })

  // Create onboarding link
  const linkParams: CreateAccountLinkParams = {
    accountId: accountResult.accountId,
    returnUrl: input.returnUrl,
    refreshUrl: input.refreshUrl,
  }

  const linkResult = await stripeCreateAccountLink(linkParams)

  return {
    accountId: accountResult.accountId,
    onboardingUrl: linkResult.url,
  }
}

export const checkStripeConnectStatus = async (
  storeId: string,
  userId: string
) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  })

  if (!store) {
    throw new Error('Store not found')
  }

  if (store.ownerUserId !== userId) {
    throw new Error('Unauthorized: Store does not belong to user')
  }

  if (!store.stripeAccountId) {
    return {
      connected: false,
      onboarded: false,
    }
  }

  const account = await stripeRetrieveAccount(store.stripeAccountId)

  return {
    connected: true,
    onboarded: account.details_submitted || false,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    requirements: {
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      pastDue: account.requirements?.past_due || [],
    },
  }
}

// ========================================
// Refund Operations
// ========================================

export interface RefundOrderInput {
  orderId: string
  userId: string
  amount?: Decimal
  reason?: string
}

export const refundOrder = async (input: RefundOrderInput) => {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { store: true },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  // Only vendor or admin can refund
  if (order.store.ownerUserId !== input.userId) {
    throw new Error('Unauthorized: Only store owner can issue refunds')
  }

  if (order.paymentStatus !== 'PAID') {
    throw new Error('Order not paid, cannot refund')
  }

  if (!order.stripePaymentIntentId) {
    throw new Error('No payment intent found for order')
  }

  // Create refund in Stripe
  const refund = await stripeCreateRefund(
    order.stripePaymentIntentId,
    input.amount
  )

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'REFUNDED',
      stripeRefundId: refund.id,
    },
  })

  return {
    refundId: refund.id,
    amount: refund.amount,
    status: refund.status,
  }
}

// ========================================
// Webhook Processing
// ========================================

export const handlePaymentIntentSucceeded = async (paymentIntentId: string) => {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true, status: true, paymentStatus: true },
  })

  if (!order) {
    console.warn(
      JSON.stringify({
        event: 'payment.intent.succeeded.no_order',
        paymentIntentId,
        timestamp: new Date().toISOString(),
      }),
    )
    return
  }

  console.log(
    JSON.stringify({
      event: 'payment.intent.succeeded',
      orderId: order.id,
      paymentIntentId,
      previousPaymentStatus: order.paymentStatus,
      timestamp: new Date().toISOString(),
    }),
  )

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'PAID' },
  })

  // Transition PENDING_PAYMENT → PLACED now that payment is confirmed
  if (order.status === 'PENDING_PAYMENT') {
    await orderService.transitionOrderStatus({
      orderId: order.id,
      newStatus: 'PLACED',
      note: 'Payment confirmed',
      changedBy: 'stripe',
    })
    // Broadcast the new order to vendor/customer (order is now live)
    await publishOrderCreated(order.id).catch((err) => {
      console.error('[Payment] publishOrderCreated failed:', err)
    })
  }
}

export const handlePaymentIntentFailed = async (paymentIntentId: string) => {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true, status: true },
  })

  if (!order) {
    console.warn(
      JSON.stringify({
        event: 'payment.intent.failed.no_order',
        paymentIntentId,
        timestamp: new Date().toISOString(),
      }),
    )
    return
  }

  console.log(
    JSON.stringify({
      event: 'payment.intent.failed',
      orderId: order.id,
      paymentIntentId,
      orderStatus: order.status,
      timestamp: new Date().toISOString(),
    }),
  )

  // Record the payment failure in the audit trail without changing order status
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      status: order.status as any,
      note: `Payment failed (PI: ${paymentIntentId})`,
    },
  })
}

export const handleAccountUpdated = async (accountId: string) => {
  const store = await prisma.store.findFirst({
    where: { stripeAccountId: accountId },
  })

  if (!store) {
    console.warn(`Store not found for account: ${accountId}`)
    return
  }

  const account = await stripeRetrieveAccount(accountId)

  await prisma.store.update({
    where: { id: store.id },
    data: {
      stripeOnboarded: account.details_submitted || false,
    },
  })
}

