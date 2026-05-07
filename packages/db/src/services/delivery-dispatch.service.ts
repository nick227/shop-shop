import type { DeliveryJob, DeliveryJobStatus, DeliveryProvider, OrderStatus } from '../generated/client/index.js'
import { prisma } from '../client.js'
import { OrderService } from './order.service.js'
import { getDeliveryProviderAdapter } from './delivery-provider.registry.js'

export type DispatchDeliveryInput = Readonly<{
  orderId: string
  provider: DeliveryProvider
  requestedByUserId?: string
  assignedToUserId?: string
}>

async function assertActiveStoreDriver(userId: string, storeId: string): Promise<void> {
  const member = await prisma.teamMember.findFirst({
    where: { storeId, userId, isActive: true },
    select: { permissionsJson: true },
  })
  const permissions = Array.isArray(member?.permissionsJson)
    ? member.permissionsJson.filter((p): p is string => typeof p === 'string')
    : []

  const ok =
    permissions.includes('FULL_ACCESS') ||
    permissions.includes('VIEW_DELIVERIES') ||
    permissions.includes('MANAGE_DELIVERIES') ||
    permissions.includes('ASSIGN_DELIVERIES')

  if (!ok) {
    throw new Error('Assignee must be an active store driver')
  }
}

export async function dispatchOrderDelivery(input: DispatchDeliveryInput): Promise<DeliveryJob> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      storeId: true,
      status: true,
      deliveryType: true,
      deliveryMode: true,
      deliveryLatitude: true,
      deliveryLongitude: true,
      addressSnapshot: true,
    },
  })
  if (!order) throw new Error('Order not found')
  if (order.deliveryType !== 'DELIVERY') throw new Error('Order is not a delivery order')
  if (order.status !== 'READY') throw new Error('Order must be READY to dispatch')
  if (order.deliveryMode === 'PICKUP') throw new Error('PICKUP orders cannot be dispatched')
  
  // Validate delivery mode consistency
  const validModeCombinations = {
    'IN_HOUSE': ['STORE_MANAGED_DELIVERY'],
    'DOORDASH_DRIVE': ['THIRD_PARTY_PROVIDER'],
    'UBER_DIRECT': ['THIRD_PARTY_PROVIDER'],
  }
  
  const allowedModes = validModeCombinations[input.provider] || []
  if (!allowedModes.includes(order.deliveryMode)) {
    throw new Error(`Delivery mode ${order.deliveryMode} is not compatible with provider ${input.provider}`)
  }
  if (order.deliveryLatitude == null || order.deliveryLongitude == null) {
    throw new Error('Delivery requires coordinates')
  }

  const existingActive = await prisma.deliveryJob.findFirst({
    where: { orderId: order.id, status: { in: ['REQUESTED', 'DISPATCHED'] } },
    select: { id: true, status: true },
  })
  if (existingActive) {
    throw new Error('Order already has an active delivery job')
  }

  if (input.provider === 'IN_HOUSE') {
    if (!input.assignedToUserId) {
      throw new Error('IN_HOUSE dispatch requires assignedToUserId')
    }
    await assertActiveStoreDriver(input.assignedToUserId, order.storeId)
    await prisma.order.update({
      where: { id: order.id },
      data: { assignedToUserId: input.assignedToUserId },
      select: { id: true },
    })
  }

  const job = await prisma.deliveryJob.create({
    data: {
      orderId: order.id,
      storeId: order.storeId,
      provider: input.provider,
      status: 'REQUESTED',
      requestedByUserId: input.requestedByUserId,
      providerPayload: { created_from: 'dispatchOrderDelivery' },
    },
  })

  const adapter = getDeliveryProviderAdapter(input.provider)
  const created = await adapter.createDelivery({
    deliveryJobId: job.id,
    orderId: order.id,
    storeId: order.storeId,
    dropoffLatitude: Number(order.deliveryLatitude),
    dropoffLongitude: Number(order.deliveryLongitude),
    dropoffAddressSnapshot: order.addressSnapshot ?? undefined,
  })

  return prisma.deliveryJob.update({
    where: { id: job.id },
    data: {
      status: 'DISPATCHED',
      providerExternalId: created.providerExternalId,
      trackingUrl: created.trackingUrl,
      providerStatus: created.providerStatus,
      providerPayload: created.providerPayload as object | undefined,
    },
  })
}

export type ProviderWebhookApplyInput = Readonly<{
  deliveryJobId: string
  eventType: string
  payload: unknown
}>

/**
 * Apply a provider webhook event to a DeliveryJob and (optionally) the Order.
 *
 * Mapping rules:
 * - provider picked_up → order OUT_FOR_DELIVERY
 * - provider delivered → order DELIVERED
 * - provider failed/canceled → do NOT cancel the order
 */
export async function applyDeliveryProviderWebhookEvent(
  input: ProviderWebhookApplyInput
): Promise<{
  deliveryJob: DeliveryJob
  mappedOrderStatus?: OrderStatus
}> {
  const job = await prisma.deliveryJob.findUnique({
    where: { id: input.deliveryJobId },
    select: { id: true, orderId: true, provider: true, status: true },
  })
  if (!job) throw new Error('DeliveryJob not found')

  const adapter = getDeliveryProviderAdapter(job.provider)
  const mapped = await adapter.mapWebhookEvent({
    provider: job.provider,
    eventType: input.eventType,
    payload: input.payload,
  })

  const nextJobStatus: DeliveryJobStatus | undefined =
    mapped.providerStatus === 'delivered'
      ? 'COMPLETED'
      : mapped.providerStatus === 'canceled'
        ? 'CANCELED'
        : mapped.providerStatus === 'failed'
          ? 'FAILED'
          : undefined

  const updatedJob = await prisma.deliveryJob.update({
    where: { id: job.id },
    data: {
      providerStatus: mapped.providerStatus,
      providerPayload: mapped.providerPayload as object | undefined,
      ...(nextJobStatus ? {
        status: nextJobStatus,
        ...(nextJobStatus === 'CANCELED' ? { canceledAt: new Date() } : {}),
        ...(nextJobStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
      } : {}),
    },
  })

  if (mapped.mappedOrderStatus === 'OUT_FOR_DELIVERY' || mapped.mappedOrderStatus === 'DELIVERED') {
    const orderService = new OrderService()
    await orderService.transitionOrderStatus({
      orderId: job.orderId,
      newStatus: mapped.mappedOrderStatus,
      note: mapped.note,
      changedBy: 'delivery_provider',
    })
  }

  return { deliveryJob: updatedJob, mappedOrderStatus: mapped.mappedOrderStatus }
}

