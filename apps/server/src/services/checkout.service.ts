import { Decimal } from 'decimal.js'
import { prisma, processOrderPayment } from '@packages/db'
import { OrderDomain } from '@packages/domain'
import { AppError } from '../middleware/errors.js'

const TAX_RATE = 0.0825
const DEFAULT_DELIVERY_FEE = 3.99
const PLATFORM_FEE_PERCENT = 3
const SESSION_TTL_MS = 60 * 60 * 1000

const orderDomain = new OrderDomain({
  taxRate: TAX_RATE,
  defaultDeliveryFee: DEFAULT_DELIVERY_FEE,
  platformFeePercent: PLATFORM_FEE_PERCENT,
})

function decimalToPrisma(d: Decimal) {
  return new Decimal(d.toFixed(2))
}

type DeliveryAddress = {
  street: string
  city: string
  state: string
  zipCode: string
  instructions?: string
}

type SessionMeta = {
  deliveryType: 'DELIVERY' | 'PICKUP'
  deliveryMode: 'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'
  deliveryAddress?: DeliveryAddress | null
}

async function fetchAndValidateItems(items: { itemId: string; quantity: number }[]) {
  const dbItems = await Promise.all(
    items.map(async ({ itemId }) => {
      const item = await prisma.item.findUnique({ where: { id: itemId } })
      if (!item) throw new AppError(400, `Item ${itemId} not found`)
      if (!item.isActive || item.isSoldOut) throw new AppError(400, `Item "${item.title}" is not available`)
      return item
    }),
  )

  const storeIds = [...new Set(dbItems.map((i) => i.storeId))]
  if (storeIds.length > 1) throw new AppError(400, 'All items must be from the same store')

  const storeId = storeIds[0]
  if (!storeId) throw new AppError(400, 'Could not determine store from items')

  return { dbItems, storeId }
}

export type CreateSessionInput = {
  items: { itemId: string; quantity: number; specialInstructions?: string }[]
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryMode: 'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'
  deliveryAddress?: DeliveryAddress
  paymentMethod: { type: string; token: string }
  tipAmount?: number
  promoCode?: string
}

export type CompleteCheckoutInput = {
  sessionId: string
  paymentMethod: { type: string; token: string }
  tipAmount: number
  promoCode?: string
}

export async function createCheckoutSession(userId: string, input: CreateSessionInput) {
  if (input.deliveryType === 'DELIVERY' && !input.deliveryAddress) {
    throw new AppError(400, 'Delivery address is required for delivery orders')
  }

  const { dbItems, storeId } = await fetchAndValidateItems(input.items)

  const meta: SessionMeta = {
    deliveryType: input.deliveryType,
    deliveryMode: input.deliveryMode,
    deliveryAddress: input.deliveryAddress ?? null,
  }

  const cart = await prisma.cart.create({
    data: {
      userId,
      storeId,
      status: 'ACTIVE',
      note: JSON.stringify(meta),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      items: {
        create: input.items.map((oi, i) => ({
          itemId: oi.itemId,
          quantity: oi.quantity,
          unitPrice: dbItems[i]!.price,
          titleSnapshot: dbItems[i]!.title,
          notes: oi.specialInstructions,
        })),
      },
    },
    select: { id: true },
  })

  const totals = await orderDomain.calculateOrderTotals(
    cart.id,
    userId,
    input.deliveryType,
    input.tipAmount ?? 0,
  )

  return {
    sessionId: cart.id,
    total: totals.total.toNumber(),
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  }
}

