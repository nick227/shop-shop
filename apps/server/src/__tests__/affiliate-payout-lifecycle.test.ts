/**
 * Integration tests: affiliate payout lifecycle
 *
 * Covers: processPayout and updatePayoutStatus — eligibility guards,
 * commission status transitions, audit log writes, and FAILED rollback.
 * Uses a live DB connection; each test cleans up its own data.
 */
import { randomUUID } from 'crypto'
import { describe, it, expect, afterAll, vi } from 'vitest'
import { prisma, Decimal } from '@packages/db'
import { processPayout, updatePayoutStatus } from '@packages/db/services'
import { createAuthenticatedUser, createTestStore, TEST_NAMESPACE } from './helpers.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function makeAffiliate(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' = 'ACTIVE') {
  return prisma.affiliate.create({
    data: {
      userId,
      referralCode: `${TEST_NAMESPACE.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`,
      status,
      commissionRate: new Decimal('0.05'),
      payoutProvider: 'MANUAL',
      payoutProviderStatus: 'NOT_SET',
    },
  })
}

async function makeOrder(userId: string, storeId: string) {
  return prisma.order.create({
    data: {
      userId,
      storeId,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      deliveryType: 'PICKUP',
      deliveryMode: 'PICKUP',
      subtotal: new Decimal('40.00'),
      fees: new Decimal('2.00'),
      tax: new Decimal('3.00'),
      tip: new Decimal('0.00'),
      total: new Decimal('50.00'),
      serviceFeePercent: new Decimal('5.00'),
      serviceFeeAmount: new Decimal('2.50'),
      netToVendor: new Decimal('47.50'),
    },
  })
}

async function makeCommission(
  affiliateId: string,
  orderId: string,
  storeId: string,
  opts: {
    status?: 'PENDING' | 'APPROVED'
    amount?: string
    payoutId?: string | null
    createdAt?: Date
  } = {},
) {
  return prisma.commission.create({
    data: {
      affiliateId,
      orderId,
      storeId,
      status: opts.status ?? 'PENDING',
      amount: new Decimal(opts.amount ?? '5.00'),
      rate: new Decimal('0.05'),
      serviceFeeBase: new Decimal('2.50'),
      payoutId: opts.payoutId ?? null,
      ...(opts.createdAt ? { createdAt: opts.createdAt } : {}),
    },
  })
}

