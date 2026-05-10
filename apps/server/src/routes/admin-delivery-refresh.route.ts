import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'

const refreshRequestSchema = z.object({
  deliveryJobId: z.string().uuid()
})

export const adminDeliveryRefreshRoutes = async (app: FastifyInstance) => {
  // Manual refresh of delivery job status
  app.post('/api/admin/delivery/jobs/:deliveryJobId/refresh', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { deliveryJobId } = req.params as { deliveryJobId: string }

      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      // Find delivery job
      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJobId },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              storeId: true
            }
          }
        }
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      // Refresh status from provider
      const adapter = getDeliveryProviderAdapter(deliveryJob.provider as any)
      
      try {
        const updatedStatus = await adapter.getDeliveryStatus({
          deliveryJobId: deliveryJob.id,
          providerExternalId: deliveryJob.providerExternalId || ''
        })

        // Update local status
        await prisma.deliveryJob.update({
          where: { id: deliveryJobId },
          data: {
            providerStatus: updatedStatus.providerStatus,
            updatedAt: new Date()
          }
        })

        // Create refresh event
        await prisma.deliveryProviderEvent.create({
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deliveryJobId: deliveryJob.id,
          provider: deliveryJob.provider,
          eventId: `manual_refresh_${deliveryJobId}`,
          eventType: 'status_updated',
          timestamp: new Date(),
          payload: updatedStatus.providerPayload as any,
          processed: true,
          createdAt: new Date()
        })

        return reply.code(200).send({
          success: true,
          previousStatus: deliveryJob.providerStatus,
          newStatus: updatedStatus.providerStatus,
          refreshedAt: new Date().toISOString()
        })

      } catch (refreshError) {
        console.error('Error refreshing delivery status:', refreshError)
        
        // Create error event
        await prisma.deliveryProviderEvent.create({
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deliveryJobId: deliveryJob.id,
          provider: deliveryJob.provider,
          eventId: `manual_refresh_error_${deliveryJobId}`,
          eventType: 'provider_error',
          timestamp: new Date(),
          payload: { 
            error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
            refreshedAt: new Date().toISOString()
          } as any,
          processed: true,
          createdAt: new Date()
        })

        return reply.code(500).send({ 
          error: 'Failed to refresh delivery status',
          message: refreshError instanceof Error ? refreshError.message : 'Unknown error'
        })
      }

    } catch (error) {
      console.error('Error in delivery refresh endpoint:', error)
      return reply.code(500).send({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
