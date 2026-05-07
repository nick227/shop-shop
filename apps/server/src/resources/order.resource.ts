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
  publishOrderStatusChanged,
  assertValidTransition,
} from '@packages/db'
import { snapshotBundle } from '@packages/db/services'
import { assertOrderAccess } from './order-access.js'
import {
  asOrderBeforeCreateInput,
  buildOrderAddressSnapshot,
  computeOrderCreateDeliveryDistance,
  loadVerifiedAddressForOrder,
  persistDeliveryPair,
  resolveOrderDeliveryCoords,
} from './order-create.helpers.js'

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

function parsePermissions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : []
}

async function userHasStorePermission(
  userId: string,
  storeId: string,
  permissions: readonly string[],
): Promise<boolean> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { ownerUserId: true },
  })
  if (store?.ownerUserId === userId) return true

  const member = await prisma.teamMember.findFirst({
    where: { storeId, userId, isActive: true },
    select: { permissionsJson: true },
  })
  const memberPermissions = parsePermissions(member?.permissionsJson)
  return memberPermissions.includes('FULL_ACCESS') || permissions.some((p) => memberPermissions.includes(p))
}

function userHasOrderListAccess(userId: string, storeId: string): Promise<boolean> {
  return userHasStorePermission(userId, storeId, [
    'VIEW_ORDERS',
    'MANAGE_ORDERS',
    'VIEW_DELIVERIES',
    'MANAGE_DELIVERIES',
    'ASSIGN_DELIVERIES',
  ])
}

function actorCanAssignDeliveries(userId: string | undefined, storeId: string): Promise<boolean> {
  if (!userId) return Promise.resolve(false)
  return userHasStorePermission(userId, storeId, ['ASSIGN_DELIVERIES'])
}

async function userCanReceiveDelivery(userId: string, storeId: string): Promise<boolean> {
  const member = await prisma.teamMember.findFirst({
    where: { storeId, userId, isActive: true },
    select: { permissionsJson: true },
  })
  const memberPermissions = parsePermissions(member?.permissionsJson)
  return (
    memberPermissions.includes('FULL_ACCESS') ||
    memberPermissions.includes('VIEW_DELIVERIES') ||
    memberPermissions.includes('MANAGE_DELIVERIES') ||
    memberPermissions.includes('ASSIGN_DELIVERIES')
  )
}

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
    read: ['USER', 'VENDOR', 'ADMIN', 'STAFF', 'RIDER'],
    update: ['USER', 'VENDOR', 'ADMIN', 'STAFF', 'RIDER'],
    delete: ['ADMIN'],
    list: ['USER', 'VENDOR', 'ADMIN', 'STAFF', 'RIDER'],
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
        const storeId = f.storeId as string | undefined
        if (storeId && await userHasOrderListAccess(uid, storeId)) {
          return { ...f, storeId }
        }
        return { ...f, userId: uid }
      }

      if (role === 'RIDER') {
        return { ...f, assignedToUserId: uid }
      }

      if (role === 'VENDOR' || role === 'STAFF') {
        const storeId = f.storeId as string | undefined
        if (!storeId) {
          throw new Error('Forbidden')
        }
        if (!(await userHasOrderListAccess(uid, storeId))) {
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
        if (!(await actorCanAssignDeliveries(context?.userId, existing.storeId))) {
          throw new Error('You cannot assign deliveries for this store')
        }
        if (!(await userCanReceiveDelivery(body.assignedToUserId, existing.storeId))) {
          throw new Error('Assignee must be an active store driver')
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
      const input = asOrderBeforeCreateInput(data)
      const userId = context!.userId!
      const tipAmount = Number.parseFloat(input.tip || '0.00')
      const totals = await orderDomain.calculateOrderTotals(
        input.cartId,
        userId,
        input.deliveryType,
        tipAmount,
      )

      const address = await loadVerifiedAddressForOrder(prisma, input.addressId, userId)
      const resolved = resolveOrderDeliveryCoords(input, address)

      if (input.deliveryType === 'DELIVERY' && !resolved) {
        throw new Error('Delivery requires coordinates')
      }

      const addressSnapshot = buildOrderAddressSnapshot(
        address,
        input.deliveryType,
        resolved,
      )
      const persistPair = persistDeliveryPair(input.deliveryType, resolved)

      const { deliveryDistanceMiles, warnMissingStoreCoords } =
        computeOrderCreateDeliveryDistance(totals, persistPair)
      if (warnMissingStoreCoords) {
        console.warn(
          JSON.stringify({
            event: 'order.delivery_distance.skipped',
            reason: 'missing_store_coordinates',
            storeId: totals.storeId,
            timestamp: new Date().toISOString(),
          }),
        )
      }

      // Build OrderItem creates — snapshot bundle contents for immutable order history
      const cartItems = await prisma.cartItem.findMany({
        where: { cartId: input.cartId },
        include: {
          item: { select: { id: true } },
          bundle: { select: { id: true } },
        },
      })

      const orderItemCreates = await Promise.all(
        cartItems.map(async (ci) => {
          const base = {
            titleSnapshot: ci.titleSnapshot,
            unitPrice: ci.unitPrice,
            quantity: ci.quantity,
            optionsJson: ci.optionsJson,
            notes: ci.notes,
          }
          if (ci.bundleId) {
            return { ...base, bundleId: ci.bundleId, bundleSnapshot: await snapshotBundle(ci.bundleId) }
          }
          return { ...base, itemId: ci.itemId }
        }),
      )

      return {
        userId,
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
        items: { create: orderItemCreates },
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
