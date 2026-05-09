import { FastifyInstance } from 'fastify'
import { CheckoutDeliveryValidationService } from '../services/checkoutDeliveryValidation.service'

export async function checkoutDeliveryValidationRoute(fastify: FastifyInstance) {
  const validationService = new CheckoutDeliveryValidationService()

  fastify.post('/checkout/delivery-validation', {
    schema: {
      body: {
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
            canProceed: { type: 'boolean' },
            reason: { type: 'string' },
            alternativeOptions: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { storeId } = request.body as { storeId: string }
      const validation = await validationService.validateDeliveryCheckout(storeId)
      
      return reply.send(validation)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
