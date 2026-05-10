import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, type Prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { realtimeBroker } from '../services/realtime.broker.js'
import { userHasStoreAccess } from '../middleware/storeAccess.js'

// DeliveryJobStatus transitions (REQUESTED → DISPATCHED → COMPLETED)
const SAFE_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['DISPATCHED', 'CANCELED'],
  DISPATCHED: ['COMPLETED', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
  FAILED: [],
}

function isValidTransition(from: string, to: string): boolean {
  return SAFE_TRANSITIONS[from]?.includes(to) ?? false
}

const markOutForDeliverySchema = z.object({
  driverId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

const markDeliveredSchema = z.object({
  notes: z.string().optional(),
  customerRating: z.number().min(1).max(5).optional(),
  customerTip: z.number().min(0).optional(),
})

const createInhouseDeliverySchema = z.object({
  orderId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export const inhouseDeliveryActionsRoutes = async (app: FastifyInstance) => {
  // Mark job dispatched (order → OUT_FOR_DELIVERY)
  app.post(
    '/api/delivery-jobs/:id/mark-out-for-delivery',
    { preHandler: authenticate },
    async (req, reply) => {
      try {
        const { id: deliveryJobId } = req.params as { id: string }
        const validatedData = markOutForDeliverySchema.parse(req.body)

        const deliveryJob = await prisma.deliveryJob.findFirst({
          where: {
            id: deliveryJobId,
            order: { deliveryMode: 'STORE_MANAGED_DELIVERY' },
          },
          include: {
            order: { select: { id: true, userId: true, storeId: true, status: true } },
          },
        })

        if (!deliveryJob) {
          return reply.code(404).send({ error: 'Delivery job not found' })
        }

        const canAccess =
          (await userHasStoreAccess(
            req.user!.id,
            req.user!.role,
            deliveryJob.order!.storeId,
            'deliveries',
          )) || deliveryJob.order!.userId === req.user!.id

        if (!canAccess) {
          return reply.code(403).send({ error: 'Access denied' })
        }

        if (!isValidTransition(deliveryJob.status, 'DISPATCHED')) {
          return reply.code(400).send({
            error: 'Invalid status transition',
            message: `Cannot transition from ${deliveryJob.status} to DISPATCHED`,
          })
        }

        const jobUpdateData: Prisma.DeliveryJobUpdateInput = {
          status: 'DISPATCHED',
          providerStatus: 'out_for_delivery',
        }

        if (validatedData.notes) {
          jobUpdateData.providerPayload = {
            ...(deliveryJob.providerPayload as object | null ?? {}),
            notes: validatedData.notes,
            markedOutForDeliveryAt: new Date().toISOString(),
          } as Prisma.InputJsonValue
        }

        await prisma.deliveryJob.update({
          where: { id: deliveryJobId },
          data: jobUpdateData,
        })

        await prisma.order.update({
          where: { id: deliveryJob.order!.id },
          data: { status: 'OUT_FOR_DELIVERY' },
        })

        await prisma.deliveryProviderEvent.create({
          data: {
            deliveryJobId,
            provider: 'IN_HOUSE',
            eventId: `vendor_mark_out_for_delivery_${deliveryJobId}`,
            eventType: 'status_updated',
            timestamp: new Date(),
            payload: {
              previousStatus: deliveryJob.status,
              newStatus: 'DISPATCHED',
              notes: validatedData.notes ?? null,
              source: 'vendor_action',
            } as Prisma.InputJsonValue,
            processed: true,
          },
        })

        realtimeBroker.publish('delivery.status.updated', {
          type: 'delivery.status.updated',
          timestamp: new Date().toISOString(),
          payload: {
            deliveryJobId,
            orderId: deliveryJob.order!.id,
            status: 'DISPATCHED',
            providerStatus: 'out_for_delivery',
          },
        })

        return reply.code(200).send({ success: true })
      } catch (error) {
        console.error('Mark out for delivery error:', error)
        return reply.code(500).send({ error: 'Internal server error' })
      }
    },
  )

  // Mark job completed (order → DELIVERED)
  app.post(
    '/api/delivery-jobs/:id/mark-delivered',
    { preHandler: authenticate },
    async (req, reply) => {
      try {
        const { id: deliveryJobId } = req.params as { id: string }
        const validatedData = markDeliveredSchema.parse(req.body)

        const deliveryJob = await prisma.deliveryJob.findFirst({
          where: {
            id: deliveryJobId,
            order: { deliveryMode: 'STORE_MANAGED_DELIVERY' },
          },
          include: {
            order: { select: { id: true, userId: true, storeId: true, status: true } },
          },
        })

        if (!deliveryJob) {
          return reply.code(404).send({ error: 'Delivery job not found' })
        }

        const canAccess =
          (await userHasStoreAccess(
            req.user!.id,
            req.user!.role,
            deliveryJob.order!.storeId,
            'deliveries',
          )) || deliveryJob.order!.userId === req.user!.id

        if (!canAccess) {
          return reply.code(403).send({ error: 'Access denied' })
        }

        if (!isValidTransition(deliveryJob.status, 'COMPLETED')) {
          return reply.code(400).send({
            error: 'Invalid status transition',
            message: `Cannot transition from ${deliveryJob.status} to COMPLETED`,
          })
        }

        const jobUpdateData: Prisma.DeliveryJobUpdateInput = {
          status: 'COMPLETED',
          providerStatus: 'delivered',
          completedAt: new Date(),
        }

        if (validatedData.notes) {
          jobUpdateData.providerPayload = {
            ...(deliveryJob.providerPayload as object | null ?? {}),
            notes: validatedData.notes,
            deliveredAt: new Date().toISOString(),
            customerRating: validatedData.customerRating ?? null,
            customerTip: validatedData.customerTip ?? null,
          } as Prisma.InputJsonValue
        }

        await prisma.deliveryJob.update({
          where: { id: deliveryJobId },
          data: jobUpdateData,
        })

        await prisma.order.update({
          where: { id: deliveryJob.order!.id },
          data: { status: 'DELIVERED' },
        })

        await prisma.deliveryProviderEvent.create({
          data: {
            deliveryJobId,
            provider: 'IN_HOUSE',
            eventId: `vendor_mark_delivered_${deliveryJobId}`,
            eventType: 'status_updated',
            timestamp: new Date(),
            payload: {
              previousStatus: deliveryJob.status,
              newStatus: 'COMPLETED',
              notes: validatedData.notes ?? null,
              customerRating: validatedData.customerRating ?? null,
              customerTip: validatedData.customerTip ?? null,
              source: 'vendor_action',
            } as Prisma.InputJsonValue,
            processed: true,
          },
        })

        realtimeBroker.publish('delivery.status.updated', {
          type: 'delivery.status.updated',
          timestamp: new Date().toISOString(),
          payload: {
            deliveryJobId,
            orderId: deliveryJob.order!.id,
            status: 'COMPLETED',
            providerStatus: 'delivered',
          },
        })

        return reply.code(200).send({ success: true })
      } catch (error) {
        console.error('Mark delivered error:', error)
        return reply.code(500).send({ error: 'Internal server error' })
      }
    },
  )

  // Create in-house delivery job for a READY order
  app.post(
    '/api/delivery-jobs/create-inhouse',
    { preHandler: authenticate },
    async (req, reply) => {
      try {
        const validatedData = createInhouseDeliverySchema.parse(req.body)

        const order = await prisma.order.findFirst({
          where: {
            id: validatedData.orderId,
            deliveryMode: 'STORE_MANAGED_DELIVERY',
            status: 'READY',
          },
          select: { id: true, storeId: true, userId: true },
        })

        if (!order) {
          return reply.code(404).send({ error: 'Order not found or not eligible for in-house delivery' })
        }

        const canAccess =
          (await userHasStoreAccess(
            req.user!.id,
            req.user!.role,
            order.storeId,
            'dispatch',
          )) || order.userId === req.user!.id

        if (!canAccess) {
          return reply.code(403).send({ error: 'Access denied' })
        }

        const deliveryJob = await prisma.deliveryJob.create({
          data: {
            orderId: order.id,
            storeId: order.storeId,
            provider: 'IN_HOUSE',
            status: 'REQUESTED',
            providerStatus: 'requested',
            ...(validatedData.driverId ? { requestedByUserId: validatedData.driverId } : {}),
          },
        })

        await prisma.deliveryProviderEvent.create({
          data: {
            deliveryJobId: deliveryJob.id,
            provider: 'IN_HOUSE',
            eventId: `vendor_created_${deliveryJob.id}`,
            eventType: 'status_updated',
            timestamp: new Date(),
            payload: {
              newStatus: 'REQUESTED',
              notes: validatedData.notes ?? null,
              source: 'vendor_action',
            } as Prisma.InputJsonValue,
            processed: true,
          },
        })

        realtimeBroker.publish('delivery.status.updated', {
          type: 'delivery.status.updated',
          timestamp: new Date().toISOString(),
          payload: {
            deliveryJobId: deliveryJob.id,
            orderId: order.id,
            status: 'REQUESTED',
            providerStatus: 'requested',
          },
        })

        return reply.code(201).send({
          success: true,
          deliveryJob: {
            id: deliveryJob.id,
            orderId: order.id,
            provider: 'IN_HOUSE',
            status: 'REQUESTED',
            providerStatus: 'requested',
          },
        })
      } catch (error) {
        console.error('Create in-house delivery error:', error)
        return reply.code(500).send({ error: 'Internal server error' })
      }
    },
  )
}
