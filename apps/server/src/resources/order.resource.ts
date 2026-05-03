import { defineResource } from '@packages/schemas/core'
import {
  CreateOrderInputSchema,
  UpdateOrderStatusSchema,
  OrderResponseSchema,
  OrderListResponseSchema,
  OrderQuerySchema,
} from '@packages/schemas/dtos'
import { OrderDomain, eventBus, DomainEvents } from '@packages/domain'
import { Prisma } from '@packages/db/generated/client'
import {
  prisma,
  publishOrderStatusChanged,
  assertValidTransition,
  haversineMiles,
} from '@packages/db'
import { assertOrderAccess } from './order-access.js'
import { parseCoordPair, parseGeoJson } from '../utils/order-coords.js'

const orderDomain = new OrderDomain()

/** Correlates PATCH body with prior row so we emit oldStatus exactly once per status change */
const pendingOrderStatusChange = new Map<
  string,
  { oldStatus: string; note?: string; changedBy?: string }
>()

type PatchBody = Readonly<{
  status?: string
  note?: string
  assignedToUserId?: string | null
}>

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
    read: ['USER', 'VENDOR', 'ADMIN', 'RIDER'],
    update: ['VENDOR', 'ADMIN'],
    delete: ['ADMIN'],
    list: ['USER', 'VENDOR', 'ADMIN', 'RIDER'],
  },
  ownership: {
    enabled: false,
  },
  operations: ['create', 'read', 'update', 'delete', 'list'],
  customHooks: {
    authorizeAccess: async (existing, context, operation) => {
      await assertOrderAccess(
        existing as {
          id: string
          userId: string
          storeId: string
          assignedToUserId: string | null
        },
        context,
        operation
      )
    },
    beforeList: async (filters, context) => {
      const f = { ...(filters as Record<string, unknown>) }
      const role = context?.userRole
      const uid = context?.userId
      if (!uid || !role) {
        throw new Error('Forbidden')
      }

      if (role === 'ADMIN') {
        return f
      }

      if (role === 'USER') {
        return { ...f, userId: uid }
      }

      if (role === 'RIDER') {
        return { ...f, assignedToUserId: uid }
      }

      if (role === 'VENDOR') {
        const storeId = f.storeId as string | undefined
        if (!storeId) {
          throw new Error('Forbidden')
        }
        const store = await prisma.store.findUnique({
          where: { id: storeId },
          select: { ownerUserId: true },
        })
        if (!store || store.ownerUserId !== uid) {
          throw new Error('Forbidden')
        }
        return { ...f, storeId }
      }

      throw new Error('Forbidden')
    },
    beforeUpdate: async (id, input, context) => {
      const existing = await prisma.order.findUnique({ where: { id } })
      if (!existing) {
        throw new Error('Order not found')
      }

      const body = input as PatchBody

      if (body.assignedToUserId !== undefined && body.assignedToUserId !== null) {
        const assignee = await prisma.user.findUnique({
          where: { id: body.assignedToUserId },
        })
        if (!assignee || assignee.role !== 'RIDER') {
          throw new Error('Assignee must be a rider')
        }
      }

      if (body.status !== undefined && body.status !== existing.status) {
        // Enforce state machine — throws InvalidOrderTransitionError on invalid
        assertValidTransition(existing.status, body.status)

        console.log(
          JSON.stringify({
            event: 'order.transition',
            orderId: id,
            from: existing.status,
            to: body.status,
            changedBy: context?.userId ?? 'unknown',
            note: body.note ?? null,
            timestamp: new Date().toISOString(),
          }),
        )

        pendingOrderStatusChange.set(id, {
          oldStatus: existing.status,
          note: body.note,
          changedBy: context?.userId,
        })
      } else {
        pendingOrderStatusChange.delete(id)
      }

      const prismaData: {
        status?: string
        assignedToUserId?: string | null
        paymentStatus?: string
      } = {}
      if (body.status !== undefined) {
        prismaData.status = body.status
        if (body.status === 'PLACED') {
          prismaData.paymentStatus = 'PAID'
        }
      }
      if (body.assignedToUserId !== undefined) {
        prismaData.assignedToUserId = body.assignedToUserId
      }

      return prismaData
    },
    beforeCreate: async (data, context) => {
      const input = data as {
        cartId: string
        deliveryType: 'DELIVERY' | 'PICKUP'
        addressId?: string
        tip?: string
        deliveryLatitude?: number | string
        deliveryLongitude?: number | string
      }

      const tipAmount = parseFloat(input.tip || '0.00')
      const totals = await orderDomain.calculateOrderTotals(
        input.cartId,
        context!.userId!,
        input.deliveryType,
        tipAmount,
      )

      let resolved =
        parseCoordPair(input.deliveryLatitude, input.deliveryLongitude) ?? undefined

      let address = null
      if (input.addressId) {
        address = await prisma.address.findUnique({ where: { id: input.addressId } })
        if (!address || address.userId !== context!.userId) {
          throw new Error('Forbidden')
        }
        if (!resolved) {
          resolved = parseGeoJson(address.geo) ?? undefined
        }
      }

      if (input.deliveryType === 'DELIVERY' && !resolved) {
        throw new Error('Delivery requires coordinates')
      }

      const pinGeo =
        resolved !== undefined
          ? { latitude: resolved.lat, longitude: resolved.lng }
          : undefined

      let addressSnapshot: Record<string, unknown> | null = null
      if (address) {
        addressSnapshot = {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          ...(pinGeo ? { geo: pinGeo } : {}),
        }
      } else if (input.deliveryType === 'DELIVERY' && pinGeo) {
        addressSnapshot = {
          line1: 'Delivery location',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          geo: pinGeo,
        }
      }

      const persistPair =
        input.deliveryType === 'DELIVERY' && resolved !== undefined ? resolved : null

      let deliveryDistanceMiles: InstanceType<typeof Prisma.Decimal> | null = null
      if (
        persistPair &&
        totals.storeLatitude != null &&
        totals.storeLongitude != null
      ) {
        const miles = haversineMiles(
          {
            latitude: totals.storeLatitude,
            longitude: totals.storeLongitude,
          },
          { latitude: persistPair.lat, longitude: persistPair.lng },
        )
        deliveryDistanceMiles = new Prisma.Decimal(miles.toFixed(2))
      } else if (persistPair) {
        console.warn(
          JSON.stringify({
            event: 'order.delivery_distance.skipped',
            reason: 'missing_store_coordinates',
            storeId: totals.storeId,
            timestamp: new Date().toISOString(),
          }),
        )
      }

      return {
        userId: context!.userId,
        storeId: totals.storeId,
        cartId: input.cartId,
        deliveryType: input.deliveryType,
        status: 'PENDING_PAYMENT',
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
        deliveryLatitude: persistPair ? persistPair.lat.toFixed(8) : null,
        deliveryLongitude: persistPair ? persistPair.lng.toFixed(8) : null,
        deliveryDistanceMiles,
      }
    },
    afterCreate: async (result) => {
      await prisma.cart.update({
        where: { id: (result as { cartId?: string }).cartId! },
        data: { status: 'SUBMITTED' },
      })

      await eventBus.emit(DomainEvents.ORDER_PLACED, result)
      // publishOrderCreated fires from the Stripe webhook after payment_intent.succeeded
      // so vendors are only notified once payment is confirmed
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
