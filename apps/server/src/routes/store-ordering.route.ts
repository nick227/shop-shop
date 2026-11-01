import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, storeOrderingBlock } from '@packages/db'
import { requireVendorWorkspace } from '../middleware/vendorAccess.js'
import { requireVendorAuth } from './vendor/vendorHelpers.js'

const OrderingInputSchema = z.object({
  acceptingOrders: z.boolean(),
  reason: z.string().trim().max(200).optional(),
})

const ORDERING_SELECT = {
  status: true,
  isPublished: true,
  acceptingOrders: true,
  ordersPausedAt: true,
  ordersPausedByUserId: true,
  ordersPausedReason: true,
} as const

type OrderingRow = {
  status: string
  isPublished: boolean
  acceptingOrders: boolean
  ordersPausedAt: Date | null
  ordersPausedByUserId: string | null
  ordersPausedReason: string | null
}

function orderingResponse(store: OrderingRow) {
  return {
    acceptingOrders: store.acceptingOrders,
    pausedAt: store.ordersPausedAt,
    pausedByUserId: store.ordersPausedByUserId,
    pauseReason: store.ordersPausedReason,
    // What customers actually get, including restrictions the merchant can't change.
    unavailableReason: storeOrderingBlock(store),
  }
}

/**
 * The merchant's own pause. It never touches the administrative `status`,
 * so resuming here cannot lift a suspension or a disable.
 */
export const storeOrderingRoutes = async (app: FastifyInstance) => {
  app.get('/stores/:id/ordering', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    if (!(await requireVendorAuth(req.user?.id, req.user?.role, id, 'orders', reply))) return

    const store = await prisma.store.findUnique({ where: { id }, select: ORDERING_SELECT })
    if (!store) return reply.code(404).send({ error: 'Store not found' })
    return reply.code(200).send(orderingResponse(store))
  })

  app.put('/stores/:id/ordering', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    if (!(await requireVendorAuth(req.user?.id, req.user?.role, id, 'settings', reply))) return

    const parsed = OrderingInputSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Validation error', details: parsed.error.flatten() })

    const { acceptingOrders, reason } = parsed.data
    const existing = await prisma.store.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return reply.code(404).send({ error: 'Store not found' })

    const store = await prisma.store.update({
      where: { id },
      data: acceptingOrders
        ? { acceptingOrders: true, ordersPausedAt: null, ordersPausedByUserId: null, ordersPausedReason: null }
        : {
            acceptingOrders: false,
            ordersPausedAt: new Date(),
            ordersPausedByUserId: req.user!.id,
            ordersPausedReason: reason || null,
          },
      select: ORDERING_SELECT,
    })
    return reply.code(200).send(orderingResponse(store))
  })
}
