import type { Prisma, PrismaClient } from '../generated/client/index.js'
import { OFFICIAL_PLATFORM_STORE_SLUG } from '../constants/platform-store.js'

const COMMENTS = [
  'Ordering this again tomorrow.',
  'Showed up hot. Worth it.',
  'Portion was huge.',
  'Saved this for the weekend.',
  'The photo matches the plate.',
  'Sharing this with the group chat.',
]

type ActivityStore = {
  id: string
  items: { id: string; title: string; price: Prisma.Decimal }[]
}

type ActivityCustomer = { id: string }

export async function seedActivityEngagement(
  prisma: PrismaClient,
  customers: ActivityCustomer[],
  stores: ActivityStore[],
  adminId: string | undefined,
): Promise<number> {
  await prisma.cart.create({
    data: {
      userId: customers[0].id,
      storeId: stores[0].id,
      status: 'ACTIVE',
      note: 'Add napkins',
      items: {
        create: {
          itemId: stores[0].items[0].id,
          titleSnapshot: stores[0].items[0].title,
          unitPrice: stores[0].items[0].price,
          quantity: 1,
        },
      },
    },
  })
  const second = 1 % stores.length
  await prisma.cart.create({
    data: {
      userId: customers[second % customers.length].id,
      storeId: stores[second].id,
      status: 'ABANDONED',
      items: {
        create: {
          itemId: stores[second].items[0].id,
          titleSnapshot: stores[second].items[0].title,
          unitPrice: stores[second].items[0].price,
          quantity: 2,
        },
      },
    },
  })

  for (let index = 0; index < customers.length; index++) {
    const store = stores[index % stores.length]
    await prisma.favoriteStore.upsert({
      where: { userId_storeId: { userId: customers[index].id, storeId: store.id } },
      update: {},
      create: { userId: customers[index].id, storeId: store.id },
    })
    await prisma.favoriteItem.upsert({
      where: { userId_itemId: { userId: customers[index].id, itemId: store.items[0].id } },
      update: {},
      create: { userId: customers[index].id, itemId: store.items[0].id },
    })
  }

  const official = await prisma.store.findUnique({
    where: { slug: OFFICIAL_PLATFORM_STORE_SLUG },
    select: { id: true },
  })
  if (official) {
    await prisma.post.createMany({
      data: [
        {
          storeId: official.id,
          content: 'Welcome to Shop Shop. Local kitchens around Austin are open for pickup and delivery.',
          mediaUrls: [],
          source: 'MANUAL',
          contentType: 'STORE_SPOTLIGHT',
          priority: 3,
        },
        {
          storeId: official.id,
          content: 'Weekend picks are live in River. Save a post and it stays on your list.',
          mediaUrls: [],
          source: 'MANUAL',
          contentType: 'CATEGORY_COLLECTION',
          priority: 1,
        },
      ],
    })
  }

  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'asc' }, take: 12, select: { id: true } })
  for (let index = 0; index < posts.length; index++) {
    const postId = posts[index].id
    const likerId = customers[index % customers.length].id
    await prisma.postLike.upsert({
      where: { postId_userId: { postId, userId: likerId } },
      update: {},
      create: { postId, userId: likerId },
    })
    await prisma.riverPostSeen.upsert({
      where: { userId_postId: { userId: customers[0].id, postId } },
      update: {},
      create: { userId: customers[0].id, postId },
    })
    if (index < COMMENTS.length) {
      await prisma.comment.create({
        data: {
          postId,
          userId: customers[(index + 1) % customers.length].id,
          content: COMMENTS[index],
        },
      })
    }
    if (index < 4) {
      await prisma.postSave.upsert({
        where: { postId_userId: { postId, userId: likerId } },
        update: {},
        create: { postId, userId: likerId },
      })
    }
  }

  await prisma.post.updateMany({ data: { likesCount: 0, commentsCount: 0 } })
  const likeCounts = await prisma.postLike.groupBy({ by: ['postId'], _count: { _all: true } })
  const commentCounts = await prisma.comment.groupBy({ by: ['postId'], _count: { _all: true } })
  for (const row of likeCounts) {
    await prisma.post.update({ where: { id: row.postId }, data: { likesCount: row._count._all } })
  }
  for (const row of commentCounts) {
    await prisma.post.update({ where: { id: row.postId }, data: { commentsCount: row._count._all } })
  }

  if (adminId) {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'store.publish',
        targetType: 'Store',
        targetId: stores[0].id,
        payload: { source: 'seed' },
      },
    })
  }

  return posts.length
}
