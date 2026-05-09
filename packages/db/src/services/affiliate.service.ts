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
  const [affiliate, totalCommissions, paidCommissions, pendingCommissions, referredStores] =
    await Promise.all([
      prisma.affiliate.findUnique({
        where: { id: affiliateId },
      }),
      prisma.commission.aggregate({
        where: { affiliateId },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { affiliateId, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { affiliateId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.store.count({
        where: { referredByAffiliateId: affiliateId },
      }),
    ])

  return {
    affiliate,
    stats: {
      totalEarnings: totalCommissions._sum.amount || 0,
      paidEarnings: paidCommissions._sum.amount || 0,
      pendingEarnings: pendingCommissions._sum.amount || 0,
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
  const pendingCommissions = await prisma.commission.findMany({
    where: {
      affiliateId: input.affiliateId,
      status: 'APPROVED',
      createdAt: {
        gte: input.periodStart,
        lt: input.periodEnd,
      },
    },
  })

  const totalAmount = pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0)

  const payout = await prisma.affiliatePayout.create({
    data: {
      affiliateId: input.affiliateId,
      amount: totalAmount,
      method: input.method,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: 'PENDING',
    },
  })

  await prisma.commission.updateMany({
    where: {
      id: { in: pendingCommissions.map((c) => c.id) },
    },
    data: {
      payoutId: payout.id,
    },
  })

  return payout
}

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  referenceId?: string,
  failureReason?: string
): Promise<AffiliatePayout> {
  const data: Record<string, unknown> = { status }

  if (status === 'COMPLETED') {
    data.paidAt = new Date()

    await prisma.commission.updateMany({
      where: { payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    })
  }

  if (referenceId) data.referenceId = referenceId
  if (failureReason) data.failureReason = failureReason

  return prisma.affiliatePayout.update({
    where: { id: payoutId },
    data,
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

export async function calculateCommissionForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      storeId: true,
      serviceFeeAmount: true,
      referredByAffiliateId: true,
      paymentStatus: true,
    },
  })

  if (!order || order.paymentStatus !== 'PAID' || !order.referredByAffiliateId) {
    return
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: order.referredByAffiliateId },
    select: { id: true, commissionRate: true, status: true },
  })
  if (!affiliate || affiliate.status !== 'ACTIVE') return

  const serviceFee = Number(order.serviceFeeAmount)
  const commissionAmount = serviceFee * Number(affiliate.commissionRate)

  await createCommission({
    affiliateId: affiliate.id,
    orderId: order.id,
    storeId: order.storeId,
    amount: commissionAmount,
    rate: Number(affiliate.commissionRate),
    serviceFeeBase: serviceFee,
  })
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