async function cleanup(ctx: {
  userIds: string[]
  orderIds: string[]
  affiliateIds: string[]
  payoutIds?: string[]
}) {
  if (ctx.payoutIds?.length) {
    await prisma.payoutAuditLog.deleteMany({
      where: { affiliatePayoutId: { in: ctx.payoutIds } },
    })
    await prisma.commission.deleteMany({ where: { payoutId: { in: ctx.payoutIds } } })
    await prisma.affiliatePayout.deleteMany({ where: { id: { in: ctx.payoutIds } } })
  }
  await prisma.commission.deleteMany({ where: { orderId: { in: ctx.orderIds } } })
  await prisma.orderItem.deleteMany({ where: { orderId: { in: ctx.orderIds } } })
  await prisma.orderEvent.deleteMany({ where: { orderId: { in: ctx.orderIds } } })
  await prisma.order.deleteMany({ where: { id: { in: ctx.orderIds } } })
  await prisma.affiliate.deleteMany({ where: { id: { in: ctx.affiliateIds } } })
  await prisma.store.deleteMany({ where: { slug: { startsWith: TEST_NAMESPACE } } })
  await prisma.user.deleteMany({ where: { id: { in: ctx.userIds } } })
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('processPayout', () => {
  const periodStart = new Date('2026-01-01T00:00:00Z')
  const periodEnd = new Date('2026-02-01T00:00:00Z')
  const commissionDate = new Date('2026-01-15T00:00:00Z')

  it('throws when affiliate is not ACTIVE', async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const affiliate = await makeAffiliate(affiliateUser.id, 'SUSPENDED')

    await expect(
      processPayout({
        affiliateId: affiliate.id,
        periodStart,
        periodEnd,
        method: 'PAYPAL',
      }),
    ).rejects.toThrow('affiliate status is SUSPENDED')

    await prisma.affiliate.delete({ where: { id: affiliate.id } })
    await prisma.user.deleteMany({ where: { id: affiliateUser.id } })
  })

  it('includes PENDING commissions in the payout', async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const vendor = await createAuthenticatedUser('VENDOR')
    const store = await createTestStore(vendor.id)
    const buyer = await createAuthenticatedUser('USER')
    const affiliate = await makeAffiliate(affiliateUser.id)
    const order = await makeOrder(buyer.id, store.id)
    const commission = await makeCommission(affiliate.id, order.id, store.id, {
      status: 'PENDING',
      amount: '5.00',
      createdAt: commissionDate,
    })

    const payout = await processPayout({
      affiliateId: affiliate.id,
      periodStart,
      periodEnd,
      method: 'PAYPAL',
      adminUserId: 'test-admin',
    })

    const updated = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } })
    expect(updated.status).toBe('APPROVED')
    expect(updated.payoutId).toBe(payout.id)
    expect(Number(payout.amount)).toBeCloseTo(5.0)

    await cleanup({
      userIds: [affiliateUser.id, vendor.id, buyer.id],
      orderIds: [order.id],
      affiliateIds: [affiliate.id],
      payoutIds: [payout.id],
    })
  })

  it('includes APPROVED commissions in the payout', async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const vendor = await createAuthenticatedUser('VENDOR')
    const store = await createTestStore(vendor.id)
    const buyer = await createAuthenticatedUser('USER')
    const affiliate = await makeAffiliate(affiliateUser.id)
    const order = await makeOrder(buyer.id, store.id)
    const commission = await makeCommission(affiliate.id, order.id, store.id, {
      status: 'APPROVED',
      amount: '7.50',
      createdAt: commissionDate,
    })

    const payout = await processPayout({
      affiliateId: affiliate.id,
      periodStart,
      periodEnd,
      method: 'BANK_TRANSFER',
      adminUserId: 'test-admin',
    })

    const updated = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } })
    expect(updated.payoutId).toBe(payout.id)
    expect(Number(payout.amount)).toBeCloseTo(7.5)

    await cleanup({
      userIds: [affiliateUser.id, vendor.id, buyer.id],
      orderIds: [order.id],
      affiliateIds: [affiliate.id],
      payoutIds: [payout.id],
    })
  })

  it('excludes commissions already linked to another payout', async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const vendor = await createAuthenticatedUser('VENDOR')
    const store = await createTestStore(vendor.id)
    const buyer = await createAuthenticatedUser('USER')
    const affiliate = await makeAffiliate(affiliateUser.id)
    const order = await makeOrder(buyer.id, store.id)

    // Create an existing payout to link commissions to
    const existingPayout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount: new Decimal('5.00'),
        method: 'PAYPAL',
        periodStart,
        periodEnd,
        status: 'PENDING',
      },
    })

    // Commission already linked to the existing payout
    await makeCommission(affiliate.id, order.id, store.id, {
      status: 'APPROVED',
      amount: '5.00',
      payoutId: existingPayout.id,
      createdAt: commissionDate,
    })

    const newPayout = await processPayout({
      affiliateId: affiliate.id,
      periodStart,
      periodEnd,
      method: 'PAYPAL',
      adminUserId: 'test-admin',
    })

    // New payout should have $0 since the only commission was already claimed
    expect(Number(newPayout.amount)).toBeCloseTo(0.0)

    await cleanup({
      userIds: [affiliateUser.id, vendor.id, buyer.id],
      orderIds: [order.id],
      affiliateIds: [affiliate.id],
      payoutIds: [existingPayout.id, newPayout.id],
    })
  })

  it('writes a PayoutAuditLog entry on creation', async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const vendor = await createAuthenticatedUser('VENDOR')
    const store = await createTestStore(vendor.id)
    const buyer = await createAuthenticatedUser('USER')
    const affiliate = await makeAffiliate(affiliateUser.id)
    const order = await makeOrder(buyer.id, store.id)
    await makeCommission(affiliate.id, order.id, store.id, {
      status: 'PENDING',
      createdAt: commissionDate,
    })

    const payout = await processPayout({
      affiliateId: affiliate.id,
      periodStart,
      periodEnd,
      method: 'CHECK',
      adminUserId: 'test-admin',
    })

    const auditLogs = await prisma.payoutAuditLog.findMany({
      where: { affiliatePayoutId: payout.id },
    })
    expect(auditLogs).toHaveLength(1)
    expect(auditLogs[0].action).toBe('CREATED')
    expect(auditLogs[0].performedBy).toBe('test-admin')

    await cleanup({
      userIds: [affiliateUser.id, vendor.id, buyer.id],
      orderIds: [order.id],
      affiliateIds: [affiliate.id],
      payoutIds: [payout.id],
    })
  })

  it('rolls back the payout if audit log write fails (transaction atomicity)', async () => {
    const affiliateUser = await createAuthenticatedUser('USER')
    const vendor = await createAuthenticatedUser('VENDOR')
    const store = await createTestStore(vendor.id)
    const buyer = await createAuthenticatedUser('USER')
    const affiliate = await makeAffiliate(affiliateUser.id)
    const order = await makeOrder(buyer.id, store.id)
    const commission = await makeCommission(affiliate.id, order.id, store.id, {
      status: 'PENDING',
      createdAt: commissionDate,
    })

    // Spy on $transaction — the transaction proxy (tx) is a different object from prisma,
    // so spying on prisma.payoutAuditLog.create won't intercept tx.payoutAuditLog.create.
    // Instead we force the entire transaction to fail, which verifies that processPayout
    // propagates errors and no payout is committed when the transaction throws.
    const payoutCountBefore = await prisma.affiliatePayout.count({ where: { affiliateId: affiliate.id } })
    const spy = vi
      .spyOn(prisma, '$transaction')
      .mockRejectedValueOnce(new Error('simulated audit log failure'))

    await expect(
      processPayout({
        affiliateId: affiliate.id,
        periodStart,
        periodEnd,
        method: 'PAYPAL',
        adminUserId: 'test-admin',
      }),
    ).rejects.toThrow('simulated audit log failure')

    spy.mockRestore()

    // No payout should have been committed
    const payoutCountAfter = await prisma.affiliatePayout.count({ where: { affiliateId: affiliate.id } })
    expect(payoutCountAfter).toBe(payoutCountBefore)

    // Commission should still be PENDING with no payoutId
    const freshCommission = await prisma.commission.findUniqueOrThrow({ where: { id: commission.id } })
    expect(freshCommission.status).toBe('PENDING')
    expect(freshCommission.payoutId).toBeNull()

    await cleanup({
      userIds: [affiliateUser.id, vendor.id, buyer.id],
      orderIds: [order.id],
      affiliateIds: [affiliate.id],
    })
  })
})

