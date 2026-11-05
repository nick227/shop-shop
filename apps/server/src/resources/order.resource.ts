import { executeOrderCommand } from '@packages/db'
import { canManageOrder } from '../routes/order-operations.route.js'
import { getAccountCapabilities } from '@packages/db'
import { defineResource } from '@packages/schemas/core'
import {
  CreateOrderInputSchema,
  UpdateOrderStatusSchema,
  OrderResponseSchema,
  OrderListResponseSchema,
  OrderQuerySchema,
} from '@packages/schemas/dtos'
import { OrderDomain, eventBus, DomainEvents } from '@packages/domain'
import { CHECKOUT_TOTALS_CONFIG } from '../commerce/pricingPolicy.js'
import {
  prisma,
  publishOrderStatusChanged,
  assertValidTransition,
} from '@packages/db'
import { assertStoreAcceptsOrders, snapshotBundle } from '@packages/db/services'
import { assertOrderAccess } from './order-access.js'
import {
  asOrderBeforeCreateInput,
  buildOrderAddressSnapshot,
  computeOrderCreateDeliveryDistance,
  loadVerifiedAddressForOrder,
  persistDeliveryPair,
  resolveOrderDeliveryCoords,
} from './order-create.helpers.js'

const orderDomain = new OrderDomain(CHECKOUT_TOTALS_CONFIG)

function parsePermissions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((p): p is string => typeof p === 'string') : []
}

async function userHasStorePermission(
  userId: string,
  storeId: string,
  permissions: readonly string[],
): Promise<boolean> {
  const access = await getAccountCapabilities(userId)
  if (!access.canAccessVendorPortal) return false
  if (access.canAdministerStores) return true
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
    create: ['USER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN', 'STAFF', 'AFFILIATE', 'RIDER'],
    read: ['USER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN', 'STAFF', 'AFFILIATE', 'RIDER'],
    update: ['USER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN', 'STAFF', 'AFFILIATE', 'RIDER'],
    delete: ['ADMIN'],
    list: ['USER', 'VENDOR_PENDING', 'VENDOR', 'ADMIN', 'STAFF', 'AFFILIATE', 'RIDER'],
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

      const storeId = f.storeId as string | undefined
      if (storeId) {
        if (!await userHasOrderListAccess(uid, storeId)) throw new Error('Forbidden')
        return { ...f, storeId }
      }
      // A customer's order history remains available regardless of merchant enrollment.
      if (role === 'RIDER' && f.assignedToUserId) return { ...f, assignedToUserId: uid }
      if ((await getAccountCapabilities(uid)).canAdministerStores && !f.userId) return f
      return { ...f, userId: uid }

    },
    beforeUpdate: async (id, input, context) => {
      const existing = await prisma.order.findUnique({ where: { id } })
      if (!existing) {
        throw new Error('Order not found')
      }

      const body = input as { status?: any; assignedToUserId?: string | null; note?: string; prepMinutes?: number; expectedVersion?: number; operationId?: string; collectionCode?: string }
      const manager = await canManageOrder(context!.userId!, existing.storeId)
      const customerCancel = existing.userId === context?.userId && body.status === 'CANCELED' && ['PENDING_PAYMENT', 'PLACED'].includes(existing.status)
      if (!manager && !customerCancel) throw new Error('Order management permission required')
      if (body.status === 'PLACED') throw new Error('Payment confirmation owns order placement')
      if (body.assignedToUserId !== undefined) {
        if (body.status) throw new Error('Assign a driver separately from a status action')
        if (!await actorCanAssignDeliveries(context?.userId, existing.storeId)) throw new Error('Delivery assignment permission required')
        if (body.assignedToUserId && !await userCanReceiveDelivery(body.assignedToUserId, existing.storeId)) throw new Error('Assignee must be an active store driver')
        return { assignedToUserId: body.assignedToUserId }
      }
      const result = await executeOrderCommand({ ...body, orderId: id, newStatus: body.status, customerOnly: !manager, changedBy: context?.userId })
      return { _skipUpdate: true, _result: result }
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

      const orderData = {
        userId,
        storeId: totals.storeId,
        cartId: input.cartId,
        deliveryType: input.deliveryType,
        status: 'PENDING_PAYMENT' as const,
        paymentStatus: 'UNPAID' as const,
        subtotal: totals.subtotal,
        fees: totals.fees,
        tax: totals.tax,
        tip: totals.tip,
        total: totals.total,
        serviceFeePercent: totals.serviceFeePercent,
        serviceFeeAmount: totals.serviceFeeAmount,
        vendorCommissionPercent: totals.vendorCommissionPercent,
        vendorCommissionAmount: totals.vendorCommissionAmount,
        netToVendor: totals.netToVendor,
        addressId: input.addressId,
        addressSnapshot,
        deliveryLatitude: persistPair ? persistPair.lat.toFixed(8) : null,
        deliveryLongitude: persistPair ? persistPair.lng.toFixed(8) : null,
        deliveryDistanceMiles,
        items: { create: orderItemCreates },
      }

      // Create here, in one transaction with a locked availability check, so a store
      // paused or suspended mid-checkout can't take the order.
      const created = await prisma.$transaction(async (tx) => {
        await assertStoreAcceptsOrders(tx, totals.storeId, { lock: true })
        // Same payload the generic service passed through untyped before.
        return tx.order.create({ data: orderData as Parameters<typeof tx.order.create>[0]['data'] })
      })
      return { _skipCreate: true, _result: created }
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
  },
})
