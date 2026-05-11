import { nanoid } from 'nanoid'
import { prisma } from '../client.js'
import type {
  Affiliate,
  Commission,
  AffiliatePayout,
  AffiliateStatus,
  CommissionStatus,
  PayoutStatus,
} from '../generated/client'
import {
  buildAffiliateCommissionCandidatesForOrder,
  upsertCommissionCandidate,
  runAffiliateCommissions,
} from './affiliate-commission.service.js'
import {
  createAffiliateTransfer,
  createAffiliateConnectAccount,
  createAccountLink,
  createExpressLoginLink,
  retrieveAccount,
} from '../adapters/payments.adapter.js'

export interface CreateAffiliateInput {
  userId: string
  bio?: string
  website?: string
  paypalEmail?: string
  taxId?: string
}

export interface UpdateAffiliateInput {
  bio?: string
  website?: string
  paypalEmail?: string
  taxId?: string
  bankAccountJson?: unknown
}

export interface CreateCommissionInput {
  affiliateId: string
  orderId: string
  storeId: string
  amount: number
  rate: number
  serviceFeeBase: number
}

export interface ProcessPayoutInput {
  affiliateId: string
  periodStart: Date
  periodEnd: Date
  method: string
  adminUserId?: string
}

export async function createAffiliate(input: CreateAffiliateInput): Promise<Affiliate> {
  const referralCode = `${nanoid(8).toUpperCase()}`

  return prisma.$transaction(async (tx) => {
    const affiliate = await tx.affiliate.create({
      data: {
        userId: input.userId,
        referralCode,
        bio: input.bio,
        website: input.website,
        paypalEmail: input.paypalEmail,
        taxId: input.taxId,
        status: 'ACTIVE',
      },
    })

    // Role is a single enum today. Only promote USER -> AFFILIATE to avoid clobbering
    // other roles (e.g. VENDOR) while still supporting instant activation.
    await tx.user.updateMany({
      where: { id: input.userId, role: 'USER' },
      data: { role: 'AFFILIATE' },
    })

    return affiliate
  })
}

export async function getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
  return prisma.affiliate.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          referredStores: true,
          commissions: true,
        },
      },
    },
  })
}

export async function getAffiliateByReferralCode(referralCode: string): Promise<Affiliate | null> {
  return prisma.affiliate.findUnique({
    where: { referralCode },
  })
}

/**
 * Resolves an affiliate from a public referral token.
 * Tries `referralSlug` first (vanity URL), falls back to `referralCode` (canonical).
 */
export async function getAffiliateBySlugOrCode(token: string): Promise<Affiliate | null> {
  const trimmed = token.trim()
  if (!trimmed) return null

  const bySlug = await prisma.affiliate.findUnique({ where: { referralSlug: trimmed } })
  if (bySlug) return bySlug

  return prisma.affiliate.findUnique({ where: { referralCode: trimmed.toUpperCase() } })
}

export async function updateAffiliate(
  affiliateId: string,
  input: UpdateAffiliateInput
): Promise<Affiliate> {
  return prisma.affiliate.update({
    where: { id: affiliateId },
    data: input as object,
  })
}

export async function updateAffiliateStatus(
  affiliateId: string,
  status: AffiliateStatus
): Promise<Affiliate> {
  const affiliate = await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { status },
  })

  // Legacy behavior: activating an affiliate can optionally promote USER -> AFFILIATE.
  // Avoid clobbering other roles (e.g. VENDOR).
  if (status === 'ACTIVE') {
    await prisma.user.updateMany({
      where: { id: affiliate.userId, role: 'USER' },
      data: { role: 'AFFILIATE' },
    })
  }

  return affiliate
}

