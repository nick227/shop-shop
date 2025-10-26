import type { FastifyInstance } from 'fastify'
import {
  CreateTipInputSchema,
  ProcessTipInputSchema,
  type CreateTipInput,
  type ProcessTipInput,
} from '@packages/schemas'
import {
  createTip,
  processTip,
  getTip,
  refundTip,
} from '@packages/db'

export const tipRoutes = async (app: FastifyInstance) => {
  // POST /tips - Create tip for completed order
  app.post('/tips', async (req, reply) => {
    try {
      const input = CreateTipInputSchema.parse(req.body) as CreateTipInput
      const userId = req.user?.id

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const tip = await createTip({
        orderId: input.orderId,
        amount: input.amount,
        userId,
      })

      return reply.status(201).send(tip)
    } catch (error) {
      app.log.error({ err: error }, 'Create tip error')
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message })
        }
        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({ error: error.message })
        }
        if (error.message.includes('must be completed') || error.message.includes('already exists')) {
          return reply.status(400).send({ error: error.message })
        }
      }
      
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /tips/:tipId/process - Process tip payment
  app.post('/tips/:tipId/process', async (req, reply) => {
    try {
      const { tipId } = req.params as { tipId: string }
      const input = ProcessTipInputSchema.parse(req.body) as ProcessTipInput
      const userId = req.user?.id

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const tip = await processTip({
        tipId,
        paymentMethodId: input.paymentMethodId,
        userId,
      })

      return reply.status(200).send(tip)
    } catch (error) {
      app.log.error({ err: error }, 'Process tip error')
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message })
        }
        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({ error: error.message })
        }
        if (error.message.includes('not in pending status') || error.message.includes('payment failed')) {
          return reply.status(400).send({ error: error.message })
        }
      }
      
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // GET /tips/:tipId - Get tip details
  app.get('/tips/:tipId', async (req, reply) => {
    try {
      const { tipId } = req.params as { tipId: string }
      const userId = req.user?.id

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const tip = await getTip(tipId, userId)

      return reply.status(200).send(tip)
    } catch (error) {
      app.log.error({ err: error }, 'Get tip error')
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message })
        }
        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({ error: error.message })
        }
      }
      
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /tips/:tipId/refund - Refund tip
  app.post('/tips/:tipId/refund', async (req, reply) => {
    try {
      const { tipId } = req.params as { tipId: string }
      const userId = req.user?.id

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const tip = await refundTip(tipId, userId)

      return reply.status(200).send(tip)
    } catch (error) {
      app.log.error({ err: error }, 'Refund tip error')
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message })
        }
        if (error.message.includes('Unauthorized')) {
          return reply.status(403).send({ error: error.message })
        }
        if (error.message.includes('must be paid') || error.message.includes('refund failed')) {
          return reply.status(400).send({ error: error.message })
        }
      }
      
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  app.log.info('[Tip] Routes registered')
}