export async function completeCheckout(userId: string | undefined, input: CompleteCheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { id: input.sessionId },
    select: {
      userId: true,
      storeId: true,
      status: true,
      note: true,
      expiresAt: true,
      order: { select: { id: true, paymentStatus: true } },
      items: {
        select: {
          itemId: true,
          quantity: true,
          unitPrice: true,
          titleSnapshot: true,
          optionsJson: true,
          notes: true,
        },
      },
    },
  })

  if (!cart) throw new AppError(404, 'Checkout session not found or expired')
  if (userId && cart.userId !== userId) throw new AppError(403, 'Forbidden')
  const checkoutUserId = userId ?? cart.userId
  if (cart.order) {
    if (cart.order.paymentStatus === 'PAID') throw new AppError(409, 'This order has already been paid')
    throw new AppError(409, 'Order already created for this session')
  }
  if (!cart.expiresAt || new Date() > cart.expiresAt) throw new AppError(410, 'Checkout session has expired')

  const meta = JSON.parse(cart.note ?? '{}') as SessionMeta
  const deliveryType = meta.deliveryType ?? 'PICKUP'
  const deliveryMode = meta.deliveryMode ?? 'PICKUP'
  const totals = await orderDomain.calculateOrderTotals(
    input.sessionId,
    checkoutUserId,
    deliveryType,
    input.tipAmount,
  )

  // Phase 1 — atomic: order row + cart state change together.
  // Cart is SUBMITTED only when the order record exists, preventing double-orders.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: checkoutUserId,
        storeId: cart.storeId,
        cartId: input.sessionId,
        status: 'PENDING_PAYMENT',
        deliveryType,
        deliveryMode,
        subtotal: decimalToPrisma(totals.subtotal),
        fees: decimalToPrisma(totals.fees),
        tax: decimalToPrisma(totals.tax),
        tip: decimalToPrisma(totals.tip),
        total: decimalToPrisma(totals.total),
        serviceFeePercent: decimalToPrisma(totals.serviceFeePercent),
        serviceFeeAmount: decimalToPrisma(totals.serviceFeeAmount),
        netToVendor: decimalToPrisma(totals.netToVendor),
        paymentStatus: 'UNPAID',
        addressSnapshot:
          deliveryType === 'DELIVERY' && meta.deliveryAddress
            ? (meta.deliveryAddress as object)
            : undefined,
        items: {
          create: cart.items.map((ci) => ({
            itemId: ci.itemId,
            quantity: ci.quantity,
            unitPrice: ci.unitPrice,
            titleSnapshot: ci.titleSnapshot,
            ...(ci.optionsJson != null ? { optionsJson: ci.optionsJson } : {}),
            ...(ci.notes != null && ci.notes !== '' ? { notes: ci.notes } : {}),
          })),
        },
      },
      select: { id: true, status: true, createdAt: true },
    })

    await tx.cart.update({
      where: { id: input.sessionId },
      data: { status: 'SUBMITTED' },
    })

    return created
  })

  // Phase 2 — external: Stripe call outside the DB transaction so the
  // connection is not held open during a network round-trip.
  let paymentResult
  try {
    paymentResult = await processOrderPayment({
      orderId: order.id,
      userId: checkoutUserId,
      paymentMethodId: input.paymentMethod.token,
    })
  } catch (paymentError) {
    const err = paymentError instanceof Error ? paymentError : new Error(String(paymentError))
    console.error({ orderId: order.id, err: { message: err.message, name: err.name } }, 'payment failed')
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'UNPAID' },
    }).catch(() => {})
    throw err
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'PAID' },
  })

  return {
    order: {
      id: order.id,
      status: order.status,
      total: totals.total.toNumber(),
      createdAt: order.createdAt.toISOString(),
    },
    paymentId: paymentResult.paymentIntentId,
  }
}

export async function getCheckoutStatus(userId: string | undefined, sessionId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      createdAt: true,
      status: true,
      order: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          deliveryType: true,
          subtotal: true,
          fees: true,
          tax: true,
          tip: true,
          total: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!cart) throw new AppError(404, 'Checkout session not found')
  if (userId && cart.userId !== userId) throw new AppError(403, 'Forbidden')

  const orderRow = cart.order
  const status = orderRow
    ? orderRow.paymentStatus === 'PAID' || orderRow.status === 'PLACED'
      ? 'completed'
      : 'awaiting_payment'
    : 'pending'

  return {
    sessionId,
    cartStatus: cart.status,
    status,
    order: orderRow
      ? {
          id: orderRow.id,
          status: orderRow.status,
          paymentStatus: orderRow.paymentStatus,
          deliveryType: orderRow.deliveryType,
          subtotal: Number(orderRow.subtotal),
          fees: Number(orderRow.fees),
          tax: Number(orderRow.tax),
          tip: Number(orderRow.tip),
          total: Number(orderRow.total),
          createdAt: orderRow.createdAt.toISOString(),
          updatedAt: orderRow.updatedAt.toISOString(),
        }
      : null,
    createdAt: cart.createdAt.toISOString(),
  }
}