export async function getAffiliateStats(affiliateId: string) {
  const [affiliate, totalCommissions, paidCommissions, unpaidCommissions, referredStores] =
    await Promise.all([
      prisma.affiliate.findUnique({
        where: { id: affiliateId },
        select: { commissionRate: true, customerRateBpsOverride: true, storeRateBpsOverride: true },
      }),
      // Total excludes REVERSED so reversed commissions don't inflate the number
      prisma.commission.aggregate({
        where: { affiliateId, status: { not: 'REVERSED' } },
        _sum: { amount: true, amountCents: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { affiliateId, status: 'PAID' },
        _sum: { amount: true, amountCents: true },
        _count: true,
      }),
      // PENDING = created but not yet approved; APPROVED = committed to next payout batch
      // Both are "unpaid" from the affiliate's perspective
      prisma.commission.aggregate({
        where: { affiliateId, status: { in: ['PENDING', 'APPROVED'] } },
        _sum: { amount: true, amountCents: true },
        _count: true,
      }),
      prisma.store.count({
        where: { referredByAffiliateId: affiliateId },
      }),
    ])

  const toAmount = (decimal: any, cents: any) =>
    cents != null ? cents / 100 : Number(decimal || 0)

  return {
    affiliate,
    // Top-level commissionRate for quick display (decimal form, e.g. 0.05 = 5%)
    commissionRate: affiliate?.commissionRate ?? null,
    stats: {
      totalEarnings: toAmount(totalCommissions._sum.amount, totalCommissions._sum.amountCents),
      paidEarnings: toAmount(paidCommissions._sum.amount, paidCommissions._sum.amountCents),
      // "pendingEarnings" kept for backwards compat; now correctly includes APPROVED
      pendingEarnings: toAmount(unpaidCommissions._sum.amount, unpaidCommissions._sum.amountCents),
      unpaidEarnings: toAmount(unpaidCommissions._sum.amount, unpaidCommissions._sum.amountCents),
      totalCommissions: totalCommissions._count,
      referredStores,
    },
  }
}

export async function createCommission(input: CreateCommissionInput): Promise<Commission> {
  return prisma.commission.create({
    data: {
      affiliateId: input.affiliateId,
      orderId: input.orderId,
      storeId: input.storeId,
      amount: input.amount,
      rate: input.rate,
      serviceFeeBase: input.serviceFeeBase,
      status: 'PENDING',
    },
  })
}

export async function approveCommission(commissionId: string): Promise<Commission> {
  return prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  })
}

export async function getCommissionsByAffiliate(
  affiliateId: string,
  options?: {
    status?: CommissionStatus
    limit?: number
    offset?: number
  }
) {
  const where = {
    affiliateId,
    ...(options?.status && { status: options.status }),
  }

  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.commission.count({ where }),
  ])

  return { commissions, total }
}

export async function processPayout(input: ProcessPayoutInput): Promise<AffiliatePayout> {
  const affiliate = await prisma.affiliate.findUnique({ where: { id: input.affiliateId } })
  if (!affiliate) throw new Error('Affiliate not found')
  if (affiliate.status !== 'ACTIVE') {
    throw new Error(`Cannot create payout: affiliate status is ${affiliate.status}`)
  }

  // PayPal is not automated — no server-side transfer logic exists yet.
  if (input.method === 'PAYPAL') {
    throw new Error(
      'PayPal payouts are not automated. Use MANUAL or STRIPE_TRANSFER instead.',
    )
  }

  // Validate provider readiness before creating the payout record so we never
  // create a PENDING payout that markPayoutAsPaid will immediately fail.
  if (
    input.method === 'STRIPE_TRANSFER' &&
    (affiliate.payoutProvider !== 'STRIPE_CONNECT' ||
      !affiliate.payoutProviderAccountId ||
      affiliate.payoutProviderStatus !== 'ACTIVE')
  ) {
    throw new Error(
      'Affiliate is not ready for Stripe payouts. ' +
      'Ensure the affiliate has connected their Stripe account and onboarding is complete.'
    )
  }

  return prisma.$transaction(async (tx) => {
    // Include both PENDING and APPROVED commissions in the period — promotes PENDING in the same txn
    const eligibleCommissions = await tx.commission.findMany({
      where: {
        affiliateId: input.affiliateId,
        status: { in: ['PENDING', 'APPROVED'] },
        payoutId: null,
        createdAt: { gte: input.periodStart, lt: input.periodEnd },
      },
      select: { id: true, amount: true, amountCents: true, status: true, payoutId: true },
    })

    // Prefer amountCents (integer, exact); fall back to the legacy Decimal for old rows.
    const totalAmountCents = eligibleCommissions.reduce(
      (sum, c) => sum + (c.amountCents ?? Math.round(Number(c.amount) * 100)),
      0,
    )

    const payout = await tx.affiliatePayout.create({
      data: {
        affiliateId: input.affiliateId,
        amount: totalAmountCents / 100,
        method: input.method,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        status: 'PENDING',
      },
    })

    if (eligibleCommissions.length > 0) {
      await tx.commission.updateMany({
        where: { id: { in: eligibleCommissions.map((c) => c.id) } },
        data: { status: 'APPROVED', approvedAt: new Date(), payoutId: payout.id },
      })
    }

    await tx.payoutAuditLog.create({
      data: {
        affiliateId: input.affiliateId,
        affiliatePayoutId: payout.id,
        action: 'CREATED',
        performedBy: input.adminUserId ?? null,
        details: {
          method: input.method,
          commissionCount: eligibleCommissions.length,
          totalAmountCents,
          periodStart: input.periodStart.toISOString(),
          periodEnd: input.periodEnd.toISOString(),
        },
      },
    })

    return payout
  })
}

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  referenceId?: string,
  failureReason?: string,
  adminUserId?: string,
): Promise<AffiliatePayout> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.affiliatePayout.findUniqueOrThrow({ where: { id: payoutId } })

    const data: Record<string, unknown> = { status }
    if (referenceId) data.referenceId = referenceId
    if (failureReason) data.failureReason = failureReason

    if (status === 'COMPLETED') {
      data.paidAt = new Date()
      await tx.commission.updateMany({
        where: { payoutId },
        data: { status: 'PAID', paidAt: new Date() },
      })
    }

    if (status === 'FAILED') {
      // Release commissions back to APPROVED so they can be included in a future payout
      await tx.commission.updateMany({
        where: { payoutId },
        data: { status: 'APPROVED', payoutId: null },
      })
    }

    const payout = await tx.affiliatePayout.update({ where: { id: payoutId }, data })

    const auditAction =
      status === 'COMPLETED' ? 'PAID' :
      status === 'FAILED' ? 'REVERSED' :
      'MODIFIED'

    await tx.payoutAuditLog.create({
      data: {
        affiliateId: existing.affiliateId,
        affiliatePayoutId: payoutId,
        action: auditAction,
        performedBy: adminUserId ?? null,
        details: {
          previousStatus: existing.status,
          newStatus: status,
          referenceId: referenceId ?? null,
          failureReason: failureReason ?? null,
        },
      },
    })

    return payout
  })
}

