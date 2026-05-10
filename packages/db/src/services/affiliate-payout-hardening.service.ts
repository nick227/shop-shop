/**
 * Affiliate Payout Hardening Service - Phase 4C
 * 
 * Enhanced payout logic with:
 * - Commission eligibility validation
 * - Duplicate prevention
 * - Admin review workflow
 * - Audit logging
 * - CSV export support
 */

import { prisma, type ExtendedPrismaClient } from '../client.js'
import { 
  getPendingCommissionsForPayout, 
  approveCommission, 
  markCommissionPaid,
  reverseCommission 
} from './affiliate-commission.service.js'
import { computePayoutBreakdownCents } from './payout-calculation.service.js'

// ─── Public types ─────────────────────────────────────────────────────

export interface PayoutEligibilityResult {
  isEligible: boolean
  reason?: string
  pendingCommissionsCount: number
  totalPendingAmount: number
}

export interface PayoutReviewRequest {
  affiliateId: string
  periodStart: Date
  periodEnd: Date
  method: string
  reviewNotes?: string
  autoApprove?: boolean
}

export interface PayoutAuditLog {
  id: string
  affiliateId: string
  affiliatePayoutId: string
  action: 'CREATED' | 'APPROVED' | 'PAID' | 'REVERSED' | 'MODIFIED'
  performedBy: string | null
  performedAt: Date
  details: Record<string, any> | null
  ipAddress?: string
}

// ─── Payout Eligibility ─────────────────────────────────────────────

/**
 * Check if affiliate is eligible for payout
 */
export async function checkPayoutEligibility(affiliateId: string): Promise<PayoutEligibilityResult> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      status: true,
      payoutProvider: true,
      payoutProviderAccountId: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  if (!affiliate) {
    return {
      isEligible: false,
      reason: 'Affiliate not found',
      pendingCommissionsCount: 0,
      totalPendingAmount: 0,
    }
  }

  if (affiliate.status !== 'ACTIVE') {
    return {
      isEligible: false,
      reason: `Affiliate status is ${affiliate.status}`,
      pendingCommissionsCount: 0,
      totalPendingAmount: 0,
    }
  }

  if (!affiliate.payoutProvider || !affiliate.payoutProviderAccountId) {
    return {
      isEligible: false,
      reason: 'Payout provider not configured',
      pendingCommissionsCount: 0,
      totalPendingAmount: 0,
    }
  }

  const pendingCommissions = await getPendingCommissionsForPayout(affiliateId)
  const totalPendingAmount = pendingCommissions.reduce(
    (sum, commission) => sum + Number(commission.amount || 0) * 100, // Convert to cents
    0
  )

  // Minimum payout threshold (e.g., $10.00)
  const MIN_PAYOUT_THRESHOLD = 1000 // $10.00 in cents
  if (totalPendingAmount < MIN_PAYOUT_THRESHOLD) {
    return {
      isEligible: false,
      reason: `Minimum payout threshold not met ($${(totalPendingAmount / 100).toFixed(2)} required)`,
      pendingCommissionsCount: pendingCommissions.length,
      totalPendingAmount,
    }
  }

  return {
    isEligible: true,
    pendingCommissionsCount: pendingCommissions.length,
    totalPendingAmount,
  }
}

/**
 * Create payout with admin review workflow
 */
