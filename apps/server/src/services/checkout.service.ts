import {
  Decimal,
  prisma,
  processOrderPayment,
  publishOrderCreated,
  getAffiliateByReferralCode,
  assertStoreAcceptsOrders,
  StoreUnavailableError,
  computeBundlePrice,
} from '@packages/db'
import { OrderDomain, computeCheckoutTotals } from '@packages/domain'
import { AppError } from '../middleware/errors.js'
import { CHECKOUT_TOTALS_CONFIG } from '../commerce/pricingPolicy.js'
import { calculateTax, resolveTaxCategory, type TaxResult } from '../commerce/tax.js'
import {
  deliveryEligibility,
  resolveDestination,
  type DeliveryAddressInput,
  type DeliveryEligibility,
  type ResolvedDestination,
} from '../commerce/fulfillment.js'
import type { TaxCategory } from '@packages/db/generated/client'
import { isCodPaymentsEnabled } from '../config/stripeConnectUrls.js'

const SESSION_TTL_MS = 60 * 60 * 1000

const orderDomain = new OrderDomain(CHECKOUT_TOTALS_CONFIG)

function decimalToPrisma(d: InstanceType<typeof Decimal>) {
  return new Decimal(d.toFixed(2))
}

/** The older address shape some clients still send. */
type LegacyDeliveryAddress = {
  street: string
  city: string
  state: string
  zipCode: string
  instructions?: string
}

type SessionMeta = {
  deliveryType: 'DELIVERY' | 'PICKUP'
  deliveryMode: 'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'
  /** Where it's going, as resolved when the session started (no re-geocoding at completion). */
  destination?: ResolvedDestination | null
  /** The total the shopper agreed to; completion refuses a different one. */
  quotedTotal?: number
  tipAmount?: number
}

/** Store availability as a 409 the checkout client can show. */
async function ensureStoreAcceptsOrders(
  client: Parameters<typeof assertStoreAcceptsOrders>[0],
  storeId: string,
  options?: Parameters<typeof assertStoreAcceptsOrders>[2],
) {
  try {
    await assertStoreAcceptsOrders(client, storeId, options)
  } catch (error) {
    if (error instanceof StoreUnavailableError) throw new AppError(409, error.message)
    throw error
  }
}

/** A cart line as the shopper sends it: one item, or one bundle. */
export type CheckoutLineInput = {
  itemId?: string | null
  bundleId?: string | null
  quantity: number
  specialInstructions?: string
}

/** A line priced from the database, never from the client. */
type ResolvedLine = {
  itemId: string | null
  bundleId: string | null
  quantity: number
  unitPrice: InstanceType<typeof Decimal>
  titleSnapshot: string
  notes?: string
  /** Set from the item (or a bundle's items); null means "use the store's default". */
  taxCategory: TaxCategory | null
}

