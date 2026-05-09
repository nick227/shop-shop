import type { FastifyInstance, FastifyRequest } from 'fastify'
import { applyDeliveryProviderWebhookEvent, prisma } from '@packages/db'
import { verifyDoordashWebhookRequest, buildDoordashWebhookAuthFromEnv } from './doordash-webhook-auth.js'
import {
  extractProcessedDoorDashEventIds,
  mergeDoorDashWebhookAudit,
} from './doordash-webhook-audit.js'
import {
  doorDashEventToAdapterType,
  normalizeDoorDashWebhookPayload,
} from './doordash-webhook-payload.js'

type RequestWithRaw = FastifyRequest & { rawBody?: Buffer }

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

    app.post('/webhooks/doordash', async (req, reply) => {
      const { rawBody } = req as RequestWithRaw
      const webhookAuth = buildDoordashWebhookAuthFromEnv()

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

      const deliveryRow = await prisma.deliveryJob.findFirst({
        where: {
          providerExternalId: normalized.externalDeliveryId,
          provider: 'DOORDASH_DRIVE',
        },
        select: { id: true, providerPayload: true },
      })

      if (!deliveryRow) {
        req.log.warn(
          { externalId: normalized.externalDeliveryId },
          'DoorDash webhook: no matching DeliveryJob',
        )
        return reply.code(200).send({ message: 'No delivery job for external id' })
      }

      if (normalized.eventId) {
        const seen = extractProcessedDoorDashEventIds(deliveryRow.providerPayload)
        if (seen.has(normalized.eventId)) {
          return reply.code(200).send({
            duplicate: true,
            event_id: normalized.eventId,
            message: 'Event already processed',
          })
        }
      }

      const adapterEventType = doorDashEventToAdapterType(normalized.eventName)

      const { deliveryJob } = await applyDeliveryProviderWebhookEvent({
        deliveryJobId: deliveryRow.id,
        eventType: adapterEventType,
        payload: normalized.raw,
      })

      const mergedPayload = mergeDoorDashWebhookAudit(
        deliveryJob.providerPayload,
        normalized.eventId,
        normalized.raw,
      )

      await prisma.deliveryJob.update({
        where: { id: deliveryJob.id },
        data: { providerPayload: mergedPayload },
      })

      return reply.code(200).send({
        message: 'Webhook processed',
        event_id: normalized.eventId,
        mapped_event_type: adapterEventType,
      })
    })
  })
}
