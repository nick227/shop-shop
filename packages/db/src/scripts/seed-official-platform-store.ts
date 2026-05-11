import type { PrismaClient } from '../generated/client/index.js'
import { OFFICIAL_PLATFORM_STORE_SLUG } from '../constants/platform-store.js'

async function resolvePlatformStoreOwnerUserId(prisma: PrismaClient): Promise<string> {
  const envEmail = process.env.PLATFORM_STORE_OWNER_EMAIL?.trim()
  if (envEmail) {
    const user = await prisma.user.findUnique({
      where: { email: envEmail },
      select: { id: true },
    })
    if (!user) {
      throw new Error(
        `[seed] PLATFORM_STORE_OWNER_EMAIL=${envEmail} — user does not exist. Create that user or unset the variable.`,
      )
    }
    return user.id
  }

  const seedAdmin = await prisma.user.findUnique({
    where: { email: 'admin@seed.local' },
    select: { id: true },
  })
  if (seedAdmin) return seedAdmin.id

  const anyAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  if (anyAdmin) return anyAdmin.id

  throw new Error(
    '[seed] Cannot create official platform store: no owner (admin@seed.local, ADMIN role, or PLATFORM_STORE_OWNER_EMAIL).',
  )
}

export async function ensureOfficialPlatformStore(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.store.findUnique({
    where: { slug: OFFICIAL_PLATFORM_STORE_SLUG },
    select: { id: true },
  })
  if (existing) return

  const ownerUserId = await resolvePlatformStoreOwnerUserId(prisma)

  await prisma.store.create({
    data: {
      ownerUserId,
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
