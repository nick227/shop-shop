import type { PrismaClient } from '../generated/client/index.js'

/** Editorial / platform identity in River — normal Store row, posts use this storeId. */
export const OFFICIAL_PLATFORM_STORE_SLUG = 'official'

export async function ensureOfficialPlatformStore(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.store.findUnique({
    where: { slug: OFFICIAL_PLATFORM_STORE_SLUG },
    select: { id: true },
  })
  if (existing) return

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@seed.local', role: 'ADMIN' },
    select: { id: true },
  })
  if (!admin) {
    console.warn('[seed] Official platform store skipped: admin@seed.local not found')
    return
  }

  await prisma.store.create({
    data: {
      ownerUserId: admin.id,
      name: 'Shop Shop',
      slug: OFFICIAL_PLATFORM_STORE_SLUG,
      description:
        'Platform announcements, editorial picks, and marketplace updates. Posts here appear as the branded Shop Shop account in River.',
      storeType: 'OTHER',
      isPublished: true,
      status: 'ACTIVE',
      deliveryEnabled: false,
      pickupEnabled: false,
      prepTimeMin: 15,
    },
  })

  console.log('[seed] Official platform store created (slug: official, name: Shop Shop)')
}
