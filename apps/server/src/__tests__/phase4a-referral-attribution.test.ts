/**
 * Phase 4A — Referral attribution capture.
 *
 * Proves the bridge that gets referral data onto users / stores / orders:
 *   1. /affiliates/referral/:slugOrCode resolves slug first, then code.
 *   2. Checkout snaps attribution onto unattributed users via affiliateReferralCode.
 *   3. Checkout does NOT overwrite existing attribution.
 *   4. Store creation hooks resolve affiliateReferralCode → Store.referredByAffiliateId.
 *   5. Store creation falls back to the creator's User.referredByAffiliateId.
 *   6. Store creation writes a STORE_SIGNUP ReferralEvent when attributed.
 */
import { randomUUID } from 'crypto'
import { describe, it, expect, afterAll, vi } from 'vitest'
import { prisma, Decimal, getAffiliateBySlugOrCode } from '@packages/db'
import { storeResource } from '../resources/store.resource.js'

vi.mock('../config/stripeConnectUrls.js', () => ({
  isCodPaymentsEnabled: vi.fn(() => true),
  getStripeConnectUrls: vi.fn(() => ({
    refreshUrl: 'http://localhost/refresh',
    returnUrl: 'http://localhost/return',
  })),
}))

import {
  createCheckoutSession,
  completeCheckout,
} from '../services/checkout.service.js'
import { createTestStore, createAuthenticatedUser, TEST_NAMESPACE } from './helpers.js'

const createdUserIds: string[] = []
const createdAffiliateIds: string[] = []
const createdStoreIds: string[] = []

async function makeUser() {
  const u = await createAuthenticatedUser('USER')
  createdUserIds.push(u.id)
  return u
}

async function makeAffiliate(opts: { slug?: string | null; code?: string } = {}) {
  const owner = await makeUser()
  const code =
    opts.code ?? `${TEST_NAMESPACE.slice(0, 4).toUpperCase()}${randomUUID().slice(0, 6).toUpperCase()}`
  const aff = await prisma.affiliate.create({
    data: {
      userId: owner.id,
      referralCode: code,
      referralSlug: opts.slug ?? null,
      status: 'ACTIVE',
      commissionRate: new Decimal('0.05'),
    },
  })
  createdAffiliateIds.push(aff.id)
  return aff
}

async function makeItem(storeId: string) {
  return prisma.item.create({
    data: {
      storeId,
      title: `Test Item ${randomUUID().slice(0, 6)}`,
      price: new Decimal('19.99'),
      isActive: true,
    },
  })
}

async function buildSessionAndCart(buyerId: string, storeId: string) {
  const item = await makeItem(storeId)
  return createCheckoutSession(buyerId, {
    items: [{ itemId: item.id, quantity: 1 }],
    deliveryType: 'PICKUP',
    deliveryMode: 'PICKUP',
    paymentMethod: { type: 'DIGITAL_WALLET', token: 'cod' },
  })
}

