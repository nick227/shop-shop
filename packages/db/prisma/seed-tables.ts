import type { PrismaClient } from '../src/generated/client/index.js'

/**
 * Deletes seed-owned data in FK-safe order. Skips SystemSetting.
 * GeocodingCache is cleared so the geocoding seed phases repopulate it cleanly.
 */
export async function cleanSeedTables(prisma: PrismaClient): Promise<void> {
  console.log('🧹 Cleaning old bundle data...')
  await prisma.bundleItem.deleteMany()
  await prisma.bundlePricing.deleteMany()
  await prisma.bundle.deleteMany()
  console.log('✅ Bundle data cleaned')

  await prisma.paymentWebhook.deleteMany()
  await prisma.geocodingCache.deleteMany()

  await prisma.deliveryTrackingPoint.deleteMany()
  await prisma.deliveryProviderEvent.deleteMany()
  await prisma.deliveryJob.deleteMany()

  await prisma.riverPostSeen.deleteMany()
  await prisma.postSave.deleteMany()
  await prisma.postLike.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()

  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()

  await prisma.orderItem.deleteMany()
  await prisma.orderEvent.deleteMany()
  await prisma.tip.deleteMany()
  await prisma.commissionAuditLog.deleteMany()
  await prisma.commission.deleteMany()
  await prisma.payoutOrder.deleteMany()
  await prisma.order.deleteMany()

  await prisma.promotionRedemption.deleteMany()
  await prisma.promotion.deleteMany()

  await prisma.itemTag.deleteMany()
  await prisma.mediaAsset.deleteMany()
  await prisma.storeTag.deleteMany()
  await prisma.item.deleteMany()

  await prisma.favoriteItem.deleteMany()
  await prisma.favoriteStore.deleteMany()

  await prisma.storeDeliveryProviderConfig.deleteMany()
  await prisma.storeDeliveryOption.deleteMany()
  await prisma.deliveryZone.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.invitation.deleteMany()

  await prisma.payoutAuditLog.deleteMany()
  await prisma.affiliatePayout.deleteMany()
  await prisma.payoutAdjustment.deleteMany()
  await prisma.payout.deleteMany()

  await prisma.vendorVerification.deleteMany()
  await prisma.adminAuditLog.deleteMany()

  await prisma.referralEvent.deleteMany()
  await prisma.user.updateMany({ data: { referredByAffiliateId: null } })
  await prisma.store.updateMany({ data: { referredByAffiliateId: null } })
  await prisma.affiliate.deleteMany()

  await prisma.paymentMethod.deleteMany()
  await prisma.address.deleteMany()
  await prisma.store.deleteMany()
  await prisma.user.deleteMany()
}
