/**
 * Checkout Routes
 *
 * Checkout sessions are persisted as Cart + CartItem rows. Completing checkout
 * creates an Order, runs Stripe via processOrderPayment, then marks the cart SUBMITTED.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from 'decimal.js'
import { createIdempotencyMiddleware } from '../api/checkout/idempotency'
import { prisma, processOrderPayment } from '@packages/db'
import { OrderDomain } from '@packages/domain'
import { authenticate } from '../middleware/auth.js'

// ========================================
// Validation Schemas
// ========================================

const checkoutItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  specialInstructions: z.string().optional(),
})

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'At least one item is required'),
  deliveryType: z.enum(['PICKUP', 'DELIVERY'], {
    errorMap: () => ({ message: 'Delivery type must be PICKUP or DELIVERY' }),
  }),
  deliveryAddress: z
    .object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(5, 'Valid ZIP code is required'),
      instructions: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.object({
    type: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET']),
    token: z.string().min(1, 'Payment token is required'),
  }),
  /** Tip in dollars (absolute), not a percentage */
  tipAmount: z.number().min(0, 'Tip amount cannot be negative').optional(),
  promoCode: z.string().optional(),
})

const completeCheckoutSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  paymentMethod: checkoutSchema.shape.paymentMethod,
  tipAmount: z.number().min(0).optional().default(0),
  promoCode: z.string().optional(),
})

// ========================================
// Config (aligned with domain defaults; store commission overrides platform fee)
// ========================================

const TAX_RATE = 0.0825
const DEFAULT_DELIVERY_FEE = 3.99
/** Platform fee when store has no commissionRate (percent points, e.g. 3 = 3%) */
const PLATFORM_FEE_PERCENT = 3
const SESSION_TTL_MS = 60 * 60 * 1000 // 1 hour

const orderDomain = new OrderDomain({
  taxRate: TAX_RATE,
  defaultDeliveryFee: DEFAULT_DELIVERY_FEE,
  platformFeePercent: PLATFORM_FEE_PERCENT,
})

type SessionMeta = {
  deliveryType: 'DELIVERY' | 'PICKUP'
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    instructions?: string
  } | null
}

async function fetchAndValidateItems(items: { itemId: string; quantity: number }[]) {
  const dbItems = await Promise.all(
    items.map(async ({ itemId }) => {
      const item = await prisma.item.findUnique({ where: { id: itemId } })
      if (!item) throw new Error(`Item ${itemId} not found`)
      if (!item.isActive || item.isSoldOut) throw new Error(`Item "${item.title}" is not available`)
      return item
    }),
  )

  const storeIds = [...new Set(dbItems.map((i) => i.storeId))]
  if (storeIds.length > 1) throw new Error('All items must be from the same store')

  const storeId = storeIds[0]
  if (!storeId) throw new Error('Could not determine store from items')

  return { dbItems, storeId }
}

function decimalToPrisma(d: Decimal) {
  return new Decimal(d.toFixed(2))
}

// ========================================
// Routes Registration
// ========================================

