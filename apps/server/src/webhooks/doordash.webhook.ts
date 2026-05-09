import type { FastifyInstance, FastifyRequest } from 'fastify'
import crypto from 'node:crypto'
import { applyDeliveryProviderWebhookEvent, prisma } from '@packages/db'

type RequestWithRaw = FastifyRequest & { rawBody?: Buffer }

/** Maps DoorDash Drive webhook names to values understood by `doordashDriveMockAdapter.mapWebhookEvent`. */
function toAdapterEventType(doorDashType: string): string {
  switch (doorDashType) {
    case 'picked_up':
    case 'delivered':
    case 'canceled':
    case 'failed':
      return doorDashType
    case 'pickup_ready':
    case 'dasher_on_the_way':
    case 'dasher_arrived_at_pickup':
    case 'dasher_arrived_at_dropoff':
      return 'picked_up'
    default:
      return doorDashType
  }
}

export interface DoorDashWebhookEvent {
  readonly event_id: string
  readonly event_type: string
  readonly delivery_external_id: string
  readonly timestamp: string
  readonly data?: {
    readonly dasher?: {
      readonly name: string
      readonly phone: string
      readonly location?: { readonly lat: number; readonly lng: number; readonly updated_at?: string }
      readonly vehicle_description?: string
    }
    readonly dropoff?: {
      readonly eta?: string
      readonly estimated_time?: number
    }
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

    app.post('/webhooks/doordash', async (req, reply) => {
      const secret = process.env.DOORDASH_WEBHOOK_SECRET
      if (!secret) {
        return reply.code(500).send({ error: 'DOORDASH_WEBHOOK_SECRET is not configured' })
      }

      const signature = req.headers['x-doordash-signature']
      const rawBody = (req as RequestWithRaw).rawBody
      if (typeof signature !== 'string' || !rawBody?.length) {
        return reply.code(400).send({ error: 'Missing signature or body' })
      }

      const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      if (signature !== expectedSignature) {
        return reply.code(401).send({ error: 'Invalid signature' })
      }

      const event = req.body as DoorDashWebhookEvent
      if (!event?.delivery_external_id || !event.event_type) {
        return reply.code(400).send({ error: 'Invalid webhook payload' })
      }

      const deliveryJob = await prisma.deliveryJob.findFirst({
        where: {
          providerExternalId: event.delivery_external_id,
          provider: 'DOORDASH_DRIVE',
        },
        select: { id: true },
      })

      if (!deliveryJob) {
        req.log.warn({ externalId: event.delivery_external_id }, 'DoorDash webhook: no matching DeliveryJob')
        return reply.code(200).send({ message: 'No delivery job for external id' })
      }

      const internalEventType = toAdapterEventType(event.event_type)

      await applyDeliveryProviderWebhookEvent({
        deliveryJobId: deliveryJob.id,
        eventType: internalEventType,
        payload: event,
      })

      return reply.code(200).send({
        message: 'Webhook processed',
        event_id: event.event_id,
        mapped_event_type: internalEventType,
      })
    })
  })
}
