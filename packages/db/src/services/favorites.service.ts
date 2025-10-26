import { prisma } from '../client'

/**
 * Add store to favorites
 */
export async function addFavoriteStore(userId: string, storeId: string) {
  // Check if already favorited
  const existing = await (prisma as unknown as { favoriteStore: { findUnique: Function } }).favoriteStore.findUnique({
    where: {
      userId_storeId: { userId, storeId },
    },
  })

  if (existing) {
    return existing
  }

  return (prisma as unknown as { favoriteStore: { create: Function } }).favoriteStore.create({
    data: { userId, storeId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          isPublished: true,
        },
      },
    },
  })
}

/**
 * Remove store from favorites
 */
export async function removeFavoriteStore(userId: string, storeId: string) {
  await (prisma as unknown as { favoriteStore: { deleteMany: Function } }).favoriteStore.deleteMany({
    where: { userId, storeId },
  })
}

/**
 * Get user's favorite stores
 */
export async function getUserFavoriteStores(userId: string) {
  return (prisma as unknown as { favoriteStore: { findMany: Function } }).favoriteStore.findMany({
    where: { userId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          isPublished: true,
          latitude: true,
          longitude: true,
          addressCity: true,
          addressState: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Check if store is favorited
 */
export async function isStoreFavorited(userId: string, storeId: string): Promise<boolean> {
  const favorite = await (prisma as unknown as { favoriteStore: { findUnique: Function } }).favoriteStore.findUnique({
    where: {
      userId_storeId: { userId, storeId },
    },
  })

  return !!favorite
}

/**
 * Add item to favorites
 */
export async function addFavoriteItem(userId: string, itemId: string) {
  const existing = await (prisma as unknown as { favoriteItem: { findUnique: Function } }).favoriteItem.findUnique({
    where: {
      userId_itemId: { userId, itemId },
    },
  })

  if (existing) {
    return existing
  }

  return (prisma as unknown as { favoriteItem: { create: Function } }).favoriteItem.create({
    data: { userId, itemId },
    include: {
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          isActive: true,
          isSoldOut: true,
          storeId: true,
        },
      },
    },
  })
}

/**
 * Remove item from favorites
 */
export async function removeFavoriteItem(userId: string, itemId: string) {
  await (prisma as unknown as { favoriteItem: { deleteMany: Function } }).favoriteItem.deleteMany({
    where: { userId, itemId },
  })
}

/**
 * Get user's favorite items
 */
export async function getUserFavoriteItems(userId: string) {
  return (prisma as unknown as { favoriteItem: { findMany: Function } }).favoriteItem.findMany({
    where: { userId },
    include: {
      item: {
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          media: {
            take: 1,
            orderBy: { sortIndex: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Reorder - Recreate cart from a previous order
 */
export async function reorderFromPreviousOrder(userId: string, orderId: string) {
  // Get the previous order
  const previousOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          item: {
            select: {
              id: true,
              isActive: true,
              isSoldOut: true,
              price: true,
            },
          },
        },
      },
      store: {
        select: {
          id: true,
          isPublished: true,
        },
      },
    },
  })

  if (!previousOrder) {
    throw new Error('Order not found')
  }

  if (previousOrder.userId !== userId) {
    throw new Error('Unauthorized: Order does not belong to user')
  }

  if (!previousOrder.store.isPublished) {
    throw new Error('Store is no longer available')
  }

  // Check for existing active cart for this store
  let cart = await prisma.cart.findFirst({
    where: {
      userId,
      storeId: previousOrder.storeId,
      status: 'ACTIVE',
    },
  })

  // Create new cart if none exists
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
        storeId: previousOrder.storeId,
        status: 'ACTIVE',
      },
    })
  } else {
    // Clear existing cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })
  }

  // Single-pass filter and transform
  const cartItems = previousOrder.items
    .filter(oi => oi.item?.isActive && !oi.item.isSoldOut)
    .map(oi => ({
      cartId: cart!.id,
      itemId: oi.itemId!,
      titleSnapshot: oi.titleSnapshot,
      unitPrice: oi.item!.price,
      quantity: oi.quantity,
      optionsJson: oi.optionsJson,
      notes: oi.notes,
    }))

  if (cartItems.length === 0) {
    throw new Error('None of the items from this order are currently available')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.cartItem.createMany as any)({
    data: cartItems,
  })

  // Return updated cart
  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          item: {
            include: {
              media: {
                take: 1,
                orderBy: { sortIndex: 'asc' },
              },
            },
          },
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

/**
 * Get user's order history for reorder
 */
export async function getUserOrderHistory(userId: string, options?: {
  limit?: number
  offset?: number
}) {
  return prisma.order.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      items: {
        take: 3, // Preview of items
        select: {
          titleSnapshot: true,
          quantity: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 20,
    skip: options?.offset || 0,
  })
}

