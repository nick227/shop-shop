import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDeliveryProviderAdapter } from '@packages/db'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'

const dispatchRequestSchema = z.object({
  orderId: z.string().uuid(),
  storeId: z.string().uuid(),
  dropoffLatitude: z.number().min(-90).max(90),
  dropoffLongitude: z.number().min(-180).max(180),
})

const cancelRequestSchema = z.object({
  deliveryJobId: z.string().uuid(),
})

export const deliveryDispatchRoutes = async (app: FastifyInstance) => {
  // Check if order can be dispatched
  app.get('/api/delivery/can-dispatch/:orderId', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          deliveryMode: true,
          paymentStatus: true,
          deliveryLatitude: true,
          deliveryLongitude: true,
          addressSnapshot: true,
          total: true,
          storeId: true
        }
      })

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' })
      }

      // Check if user owns/manages the store
      const storeMember = await prisma.storeMember.findFirst({
        where: {
          userId: req.user!.id,
          storeId: order.storeId,
          role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
        }
      })

      if (!storeMember) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      // Check eligibility criteria
      const checks = {
        orderReady: order.status === 'READY',
        thirdPartyDelivery: order.deliveryMode === 'THIRD_PARTY_PROVIDER',
        orderPaid: order.paymentStatus === 'PAID',
        hasDeliveryAddress: !!(order.deliveryLatitude && order.deliveryLongitude),
        hasValidAddressSnapshot: !!order.addressSnapshot
      }

      // Check if delivery job already exists
      const existingDeliveryJob = await prisma.deliveryJob.findFirst({
        where: { orderId },
        select: { id: true }
      })

      if (existingDeliveryJob) {
        return reply.code(200).send({ 
          canDispatch: false, 
          reason: 'Delivery job already exists for this order',
          existingJobId: existingDeliveryJob.id
        })
      }

      // Check if store supports DoorDash
      const storeDeliveryOption = await prisma.storeDeliveryOption.findFirst({
        where: {
          storeId: order.storeId,
          deliveryMode: 'DOORDASH_DRIVE',
          enabled: true
        }
      })

      if (!storeDeliveryOption) {
        return reply.code(200).send({ 
          canDispatch: false, 
          reason: 'Store does not support DoorDash delivery'
        })
      }

      // All checks passed
      if (Object.values(checks).every(check => check)) {
        // Get a quote to include in response
        try {
          const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
          const quote = await adapter.quoteDelivery({
            orderId,
            storeId: order.storeId,
            dropoffLatitude: Number(order.deliveryLatitude || 0),
            dropoffLongitude: Number(order.deliveryLongitude || 0)
          })

          return reply.code(200).send({ 
            canDispatch: true,
            quote: {
              feeCents: quote.feeCents,
              etaMinutes: quote.etaMinutes,
              currency: quote.currency
            }
          })
        } catch (quoteError) {
          return reply.code(200).send({ 
            canDispatch: false, 
            reason: 'Failed to get delivery quote'
          })
        }
      }

      return reply.code(200).send({ 
        canDispatch: false, 
        reason: 'Order not ready for dispatch',
        checks
      })

    } catch (error) {
      console.error('Error checking dispatch eligibility:', error)
      return reply.code(500).send({ 
        canDispatch: false, 
        reason: 'Internal server error' 
      })
    }
  })

  // Dispatch DoorDash delivery
  app.post('/api/delivery/dispatch', { preHandler: authenticate }, async (req, reply) => {
    try {
      const validatedData = dispatchRequestSchema.parse(req.body)
      const { orderId, storeId, dropoffLatitude, dropoffLongitude } = validatedData

      // Verify order exists and is ready
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          deliveryMode: true,
          paymentStatus: true,
          deliveryLatitude: true,
          deliveryLongitude: true,
          addressSnapshot: true
        }
      })

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' })
      }

      // Validate order is ready for dispatch
      if (order.status !== 'READY') {
        return reply.code(400).send({ error: 'Order must be READY to dispatch' })
      }

      if (order.deliveryMode !== 'THIRD_PARTY_PROVIDER') {
        return reply.code(400).send({ error: 'Order is not a third-party delivery' })
      }

      if (order.paymentStatus !== 'PAID') {
        return reply.code(400).send({ error: 'Order must be paid to dispatch' })
      }

      // Check if user owns/manages the store
      const storeMember = await prisma.storeMember.findFirst({
        where: {
          userId: req.user!.id,
          storeId: order.storeId,
          role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
        }
      })

      if (!storeMember) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      // Check no existing delivery job
      const existingJob = await prisma.deliveryJob.findFirst({
        where: { orderId }
      })

      if (existingJob) {
        return reply.code(400).send({ error: 'Delivery job already exists for this order' })
      }

      // Get adapter and create delivery
      const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
      
      const delivery = await adapter.createDelivery({
        deliveryJobId: '', // Will be generated
        orderId,
        storeId,
        dropoffLatitude: Number(dropoffLatitude),
        dropoffLongitude: Number(dropoffLongitude),
        dropoffAddressSnapshot: order.addressSnapshot as any
      })

      // Create delivery job record
      const deliveryJobId = `dj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const deliveryJob = await prisma.deliveryJob.create({
        data: {
          id: deliveryJobId,
          orderId,
          storeId,
          provider: 'DOORDASH_DRIVE',
          status: 'DISPATCHED',
          providerExternalId: delivery.providerExternalId,
          trackingUrl: delivery.trackingUrl,
          providerStatus: delivery.providerStatus,
          providerPayload: delivery.providerPayload as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Create delivery provider event
      await prisma.deliveryProviderEvent.upsert({
        where: {
          provider_eventId_deliveryJobId: {
            provider: 'DOORDASH_DRIVE',
            eventId: `dispatch_${deliveryJobId}`,
            deliveryJobId: deliveryJob.id
          }
        },
        update: {
          eventType: 'dispatch_created',
          timestamp: new Date(),
          payload: delivery.providerPayload as any,
          processed: true
        },
        create: {
          id: `evt_${Date.now()}_${Math.random()}`,
          deliveryJobId: deliveryJob.id,
          provider: 'DOORDASH_DRIVE',
          eventId: `dispatch_${deliveryJobId}`,
          eventType: 'dispatch_created',
          timestamp: new Date(),
          payload: delivery.providerPayload as any,
          processed: true,
          createdAt: new Date()
        }
      })

      return reply.code(200).send({
        success: true,
        deliveryJobId: deliveryJob.id,
        providerExternalId: delivery.providerExternalId,
        trackingUrl: delivery.trackingUrl,
        providerStatus: delivery.providerStatus
      })

    } catch (error) {
      console.error('Error dispatching DoorDash:', error)
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request data', 
          details: error.errors 
        })
      }

      return reply.code(500).send({ 
        error: 'Failed to dispatch DoorDash delivery',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Cancel DoorDash delivery
  app.post('/api/delivery/cancel', { preHandler: authenticate }, async (req, reply) => {
    try {
      const validatedData = cancelRequestSchema.parse(req.body)
      const { deliveryJobId } = validatedData

      // Find delivery job
      const deliveryJob = await prisma.deliveryJob.findUnique({
        where: { id: deliveryJobId },
        include: {
          order: {
            select: { id: true, status: true, storeId: true }
          }
        }
      })

      if (!deliveryJob) {
        return reply.code(404).send({ error: 'Delivery job not found' })
      }

      if (deliveryJob.provider !== 'DOORDASH_DRIVE') {
        return reply.code(400).send({ error: 'Not a DoorDash delivery job' })
      }

      // Check if user owns/manages the store
      const storeMember = await prisma.storeMember.findFirst({
        where: {
          userId: req.user!.id,
          storeId: deliveryJob.order.storeId,
          role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
        }
      })

      if (!storeMember) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      // Check if can be cancelled (not delivered)
      if (deliveryJob.providerStatus === 'delivered') {
        return reply.code(400).send({ error: 'Cannot cancel delivered order' })
      }

      // Cancel with provider
      const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
      
      try {
        await adapter.cancelDelivery({
          deliveryJobId: deliveryJob.id,
          providerExternalId: deliveryJob.providerExternalId || ''
        })
      } catch (cancelError) {
        console.error('Error cancelling with provider:', cancelError)
        // Continue with local cancellation even if provider cancellation fails
      }

      // Update local status
      await prisma.deliveryJob.update({
        where: { id: deliveryJobId },
        data: {
          status: 'CANCELED',
          providerStatus: 'cancelled',
          updatedAt: new Date()
        }
      })

      // Update order status back to READY
      if (deliveryJob.order.status === 'OUT_FOR_DELIVERY') {
        await prisma.order.update({
          where: { id: deliveryJob.orderId },
          data: { status: 'READY', updatedAt: new Date() }
        })
      }

      // Create cancellation event
      await prisma.deliveryProviderEvent.upsert({
        where: {
          provider_eventId_deliveryJobId: {
            provider: 'DOORDASH_DRIVE',
            eventId: `cancel_${deliveryJobId}`,
            deliveryJobId: deliveryJob.id
          }
        },
        update: {
          eventType: 'delivery_cancelled',
          timestamp: new Date(),
          payload: { cancelledAt: new Date().toISOString() } as any,
          processed: true
        },
        create: {
          id: `evt_${Date.now()}_${Math.random()}`,
          deliveryJobId: deliveryJob.id,
          provider: 'DOORDASH_DRIVE',
          eventId: `cancel_${deliveryJobId}`,
          eventType: 'delivery_cancelled',
          timestamp: new Date(),
          payload: { cancelledAt: new Date().toISOString() } as any,
          processed: true,
          createdAt: new Date()
        }
      })

      return reply.code(200).send({ success: true })

    } catch (error) {
      console.error('Error cancelling DoorDash delivery:', error)
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request data', 
          details: error.errors 
        })
      }

      return reply.code(500).send({ 
        error: 'Failed to cancel DoorDash delivery',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Get delivery job status
  app.get('/api/delivery/jobs/order/:orderId', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { storeId: true }
      })

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' })
      }

      // Check if user owns/manages the store
      const storeMember = await prisma.storeMember.findFirst({
        where: {
          userId: req.user!.id,
          storeId: order.storeId,
          role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
        }
      })

      if (!storeMember) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      const deliveryJob = await prisma.deliveryJob.findFirst({
        where: { orderId },
        select: {
          id: true,
          provider: true,
          status: true,
          providerExternalId: true,
          trackingUrl: true,
          providerStatus: true,
          createdAt: true,
          updatedAt: true
        }
      })

      return reply.code(200).send({ deliveryJob })

    } catch (error) {
      console.error('Error getting delivery job status:', error)
      return reply.code(500).send({ 
        error: 'Failed to get delivery job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
