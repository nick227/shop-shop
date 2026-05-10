import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { userHasStoreAccess } from '../middleware/storeAccess.js'

const TERMINAL_ORDER_STATUSES = new Set(['COMPLETED', 'DELIVERED', 'CANCELED'])
const TERMINAL_DELIVERY_JOB_STATUSES = new Set(['COMPLETED', 'CANCELED', 'FAILED'])

function getNextPollMs(orderStatus?: string, deliveryJobStatus?: string | null): number | null {
  if (TERMINAL_ORDER_STATUSES.has(orderStatus ?? '')) return null
  if (TERMINAL_DELIVERY_JOB_STATUSES.has(deliveryJobStatus ?? '')) return null

  if (deliveryJobStatus === 'DISPATCHED') return 15_000
  if (deliveryJobStatus === 'REQUESTED') return 10_000

  return 30_000
}

function getLatestLocation(providerPayload: unknown): unknown {
  if (!providerPayload || typeof providerPayload !== 'object') return null
  const location = (providerPayload as { location?: unknown }).location
  return location && typeof location === 'object' ? location : null
}

export const deliveryTrackingRoutes = async (app: FastifyInstance) => {
  app.get('/api/delivery/tracking/:orderId', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          userId: true,
          status: true,
          deliveryType: true,
          deliveryMode: true,
          storeId: true,
        },
      })

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' })
      }

      const user = req.user!
      if (user.id !== order.userId) {
        const vendorOk = await userHasStoreAccess(user.id, user.role, order.storeId, 'deliveries')
        if (!vendorOk) {
          return reply.code(403).send({ error: 'Access denied' })
        }
      }

      if (order.deliveryType !== 'DELIVERY') {
        return reply.code(200).send({
          deliveryJob: null,
          latestLocation: null,
          terminal: TERMINAL_ORDER_STATUSES.has(order.status),
          nextPollMs: getNextPollMs(order.status),
        })
      }

      const deliveryJob = await prisma.deliveryJob.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          provider: true,
          status: true,
          providerExternalId: true,
          trackingUrl: true,
          providerStatus: true,
          providerPayload: true,
          completedAt: true,
          canceledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      const terminal =
        TERMINAL_ORDER_STATUSES.has(order.status) ||
        TERMINAL_DELIVERY_JOB_STATUSES.has(deliveryJob?.status ?? '')
      const latestLocation = getLatestLocation(deliveryJob?.providerPayload)
      const publicDeliveryJob = deliveryJob
        ? {
            id: deliveryJob.id,
            provider: deliveryJob.provider,
            status: deliveryJob.status,
            providerExternalId: deliveryJob.providerExternalId,
            trackingUrl: deliveryJob.trackingUrl,
            providerStatus: deliveryJob.providerStatus,
            completedAt: deliveryJob.completedAt,
            canceledAt: deliveryJob.canceledAt,
            createdAt: deliveryJob.createdAt,
            updatedAt: deliveryJob.updatedAt,
          }
        : null

      return reply.code(200).send({
        deliveryJob: publicDeliveryJob,
        latestLocation,
        terminal,
        nextPollMs: terminal ? null : getNextPollMs(order.status, deliveryJob?.status),
      })

    } catch (error) {
      console.error('Error getting delivery tracking:', error)
      return reply.code(500).send({ 
        error: 'Failed to get delivery tracking',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Admin-only delivery job viewer (for admin delivery event viewer)
  app.get('/api/admin/delivery/jobs', { preHandler: authenticate }, async (req, reply) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      const { page = 1, limit = 50, storeId, status } = req.query as {
        page?: number
        limit?: number
        storeId?: string
        status?: string
      }

      const where: any = {}
      
      if (storeId) where.order = { storeId }
      if (status) where.status = status

      const [deliveryJobs, total] = await Promise.all([
        prisma.deliveryJob.findMany({
          where,
          include: {
            order: {
              select: {
                id: true,
                status: true,
                userId: true,
                storeId: true,
                total: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.deliveryJob.count({ where })
      ])

      return reply.code(200).send({
        deliveryJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })

    } catch (error) {
      console.error('Error getting admin delivery jobs:', error)
      return reply.code(500).send({ 
        error: 'Failed to get delivery jobs',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Admin delivery events viewer
  app.get('/api/admin/delivery/events', { preHandler: authenticate }, async (req, reply) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      const { page = 1, limit = 100, deliveryJobId, provider } = req.query as {
        page?: number
        limit?: number
        deliveryJobId?: string
        provider?: string
      }

      const where: any = {}
      
      if (deliveryJobId) where.deliveryJobId = deliveryJobId
      if (provider) where.provider = provider

      const [events, total] = await Promise.all([
        prisma.deliveryProviderEvent.findMany({
          where,
          include: {
            deliveryJob: {
              select: {
                id: true,
                provider: true,
                order: {
                  select: {
                    id: true,
                    userId: true,
                    storeId: true
                  }
                }
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.deliveryProviderEvent.count({ where })
      ])

      return reply.code(200).send({
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })

    } catch (error) {
      console.error('Error getting admin delivery events:', error)
      return reply.code(500).send({ 
        error: 'Failed to get delivery events',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
