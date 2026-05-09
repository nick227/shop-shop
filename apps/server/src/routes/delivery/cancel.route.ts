import type { FastifyInstance } from 'fastify'
import { cancelDeliveryJob } from '@packages/db'

export const deliveryCancelRoutes = async (app: FastifyInstance) => {
  app.post('/api/delivery-jobs/:id/cancel', {
    schema: {
      body: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string' },
        },
      },
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    try {
      const { id } = req.params as { id: string }
      const { reason } = req.body as { reason: string }

      const updated = await cancelDeliveryJob({ deliveryJobId: id, reason })

      return reply.code(200).send({
        success: true,
        deliveryJobId: updated.id,
        status: updated.status,
        providerStatus: updated.providerStatus,
        reason,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message === 'DeliveryJob not found') {
        return reply.code(404).send({ error: message })
      }
      if (message.includes('cannot be canceled')) {
        return reply.code(400).send({ error: message })
      }
      console.error('Cancel delivery job error:', error)
      return reply.code(500).send({
        error: 'Internal server error',
        message,
      })
    }
  })
}
