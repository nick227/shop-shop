import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  CreatePaymentIntentInputSchema,
  CreateConnectAccountInputSchema,
  type CreatePaymentIntentInput,
  type CreateConnectAccountInput,
} from '@packages/schemas'
import {
  processOrderPayment,
  initiateStripeConnect,
  checkStripeConnectStatus,
  refundOrder,
} from '@packages/db'
import { authenticate, type AuthenticatedUser } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { rateLimits } from '../constants/rateLimits.js'
import 'dotenv/config'

// ========================================
// Payment Routes
// Handles Stripe payments and Connect (webhooks: stripe-webhook.route.ts)
// ========================================

interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser
}

export const paymentRoutes = async (app: FastifyInstance) => {
  
  // ========================================
  // POST /payments/create-intent
  // Create payment intent for an order
  // ========================================
  app.post('/payments/create-intent', {
    config: {
      rateLimit: rateLimits.paymentCreateIntent,
    },
    preHandler: [authenticate],
    schema: {
      tags: ['Payments'],
      summary: 'Create payment intent for order',
      description: 'Creates a Stripe payment intent to process order payment',
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      const input = CreatePaymentIntentInputSchema.parse(req.body) as CreatePaymentIntentInput
      
      const result = await processOrderPayment({
        orderId: input.orderId,
        userId: req.user!.id,
        paymentMethodId: input.paymentMethodId,
      })

      req.log.info({
        event: 'payment_intent_created',
        userId: req.user!.id,
        orderId: input.orderId,
        amount: result.amount,
      }, 'Payment intent created')

      return reply.code(200).send(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
        if (error.message.includes('already paid')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // ========================================
  // POST /payments/connect
  // Initiate Stripe Connect for vendor
  // ========================================
  app.post('/payments/connect', {
    config: {
      rateLimit: rateLimits.paymentConnect,
    },
    preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can set up payments for their store
    schema: {
      tags: ['Payments'],
      summary: 'Initiate Stripe Connect onboarding',
      description: 'Creates Stripe Connect account and returns onboarding URL',
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      const input = CreateConnectAccountInputSchema.parse(req.body) as CreateConnectAccountInput
      
      const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3005}`
      
      const result = await initiateStripeConnect({
        storeId: input.storeId,
        userId: req.user!.id,
        businessType: input.businessType,
        returnUrl: `${baseUrl}/vendor/connect/success`,
        refreshUrl: `${baseUrl}/vendor/connect/refresh`,
      })

      req.log.info({
        event: 'stripe_connect_initiated',
        userId: req.user!.id,
        storeId: input.storeId,
        accountId: result.accountId,
      }, 'Stripe Connect initiated')

      return reply.code(200).send(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // ========================================
  // GET /payments/connect/:storeId/status
  // Check Stripe Connect status
  // ========================================
  app.get('/payments/connect/:storeId/status', {
    config: {
      rateLimit: rateLimits.paymentConnectStatus,
    },
    preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can check payment status for their store
    schema: {
      tags: ['Payments'],
      summary: 'Check Stripe Connect status',
      description: 'Returns current status of Stripe Connect account',
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      const { storeId } = req.params as { storeId: string }
      
      const status = await checkStripeConnectStatus(storeId, req.user!.id)

      return reply.code(200).send(status)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // ========================================
  // POST /payments/refund
  // Issue refund for an order
  // ========================================
  app.post('/payments/refund', {
    config: {
      rateLimit: rateLimits.paymentRefund,
    },
    preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can refund orders from their store
    schema: {
      tags: ['Payments'],
      summary: 'Refund an order',
      description: 'Issues a full or partial refund for a paid order',
    },
  }, async (req: AuthenticatedRequest, reply) => {
    try {
      const { orderId, amount } = req.body as { orderId: string; amount?: number }
      const Decimal = (await import('@packages/db')).Decimal
      
      const result = await refundOrder({
        orderId,
        userId: req.user!.id,
        amount: amount ? new Decimal(amount) : undefined,
      })

      req.log.info({
        event: 'refund_issued',
        userId: req.user!.id,
        orderId,
        refundId: result.refundId,
        amount: result.amount,
      }, 'Refund issued')

      return reply.code(200).send(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
          return reply.code(404).send({ error: error.message })
        }
        if (error.message.includes('not paid')) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })
}

