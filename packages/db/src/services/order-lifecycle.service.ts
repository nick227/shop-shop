import { randomInt, createHash } from 'node:crypto'
import { prisma } from '../client.js'
import { assertValidTransition, allowedOrderActions } from '../order-state-machine.js'
import type { OrderStatus, Prisma } from '../generated/client/index.js'

export class OrderConflict extends Error {
  statusCode = 409
}
export interface OrderCommand {
  customerOnly?: boolean
  orderId: string
  newStatus?: OrderStatus
  changedBy?: string
  note?: string
  prepMinutes?: number
  expectedVersion?: number
  operationId?: string
  collectionCode?: string
}

/** The only fulfillment writer. CAS protects against concurrent staff actions; events and work commit together. */
export async function executeOrderCommand(input: OrderCommand) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { store: true },
    })
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          status: input.newStatus,
          prep: input.prepMinutes,
          note: input.note,
          code: input.collectionCode,
        })
      )
      .digest('hex')
    const operationId = input.operationId
      ? createHash('sha256')
          .update(`${input.orderId}:${input.changedBy}:${input.operationId}`)
          .digest('hex')
      : undefined
    if (operationId) {
      const prior = await tx.orderEvent.findUnique({ where: { operationId } })
      if (prior) {
        if (prior.requestFingerprint !== fingerprint)
          throw new OrderConflict('This request key was already used for another action')
        return order
      }
    }
    if (input.expectedVersion !== undefined && order.version !== input.expectedVersion)
      throw new OrderConflict('Order changed. Refresh and try again.')
    if (
      input.customerOnly &&
      (input.newStatus !== 'CANCELED' ||
        !['PENDING_PAYMENT', 'PLACED', 'CANCELED'].includes(order.status))
    )
      throw new OrderConflict('Contact the store to cancel after acceptance')
    const target = input.newStatus ?? order.status
    const adjusting = input.newStatus === undefined && input.prepMinutes !== undefined
    if (target === order.status && !adjusting) return order
    if (adjusting && !['ACCEPTED', 'PREPARING'].includes(order.status))
      throw new OrderConflict('Only an order being prepared can have its estimate adjusted')
    if (!adjusting) assertValidTransition(order.status, target, order.deliveryType)
    if (target === 'PLACED' && order.paymentStatus !== 'PAID')
      throw new OrderConflict('Payment confirmation is required for placement')
    if (
      target === 'ACCEPTED' &&
      !adjusting &&
      order.automationEligible &&
      order.acceptanceDeadline &&
      order.acceptanceDeadline <= new Date()
    )
      throw new OrderConflict('The acceptance window has ended')
    if (target === 'ACCEPTED' || adjusting) {
      if (
        !Number.isInteger(input.prepMinutes) ||
        input.prepMinutes! < 1 ||
        input.prepMinutes! > 240
      )
        throw new OrderConflict('Choose a preparation time between 1 and 240 minutes')
      if (target === 'ACCEPTED' && order.stripePaymentIntentId && order.paymentStatus !== 'PAID')
        throw new OrderConflict('Payment must be confirmed before acceptance')
    }
    if (
      target === 'COMPLETED' &&
      order.collectionCode &&
      input.collectionCode !== order.collectionCode
    )
      throw new OrderConflict('Collection code does not match')
    if (target === 'CANCELED' && !input.note?.trim())
      throw new OrderConflict('A cancellation reason is required')
    const now = new Date()
    const needsRefund =
      target === 'CANCELED' && order.paymentStatus === 'PAID' && order.refundState === 'NONE'
    const data: Prisma.OrderUpdateManyMutationInput = { status: target, version: { increment: 1 } }
    if (target === 'ACCEPTED' || adjusting)
      data.promisedReadyAt = new Date(now.getTime() + input.prepMinutes! * 60000)
    if (target === 'ACCEPTED' && !adjusting) {
      data.acceptedAt = now
      if (order.deliveryType === 'PICKUP')
        data.collectionCode = order.collectionCode ?? String(randomInt(100000, 1000000))
    }
    if (target === 'PLACED')
      data.acceptanceDeadline = new Date(now.getTime() + order.store.acceptanceTimeoutMin * 60000)
    if (target === 'READY') data.readyAt = now
    if (target === 'COMPLETED') data.collectedAt = now
    if (target === 'CANCELED')
      Object.assign(data, {
        canceledAt: now,
        canceledBy: input.changedBy ?? null,
        cancelReason: input.note,
        ...(needsRefund ? { refundState: 'PENDING' } : {}),
      })
    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        version: order.version,
        status: order.status,
        updatedAt: order.updatedAt,
      },
      data,
    })
    if (updated.count !== 1)
      throw new OrderConflict('Another action changed this order. Refresh and try again.')
    const note =
      input.note ??
      (target === 'ACCEPTED' || adjusting
        ? `Ready time confirmed: ${new Date(now.getTime() + input.prepMinutes! * 60000).toISOString()}`
        : null)
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: target,
        note,
        actorId:
          input.changedBy && /^[0-9a-f-]{36}$/i.test(input.changedBy) ? input.changedBy : null,
        operationId,
        requestFingerprint: fingerprint,
      },
    })
    await tx.orderWork.create({
      data: {
        orderId: order.id,
        kind: 'NOTIFY',
        payload: {
          oldStatus: order.status,
          newStatus: target,
          note,
          changedBy: input.changedBy ?? 'system',
        },
      },
    })
    if (needsRefund)
      await tx.orderWork.create({ data: { orderId: order.id, kind: 'REFUND', payload: {} } })
    if (target === 'COMPLETED' || target === 'DELIVERED')
      await tx.orderWork.create({ data: { orderId: order.id, kind: 'COMMISSION', payload: {} } })
    return tx.order.findUniqueOrThrow({ where: { id: order.id } })
  })
}

export function orderOperations(
  order: {
    status: string
    deliveryType: string
    promisedReadyAt: Date | null
    refundState: string
    acceptanceDeadline: Date | null
  },
  now = new Date()
) {
  const overdue = Boolean(
    order.promisedReadyAt &&
      order.promisedReadyAt < now &&
      ['ACCEPTED', 'PREPARING'].includes(order.status)
  )
  return {
    allowedActions: allowedOrderActions(order),
    canAdjustEstimate: ['ACCEPTED', 'PREPARING'].includes(order.status),
    overdue,
    exceptions: [
      overdue ? 'Preparation overdue' : '',
      ['PENDING', 'FAILED'].includes(order.refundState)
        ? `Refund ${order.refundState.toLowerCase()}`
        : '',
      order.status === 'PLACED' && order.acceptanceDeadline && order.acceptanceDeadline < now
        ? 'Acceptance overdue'
        : '',
    ].filter(Boolean),
  }
}
