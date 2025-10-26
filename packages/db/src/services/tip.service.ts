import { prisma } from '../client.js'
import { Decimal } from 'decimal.js'
import {
  createPaymentIntent as stripeCreatePaymentIntent,
  createRefund as stripeCreateRefund,
  type CreatePaymentIntentParams,
} from '../adapters/payments.adapter.js'

// WebSocket notification function (set by server)
let broadcastTipEvent: ((topic: string, event: any) => void) | null = null

export const setTipServiceBroadcast = (fn: (topic: string, event: any) => void) => {
  broadcastTipEvent = fn
}

// ========================================
// Tip Service
// Business logic for tip processing
// ========================================

export interface CreateTipInput {
  orderId: string
  amount: number
  userId: string
}

export interface ProcessTipInput {
  tipId: string
  paymentMethodId: string
  userId: string
}

export interface TipResult {
  id: string
  orderId: string
  amount: number
  status: string
  stripePaymentIntentId?: string
  clientSecret?: string
}

export const createTip = async (input: CreateTipInput): Promise<TipResult> => {
  // Verify order exists and is completed
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

  if (order.status !== 'COMPLETED') {
    throw new Error('Order must be completed to add a tip')
  }

  // Check if tip already exists for this order
  const existingTip = await prisma.tip.findFirst({
    where: { orderId: input.orderId },
  })

  if (existingTip) {
    throw new Error('Tip already exists for this order')
  }

  // Validate tip amount
  const tipAmount = new Decimal(input.amount)
  if (tipAmount.lte(0)) {
    throw new Error('Tip amount must be positive')
  }

  if (tipAmount.gt(1000)) {
    throw new Error('Tip amount cannot exceed $1000')
  }

  // Create tip record
  const tip = await prisma.tip.create({
    data: {
      orderId: input.orderId,
      amount: tipAmount,
      status: 'PENDING',
    },
  })

  return {
    id: tip.id,
    orderId: tip.orderId,
    amount: tip.amount.toNumber(),
    status: tip.status,
  }
}

export const processTip = async (input: ProcessTipInput): Promise<TipResult> => {
  // Fetch tip with order and store info
  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    include: {
      order: {
        include: {
          store: true,
          user: true,
        },
      },
    },
  })

  if (!tip) {
    throw new Error('Tip not found')
  }

  if (tip.order.userId !== input.userId) {
    throw new Error('Unauthorized: Tip does not belong to user')
  }

  if (tip.status !== 'PENDING') {
    throw new Error('Tip is not in pending status')
  }

  try {
    // Calculate service fee based on store's commission rate
    const storeCommissionRate = tip.order.store.commissionRate || new Decimal(2.9) // Default 2.9% if not set
    const serviceFeeAmount = tip.amount.mul(storeCommissionRate).div(100)
    const netToVendor = tip.amount.sub(serviceFeeAmount)

    // Create Stripe payment intent
    const paymentIntentParams: CreatePaymentIntentParams = {
      amount: new Decimal(Math.round(tip.amount.toNumber() * 100)), // Convert to cents
      currency: 'usd',
      orderId: tip.orderId,
      paymentMethodId: input.paymentMethodId,
      applicationFeeAmount: new Decimal(Math.round(serviceFeeAmount.toNumber() * 100)),
      connectedAccountId: tip.order.store.stripeAccountId!,
    } as any // Metadata not in type definition but may be needed

    const paymentIntent = await stripeCreatePaymentIntent(paymentIntentParams)

    // Update tip with Stripe details
    const updatedTip = await prisma.tip.update({
      where: { id: tip.id },
      data: {
        status: 'PAID',
        stripePaymentIntentId: (paymentIntent as any).id,
        stripeChargeId: (paymentIntent as any).latest_charge as string,
        stripeTransferId: (paymentIntent as any).transfer_data?.destination,
        stripeApplicationFeeId: (paymentIntent as any).application_fee_amount ? 'fee_' + (paymentIntent as any).id : null,
      },
    })

    // Create order event for tip received
    await prisma.orderEvent.create({
      data: {
        orderId: tip.orderId,
        status: 'COMPLETED', // Keep order status as completed
        note: `Tip received: $${tip.amount.toFixed(2)} (Commission: ${storeCommissionRate.toFixed(2)}%, Fee: $${serviceFeeAmount.toFixed(2)})`,
      },
    })

    // Send WebSocket notification to vendor
    if (broadcastTipEvent) {
      const vendorTopic = `vendor:${tip.order.storeId}`
      broadcastTipEvent(vendorTopic, {
        type: 'tip:received',
        timestamp: new Date().toISOString(),
        payload: {
          tipId: updatedTip.id,
          orderId: tip.orderId,
          amount: tip.amount.toNumber(),
          serviceFeeAmount: serviceFeeAmount.toNumber(),
          netToVendor: netToVendor.toNumber(),
          commissionRate: storeCommissionRate.toNumber(),
          customerName: tip.order.user.name || 'Customer',
          orderNumber: tip.orderId.slice(-8), // Last 8 chars of order ID
        },
      })
    }

    return {
      id: updatedTip.id,
      orderId: updatedTip.orderId,
      amount: updatedTip.amount.toNumber(),
      status: updatedTip.status,
      stripePaymentIntentId: updatedTip.stripePaymentIntentId!,
    }
  } catch (error) {
    // Update tip status to failed
    await prisma.tip.update({
      where: { id: tip.id },
      data: { status: 'FAILED' },
    })

    throw new Error(`Tip payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const getTip = async (tipId: string, userId: string): Promise<TipResult> => {
  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: {
      order: true,
    },
  })

  if (!tip) {
    throw new Error('Tip not found')
  }

  if (tip.order.userId !== userId) {
    throw new Error('Unauthorized: Tip does not belong to user')
  }

  return {
    id: tip.id,
    orderId: tip.orderId,
    amount: tip.amount.toNumber(),
    status: tip.status,
    stripePaymentIntentId: tip.stripePaymentIntentId || undefined,
  }
}

export const refundTip = async (tipId: string, userId: string): Promise<TipResult> => {
  const tip = await prisma.tip.findUnique({
    where: { id: tipId },
    include: {
      order: true,
    },
  })

  if (!tip) {
    throw new Error('Tip not found')
  }

  if (tip.order.userId !== userId) {
    throw new Error('Unauthorized: Tip does not belong to user')
  }

  if (tip.status !== 'PAID') {
    throw new Error('Tip must be paid to refund')
  }

  if (!tip.stripeChargeId) {
    throw new Error('No charge ID found for tip')
  }

  try {
    // Create Stripe refund
    const refund = await stripeCreateRefund(tip.stripeChargeId)

    // Update tip status
    const updatedTip = await prisma.tip.update({
      where: { id: tip.id },
      data: {
        status: 'REFUNDED',
        // stripeRefundId: (refund as any).id, // Field not in Prisma schema - needs migration
      },
    })

    return {
      id: updatedTip.id,
      orderId: updatedTip.orderId,
      amount: updatedTip.amount.toNumber(),
      status: updatedTip.status,
      stripePaymentIntentId: updatedTip.stripePaymentIntentId || undefined,
    }
  } catch (error) {
    throw new Error(`Tip refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
