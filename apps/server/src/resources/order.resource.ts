import { defineResource } from '@packages/schemas/core'
import {
  CreateOrderInputSchema,
  UpdateOrderStatusSchema,
  OrderResponseSchema,
  OrderListResponseSchema,
  OrderQuerySchema,
} from '@packages/schemas/dtos'
import { OrderDomain, eventBus, DomainEvents } from '@packages/domain'
import { prisma } from '@packages/db'

// ========================================
// Order Resource Definition
// Uses centralized domain services
// ========================================

const orderDomain = new OrderDomain()

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
      
      // Publish real-time event to vendor
      try {
        const { realtimeBroker } = await import('../services/realtime.broker.js')
        const order = result as { id: string; userId: string; storeId: string; total: number; deliveryType: string; status: string; cartId?: string }
        
        // Fetch user info for customer name
        const user = await prisma.user.findUnique({ where: { id: order.userId } })
        
        // Fetch order items count
        const items = await prisma.orderItem.findMany({ where: { orderId: order.id } })
        
        realtimeBroker.publish(`vendor:${order.storeId}`, {
          type: 'order.created',
          timestamp: new Date().toISOString(),
          payload: {
            orderId: order.id,
            storeId: order.storeId,
            customerId: order.userId,
            customerName: user?.name || 'Customer',
            total: parseFloat(order.total.toString()),
            deliveryType: order.deliveryType,
            status: order.status,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          }
        })
        
        // Publish to customer
        realtimeBroker.publish(`customer:${order.userId}`, {
          type: 'order.created',
          timestamp: new Date().toISOString(),
          payload: {
            orderId: order.id,
            status: order.status,
          }
        })
      } catch (error) {
        console.error('[Order] Failed to publish realtime event:', error)
        // Don't fail order creation if realtime fails
      }
    },
    afterUpdate: async (result) => {
      // Publish real-time status change event
      try {
        const { realtimeBroker } = await import('../services/realtime.broker.js')
        const order = result as { id: string; userId: string; storeId: string; status: string }
        
        realtimeBroker.publish(`vendor:${order.storeId}`, {
          type: 'order.status.changed',
          timestamp: new Date().toISOString(),
          payload: {
            orderId: order.id,
            newStatus: order.status,
          }
        })
        
        realtimeBroker.publish(`customer:${order.userId}`, {
          type: 'order.status.changed',
          timestamp: new Date().toISOString(),
          payload: {
            orderId: order.id,
            newStatus: order.status,
          }
        })
      } catch (error) {
        console.error('[Order] Failed to publish realtime event:', error)
      }
    },
  },
})

