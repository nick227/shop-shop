import Stripe from 'stripe'
import { Decimal } from 'decimal.js'

// ========================================
// Stripe Payments Adapter
// Handles all Stripe SDK operations
// ========================================

let stripeInstance: Stripe | null = null

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia' as any, // Type mismatch with Stripe SDK version
      typescript: true,
    })
  }
  return stripeInstance
}

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
  const amountInCents = params.amount.times(100).toNumber()
  
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: amountInCents,
    currency: params.currency || 'usd',
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

  // Add connected account (for marketplace)
  if (params.connectedAccountId && params.applicationFeeAmount) {
    paymentIntentParams.application_fee_amount = params.applicationFeeAmount.times(100).toNumber()
    paymentIntentParams.transfer_data = {
      destination: params.connectedAccountId,
    }
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
  }
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

export const createRefund = async (
  paymentIntentId: string,
  amount?: Decimal
): Promise<Stripe.Refund> => {
  const stripe = getStripe()
  
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount) {
    refundParams.amount = amount.times(100).toNumber()
  }

  return stripe.refunds.create(refundParams)
}

// ========================================
// Transfer Operations (for marketplace payouts)
// ========================================

export const createTransfer = async (
  params: CreateTransferParams
): Promise<CreateTransferResult> => {
  const stripe = getStripe()
  
  const amountInCents = params.amount.times(100).toNumber()
  
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

