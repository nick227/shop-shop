import { createCheckoutSession, completeCheckout } from '../services/checkout.service'
import { handlePaymentIntentSucceeded } from '../../../../packages/db/src/services/payment.service'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '@packages/db'
import {
  createEnrolledVendor,
  createAuthenticatedUser,
  createTestStore,
  createTestOrder,
  createTestServer,
  authHeaders,
} from './helpers'
import { executeOrderCommand } from '../../../../packages/db/src/services/order-lifecycle.service'
import {
  processOrderAcceptance,
  processOrderWork,
  retryOrderRefund,
} from '../../../../packages/db/src/services/order-operations-worker'
import { allowedOrderActions } from '../../../../packages/db/src/order-state-machine'
import orderOperationsRoutes from '../routes/order-operations.route'

vi.mock('../config/stripeConnectUrls.js', () => ({
  isCodPaymentsEnabled: () => true,
  resolveStripeConnectUrls: () => ({
    returnUrl: 'http://localhost',
    refreshUrl: 'http://localhost',
  }),
}))

const mocks = vi.hoisted(() => ({
  refund: vi.fn(),
  retrieve: vi.fn(),
  notify: vi.fn(),
  commission: vi.fn(),
}))
vi.mock('../../../../packages/db/src/adapters/payments.adapter', () => ({
  createRefund: mocks.refund,
  retrieveOrderRefund: mocks.retrieve,
}))
vi.mock('../../../../packages/db/src/services/order-realtime.publisher', () => ({
  publishOrderStatusChanged: mocks.notify,
}))
vi.mock('../../../../packages/db/src/services/affiliate-commission.service', () => ({
  runAffiliateCommissions: mocks.commission,
}))

