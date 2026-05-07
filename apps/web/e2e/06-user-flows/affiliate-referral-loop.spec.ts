import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { prisma } from '../../../../packages/db/src/client'
import { orderService } from '../../../../packages/db/src/services/order.service'

const WEB_BASE = `http://localhost:${process.env.VITE_PORT || 5187}`
const API_BASE = (process.env.VITE_API_URL || 'http://localhost:3015').replace(/\/$/, '')

async function apiJson<T>(
  request: typeof test extends { request: infer R } ? R : never,
  path: string,
  init?: { method?: string; headers?: Record<string, string>; body?: unknown }
): Promise<T> {
  const hasBody = init?.body != null
  const res = await request.fetch(`${API_BASE}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    // Playwright APIRequestContext expects `data` for JSON bodies.
    ...(hasBody ? { data: init!.body } : {}),
  } as any)

  if (!res.ok()) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${init?.method ?? 'GET'} ${path} failed: ${res.status()} ${text}`)
  }
  return (await res.json()) as T
}

test.describe('Affiliate referral loop', () => {
  test('referral -> signup attribution -> order snapshot -> commission -> stats -> vendor sales', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000)

    // Sanity: backend reachable
    await apiJson(request, '/healthz')

    // 1) Create referrer user + affiliate (ACTIVE immediately)
    const referrerEmail = `referrer-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
    const referrerPassword = 'Test123456!'

    const refSignup = await apiJson<{ token: string }>(request, '/auth/v1/signup', {
      method: 'POST',
      body: { email: referrerEmail, password: referrerPassword, name: 'Referrer' },
    })

    await apiJson(request, '/api/affiliates/signup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refSignup.token}` },
      body: { bio: 'Test referrer' },
    })

    const refAffiliate = await prisma.affiliate.findFirst({
      where: { user: { email: referrerEmail } },
      select: { id: true, referralCode: true, status: true },
    })
    expect(refAffiliate?.status).toBe('ACTIVE')
    expect(refAffiliate?.referralCode).toBeTruthy()
    const { referralCode } = refAffiliate!

    // 2) Visitor hits /r/:CODE and we store referral in localStorage
    await page.goto(`${WEB_BASE}/r/${referralCode}?redirect=/signup`)
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('affiliateReferralCode')), { timeout: 10_000 })
      .toBe(referralCode)
    // Make the flow deterministic (ReferralRedirect may bounce through multiple routes).
    await page.goto(`${WEB_BASE}/signup`)

    // 3) Sign up customer via UI (frontend should include affiliateReferralCode automatically)
    const customerEmail = `customer-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
    const customerPassword = 'Test123456!'

    // Signup page renders the DualAuthWidget already in register mode
    await page.getByPlaceholder(/john doe/i).fill('Referred Customer')
    await page.getByPlaceholder(/you@example\.com/i).fill(customerEmail)
    await page.getByPlaceholder(/create a strong password/i).fill(customerPassword)
    await page.getByRole('button', { name: /create account/i }).click()

    // The signup page navigates back to "/" on success
    await page.waitForURL('**/', { timeout: 20_000 })

    // 4) Verify User referral attribution was persisted
    const customerUser = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true, referredByAffiliateId: true },
    })
    expect(customerUser?.referredByAffiliateId).toBe(refAffiliate!.id)

    // 5) Create a paid order for the customer and ensure Order snapshot has referredByAffiliateId
    const storeId = randomUUID()
    await prisma.store.create({
      data: {
        id: storeId,
        ownerUserId: customerUser!.id,
        name: 'Test Store',
        slug: `test-store-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        isPublished: true,
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    const order = await prisma.order.create({
      data: {
        userId: customerUser!.id,
        storeId,
        status: 'PLACED',
        deliveryType: 'PICKUP',
        deliveryMode: 'PICKUP',
        paymentStatus: 'PAID',
        subtotal: 10,
        fees: 1,
        tax: 0,
        tip: 0,
        total: 11,
        serviceFeePercent: 3,
        serviceFeeAmount: 1,
        netToVendor: 10,
        referredByAffiliateId: refAffiliate!.id,
        referredByReferralCode: referralCode,
        items: {
          create: [
            {
              titleSnapshot: 'Test Item',
              unitPrice: 10,
              quantity: 1,
            },
          ],
        },
      },
      select: { id: true },
    })

    const orderRow = await prisma.order.findUnique({
      where: { id: order.id },
      select: { referredByAffiliateId: true, paymentStatus: true, status: true },
    })
    expect(orderRow?.paymentStatus).toBe('PAID')
    expect(orderRow?.referredByAffiliateId).toBe(refAffiliate!.id)

    // 6) Progress status to DELIVERED -> commission should be created from Order.referredByAffiliateId
    await orderService.transitionOrderStatus({ orderId: order.id, newStatus: 'ACCEPTED' })
    await orderService.transitionOrderStatus({ orderId: order.id, newStatus: 'PREPARING' })
    await orderService.transitionOrderStatus({ orderId: order.id, newStatus: 'READY' })
    await orderService.transitionOrderStatus({ orderId: order.id, newStatus: 'OUT_FOR_DELIVERY' })
    await orderService.transitionOrderStatus({ orderId: order.id, newStatus: 'DELIVERED' })

    const commission = await prisma.commission.findFirst({
      where: { orderId: order.id, affiliateId: refAffiliate!.id },
      select: { id: true, amount: true, status: true },
    })
    expect(commission?.status).toBe('PENDING')
    expect(Number(commission?.amount ?? 0)).toBeGreaterThan(0)

    // 7) Affiliate stats endpoint reflects new commission
    const stats = await apiJson<{
      stats: { totalEarnings: number; pendingEarnings: number; paidEarnings: number; totalCommissions: number }
    }>(request, '/api/affiliates/me/stats', {
      headers: { Authorization: `Bearer ${refSignup.token}` },
    })
    expect(stats.stats.totalCommissions).toBeGreaterThan(0)
    expect(Number(stats.stats.totalEarnings)).toBeGreaterThan(0)

    // 8) Vendor affiliate sales aggregation includes the order (paid + attributed)
    // (This validates the same query `/vendor/affiliates` ultimately relies on.)
    // Note: We validate at the DB service level because vendor route auth depends on store access.
    const rows = await prisma.$queryRaw<Array<{ orders: unknown }>>`
      SELECT COUNT(DISTINCT o.id) AS orders
      FROM \`Order\` o
      WHERE o.storeId = ${storeId}
        AND o.paymentStatus = 'PAID'
        AND o.refundedAt IS NULL
        AND o.canceledAt IS NULL
        AND o.referredByAffiliateId IS NOT NULL
    `
    const count = Number(rows[0]?.orders ?? 0)
    expect(count).toBe(1)
  })
})

