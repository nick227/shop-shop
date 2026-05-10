import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { realtimeBroker } from '../services/realtime.broker'

export const deliveryRealtimeRoutes = async (app: FastifyInstance) => {
  // Internal publish delivery status updates (for trusted services only)
  app.post('/internal/delivery/status-updated', async (req, reply) => {
    try {
      const { deliveryJobId, status, providerStatus, providerPayload, source } = req.body as {
        deliveryJobId: string
        status?: string
        providerStatus?: string
        providerPayload?: any
        source?: string
      }

      if (!deliveryJobId) {
        return reply.code(400).send({ error: 'Delivery job ID required' })
      }

      // Verify delivery job exists
      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJobId },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              storeId: true
            }
          }
        }
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      // Update delivery job status if provided
      const updateData: any = { updatedAt: new Date() }
      if (status) updateData.status = status
      if (providerStatus) updateData.providerStatus = providerStatus
      if (providerPayload) updateData.providerPayload = providerPayload

      await prisma.deliveryJob.update({
        where: { id: deliveryJobId },
        data: updateData
      })

      // Create delivery provider event
      await prisma.deliveryProviderEvent.create({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryJobId,
        provider: deliveryJob.provider,
        eventId: `internal_status_${deliveryJobId}`,
        eventType: 'status_updated',
        timestamp: new Date(),
        payload: {
          previousStatus: deliveryJob.status,
          newStatus: status || deliveryJob.status,
          providerStatus: providerStatus || deliveryJob.providerStatus,
          source: source || 'internal_service'
        } as any,
        processed: true,
        createdAt: new Date()
      })

      // Publish realtime event
      realtimeBroker.publish('delivery.status.updated', {
        type: 'delivery.status.updated',
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          previousStatus: deliveryJob.status,
          newStatus: status || deliveryJob.status,
          providerStatus: providerStatus || deliveryJob.providerStatus,
          provider: deliveryJob.provider,
          source: source || 'internal_service'
        }
      })

      // Also publish to admin topic for admin viewers
      realtimeBroker.publish('delivery.status.updated.admin', {
        type: 'delivery.status.updated',
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          previousStatus: deliveryJob.status,
          newStatus: status || deliveryJob.status,
          providerStatus: providerStatus || deliveryJob.providerStatus,
          provider: deliveryJob.provider,
          source: source || 'internal_service'
        }
      })

      return reply.code(200).send({ 
        success: true,
        message: 'Delivery status updated and published'
      })

    } catch (error) {
      console.error('Error updating delivery status:', error)
      return reply.code(500).send({ 
        error: 'Failed to update delivery status',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Internal publish delivery location updates (for trusted services only)
  app.post('/internal/delivery/location-updated', async (req, reply) => {
    try {
      const { deliveryJobId, latitude, longitude, address, source } = req.body as {
        deliveryJobId: string
        latitude?: number
        longitude?: number
        address?: any
        source?: string
      }

      if (!deliveryJobId) {
        return reply.code(400).send({ error: 'Delivery job ID required' })
      }

      // Verify delivery job exists
      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJobId },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              storeId: true
            }
          }
        }
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      // Update delivery job with location data
      const locationData: any = { updatedAt: new Date() }
      if (latitude !== undefined && longitude !== undefined) {
        locationData.providerPayload = {
          ...(deliveryJob.providerPayload as any || {}),
          location: {
            latitude,
            longitude,
            address,
            timestamp: new Date().toISOString()
          }
        }
      }

      await prisma.deliveryJob.update({
        where: { id: deliveryJobId },
        data: locationData
      })

      // Create delivery provider event
      await prisma.deliveryProviderEvent.create({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryJobId,
        provider: deliveryJob.provider,
        eventId: `internal_location_${deliveryJobId}`,
        eventType: 'location_updated',
        timestamp: new Date(),
        payload: {
          location: { latitude, longitude, address },
          source: source || 'internal_service'
        } as any,
        processed: true,
        createdAt: new Date()
      })

      // Publish realtime event
      realtimeBroker.publish('delivery.location.updated', {
        type: 'delivery.location.updated',
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          location: { latitude, longitude, address },
          provider: deliveryJob.provider,
          source: source || 'internal_service'
        }
      })

      // Also publish to admin topic for admin viewers
      realtimeBroker.publish('delivery.location.updated.admin', {
        type: 'delivery.location.updated',
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          location: { latitude, longitude, address },
          provider: deliveryJob.provider,
          source: source || 'internal_service'
        }
      })

      return reply.code(200).send({ 
        success: true,
        message: 'Delivery location updated and published'
      })

    } catch (error) {
      console.error('Error updating delivery location:', error)
      return reply.code(500).send({ 
        error: 'Failed to update delivery location',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Vendor-controlled in-house delivery status updates
  app.post('/api/delivery-jobs/:deliveryJobId/mark-out-for-delivery', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { deliveryJobId, status, providerStatus, providerPayload } = req.body as {
        deliveryJobId: string
        status?: string
        providerStatus?: string
        providerPayload?: any
      }

      if (!deliveryJobId) {
        return reply.code(400).send({ error: 'Delivery job ID required' })
      }

      // Verify delivery job exists and user has access
      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJobId },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              storeId: true
            }
          }
        }
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      // Check if user can access this delivery (admin, store owner, or order owner)
      const canAccess = 
        req.user?.role === 'ADMIN' ||
        (await prisma.storeMember.findFirst({
          where: {
            userId: req.user!.id,
            storeId: deliveryJob.order.storeId,
            role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
          }
        })) ||
        deliveryJob.order.userId === req.user!.id

      if (!canAccess) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      // Update delivery job status if provided
      const updateData: any = { updatedAt: new Date() }
      if (status) updateData.status = status
      if (providerStatus) updateData.providerStatus = providerStatus
      if (providerPayload) updateData.providerPayload = providerPayload

      await prisma.deliveryJob.update({
        where: { id: deliveryJobId },
        data: updateData
      })

      // Create delivery provider event
      await prisma.deliveryProviderEvent.create({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryJobId,
        provider: deliveryJob.provider,
        eventId: `realtime_status_${deliveryJobId}`,
        eventType: 'status_updated',
        timestamp: new Date(),
        payload: {
          previousStatus: deliveryJob.status,
          newStatus: status || deliveryJob.status,
          providerStatus: providerStatus || deliveryJob.providerStatus,
          source: 'realtime_api'
        } as any,
        processed: true,
        createdAt: new Date()
      })

      // Publish realtime event
      realtimeBroker.publish('delivery.status.updated', {
        type: 'delivery.status.updated',
        topic: `delivery.status.updated.${deliveryJob.order.userId}`,
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          previousStatus: deliveryJob.status,
          newStatus: status || deliveryJob.status,
          providerStatus: providerStatus || deliveryJob.providerStatus,
          provider: deliveryJob.provider,
          source: 'realtime_api'
        }
      })

      // Also publish to admin topic for admin viewers
      realtimeBroker.publish('delivery.status.updated.admin', {
        type: 'delivery.status.updated',
        topic: `delivery.status.updated.admin`,
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          previousStatus: deliveryJob.status,
          newStatus: status || deliveryJob.status,
          providerStatus: providerStatus || deliveryJob.providerStatus,
          provider: deliveryJob.provider,
          source: 'realtime_api'
        }
      })

      return reply.code(200).send({ 
        success: true,
        message: 'Delivery status updated and published'
      })

    } catch (error) {
      console.error('Error updating delivery status:', error)
      return reply.code(500).send({ 
        error: 'Failed to update delivery status',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Publish delivery location updates
  app.post('/api/delivery/location-updated', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { deliveryJobId, latitude, longitude, address, providerPayload } = req.body as {
        deliveryJobId: string
        latitude?: number
        longitude?: number
        address?: any
        providerPayload?: any
      }

      if (!deliveryJobId) {
        return reply.code(400).send({ error: 'Delivery job ID required' })
      }

      // Verify delivery job exists and user has access
      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJobId },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              storeId: true
            }
          }
        }
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      // Check if user can access this delivery
      const canAccess = 
        req.user?.role === 'ADMIN' ||
        (await prisma.storeMember.findFirst({
          where: {
            userId: req.user!.id,
            storeId: deliveryJob.order.storeId,
            role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
          }
        })) ||
        deliveryJob.order.userId === req.user!.id

      if (!canAccess) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      // Update delivery job with location data
      const locationData: any = { updatedAt: new Date() }
      if (latitude !== undefined && longitude !== undefined) {
        locationData.providerPayload = {
          ...(deliveryJob.providerPayload as any || {}),
          location: {
            latitude,
            longitude,
            address,
            timestamp: new Date().toISOString()
          }
        }
      }

      await prisma.deliveryJob.update({
        where: { id: deliveryJobId },
        data: locationData
      })

      // Create delivery provider event
      await prisma.deliveryProviderEvent.create({
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deliveryJobId,
        provider: deliveryJob.provider,
        eventId: `realtime_location_${deliveryJobId}`,
        eventType: 'location_updated',
        timestamp: new Date(),
        payload: {
          location: { latitude, longitude, address },
          source: 'realtime_api'
        } as any,
        processed: true,
        createdAt: new Date()
      })

      // Publish realtime event
      realtimeBroker.publish('delivery.location.updated', {
        type: 'delivery.location.updated',
        topic: `delivery.location.updated.${deliveryJob.order.userId}`,
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          location: { latitude, longitude, address },
          provider: deliveryJob.provider,
          source: 'realtime_api'
        }
      })

      // Also publish to admin topic for admin viewers
      realtimeBroker.publish('delivery.location.updated.admin', {
        type: 'delivery.location.updated',
        topic: `delivery.location.updated.admin`,
        timestamp: new Date().toISOString(),
        payload: {
          deliveryJobId,
          orderId: deliveryJob.order.id,
          userId: deliveryJob.order.userId,
          storeId: deliveryJob.order.storeId,
          location: { latitude, longitude, address },
          provider: deliveryJob.provider,
          source: 'realtime_api'
        }
      })

      return reply.code(200).send({ 
        success: true,
        message: 'Delivery location updated and published'
      })

    } catch (error) {
      console.error('Error updating delivery location:', error)
      return reply.code(500).send({ 
        error: 'Failed to update delivery location',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
