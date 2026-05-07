import { defineResource } from '@packages/schemas/core'
import {
  AddToCartInputSchema,
  UpdateCartItemInputSchema,
  CartResponseSchema,
  CartListResponseSchema,
} from '@packages/schemas/dtos'
import { cartDomain } from '@packages/domain'
import { prisma } from '@packages/db'

export const cartResource = defineResource({
  name: 'cart',
  model: 'cart',
  schemas: {
    create: AddToCartInputSchema,
    update: UpdateCartItemInputSchema,
    response: CartResponseSchema,
    list: CartListResponseSchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],
    read: ['USER', 'VENDOR', 'ADMIN'],
    update: ['USER', 'VENDOR', 'ADMIN'],
    delete: ['USER', 'VENDOR', 'ADMIN'],
    list: ['USER', 'VENDOR', 'ADMIN'],
  },
  ownership: {
    enabled: true,
    relationPath: 'userId',
  },
  operations: ['create', 'read', 'list', 'delete'],
  customHooks: {
    // Add item or bundle to cart (CREATE)
    beforeCreate: async (data, context) => {
      const input = data as {
        itemId?: string
        bundleId?: string
        quantity?: number
        optionsJson?: Record<string, unknown>
        notes?: string
      }

      if (!input.itemId && !input.bundleId) throw new Error('Either itemId or bundleId is required')
      if (input.itemId && input.bundleId) throw new Error('Provide either itemId or bundleId, not both')

      let result: { cartId: string; cartItemId: string }

      if (input.bundleId) {
        result = await cartDomain.addBundleToCart(context!.userId!, input.bundleId, input.notes)
      } else {
        result = await cartDomain.addItemToCart(
          context!.userId!,
          input.itemId!,
          input.quantity ?? 1,
          input.optionsJson,
          input.notes,
        )
      }

      const cart = await fetchCartWithTotals(result.cartId)
      return { _skipCreate: true, _result: cart }
    },

    afterRead: async (result) => {
      return fetchCartWithTotals((result as { id: string }).id)
    },

    beforeList: async (_filters, context) => {
      return { userId: context!.userId!, status: 'ACTIVE' }
    },

    afterList: async (_result, context) => {
      const carts = await prisma.cart.findMany({
        where: { userId: context!.userId!, status: 'ACTIVE' },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      })

      const cartsWithTotals = await Promise.all(carts.map((c) => fetchCartWithTotals(c.id)))
      return { data: cartsWithTotals, total: cartsWithTotals.length }
    },

    beforeDelete: async (id, context) => {
      await cartDomain.clearCart(id as string, context!.userId!)
    },
  },
})

// ---------------------------------------------------------------------------
// Internal helper — loads a cart with bundle/item relations + totals
// ---------------------------------------------------------------------------

const BUNDLE_INCLUDE = {
  media: { take: 1, orderBy: { sortIndex: 'asc' as const } },
  items: {
    include: {
      item: { select: { id: true, title: true, price: true } },
    },
    orderBy: { sortIndex: 'asc' as const },
  },
  pricing: true,
} as const

async function fetchCartWithTotals(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          item: true,
          bundle: { include: BUNDLE_INCLUDE },
        },
      },
    },
  })

  if (!cart) throw new Error('Cart not found')

  const totals = await cartDomain.calculateCartTotals(cart.id)

  return {
    id: cart.id,
    userId: cart.userId,
    storeId: cart.storeId,
    status: cart.status,
    note: cart.note,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: cart.items.map((ci) => ({
      id: ci.id,
      cartId: ci.cartId,
      itemId: ci.itemId ?? null,
      bundleId: ci.bundleId ?? null,
      titleSnapshot: ci.titleSnapshot,
      unitPrice: ci.unitPrice,
      quantity: ci.quantity,
      optionsJson: ci.optionsJson,
      notes: ci.notes,
      createdAt: ci.createdAt,
      currentItem: ci.item
        ? {
            id: ci.item.id,
            title: ci.item.title,
            price: ci.item.price,
            isActive: ci.item.isActive,
            isSoldOut: ci.item.isSoldOut,
            stockQty: ci.item.stockQty,
          }
        : null,
      currentBundle: ci.bundle
        ? {
            id: ci.bundle.id,
            name: ci.bundle.name,
            description: ci.bundle.description,
            isActive: ci.bundle.isActive,
            imageUrl: (ci.bundle as any).media?.[0]?.url ?? null,
            items: (ci.bundle as any).items.map((bi: any) => ({
              itemId: bi.item.id,
              title: bi.item.title,
              price: Number(bi.item.price),
              quantity: bi.quantity,
            })),
          }
        : null,
    })),
    itemCount: totals.itemCount,
    subtotal: totals.subtotal,
  }
}