export async function getAffiliatePayouts(
  affiliateId: string,
  options?: {
    status?: PayoutStatus
    limit?: number
    offset?: number
  }
) {
  const where = {
    affiliateId,
    ...(options?.status && { status: options.status }),
  }

  const [payouts, total] = await Promise.all([
    prisma.affiliatePayout.findMany({
      where,
      include: {
        _count: {
          select: {
            commissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.affiliatePayout.count({ where }),
  ])

  return { payouts, total }
}

// Alias kept for backward compatibility with existing callers and tests.
export const calculateCommissionForOrder = runAffiliateCommissions

export interface CreatePayoutWithReviewInput {
  affiliateId: string
  periodStart: string
  periodEnd: string
  method: string
  reviewNotes?: string
  autoApprove?: boolean
}

export async function checkPayoutEligibility(affiliateId: string): Promise<{
  eligible: boolean
  affiliateStatus: AffiliateStatus | null
  eligibleCommissionCount: number
  estimatedAmount: number
  reason?: string
}> {
  const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } })
  if (!affiliate) {
    return { eligible: false, affiliateStatus: null, eligibleCommissionCount: 0, estimatedAmount: 0, reason: 'Affiliate not found' }
  }
  if (affiliate.status !== 'ACTIVE') {
    return { eligible: false, affiliateStatus: affiliate.status, eligibleCommissionCount: 0, estimatedAmount: 0, reason: `Affiliate status is ${affiliate.status}` }
  }
  const commissions = await prisma.commission.findMany({
    where: { affiliateId, status: { in: ['PENDING', 'APPROVED'] }, payoutId: null },
    select: { amount: true, amountCents: true },
  })
  const estimatedAmount = commissions.reduce(
    (sum, c) => sum + (c.amountCents ?? Math.round(Number(c.amount) * 100)) / 100,
    0,
  )
  return {
    eligible: commissions.length > 0,
    affiliateStatus: affiliate.status,
    eligibleCommissionCount: commissions.length,
    estimatedAmount,
    reason: commissions.length === 0 ? 'No eligible commissions' : undefined,
  }
}

export async function approvePayout(
  payoutId: string,
  adminUserId: string,
  notes?: string,
): Promise<AffiliatePayout> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.affiliatePayout.findUniqueOrThrow({ where: { id: payoutId } })
    if (existing.status !== 'PENDING') {
      throw new Error(`Cannot approve payout: status is ${existing.status}`)
    }
    const updated = await tx.affiliatePayout.update({
      where: { id: payoutId },
      data: { status: 'PROCESSING' },
    })
    await tx.payoutAuditLog.create({
      data: {
        affiliateId: existing.affiliateId,
        affiliatePayoutId: payoutId,
        action: 'APPROVED',
        performedBy: adminUserId,
        details: { previousStatus: 'PENDING', notes: notes ?? null },
      },
    })
    return updated
  })
}

