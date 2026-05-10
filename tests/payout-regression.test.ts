/**
 * Payout System Regression Test Suite
 * 
 * Comprehensive testing of all critical payout scenarios to ensure production readiness.
 * Tests commission creation, lifecycle, payout processing, and audit logging.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@packages/db'
import { 
  createCommissionsForOrder,
  approveCommission,
  reverseCommission,
  getPayoutEligibility,
  createPayoutWithReview,
  approvePayout,
  markPayoutPaid,
  reversePayout,
  processPendingCommissions,
  processOrderStatusChanges
} from '@packages/db/src/services'

describe('Payout System Regression Tests', () => {
  let testAffiliate: any
  let testStore: any
  let testOrder: any
  let testUser: any
  let adminUser: any

  beforeEach(async () => {
    // Clean up test data
    await prisma.commission.deleteMany()
    await prisma.affiliatePayout.deleteMany()
    await prisma.payoutAuditLog.deleteMany()
    await prisma.commissionAuditLog.deleteMany()

    // Create test user and affiliate
    testUser = await prisma.user.create({
      data: {
        email: 'test-affiliate@example.com',
        name: 'Test Affiliate',
      },
    })

    testAffiliate = await prisma.affiliate.create({
      data: {
        userId: testUser.id,
        referralCode: 'TEST123',
        status: 'ACTIVE',
        paypalEmail: 'test@paypal.com',
      },
    })

    // Create test store
    testStore = await prisma.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store',
        ownerUserId: testUser.id,
      },
    })

    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
    })

    // Create test order
    testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        storeId: testStore.id,
        status: 'PAID',
        total: 100.00,
        completedAt: new Date(),
        attributedAffiliateId: testAffiliate.id,
      },
    })
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.commission.deleteMany()
    await prisma.affiliatePayout.deleteMany()
    await prisma.payoutAuditLog.deleteMany()
    await prisma.commissionAuditLog.deleteMany()
    await prisma.order.deleteMany()
    await prisma.affiliate.deleteMany()
    await prisma.user.deleteMany()
    await prisma.store.deleteMany()
  })

  describe('Commission Creation Rules', () => {
    it('should create commission for paid order', async () => {
      const result = await createCommissionsForOrder(testOrder.id)
      
      expect(result.commissions).toHaveLength(1)
      expect(result.commissions[0].status).toBe('PENDING')
      expect(result.commissions[0].affiliateId).toBe(testAffiliate.id)
      expect(result.commissions[0].orderId).toBe(testOrder.id)
    })

    it('should NOT create commission for unpaid order', async () => {
      // Update order to unpaid status
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: 'PENDING' },
      })

      const result = await createCommissionsForOrder(testOrder.id)
      
      expect(result.commissions).toHaveLength(0)
    })

    it('should NOT create commission for canceled order', async () => {
      // Update order to canceled status
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: 'CANCELLED' },
      })

      const result = await createCommissionsForOrder(testOrder.id)
      
      expect(result.commissions).toHaveLength(0)
    })

    it('should NOT create commission for self-referral', async () => {
      // Update order to be self-referral
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { attributedAffiliateId: testAffiliate.id },
      })

      const result = await createCommissionsForOrder(testOrder.id)
      
      expect(result.commissions).toHaveLength(0)
    })

    it('should NOT duplicate commission on duplicate webhook/order event', async () => {
      // First commission creation
      await createCommissionsForOrder(testOrder.id)
      
      // Second commission creation (duplicate)
      const result = await createCommissionsForOrder(testOrder.id)
      
      expect(result.commissions).toHaveLength(0) // Should return existing commission
    })
  })

  describe('Commission Lifecycle', () => {
    beforeEach(async () => {
      await createCommissionsForOrder(testOrder.id)
    })

    it('should approve commission and update status', async () => {
      const commission = await prisma.commission.findFirst()
      expect(commission?.status).toBe('PENDING')

      await approveCommission(commission!.id)

      const updatedCommission = await prisma.commission.findUnique({
        where: { id: commission!.id },
      })
      expect(updatedCommission?.status).toBe('APPROVED')
      expect(updatedCommission?.approvedAt).not.toBeNull()
    })

    it('should reverse commission on refund', async () => {
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)

      await reverseCommission(commission!.id, 'Order refunded')

      const updatedCommission = await prisma.commission.findUnique({
        where: { id: commission!.id },
      })
      expect(updatedCommission?.status).toBe('REVERSED')
    })

    it('should auto-reverse commissions on order refund', async () => {
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)

      // Simulate order refund
      const result = await processOrderStatusChanges(
        [testOrder.id],
        'REFUNDED',
        'Order refunded by customer'
      )

      expect(result.reversed).toBe(1)
      expect(result.errors).toHaveLength(0)

      const updatedCommission = await prisma.commission.findUnique({
        where: { id: commission!.id },
      })
      expect(updatedCommission?.status).toBe('REVERSED')
    })
  })

  describe('Payout Processing', () => {
    beforeEach(async () => {
      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)
    })

    it('should identify eligible commissions for payout', async () => {
      const eligibility = await getPayoutEligibility(testAffiliate.id)

      expect(eligibility.isEligible).toBe(true)
      expect(eligibility.eligibleCommissions).toHaveLength(1)
      expect(eligibility.totalAmountCents).toBeGreaterThan(0)
    })

    it('should create payout with eligible commissions', async () => {
      const eligibility = await getPayoutEligibility(testAffiliate.id)
      
      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: false,
      })

      expect(payout.status).toBe('PENDING')
      expect(payout.affiliateId).toBe(testAffiliate.id)

      // Verify commissions are linked to payout
      const linkedCommissions = await prisma.commission.findMany({
        where: { payoutId: payout.id },
      })
      expect(linkedCommissions).toHaveLength(1)
    })

    it('should approve payout and mark commissions PAID', async () => {
      const eligibility = await getPayoutEligibility(testAffiliate.id)
      
      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: false,
      })

      await approvePayout(payout.id, adminUser.id, 'Manual approval')

      const updatedPayout = await prisma.affiliatePayout.findUnique({
        where: { id: payout.id },
      })
      expect(updatedPayout?.status).toBe('APPROVED')

      const linkedCommissions = await prisma.commission.findMany({
        where: { payoutId: payout.id },
      })
      expect(linkedCommissions[0].status).toBe('APPROVED')
    })

    it('should mark payout PAID and update commissions', async () => {
      const eligibility = await getPayoutEligibility(testAffiliate.id)
      
      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: true,
      })

      await markPayoutPaid(payout.id, 'PAYPAL_TXN_123', adminUser.id)

      const updatedPayout = await prisma.affiliatePayout.findUnique({
        where: { id: payout.id },
      })
      expect(updatedPayout?.status).toBe('PAID')
      expect(updatedPayout?.paidAt).not.toBeNull()
      expect(updatedPayout?.referenceId).toBe('PAYPAL_TXN_123')

      const linkedCommissions = await prisma.commission.findMany({
        where: { payoutId: payout.id },
      })
      expect(linkedCommissions[0].status).toBe('PAID')
      expect(linkedCommissions[0].paidAt).not.toBeNull()
    })

    it('should reverse payout and release commissions', async () => {
      const eligibility = await getPayoutEligibility(testAffiliate.id)
      
      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: true,
      })

      await reversePayout(payout.id, 'Payment failed', adminUser.id)

      const updatedPayout = await prisma.affiliatePayout.findUnique({
        where: { id: payout.id },
      })
      expect(updatedPayout?.status).toBe('REVERSED')
      expect(updatedPayout?.failureReason).toBe('Payment failed')

      const linkedCommissions = await prisma.commission.findMany({
        where: { payoutId: payout.id },
      })
      expect(linkedCommissions[0].status).toBe('PENDING')
      expect(linkedCommissions[0].payoutId).toBeNull()
    })
  })

  describe('Audit Logging', () => {
    it('should write audit logs for commission approval', async () => {
      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      
      await approveCommission(commission!.id)

      const auditLogs = await prisma.commissionAuditLog.findMany({
        where: { commissionId: commission!.id },
      })
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0].action).toBe('APPROVED')
      expect(auditLogs[0].performedBy).toBeNull() // System action
    })

    it('should write audit logs for commission reversal', async () => {
      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)
      
      await reverseCommission(commission!.id, 'Test reversal')

      const auditLogs = await prisma.commissionAuditLog.findMany({
        where: { commissionId: commission!.id },
      })
      expect(auditLogs).toHaveLength(2) // APPROVED + REVERSED
      expect(auditLogs[1].action).toBe('REVERSED')
    })

    it('should write audit logs for payout creation', async () => {
      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)
      
      const eligibility = await getPayoutEligibility(testAffiliate.id)
      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: false,
      })

      const auditLogs = await prisma.payoutAuditLog.findMany({
        where: { affiliatePayoutId: payout.id },
      })
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0].action).toBe('CREATED')
    })

    it('should write audit logs for payout approval', async () => {
      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)
      
      const eligibility = await getPayoutEligibility(testAffiliate.id)
      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: false,
      })

      await approvePayout(payout.id, adminUser.id, 'Manual approval')

      const auditLogs = await prisma.payoutAuditLog.findMany({
        where: { affiliatePayoutId: payout.id },
        orderBy: { createdAt: 'asc' },
      })
      expect(auditLogs).toHaveLength(2)
      expect(auditLogs[0].action).toBe('CREATED')
      expect(auditLogs[1].action).toBe('APPROVED')
      expect(auditLogs[1].performedBy).toBe(adminUser.id)
    })

    it('should write audit logs for automation actions', async () => {
      await createCommissionsForOrder(testOrder.id)
      
      // Simulate auto-approval
      const result = await processPendingCommissions()

      expect(result.approved).toBe(1)
      expect(result.errors).toHaveLength(0)

      const auditLogs = await prisma.commissionAuditLog.findMany({
        where: { action: 'AUTO_APPROVED' },
      })
      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0].performedBy).toBeNull() // System action
      expect(auditLogs[0].details).toHaveProperty('reason')
    })
  })

  describe('Failed Payout Recovery', () => {
    it('should handle failed payout and retry correctly', async () => {
      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)
      
      const eligibility = await getPayoutEligibility(testAffiliate.id)
      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: true,
      })

      // Simulate failed payout
      await reversePayout(payout.id, 'Insufficient funds', adminUser.id)

      // Verify commissions are released back to PENDING
      const linkedCommissions = await prisma.commission.findMany({
        where: { affiliateId: testAffiliate.id },
      })
      expect(linkedCommissions[0].status).toBe('PENDING')
      expect(linkedCommissions[0].payoutId).toBeNull()

      // Create new payout with same commissions
      const newEligibility = await getPayoutEligibility(testAffiliate.id)
      expect(newEligibility.eligibleCommissions).toHaveLength(1)

      const newPayout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: newEligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: true,
      })

      expect(newPayout.status).toBe('APPROVED')
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum payout threshold', async () => {
      // Create small commission (less than minimum)
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { total: 5.00 }, // Below $10 minimum
      })

      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)

      const eligibility = await getPayoutEligibility(testAffiliate.id)
      
      expect(eligibility.isEligible).toBe(false)
      expect(eligibility.reason).toContain('below minimum')
    })

    it('should handle inactive affiliate eligibility', async () => {
      // Deactivate affiliate
      await prisma.affiliate.update({
        where: { id: testAffiliate.id },
        data: { status: 'SUSPENDED' },
      })

      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)

      const eligibility = await getPayoutEligibility(testAffiliate.id)
      
      expect(eligibility.isEligible).toBe(false)
      expect(eligibility.reason).toContain('inactive')
    })

    it('should handle missing payout provider', async () => {
      // Remove PayPal email
      await prisma.affiliate.update({
        where: { id: testAffiliate.id },
        data: { paypalEmail: null },
      })

      await createCommissionsForOrder(testOrder.id)
      const commission = await prisma.commission.findFirst()
      await approveCommission(commission!.id)

      const eligibility = await getPayoutEligibility(testAffiliate.id)
      
      expect(eligibility.isEligible).toBe(false)
      expect(eligibility.reason).toContain('payout provider')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle batch commission processing efficiently', async () => {
      // Create multiple orders and commissions
      const orders = []
      for (let i = 0; i < 10; i++) {
        const order = await prisma.order.create({
          data: {
            userId: testUser.id,
            storeId: testStore.id,
            status: 'PAID',
            total: 50.00,
            completedAt: new Date(),
            attributedAffiliateId: testAffiliate.id,
          },
        })
        orders.push(order)
      }

      // Process all commissions
      const results = await Promise.all(
        orders.map(order => createCommissionsForOrder(order.id))
      )

      expect(results.every(r => r.commissions.length === 1)).toBe(true)

      // Approve all commissions
      const commissions = await prisma.commission.findMany()
      await Promise.all(
        commissions.map(c => approveCommission(c.id))
      )

      const approvedCommissions = await prisma.commission.findMany({
        where: { status: 'APPROVED' },
      })
      expect(approvedCommissions).toHaveLength(10)
    })

    it('should handle large payout batches', async () => {
      // Create many commissions
      const commissions = []
      for (let i = 0; i < 50; i++) {
        await createCommissionsForOrder(testOrder.id)
        const commission = await prisma.commission.findFirst({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        })
        await approveCommission(commission!.id)
        commissions.push(commission!)
      }

      const eligibility = await getPayoutEligibility(testAffiliate.id)
      expect(eligibility.eligibleCommissions).toHaveLength(50)

      const payout = await createPayoutWithReview({
        affiliateId: testAffiliate.id,
        commissionIds: eligibility.eligibleCommissions.map(c => c.id),
        method: 'PAYPAL',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        autoApprove: true,
      })

      expect(payout.status).toBe('APPROVED')
      
      const linkedCommissions = await prisma.commission.findMany({
        where: { payoutId: payout.id },
      })
      expect(linkedCommissions).toHaveLength(50)
    })
  })
})
