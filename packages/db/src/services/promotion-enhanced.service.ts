import { prisma } from '../client'
import { Decimal } from 'decimal.js'

export interface ValidatePromotionInput {
  code: string
  userId: string
  storeId?: string
  orderSubtotal: number
  appliedPromotions?: string[] // Other promotion codes already applied
}

export interface ValidatePromotionResult {
  valid: boolean
  promotion?: {
    id: string
    code: string
    type: string
    value: number
    discountAmount: number
  }
  error?: string
}

export interface RedeemPromotionInput {
  promotionId: string
  userId: string
  orderId?: string
  discountAmount: number
}

/**
 * Validate if a promotion code can be applied to an order
 */
export async function validatePromotionCode(
  input: ValidatePromotionInput
): Promise<ValidatePromotionResult> {
  const promotion = await prisma.promotion.findUnique({
    where: { code: input.code.toUpperCase() },
    include: {
      redemptions: {
        where: { userId: input.userId },
        select: { id: true },
      },
    },
  })

  if (!promotion) {
    return { valid: false, error: 'Promotion code not found' }
  }

  // Check if promotion is active
  if (promotion.status !== 'ACTIVE') {
    return { valid: false, error: 'Promotion code is not active' }
  }

  // Check validity period
  const now = new Date()
  if (now < promotion.validFrom || now > promotion.validUntil) {
    return { valid: false, error: 'Promotion code has expired or is not yet valid' }
  }

  // Check store eligibility (if not global)
  if (!promotion.isGlobal && promotion.storeId && promotion.storeId !== input.storeId) {
    return { valid: false, error: 'Promotion code not valid for this store' }
  }

  // Check minimum order value
  if (promotion.minOrderValue && input.orderSubtotal < Number(promotion.minOrderValue)) {
    return {
      valid: false,
      error: `Minimum order value of $${Number(promotion.minOrderValue).toFixed(2)} required`,
    }
  }

  // Check total usage limit
  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    return { valid: false, error: 'Promotion code usage limit reached' }
  }

  // Check per-user usage limit
  if (promotion.usageLimitPerUser) {
    const userRedemptions = promotion.redemptions.length
    if (userRedemptions >= promotion.usageLimitPerUser) {
      return {
        valid: false,
        error: `You have already used this code ${userRedemptions} time(s). Limit is ${promotion.usageLimitPerUser}`,
      }
    }
  }

  // Check user eligibility (whitelist)
  const eligibleUserIds = promotion.eligibleUserIds as string[] | null
  if (eligibleUserIds && Array.isArray(eligibleUserIds) && eligibleUserIds.length > 0) {
    const eligible = new Set(eligibleUserIds)
    if (!eligible.has(input.userId)) {
      return { valid: false, error: 'You are not eligible for this promotion' }
    }
  }

  // Check user exclusion (blacklist)
  const excludedUserIds = promotion.excludedUserIds as string[] | null
  if (excludedUserIds && Array.isArray(excludedUserIds) && excludedUserIds.length > 0) {
    const excluded = new Set(excludedUserIds)
    if (excluded.has(input.userId)) {
      return { valid: false, error: 'You are not eligible for this promotion' }
    }
  }

  // Check stacking rules
  if (!promotion.allowStacking && input.appliedPromotions && input.appliedPromotions.length > 0) {
    return { valid: false, error: 'This promotion cannot be combined with other offers' }
  }

  // Calculate discount amount
  let discountAmount = 0
  if (promotion.type === 'PERCENTAGE') {
    discountAmount = (input.orderSubtotal * Number(promotion.value)) / 100
    if (promotion.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(promotion.maxDiscount))
    }
  } else if (promotion.type === 'FIXED_AMOUNT') {
    discountAmount = Number(promotion.value)
  }

  return {
    valid: true,
    promotion: {
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      value: Number(promotion.value),
      discountAmount,
    },
  }
}

/**
 * Redeem a promotion code (record usage)
 */
export async function redeemPromotion(input: RedeemPromotionInput) {
  const [redemption] = await prisma.$transaction([
    // Create redemption record
    prisma.promotionRedemption.create({
      data: {
        promotionId: input.promotionId,
        userId: input.userId,
        orderId: input.orderId,
        discountAmount: input.discountAmount,
      },
    }),
    
    // Increment usage count
    prisma.promotion.update({
      where: { id: input.promotionId },
      data: {
        usageCount: { increment: 1 },
      },
    }),
  ])

  return redemption
}

/**
 * Get user's promotion redemption history
 */
export async function getUserPromotionHistory(userId: string) {
  return prisma.promotionRedemption.findMany({
    where: { userId },
    include: {
      promotion: {
        select: {
          code: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { redeemedAt: 'desc' },
  })
}

/**
 * Get promotion redemption analytics
 */
export async function getPromotionAnalytics(promotionId: string) {
  const [promotion, redemptions, uniqueUsers] = await Promise.all([
    prisma.promotion.findUnique({
      where: { id: promotionId },
    }),
    prisma.promotionRedemption.count({
      where: { promotionId },
    }),
    prisma.promotionRedemption.groupBy({
      by: ['userId'],
      where: { promotionId },
      _count: true,
    }),
  ])

  if (!promotion) {
    throw new Error('Promotion not found')
  }

  const totalDiscount = await prisma.promotionRedemption.aggregate({
    where: { promotionId },
    _sum: { discountAmount: true },
  })

  return {
    promotion: {
      id: promotion.id,
      code: promotion.code,
      name: promotion.name,
      type: promotion.type,
      status: promotion.status,
      usageLimit: promotion.usageLimit,
      usageCount: promotion.usageCount,
    },
    analytics: {
      totalRedemptions: redemptions,
      uniqueUsers: uniqueUsers.length,
      totalDiscount: Number(totalDiscount._sum.discountAmount || 0),
      averageDiscount: redemptions > 0 
        ? Number(totalDiscount._sum.discountAmount || 0) / redemptions 
        : 0,
    },
  }
}

/**
 * Check if user can use specific promotion
 */
export async function canUserUsePromotion(
  promotionId: string,
  userId: string
): Promise<{ canUse: boolean; reason?: string; usageCount: number }> {
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
  })

  if (!promotion) {
    return { canUse: false, reason: 'Promotion not found', usageCount: 0 }
  }

  const userRedemptions = await prisma.promotionRedemption.count({
    where: {
      promotionId,
      userId,
    },
  })

  if (promotion.usageLimitPerUser && userRedemptions >= promotion.usageLimitPerUser) {
    return {
      canUse: false,
      reason: `Usage limit of ${promotion.usageLimitPerUser} reached`,
      usageCount: userRedemptions,
    }
  }

  return { canUse: true, usageCount: userRedemptions }
}

/**
 * Get active promotions for a store
 */
export async function getActivePromotionsForStore(storeId?: string) {
  const now = new Date()

  return prisma.promotion.findMany({
    where: {
      status: 'ACTIVE',
      validFrom: { lte: now },
      validUntil: { gte: now },
      OR: [
        { storeId },
        { isGlobal: true },
      ],
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      type: true,
      value: true,
      minOrderValue: true,
      maxDiscount: true,
      usageLimit: true,
      usageCount: true,
      usageLimitPerUser: true,
      allowStacking: true,
      validUntil: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