export async function createPayoutWithReview(
  input: CreatePayoutWithReviewInput,
  adminUserId: string,
): Promise<string> {
  const eligibility = await checkPayoutEligibility(input.affiliateId)
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? 'Affiliate is not eligible for a payout')
  }
  const payout = await processPayout({
    affiliateId: input.affiliateId,
    periodStart: new Date(input.periodStart),
    periodEnd: new Date(input.periodEnd),
    method: input.method,
    adminUserId,
  })
  if (input.autoApprove) {
    await approvePayout(payout.id, adminUserId, input.reviewNotes)
  }
  return payout.id
}

export async function markPayoutAsPaid(
  payoutId: string,
  adminUserId: string,
  paymentReference?: string,
): Promise<AffiliatePayout> {
  // Load payout + affiliate provider config in one query.
  const payout = await prisma.affiliatePayout.findUniqueOrThrow({
    where: { id: payoutId },
    include: {
      affiliate: {
        select: { payoutProvider: true, payoutProviderAccountId: true },
      },
    },
  })

  // Fire a Stripe transfer when the payout is configured for Stripe Connect and
  // no external reference was already supplied by the admin (manual override).
  if (
    !paymentReference &&
    payout.method === 'STRIPE_TRANSFER' &&
    payout.affiliate.payoutProvider === 'STRIPE_CONNECT' &&
    payout.affiliate.payoutProviderAccountId
  ) {
    const amountCents = Math.round(Number(payout.amount) * 100)
    if (amountCents <= 0) {
      throw new Error('Cannot issue Stripe transfer: payout amount is $0.00')
    }
    try {
      const { transferId } = await createAffiliateTransfer({
        amountCents,
        destinationAccountId: payout.affiliate.payoutProviderAccountId,
        payoutId,
        idempotencyKey: `affiliate-payout-${payoutId}`,
      })
      paymentReference = transferId
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Stripe transfer failed'
      // Release commissions back to APPROVED so a retry payout can recapture them.
      await updatePayoutStatus(payoutId, 'FAILED', undefined, reason, adminUserId)
      throw new Error(`Stripe transfer failed: ${reason}`)
    }
  }

  return updatePayoutStatus(payoutId, 'COMPLETED', paymentReference, undefined, adminUserId)
}

export async function reversePayout(
  payoutId: string,
  adminUserId: string,
  reason: string,
): Promise<AffiliatePayout> {
  return updatePayoutStatus(payoutId, 'FAILED', undefined, reason, adminUserId)
}

