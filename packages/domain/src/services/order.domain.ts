import type { Prisma } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { prisma, canTransitionTo as checkTransition } from '@packages/db'

// ========================================
// Order Domain Service
// ========================================

const CHECKOUT_CART_INCLUDE = {
  items: { include: { item: true } },
  store: {
    select: {
      id: true,
      isPublished: true,
      commissionRate: true,
      deliveryCharge: true,
      latitude: true,
      longitude: true,
    },
  },
} as const

type CheckoutCart = Prisma.CartGetPayload<{ include: typeof CHECKOUT_CART_INCLUDE }>

export type CheckoutTotals = {
  subtotal: Decimal
  fees: Decimal
  tax: Decimal
  tip: Decimal
  total: Decimal
  serviceFeePercent: Decimal
  serviceFeeAmount: Decimal
  netToVendor: Decimal
  storeId: string
  storeLatitude: number | null
  storeLongitude: number | null
}

function placementFailureReason(cart: CheckoutCart | null, userId: string): string | null {
  if (!cart) {
    return 'Cart not found'
  }
  if (cart.userId !== userId) {
    return 'Not your cart'
  }
  if (cart.status !== 'ACTIVE') {
    return 'Cart is not active'
  }
  if (cart.items.length === 0) {
    return 'Cart is empty'
  }

  const unavailable: string[] = []
  for (const ci of cart.items) {
    if (!ci.item.isActive || ci.item.isSoldOut) {
      unavailable.push(ci.titleSnapshot)
    }
  }
  if (unavailable.length > 0) {
    return `Items unavailable: ${unavailable.join(', ')}`
  }

  if (!cart.store.isPublished) {
    return 'Store is not currently accepting orders'
  }

  return null
}

export class OrderDomain {
  private readonly TAX_RATE = 0.10
  private readonly DEFAULT_DELIVERY_FEE = 5.0

  private computeTotalsFromCart(
    cart: CheckoutCart,
    deliveryType: 'DELIVERY' | 'PICKUP',
    tipAmount: number,
  ): CheckoutTotals {
    let subtotalNum = 0
    for (const cartItem of cart.items) {
      const itemPrice = Number.parseFloat(cartItem.unitPrice.toString())
      subtotalNum += itemPrice * cartItem.quantity
    }

    let feesNum = 0
    if (deliveryType === 'DELIVERY') {
      feesNum = cart.store.deliveryCharge
        ? Number.parseFloat(cart.store.deliveryCharge.toString())
        : this.DEFAULT_DELIVERY_FEE
    }

    const taxNum = subtotalNum * this.TAX_RATE
    const tipNum = tipAmount
    const totalBeforeFee = subtotalNum + feesNum + taxNum + tipNum

    const defaultFeePercent = Number.parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10.0')
    const serviceFeePercent = cart.store.commissionRate
      ? Number.parseFloat(cart.store.commissionRate.toString())
      : defaultFeePercent

    const serviceFeeAmountNum = totalBeforeFee * (serviceFeePercent / 100)
    const totalNum = totalBeforeFee + serviceFeeAmountNum
    const netToVendorNum = totalNum - serviceFeeAmountNum

    return {
      subtotal: new Decimal(subtotalNum.toFixed(2)),
      fees: new Decimal(feesNum.toFixed(2)),
      tax: new Decimal(taxNum.toFixed(2)),
      tip: new Decimal(tipNum.toFixed(2)),
      total: new Decimal(totalNum.toFixed(2)),
      serviceFeePercent: new Decimal(serviceFeePercent.toFixed(2)),
      serviceFeeAmount: new Decimal(serviceFeeAmountNum.toFixed(2)),
      netToVendor: new Decimal(netToVendorNum.toFixed(2)),
      storeId: cart.store.id,
      storeLatitude:
        cart.store.latitude != null ? Number(cart.store.latitude) : null,
      storeLongitude:
        cart.store.longitude != null ? Number(cart.store.longitude) : null,
    }
  }

  /**
   * One DB read: validate cart ownership/state/items/store, then compute totals.
   * Prefer this over calling validateOrderPlacement + calculateOrderTotals separately.
   */
  async calculateOrderTotals(
    cartId: string,
    userId: string,
    deliveryType: 'DELIVERY' | 'PICKUP',
    tipAmount: number = 0,
  ): Promise<CheckoutTotals> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: CHECKOUT_CART_INCLUDE,
    })

    const reason = placementFailureReason(cart, userId)
    if (reason) {
      throw new Error(reason)
    }

    return this.computeTotalsFromCart(cart, deliveryType, tipAmount)
  }

  /**
   * Soft validation (same rules as totals) without computing money — uses one cart read.
   */
  async validateOrderPlacement(
    cartId: string,
    userId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: CHECKOUT_CART_INCLUDE,
    })
    const reason = placementFailureReason(cart, userId)
    return reason ? { valid: false, reason } : { valid: true }
  }

  canTransitionTo(
    currentStatus: string,
    newStatus: string,
  ): { valid: boolean; reason?: string } {
    return checkTransition(currentStatus, newStatus)
  }

  async prepareForCreation(input: unknown, userId: string): Promise<Record<string, unknown>> {
    const data = input as {
      cartId: string
      deliveryType: 'DELIVERY' | 'PICKUP'
      deliveryAddressId?: string
      [key: string]: unknown
    }

    const totals = await this.calculateOrderTotals(data.cartId, userId, data.deliveryType, 0)

    return {
      ...data,
      userId,
      storeId: totals.storeId,
      subtotal: totals.subtotal,
      fees: totals.fees,
      tax: totals.tax,
      tip: totals.tip,
      total: totals.total,
      serviceFeePercent: totals.serviceFeePercent,
      serviceFeeAmount: totals.serviceFeeAmount,
      netToVendor: totals.netToVendor,
    }
  }
}
