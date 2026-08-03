# Building Shop-Shop: A Type-Safe Delivery Marketplace

*How we structured a multi-role food delivery platform as a pnpm monorepo — contract-driven APIs, a social discovery feed, pluggable logistics, and Stripe Connect economics — without losing the plot.*

---

Food delivery looks simple from the lock screen widget. Under the hood it’s a collision of marketplace discovery, order state machines, payouts, geo constraints, and real-time coordination between people who want very different things from the same database.

**Shop-Shop** is our answer: a local kitchen / restaurant delivery marketplace where customers discover food through a social-style feed, vendors run stores and teams, affiliates earn commissions, riders fulfill in-house jobs, and admins keep the rails honest.

This post walks the product, the stack, and the architecture choices that keep a system with that many surfaces from becoming glue code.

---

## The product in one screenful

Shop-Shop is role-first. A single deploy serves several products that share inventory and money:

| Role | What they do |
|------|----------------|
| **Customer** | Browse River, search nearby, cart → checkout, track orders, favorite stores/items |
| **Vendor** | Onboard stores, manage catalog & bundles, fulfill orders, team access, Stripe Connect, store River |
| **Affiliate** | Referral links, commission dashboard, Connect payouts |
| **Rider** | In-house delivery assignments and status |
| **Admin / staff** | Users, vendors, catalog, finance, affiliates, delivery ops, River tooling, audit logs |

Landing isn’t a grid of restaurants. The home route redirects to **River** — a scored, diversified discovery feed of store and item posts — closer to a content product than a directory.

Store types skew food (`HOME_KITCHEN`, `MEAL_PREP`, `RESTAURANT`, `BAKERY`, `COFFEE`, …). Seeds include a full role matrix plus an Austin kitchen catalog so demos feel real without a live staging city.

---

## Monorepo shape

Everything lives in one pnpm workspace (`pnpm@9`). The split is deliberate: apps own I/O; packages own truth.

```
shop-shop/
├── apps/
│   ├── server/          # Fastify API + WebSocket
│   └── web/             # React + Vite SPA
├── packages/
│   ├── db/              # Prisma, services, adapters, seed/CLI
│   ├── domain/          # Policies, domain services, event bus
│   ├── schemas/         # Zod DTOs, defineResource, OpenAPI emit
│   ├── openapi/         # Generated openapi.json
│   ├── sdk/             # typescript-fetch client + frontend helpers
│   ├── realtime/        # Shared WS protocol + client
│   └── shared/          # Pricing/tax/fee constants
├── docs/api/            # Hand-maintained OpenAPI yaml (contract checks)
├── scripts/             # Drift / contract / usage checkers
└── infra/railway/       # API, web, river-ingest deploy configs
```

**Rule of thumb:** if it’s business rules or persistence, it’s a package. If it’s HTTP, sockets, or pixels, it’s an app. That boundary is what lets us regenerate clients without rewriting store listing geography.

---

## Tech stack (the boring list that matters)

### Frontend (`@apps/web`)

- **React 18** + **TypeScript**, bundled with **Vite 5** (SWC)
- **React Router 6** with role layouts and lazy pages
- **TanStack Query** for server state, **Zustand** for client state
- **Zod** + **React Hook Form** for forms
- **Tailwind** + **Radix** primitives, **Framer Motion**, **Leaflet** maps
- **Stripe Elements** for card checkout
- **Vitest** + Testing Library; **Playwright** for E2E

Local DX detail that punches above its weight: leave `VITE_API_URL` empty. Vite proxies `/api`, River, uploads, and geocode to the Fastify `PORT` from the monorepo root `.env`. Same-origin in the browser, no CORS tax during `pnpm dev`.

### Backend (`@apps/server`)

- **Fastify 4** with **Zod type provider** (request/response schemas are types)
- Plugins: CORS, Helmet, multipart (media), rate limit, static uploads, Swagger UI, WebSockets
- **JWT** + **bcrypt**, role-aware middleware
- **Stripe** (PaymentIntents + Connect), **ioredis** for checkout idempotency
- **Pino** logging; local uploads or **S3**-compatible storage

### Data & contracts

- **MySQL** via **Prisma 5** (client emitted into `packages/db`)
- **Zod → OpenAPI** (`zod-to-openapi`) → **OpenAPI Generator** (`typescript-fetch` SDK)
- Parallel path: `docs/api/openapi.yaml` + `openapi-typescript` for web path types and drift checks

### Realtime

WebSocket route at `/realtime` with JWT. Shared `@packages/realtime` client on the web. Topics are ACL’d by role (`vendor:{storeId}`, `customer:{userId}`, `order:{orderId}`) for order lifecycle and delivery location/ETA events — updates without polling.

Default local ports: API **3005**, web **5177**, docs at `/docs`.

---

## Architecture: declarative resources, custom where it hurts

The codebase is layered, not layered for ceremony:

```
Web (pages/features)
   → SDK / fetch
      → Fastify routes
           ├── Resource CRUD (loader + BaseCrudController)
           └── Custom routes (River, checkout, delivery, admin, affiliate)
                → Domain policies/services
                → DB services + adapters (Prisma, Stripe, storage, delivery)
```

### `defineResource` → routes + clients

For catalog-shaped surfaces (stores, items, carts, bundles, addresses, promotions, …), we declare a resource once:

- Zod schemas for inputs/outputs
- Role access and ownership rules
- `customHooks` (`beforeCreate`, `beforeList`, `authorizeAccess`, …) for geo browse, activation checks, etc.

