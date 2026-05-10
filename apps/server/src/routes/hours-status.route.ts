import { FastifyInstance } from 'fastify'
import { HoursStatusService } from '../services/hoursStatus.service.js'
import { checkoutDeliveryValidationRoute } from './checkoutDeliveryValidation.route.js'

export async function hoursStatusRoute(fastify: FastifyInstance) {
  const hoursStatusService = new HoursStatusService()

  fastify.get('/stores/:storeId/hours-status', {
    schema: {
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', format: 'uuid' }
        },
        required: ['storeId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isStoreOpen: { type: 'boolean' },
            isDeliveryAvailable: { type: 'boolean' },
            reason: { type: 'string' },
            nextDeliveryOpenAt: { type: 'string', format: 'date-time' },
            nextDeliveryCloseAt: { type: 'string', format: 'date-time' },
            timezone: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { storeId } = request.params as { storeId: string }
      const status = await hoursStatusService.getStoreHoursStatus(storeId)
      
      return reply.send(status)
    } catch (error) {
      fastify.log.error(error)
      
      if (error instanceof Error && error.message === 'Store not found') {
        return reply.status(404).send({ error: 'Store not found' })
      }
      
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
