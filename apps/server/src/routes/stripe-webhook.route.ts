/**
 * Stripe webhooks — isolated Fastify context so application/json uses raw Buffer
 * for signature verification (same bytes Stripe POSTed; JSON re-stringify breaks HMAC).
 */

import type { FastifyInstance, FastifyRequest } from 'fastify'
import { Prisma } from '@packages/db/generated/client'
import {
  verifyWebhookSignature,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleAccountUpdated,
} from '@packages/db'

type RequestWithRaw = FastifyRequest & { rawBody?: Buffer }

function isPrismaUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function stripeWebhookRoutes(app: FastifyInstance) {
  app.removeAllContentTypeParsers()
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req: FastifyRequest, body: Buffer, done) => {
      ;(req as RequestWithRaw).rawBody = body
      try {
        const json: unknown = JSON.parse(body.toString('utf8'))
        done(null, json)
      } catch (err) {
        done(err as Error, undefined)
      }
    }
  )

  app.post(
    '/webhooks/stripe',
    {
      schema: {
        tags: ['Webhooks'],
        summary: 'Stripe webhook',
        description: 'Handles Stripe webhook events (payment_intent, account updates)',
      },
    },
    async (req, reply) => {
      try {
        const signature = req.headers['stripe-signature'] as string | undefined

        if (!signature) {
          return reply.code(400).send({ error: 'Missing stripe-signature header' })
        }

        const rawBody = (req as RequestWithRaw).rawBody
        if (!rawBody?.length) {
          return reply.code(400).send({ error: 'Missing raw body' })
        }

        const event = verifyWebhookSignature(rawBody, signature)

        req.log.info(
          {
            event: 'stripe_webhook_received',
            type: event.type,
            eventId: event.id,
          },
          'Stripe webhook received'
        )

        const { prisma } = await import('@packages/db')
        const payloadObject = JSON.parse(JSON.stringify(event.data.object)) as object

        const existing = await prisma.paymentWebhook.findUnique({
          where: { eventId: event.id },
        })

        if (existing?.processed) {
          req.log.info({ eventId: event.id }, 'Webhook already processed, skipping')
          return reply.code(200).send({ received: true, processed: false })
        }

        try {
          await prisma.paymentWebhook.create({
            data: {
              eventId: event.id,
              provider: 'stripe',
              type: event.type,
              payload: payloadObject,
              processed: false,
            },
          })
        } catch (error) {
          if (!isPrismaUniqueViolation(error)) {
            throw error
          }
          for (let i = 0; i < 50; i++) {
            await sleep(100)
            const row = await prisma.paymentWebhook.findUnique({
              where: { eventId: event.id },
            })
            if (row?.processed) {
              req.log.info({ eventId: event.id }, 'Webhook completed by concurrent handler')
              return reply.code(200).send({ received: true, processed: false })
            }
          }
          req.log.error({ eventId: event.id }, 'PaymentWebhook still unprocessed after duplicate delivery')
          return reply.code(500).send({ error: 'Webhook incomplete; will retry' })
        }

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

        await prisma.paymentWebhook.update({
          where: { eventId: event.id },
          data: { processed: true },
        })

        return reply.code(200).send({ received: true, processed: true })
      } catch (error) {
        if (error instanceof Error) {
          req.log.error({ error: error.message }, 'Webhook processing failed')

          if (error.message.includes('signature')) {
            return reply.code(400).send({ error: 'Invalid signature' })
          }
        }

        return reply.code(500).send({ error: 'Webhook processing failed' })
      }
    }
  )

  app.log.info('[Stripe] Webhook route registered at POST /webhooks/stripe (raw body parser)')
}
