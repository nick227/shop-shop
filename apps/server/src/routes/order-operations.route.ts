import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  prisma,
  executeOrderCommand,
  orderOperations,
  getAccountCapabilities,
  retryOrderRefund,
} from '@packages/db'
import { requireAuth } from '../middleware/rbac.js'
import { assertOrderAccess } from '../resources/order-access.js'

const commandSchema = z
  .object({
    status: z
      .enum([
        'ACCEPTED',
        'PREPARING',
        'READY',
        'COMPLETED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELED',
      ])
      .optional(),
    prepMinutes: z.number().int().min(1).max(240).optional(),
    expectedVersion: z.number().int().min(0),
    operationId: z.string().min(8).max(100),
    collectionCode: z.string().max(12).optional(),
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .refine((value) => value.status || value.prepMinutes, 'Choose an action')

export async function canManageOrder(userId: string, storeId: string) {
  const capabilities = await getAccountCapabilities(userId)
  if (capabilities.canAdministerStores) return true
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerUserId: true },
  })
  if (store?.ownerUserId === userId && capabilities.canAccessVendorPortal) return true
  const member = await prisma.teamMember.findFirst({
    where: { userId, storeId, isActive: true },
    select: { permissionsJson: true },
  })
  return (
    Array.isArray(member?.permissionsJson) &&
    member.permissionsJson.some((p) => p === 'FULL_ACCESS' || p === 'MANAGE_ORDERS')
  )
}

async function canReadStoreOrders(userId: string, storeId: string) {
  if (await canManageOrder(userId, storeId)) return true
  const member = await prisma.teamMember.findFirst({
    where: { userId, storeId, isActive: true },
    select: { permissionsJson: true },
  })
  return Array.isArray(member?.permissionsJson) && member.permissionsJson.includes('VIEW_ORDERS')
}

export default async function orderOperationsRoutes(app: FastifyInstance) {
  app.get('/order-operations', { preHandler: [requireAuth] }, async (req, reply) => {
    const { storeId, history } = z
      .object({
        storeId: z.string().uuid().optional(),
        history: z.enum(['true', 'false']).optional(),
      })
      .parse(req.query)
    const admin = (await getAccountCapabilities(req.user!.id)).canAdministerStores
    if (!storeId && !admin) return reply.code(403).send({ error: 'Select a store' })
    if (storeId && !(await canReadStoreOrders(req.user!.id, storeId)))
      return reply.code(403).send({ error: 'Order management permission required' })
    const manage = admin || Boolean(storeId && (await canManageOrder(req.user!.id, storeId)))
    const orders = await prisma.order.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
        ...(history === 'true'
          ? { status: { in: ['COMPLETED', 'DELIVERED', 'CANCELED'] as const } }
          : {
              OR: [
                { status: { notIn: ['COMPLETED', 'DELIVERED', 'CANCELED'] as const } },
                { refundState: { in: ['PENDING', 'FAILED'] } },
              ],
            }),
      },
      include: {
        items: true,
        store: { select: { name: true, ownerUserId: true } },
        deliveryJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: history === 'true' ? 'desc' : 'asc' },
      take: 200,
    })
    return {
      orders: orders.map((order) => ({
        ...order,
        ...orderOperations(order),
        allowedActions: manage ? orderOperations(order).allowedActions : [],
        canAdjustEstimate: manage && orderOperations(order).canAdjustEstimate,
        canRecoverRefund: manage,
        owner: order.refundState === 'FAILED' ? 'Platform support' : order.store.name,
        exceptions: [
          ...orderOperations(order).exceptions,
          ...(order.status === 'PLACED' ? ['Needs acceptance'] : []),
          ...(order.deliveryJobs.some((j) => j.status === 'FAILED') ? ['Delivery failed'] : []),
          ...(order.status === 'PENDING_PAYMENT' &&
          Date.now() - order.createdAt.getTime() > 15 * 60000
            ? ['Payment confirmation overdue']
            : []),
        ],
      })),
      limit: 200,
    }
  })
  app.get('/orders/:orderId/operations', { preHandler: [requireAuth] }, async (req, reply) => {
    const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.params)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
        store: { select: { name: true, phone: true, addressStreet: true, addressCity: true } },
      },
    })
    if (!order) return reply.code(404).send({ error: 'Order not found' })
    try {
      await assertOrderAccess(order, { userId: req.user!.id, userRole: req.user!.role }, 'read')
    } catch {
      return reply.code(403).send({ error: 'You cannot view this order' })
    }
    const manage = await canManageOrder(req.user!.id, order.storeId)
    return {
      ...order,
      ...orderOperations(order),
      allowedActions: manage ? orderOperations(order).allowedActions : [],
      canAdjustEstimate: manage && ['ACCEPTED', 'PREPARING'].includes(order.status),
      refundError: manage ? order.refundError : undefined,
    }
  })
  app.post('/orders/:orderId/actions', { preHandler: [requireAuth] }, async (req, reply) => {
    const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.params)
    const body = commandSchema.parse(req.body)
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    const manager = await canManageOrder(req.user!.id, order.storeId)
    const customerCancel =
      order.userId === req.user!.id &&
      body.status === 'CANCELED' &&
      ['PENDING_PAYMENT', 'PLACED'].includes(order.status)
    if (!manager && !customerCancel)
      return reply.code(403).send({ error: 'You cannot perform this action' })
    try {
      return await executeOrderCommand({
        ...body,
        orderId,
        newStatus: body.status,
        customerOnly: !manager,
        changedBy: req.user!.id,
      })
    } catch (error) {
      return reply.code(409).send({
        error: error instanceof Error ? error.message : 'Order changed. Refresh and try again.',
      })
    }
  })
  app.post('/orders/:orderId/retry-refund', { preHandler: [requireAuth] }, async (req, reply) => {
    const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.params)
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
    if (!(await canManageOrder(req.user!.id, order.storeId)))
      return reply.code(403).send({ error: 'Order management permission required' })
    if (!['FAILED', 'PENDING'].includes(order.refundState))
      return reply.code(409).send({ error: 'No refund awaiting recovery' })
    await retryOrderRefund(orderId, req.user!.id)
    return { message: 'Refund recovery scheduled. Provider confirmation is still required.' }
  })
  app.patch(
    '/stores/:storeId/order-processing',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { storeId } = z.object({ storeId: z.string().uuid() }).parse(req.params)
      if (!(await canManageOrder(req.user!.id, storeId)))
        return reply.code(403).send({ error: 'Order management permission required' })
      const data = z
        .object({
          autoAcceptOrders: z.boolean(),
          prepTimeMin: z.number().int().min(1).max(240),
          acceptanceTimeoutMin: z.number().int().min(2).max(30),
        })
        .parse(req.body)
      return prisma.store.update({
        where: { id: storeId },
        data,
        select: { autoAcceptOrders: true, prepTimeMin: true, acceptanceTimeoutMin: true },
      })
    }
  )
  app.get(
    '/stores/:storeId/order-processing',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { storeId } = z.object({ storeId: z.string().uuid() }).parse(req.params)
      if (!(await canManageOrder(req.user!.id, storeId)))
        return reply.code(403).send({ error: 'Order management permission required' })
      return prisma.store.findUniqueOrThrow({
        where: { id: storeId },
        select: { autoAcceptOrders: true, prepTimeMin: true, acceptanceTimeoutMin: true },
      })
    }
  )
}
