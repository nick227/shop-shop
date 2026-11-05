import { prisma } from '../client.js'
import { executeOrderCommand } from './order-lifecycle.service.js'
import { publishOrderStatusChanged } from './order-realtime.publisher.js'
import { runAffiliateCommissions } from './affiliate-commission.service.js'
import { createRefund, retrieveOrderRefund } from '../adapters/payments.adapter.js'

/** Database leases allow multiple server instances. A crash makes unfinished work eligible again. */
export async function processOrderWork(now = new Date(), orderIds?: string[]) {
  const pending = await prisma.orderWork.findMany({
    where: {
      completedAt: null,
      availableAt: { lte: now },
      ...(orderIds ? { orderId: { in: orderIds } } : {}),
    },
    orderBy: { availableAt: 'asc' },
    take: 50,
  })
  for (const work of pending) {
    const lease = new Date(now.getTime() + 120000)
    const claim = await prisma.orderWork.updateMany({
      where: {
        id: work.id,
        completedAt: null,
        availableAt: work.availableAt,
        attempts: work.attempts,
      },
      data: { availableAt: lease, attempts: { increment: 1 } },
    })
    if (!claim.count) continue
    try {
      if (work.kind === 'NOTIFY') {
        const payload = work.payload as {
          oldStatus: string
          newStatus: string
          note?: string
          changedBy?: string
        }
        await publishOrderStatusChanged(work.orderId, payload.oldStatus, payload.newStatus, {
          note: payload.note,
          changedBy: payload.changedBy,
        })
      } else if (work.kind === 'COMMISSION') {
        await runAffiliateCommissions(work.orderId)
      } else if (work.kind === 'REFUND') {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: work.orderId } })
        if (order.paymentStatus !== 'REFUNDED') {
          if (!order.stripePaymentIntentId)
            throw new Error('Manual payment refund requires staff reconciliation')
          // Never create a fresh refund after a provider accepted one; poll its durable ID.
          const refund = order.stripeRefundId
            ? await retrieveOrderRefund(order.stripeRefundId)
            : await createRefund(
                order.stripePaymentIntentId,
                undefined,
                `order-full-refund-${work.id}`
              )
          await prisma.$transaction(async (tx) => {
            const succeeded = refund.status === 'succeeded'
            await tx.order.update({
              where: { id: order.id },
              data: {
                stripeRefundId: refund.id,
                refundError:
                  refund.status === 'failed' || refund.status === 'canceled'
                    ? `Provider refund ${refund.status}`
                    : null,
                refundState: succeeded
                  ? 'SUCCEEDED'
                  : refund.status === 'failed' || refund.status === 'canceled'
                    ? 'FAILED'
                    : 'PENDING',
                ...(succeeded ? { paymentStatus: 'REFUNDED', refundedAt: new Date() } : {}),
              },
            })
            if (succeeded) {
              await tx.orderEvent.create({
                data: {
                  orderId: order.id,
                  status: order.status,
                  note: 'Full refund confirmed',
                  operationId: `refund:${refund.id}`,
                },
              })
              await tx.orderWork.create({
                data: {
                  orderId: order.id,
                  kind: 'NOTIFY',
                  payload: {
                    oldStatus: order.status,
                    newStatus: order.status,
                    note: 'Refund confirmed',
                  },
                },
              })
            }
          })
          if (
            refund.status !== 'succeeded' &&
            refund.status !== 'failed' &&
            refund.status !== 'canceled'
          )
            throw new Error(`Refund ${refund.status}; awaiting provider resolution`)
        }
      }
      await prisma.orderWork.updateMany({
        where: { id: work.id, availableAt: lease },
        data: { completedAt: new Date(), lastError: null },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Order processing failed'
      await prisma.orderWork.updateMany({
        where: { id: work.id, availableAt: lease },
        data: {
          lastError: message,
          availableAt: new Date(
            now.getTime() + Math.min(3600000, 15000 * 2 ** Math.min(work.attempts, 8))
          ),
        },
      })
      if (work.kind === 'REFUND')
        await prisma.order.updateMany({
          where: { id: work.orderId, paymentStatus: { not: 'REFUNDED' } },
          data: {
            refundState: message.includes('pending') ? 'PENDING' : 'FAILED',
            refundError: message,
          },
        })
    }
  }
}

export async function processOrderAcceptance(now = new Date(), orderIds?: string[]) {
  const orders = await prisma.order.findMany({
    where: {
      status: 'PLACED',
      automationEligible: true,
      ...(orderIds ? { id: { in: orderIds } } : {}),
    },
    include: { store: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  for (const order of orders) {
    try {
      // COD orders start their window at creation; card placement sets its own deadline.
      if (!order.acceptanceDeadline) {
        await prisma.order.updateMany({
          where: { id: order.id, status: 'PLACED', acceptanceDeadline: null },
          data: {
            acceptanceDeadline: new Date(
              order.createdAt.getTime() + order.store.acceptanceTimeoutMin * 60000
            ),
          },
        })
        continue
      }
      if (order.acceptanceDeadline <= now) {
        await executeOrderCommand({
          orderId: order.id,
          newStatus: 'CANCELED',
          expectedVersion: order.version,
          note: 'Store did not accept within the acceptance window',
          operationId: `timeout-${order.id}`,
        })
      } else if (
        order.store.autoAcceptOrders &&
        order.store.acceptingOrders &&
        order.store.status === 'ACTIVE'
      ) {
        await executeOrderCommand({
          orderId: order.id,
          newStatus: 'ACCEPTED',
          prepMinutes: order.store.prepTimeMin,
          expectedVersion: order.version,
          operationId: `autoaccept-${order.id}`,
        })
      }
    } catch (error) {
      // A stale row is expected when staff and the worker act at the same time.
      console.warn(
        'Order acceptance processing deferred',
        order.id,
        error instanceof Error ? error.message : error
      )
    }
  }
}

/** A new provider attempt is allowed only after the previous refund definitively failed. */
export async function retryOrderRefund(orderId: string, actorId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
  if (!['FAILED', 'PENDING'].includes(order.refundState))
    throw new Error('No refund awaiting recovery')
  if (order.stripeRefundId) {
    const previous = await retrieveOrderRefund(order.stripeRefundId)
    if (previous.status === 'failed' || previous.status === 'canceled') {
      await prisma.$transaction(async (tx) => {
        const claim = await tx.order.updateMany({
          where: {
            id: orderId,
            version: order.version,
            stripeRefundId: order.stripeRefundId,
            paymentStatus: 'PAID',
          },
          data: {
            stripeRefundId: null,
            refundState: 'PENDING',
            refundError: null,
            version: { increment: 1 },
          },
        })
        if (!claim.count) throw new Error('Refund changed. Refresh before retrying.')
        await tx.orderWork.updateMany({
          where: { orderId, kind: 'REFUND', completedAt: null },
          data: { completedAt: new Date() },
        })
        await tx.orderWork.create({ data: { orderId, kind: 'REFUND', payload: {} } })
        await tx.orderEvent.create({
          data: {
            orderId,
            status: order.status,
            actorId,
            note: `Retry requested after provider refund ${previous.id} ${previous.status}`,
          },
        })
      })
      return
    }
  }
  // Do not steal an active two-minute lease. A near-term retry is already scheduled.
  await prisma.orderWork.updateMany({
    where: {
      orderId,
      kind: 'REFUND',
      completedAt: null,
      availableAt: { gt: new Date(Date.now() + 120000) },
    },
    data: { availableAt: new Date() },
  })
}