describe('Order operations with real database transactions', () => {
  let vendor: Awaited<ReturnType<typeof createEnrolledVendor>>
  let customer: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let outsider: Awaited<ReturnType<typeof createAuthenticatedUser>>
  let store: Awaited<ReturnType<typeof createTestStore>>
  const ids: string[] = []
  const makeOrder = async (delivery = false) => {
    const row = await createTestOrder(customer.id, store.id, { paymentStatus: 'PAID' })
    ids.push(row.id)
    return prisma.order.update({
      where: { id: row.id },
      data: {
        deliveryType: delivery ? 'DELIVERY' : 'PICKUP',
        deliveryMode: delivery ? 'STORE_MANAGED_DELIVERY' : 'PICKUP',
      },
    })
  }
  beforeAll(async () => {
    vendor = await createEnrolledVendor()
    customer = await createAuthenticatedUser()
    outsider = await createAuthenticatedUser()
    store = await createTestStore(vendor.id)
  })
  afterAll(async () => {
    await prisma.orderWork.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.order.deleteMany({ where: { id: { in: ids } } })
    await prisma.store.delete({ where: { id: store.id } })
    await prisma.user.deleteMany({ where: { id: { in: [vendor.id, customer.id, outsider.id] } } })
  })
  it('connects the existing checkout to the complete pickup lifecycle', async () => {
    const item = await prisma.item.create({
      data: { storeId: store.id, title: 'Market lunch bowl', price: 12, isActive: true },
    })
    const session = await createCheckoutSession(customer.id, {
      items: [{ itemId: item.id, quantity: 2 }],
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      paymentMethod: { type: 'CASH', token: 'cod' },
      tipAmount: 0,
    })
    const checkout = await completeCheckout(customer.id, {
      sessionId: session.sessionId,
      paymentMethod: { type: 'CASH', token: 'cod' },
      paymentRail: 'COD',
      tipAmount: 0,
    })
    ids.push(checkout.order.id)
    const accepted = await executeOrderCommand({
      orderId: checkout.order.id,
      newStatus: 'ACCEPTED',
      prepMinutes: 15,
    })
    await executeOrderCommand({ orderId: checkout.order.id, newStatus: 'PREPARING' })
    await executeOrderCommand({ orderId: checkout.order.id, newStatus: 'READY' })
    expect(
      (
        await executeOrderCommand({
          orderId: checkout.order.id,
          newStatus: 'COMPLETED',
          collectionCode: accepted.collectionCode!,
        })
      ).status
    ).toBe('COMPLETED')
    await prisma.cart.delete({ where: { id: session.sessionId } })
    await prisma.item.delete({ where: { id: item.id } })
  })
  it('completes pickup with a confirmed time and verified collection code', async () => {
    const order = await makeOrder()
    const accepted = await executeOrderCommand({
      orderId: order.id,
      newStatus: 'ACCEPTED',
      prepMinutes: 20,
      changedBy: vendor.id,
      operationId: 'accept-pickup',
    })
    expect(accepted.promisedReadyAt!.getTime()).toBeGreaterThan(Date.now() + 19 * 60000)
    expect(accepted.collectionCode).toMatch(/^\d{6}$/)
    await executeOrderCommand({ orderId: order.id, newStatus: 'PREPARING' })
    const ready = await executeOrderCommand({ orderId: order.id, newStatus: 'READY' })
    expect(allowedOrderActions(ready).map((a) => a.status)).toEqual(['COMPLETED', 'CANCELED'])
    await expect(
      executeOrderCommand({ orderId: order.id, newStatus: 'COMPLETED', collectionCode: 'wrong' })
    ).rejects.toThrow('code')
    const collected = await executeOrderCommand({
      orderId: order.id,
      newStatus: 'COMPLETED',
      collectionCode: accepted.collectionCode!,
    })
    expect(collected.collectedAt).not.toBeNull()
    expect(await prisma.orderEvent.count({ where: { orderId: order.id } })).toBe(4)
    expect(await prisma.orderWork.count({ where: { orderId: order.id, kind: 'NOTIFY' } })).toBe(4)
  })
  it('completes delivery and rejects pickup-only completion', async () => {
    const order = await makeOrder(true)
    await executeOrderCommand({ orderId: order.id, newStatus: 'ACCEPTED', prepMinutes: 15 })
    await executeOrderCommand({ orderId: order.id, newStatus: 'PREPARING' })
    await executeOrderCommand({ orderId: order.id, newStatus: 'READY' })
    await expect(
      executeOrderCommand({ orderId: order.id, newStatus: 'COMPLETED' })
    ).rejects.toThrow('fulfillment')
    await executeOrderCommand({ orderId: order.id, newStatus: 'OUT_FOR_DELIVERY' })
    expect((await executeOrderCommand({ orderId: order.id, newStatus: 'DELIVERED' })).status).toBe(
      'DELIVERED'
    )
  })
  it('replays an identical request without duplicate events and rejects key reuse', async () => {
    const order = await makeOrder()
    const input = {
      orderId: order.id,
      newStatus: 'ACCEPTED' as const,
      prepMinutes: 20,
      expectedVersion: 0,
      operationId: 'same-action-key',
    }
    await executeOrderCommand(input)
    await executeOrderCommand(input)
    expect(await prisma.orderEvent.count({ where: { orderId: order.id } })).toBe(1)
    await expect(executeOrderCommand({ ...input, prepMinutes: 30 })).rejects.toThrow('request key')
  })
  it('allows only one conflicting concurrent action to commit', async () => {
    const order = await makeOrder()
    const result = await Promise.allSettled([
      executeOrderCommand({
        orderId: order.id,
        newStatus: 'ACCEPTED',
        prepMinutes: 20,
        expectedVersion: 0,
      }),
      executeOrderCommand({
        orderId: order.id,
        newStatus: 'CANCELED',
        note: 'Out of stock',
        expectedVersion: 0,
      }),
    ])
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(await prisma.orderEvent.count({ where: { orderId: order.id } })).toBe(1)
  })
  it('adjusts the promise without changing preparation status', async () => {
    const order = await makeOrder()
    const accepted = await executeOrderCommand({
      orderId: order.id,
      newStatus: 'ACCEPTED',
      prepMinutes: 10,
    })
    const adjusted = await executeOrderCommand({
      orderId: order.id,
      prepMinutes: 30,
      expectedVersion: accepted.version,
    })
    expect(adjusted.status).toBe('ACCEPTED')
    expect(adjusted.promisedReadyAt!.getTime()).toBeGreaterThan(accepted.promisedReadyAt!.getTime())
  })
  it('auto-accepts with no browser and times out unaccepted paid orders', async () => {
    const order = await makeOrder()
    await prisma.store.update({ where: { id: store.id }, data: { autoAcceptOrders: true } })
    await processOrderAcceptance(new Date(), [order.id])
    await processOrderAcceptance(new Date(), [order.id])
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
      'ACCEPTED'
    )
    await prisma.store.update({ where: { id: store.id }, data: { autoAcceptOrders: false } })
    const late = await makeOrder()
    await prisma.order.update({
      where: { id: late.id },
      data: { acceptanceDeadline: new Date(Date.now() - 1000) },
    })
    await processOrderAcceptance(new Date(), [late.id])
    const canceled = await prisma.order.findUniqueOrThrow({ where: { id: late.id } })
    expect(canceled.status).toBe('CANCELED')
    expect(canceled.refundState).toBe('PENDING')
  })
  it('keeps notification failures durable and retries after the lease', async () => {
    const order = await makeOrder()
    await executeOrderCommand({ orderId: order.id, newStatus: 'ACCEPTED', prepMinutes: 20 })
    mocks.notify.mockRejectedValueOnce(new Error('broker unavailable'))
    await processOrderWork(new Date(), [order.id])
    const work = await prisma.orderWork.findFirstOrThrow({ where: { orderId: order.id } })
    expect(work.lastError).toBe('broker unavailable')
    expect(work.completedAt).toBeNull()
    mocks.notify.mockResolvedValue(undefined)
    await processOrderWork(new Date(Date.now() + 60000), [order.id])
    expect(
      (await prisma.orderWork.findUniqueOrThrow({ where: { id: work.id } })).completedAt
    ).not.toBeNull()
  })
  it('keeps failed refunds visible and confirms payment only after recovery', async () => {
    const order = await makeOrder()
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: `pi_test_${order.id}` },
    })
    await executeOrderCommand({ orderId: order.id, newStatus: 'CANCELED', note: 'Store closed' })
    mocks.refund.mockRejectedValueOnce(new Error('provider unavailable'))
    await processOrderWork(new Date(), [order.id])
    let row = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(row.refundState).toBe('FAILED')
    expect(row.paymentStatus).toBe('PAID')
    mocks.refund.mockResolvedValueOnce({ id: `re_${order.id}`, status: 'succeeded' })
    await processOrderWork(new Date(Date.now() + 60000), [order.id])
    row = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(row.refundState).toBe('SUCCEEDED')
    expect(row.paymentStatus).toBe('REFUNDED')
    expect(mocks.refund).toHaveBeenLastCalledWith(
      `pi_test_${order.id}`,
      undefined,
      expect.stringMatching(/^order-full-refund-/)
    )
  })
  it('rolls back the order if its event cannot be persisted', async () => {
    const order = await makeOrder()
    const original = prisma.$transaction.bind(prisma)
    const spy = vi.spyOn(prisma, '$transaction').mockImplementationOnce(((callback: any) =>
      original(async (tx: any) => {
        const wrapped = new Proxy(tx, {
          get(target, prop) {
            return prop === 'orderEvent'
              ? {
                  ...target.orderEvent,
                  create: async () => {
                    throw new Error('event storage unavailable')
                  },
                }
              : target[prop]
          },
        })
        return callback(wrapped)
      })) as any)
    await expect(
      executeOrderCommand({ orderId: order.id, newStatus: 'ACCEPTED', prepMinutes: 20 })
    ).rejects.toThrow('event storage')
    spy.mockRestore()
    const current = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(current.status).toBe('PLACED')
    expect(current.version).toBe(0)
    expect(await prisma.orderWork.count({ where: { orderId: order.id } })).toBe(0)
  })
  it('polls a pending provider refund instead of issuing another one', async () => {
    const order = await makeOrder()
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: `pi_pending_${order.id}` },
    })
    await executeOrderCommand({ orderId: order.id, newStatus: 'CANCELED', note: 'Unavailable' })
    mocks.refund.mockResolvedValueOnce({ id: `re_pending_${order.id}`, status: 'pending' })
    await processOrderWork(new Date(), [order.id])
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe(
      'PAID'
    )
    mocks.refund.mockClear()
    mocks.retrieve.mockResolvedValueOnce({ id: `re_pending_${order.id}`, status: 'succeeded' })
    await processOrderWork(new Date(Date.now() + 60000), [order.id])
    expect(mocks.refund).not.toHaveBeenCalled()
    expect(mocks.retrieve).toHaveBeenCalledWith(`re_pending_${order.id}`)
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe(
      'REFUNDED'
    )
  })
  it('does not automatically cancel historical orders', async () => {
    const order = await makeOrder()
    await prisma.order.update({
      where: { id: order.id },
      data: { automationEligible: false, acceptanceDeadline: new Date(0) },
    })
    await processOrderAcceptance(new Date(), [order.id])
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
      'PLACED'
    )
  })
  it('starts a new idempotent attempt only after a provider refund definitively fails', async () => {
    const order = await makeOrder()
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: `pi_retry_${order.id}` },
    })
    await executeOrderCommand({
      orderId: order.id,
      newStatus: 'CANCELED',
      note: 'Store rejected order',
    })
    mocks.refund.mockResolvedValueOnce({ id: `re_failed_${order.id}`, status: 'failed' })
    await processOrderWork(new Date(), [order.id])
    const first = await prisma.orderWork.findFirstOrThrow({
      where: { orderId: order.id, kind: 'REFUND' },
    })
    expect(first.completedAt).not.toBeNull()
    mocks.retrieve.mockResolvedValueOnce({ id: `re_failed_${order.id}`, status: 'failed' })
    await retryOrderRefund(order.id, vendor.id)
    mocks.refund.mockResolvedValueOnce({ id: `re_success_${order.id}`, status: 'succeeded' })
    await processOrderWork(new Date(), [order.id])
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe(
      'REFUNDED'
    )
    expect(await prisma.orderWork.count({ where: { orderId: order.id, kind: 'REFUND' } })).toBe(2)
  })
  it('queues a refund for late payment confirmation without reopening cancellation', async () => {
    const order = await makeOrder()
    const intent = `pi_late_${order.id}`
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', stripePaymentIntentId: intent },
    })
    await executeOrderCommand({
      orderId: order.id,
      newStatus: 'CANCELED',
      note: 'Customer canceled',
    })
    await handlePaymentIntentSucceeded(intent)
    await handlePaymentIntentSucceeded(intent)
    const current = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(current.status).toBe('CANCELED')
    expect(current.paymentStatus).toBe('PAID')
    expect(current.refundState).toBe('PENDING')
    expect(await prisma.orderWork.count({ where: { orderId: order.id, kind: 'REFUND' } })).toBe(1)
  })
  it('enforces ownership on tracking and commands over HTTP', async () => {
    const app = await createTestServer()
    await app.register(orderOperationsRoutes, { prefix: '/api' })
    const order = await makeOrder()
    const own = await app.inject({
      method: 'GET',
      url: `/api/orders/${order.id}/operations`,
      headers: authHeaders(customer.token),
    })
    expect(own.statusCode).toBe(200)
    expect(own.json().allowedActions).toEqual([])
    const other = await app.inject({
      method: 'GET',
      url: `/api/orders/${order.id}/operations`,
      headers: authHeaders(outsider.token),
    })
    expect(other.statusCode).toBe(403)
    const denied = await app.inject({
      method: 'POST',
      url: `/api/orders/${order.id}/actions`,
      headers: authHeaders(customer.token),
      payload: {
        status: 'ACCEPTED',
        prepMinutes: 20,
        expectedVersion: 0,
        operationId: 'forbidden-accept',
      },
    })
    expect(denied.statusCode).toBe(403)
    const accepted = await app.inject({
      method: 'POST',
      url: `/api/orders/${order.id}/actions`,
      headers: authHeaders(vendor.token),
      payload: {
        status: 'ACCEPTED',
        prepMinutes: 20,
        expectedVersion: 0,
        operationId: 'vendor-accept',
      },
    })
    expect(accepted.statusCode).toBe(200)
    await app.close()
  })
})