`registerAllResources` wires CRUD onto Fastify. The same registry feeds OpenAPI generation; the SDK generator turns that into typed `StoresApi`, `CartsApi`, and friends consumed by `apps/web/src/api/client.ts`.

That’s the boring half done automatically.

### Custom routes for the interesting half

River, checkout, delivery dispatch, Stripe webhooks, affiliates, admin ops — those are hand-registered Fastify routes with purpose-built services. Honesty matters here: **not every endpoint is in the generated OpenAPI/SDK**. Resource CRUD is codegen-first; marketplace economics and logistics are product code with contract checks where we need them (especially checkout, via yaml + drift scripts).

### Domain + state machines

Order status isn’t a free-form string. An explicit state machine in `@packages/db` owns legal transitions:

`PENDING_PAYMENT → PLACED → ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED`

(plus cancel paths). Checkout pricing constants (tax, delivery fee, platform fee) live in `@packages/shared` so UI and server don’t invent their own percentages.

### Adapters at the edges

Stripe, storage (local / S3), geocoding caches, and delivery providers sit behind adapters. Delivery is especially intentional:

```
DeliveryProvider = IN_HOUSE | DOORDASH_DRIVE | UBER_DIRECT
```

Shared adapter interface, quote → dispatch → track → cancel. **In-house** is first-class. **DoorDash Drive** has a real HTTP client and webhook auth modes on the server (`none` / `basic` / `hmac`; production refuses open webhooks). **Uber Direct** is stubbed in the registry for a future wire-up — we don’t pretend it’s live.

---

## Feature domains worth knowing

### River — discovery as a feed

Posts, likes, saves, comments, seen-state, cursor pagination, ranking with freshness and diversity. Sources can be manual, auto-store, or auto-product. Ingest CLIs and an admin composer exist so the feed can grow without every vendor becoming a content creator. There’s an official platform store for editorial content.

### Checkout & money

Session-style checkout with same-store cart validation, address checks, and delivery mode selection. **Card** via Stripe PaymentIntents (Connect destination charges + application fee). **COD** behind feature flags, with commission logic that refuses to accrue on unpaid cash orders. Redis (`X-Idempotency-Key`) plus Stripe idempotency keys keep “double submit” from becoming “double charge.”

Vendors and affiliates onboard with **Stripe Connect Express**. Tips are a first-class model with their own routes and realtime hooks. Vendor payouts, adjustments, and accounting export give ops a path out of spreadsheets.

### Delivery & geo

Polygon **delivery zones** (GeoJSON) with fees and minima. Geocoding cache (zip / city / address) reduces third-party spend. Unified marketplace search supports radius. Tracking points power Leaflet UIs. Driver and vendor delivery views close the loop for in-house jobs.

### Affiliates as real economics

Not a coupon bolted on. Rate resolution from payout group / per-user override / platform default; attribution via store link, customer referral, checkout code; caps and audit logs; vendor-side affiliate sales views. Commissions know about payment rails.

### Vendor ops & admin

Teams and invitations, KYC/KYB-style verification, enhanced promotions, store readiness / hours. Admin covers users, applications, catalog, finance, affiliates, delivery event tooling, settings, and audit trails.

### Media & search

Multipart upload with client-side compression; local or cloud storage. Favorites for stores and items. Search is its own rate-limited route group so marketplace query traffic doesn’t share fate with CRUD.

---

## The codegen pipeline (DX that scales)

Day-to-day loop:

```bash
pnpm gen:all
# prisma generate
# → DTO generation from Prisma into schemas
# → OpenAPI JSON from resource registry
# → OpenAPI Generator → packages/sdk

pnpm fresh          # reset DB, migrate, gen:all
pnpm start:local    # setup + both apps
pnpm check:api      # drift / contract / usage
pnpm db:seed        # roles, Austin stores, geo caches
pnpm river:initial  # bootstrap feed content
```

Swagger UI at `/docs` is the live handshake for resource APIs. Playwright and Vitest cover layers; focused smoke scripts exist for Stripe and DoorDash paths. Railway configs split **API**, **web**, and a **river-ingest** worker so content jobs don’t share process fate with request handlers.

---

## Why this shape

A delivery marketplace fails in two ways: product sprawl (every role gets a bespoke backend) or framework fantasy (everything is a generic CRUD resource until money and trucks show up).

Shop-Shop splits the difference:

1. **Resources + Zod** for the stable catalog surface — typed end-to-end, cheap to evolve.
2. **Explicit services** for River ranking, checkout idempotency, Connect fees, delivery providers, and affiliate rates.
3. **Shared packages** so the SPA, API, and workers argue about one schema and one order machine.
4. **Realtime topics with ACLs** so “live tracking” isn’t an unbounded broadcast.

The result is a monorepo that still feels like one system: change a store list hook, regenerate the SDK, keep Vite same-origin, and ship another role without inventing another stack.

---

## Try it locally

```bash
cp .env.example .env   # DATABASE_URL, JWT, Stripe, etc.
pnpm install
pnpm start:local       # migrate + generate + API :3005 + web :5177
```

Then open the web app, hit `/docs` for the API, and watch a WebSocket-backed order if you drive a checkout through to assigned delivery.

---

*Shop-Shop is a TypeScript marketplace: Fastify + Prisma + React, codegen where CRUD is honest, custom code where markets get weird. If you’re building multi-sided logistics with a social discovery surface, the interesting part isn’t picking React or Fastify — it’s deciding which boundaries you’ll refuse to blur.*
