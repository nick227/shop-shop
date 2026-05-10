/**
 * processOrderPayment rejects invalid PM tokens and blocks card until Connect is ready.
 */
import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, processOrderPayment } from '@packages/db'

describe('processOrderPayment routing gate', () => {
  let userId: string
  let storeId: string
  let orderId: string

  beforeEach(async () => {
    const u = await prisma.user.create({
      data: {
        email: `gate-${randomUUID()}@example.com`,
        passwordHash: 'x',
        name: 'Gate Test',
      },
    })
    userId = u.id
    const s = await prisma.store.create({
      data: {
        ownerUserId: userId,
        name: 'Gate Store',
        slug: `gate-store-${randomUUID()}`,
        prepTimeMin: 15,
      },
    })
    storeId = s.id
    const o = await prisma.order.create({
      data: {
        userId,
        storeId,
        status: 'PENDING_PAYMENT',
        deliveryType: 'PICKUP',
        paymentStatus: 'UNPAID',
        subtotal: 10,
        fees: 0,
        tax: 0.8,
        tip: 0,
        total: 10.8,
        serviceFeePercent: 3,
        serviceFeeAmount: 0.3,
        netToVendor: 10.5,
      },
    })
    orderId = o.id
  })

  it('rejects cod_test and cod_* tokens', async () => {
    await expect(
      processOrderPayment({ orderId, userId, paymentMethodId: 'cod_test' }),
    ).rejects.toThrow(/INVALID_STRIPE_PAYMENT_METHOD/)

    await expect(
      processOrderPayment({ orderId, userId, paymentMethodId: 'cod_whatever' }),
    ).rejects.toThrow(/INVALID_STRIPE_PAYMENT_METHOD/)
  })

  it('blocks card charge until Connect + charges are enabled', async () => {
    await expect(
      processOrderPayment({ orderId, userId, paymentMethodId: 'pm_card_visa' }),
    ).rejects.toThrow(/STORE_CARD_PAYMENTS_UNAVAILABLE/)
  })
})
