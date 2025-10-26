import { prisma } from '@packages/db'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Cart Domain Service
 * Handles shopping cart business logic
 */
export class CartDomain {
  /**
   * Ensure user has an active cart for a specific store
   */
  async ensureActiveCart(userId: string, storeId: string): Promise<string> {
    // Check if user already has an active cart for this store
    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        storeId,
        status: 'ACTIVE',
      },
    })

    // Create new cart if none exists
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          storeId,
          status: 'ACTIVE',
        },
      })
    }

    return cart.id
  }

  /**
   * Add item to cart with snapshot data
   */
  async addItemToCart(
    userId: string,
    itemId: string,
    quantity: number,
    optionsJson?: Record<string, unknown>,
    notes?: string
  ): Promise<{ cartId: string; cartItemId: string }> {
    // Get item details
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new Error('Item not found')
    }

    if (!item.isActive) {
      throw new Error('Item is not available')
    }

    if (item.isSoldOut) {
      throw new Error('Item is sold out')
    }

    // Check stock if tracked
    if (item.stockQty !== null && item.stockQty < quantity) {
      throw new Error(`Only ${item.stockQty} items available`)
    }

    // Ensure cart exists
    const cartId = await this.ensureActiveCart(userId, item.storeId)

    // Check if item already in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        itemId,
      },
    })

    let cartItem
    if (existingCartItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
          optionsJson: optionsJson as any, // Prisma JSON type
          notes,
        },
      })
    } else {
      // Create new cart item with snapshot
      cartItem = await prisma.cartItem.create({
        data: {
          cartId,
          itemId,
          titleSnapshot: item.title,
          unitPrice: item.price,
          quantity,
          optionsJson: optionsJson as any, // Prisma JSON type
          notes,
        },
      })
    }

    return {
      cartId,
      cartItemId: cartItem.id,
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    cartItemId: string,
    userId: string,
    quantity: number,
    optionsJson?: Record<string, unknown>,
    notes?: string
  ): Promise<void> {
    // Verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    })

    if (!cartItem) {
      throw new Error('Cart item not found')
    }

    if (cartItem.cart.userId !== userId) {
      throw new Error('Unauthorized')
    }

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      })
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity,
          ...(optionsJson && { optionsJson: optionsJson as any }), // Prisma JSON type
          ...(notes !== undefined && { notes }),
        },
      })
    }
  }

  /**
   * Calculate cart totals
   */
  async calculateCartTotals(cartId: string): Promise<{
    itemCount: number
    subtotal: Decimal
  }> {
    const cartItems = await prisma.cartItem.findMany({
      where: { cartId },
    })

    const itemCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const itemPrice = parseFloat(item.unitPrice.toString())
      return sum + itemPrice * item.quantity
    }, 0)

    return {
      itemCount,
      subtotal: new Decimal(subtotal.toFixed(2)),
    }
  }

  /**
   * Clear cart
   */
  async clearCart(cartId: string, userId: string): Promise<void> {
    // Verify ownership
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    })

    if (!cart) {
      throw new Error('Cart not found')
    }

    if (cart.userId !== userId) {
      throw new Error('Unauthorized')
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId },
    })
  }

  /**
   * Validate cart can be submitted (all items still available)
   */
  async validateCartForCheckout(cartId: string): Promise<{
    valid: boolean
    reason?: string
  }> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: { item: true },
        },
      },
    })

    if (!cart) {
      return { valid: false, reason: 'Cart not found' }
    }

    if (cart.items.length === 0) {
      return { valid: false, reason: 'Cart is empty' }
    }

    // Check each item availability
    for (const cartItem of cart.items) {
      if (!cartItem.item.isActive) {
        return {
          valid: false,
          reason: `Item "${cartItem.titleSnapshot}" is no longer available`,
        }
      }

      if (cartItem.item.isSoldOut) {
        return {
          valid: false,
          reason: `Item "${cartItem.titleSnapshot}" is sold out`,
        }
      }

      if (
        cartItem.item.stockQty !== null &&
        cartItem.item.stockQty < cartItem.quantity
      ) {
        return {
          valid: false,
          reason: `Only ${cartItem.item.stockQty} of "${cartItem.titleSnapshot}" available`,
        }
      }
    }

    return { valid: true }
  }
}

export const cartDomain = new CartDomain()