export default async function checkoutRoutes(fastify: FastifyInstance) {
  const idempotencyMiddleware = createIdempotencyMiddleware({
    ttl: 24 * 60 * 60,
    keyHeader: 'X-Idempotency-Key',
    responseHeader: 'X-Idempotency-Response',
  })

  fastify.addHook('preHandler', idempotencyMiddleware)

  // ========================================
  // Create Checkout Session (persisted as Cart + CartItem)
  // ========================================

  fastify.post(
    '/checkout/session',
    {
      preHandler: [authenticate],
      schema: {
        body: checkoutSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              total: { type: 'number' },
              estimatedDelivery: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const checkoutData = checkoutSchema.parse(request.body)
        const userId = request.user!.id

        if (checkoutData.deliveryType === 'DELIVERY' && !checkoutData.deliveryAddress) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Delivery address is required for delivery orders',
            details: [],
          })
        }

        const { dbItems, storeId } = await fetchAndValidateItems(checkoutData.items)

        const meta: SessionMeta = {
          deliveryType: checkoutData.deliveryType,
          deliveryAddress: checkoutData.deliveryAddress ?? null,
        }

        const cart = await prisma.cart.create({
          data: {
            userId,
            storeId,
            status: 'ACTIVE',
            note: JSON.stringify(meta),
            items: {
              create: checkoutData.items.map((oi, i) => ({
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
          checkoutData.deliveryType,
          checkoutData.tipAmount ?? 0,
        )

        return reply.status(200).send({
          sessionId: cart.id,
          total: totals.total.toNumber(),
          estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid checkout data',
            details: error.errors,
          })
        }
        if (error instanceof Error) {
          request.log.warn({ err: error }, 'Checkout session rejected')
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
            details: [],
          })
        }
        request.log.error(error, 'Checkout session error')
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create checkout session',
        })
      }
    },
  )

  // ========================================
  // Complete Checkout (Order + Stripe PaymentIntent)
  // ========================================

  fastify.post(
    '/checkout/complete',
    {
      preHandler: [authenticate],
      schema: {
        body: completeCheckoutSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              order: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  total: { type: 'number' },
                  createdAt: { type: 'string' },
                },
              },
              paymentId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let createdOrderId: string | undefined

      try {
        const { sessionId, paymentMethod, tipAmount, promoCode: _promoCode } = completeCheckoutSchema.parse(request.body)
        const userId = request.user!.id

        const cart = await prisma.cart.findUnique({
          where: { id: sessionId },
          select: {
            userId: true,
            storeId: true,
            status: true,
            note: true,
            createdAt: true,
            order: { select: { id: true } },
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

        if (!cart) {
          return reply.status(404).send({ error: 'Checkout session not found or expired' })
        }
        if (cart.userId !== userId) {
          return reply.status(403).send({ error: 'Forbidden' })
        }
        if (cart.order) {
          return reply.status(409).send({ error: 'Order already created for this session' })
        }
        if (Date.now() - cart.createdAt.getTime() > SESSION_TTL_MS) {
          return reply.status(410).send({ error: 'Checkout session has expired' })
        }

        const meta = JSON.parse(cart.note ?? '{}') as SessionMeta
        const deliveryType = meta.deliveryType ?? 'PICKUP'

        const totals = await orderDomain.calculateOrderTotals(sessionId, userId, deliveryType, tipAmount)

        const order = await prisma.order.create({
          data: {
            userId,
            storeId: cart.storeId,
            cartId: sessionId,
            status: 'PENDING_PAYMENT',
            deliveryType,
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

        createdOrderId = order.id

        const paymentResult = await processOrderPayment({
          orderId: order.id,
          userId,
          paymentMethodId: paymentMethod.token,
        })

        await prisma.cart.update({
          where: { id: sessionId },
          data: { status: 'SUBMITTED' },
        })

        return reply.status(200).send({
          order: {
            id: order.id,
            status: order.status,
            total: totals.total.toNumber(),
            createdAt: order.createdAt.toISOString(),
          },
          paymentId: paymentResult.paymentIntentId,
        })
      } catch (error) {
        if (createdOrderId) {
          await prisma.order.delete({ where: { id: createdOrderId } }).catch(() => {
            /* best-effort cleanup */
          })
        }

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid checkout data',
            details: error.errors,
          })
        }
        if (error instanceof Error) {
          const msg = error.message
          if (msg.includes('not found') || msg.includes('Unauthorized')) {
            return reply.status(404).send({ error: msg })
          }
          if (msg.includes('already paid')) {
            return reply.status(400).send({ error: msg })
          }
          request.log.warn({ err: error }, 'Checkout completion rejected')
          return reply.status(400).send({ error: msg })
        }

        request.log.error(error, 'Checkout completion error')
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to complete checkout',
        })
      }
    },
  )

  // ========================================
  // Get Checkout Status (real Order from DB)
  // ========================================

  const statusParamsSchema = z.object({
    sessionId: z.string().uuid('Invalid session ID'),
  })

  fastify.get(
    '/checkout/status/:sessionId',
    {
      preHandler: [authenticate],
      schema: {
        params: statusParamsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              cartStatus: { type: 'string' },
              checkoutStatus: { type: 'string' },
              status: { type: 'string' },
              order: {
                type: ['object', 'null'],
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  paymentStatus: { type: 'string' },
                  deliveryType: { type: 'string' },
                  subtotal: { type: 'number' },
                  fees: { type: 'number' },
                  tax: { type: 'number' },
                  tip: { type: 'number' },
                  total: { type: 'number' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              createdAt: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = statusParamsSchema.parse(request.params)
        const userId = request.user!.id

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

        if (!cart) {
          return reply.status(404).send({ error: 'Checkout session not found' })
        }
        if (cart.userId !== userId) {
          return reply.status(403).send({ error: 'Forbidden' })
        }

        const orderRow = cart.order
        const checkoutStatus = orderRow
          ? orderRow.paymentStatus === 'PAID' || orderRow.status === 'PLACED'
            ? 'completed'
            : 'awaiting_payment'
          : 'pending'

        return reply.status(200).send({
          sessionId,
          cartStatus: cart.status,
          checkoutStatus,
          status: checkoutStatus,
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
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid session ID',
            details: error.errors,
          })
        }
        request.log.error(error, 'Checkout status error')
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get checkout status',
        })
      }
    },
  )
}
