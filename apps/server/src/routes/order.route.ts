/**
 * Orders Route
 * CRUD operations for orders with real-time notifications
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { orderService } from '@packages/db'
import {
  type CreateOrderInput,
  type UpdateOrderStatus,
} from '@packages/schemas'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { prisma } from '@packages/db'

interface IdParams {
  id: string
}

interface StatusQueryParams {
  status?: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELED'
}

export const orderRoutes = async (app: FastifyInstance) => {
  
  // ========================================
  // Create Order (Customer places order)
  // ========================================
  app.post<{ Body: CreateOrderInput }>(
    '/orders',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Orders'],
        summary: 'Create order from cart',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const userId = req.user!.id
        const { cartId, deliveryType, addressId, tip } = req.body

        // Get cart with items
        const cart = await prisma.cart.findUnique({
          where: { id: cartId, userId },
          include: {
            items: { include: { item: true } },
            store: true,
          },
        })

        if (!cart) {
          return reply.code(404).send({ error: 'Cart not found' })
        }

        if (cart.items.length === 0) {
          return reply.code(400).send({ error: 'Cart is empty' })
        }

        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
          return sum + parseFloat(item.unitPrice.toString()) * item.quantity
        }, 0)

        const deliveryFee = deliveryType === 'DELIVERY' ? parseFloat(cart.store.deliveryCharge?.toString() || '5.00') : 0
        const taxRate = 0.08 // 8% tax
        const tax = subtotal * taxRate
        const tipAmount = parseFloat(tip)
        const serviceFeePercent = 3.0 // 3% platform fee
        const serviceFeeAmount = subtotal * (serviceFeePercent / 100)
        const total = subtotal + deliveryFee + tax + tipAmount

        // Vendor gets: subtotal + deliveryFee + tip - serviceFee
        const netToVendor = subtotal + deliveryFee + tipAmount - serviceFeeAmount

        // Validate address for delivery
        let addressSnapshot = null
        if (deliveryType === 'DELIVERY') {
          if (!addressId) {
            return reply.code(400).send({ error: 'Address required for delivery' })
          }

          const address = await prisma.address.findUnique({
            where: { id: addressId, userId },
          })

          if (!address) {
            return reply.code(404).send({ error: 'Address not found' })
          }

          addressSnapshot = {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            phone: address.phone,
          }
        }

        // Create order
        const order = await prisma.order.create({
          data: {
            userId,
            storeId: cart.storeId,
            cartId: cart.id,
            status: 'PLACED',
            deliveryType,
            paymentStatus: 'UNPAID',
            subtotal,
            fees: deliveryFee,
            tax,
            tip: tipAmount,
            total,
            serviceFeePercent,
            serviceFeeAmount,
            netToVendor,
            addressId: deliveryType === 'DELIVERY' ? addressId : null,
            addressSnapshot: addressSnapshot || undefined,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            store: { select: { id: true, name: true, slug: true } },
          },
        })

        // Create order items
        await prisma.orderItem.createMany({
          data: cart.items.map((cartItem) => ({
            orderId: order.id,
            itemId: cartItem.itemId,
            titleSnapshot: cartItem.titleSnapshot,
            unitPrice: cartItem.unitPrice,
            quantity: cartItem.quantity,
            optionsJson: cartItem.optionsJson || undefined,
            notes: cartItem.notes,
          })),
        })

        // Mark cart as submitted
        await prisma.cart.update({
          where: { id: cartId },
          data: { status: 'SUBMITTED' },
        })

        // Broadcast new order to vendor
        await orderService.broadcastNewOrder(order.id)

        app.log.info({ orderId: order.id, userId, storeId: cart.storeId }, 'Order created')

        return reply.code(201).send(order)
      } catch (error) {
        app.log.error({ error }, 'Failed to create order')
        return reply.code(500).send({ error: 'Failed to create order' })
      }
    }
  )

  // ========================================
  // Get Order by ID
  // ========================================
  app.get<{ Params: IdParams }>(
    '/orders/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Orders'],
        summary: 'Get order by ID',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const { id } = req.params
        const userId = req.user!.id
        const userRole = req.user!.role

        const order = await orderService.getOrderById(id)

        if (!order) {
          return reply.code(404).send({ error: 'Order not found' })
        }

        // Check ownership/access
        const isCustomer = order.userId === userId
        const isVendor = userRole === 'VENDOR' && order.storeId === order.store.id
        const isAdmin = userRole === 'ADMIN'

        if (!isCustomer && !isVendor && !isAdmin) {
          return reply.code(403).send({ error: 'Access denied' })
        }

        return reply.send(order)
      } catch (error) {
        app.log.error({ error }, 'Failed to get order')
        return reply.code(500).send({ error: 'Failed to get order' })
      }
    }
  )

  // ========================================
  // Get Customer Orders
  // ========================================
  app.get<{ Querystring: StatusQueryParams }>(
    '/orders',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Orders'],
        summary: 'Get customer orders',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const userId = req.user!.id
        const { status } = req.query

        const orders = await orderService.getCustomerOrders(userId, { status })

        return reply.send(orders)
      } catch (error) {
        app.log.error({ error }, 'Failed to get orders')
        return reply.code(500).send({ error: 'Failed to get orders' })
      }
    }
  )

  // ========================================
  // Get Vendor Orders
  // ========================================
  app.get<{ Querystring: StatusQueryParams }>(
    '/vendor/orders',
    {
      preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can manage their store orders
      schema: {
        tags: ['Orders'],
        summary: 'Get vendor orders',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const userId = req.user!.id
        const { status } = req.query

        // Get vendor's store
        const store = await prisma.store.findFirst({
          where: { ownerUserId: userId },
        })

        if (!store) {
          return reply.code(404).send({ error: 'Store not found' })
        }

        const orders = await orderService.getVendorOrders(store.id, { status })

        return reply.send(orders)
      } catch (error) {
        app.log.error({ error }, 'Failed to get vendor orders')
        return reply.code(500).send({ error: 'Failed to get vendor orders' })
      }
    }
  )

  // ========================================
  // Get Vendor Pending Orders Count
  // ========================================
  app.get(
    '/vendor/orders/pending-count',
    {
      preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can check their store orders
      schema: {
        tags: ['Orders'],
        summary: 'Get pending orders count',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const userId = req.user!.id

        const store = await prisma.store.findFirst({
          where: { ownerUserId: userId },
        })

        if (!store) {
          return reply.code(404).send({ error: 'Store not found' })
        }

        const count = await orderService.getPendingOrdersCount(store.id)

        return reply.send({ count })
      } catch (error) {
        app.log.error({ error }, 'Failed to get pending count')
        return reply.code(500).send({ error: 'Failed to get pending count' })
      }
    }
  )

  // ========================================
  // Update Order Status (Vendor)
  // ========================================
  app.patch<{ Params: IdParams; Body: UpdateOrderStatus }>(
    '/orders/:id/status',
    {
      preHandler: [authenticate, requireRole(['USER', 'VENDOR', 'ADMIN'])],  // Open platform: any user can update their store orders
      schema: {
        tags: ['Orders'],
        summary: 'Update order status',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const { id } = req.params
        const { status, note } = req.body
        const userId = req.user!.id
        const userRole = req.user!.role

        // Get order
        const order = await prisma.order.findUnique({
          where: { id },
          include: { store: true },
        })

        if (!order) {
          return reply.code(404).send({ error: 'Order not found' })
        }

        // Check vendor ownership
        if (userRole === 'VENDOR' && order.store.ownerUserId !== userId) {
          return reply.code(403).send({ error: 'Access denied' })
        }

        // Update status with broadcasting
        const updatedOrder = await orderService.updateOrderStatus({
          orderId: id,
          newStatus: status,
          note,
          changedBy: userId,
        })

        app.log.info({ orderId: id, oldStatus: order.status, newStatus: status }, 'Order status updated')

        return reply.send(updatedOrder)
      } catch (error) {
        app.log.error({ error }, 'Failed to update order status')
        return reply.code(500).send({ error: 'Failed to update order status' })
      }
    }
  )

  // ========================================
  // Cancel Order
  // ========================================
  app.post<{ Params: IdParams; Body: { reason?: string } }>(
    '/orders/:id/cancel',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Orders'],
        summary: 'Cancel order',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const { id } = req.params
        const { reason } = req.body
        const userId = req.user!.id
        const userRole = req.user!.role

        const order = await prisma.order.findUnique({
          where: { id },
          include: { store: true },
        })

        if (!order) {
          return reply.code(404).send({ error: 'Order not found' })
        }

        // Check permissions
        const isCustomer = order.userId === userId
        const isVendor = userRole === 'VENDOR' && order.store.ownerUserId === userId
        const isAdmin = userRole === 'ADMIN'

        if (!isCustomer && !isVendor && !isAdmin) {
          return reply.code(403).send({ error: 'Access denied' })
        }

        // Can only cancel if not completed
        if (order.status === 'COMPLETED') {
          return reply.code(400).send({ error: 'Cannot cancel completed order' })
        }

        const canceledOrder = await orderService.cancelOrder(id, reason, userId)

        app.log.info({ orderId: id, canceledBy: userId }, 'Order canceled')

        return reply.send(canceledOrder)
      } catch (error) {
        app.log.error({ error }, 'Failed to cancel order')
        return reply.code(500).send({ error: 'Failed to cancel order' })
      }
    }
  )

  app.log.info('[Orders] Routes registered')
}