/** A bundle's category: the one most of its items share. */
function bundleTaxCategory(categories: readonly (TaxCategory | null)[]): TaxCategory | null {
  const counts = new Map<TaxCategory | null, number>()
  for (const category of categories) counts.set(category, (counts.get(category) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

/**
 * Prices every line from the database: an item at its current price, a bundle at the price its pricing
 * rules resolve. Every line must be on sale and from the same store.
 */
export async function resolveCheckoutLines(lines: CheckoutLineInput[]): Promise<{ storeId: string; lines: ResolvedLine[] }> {
  if (!Array.isArray(lines) || lines.length === 0) throw new AppError(400, 'Your cart is empty')
  const resolved = await Promise.all(
    lines.map(async (line): Promise<ResolvedLine & { storeId: string }> => {
      const quantity = Math.floor(Number(line.quantity))
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) throw new AppError(400, 'Each quantity must be between 1 and 99')
      if (line.bundleId) {
        const bundle = await prisma.bundle.findUnique({
          where: { id: line.bundleId },
          include: { items: { include: { item: { select: { isActive: true, isSoldOut: true, storeId: true, taxCategory: true } } } } },
        })
        if (!bundle || !bundle.isActive) throw new AppError(400, 'A bundle in your cart is no longer available')
        if (bundle.items.length === 0 || bundle.items.some((bi) => !bi.item.isActive || bi.item.isSoldOut || bi.item.storeId !== bundle.storeId)) {
          throw new AppError(400, `"${bundle.name}" is not available right now`)
        }
        const price = await computeBundlePrice(bundle.id)
        return {
          storeId: bundle.storeId,
          itemId: null,
          bundleId: bundle.id,
          quantity,
          unitPrice: new Decimal(price.resolvedPrice.toFixed(2)),
          titleSnapshot: bundle.name,
          notes: line.specialInstructions,
          taxCategory: bundleTaxCategory(bundle.items.map((bi) => bi.item.taxCategory)),
        }
      }
      if (!line.itemId) throw new AppError(400, 'Each cart line needs an item or a bundle')
      const item = await prisma.item.findUnique({ where: { id: line.itemId } })
      if (!item) throw new AppError(400, 'An item in your cart is no longer available')
      if (!item.isActive || item.isSoldOut) throw new AppError(400, `Item "${item.title}" is not available`)
      return {
        storeId: item.storeId,
        itemId: item.id,
        bundleId: null,
        quantity,
        unitPrice: item.price,
        titleSnapshot: item.title,
        notes: line.specialInstructions,
        taxCategory: item.taxCategory,
      }
    }),
  )
  const storeIds = [...new Set(resolved.map((line) => line.storeId))]
  if (storeIds.length > 1) throw new AppError(400, 'All items must be from the same store')
  const storeId = storeIds[0]
  if (!storeId) throw new AppError(400, 'Could not determine store from items')
  return { storeId, lines: resolved.map(({ storeId: _store, ...line }) => line) }
}

export type CheckoutQuoteInput = {
  items: CheckoutLineInput[]
  deliveryType: 'PICKUP' | 'DELIVERY'
  tipAmount?: number
  /** A saved address of the signed-in shopper. */
  deliveryAddressId?: string | null
  /** Or a typed one. */
  deliveryAddress?: DeliveryAddressInput | LegacyDeliveryAddress | null
}

const PRICING_STORE_SELECT = {
  id: true,
  storeType: true,
  defaultTaxCategory: true,
  commissionRate: true,
  deliveryCharge: true,
  deliveryDistance: true,
  deliveryMinimum: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  latitude: true,
  longitude: true,
  addressStreet: true,
  addressCity: true,
  addressState: true,
  addressZip: true,
  addressCountry: true,
} as const

/** Accepts the older `{ street, zipCode }` shape too. */
function addressInput(raw: CheckoutQuoteInput['deliveryAddress']): unknown {
  if (!raw) return null
  const legacy = raw as Partial<LegacyDeliveryAddress>
  return 'street' in raw ? { line1: legacy.street, city: legacy.city, state: legacy.state, postalCode: legacy.zipCode, instructions: legacy.instructions } : raw
}

interface PricedCheckout {
  readonly totals: ReturnType<typeof computeCheckoutTotals>
  readonly tax: TaxResult
  readonly delivery: DeliveryEligibility
  readonly pickupAvailable: boolean
  /** Why the requested fulfillment can't happen; the totals are then not payable. */
  readonly blocked: { code: string; message: string } | null
}

/**
 * The one pricing path: delivery from the service area, tax from the tax provider, fees from the
 * platform policy. Quotes, sessions and order completion all go through here.
 */
async function priceCheckout(args: {
  storeId: string
  lines: readonly ResolvedLine[]
  deliveryType: 'PICKUP' | 'DELIVERY'
  tip: number
  destination: ResolvedDestination | 'NOT_FOUND' | null
}): Promise<PricedCheckout> {
  const store = await prisma.store.findUnique({ where: { id: args.storeId }, select: PRICING_STORE_SELECT })
  if (!store) throw new AppError(404, 'Store not found')
  const subtotal = args.lines.reduce((sum, line) => sum + Number(line.unitPrice) * line.quantity, 0)
  const delivery = await deliveryEligibility(store, args.destination, Math.round(subtotal * 100) / 100)

  let blocked: PricedCheckout['blocked'] = null
  if (args.deliveryType === 'DELIVERY' && !delivery.available) blocked = { code: delivery.code, message: delivery.message }
  if (args.deliveryType === 'PICKUP' && !store.pickupEnabled) blocked = { code: 'STORE_DOES_NOT_OFFER_PICKUP', message: 'This store offers delivery only.' }

  const delivering = args.deliveryType === 'DELIVERY' && delivery.available
  const deliveryFee = delivering ? delivery.fee : 0
  const storeAddress = {
    line1: store.addressStreet,
    city: store.addressCity,
    state: store.addressState,
    postalCode: store.addressZip,
    country: store.addressCountry ?? 'US',
  }
  const destination = delivering && args.destination && args.destination !== 'NOT_FOUND' ? args.destination.address : storeAddress
  const tax = await calculateTax({
    lines: args.lines.map((line, index) => ({
      reference: line.itemId ?? line.bundleId ?? `line-${index}`,
      amountCents: Math.round(Number(line.unitPrice) * line.quantity * 100),
      quantity: line.quantity,
      category: resolveTaxCategory(line.taxCategory, store.defaultTaxCategory, store.storeType),
    })),
    deliveryFeeCents: Math.round(deliveryFee * 100),
    destination,
    origin: storeAddress,
  })

  const totals = computeCheckoutTotals(
    { items: args.lines, store } as unknown as Parameters<typeof computeCheckoutTotals>[0],
    delivering ? 'DELIVERY' : 'PICKUP',
    args.tip,
    CHECKOUT_TOTALS_CONFIG,
    { deliveryFee, tax: tax.taxCents / 100 },
  )
  return { totals, tax, delivery, pickupAvailable: store.pickupEnabled, blocked }
}

const deliveryAvailability = (delivery: DeliveryEligibility) =>
  delivery.available
    ? { available: true, fee: delivery.fee, minimum: delivery.minimum, distanceMiles: delivery.distanceMiles }
    : { available: false, code: delivery.code, message: delivery.message, minimum: delivery.minimum, shortBy: delivery.shortBy }

/**
 * The exact totals checkout would charge for these lines right now, from the same pricing code that
 * creates the order, and whether pickup and delivery are possible. Nothing is stored.
 */
export async function quoteCheckout(input: CheckoutQuoteInput, userId: string | null = null) {
  const deliveryType = input.deliveryType === 'DELIVERY' ? 'DELIVERY' : 'PICKUP'
  const tip = Math.max(0, Number(input.tipAmount ?? 0) || 0)
  const { storeId, lines } = await resolveCheckoutLines(input.items)
  const destination = await resolveDestination(
    { deliveryAddressId: input.deliveryAddressId, deliveryAddress: addressInput(input.deliveryAddress) },
    userId,
  )
  const priced = await priceCheckout({ storeId, lines, deliveryType, tip, destination })
  const { totals } = priced
  return {
    storeId,
    deliveryType,
    lines: lines.map((line) => ({
      itemId: line.itemId,
      bundleId: line.bundleId,
      title: line.titleSnapshot,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
    })),
    subtotal: totals.subtotal.toNumber(),
    deliveryFee: totals.fees.toNumber(),
    tax: totals.tax.toNumber(),
    /** True when tax is a development estimate; the shopper must see it labeled so. */
    taxEstimated: priced.tax.estimated,
    serviceFee: totals.serviceFeeAmount.toNumber(),
    tip: totals.tip.toNumber(),
    total: totals.total.toNumber(),
    /** Set when the requested fulfillment isn't possible; the totals can't be paid as quoted. */
    blocked: priced.blocked,
    fulfillment: {
      pickup: { available: priced.pickupAvailable },
      delivery: deliveryAvailability(priced.delivery),
    },
    destination:
      destination && destination !== 'NOT_FOUND'
        ? { addressId: destination.addressId, address: destination.address, approximate: destination.approximate }
        : null,
  }
}

export type CreateSessionInput = {
  items: CheckoutLineInput[]
  deliveryType: 'PICKUP' | 'DELIVERY'
  deliveryMode: 'PICKUP' | 'STORE_MANAGED_DELIVERY' | 'PLATFORM_DRIVER' | 'THIRD_PARTY_PROVIDER'
  deliveryAddressId?: string | null
  deliveryAddress?: DeliveryAddressInput | LegacyDeliveryAddress | null
  paymentMethod: { type: string; token: string }
  tipAmount?: number
  promoCode?: string
}

export type CompleteCheckoutInput = {
  sessionId: string
  paymentMethod: { type: string; token: string }
  tipAmount: number
  promoCode?: string
  /** CARD = Stripe; COD = pay at pickup/delivery (requires ENABLE_COD_PAYMENTS). */
  paymentRail?: 'CARD' | 'COD'
  /**
   * Optional referral code captured client-side (e.g. from /r/:slugOrCode landing).
   * If the buyer is currently unattributed, server snaps it onto the user inside
   * the order tx so all downstream commission paths use the same attribution.
   * Ignored if the user is already attributed.
   */
  affiliateReferralCode?: string
}

function resolvePaymentRail(input: CompleteCheckoutInput): 'CARD' | 'COD' {
  if (input.paymentRail === 'COD' || input.paymentRail === 'CARD') {
    return input.paymentRail
  }
  const t = input.paymentMethod.token
  return t === 'cod_test' || t === 'cod' ? 'COD' : 'CARD'
}

export async function createCheckoutSession(userId: string, input: CreateSessionInput) {
  const deliveryType = input.deliveryType === 'DELIVERY' ? 'DELIVERY' : 'PICKUP'
  const { lines, storeId } = await resolveCheckoutLines(input.items)
  await ensureStoreAcceptsOrders(prisma, storeId)

  const destination =
    deliveryType === 'DELIVERY'
      ? await resolveDestination({ deliveryAddressId: input.deliveryAddressId, deliveryAddress: addressInput(input.deliveryAddress) }, userId)
      : null
  const tip = Math.max(0, Number(input.tipAmount ?? 0) || 0)
  const priced = await priceCheckout({ storeId, lines, deliveryType, tip, destination })
  if (priced.blocked) throw new AppError(422, priced.blocked.message)

  const meta: SessionMeta = {
    deliveryType,
    deliveryMode: deliveryType === 'PICKUP' ? 'PICKUP' : input.deliveryMode,
    destination: destination && destination !== 'NOT_FOUND' ? destination : null,
    quotedTotal: priced.totals.total.toNumber(),
    tipAmount: tip,
  }

  const cart = await prisma.cart.create({
    data: {
      userId,
      storeId,
      status: 'ACTIVE',
      note: JSON.stringify(meta),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      items: {
        create: lines.map((line) => ({
          itemId: line.itemId,
          bundleId: line.bundleId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          titleSnapshot: line.titleSnapshot,
          notes: line.notes,
        })),
      },
    },
    select: { id: true },
  })

  return {
    sessionId: cart.id,
    total: priced.totals.total.toNumber(),
    // Kept for older clients; real timing comes from the store once it accepts the order.
    estimatedDelivery: null,
  }
}

export async function completeCheckout(userId: string | undefined, input: CompleteCheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { id: input.sessionId },
    select: {
      userId: true,
      storeId: true,
      status: true,
      note: true,
      expiresAt: true,
      order: { select: { id: true, paymentStatus: true } },
      items: {
        select: {
          itemId: true,
          bundleId: true,
          quantity: true,
          unitPrice: true,
          titleSnapshot: true,
          optionsJson: true,
          notes: true,
        },
      },
    },
  })

  if (!cart) throw new AppError(404, 'Checkout session not found or expired')
  if (userId && cart.userId !== userId) throw new AppError(403, 'Forbidden')
  const checkoutUserId = userId ?? cart.userId
  if (cart.order) {
    if (cart.order.paymentStatus === 'PAID') throw new AppError(409, 'This order has already been paid')
    throw new AppError(409, 'Order already created for this session')
  }
  if (!cart.expiresAt || new Date() > cart.expiresAt) throw new AppError(410, 'Checkout session has expired')

  const meta = JSON.parse(cart.note ?? '{}') as SessionMeta
  const deliveryType = meta.deliveryType ?? 'PICKUP'
  const deliveryMode = meta.deliveryMode ?? 'PICKUP'
  const placement = await orderDomain.validateOrderPlacement(input.sessionId, checkoutUserId)
  if (!placement.valid) throw new AppError(409, placement.reason ?? 'This order can’t be placed')

  // Re-price from the database: what's charged is what the pricing code says now, not what was stored.
  const { lines } = await resolveCheckoutLines(
    cart.items.map((ci) => ({ itemId: ci.itemId, bundleId: ci.bundleId, quantity: ci.quantity, specialInstructions: ci.notes ?? undefined })),
  )
  const tip = Math.max(0, Number(input.tipAmount ?? 0) || 0)
  const priced = await priceCheckout({ storeId: cart.storeId, lines, deliveryType, tip, destination: meta.destination ?? null })
  if (priced.blocked) throw new AppError(422, priced.blocked.message)
  const totals = priced.totals
  if (meta.quotedTotal !== undefined) {
    const before = meta.quotedTotal - (meta.tipAmount ?? 0)
    const now = totals.total.toNumber() - totals.tip.toNumber()
    if (Math.abs(before - now) > 0.005) {
      throw new AppError(409, 'Prices changed since you started checkout. Review your order and try again.')
    }
  }
  const destination = meta.destination ?? null
  const delivery = priced.delivery

  const rail = resolvePaymentRail(input)

  if (rail === 'COD') {
    if (!isCodPaymentsEnabled()) {
      throw new AppError(403, 'Cash on delivery payments are not enabled')
    }
  } else if (input.paymentMethod.token === 'cod_test' || input.paymentMethod.token.startsWith('cod_')) {
    throw new AppError(400, 'Invalid Stripe payment method')
  }

  const orderStatusInitial = rail === 'COD' ? 'PLACED' : 'PENDING_PAYMENT'

  // Phase 4A — pre-resolve any client-supplied referral code OUTSIDE the tx.
  // Lookups against unique columns are cheap and let us keep the order tx tight.
  // We only honor the code if the buyer is currently unattributed (checked in tx).
  const candidateReferralCode = input.affiliateReferralCode?.trim().toUpperCase()
  const candidateAffiliate = candidateReferralCode
    ? await getAffiliateByReferralCode(candidateReferralCode)
    : null
  const candidateIsUsable =
    candidateAffiliate != null && candidateAffiliate.status === 'ACTIVE'

  // Phase 1 — atomic: order row + cart state change together.
  // Cart is SUBMITTED only when the order record exists, preventing double-orders.
  const { order, attributionApplied } = await prisma.$transaction(async (tx) => {
    // Re-check under a row lock: a pause or suspension since the session started wins.
    await ensureStoreAcceptsOrders(tx, cart.storeId, { lock: true })

    let customerReferral = await tx.user.findUnique({
      where: { id: checkoutUserId },
      select: {
        referredByAffiliateId: true,
        referredByReferralCode: true,
      },
    })

    // Capture attribution onto unattributed users (Phase 4A step 5).
    // Snap once and use it for both the user row and the order's customer attribution.
    if (
      candidateIsUsable &&
      candidateAffiliate &&
      customerReferral != null &&
      customerReferral.referredByAffiliateId == null
    ) {
      await tx.user.update({
        where: { id: checkoutUserId },
        data: {
          referredByAffiliateId: candidateAffiliate.id,
          referredByReferralCode: candidateAffiliate.referralCode,
        },
      })
      customerReferral = {
        referredByAffiliateId: candidateAffiliate.id,
        referredByReferralCode: candidateAffiliate.referralCode,
      }
    }

    const storeAffiliate = await tx.store.findUnique({
      where: { id: cart.storeId },
      select: {
        referredByAffiliateId: true,
        referredByAffiliate: { select: { referralCode: true } },
      },
    })

    const attribution =
      customerReferral?.referredByAffiliateId != null
        ? {
            referredByAffiliateId: customerReferral.referredByAffiliateId,
            referredByReferralCode: customerReferral.referredByReferralCode,
            affiliateAttributionSource: 'CUSTOMER_REFERRAL' as const,
          }
        : storeAffiliate?.referredByAffiliateId != null
          ? {
              referredByAffiliateId: storeAffiliate.referredByAffiliateId,
              referredByReferralCode: storeAffiliate.referredByAffiliate?.referralCode,
              affiliateAttributionSource: 'STORE_REFERRAL' as const,
            }
          : null

    const created = await tx.order.create({
      data: {
        userId: checkoutUserId,
        storeId: cart.storeId,
        cartId: input.sessionId,
        status: orderStatusInitial,
        deliveryType,
        deliveryMode,
        ...(attribution ?? {}),
        subtotal: decimalToPrisma(totals.subtotal),
        fees: decimalToPrisma(totals.fees),
        tax: decimalToPrisma(totals.tax),
        tip: decimalToPrisma(totals.tip),
        total: decimalToPrisma(totals.total),
        serviceFeePercent: decimalToPrisma(totals.serviceFeePercent),
        serviceFeeAmount: decimalToPrisma(totals.serviceFeeAmount),
        vendorCommissionPercent: decimalToPrisma(totals.vendorCommissionPercent),
        vendorCommissionAmount: decimalToPrisma(totals.vendorCommissionAmount),
        netToVendor: decimalToPrisma(totals.netToVendor),
        taxProvider: priced.tax.provider,
        taxCalculationId: priced.tax.calculationId,
        ...(deliveryType === 'DELIVERY' && destination
          ? {
              addressId: destination.addressId,
              deliveryLatitude: new Decimal(destination.lat.toFixed(8)),
              deliveryLongitude: new Decimal(destination.lng.toFixed(8)),
              deliveryDistanceMiles: delivery.available && delivery.distanceMiles !== null ? new Decimal(delivery.distanceMiles.toFixed(2)) : null,
            }
          : {}),
        paymentStatus: 'UNPAID',
        addressSnapshot:
          deliveryType === 'DELIVERY' && destination
            ? ({ ...destination.address, latitude: destination.lat, longitude: destination.lng, approximate: destination.approximate } as object)
            : undefined,
        items: {
          create: cart.items.map((ci) => ({
            itemId: ci.itemId,
            bundleId: ci.bundleId,
            quantity: ci.quantity,
            unitPrice: ci.unitPrice,
            titleSnapshot: ci.titleSnapshot,
            ...(ci.optionsJson != null ? { optionsJson: ci.optionsJson } : {}),
            ...(ci.notes != null && ci.notes !== '' ? { notes: ci.notes } : {}),
          })),
        },
      },
      select: { id: true, status: true, createdAt: true },
    })

    await tx.cart.update({
      where: { id: input.sessionId },
      data: { status: 'SUBMITTED' },
    })

    return { order: created, attributionApplied: attribution != null }
  })

  if (rail === 'COD') {
    await publishOrderCreated(order.id).catch((err) => {
      console.error('[Checkout] publishOrderCreated failed:', err)
    })

    return {
      order: {
        id: order.id,
        status: order.status,
        total: totals.total.toNumber(),
        createdAt: order.createdAt.toISOString(),
      },
      paymentId: null,
      referralCodeApplied: attributionApplied,
    }
  }

  // Phase 2 — Stripe (card): PI created/confirmed here; PAID + vendor notify via webhook (durable).
  let paymentResult
  try {
    paymentResult = await processOrderPayment({
      orderId: order.id,
      userId: checkoutUserId,
      paymentMethodId: input.paymentMethod.token,
    })
  } catch (paymentError) {
    const err = paymentError instanceof Error ? paymentError : new Error(String(paymentError))
    console.error({ orderId: order.id, err: { message: err.message, name: err.name } }, 'payment failed')
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'UNPAID' },
    }).catch(() => {})
    if (err.message === 'STORE_CARD_PAYMENTS_UNAVAILABLE') {
      throw new AppError(
        402,
        'This store cannot accept card payments yet. Complete Stripe Connect onboarding or choose another payment option.',
      )
    }
    if (err.message === 'INVALID_STRIPE_PAYMENT_METHOD') {
      throw new AppError(400, 'A valid Stripe card payment is required')
    }
    throw err
  }

  return {
    order: {
      id: order.id,
      status: order.status,
      total: totals.total.toNumber(),
      createdAt: order.createdAt.toISOString(),
    },
    paymentId: paymentResult.paymentIntentId,
    referralCodeApplied: attributionApplied,
  }
}

export async function getCheckoutStatus(userId: string | undefined, sessionId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      createdAt: true,
      status: true,
      order: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          deliveryType: true,
          subtotal: true,
          fees: true,
          tax: true,
          tip: true,
          total: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!cart) throw new AppError(404, 'Checkout session not found')
  if (userId && cart.userId !== userId) throw new AppError(403, 'Forbidden')

  const orderRow = cart.order
  const status = orderRow
    ? orderRow.paymentStatus === 'PAID' || orderRow.status === 'PLACED'
      ? 'completed'
      : 'awaiting_payment'
    : 'pending'

  return {
    sessionId,
    cartStatus: cart.status,
    status,
    order: orderRow
      ? {
          id: orderRow.id,
          status: orderRow.status,
          paymentStatus: orderRow.paymentStatus,
          deliveryType: orderRow.deliveryType,
          subtotal: Number(orderRow.subtotal),
          fees: Number(orderRow.fees),
          tax: Number(orderRow.tax),
          tip: Number(orderRow.tip),
          total: Number(orderRow.total),
          createdAt: orderRow.createdAt.toISOString(),
          updatedAt: orderRow.updatedAt.toISOString(),
        }
      : null,
    createdAt: cart.createdAt.toISOString(),
  }
}
