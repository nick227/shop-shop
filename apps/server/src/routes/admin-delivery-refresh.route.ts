import type { FastifyInstance } from 'fastify'
import { prisma, type Prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'

/**
 * Admin "refresh" endpoint for delivery jobs.
 *
 * The current DeliveryProviderAdapter interface has no getDeliveryStatus method,
 * so this endpoint simply records a manual-refresh audit event and returns the
 * latest local state. The frontend treats the response as the source of truth
 * for re-rendering after a refresh click.
 */
export const adminDeliveryRefreshRoutes = async (app: FastifyInstance) => {
  app.post(
    '/api/admin/delivery/jobs/:deliveryJobId/refresh',
    { preHandler: authenticate },
    async (req, reply) => {
      const { deliveryJobId } = req.params as { deliveryJobId: string }

      if (req.user?.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJobId },
        include: {
          order: { select: { id: true, status: true, storeId: true } },
        },
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      await prisma.deliveryProviderEvent.create({
        data: {
          deliveryJobId: deliveryJob.id,
          provider: deliveryJob.provider,
          eventId: `manual_refresh_${deliveryJobId}_${Date.now()}`,
          eventType: 'status_refresh_requested',
          timestamp: new Date(),
          payload: {
            requestedBy: req.user.id,
            currentStatus: deliveryJob.status,
            currentProviderStatus: deliveryJob.providerStatus,
          } as Prisma.InputJsonValue,
          processed: true,
        },
      })

      return reply.code(200).send({
        success: true,
        deliveryJobId: deliveryJob.id,
        status: deliveryJob.status,
        providerStatus: deliveryJob.providerStatus,
        refreshedAt: new Date().toISOString(),
      })
    },
  )
}
