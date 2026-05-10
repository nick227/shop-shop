import { describe, expect, it } from 'vitest'
import {
  resolveRateFromValues,
  calculateCommissionAmountCents,
  applyDualCommissionCap,
} from './affiliate-commission.service.js'
import type { CommissionCandidate } from './affiliate-commission.service.js'

// ─── resolveRateFromValues ────────────────────────────────────────────────────

describe('resolveRateFromValues', () => {
  it('returns USER_OVERRIDE when overrideBps is set', () => {
    const result = resolveRateFromValues(750, 500, 500, 'group-1')
    expect(result).toEqual({ rateBps: 750, rateSource: 'USER_OVERRIDE', payoutGroupIdSnapshot: 'group-1' })
  })

  it('treats zero override as a valid value (not a fallthrough)', () => {
    const result = resolveRateFromValues(0, 500, 500, 'group-1')
    expect(result).toEqual({ rateBps: 0, rateSource: 'USER_OVERRIDE', payoutGroupIdSnapshot: 'group-1' })
  })

  it('falls through to PAYOUT_GROUP when overrideBps is null', () => {
    const result = resolveRateFromValues(null, 800, 500, 'group-2')
    expect(result).toEqual({ rateBps: 800, rateSource: 'PAYOUT_GROUP', payoutGroupIdSnapshot: 'group-2' })
  })

  it('falls through to PLATFORM_DEFAULT when both override and group are null', () => {
    const result = resolveRateFromValues(null, null, 500, null)
    expect(result).toEqual({ rateBps: 500, rateSource: 'PLATFORM_DEFAULT', payoutGroupIdSnapshot: null })
  })

  it('snapshots payoutGroupId as null for PLATFORM_DEFAULT even when id was provided', () => {
    // When no group rate is set (groupBps === null) there is no active group → snapshot should be null.
    const result = resolveRateFromValues(null, null, 500, 'stale-group')
    expect(result.payoutGroupIdSnapshot).toBeNull()
  })
})

// ─── calculateCommissionAmountCents ──────────────────────────────────────────

describe('calculateCommissionAmountCents', () => {
  it('computes 5% of $10 = 50 cents', () => {
    expect(calculateCommissionAmountCents(1000, 500)).toBe(50)
  })

  it('rounds half-up correctly', () => {
    // 333 * 500 / 10000 = 16.65 → rounds to 17
    expect(calculateCommissionAmountCents(333, 500)).toBe(17)
  })

  it('returns 0 when rate is 0', () => {
    expect(calculateCommissionAmountCents(5000, 0)).toBe(0)
  })

  it('returns 0 when base is 0', () => {
    expect(calculateCommissionAmountCents(0, 500)).toBe(0)
  })

  it('handles large values without overflow', () => {
    // $10,000 service fee at 50% = $5,000
    expect(calculateCommissionAmountCents(1_000_000, 5000)).toBe(500_000)
  })
})

// ─── applyDualCommissionCap ───────────────────────────────────────────────────

function makeCandidate(
  overrides: Partial<CommissionCandidate> & { sourceType: CommissionCandidate['sourceType'] },
): CommissionCandidate {
  return {
    affiliateId: 'aff-1',
    orderId: 'ord-1',
    storeId: 'sto-1',
    commissionBaseCents: 1000,
    rateBps: 500,
    amountCents: 50,
    rateSource: 'PLATFORM_DEFAULT',
    payoutGroupIdSnapshot: null,
    ...overrides,
  }
}

describe('applyDualCommissionCap', () => {
  it('returns empty array unchanged', () => {
    expect(applyDualCommissionCap([], 1000, 5000)).toEqual([])
  })

  it('does not cap when total burden is within limit', () => {
    // maxBurdenBps = 5000 → max = 50 cents on $1 fee
    // CUSTOMER_PURCHASE = 10 cents, STORE_REVENUE = 10 cents → total = 20 cents, under limit
    const candidates = [
      makeCandidate({ sourceType: 'CUSTOMER_PURCHASE', amountCents: 10 }),
      makeCandidate({ sourceType: 'STORE_REVENUE', amountCents: 10, affiliateId: 'aff-2' }),
    ]
    const result = applyDualCommissionCap(candidates, 100, 5000)
    expect(result.find((c) => c.sourceType === 'CUSTOMER_PURCHASE')!.amountCents).toBe(10)
    expect(result.find((c) => c.sourceType === 'STORE_REVENUE')!.amountCents).toBe(10)
  })

  it('CUSTOMER_PURCHASE is paid in full first; STORE_REVENUE gets the remainder', () => {
    // serviceFeeAmountCents = 1000, maxBurdenBps = 1000 → maxBurdenCents = 100
    // CUSTOMER_PURCHASE = 80 → paid in full, remaining = 20
    // STORE_REVENUE = 60 → capped to 20
    const candidates = [
      makeCandidate({ sourceType: 'CUSTOMER_PURCHASE', amountCents: 80 }),
      makeCandidate({ sourceType: 'STORE_REVENUE', amountCents: 60, affiliateId: 'aff-2' }),
    ]
    const result = applyDualCommissionCap(candidates, 1000, 1000)
    expect(result.find((c) => c.sourceType === 'CUSTOMER_PURCHASE')!.amountCents).toBe(80)
    expect(result.find((c) => c.sourceType === 'STORE_REVENUE')!.amountCents).toBe(20)
  })

  it('caps both to 0 when maxBurdenBps is 0', () => {
    const candidates = [
      makeCandidate({ sourceType: 'CUSTOMER_PURCHASE', amountCents: 50 }),
      makeCandidate({ sourceType: 'STORE_REVENUE', amountCents: 50, affiliateId: 'aff-2' }),
    ]
    const result = applyDualCommissionCap(candidates, 1000, 0)
    expect(result.every((c) => c.amountCents === 0)).toBe(true)
  })

  it('handles single STORE_REVENUE candidate correctly', () => {
    // maxBurdenCents = 30, STORE_REVENUE = 50 → capped to 30
    const candidates = [makeCandidate({ sourceType: 'STORE_REVENUE', amountCents: 50 })]
    const result = applyDualCommissionCap(candidates, 1000, 300)
    expect(result[0]!.amountCents).toBe(30)
  })

  it('returns original candidate object when no cap is applied', () => {
    const candidate = makeCandidate({ sourceType: 'CUSTOMER_PURCHASE', amountCents: 5 })
    const result = applyDualCommissionCap([candidate], 1000, 5000)
    expect(result[0]).toBe(candidate) // same reference — not a copy
  })

  it('preserves all candidate fields when capping', () => {
    const candidate = makeCandidate({
      sourceType: 'STORE_REVENUE',
      amountCents: 100,
      affiliateId: 'aff-x',
      rateSource: 'USER_OVERRIDE',
      payoutGroupIdSnapshot: 'grp-1',
    })
    const result = applyDualCommissionCap([candidate], 1000, 0)
    expect(result[0]).toMatchObject({
      affiliateId: 'aff-x',
      rateSource: 'USER_OVERRIDE',
      payoutGroupIdSnapshot: 'grp-1',
      amountCents: 0,
    })
  })
})