afterAll(async () => {
  await prisma.commission.deleteMany({
    where: { storeId: { in: createdStoreIds.length ? createdStoreIds : ['_'] } },
  })
  await prisma.orderItem.deleteMany({
    where: { order: { storeId: { in: createdStoreIds.length ? createdStoreIds : ['_'] } } },
  })
  await prisma.order.deleteMany({
    where: { storeId: { in: createdStoreIds.length ? createdStoreIds : ['_'] } },
  })
  await prisma.cartItem.deleteMany({
    where: { cart: { storeId: { in: createdStoreIds.length ? createdStoreIds : ['_'] } } },
  })
  await prisma.cart.deleteMany({
    where: { storeId: { in: createdStoreIds.length ? createdStoreIds : ['_'] } },
  })
  await prisma.item.deleteMany({
    where: { storeId: { in: createdStoreIds.length ? createdStoreIds : ['_'] } },
  })
  await prisma.referralEvent.deleteMany({
    where: { affiliateId: { in: createdAffiliateIds.length ? createdAffiliateIds : ['_'] } },
  })
  await prisma.store.deleteMany({ where: { id: { in: createdStoreIds } } })
  await prisma.affiliate.deleteMany({ where: { id: { in: createdAffiliateIds } } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
})

// ─── 1. Slug-first / code-second resolver ────────────────────────────────────

describe('getAffiliateBySlugOrCode (step 1)', () => {
  it('resolves by referralSlug first', async () => {
    const aff = await makeAffiliate({ slug: `${TEST_NAMESPACE}-slug-${randomUUID().slice(0, 4)}` })
    const found = await getAffiliateBySlugOrCode(aff.referralSlug!)
    expect(found?.id).toBe(aff.id)
  })

  it('falls back to referralCode when slug does not match', async () => {
    const aff = await makeAffiliate()
    const found = await getAffiliateBySlugOrCode(aff.referralCode)
    expect(found?.id).toBe(aff.id)
  })

  it('returns null when neither slug nor code matches', async () => {
    const found = await getAffiliateBySlugOrCode(`nope-${randomUUID().slice(0, 6)}`)
    expect(found).toBeNull()
  })
})

// ─── 2-3. Checkout attribution capture ───────────────────────────────────────

describe('completeCheckout — attribution capture (step 5)', () => {
  it('snaps affiliateReferralCode onto unattributed users and the order', async () => {
    const buyer = await makeUser()
    const vendor = await makeUser()
    const store = await createTestStore(vendor.id)
    createdStoreIds.push(store.id)
    const aff = await makeAffiliate()

    const session = await buildSessionAndCart(buyer.id, store.id)
    const result = await completeCheckout(buyer.id, {
      sessionId: session.sessionId,
      paymentMethod: { type: 'DIGITAL_WALLET', token: 'cod' },
      tipAmount: 0,
      paymentRail: 'COD',
      affiliateReferralCode: aff.referralCode,
    })

    const updatedUser = await prisma.user.findUnique({
      where: { id: buyer.id },
      select: { referredByAffiliateId: true, referredByReferralCode: true },
    })
    expect(updatedUser?.referredByAffiliateId).toBe(aff.id)
    expect(updatedUser?.referredByReferralCode).toBe(aff.referralCode)

    const order = await prisma.order.findUnique({
      where: { id: result.order.id },
      select: { referredByAffiliateId: true, affiliateAttributionSource: true },
    })
    expect(order?.referredByAffiliateId).toBe(aff.id)
    expect(order?.affiliateAttributionSource).toBe('CUSTOMER_REFERRAL')
  })

  it('does NOT overwrite an already-attributed user with a different code', async () => {
    const originalAff = await makeAffiliate()
    const buyer = await makeUser()
    await prisma.user.update({
      where: { id: buyer.id },
      data: {
        referredByAffiliateId: originalAff.id,
        referredByReferralCode: originalAff.referralCode,
      },
    })
    const competingAff = await makeAffiliate()
    const vendor = await makeUser()
    const store = await createTestStore(vendor.id)
    createdStoreIds.push(store.id)

    const session = await buildSessionAndCart(buyer.id, store.id)
    await completeCheckout(buyer.id, {
      sessionId: session.sessionId,
      paymentMethod: { type: 'DIGITAL_WALLET', token: 'cod' },
      tipAmount: 0,
      paymentRail: 'COD',
      affiliateReferralCode: competingAff.referralCode,
    })

    const after = await prisma.user.findUnique({
      where: { id: buyer.id },
      select: { referredByAffiliateId: true },
    })
    expect(after?.referredByAffiliateId).toBe(originalAff.id)
  })

  it('ignores an unknown affiliateReferralCode and leaves user unattributed', async () => {
    const buyer = await makeUser()
    const vendor = await makeUser()
    const store = await createTestStore(vendor.id)
    createdStoreIds.push(store.id)

    const session = await buildSessionAndCart(buyer.id, store.id)
    const result = await completeCheckout(buyer.id, {
      sessionId: session.sessionId,
      paymentMethod: { type: 'DIGITAL_WALLET', token: 'cod' },
      tipAmount: 0,
      paymentRail: 'COD',
      affiliateReferralCode: `nope-${randomUUID().slice(0, 6)}`,
    })

    const after = await prisma.user.findUnique({
      where: { id: buyer.id },
      select: { referredByAffiliateId: true },
    })
    expect(after?.referredByAffiliateId).toBeNull()

    const order = await prisma.order.findUnique({
      where: { id: result.order.id },
      select: { referredByAffiliateId: true, affiliateAttributionSource: true },
    })
    expect(order?.referredByAffiliateId).toBeNull()
    expect(order?.affiliateAttributionSource).toBeNull()
  })
})

// ─── 4-6. Store creation attribution + ReferralEvent ─────────────────────────

type StoreHooks = {
  beforeCreate: (data: unknown, ctx: { userId: string; userRole: string }) => Promise<Record<string, unknown>>
  afterCreate: (result: unknown, ctx: { userId: string; userRole: string }) => Promise<void>
}

async function createStoreThroughHooks(
  hooks: StoreHooks,
  ctx: { userId: string; userRole: string },
  body: Record<string, unknown>,
) {
  const prepared = await hooks.beforeCreate(body, ctx)
  const slug = (prepared.slug as string | undefined) ?? `${TEST_NAMESPACE}-${randomUUID().slice(0, 6)}`
  const created = await prisma.store.create({
    data: {
      name: (prepared.name as string | undefined) ?? `Test Store ${randomUUID().slice(0, 6)}`,
      slug,
      ownerUserId: ctx.userId,
      ...(prepared.referredByAffiliateId
        ? { referredByAffiliateId: prepared.referredByAffiliateId as string }
        : {}),
    },
  })
  createdStoreIds.push(created.id)
  await hooks.afterCreate(created, ctx)
  return created
}

describe('store creation — referral attribution + STORE_SIGNUP event (steps 6-7)', () => {
  const hooks = (storeResource as unknown as { customHooks: StoreHooks }).customHooks

  it('resolves affiliateReferralCode on create and writes a STORE_SIGNUP event', async () => {
    const aff = await makeAffiliate()
    const owner = await makeUser()

    const created = await createStoreThroughHooks(
      hooks,
      { userId: owner.id, userRole: 'USER' },
      {
        name: 'Affiliate-Coded Store',
        slug: `${TEST_NAMESPACE}-aff-${randomUUID().slice(0, 6)}`,
        affiliateReferralCode: aff.referralCode,
      },
    )

    const reloaded = await prisma.store.findUnique({
      where: { id: created.id },
      select: { referredByAffiliateId: true },
    })
    expect(reloaded?.referredByAffiliateId).toBe(aff.id)

    const events = await prisma.referralEvent.findMany({
      where: { affiliateId: aff.id, referredStoreId: created.id, eventType: 'STORE_SIGNUP' },
    })
    expect(events).toHaveLength(1)
    expect(events[0]!.referralCode).toBe(aff.referralCode)
  })

  it('falls back to the creating user’s User.referredByAffiliateId when no code is supplied', async () => {
    const aff = await makeAffiliate()
    const owner = await makeUser()
    await prisma.user.update({
      where: { id: owner.id },
      data: { referredByAffiliateId: aff.id, referredByReferralCode: aff.referralCode },
    })

    const created = await createStoreThroughHooks(
      hooks,
      { userId: owner.id, userRole: 'USER' },
      {
        name: 'User-Snapshot Store',
        slug: `${TEST_NAMESPACE}-snap-${randomUUID().slice(0, 6)}`,
      },
    )

    const reloaded = await prisma.store.findUnique({
      where: { id: created.id },
      select: { referredByAffiliateId: true },
    })
    expect(reloaded?.referredByAffiliateId).toBe(aff.id)

    const events = await prisma.referralEvent.findMany({
      where: { affiliateId: aff.id, referredStoreId: created.id, eventType: 'STORE_SIGNUP' },
    })
    expect(events).toHaveLength(1)
  })

  it('drops raw referredByAffiliateId from the body (mass-assignment protection)', async () => {
    const realAff = await makeAffiliate()
    const owner = await makeUser()
    const malicious = await makeAffiliate()

    const created = await createStoreThroughHooks(
      hooks,
      { userId: owner.id, userRole: 'USER' },
      {
        name: 'Mass-Assign Store',
        slug: `${TEST_NAMESPACE}-mass-${randomUUID().slice(0, 6)}`,
        // Raw id should be stripped by beforeCreate
        referredByAffiliateId: malicious.id,
        // Code is the only honored signal
        affiliateReferralCode: realAff.referralCode,
      },
    )

    const reloaded = await prisma.store.findUnique({
      where: { id: created.id },
      select: { referredByAffiliateId: true },
    })
    expect(reloaded?.referredByAffiliateId).toBe(realAff.id)

    const maliciousEvents = await prisma.referralEvent.findMany({
      where: { affiliateId: malicious.id, referredStoreId: created.id },
    })
    expect(maliciousEvents).toHaveLength(0)
  })

  it('produces no ReferralEvent when the store is unattributed', async () => {
    const owner = await makeUser()

    const created = await createStoreThroughHooks(
      hooks,
      { userId: owner.id, userRole: 'USER' },
      {
        name: 'No-Attribution Store',
        slug: `${TEST_NAMESPACE}-none-${randomUUID().slice(0, 6)}`,
      },
    )

    const reloaded = await prisma.store.findUnique({
      where: { id: created.id },
      select: { referredByAffiliateId: true },
    })
    expect(reloaded?.referredByAffiliateId).toBeNull()

    const events = await prisma.referralEvent.findMany({
      where: { referredStoreId: created.id },
    })
    expect(events).toHaveLength(0)
  })
})
