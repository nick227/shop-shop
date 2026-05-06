import { describe, expect, it } from 'vitest'
import {
  PAYABLE_ORDER_STATUSES,
  computePayoutBreakdownCents,
  decimalToCents,
  isInUtcPeriodInclusiveExclusive,
  isPayableOrder,
  snapshotOrderForPayout,
} from './payout-calculation.service.js'

describe('payout-calculation.service', () => {
  describe('PAYABLE_ORDER_STATUSES', () => {
    it('matches v1 contract', () => {
      expect(PAYABLE_ORDER_STATUSES).toEqual(['DELIVERED', 'COMPLETED'])
    })
  })

  describe('isPayableOrder', () => {
    it('excludes every non-terminal status', () => {
      const nonTerminalStatuses = [
        'PENDING_PAYMENT',
        'PLACED',
        'ACCEPTED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'CANCELED',
      ]

      for (const status of nonTerminalStatuses) {
        expect(isPayableOrder({ status, paymentStatus: 'PAID' })).toBe(false)
      }
    })

    it('unpaid DELIVERED/COMPLETED order is not payable', () => {
      expect(isPayableOrder({ status: 'DELIVERED', paymentStatus: 'UNPAID' })).toBe(false)
      expect(isPayableOrder({ status: 'COMPLETED', paymentStatus: 'UNPAID' })).toBe(false)
    })

    it('paid DELIVERED/COMPLETED order is payable', () => {
      expect(isPayableOrder({ status: 'DELIVERED', paymentStatus: 'PAID' })).toBe(true)
      expect(isPayableOrder({ status: 'COMPLETED', paymentStatus: 'PAID' })).toBe(true)
    })
  })

  describe('decimalToCents', () => {
    it('rounds half-up to integer cents', () => {
      expect(decimalToCents('0')).toBe(0)
      expect(decimalToCents('1.00')).toBe(100)
      expect(decimalToCents('1.005')).toBe(101)
      expect(decimalToCents('1.004')).toBe(100)
    })
  })

  describe('computePayoutBreakdownCents', () => {
    it('totals match included order contributions', () => {
      const o1 = snapshotOrderForPayout({
        id: 'o1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: '10.00',
        serviceFeeAmount: '1.00',
        tip: '2.00',
        netToVendor: '9.00',
      })
      const o2 = snapshotOrderForPayout({
        id: 'o2',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        subtotal: '25.50',
        serviceFeeAmount: '2.55',
        tip: '0.00',
        netToVendor: '22.95',
      })

      const breakdown = computePayoutBreakdownCents({ orders: [o1, o2] })

      expect(breakdown.grossSalesCents).toBe(1000 + 2550)
      expect(breakdown.platformFeesCents).toBe(100 + 255)
      expect(breakdown.tipsCents).toBe(200 + 0)
      expect(breakdown.netPayoutCents).toBe((900 + 200) + (2295 + 0))
    })

    it('applies adjustments to net payout (future payouts only)', () => {
      const o1 = snapshotOrderForPayout({
        id: 'o1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: '10.00',
        serviceFeeAmount: '1.00',
        tip: '0.00',
        netToVendor: '9.00',
      })

      const breakdown = computePayoutBreakdownCents({
        orders: [o1],
        adjustments: [{ type: 'DEBIT', amountCents: 250 }],
      })

      expect(breakdown.netPayoutCents).toBe(900 - 250)
    })
  })

  describe('isInUtcPeriodInclusiveExclusive', () => {
    it('period boundary excludes order exactly at periodEnd', () => {
      const periodStart = new Date('2026-05-01T00:00:00.000Z')
      const periodEnd = new Date('2026-05-08T00:00:00.000Z')

      expect(isInUtcPeriodInclusiveExclusive({ at: periodStart, periodStart, periodEnd })).toBe(true)
      expect(isInUtcPeriodInclusiveExclusive({ at: new Date(periodEnd.getTime() - 1), periodStart, periodEnd })).toBe(
        true,
      )
      expect(isInUtcPeriodInclusiveExclusive({ at: periodEnd, periodStart, periodEnd })).toBe(false)
    })
  })
})

