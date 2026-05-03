import type { Prisma } from '@prisma/client'
import { Decimal } from 'decimal.js'

/** Prisma include shared by placement validation and totals (single source of truth). */
export const CHECKOUT_CART_INCLUDE = {
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

export type CheckoutCart = Prisma.CartGetPayload<{ include: typeof CHECKOUT_CART_INCLUDE }>

export type CheckoutTotals = Readonly<{
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
}>

export type CheckoutTotalsConfig = Readonly<{
  taxRate: number
  defaultDeliveryFee: number
  platformFeePercent: number
}>

export function placementFailureReason(cart: CheckoutCart | null, userId: string): string | null {
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

/** Pure: money lines from an already-validated cart row. */
export function computeCheckoutTotals(
  cart: CheckoutCart,
  deliveryType: 'DELIVERY' | 'PICKUP',
  tipAmount: number,
  config: CheckoutTotalsConfig,
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
      : config.defaultDeliveryFee
  }

  const taxNum = subtotalNum * config.taxRate
  const tipNum = tipAmount
  const totalBeforeFee = subtotalNum + feesNum + taxNum + tipNum

  const serviceFeePercent = cart.store.commissionRate
    ? Number.parseFloat(cart.store.commissionRate.toString())
    : config.platformFeePercent

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
    storeLatitude: cart.store.latitude != null ? Number(cart.store.latitude) : null,
    storeLongitude: cart.store.longitude != null ? Number(cart.store.longitude) : null,
  }
}
