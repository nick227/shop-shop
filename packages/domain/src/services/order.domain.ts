import { Decimal } from 'decimal.js'
import { prisma, canTransitionTo as checkTransition } from '@packages/db'

// ========================================
// Order Domain Service
// Business operations for order processing
// ========================================

export class OrderDomain {
  private readonly TAX_RATE = 0.10  // 10% sales tax (should be config/per-state)
  private readonly DEFAULT_DELIVERY_FEE = 5.00  // Fallback if store doesn't set deliveryCharge
  
  /**
   * Calculate order totals from cart items
   */
  async calculateOrderTotals(
    cartId: string,
    deliveryType: 'DELIVERY' | 'PICKUP',
    tipAmount: number = 0
  ): Promise<{
    subtotal: Decimal
    fees: Decimal
    tax: Decimal
    tip: Decimal
    total: Decimal
    serviceFeePercent: Decimal
    serviceFeeAmount: Decimal
    netToVendor: Decimal
    storeId: string
    /** Store pin for distance (same cart query — avoids a second Store read at checkout). */
    storeLatitude: number | null
    storeLongitude: number | null
  }> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        store: {
          select: {
            id: true,
            commissionRate: true,
            deliveryCharge: true,
            latitude: true,
            longitude: true,
          }
        },
        items: {
          include: { item: true }
        }
      }
    })
    
    if (!cart) {
      throw new Error('Cart not found')
    }
    
    if (cart.items.length === 0) {
      throw new Error('Cart is empty')
    }
    
    let subtotalNum = 0
    for (const cartItem of cart.items) {
      const itemPrice = Number.parseFloat(cartItem.unitPrice.toString())
      subtotalNum += itemPrice * cartItem.quantity
    }
    
    // Calculate fees (delivery fee)
    let feesNum = 0
    if (deliveryType === 'DELIVERY') {
      // Use store's delivery charge if set, otherwise use default
      if (cart.store.deliveryCharge) {
        feesNum = parseFloat(cart.store.deliveryCharge.toString())
      } else {
        feesNum = this.DEFAULT_DELIVERY_FEE
      }
    }
    
    // Calculate tax
    const taxNum = subtotalNum * this.TAX_RATE
    
    // Tip from user input
    const tipNum = tipAmount
    
    // Calculate total before service fee
    const totalBeforeFee = subtotalNum + feesNum + taxNum + tipNum
    
    // Get dynamic platform service fee (per-store or default)
    const defaultFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10.0')
    const serviceFeePercent = cart.store.commissionRate
      ? parseFloat(cart.store.commissionRate.toString())
      : defaultFeePercent
    
    // Calculate platform service fee (percentage of total before fee)
    const serviceFeeAmountNum = totalBeforeFee * (serviceFeePercent / 100)
    
    // Calculate final total
    const totalNum = totalBeforeFee + serviceFeeAmountNum
    
    // Calculate net to vendor (total - service fee)
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
   * Validate order can be placed
   */
  async validateOrderPlacement(
    cartId: string,
    userId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: { include: { item: true } },
        store: true,
      }
    })
    
    if (!cart) {
      return { valid: false, reason: 'Cart not found' }
    }
    
    if (cart.userId !== userId) {
      return { valid: false, reason: 'Not your cart' }
    }
    
    if (cart.status !== 'ACTIVE') {
      return { valid: false, reason: 'Cart is not active' }
    }
    
    if (cart.items.length === 0) {
      return { valid: false, reason: 'Cart is empty' }
    }
    
    // Check all items are available
    const unavailableItems = cart.items.filter(
      (ci) => !ci.item.isActive || ci.item.isSoldOut,
    )
    if (unavailableItems.length > 0) {
      const names = unavailableItems.map((i) => i.titleSnapshot).join(', ')
      return {
        valid: false,
        reason: `Items unavailable: ${names}`,
      }
    }
    
    // Check store is accepting orders
    if (!cart.store.isPublished) {
      return { valid: false, reason: 'Store is not currently accepting orders' }
    }
    
    return { valid: true }
  }
  
  /**
   * Validate status transition — delegates to the canonical state machine in @packages/db.
   */
  canTransitionTo(
    currentStatus: string,
    newStatus: string,
  ): { valid: boolean; reason?: string } {
    return checkTransition(currentStatus, newStatus)
  }
  
  /**
   * Prepare order data for creation
   */
  async prepareForCreation(input: unknown, userId: string): Promise<Record<string, unknown>> {
    const data = input as {
      cartId: string
      deliveryType: 'DELIVERY' | 'PICKUP'
      deliveryAddressId?: string
      [key: string]: unknown
    }
    
    // Validate order placement
    const validation = await this.validateOrderPlacement(data.cartId, userId)
    if (!validation.valid) {
      throw new Error(validation.reason)
    }
    
    // Calculate totals
    const totals = await this.calculateOrderTotals(data.cartId, data.deliveryType)
    
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

