import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'

export const deliveryStatusRoutes = async (app: FastifyInstance) => {
  app.get('/api/delivery-jobs/:id', {
    schema: {
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

      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
              store: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      return reply.code(200).send({
        id: deliveryJob.id,
        orderId: deliveryJob.orderId,
        storeId: deliveryJob.storeId,
        provider: deliveryJob.provider,
        jobStatus: deliveryJob.status,
        orderStatus: deliveryJob.order.status,
        deliveryType: deliveryJob.order.deliveryType,
        providerStatus: deliveryJob.providerStatus,
        trackingUrl: deliveryJob.trackingUrl,
        providerExternalId: deliveryJob.providerExternalId,
        providerPayload: deliveryJob.providerPayload,
        canceledAt: deliveryJob.canceledAt,
        completedAt: deliveryJob.completedAt,
        order: {
          id: deliveryJob.order.id,
          status: deliveryJob.order.status,
          user: deliveryJob.order.user,
          store: deliveryJob.order.store,
        },
      })
    } catch (error) {
      console.error('Delivery status error:', error)
      return reply.code(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}