export async function getPayoutAuditLogs(affiliateId?: string, limit = 50) {
  return prisma.payoutAuditLog.findMany({
    where: affiliateId ? { affiliateId } : undefined,
    include: {
      affiliate: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { performedAt: 'desc' },
    take: limit,
  })
}

export async function exportAffiliatePayoutsToCSV(
  affiliateId?: string,
  dateRange?: { start: Date; end: Date },
): Promise<string> {
  const payouts = await prisma.affiliatePayout.findMany({
    where: {
      ...(affiliateId ? { affiliateId } : {}),
      ...(dateRange ? { createdAt: { gte: dateRange.start, lte: dateRange.end } } : {}),
    },
    include: {
      affiliate: { select: { id: true, user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = [
    ['Payout ID', 'Affiliate', 'Email', 'Amount', 'Method', 'Status', 'Period Start', 'Period End', 'Paid At', 'Reference ID', 'Failure Reason', 'Created At'],
    ...payouts.map((p) => [
      p.id,
      p.affiliate.user.name ?? '',
      p.affiliate.user.email,
      String(p.amount),
      p.method,
      p.status,
      p.periodStart.toISOString(),
      p.periodEnd.toISOString(),
      p.paidAt?.toISOString() ?? '',
      p.referenceId ?? '',
      p.failureReason ?? '',
      p.createdAt.toISOString(),
    ]),
  ]
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export async function listAffiliates(options?: {
  status?: AffiliateStatus
  limit?: number
  offset?: number
}) {
  const where = options?.status ? { status: options.status } : {}

  const [affiliates, total] = await Promise.all([
    prisma.affiliate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            referredStores: true,
            commissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.affiliate.count({ where }),
  ])

  return { affiliates, total }
}

export async function getReferralEvents(
  affiliateId: string,
  options?: {
    eventType?: 'STORE_SIGNUP' | 'USER_SIGNUP'
    limit?: number
    offset?: number
  },
) {
  const where = {
    ...(affiliateId ? { affiliateId } : {}),
    ...(options?.eventType && { eventType: options.eventType }),
  }

  const [events, total] = await Promise.all([
    prisma.referralEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.referralEvent.count({ where }),
  ])

  return { events, total }
}

export async function getReferredUsers(affiliateId: string) {
  return prisma.user.findMany({
    where: { referredByAffiliateId: affiliateId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReferredStores(affiliateId: string) {
  return prisma.store.findMany({
    where: { referredByAffiliateId: affiliateId },
    select: {
      id: true,
      name: true,
      slug: true,
      isPublished: true,
      createdAt: true,
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { orders: true, items: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReferredOrders(affiliateId: string) {
  return prisma.order.findMany({
    where: {
      referredByAffiliateId: affiliateId,
      status: { notIn: ['CANCELED'] },
    },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      affiliateAttributionSource: true,
      store: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

// ========================================
// Stripe Connect Onboarding
// ========================================

/**
 * Start or resume Stripe Connect Express onboarding for an affiliate.
 * - Creates a new Express account if the affiliate has none yet.
 * - Generates a fresh account link every time (links expire after a few minutes).
 * Returns the Stripe-hosted onboarding URL.
 */
export async function initiateAffiliatePayoutConnect(
  affiliateId: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<{ url: string; accountId: string }> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      payoutProvider: true,
      payoutProviderAccountId: true,
      payoutProviderStatus: true,
      user: { select: { email: true } },
    },
  })

  if (!affiliate) throw new Error('Affiliate not found')

  let accountId = affiliate.payoutProviderAccountId

  if (!accountId) {
    const result = await createAffiliateConnectAccount({ email: affiliate.user.email })
    accountId = result.accountId

    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        payoutProvider: 'STRIPE_CONNECT',
        payoutProviderAccountId: accountId,
        payoutProviderStatus: 'PENDING',
      },
    })
  }

  const { url } = await createAccountLink({ accountId, returnUrl, refreshUrl })
  return { url, accountId }
}

/**
 * Generate a Stripe Express dashboard login link for an already-active affiliate Connect account.
 * Use this for affiliates whose `payoutsEnabled === true`; use `initiateAffiliatePayoutConnect`
 * for affiliates who are still completing onboarding.
 */
export async function createAffiliateStripeLoginLink(
  affiliateId: string,
): Promise<{ url: string }> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { payoutProviderAccountId: true, payoutProvider: true, payoutProviderStatus: true },
  })

  if (!affiliate?.payoutProviderAccountId || affiliate.payoutProvider !== 'STRIPE_CONNECT') {
    throw new Error('Affiliate does not have a connected Stripe account')
  }

  return createExpressLoginLink(affiliate.payoutProviderAccountId)
}

/**
 * Sync the affiliate's Stripe Connect account status from Stripe.
 * Called by the webhook handler when Stripe fires account.updated,
 * and can also be called on-demand (e.g. user returns from onboarding).
 */
export async function syncAffiliatePayoutAccountStatus(affiliateId: string): Promise<{
  payoutProviderStatus: string
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { payoutProviderAccountId: true, payoutProvider: true },
  })

  if (!affiliate?.payoutProviderAccountId || affiliate.payoutProvider !== 'STRIPE_CONNECT') {
    return { payoutProviderStatus: 'NOT_SET', payoutsEnabled: false, detailsSubmitted: false }
  }

  const account = await retrieveAccount(affiliate.payoutProviderAccountId)
  const payoutsEnabled = account.payouts_enabled ?? false
  const detailsSubmitted = account.details_submitted ?? false

  const newStatus = payoutsEnabled ? 'ACTIVE' : detailsSubmitted ? 'PENDING' : 'NOT_SET'

  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { payoutProviderStatus: newStatus as any },
  })

  return { payoutProviderStatus: newStatus, payoutsEnabled, detailsSubmitted }
}