export async function createPayoutWithReview(
  request: PayoutReviewRequest,
  adminUserId: string,
  db: ExtendedPrismaClient = prisma
): Promise<string> {
  // Check eligibility first
  const eligibility = await checkPayoutEligibility(request.affiliateId)
  if (!eligibility.isEligible) {
    throw new Error(`Payout eligibility failed: ${eligibility.reason}`)
  }

  const pendingCommissions = await getPendingCommissionsForPayout(request.affiliateId)
  
  // Create payout record
  const payout = await db.affiliatePayout.create({
    data: {
      affiliateId: request.affiliateId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      method: request.method as any,
      status: request.autoApprove ? 'PROCESSING' : 'PENDING',
      totalAmount: eligibility.totalPendingAmount / 100, // Convert to Decimal
      commissionCount: eligibility.pendingCommissionsCount,
      reviewNotes: request.reviewNotes,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  })

  // Log creation
  await logPayoutAction({
    affiliateId: request.affiliateId,
    affiliatePayoutId: payout.id,
    action: 'CREATED',
    performedBy: adminUserId,
    details: {
      method: request.method,
      autoApprove: request.autoApprove,
      commissionCount: eligibility.pendingCommissionsCount,
      totalAmount: eligibility.totalPendingAmount / 100,
    },
  })

  // If auto-approved, process immediately
  if (request.autoApprove) {
    await approvePayout(payout.id, adminUserId)
    await markCommissionsAsPaid(pendingCommissions, payout.id)
  }

  return payout.id
}

/**
 * Admin approval of pending payout
 */
export async function approvePayout(
  payoutId: string,
  adminUserId: string,
  notes?: string
): Promise<void> {
  await prisma.affiliatePayout.update({
    where: { id: payoutId },
    data: {
      status: 'PROCESSING',
      approvedBy: adminUserId,
      approvedAt: new Date(),
      reviewNotes: notes,
    },
  })

  // Log approval
  await logPayoutAction({
    affiliateId: (await prisma.affiliatePayout.findUnique({ 
      where: { id: payoutId },
      select: { affiliateId: true }
    }))!.affiliateId,
    affiliatePayoutId: payoutId,
    action: 'APPROVED',
    performedBy: adminUserId,
    details: { notes },
  })
}

/**
 * Mark payout as paid and update commission statuses
 */
export async function markPayoutAsPaid(
  payoutId: string,
  adminUserId: string,
  paymentReference?: string
): Promise<void> {
  const payout = await prisma.affiliatePayout.findUnique({
    where: { id: payoutId },
    select: { affiliateId: true, status: true },
  })

  if (!payout || payout.status !== 'PROCESSING') {
    throw new Error('Payout must be in PROCESSING status to be marked as paid')
  }

  // Update payout status
  await prisma.affiliatePayout.update({
    where: { id: payoutId },
    data: {
      status: 'COMPLETED',
      paidBy: adminUserId,
      paidAt: new Date(),
      paymentReference,
    },
  })

  // Get and update commissions
  const pendingCommissions = await getPendingCommissionsForPayout(payout.affiliateId)
  await markCommissionsAsPaid(pendingCommissions, payoutId)

  // Log payment
  await logPayoutAction({
    affiliateId: payout.affiliateId,
    affiliatePayoutId: payoutId,
    action: 'PAID',
    performedBy: adminUserId,
    details: { paymentReference, commissionCount: pendingCommissions.length },
  })
}

/**
 * Reverse a payout and restore commission statuses
 */
export async function reversePayout(
  payoutId: string,
  adminUserId: string,
  reason: string
): Promise<void> {
  const payout = await prisma.affiliatePayout.findUnique({
    where: { id: payoutId },
    select: { affiliateId: true, status: true },
  })

  if (!payout || !['PROCESSING', 'COMPLETED'].includes(payout.status)) {
    throw new Error('Only PROCESSING or COMPLETED payouts can be reversed')
  }

  // Update payout status
  await prisma.affiliatePayout.update({
    where: { id: payoutId },
    data: {
      status: 'REVERSED',
      reversedBy: adminUserId,
      reversedAt: new Date(),
      reversalReason: reason,
    },
  })

  // Get and reverse commissions
  const commissions = await prisma.commission.findMany({
    where: { payoutId },
    select: { id: true },
  })

  for (const commission of commissions) {
    await reverseCommission(commission.id, `Payout ${payoutId} reversed: ${reason}`)
  }

  // Log reversal
  await logPayoutAction({
    affiliateId: payout.affiliateId,
    affiliatePayoutId: payoutId,
    action: 'REVERSED',
    performedBy: adminUserId,
    details: { reason, commissionCount: commissions.length },
  })
}

// ─── Internal helpers ─────────────────────────────────────────────────────

/**
 * Mark commissions as paid with payout ID
 */
async function markCommissionsAsPaid(
  commissions: any[],
  payoutId: string
): Promise<void> {
  for (const commission of commissions) {
    await markCommissionPaid(commission.id)
  }
}

/**
 * Log payout actions for audit trail
 */
async function logPayoutAction(log: Omit<PayoutAuditLog, 'id'>): Promise<void> {
  await prisma.payoutAuditLog.create({
    data: {
      affiliateId: log.affiliateId,
      affiliatePayoutId: log.affiliatePayoutId,
      action: log.action,
      performedBy: log.performedBy,
      details: log.details,
      ipAddress: log.ipAddress,
    },
  })
}

/**
 * Get payout audit logs
 */
export async function getPayoutAuditLogs(
  affiliateId?: string,
  limit = 50
): Promise<PayoutAuditLog[]> {
  return prisma.payoutAuditLog.findMany({
    where: affiliateId ? { affiliateId } : {},
    include: {
      performedByUser: {
        select: { id: true, name: true, email: true },
      },
      affiliate: {
        select: { id: true, user: { select: { name: true, email: true } } },
      },
    },
    orderBy: { performedAt: 'desc' },
    take: limit,
  })
}

/**
 * Export payouts to CSV format
 */
export async function exportPayoutsToCSV(
  affiliateId?: string,
  dateRange?: { start: Date; end: Date }
): Promise<string> {
  const payouts = await prisma.affiliatePayout.findMany({
    where: {
      ...(affiliateId && { affiliateId }),
      ...(dateRange && {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }),
    },
    include: {
      affiliate: {
        select: {
          user: { select: { name: true, email: true } },
          referralCode: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'Payout ID',
    'Affiliate Name',
    'Affiliate Email',
    'Referral Code',
    'Period Start',
    'Period End',
    'Method',
    'Status',
    'Commission Count',
    'Total Amount',
    'Created At',
    'Reviewed At',
    'Approved At',
    'Paid At',
  ]

  const rows = payouts.map((payout) => [
    payout.id,
    payout.affiliate.user.name,
    payout.affiliate.user.email,
    payout.affiliate.referralCode,
    payout.periodStart.toISOString().split('T')[0],
    payout.periodEnd.toISOString().split('T')[0],
    payout.method,
    payout.status,
    payout.commissionCount,
    payout.totalAmount.toString(),
    payout.createdAt.toISOString(),
    payout.reviewedAt?.toISOString() || '',
    payout.approvedAt?.toISOString() || '',
    payout.paidAt?.toISOString() || '',
  ])

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
