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
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleAccountUpdated,
} from '@packages/db'
import { verifyWebhookSignature } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import 'dotenv/config'

// ========================================
// Payment Routes
// Handles Stripe payments, Connect, and webhooks
// ========================================

interface AuthenticatedRequest extends FastifyRequest {
  user?: { id: string; role: string }
}

export const paymentRoutes = async (app: FastifyInstance) => {
  
  // ========================================
  // POST /payments/create-intent
  // Create payment intent for an order
  // ========================================
  app.post('/payments/create-intent', {
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

  // ========================================
  // POST /webhooks/stripe
  // Stripe webhook handler (NO AUTH - verified by signature)
  // ========================================
  app.post('/webhooks/stripe', {
    config: {
      rawBody: true, // We need raw body for signature verification
    },
    schema: {
      tags: ['Webhooks'],
      summary: 'Stripe webhook',
      description: 'Handles Stripe webhook events (payment_intent, account updates)',
    },
  }, async (req, reply) => {
    try {
      const signature = req.headers['stripe-signature'] as string
      
      if (!signature) {
        return reply.code(400).send({ error: 'Missing stripe-signature header' })
      }

      // Get raw body (Fastify should provide this with rawBody: true)
      const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody || Buffer.from(JSON.stringify(req.body))
      
      // Verify webhook signature
      const event = verifyWebhookSignature(rawBody, signature)

      req.log.info({
        event: 'stripe_webhook_received',
        type: event.type,
        eventId: event.id,
      }, 'Stripe webhook received')

      // Check if we've already processed this event (idempotency)
      const { prisma } = await import('@packages/db')
      const existing = await prisma.paymentWebhook.findUnique({
        where: { eventId: event.id },
      })

      if (existing?.processed) {
        req.log.info({ eventId: event.id }, 'Webhook already processed, skipping')
        return reply.code(200).send({ received: true, processed: false })
      }

      // Store webhook event
      await prisma.paymentWebhook.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          provider: 'stripe',
          type: event.type,
          payload: JSON.parse(JSON.stringify(event.data.object)),
          processed: false,
        },
        update: {},
      })

      // Process event based on type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object.id)
          break
          
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object.id)
          break
          
        case 'account.updated':
          await handleAccountUpdated(event.data.object.id)
          break
          
        default:
          req.log.info({ type: event.type }, 'Unhandled webhook event type')
      }

      // Mark as processed
      await prisma.paymentWebhook.update({
        where: { eventId: event.id },
        data: { processed: true },
      })

      return reply.code(200).send({ received: true, processed: true })
    } catch (error) {
      if (error instanceof Error) {
        req.log.error({ error: error.message }, 'Webhook processing failed')
        
        // Return 200 to prevent Stripe from retrying on signature errors
        if (error.message.includes('signature')) {
          return reply.code(400).send({ error: 'Invalid signature' })
        }
      }
      
      // Return 500 for other errors so Stripe will retry
      return reply.code(500).send({ error: 'Webhook processing failed' })
    }
  })
}

