/**
 * Gives a store a Stripe TEST-mode connected account that can take card payments right away,
 * so checkout with test cards (4242 4242 4242 4242 …) works without clicking through onboarding.
 *
 *   pnpm --filter @packages/db stripe:test-vendor <store id | slug | part of the name>
 *   pnpm --filter @packages/db stripe:test-vendor --list
 *
 * Refuses to run unless STRIPE_SECRET_KEY is a test key (sk_test_… / rk_test_…).
 * Uses Stripe's documented test identity values; nothing here is a real person or bank account.
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'

const here = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(here, '../../../.env'), override: false })

const key = process.env.STRIPE_SECRET_KEY ?? ''
if (!/^(sk|rk)_test_[A-Za-z0-9]+$/.test(key)) {
  console.error('STRIPE_SECRET_KEY must be a Stripe TEST key (sk_test_…). Refusing to create accounts with anything else.')
  process.exit(1)
}

process.env.PRISMA_LOG_QUERIES = 'false' // keep the step-by-step output readable
const { prisma } = await import('../src/client.js')
// The app's own Connect sync, so the store reads exactly as the account.updated webhook would leave it.
const { persistStripeAccountSnapshotOnStore: saveSnapshot } = await import('../src/services/payment.service.js')
const stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion })

const arg = process.argv[2]

async function listStores() {
  const stores = await prisma.store.findMany({
    select: { id: true, slug: true, name: true, stripeAccountId: true, stripeChargesEnabled: true },
    orderBy: { name: 'asc' },
    take: 100,
  })
  for (const s of stores) {
    console.log(`${s.stripeChargesEnabled ? '💳' : '  '} ${s.id}  ${s.slug.padEnd(32)} ${s.name}`)
  }
}

async function main() {
  if (!arg || arg === '--list') {
    if (!arg) console.log('Usage: stripe:test-vendor <store id | slug | part of the name>\n')
    await listStores()
    return
  }

  const matches = await prisma.store.findMany({
    where: { OR: [{ id: arg }, { slug: arg }, { name: { contains: arg } }] },
    select: { id: true, name: true, slug: true, stripeAccountId: true, owner: { select: { email: true } } },
    take: 5,
  })
  if (matches.length !== 1) {
    console.error(matches.length === 0 ? `No store matches "${arg}".` : `"${arg}" matches several stores; use the id:`)
    for (const s of matches) console.error(`  ${s.id}  ${s.slug}  ${s.name}`)
    process.exit(1)
  }
  const store = matches[0]!

  // Reuse the store's account if it is a working test-mode account already.
  if (store.stripeAccountId) {
    try {
      const existing = await stripe.accounts.retrieve(store.stripeAccountId)
      if (existing.charges_enabled) {
        await saveSnapshot(store.id, existing)
        console.log(`✅ ${store.name} already has a test account that takes cards: ${existing.id}`)
        return
      }
    } catch {
      // A live-mode or deleted account is invisible to a test key; replace it below.
    }
  }

  const account = await stripe.accounts.create(testAccountDetails(store)).catch((error: unknown) => {
    if (error instanceof Stripe.errors.StripeError && /signed up for Connect/i.test(error.message)) {
      console.error(
        '❌ This Stripe account has not enabled Connect in test mode, so it cannot create vendor accounts.\n' +
          '   Turn it on at https://dashboard.stripe.com/test/connect (Get started → platform), then run this again.',
      )
      process.exit(1)
    }
    throw error
  })

  // Capabilities usually turn active within a few seconds of creation.
  let current = account
  for (let i = 0; i < 15 && !current.charges_enabled; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    current = await stripe.accounts.retrieve(account.id)
  }

  await prisma.store.update({ where: { id: store.id }, data: { stripeAccountId: current.id } })
  await saveSnapshot(store.id, current)

  if (current.charges_enabled) {
    console.log(`✅ ${store.name} can take test card payments. Connected account: ${current.id}`)
  } else {
    console.warn(
      `⚠️  Account ${current.id} was created but charges are not enabled yet. ` +
        `Due: ${JSON.stringify(current.requirements?.currently_due ?? [])}. Run this again in a minute.`,
    )
    process.exitCode = 1
  }
}

/** Stripe's documented test identity values: https://docs.stripe.com/connect/testing */
function testAccountDetails(store: { id: string; name: string; slug: string; owner: { email: string | null } }): Stripe.AccountCreateParams {
  const email = store.owner.email ?? `vendor+${store.slug}@example.com`
  return {
    type: 'custom',
    country: 'US',
    email,
    business_type: 'individual',
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    business_profile: { mcc: '5812', url: 'https://accessible.stripe.com', product_description: `Test store: ${store.name}` },
    individual: {
      first_name: 'Test',
      last_name: 'Vendor',
      email,
      phone: '0000000000',
      dob: { day: 1, month: 1, year: 1901 },
      ssn_last_4: '0000',
      id_number: '000000000',
      address: { line1: 'address_full_match', city: 'San Francisco', state: 'CA', postal_code: '94111', country: 'US' },
    },
    external_account: 'btok_us_verified',
    tos_acceptance: { date: Math.floor(Date.now() / 1000), ip: '127.0.0.1' },
    metadata: { storeId: store.id, createdBy: 'stripe-test-vendor script' },
  }
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
