import Stripe from 'stripe'
import { Decimal } from 'decimal.js'

// ========================================
// Stripe Payments Adapter
// Handles all Stripe SDK operations
// ========================================

let stripeInstance: Stripe | null = null

/** A real secret or restricted key, not empty and not a `your_…` placeholder. */
export const isStripeKeyConfigured = (key: string | undefined = process.env.STRIPE_SECRET_KEY): boolean =>
  /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(key ?? '')

/** Tests substitute a recording client; pass null to go back to the real one. */
export const setStripeClientForTesting = (client: unknown) => {
  stripeInstance = client as Stripe | null
}

/** The platform's Stripe client (also used for Stripe Tax calculations). */
export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!isStripeKeyConfigured(apiKey)) {
      throw new Error('STRIPE_SECRET_KEY is not configured (expected sk_test_… or sk_live_…)')
    }
    stripeInstance = new Stripe(apiKey as string, {
      apiVersion: '2024-11-20.acacia' as any, // Type mismatch with Stripe SDK version
      typescript: true,
    })
  }
  return stripeInstance
}

/** Dollars to whole cents, never a fractional cent. */
const toCents = (amount: Decimal): number => amount.times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()

// ========================================
// Types
// ========================================

export interface CreatePaymentIntentParams {
  amount: Decimal
  currency?: string
  orderId: string
  customerId?: string
  paymentMethodId?: string
  connectedAccountId?: string
  applicationFeeAmount?: Decimal
  /** Stripe idempotency key for PaymentIntent create (retries, disconnect safety). */
  idempotencyKey?: string
}

export interface CreatePaymentIntentResult {
  paymentIntentId: string
  clientSecret: string
  status: string
  amount: number
}

export interface CreateTransferParams {
  amount: Decimal
  destination: string
  sourceTransaction: string
  orderId: string
}

export interface CreateTransferResult {
  transferId: string
  amount: number
  status: string
}

export interface CreateConnectAccountParams {
  email: string
  businessType: 'individual' | 'company'
  country?: string
}

export interface CreateConnectAccountResult {
  accountId: string
}

export interface CreateAccountLinkParams {
  accountId: string
  refreshUrl: string
  returnUrl: string
}

export interface CreateAccountLinkResult {
  url: string
}

// ========================================
// Payment Intent Operations
// ========================================

export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<CreatePaymentIntentResult> => {
  const stripe = getStripe()
  
  // Convert Decimal to cents (integer)
  const amountInCents = toCents(params.amount)
  
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: amountInCents,
    currency: params.currency || 'usd',
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    metadata: {
      orderId: params.orderId,
    },
  }

  // Add customer if provided
  if (params.customerId) {
    paymentIntentParams.customer = params.customerId
  }

  // Add payment method if provided
  if (params.paymentMethodId) {
    paymentIntentParams.payment_method = params.paymentMethodId
    paymentIntentParams.confirm = true
  }

  // Connect destination charges — transfer_data whenever we route to a connected account;
  // application fee is optional (omit when zero).
  if (params.connectedAccountId) {
    paymentIntentParams.transfer_data = {
      destination: params.connectedAccountId,
    }
    if (params.applicationFeeAmount && params.applicationFeeAmount.gt(0)) {
      paymentIntentParams.application_fee_amount = toCents(params.applicationFeeAmount)
    }
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, {
    ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
  })

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
  }
}

/** Confirms an existing PaymentIntent with a (possibly new) payment method — a retry after a decline. */
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<CreatePaymentIntentResult> => {
  const stripe = getStripe()
  const intent = await stripe.paymentIntents.confirm(paymentIntentId, { payment_method: paymentMethodId })
  return { paymentIntentId: intent.id, clientSecret: intent.client_secret!, status: intent.status, amount: intent.amount }
}

/** A shopper-facing card problem (declined, expired, wrong CVC) and the PaymentIntent it left behind. */
export const cardFailure = (error: unknown): { message: string; paymentIntentId: string | null } | null => {
  const e = error as { type?: string; message?: string; raw?: { payment_intent?: { id?: string } }; payment_intent?: { id?: string } }
  if (e?.type !== 'StripeCardError') return null
  return { message: e.message ?? 'Your card was declined.', paymentIntentId: e.payment_intent?.id ?? e.raw?.payment_intent?.id ?? null }
}

export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripe()
  return stripe.paymentIntents.retrieve(paymentIntentId)
}

export const cancelPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripe()
  return stripe.paymentIntents.cancel(paymentIntentId)
}

// ========================================
// Refund Operations
// ========================================

/**
 * Refunds a payment. For a Connect destination charge the vendor's transfer is reversed with it, so the
 * platform is not left paying the shopper back alone; a full refund also returns the platform's fee.
 */
