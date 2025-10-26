import { defineResource } from '@packages/schemas/core'
import {
  AddToCartInputSchema,
  UpdateCartItemInputSchema,
  CartResponseSchema,
  CartListResponseSchema,
} from '@packages/schemas/dtos'
import { cartDomain } from '@packages/domain'
import { prisma } from '@packages/db'

/**
 * Cart Resource Definition
 * Manages shopping cart operations
 */
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
    create: ['USER', 'VENDOR', 'ADMIN'], // Anyone can add to cart
    read: ['USER', 'VENDOR', 'ADMIN'],
    update: ['USER', 'VENDOR', 'ADMIN'],
    delete: ['USER', 'VENDOR', 'ADMIN'],
    list: ['USER', 'VENDOR', 'ADMIN'],
  },
  ownership: {
    enabled: true,
    relationPath: 'userId', // Users can only access their own carts
  },
  operations: ['create', 'read', 'list', 'delete'], // No generic update
  customHooks: {
    // Add item to cart (CREATE)
    beforeCreate: async (data, context) => {
      const input = data as {
        storeId: string
        itemId: string
        quantity: number
        optionsJson?: Record<string, unknown>
        notes?: string
      }

      // Call domain service which handles cart creation and item addition
      const result = await cartDomain.addItemToCart(
        context!.userId!,
        input.itemId,
        input.quantity,
        input.optionsJson,
        input.notes
      )

      // Fetch and return the created cart (bypassing the base service create)
      const cart = await prisma.cart.findUnique({
        where: { id: result.cartId },
        include: {
          items: {
            include: { item: true },
          },
        },
      })

      if (!cart) {
        throw new Error('Cart creation failed')
      }

      // Calculate totals
      const totals = await cartDomain.calculateCartTotals(cart.id)

      // Return full cart response, marking it to skip base service creation
      return {
        _skipCreate: true,
        _result: {
          id: cart.id,
          userId: cart.userId,
          storeId: cart.storeId,
          status: cart.status,
          note: cart.note,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
          items: cart.items.map((cartItem) => ({
            id: cartItem.id,
            cartId: cartItem.cartId,
            itemId: cartItem.itemId,
            titleSnapshot: cartItem.titleSnapshot,
            unitPrice: cartItem.unitPrice,
            quantity: cartItem.quantity,
            optionsJson: cartItem.optionsJson,
            notes: cartItem.notes,
            createdAt: cartItem.createdAt,
            currentItem: {
              id: cartItem.item.id,
              title: cartItem.item.title,
              price: cartItem.item.price,
              isActive: cartItem.item.isActive,
              isSoldOut: cartItem.item.isSoldOut,
              stockQty: cartItem.item.stockQty,
            },
          })),
          itemCount: totals.itemCount,
          subtotal: totals.subtotal,
        },
      }
    },

    // Get cart with items (READ)
    afterRead: async (result) => {
      // Fetch full cart with items
      const cart = await prisma.cart.findUnique({
        where: { id: (result as { id: string }).id },
        include: {
          items: {
            include: {
              item: true, // Include current item details
            },
          },
        },
      })

      if (!cart) {
        throw new Error('Cart not found')
      }

      // Calculate totals
      const totals = await cartDomain.calculateCartTotals(cart.id)

      return {
        id: cart.id,
        userId: cart.userId,
        storeId: cart.storeId,
        status: cart.status,
        note: cart.note,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        items: cart.items.map((cartItem) => ({
          id: cartItem.id,
          cartId: cartItem.cartId,
          itemId: cartItem.itemId,
          titleSnapshot: cartItem.titleSnapshot,
          unitPrice: cartItem.unitPrice,
          quantity: cartItem.quantity,
          optionsJson: cartItem.optionsJson,
          notes: cartItem.notes,
          createdAt: cartItem.createdAt,
          currentItem: {
            id: cartItem.item.id,
            title: cartItem.item.title,
            price: cartItem.item.price,
            isActive: cartItem.item.isActive,
            isSoldOut: cartItem.item.isSoldOut,
            stockQty: cartItem.item.stockQty,
          },
        })),
        itemCount: totals.itemCount,
        subtotal: totals.subtotal,
      }
    },

    // List user's carts (LIST)
    beforeList: async (_filters, context) => {
      // Only return user's own carts
      return {
        userId: context!.userId!,
        status: 'ACTIVE', // Only show active carts
      }
    },

    afterList: async (result, context) => {
      // Fetch carts with full relations directly from Prisma
      const carts = await prisma.cart.findMany({
        where: {
          userId: context!.userId!,
          status: 'ACTIVE',
        },
        include: {
          items: {
            include: { item: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Transform carts with totals
      const cartsWithTotals = await Promise.all(
        carts.map(async (cart) => {
          const totals = await cartDomain.calculateCartTotals(cart.id)

          return {
            id: cart.id,
            userId: cart.userId,
            storeId: cart.storeId,
            status: cart.status,
            note: cart.note,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
            items: cart.items.map((cartItem) => ({
              id: cartItem.id,
              cartId: cartItem.cartId,
              itemId: cartItem.itemId,
              titleSnapshot: cartItem.titleSnapshot,
              unitPrice: cartItem.unitPrice,
              quantity: cartItem.quantity,
              optionsJson: cartItem.optionsJson,
              notes: cartItem.notes,
              createdAt: cartItem.createdAt,
              currentItem: {
                id: cartItem.item.id,
                title: cartItem.item.title,
                price: cartItem.item.price,
                isActive: cartItem.item.isActive,
                isSoldOut: cartItem.item.isSoldOut,
                stockQty: cartItem.item.stockQty,
              },
            })),
            itemCount: totals.itemCount,
            subtotal: totals.subtotal,
          }
        })
      )

      return {
        data: cartsWithTotals,
        total: cartsWithTotals.length,
      }
    },

    // Clear cart (DELETE)
    beforeDelete: async (id, context) => {
      await cartDomain.clearCart(id as string, context!.userId!)
    },
  },
})