import { describe, expect, it } from 'vitest'
import {
  PAYABLE_ORDER_STATUSES,
  computePayoutBreakdownCents,
  decimalToCents,
  isInUtcPeriodInclusiveExclusive,
  isPayableOrder,
  snapshotOrderForPayout,
} from './payout-calculation.service.js'

describe('payout-calculation.service', () => {
  describe('PAYABLE_ORDER_STATUSES', () => {
    it('matches v1 contract', () => {
      expect(PAYABLE_ORDER_STATUSES).toEqual(['DELIVERED', 'COMPLETED'])
    })
  })

  describe('isPayableOrder', () => {
    it('excludes every non-terminal status', () => {
      const nonTerminalStatuses = [
        'PENDING_PAYMENT',
        'PLACED',
        'ACCEPTED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'CANCELED',
      ]

      for (const status of nonTerminalStatuses) {
        expect(isPayableOrder({ status, paymentStatus: 'PAID' })).toBe(false)
      }
    })

    it('unpaid DELIVERED/COMPLETED order is not payable', () => {
      expect(isPayableOrder({ status: 'DELIVERED', paymentStatus: 'UNPAID' })).toBe(false)
      expect(isPayableOrder({ status: 'COMPLETED', paymentStatus: 'UNPAID' })).toBe(false)
    })

    it('paid DELIVERED/COMPLETED order is payable', () => {
      expect(isPayableOrder({ status: 'DELIVERED', paymentStatus: 'PAID' })).toBe(true)
      expect(isPayableOrder({ status: 'COMPLETED', paymentStatus: 'PAID' })).toBe(true)
    })
  })

  describe('decimalToCents', () => {
    it('rounds half-up to integer cents', () => {
      expect(decimalToCents('0')).toBe(0)
      expect(decimalToCents('1.00')).toBe(100)
      expect(decimalToCents('1.005')).toBe(101)
      expect(decimalToCents('1.004')).toBe(100)
    })
  })

  describe('computePayoutBreakdownCents', () => {
    it('totals match included order contributions', () => {
      const o1 = snapshotOrderForPayout({
        id: 'o1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: '10.00',
        serviceFeeAmount: '1.00',
        tip: '2.00',
        netToVendor: '9.00',
      })
      const o2 = snapshotOrderForPayout({
        id: 'o2',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        subtotal: '25.50',
        serviceFeeAmount: '2.55',
        tip: '0.00',
        netToVendor: '22.95',
      })

      const breakdown = computePayoutBreakdownCents({ orders: [o1, o2] })

      expect(breakdown.grossSalesCents).toBe(1000 + 2550)
      expect(breakdown.platformFeesCents).toBe(100 + 255)
      expect(breakdown.tipsCents).toBe(200 + 0)
      expect(breakdown.netPayoutCents).toBe((900 + 200) + (2295 + 0))
    })

    it('applies adjustments to net payout (future payouts only)', () => {
      const o1 = snapshotOrderForPayout({
        id: 'o1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: '10.00',
        serviceFeeAmount: '1.00',
        tip: '0.00',
        netToVendor: '9.00',
      })

      const breakdown = computePayoutBreakdownCents({
        orders: [o1],
        adjustments: [{ type: 'DEBIT', amountCents: 250 }],
      })

      expect(breakdown.netPayoutCents).toBe(900 - 250)
    })
  })

  describe('isInUtcPeriodInclusiveExclusive', () => {
    it('period boundary excludes order exactly at periodEnd', () => {
      const periodStart = new Date('2026-05-01T00:00:00.000Z')
      const periodEnd = new Date('2026-05-08T00:00:00.000Z')

      expect(isInUtcPeriodInclusiveExclusive({ at: periodStart, periodStart, periodEnd })).toBe(true)
      expect(isInUtcPeriodInclusiveExclusive({ at: new Date(periodEnd.getTime() - 1), periodStart, periodEnd })).toBe(
        true,
      )
      expect(isInUtcPeriodInclusiveExclusive({ at: periodEnd, periodStart, periodEnd })).toBe(false)
    })
  })
})

