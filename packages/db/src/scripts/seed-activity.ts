import type { Prisma, PrismaClient } from '../generated/client/index.js'
import { OFFICIAL_PLATFORM_STORE_SLUG } from '../constants/platform-store.js'
import { seedActivityEngagement } from './seed-activity-engagement.js'

const SCENARIOS = [
  { status: 'DELIVERED', paymentStatus: 'PAID', deliveryType: 'DELIVERY', deliveryMode: 'STORE_MANAGED_DELIVERY', daysAgo: 18 },
  { status: 'DELIVERED', paymentStatus: 'PAID', deliveryType: 'PICKUP', deliveryMode: 'PICKUP', daysAgo: 11 },
  { status: 'COMPLETED', paymentStatus: 'PAID', deliveryType: 'DELIVERY', deliveryMode: 'STORE_MANAGED_DELIVERY', daysAgo: 26 },
  { status: 'PLACED', paymentStatus: 'PAID', deliveryType: 'DELIVERY', deliveryMode: 'STORE_MANAGED_DELIVERY', daysAgo: 0 },
  { status: 'PREPARING', paymentStatus: 'PAID', deliveryType: 'PICKUP', deliveryMode: 'PICKUP', daysAgo: 0 },
  { status: 'OUT_FOR_DELIVERY', paymentStatus: 'PAID', deliveryType: 'DELIVERY', deliveryMode: 'PLATFORM_DRIVER', daysAgo: 0 },
  { status: 'CANCELED', paymentStatus: 'REFUNDED', deliveryType: 'DELIVERY', deliveryMode: 'STORE_MANAGED_DELIVERY', daysAgo: 4 },
  { status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', deliveryType: 'PICKUP', deliveryMode: 'PICKUP', daysAgo: 0 },
] as const

const EVENT_CHAIN = {
  PENDING_PAYMENT: ['PENDING_PAYMENT'],
  PLACED: ['PENDING_PAYMENT', 'PLACED'],
  PREPARING: ['PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'PREPARING'],
  OUT_FOR_DELIVERY: ['PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'],
  DELIVERED: ['PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  COMPLETED: ['PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED'],
  CANCELED: ['PENDING_PAYMENT', 'PLACED', 'CANCELED'],
} as const

function daysAgo(days: number): Date {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(15, 0, 0, 0)
  return date
}

function pin(geo: Prisma.JsonValue | null): { lat: number; lng: number } | null {
  if (!geo || typeof geo !== 'object' || Array.isArray(geo)) return null
  const record = geo as { lat?: unknown; lng?: unknown }
  if (typeof record.lat !== 'number' || typeof record.lng !== 'number') return null
  return { lat: record.lat, lng: record.lng }
}

function totals(unitPrice: number, quantity: number, fee: number) {
  const subtotal = Number((unitPrice * quantity).toFixed(2))
  const tax = Number((subtotal * 0.0825).toFixed(2))
  const tip = 0
  const serviceFeePercent = 8
  const serviceFeeAmount = Number(((subtotal * serviceFeePercent) / 100).toFixed(2))
  return {
    subtotal,
    fees: fee,
    tax,
    tip,
    total: Number((subtotal + fee + tax + tip).toFixed(2)),
    serviceFeePercent,
    serviceFeeAmount,
    netToVendor: Number((subtotal - serviceFeeAmount).toFixed(2)),
  }
}

export async function seedSiteActivity(prisma: PrismaClient): Promise<void> {
  const customers = await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { email: 'asc' },
    include: { addresses: { where: { isDefault: true }, take: 1 } },
  })
  const stores = await prisma.store.findMany({
    where: {
      isPublished: true,
      status: 'ACTIVE',
      slug: { not: OFFICIAL_PLATFORM_STORE_SLUG },
      items: { some: { isActive: true, isSoldOut: false } },
    },
    orderBy: { slug: 'asc' },
    include: {
      items: {
        where: { isActive: true, isSoldOut: false },
        orderBy: { sortIndex: 'asc' },
        take: 1,
      },
    },
    take: 8,
  })
  if (customers.length === 0 || stores.length === 0) {
    console.log('Site activity skipped: need customers and stores with products.')
    return
  }

  const rider = await prisma.user.findUnique({ where: { email: 'rider@seed.local' }, select: { id: true } })
  const admin = await prisma.user.findUnique({ where: { email: 'admin@seed.local' }, select: { id: true } })
  const affiliate = await prisma.affiliate.findFirst({
    where: { user: { email: 'affiliate@seed.local' }, status: 'ACTIVE' },
    select: { id: true, referralCode: true },
  })

  for (let index = 0; index < SCENARIOS.length; index++) {
    const scenario = SCENARIOS[index]
    const customer = customers[index % customers.length]
    const store = stores[index % stores.length]
    const item = store.items[0]
    const quantity = (index % 2) + 1
    const fee = scenario.deliveryType === 'DELIVERY' ? 3.5 : 0
    const when = daysAgo(scenario.daysAgo)
    const address = customer.addresses[0]
    const dropoff = pin(address?.geo ?? null)
    const paid = scenario.paymentStatus !== 'UNPAID'
    const attributed = index === 0 && affiliate

    const cart = await prisma.cart.create({
      data: {
        userId: customer.id,
        storeId: store.id,
        status: scenario.status === 'PENDING_PAYMENT' ? 'ACTIVE' : 'SUBMITTED',
        createdAt: when,
      },
    })
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        itemId: item.id,
        titleSnapshot: item.title,
        unitPrice: item.price,
        quantity,
      },
    })
    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        storeId: store.id,
        cartId: cart.id,
        status: scenario.status,
        deliveryType: scenario.deliveryType,
        deliveryMode: scenario.deliveryMode,
        paymentStatus: scenario.paymentStatus,
        ...totals(Number(item.price), quantity, fee),
        stripePaymentIntentId: paid ? `pi_seed_activity_${index}` : null,
        addressId: scenario.deliveryType === 'DELIVERY' ? address?.id : null,
        addressSnapshot: address
          ? { line1: address.line1, city: address.city, state: address.state, postalCode: address.postalCode }
          : undefined,
        deliveryLatitude: dropoff?.lat ?? store.latitude,
        deliveryLongitude: dropoff?.lng ?? store.longitude,
        assignedToUserId: scenario.status === 'OUT_FOR_DELIVERY' ? rider?.id : null,
        referredByAffiliateId: attributed ? affiliate.id : null,
        referredByReferralCode: attributed ? affiliate.referralCode : null,
        affiliateAttributionSource: attributed ? 'CUSTOMER_REFERRAL' : null,
        cancelReason: scenario.status === 'CANCELED' ? 'Customer changed plans' : null,
        canceledBy: scenario.status === 'CANCELED' ? customer.id : null,
        canceledAt: scenario.status === 'CANCELED' ? when : null,
        refundReason: scenario.paymentStatus === 'REFUNDED' ? 'Order canceled' : null,
        refundedAt: scenario.paymentStatus === 'REFUNDED' ? when : null,
        createdAt: when,
      },
    })
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        itemId: item.id,
        titleSnapshot: item.title,
        unitPrice: item.price,
        quantity,
      },
    })
    await prisma.orderEvent.createMany({
      data: EVENT_CHAIN[scenario.status].map((status) => ({
        orderId: order.id,
        status,
        createdAt: when,
      })),
    })
  }

  const postsEngaged = await seedActivityEngagement(prisma, customers, stores, admin?.id)
  console.log(`Site activity: ${SCENARIOS.length} orders, ${postsEngaged} posts engaged`)
}
