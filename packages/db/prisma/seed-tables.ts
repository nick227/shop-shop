import type { PrismaClient } from '../src/generated/client/index.js'

/**
 * Deletes seed-owned data in FK-safe order. Skips SystemSetting, GeocodingCache.
 */
export async function cleanSeedTables(prisma: PrismaClient): Promise<void> {
  await prisma.paymentWebhook.deleteMany()
  await prisma.geocodingCache.deleteMany()

  await prisma.postLike.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()

  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()

  await prisma.orderItem.deleteMany()
  await prisma.orderEvent.deleteMany()
  await prisma.tip.deleteMany()
  await prisma.commission.deleteMany()
  await prisma.order.deleteMany()

  await prisma.promotionRedemption.deleteMany()
  await prisma.promotion.deleteMany()

  await prisma.bundleItem.deleteMany()
  await prisma.bundlePricing.deleteMany()
  await prisma.bundle.deleteMany()

  await prisma.mediaAsset.deleteMany()
  await prisma.item.deleteMany()

  await prisma.favoriteItem.deleteMany()
  await prisma.favoriteStore.deleteMany()

  await prisma.deliveryZone.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.invitation.deleteMany()

  await prisma.affiliatePayout.deleteMany()

  await prisma.vendorVerification.deleteMany()

  await prisma.store.updateMany({ data: { referredByAffiliateId: null } })
  await prisma.affiliate.deleteMany()

  await prisma.paymentMethod.deleteMany()
  await prisma.address.deleteMany()
  await prisma.store.deleteMany()
  await prisma.user.deleteMany()
}