export const createRefund = async (
  paymentIntentId: string,
  amount?: Decimal,
  idempotencyKey?: string
): Promise<Stripe.Refund> => {
  const stripe = getStripe()

  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount) {
    refundParams.amount = toCents(amount)
  }

  if (paymentIntentId.startsWith('pi_')) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (intent.transfer_data?.destination) {
      refundParams.reverse_transfer = true
      const full = refundParams.amount === undefined || refundParams.amount >= intent.amount
      if (full && intent.application_fee_amount) refundParams.refund_application_fee = true
    }
  }

  return stripe.refunds.create(refundParams, idempotencyKey ? { idempotencyKey } : undefined)
}

// ========================================
// Transfer Operations (for marketplace payouts)
// ========================================

export interface CreateAffiliateTransferParams {
  /** Amount in integer cents to transfer. */
  amountCents: number
  /** Stripe Connect account ID of the affiliate (acct_xxx). */
  destinationAccountId: string
  /** AffiliatePayout.id — used in metadata and as idempotency key basis. */
  payoutId: string
  /** Full idempotency key for the Stripe request. */
  idempotencyKey: string
}

/**
 * Transfer from the platform's available Stripe balance to an affiliate's
 * Stripe Connect account. No source_transaction needed — draws from platform balance.
 */
export const createAffiliateTransfer = async (
  params: CreateAffiliateTransferParams
): Promise<{ transferId: string }> => {
  const stripe = getStripe()
  const transfer = await stripe.transfers.create(
    {
      amount: params.amountCents,
      currency: 'usd',
      destination: params.destinationAccountId,
      metadata: { payoutId: params.payoutId },
    },
    { idempotencyKey: params.idempotencyKey }
  )
  return { transferId: transfer.id }
}

export const createTransfer = async (
  params: CreateTransferParams
): Promise<CreateTransferResult> => {
  const stripe = getStripe()
  
  const amountInCents = toCents(params.amount)
  
  const transfer = await stripe.transfers.create({
    amount: amountInCents,
    currency: 'usd',
    destination: params.destination,
    source_transaction: params.sourceTransaction,
    metadata: {
      orderId: params.orderId,
    },
  })

  return {
    transferId: transfer.id,
    amount: transfer.amount,
    status: 'succeeded', // Transfers are immediate
  }
}

// ========================================
// Stripe Connect Operations
// ========================================

export const createConnectAccount = async (
  params: CreateConnectAccountParams
): Promise<CreateConnectAccountResult> => {
  const stripe = getStripe()

  const account = await stripe.accounts.create({
    type: 'express',
    country: params.country || 'US',
    email: params.email,
    business_type: params.businessType,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  return {
    accountId: account.id,
  }
}

/**
 * Create a Stripe Express account for an affiliate who only needs to receive
 * transfers (no card_payments capability required).
 */
export const createAffiliateConnectAccount = async (params: {
  email: string
  country?: string
}): Promise<{ accountId: string }> => {
  const stripe = getStripe()
  const account = await stripe.accounts.create({
    type: 'express',
    country: params.country ?? 'US',
    email: params.email,
    capabilities: {
      transfers: { requested: true },
    },
  })
  return { accountId: account.id }
}

export const createAccountLink = async (
  params: CreateAccountLinkParams
): Promise<CreateAccountLinkResult> => {
  const stripe = getStripe()
  
  const accountLink = await stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: 'account_onboarding',
  })

  return {
    url: accountLink.url,
  }
}

export const retrieveAccount = async (accountId: string): Promise<Stripe.Account> => {
  const stripe = getStripe()
  return stripe.accounts.retrieve(accountId)
}

/** Express / Connect dashboard — vendor manages payouts and bank details. */
export const createExpressLoginLink = async (accountId: string): Promise<{ url: string }> => {
  const stripe = getStripe()
  const link = await stripe.accounts.createLoginLink(accountId)
  return { url: link.url }
}

// ========================================
// Webhook Operations
// ========================================

export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): Stripe.Event => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
  }
  return constructWebhookEvent(payload, signature, webhookSecret)
}

// ========================================
// Customer Operations
// ========================================

export const createCustomer = async (
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> => {
  const stripe = getStripe()
  
  return stripe.customers.create({
    email,
    name,
    metadata,
  })
}

export const attachPaymentMethod = async (
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> => {
  const stripe = getStripe()
  
  return stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  })
}

export const setDefaultPaymentMethod = async (
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> => {
  const stripe = getStripe()
  
  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  })
}

export const retrieveOrderRefund = (id: string) => getStripe().refunds.retrieve(id)