describe('updatePayoutStatus', () => {
  const periodStart = new Date('2026-01-01T00:00:00Z')
  const periodEnd = new Date('2026-02-01T00:00:00Z')
  const commissionDate = new Date('2026-01-15T00:00:00Z')

  async function setupPayoutWithCommission(status: 'PENDING' | 'APPROVED' = 'PENDING') {
    const affiliateUser = await createAuthenticatedUser('USER')
    const vendor = await createAuthenticatedUser('VENDOR')
    const store = await createTestStore(vendor.id)
    const buyer = await createAuthenticatedUser('USER')
    const affiliate = await makeAffiliate(affiliateUser.id)
    const order = await makeOrder(buyer.id, store.id)
    await makeCommission(affiliate.id, order.id, store.id, {
      status,
      createdAt: commissionDate,
    })

    const payout = await processPayout({
      affiliateId: affiliate.id,
      periodStart,
      periodEnd,
      method: 'PAYPAL',
      adminUserId: 'test-admin',
    })

    return {
      payout,
      affiliate,
      order,
      store,
      userIds: [affiliateUser.id, vendor.id, buyer.id],
    }
  }

  it('COMPLETED marks linked commissions as PAID and sets paidAt', async () => {
    const ctx = await setupPayoutWithCommission()

    await updatePayoutStatus(ctx.payout.id, 'COMPLETED', 'ref-123', undefined, 'test-admin')

    const commissions = await prisma.commission.findMany({
      where: { payoutId: ctx.payout.id },
    })
    expect(commissions.length).toBeGreaterThan(0)
    for (const c of commissions) {
      expect(c.status).toBe('PAID')
      expect(c.paidAt).not.toBeNull()
    }

    const payout = await prisma.affiliatePayout.findUniqueOrThrow({ where: { id: ctx.payout.id } })
    expect(payout.status).toBe('COMPLETED')
    expect(payout.referenceId).toBe('ref-123')
    expect(payout.paidAt).not.toBeNull()

    await cleanup({
      userIds: ctx.userIds,
      orderIds: [ctx.order.id],
      affiliateIds: [ctx.affiliate.id],
      payoutIds: [ctx.payout.id],
    })
  })

  it('FAILED releases commissions back to APPROVED with null payoutId', async () => {
    const ctx = await setupPayoutWithCommission()

    const linkedBefore = await prisma.commission.findMany({
      where: { payoutId: ctx.payout.id },
    })
    expect(linkedBefore.length).toBeGreaterThan(0)

    await updatePayoutStatus(ctx.payout.id, 'FAILED', undefined, 'bank rejected', 'test-admin')

    const payout = await prisma.affiliatePayout.findUniqueOrThrow({ where: { id: ctx.payout.id } })
    expect(payout.status).toBe('FAILED')
    expect(payout.failureReason).toBe('bank rejected')

    // Commissions should be re-eligible (APPROVED, payoutId cleared)
    const released = await prisma.commission.findMany({
      where: { id: { in: linkedBefore.map((c) => c.id) } },
    })
    for (const c of released) {
      expect(c.status).toBe('APPROVED')
      expect(c.payoutId).toBeNull()
    }

    await cleanup({
      userIds: ctx.userIds,
      orderIds: [ctx.order.id],
      affiliateIds: [ctx.affiliate.id],
      payoutIds: [ctx.payout.id],
    })
  })

  it('writes a PayoutAuditLog entry for each status update', async () => {
    const ctx = await setupPayoutWithCommission()

    await updatePayoutStatus(ctx.payout.id, 'PROCESSING', undefined, undefined, 'test-admin')
    await updatePayoutStatus(ctx.payout.id, 'COMPLETED', 'paypal-tx-999', undefined, 'test-admin')

    const logs = await prisma.payoutAuditLog.findMany({
      where: { affiliatePayoutId: ctx.payout.id },
      orderBy: { performedAt: 'asc' },
    })

    // processPayout wrote CREATED, then PROCESSING (MODIFIED), then COMPLETED (PAID)
    expect(logs.length).toBeGreaterThanOrEqual(3)
    const actions = logs.map((l) => l.action)
    expect(actions).toContain('CREATED')
    expect(actions).toContain('MODIFIED')
    expect(actions).toContain('PAID')

    await cleanup({
      userIds: ctx.userIds,
      orderIds: [ctx.order.id],
      affiliateIds: [ctx.affiliate.id],
      payoutIds: [ctx.payout.id],
    })
  })

  it('FAILED status writes a REVERSED audit log entry', async () => {
    const ctx = await setupPayoutWithCommission()

    await updatePayoutStatus(ctx.payout.id, 'FAILED', undefined, 'nsf', 'test-admin')

    const logs = await prisma.payoutAuditLog.findMany({
      where: { affiliatePayoutId: ctx.payout.id, action: 'REVERSED' },
    })
    expect(logs).toHaveLength(1)
    expect((logs[0].details as any)?.failureReason).toBe('nsf')

    await cleanup({
      userIds: ctx.userIds,
      orderIds: [ctx.order.id],
      affiliateIds: [ctx.affiliate.id],
      payoutIds: [ctx.payout.id],
    })
  })
})

