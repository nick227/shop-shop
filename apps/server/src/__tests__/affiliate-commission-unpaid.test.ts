/**
 * Affiliate commission should not accrue on unpaid orders (e.g. COD until collected).
 */
import { randomUUID } from 'crypto'
import { describe, it, expect, afterAll } from 'vitest'
import { prisma, Decimal, calculateCommissionForOrder } from '@packages/db'
import {
  createAuthenticatedUser,
  createTestStore,
  cleanupTestData,
  TEST_NAMESPACE,
} from './helpers.js'

describe('calculateCommissionForOrder', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: TEST_NAMESPACE } } })
    await cleanupTestData()
  })

  it('does not create a commission when paymentStatus is not PAID', async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode: `${TEST_NAMESPACE}-REF-${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
        commissionRate: new Decimal('0.10'),
      },
    })

    const vendor = await createAuthenticatedUser('VENDOR')
    const store = await createTestStore(vendor.id, { isPublished: true })
    const buyer = await createAuthenticatedUser('USER')

    const total = new Decimal('50.00')
    const order = await prisma.order.create({
      data: {
        userId: buyer.id,
        storeId: store.id,
        referredByAffiliateId: affiliate.id,
        status: 'PLACED',
        paymentStatus: 'UNPAID',
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
        subtotal: new Decimal('40.00'),
        fees: new Decimal('2.00'),
        tax: new Decimal('3.00'),
        tip: new Decimal('0'),
        total,
        serviceFeePercent: new Decimal('5.00'),
        serviceFeeAmount: new Decimal('2.50'),
        netToVendor: new Decimal('47.50'),
      },
    })

    await calculateCommissionForOrder(order.id)

    const commissionCount = await prisma.commission.count({ where: { orderId: order.id } })
    expect(commissionCount).toBe(0)

    await prisma.order.delete({ where: { id: order.id } })
    await prisma.affiliate.delete({ where: { id: affiliate.id } })
    await cleanupTestData()
    await prisma.user.deleteMany({
      where: { id: { in: [affiliateUser.id, vendor.id, buyer.id] } },
    })
  })
})
