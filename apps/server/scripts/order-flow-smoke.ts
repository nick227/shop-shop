/**
 * Order-flow smoke test against a RUNNING local API: a shopper pays with a Stripe test card, the vendor
 * walks the order through to collection, and both live channels must announce every step.
 *
 *   pnpm --filter @apps/server smoke:order -- <store id | slug>            # card (pm_card_visa)
 *   pnpm --filter @apps/server smoke:order -- <store> --card pm_card_visa_debit
 *   pnpm --filter @apps/server smoke:order -- <store> --card declined      # expects a 402, then stops
 *   pnpm --filter @apps/server smoke:order -- <store> --cod                # cash, needs ENABLE_COD_PAYMENTS=true
 *   pnpm --filter @apps/server smoke:order -- <store> --delivery           # store-managed delivery to the store's own address
 *   pnpm --filter @apps/server smoke:order -- <store> --cancel             # vendor cancels after accepting (card runs: refund)
 *
 * Needs: the API running (pnpm dev:server), `stripe listen --forward-to localhost:$PORT/webhooks/stripe`
 * for card runs, and the store linked to a test Stripe account (pnpm --filter @packages/db stripe:test-vendor).
 *
 * Signs tokens with the local JWT_SECRET and uses a throwaway shopper (smoke-shopper@example.test),
 * so it only runs against localhost with test Stripe keys.
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import WebSocket from 'ws'

const here = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(here, '../../../.env'), override: false })

const args = process.argv.slice(2).filter((a) => a !== '--')
const storeArg = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--card')
const cod = args.includes('--cod')
const delivery = args.includes('--delivery')
const cancel = args.includes('--cancel')
const cardFlag = args.includes('--card') ? args[args.indexOf('--card') + 1] : undefined
// Stripe's built-in test PaymentMethods: https://docs.stripe.com/testing#cards
const card = cardFlag === 'declined' ? 'pm_card_chargeDeclinedInsufficientFunds' : (cardFlag ?? 'pm_card_visa')
const expectDecline = /declined/i.test(card)

const port = process.env.PORT ?? '3005'
const api = (process.env.SMOKE_API_URL ?? `http://localhost:${port}`).replace(/\/$/, '')
const wsUrl = api.replace(/^http/, 'ws') + '/realtime'
const STEP_TIMEOUT_MS = 30_000 // status notifications go out on the 10 s order worker tick

function fail(message: string): never {
  console.error(`\n❌ ${message}`)
  process.exit(1)
}

if (!storeArg) fail('Usage: smoke:order -- <store id | slug> [--card pm_card_visa | declined] [--cod] [--delivery] [--cancel]')
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(api)) fail(`Refusing to run against ${api}; this script is for a local API only.`)
if (!cod && !/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? '')) fail('Card runs need STRIPE_SECRET_KEY=sk_test_… in .env (or pass --cod).')

process.env.PRISMA_LOG_QUERIES = 'false' // keep the step-by-step output readable
const { prisma, generateJWT } = await import('@packages/db')

type Event = { type: string; payload?: Record<string, unknown>; topic?: string }

/** A live connection that remembers every event, so a step can wait for one that may already have arrived. */
async function listen(name: string, token: string, topics: string[]) {
  const socket = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`)
  const events: Event[] = []
  const waiters: { match: (e: Event) => boolean; resolve: (e: Event) => void }[] = []
  socket.on('message', (raw) => {
    const event = JSON.parse(raw.toString()) as Event
    if (event.type === 'error') console.warn(`   [${name}] socket error: ${JSON.stringify(event)}`)
    events.push(event)
    for (const w of [...waiters]) if (w.match(event)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(event) }
  })
  await new Promise<void>((ok, bad) => {
    socket.once('open', () => ok())
    socket.once('error', bad)
    socket.once('close', (code, reason) => bad(new Error(`${name} socket closed ${code} ${reason.toString()}`)))
  }).catch((e: Error) => fail(`Could not open the ${name} live connection at ${wsUrl}: ${e.message}. Is the API running?`))
  socket.send(JSON.stringify({ type: 'hello' }))
  const subscribe = async (topic: string) => {
    socket.send(JSON.stringify({ type: 'subscribe', topic }))
    await waitFor((e) => e.type === 'subscribed' && e.topic === topic, `${name} subscribed to ${topic}`, 5000)
  }
  const waitFor = (match: (e: Event) => boolean, what: string, timeout = STEP_TIMEOUT_MS) =>
    new Promise<Event>((ok, bad) => {
      const seen = events.find(match)
      if (seen) return ok(seen)
      const timer = setTimeout(() => bad(new Error(`timed out waiting for ${what}`)), timeout)
      waiters.push({ match, resolve: (e) => { clearTimeout(timer); ok(e) } })
    })
  for (const t of topics) await subscribe(t)
  return { subscribe, waitFor, close: () => socket.close() }
}

async function call(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'x-idempotency-key': randomUUID() },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, any>
  return { status: res.status, json }
}

const results: { step: string; ok: boolean; detail: string }[] = []
async function step(name: string, run: () => Promise<string | void>) {
  const started = Date.now()
  try {
    const detail = (await run()) ?? ''
    results.push({ step: name, ok: true, detail: `${detail} (${((Date.now() - started) / 1000).toFixed(1)}s)`.trim() })
    console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    results.push({ step: name, ok: false, detail })
    console.error(`❌ ${name} — ${detail}`)
    throw error
  }
}

async function main() {
  const store = await prisma.store.findFirst({
    where: { OR: [{ id: storeArg }, { slug: storeArg }] },
    include: { owner: true },
  })
  if (!store) fail(`No store with id or slug "${storeArg}".`)
  if (!cod && !store.stripeChargesEnabled) fail(`${store.name} can't take cards yet. Run: pnpm --filter @packages/db stripe:test-vendor ${store.slug}`)

  const item = await prisma.item.findFirst({
    where: { storeId: store.id, isActive: true, isSoldOut: false, price: { gt: 1 } },
    orderBy: { price: 'asc' },
  })
  if (!item) fail(`${store.name} has no active item to order.`)

  const shopper = await prisma.user.upsert({
    where: { email: 'smoke-shopper@example.test' },
    update: {},
    create: {
      email: 'smoke-shopper@example.test',
      name: 'Smoke Test Shopper',
      // Not a usable password: this account is only ever signed in by this script.
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY0cZ5T8fBiHWla',
      role: 'USER',
    },
  })
  const shopperToken = generateJWT(shopper)
  const vendorToken = generateJWT(store.owner)

  if (delivery && !(store.deliveryEnabled && store.addressStreet && store.addressCity && store.addressState && store.addressZip)) {
    fail(`${store.name} doesn't deliver or has no street address to deliver to.`)
  }
  const fulfillment = delivery ? 'delivery' : 'pickup'
  console.log(`Store: ${store.name}  ·  item: ${item.title}  ·  ${cod ? 'cash' : `card ${card}`}  ·  ${fulfillment}${cancel ? ' then cancel' : ''}  ·  API ${api}\n`)

  const vendor = await listen('vendor', vendorToken, [`vendor:${store.id}`])
  const customer = await listen('shopper', shopperToken, [`customer:${shopper.id}`])

  let orderId = ''
  try {
    await step(`Shopper starts a ${fulfillment} checkout`, async () => {
      const { status, json } = await call(shopperToken, 'POST', '/api/v1/checkout/session', {
        items: [{ itemId: item.id, quantity: 1 }],
        deliveryType: delivery ? 'DELIVERY' : 'PICKUP',
        deliveryMode: delivery ? 'STORE_MANAGED_DELIVERY' : 'PICKUP',
        ...(delivery
          ? { deliveryAddress: { street: store.addressStreet, city: store.addressCity, state: store.addressState, zipCode: store.addressZip } }
          : {}),
        paymentMethod: { type: 'CREDIT_CARD', token: cod ? 'cod' : card },
      })
      if (status !== 200) throw new Error(`HTTP ${status}: ${json.error ?? json.message ?? JSON.stringify(json)}`)
      orderId = json.sessionId
      return `session ${json.sessionId}, total $${json.total}`
    })

    const sessionId = orderId
    await step(cod ? 'Shopper places a cash order' : expectDecline ? 'Declined card is refused' : 'Shopper pays with a test card', async () => {
      const { status, json } = await call(shopperToken, 'POST', '/api/v1/checkout/complete', {
        sessionId,
        paymentMethod: { type: 'CREDIT_CARD', token: cod ? 'cod' : card },
        paymentRail: cod ? 'COD' : 'CARD',
      })
      if (expectDecline) {
        if (status !== 402) throw new Error(`expected HTTP 402, got ${status}: ${JSON.stringify(json)}`)
        return `402 "${json.error ?? json.message}"`
      }
      if (status !== 200) throw new Error(`HTTP ${status}: ${json.error ?? json.message ?? JSON.stringify(json)}`)
      orderId = json.order.id
      if (json.payment?.status === 'requires_action') throw new Error('card asked for 3-D Secure; use a card that does not (pm_card_visa)')
      return `order ${orderId} ${json.order.status}${json.payment ? `, payment ${json.payment.status}` : ''}`
    })
    if (expectDecline) return

    await customer.subscribe(`order:${orderId}`)

    if (!cod) {
      await step('Stripe webhook marks the order paid and PLACED', async () => {
        const deadline = Date.now() + STEP_TIMEOUT_MS
        for (;;) {
          const o = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { status: true, paymentStatus: true } })
          if (o.status === 'PLACED' && o.paymentStatus === 'PAID') return 'PAID'
          if (Date.now() > deadline) {
            throw new Error(`still ${o.status}/${o.paymentStatus}. Is \`stripe listen --forward-to localhost:${port}/webhooks/stripe\` running, with its whsec_ in STRIPE_WEBHOOK_SECRET?`)
          }
          await new Promise((r) => setTimeout(r, 1000))
        }
      })
    }

    await step('Vendor is told about the new order', async () => {
      const e = await vendor.waitFor((ev) => ev.type === 'order.created' && ev.payload?.orderId === orderId, 'vendor order.created')
      return `order.created, ${e.payload?.itemCount} item(s)`
    })
    await step('Shopper is told the order was placed', async () => {
      await customer.waitFor((ev) => ev.type === 'order.created' && ev.payload?.orderId === orderId, 'shopper order.created')
    })

    const advance = async (status: string, extra: Record<string, unknown> = {}) => {
      await step(`Vendor marks ${status}; shopper and vendor both see it`, async () => {
        const { status: http, json } = await call(vendorToken, 'PATCH', `/api/v1/orders/${orderId}/status`, { status, ...extra })
        if (http !== 200) throw new Error(`HTTP ${http}: ${json.error ?? JSON.stringify(json)}`)
        const isThis = (ev: Event) => ev.type === 'order.status.changed' && ev.payload?.orderId === orderId && ev.payload?.newStatus === status
        await Promise.all([customer.waitFor(isThis, `shopper ${status} event`), vendor.waitFor(isThis, `vendor ${status} event`)])
      })
    }

    await advance('ACCEPTED', { prepMinutes: 10 })
    let final: string
    if (cancel) {
      await advance('CANCELED', { reason: 'Smoke test: vendor cancels' })
      final = 'CANCELED'
      if (!cod) {
        await step('Paid order is refunded in Stripe', async () => {
          const deadline = Date.now() + STEP_TIMEOUT_MS
          for (;;) {
            const o = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { paymentStatus: true, refundState: true, stripeRefundId: true } })
            if (o.paymentStatus === 'REFUNDED' || o.stripeRefundId) return `${o.paymentStatus}, refund ${o.stripeRefundId ?? ''}`.trim()
            if (Date.now() > deadline) throw new Error(`still ${o.paymentStatus}, refund state ${o.refundState}`)
            await new Promise((r) => setTimeout(r, 1000))
          }
        })
      }
    } else {
      await advance('PREPARING')
      await advance('READY')
      if (delivery) {
        await advance('OUT_FOR_DELIVERY')
        await advance('DELIVERED')
        final = 'DELIVERED'
      } else {
        const { collectionCode } = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { collectionCode: true } })
        await advance('COMPLETED', { collectionCode })
        final = 'COMPLETED'
      }
    }

    await step(`Shopper order page reads ${final}`, async () => {
      const { status, json } = await call(shopperToken, 'GET', `/api/v1/orders/${orderId}/status`)
      if (status !== 200) throw new Error(`HTTP ${status}`)
      if (json.status !== final) throw new Error(`reads ${json.status}`)
      return `${json.statusHistory?.length ?? 0} history entries`
    })
  } finally {
    vendor.close()
    customer.close()
  }
}

try {
  await main()
  console.log(`\n🎉 All ${results.length} steps passed`)
} catch {
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