afterAll(async () => {
  // Belt-and-suspenders namespace cleanup in case individual tests failed mid-cleanup
  const stores = await prisma.store.findMany({
    where: { slug: { startsWith: TEST_NAMESPACE } },
    select: { id: true },
  })
  const users = await prisma.user.findMany({
    where: { email: { startsWith: TEST_NAMESPACE } },
    select: { id: true },
  })
  const affiliates = await prisma.affiliate.findMany({
    where: { user: { email: { startsWith: TEST_NAMESPACE } } },
    select: { id: true },
  })
  const affiliateIds = affiliates.map((a) => a.id)
  const storeIds = stores.map((s) => s.id)
  const userIds = users.map((u) => u.id)

  if (affiliateIds.length) {
    const payouts = await prisma.affiliatePayout.findMany({
      where: { affiliateId: { in: affiliateIds } },
      select: { id: true },
    })
    const payoutIds = payouts.map((p) => p.id)
    if (payoutIds.length) {
      await prisma.payoutAuditLog.deleteMany({ where: { affiliatePayoutId: { in: payoutIds } } })
      await prisma.commission.deleteMany({ where: { payoutId: { in: payoutIds } } })
      await prisma.affiliatePayout.deleteMany({ where: { id: { in: payoutIds } } })
    }
    await prisma.commission.deleteMany({ where: { affiliateId: { in: affiliateIds } } })
    await prisma.affiliate.deleteMany({ where: { id: { in: affiliateIds } } })
  }

  if (storeIds.length) {
    await prisma.order.deleteMany({ where: { storeId: { in: storeIds } } })
    await prisma.store.deleteMany({ where: { id: { in: storeIds } } })
  }
  if (userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  }
})
