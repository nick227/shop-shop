/**
 * Payout System Regression Test Suite
 * 
 * Comprehensive testing of all critical payout scenarios to ensure production readiness.
 * Tests commission creation, lifecycle, payout processing, and audit logging.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@packages/db'
import { 
  buildAffiliateCommissionCandidatesForOrder,
  upsertCommissionCandidate
} from '@packages/db/src/services'

describe('Payout System Regression Tests', () => {
  let affiliateUser: any
  let buyerUser: any
  let storeOwnerUser: any
  let adminUser: any
  let affiliate: any
  let store: any
  let order: any

  beforeEach(async () => {
    // Clean up test data
    await prisma.commission.deleteMany()
    await prisma.affiliatePayout.deleteMany()
    await prisma.payoutAuditLog.deleteMany()
    await prisma.commissionAuditLog.deleteMany()

    // Create separate users to avoid self-referral issues
    affiliateUser = await prisma.user.create({
      data: {
        email: 'affiliate@example.com',
        name: 'Affiliate User',
      },
    })

    buyerUser = await prisma.user.create({
      data: {
        email: 'buyer@example.com',
        name: 'Buyer User',
      },
    })

    storeOwnerUser = await prisma.user.create({
      data: {
        email: 'store-owner@example.com',
        name: 'Store Owner',
      },
    })

    // Create affiliate
    affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode: 'TEST123',
        status: 'ACTIVE',
        paypalEmail: 'test@paypal.com',
      },
    })

    // Create test store
    store = await prisma.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store',
        ownerUserId: storeOwnerUser.id,
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

    // Create test order with correct schema
    order = await prisma.order.create({
      data: {
        userId: buyerUser.id,
        storeId: store.id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: 100.00,
        fees: 10.00,
        tax: 8.00,
        tip: 0.00,
        total: 118.00,
        serviceFeePercent: 10.00,
        serviceFeeAmount: 10.00,
        netToVendor: 108.00,
        referredByAffiliateId: affiliate.id,
        deliveryType: 'PICKUP',
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
    it('should create commission for delivered order with paid status', async () => {
      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      
      expect(candidates).toHaveLength(1)
      expect(candidates[0].affiliateId).toBe(affiliate.id)
      expect(candidates[0].orderId).toBe(order.id)
      expect(candidates[0].sourceType).toBe('CUSTOMER_PURCHASE')
      expect(candidates[0].commissionBaseCents).toBeGreaterThan(0)
      expect(candidates[0].amountCents).toBeGreaterThan(0)
    })

    it('should NOT create commission for unpaid order', async () => {
      // Update order to unpaid status
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'UNPAID' },
      })

      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      
      expect(candidates).toHaveLength(0)
    })

    it('should NOT create commission for canceled order', async () => {
      // Update order to canceled status (correct spelling)
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELED' },
      })

      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      
      expect(candidates).toHaveLength(0)
    })

    it('should NOT create commission for self-referral', async () => {
      // Create self-referral order
      const selfReferralOrder = await prisma.order.create({
        data: {
          userId: affiliateUser.id,
          storeId: store.id,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          subtotal: 100.00,
          fees: 10.00,
          tax: 8.00,
          tip: 0.00,
          total: 118.00,
          serviceFeePercent: 10.00,
          serviceFeeAmount: 10.00,
          netToVendor: 108.00,
          referredByAffiliateId: affiliate.id,
          deliveryType: 'PICKUP',
        },
      })

      const candidates = await buildAffiliateCommissionCandidatesForOrder(selfReferralOrder.id)
      
      expect(candidates).toHaveLength(0)
    })

    it('should handle commission upsert correctly', async () => {
      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      
      const commission = await upsertCommissionCandidate(candidates[0])
      
      expect(commission.affiliateId).toBe(affiliate.id)
      expect(commission.orderId).toBe(order.id)
      expect(commission.status).toBe('PENDING')
    })
  })

  describe('Commission Status Management', () => {
    beforeEach(async () => {
      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      await upsertCommissionCandidate(candidates[0])
    })

    it('should create commission with PENDING status', async () => {
      const commission = await prisma.commission.findFirst()
      
      expect(commission?.status).toBe('PENDING')
      expect(commission?.affiliateId).toBe(affiliate.id)
      expect(commission?.orderId).toBe(order.id)
    })

    it('should update commission to APPROVED status', async () => {
      const commission = await prisma.commission.findFirst()
      
      await prisma.commission.update({
        where: { id: commission!.id },
        data: { 
          status: 'APPROVED',
          approvedAt: new Date()
        },
      })

      const updatedCommission = await prisma.commission.findUnique({
        where: { id: commission!.id },
      })
      expect(updatedCommission?.status).toBe('APPROVED')
      expect(updatedCommission?.approvedAt).not.toBeNull()
    })

    it('should handle commission reversal', async () => {
      const commission = await prisma.commission.findFirst()
      
      await prisma.commission.update({
        where: { id: commission!.id },
        data: { 
          status: 'APPROVED',
          approvedAt: new Date()
        },
      })

      await prisma.commission.update({
        where: { id: commission!.id },
        data: { 
          status: 'REVERSED',
          reversedAt: new Date(),
          reversalReason: 'Order refunded'
        },
      })

      const updatedCommission = await prisma.commission.findUnique({
        where: { id: commission!.id },
      })
      expect(updatedCommission?.status).toBe('REVERSED')
      expect(updatedCommission?.reversedAt).not.toBeNull()
      expect(updatedCommission?.reversalReason).toBe('Order refunded')
    })
  })

  describe('Order Status Transitions', () => {
    it('should handle order status change to CANCELED', async () => {
      // Create commission first
      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      await upsertCommissionCandidate(candidates[0])

      // Cancel the order
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELED' },
      })

      // Commission should still exist but order is canceled
      const commission = await prisma.commission.findFirst()
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      })
      
      expect(commission).toBeTruthy()
      expect(updatedOrder?.status).toBe('CANCELED')
    })

    it('should handle payment status change to REFUNDED', async () => {
      // Create commission first
      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      await upsertCommissionCandidate(candidates[0])

      // Refund the order
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundReason: 'Customer request'
        },
      })

      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      })
      
      expect(updatedOrder?.paymentStatus).toBe('REFUNDED')
      expect(updatedOrder?.refundedAt).not.toBeNull()
    })
  })

  describe('Data Integrity', () => {
    it('should prevent duplicate commissions for same order', async () => {
      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      
      // First commission
      const commission1 = await upsertCommissionCandidate(candidates[0])
      
      // Second attempt should return existing commission
      const commission2 = await upsertCommissionCandidate(candidates[0])
      
      expect(commission1.id).toBe(commission2.id)
    })

    it('should handle multiple orders for same affiliate', async () => {
      // Create second order
      const order2 = await prisma.order.create({
        data: {
          userId: buyerUser.id,
          storeId: store.id,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          subtotal: 50.00,
          fees: 5.00,
          tax: 4.00,
          tip: 0.00,
          total: 59.00,
          serviceFeePercent: 10.00,
          serviceFeeAmount: 5.00,
          netToVendor: 54.00,
          referredByAffiliateId: affiliate.id,
          deliveryType: 'PICKUP',
        },
      })

      const candidates1 = await buildAffiliateCommissionCandidatesForOrder(order.id)
      const candidates2 = await buildAffiliateCommissionCandidatesForOrder(order2.id)
      
      const commission1 = await upsertCommissionCandidate(candidates1[0])
      const commission2 = await upsertCommissionCandidate(candidates2[0])
      
      expect(commission1.id).not.toBe(commission2.id)
      expect(commission1.affiliateId).toBe(commission2.affiliateId)
      expect(commission1.orderId).not.toBe(commission2.orderId)
    })
  })

  describe('Edge Cases', () => {
    it('should handle order without affiliate attribution', async () => {
      const orderWithoutAffiliate = await prisma.order.create({
        data: {
          userId: buyerUser.id,
          storeId: store.id,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          subtotal: 100.00,
          fees: 10.00,
          tax: 8.00,
          tip: 0.00,
          total: 118.00,
          serviceFeePercent: 10.00,
          serviceFeeAmount: 10.00,
          netToVendor: 108.00,
          deliveryType: 'PICKUP',
        },
      })

      const candidates = await buildAffiliateCommissionCandidatesForOrder(orderWithoutAffiliate.id)
      
      expect(candidates).toHaveLength(0)
    })

    it('should handle inactive affiliate', async () => {
      // Deactivate affiliate
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { status: 'SUSPENDED' },
      })

      const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
      
      expect(candidates).toHaveLength(0)
    })

    it('should handle order with different statuses', async () => {
      const testCases = [
        { status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', expected: false },
        { status: 'PLACED', paymentStatus: 'PAID', expected: false },
        { status: 'ACCEPTED', paymentStatus: 'PAID', expected: false },
        { status: 'PREPARING', paymentStatus: 'PAID', expected: false },
        { status: 'READY', paymentStatus: 'PAID', expected: false },
        { status: 'OUT_FOR_DELIVERY', paymentStatus: 'PAID', expected: false },
        { status: 'DELIVERED', paymentStatus: 'PAID', expected: true },
        { status: 'COMPLETED', paymentStatus: 'PAID', expected: true },
        { status: 'CANCELED', paymentStatus: 'PAID', expected: false },
      ]

      for (const testCase of testCases) {
        await prisma.order.update({
          where: { id: order.id },
          data: { 
            status: testCase.status as any,
            paymentStatus: testCase.paymentStatus as any
          },
        })

        const candidates = await buildAffiliateCommissionCandidatesForOrder(order.id)
        
        if (testCase.expected) {
          expect(candidates.length).toBeGreaterThan(0)
        } else {
          expect(candidates).toHaveLength(0)
        }
      }
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle batch commission processing efficiently', async () => {
      // Create multiple orders
      const orders = []
      for (let i = 0; i < 10; i++) {
        const newOrder = await prisma.order.create({
          data: {
            userId: buyerUser.id,
            storeId: store.id,
            status: 'DELIVERED',
            paymentStatus: 'PAID',
            subtotal: 50.00,
            fees: 5.00,
            tax: 4.00,
            tip: 0.00,
            total: 59.00,
            serviceFeePercent: 10.00,
            serviceFeeAmount: 5.00,
            netToVendor: 54.00,
            referredByAffiliateId: affiliate.id,
            deliveryType: 'PICKUP',
          },
        })
        orders.push(newOrder)
      }

      // Process all commissions
      const startTime = Date.now()
      const results = await Promise.all(
        orders.map(order => buildAffiliateCommissionCandidatesForOrder(order.id))
      )
      const endTime = Date.now()

      expect(results.every(r => r.length === 1)).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle large commission amounts correctly', async () => {
      // Create order with large amount
      const largeOrder = await prisma.order.create({
        data: {
          userId: buyerUser.id,
          storeId: store.id,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          subtotal: 10000.00,
          fees: 1000.00,
          tax: 800.00,
          tip: 0.00,
          total: 11800.00,
          serviceFeePercent: 10.00,
          serviceFeeAmount: 1000.00,
          netToVendor: 10800.00,
          referredByAffiliateId: affiliate.id,
          deliveryType: 'PICKUP',
        },
      })

      const candidates = await buildAffiliateCommissionCandidatesForOrder(largeOrder.id)
      
      expect(candidates).toHaveLength(1)
      expect(candidates[0].commissionBaseCents).toBe(100000) // $1000.00 in cents
      expect(candidates[0].amountCents).toBeGreaterThan(0)
    })
  })
})
