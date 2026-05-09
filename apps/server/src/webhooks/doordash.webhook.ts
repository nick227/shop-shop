import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { applyDeliveryProviderWebhookEvent, prisma } from '@packages/db'
import { env } from '../env.js'
import type { DoordashWebhookAuthConfig } from './doordash-webhook-auth.js'
import { verifyDoordashWebhookRequest } from './doordash-webhook-auth.js'
import {
  doorDashEventToAdapterType,
  normalizeDoorDashWebhookPayload,
} from './doordash-webhook-payload.js'

type RequestWithRaw = FastifyRequest & { rawBody?: Buffer }

function buildDoordashWebhookAuth(): DoordashWebhookAuthConfig {
  const raw = env.DOORDASH_WEBHOOK_AUTH_MODE
  const mode: DoordashWebhookAuthConfig['mode'] =
    raw === 'basic' || raw === 'hmac' ? raw : 'none'
  return {
    mode,
    basicUser: env.DOORDASH_WEBHOOK_BASIC_USER,
    basicPassword: env.DOORDASH_WEBHOOK_BASIC_PASSWORD,
    hmacSecret: env.DOORDASH_WEBHOOK_SECRET,
    signatureHeaderLower: (env.DOORDASH_WEBHOOK_SIGNATURE_HEADER ?? 'x-doordash-signature').toLowerCase(),
  }
}

export async function doordashWebhookRoutes(parent: FastifyInstance) {
  await parent.register(async (app) => {
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
      },
    )

    const webhookAuth = buildDoordashWebhookAuth()

    app.post('/webhooks/doordash', async (req, reply) => {
      const { rawBody } = req as RequestWithRaw

      if (!verifyDoordashWebhookRequest(req, reply, webhookAuth, rawBody)) {
        return
      }

      const normalized = normalizeDoorDashWebhookPayload(req.body)
      if (!normalized) {
        return reply.code(400).send({
          error: 'Invalid webhook payload',
          detail: 'Expected external_delivery_id (or alias) and event_name / event_type',
        })
      }

      const deliveryJob = await prisma.deliveryJob.findFirst({
        where: {
          providerExternalId: normalized.externalDeliveryId,
          provider: 'DOORDASH_DRIVE',
        },
        select: { id: true },
      })

      if (!deliveryJob) {
        req.log.warn(
          { externalId: normalized.externalDeliveryId },
          'DoorDash webhook: no matching DeliveryJob',
        )
        return reply.code(200).send({ message: 'No delivery job for external id' })
      }

      const adapterEventType = doorDashEventToAdapterType(normalized.eventName)

      await applyDeliveryProviderWebhookEvent({
        deliveryJobId: deliveryJob.id,
        eventType: adapterEventType,
        payload: normalized.raw,
      })

      return reply.code(200).send({
        message: 'Webhook processed',
        event_id: normalized.eventId,
        mapped_event_type: adapterEventType,
      })
    })
  })
}
