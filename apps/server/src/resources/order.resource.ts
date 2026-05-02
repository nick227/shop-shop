import { defineResource } from '@packages/schemas/core'
import {
  CreateOrderInputSchema,
  UpdateOrderStatusSchema,
  OrderResponseSchema,
  OrderListResponseSchema,
  OrderQuerySchema,
} from '@packages/schemas/dtos'
import { OrderDomain, eventBus, DomainEvents } from '@packages/domain'
import {
  prisma,
  publishOrderCreated,
  publishOrderStatusChanged,
} from '@packages/db'

// ========================================
// Order Resource Definition
// Uses centralized domain services
// ========================================

const orderDomain = new OrderDomain()

/** Correlates PATCH body with prior row so we emit oldStatus exactly once per status change */
const pendingOrderStatusChange = new Map<
  string,
  { oldStatus: string; note?: string; changedBy?: string }
>()

export const orderResource = defineResource({
  name: 'order',
  model: 'Order',
  path: '/orders',
  schemas: {
    create: CreateOrderInputSchema,
    update: UpdateOrderStatusSchema,
    response: OrderResponseSchema,
    list: OrderListResponseSchema,
    query: OrderQuerySchema,
  },
  access: {
    create: ['USER', 'VENDOR', 'ADMIN'],
    read: ['USER', 'VENDOR', 'ADMIN'],
    update: ['VENDOR', 'ADMIN'],  // Only store owner can update status
    delete: ['ADMIN'],
    list: ['USER', 'VENDOR', 'ADMIN'],
  },
  ownership: {
    enabled: true,
    relationPath: 'userId',  // Users can see their own orders
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    beforeUpdate: async (id, input, context) => {
      const existing = await prisma.order.findUnique({ where: { id } })
      if (!existing) {
        throw new Error('Order not found')
      }
      const body = input as { status?: string; note?: string }
      if (body.status !== undefined && body.status !== existing.status) {
        pendingOrderStatusChange.set(id, {
          oldStatus: existing.status,
          note: body.note,
          changedBy: context?.userId,
        })
      } else {
        pendingOrderStatusChange.delete(id)
      }
      return input
    },
    beforeCreate: async (data, context) => {
      const input = data as { cartId: string; deliveryType: 'DELIVERY' | 'PICKUP'; addressId?: string; tip?: string }
      
      // Validate order placement
      const validation = await orderDomain.validateOrderPlacement(input.cartId, context!.userId!)
      if (!validation.valid) {
        throw new Error(validation.reason!)
      }
      
      // Calculate totals with tip
      const tipAmount = parseFloat(input.tip || '0.00')
      const totals = await orderDomain.calculateOrderTotals(input.cartId, input.deliveryType, tipAmount)
      
      // Get address snapshot if delivery
      let addressSnapshot = null
      if (input.addressId) {
        const address = await prisma.address.findUnique({ where: { id: input.addressId } })
        if (address) {
          addressSnapshot = {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          }
        }
      }
      
      return {
        userId: context!.userId,
        storeId: totals.storeId,
        cartId: input.cartId,
        deliveryType: input.deliveryType,
        paymentStatus: 'UNPAID',
        subtotal: totals.subtotal,
        fees: totals.fees,
        tax: totals.tax,
        tip: totals.tip,
        total: totals.total,
        serviceFeePercent: totals.serviceFeePercent,
        serviceFeeAmount: totals.serviceFeeAmount,
        netToVendor: totals.netToVendor,
        addressId: input.addressId,
        addressSnapshot,
      }
    },
    afterCreate: async (result) => {
      // Mark cart as SUBMITTED
      await prisma.cart.update({
        where: { id: (result as { cartId?: string }).cartId! },
        data: { status: 'SUBMITTED' }
      })
      
      // Emit domain event
      await eventBus.emit(DomainEvents.ORDER_PLACED, result)
      
      try {
        await publishOrderCreated((result as { id: string }).id)
      } catch (error) {
        console.error('[Order] publishOrderCreated failed:', error)
      }
    },
    afterUpdate: async (result) => {
      const order = result as { id: string; status: string }
      const pending = pendingOrderStatusChange.get(order.id)
      pendingOrderStatusChange.delete(order.id)
      if (!pending) {
        return
      }
      try {
        await publishOrderStatusChanged(order.id, pending.oldStatus, order.status, {
          note: pending.note,
          changedBy: pending.changedBy,
        })
      } catch (error) {
        console.error('[Order] publishOrderStatusChanged failed:', error)
      }
    },
  },
})

