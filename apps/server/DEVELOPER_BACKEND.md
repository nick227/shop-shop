# Shop backend — developer overview

This document describes the Fastify server under `apps/server`: registered HTTP APIs, supporting services, shared packages, and suggested next steps.

## Stack and entry points

| Piece | Role |
| --- | --- |
| **Runtime** | Node.js, Fastify 4, TypeScript (`tsx` dev / `tsc` build) |
| **Workspace packages** | `@packages/db` (Prisma, services, `BaseCrudController`), `@packages/schemas` (Zod DTOs, `defineResource`), `@packages/domain` (domain logic used from resource hooks) |
| **Entry** | `src/index.ts` — registers plugins, route modules, auto-generated CRUD, wires realtime broadcast callbacks |
| **Config** | `src/env.ts` — validates `.env` from monorepo root (`../../.env`); required: `DATABASE_URL`, `JWT_SECRET` (≥32 chars); optional Stripe and geocoding keys |
| **Docs** | OpenAPI title “Delivery API”; Swagger UI at **`GET /docs`** |
| **Health** | **`GET /healthz`** → `{ ok: true }` |

### Global plugins (from `src/index.ts`)

- **CORS** — origins from `CORS_ORIGINS` (comma-separated); credentials enabled.
- **Multipart** — uploads up to 50MB (aligned with media routes).
- **`@fastify/rate-limit`** — registered with **`global: false`** (only routes with `config.rateLimit` are limited). Shared presets in **`src/constants/rateLimits.ts`**: auth login/signup **5 / 15 min**, payments/tips/order-cancel tuned per endpoint (IP-based).
- **Swagger** — OpenAPI 3.0.3.
- **Static files** — when `STORAGE_TYPE` is unset or `local`, files under `UPLOAD_DIR` (default `./uploads`) are served at **`/uploads/`**.

---

## Authentication and authorization

| Mechanism | Location | Behavior |
| --- | --- | --- |
| **JWT** | `src/middleware/auth.ts` | Bearer token; loads user via `@packages/db`; attaches `req.user`. |
| **RBAC** | `src/middleware/rbac.ts`, `src/middleware/roles.ts` | `requireRole([...])` after `authenticate`. |
| **Resource access** | `src/routes/loader.ts` | Each CRUD operation uses `requiresAuthentication` / `getRequiredRoles` from resource definitions in `@packages/schemas`. |

Roles referenced in code include `USER`, `VENDOR`, `ADMIN`, `AFFILIATE`, `RIDER`, `STAFF` (see `AuthenticatedUser` in auth middleware).

---

## Auto-generated CRUD APIs (`registerAllResources`)

Resources are declared in `src/resources/index.ts` and registered by `src/routes/loader.ts` using `BaseCrudController` from `@packages/db`. Paths follow `defineResource`: default `/${name}s`, unless `path` is set explicitly (`packages/schemas/src/core/resource.factory.ts`).

| Resource | Base path | Operations (typical) | Notes |
| --- | --- | --- | --- |
| **user** | `/users` | read, update, list | Create is **`POST /auth/signup`** only; ownership on `id`. |
| **promotion** | `/promotions` | create, read, update, delete, list | Public list/read; mutations scoped by ownership rules in resource. |
| **store** | `/stores` | full CRUD | Public list/read; updates scoped to owner. |
| **item** | `/items` | full CRUD | Public list/read. |
| **order** | `/orders` | full CRUD | Domain hooks (`OrderDomain`) for placement and lifecycle; access via `authorizeAccess` + `order-cancellation.route.ts` for cancel/refund flows. |
| **cart** | `/carts` | create, read, list, delete | No PATCH/update route (design comment in resource). |
| **address** | **`/addresses`** | full CRUD | Path normalized in `defineResource` (`address` → `/addresses`). |
| **bundle** | `/bundles` | full CRUD | Public list/read; create/update/delete for vendors with ownership via store. |

**Not auto-registered (commented in `src/resources/index.ts`):** `riverResource`, `mediaResource` — replaced by dedicated route files below.

---

## Custom HTTP route modules

These are registered explicitly in `src/index.ts` **before** `registerAllResources` (order matters only where paths could theoretically collide; none currently documented as conflicting).

### Auth — `src/routes/auth.route.ts`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/signup` | Rate limit 5 / 15 min |
| POST | `/auth/login` | Rate limit 5 / 15 min |

### Payments & Stripe — `src/routes/payment.route.ts`

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/payments/create-intent` | Yes |
| POST | `/payments/connect` | Yes |
| GET | `/payments/connect/:storeId/status` | Yes |
| POST | `/payments/refund` | Yes |
| POST | `/webhooks/stripe` | Signature verification (no Bearer auth) |

### Media — `src/routes/media.route.ts`

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/media/upload` | Multipart |
| GET | `/media` | List |
| DELETE | `/media/:id` | |
| PATCH | `/media/:id/sort` | |

### Realtime — `src/routes/realtime.route.ts`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/realtime` | **WebSocket**; JWT via query `token` or `Authorization`; subscribe/permission checks for vendor topics |

### River (social feed) — `src/routes/river.route.ts`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/river/posts` | Public list |
| GET | `/river/posts/:id` | Public |
| POST | `/river/posts` | Authenticated |
| DELETE | `/river/posts/:id` | Authenticated |
| POST | `/river/posts/:id/like` | |
| DELETE | `/river/posts/:id/like` | |
| GET | `/river/posts/:id/comments` | |
| POST | `/river/posts/:id/comments` | |
| DELETE | `/river/comments/:id` | (path per file) |

### Geocoding — `src/routes/geocoding.route.ts`

Requires `GEOCODING_API_KEY`; otherwise registers stub routes returning **503** for `/geocode/*`.

| Method | Path |
| --- | --- |
| GET | `/geocode/zip` |
| GET | `/geocode/city` |
| GET | `/geocode/address` |
| GET | `/geocode/stats` |

### Tips — `src/routes/tip.route.ts`

| Method | Path |
| --- | --- |
| POST | `/tips` |
| POST | `/tips/:tipId/process` |
| GET | `/tips/:tipId` |
| POST | `/tips/:tipId/refund` |

### Affiliates — `src/routes/affiliate.route.ts`

Signup, profile, commissions, payouts, admin listing, referral lookup, payout status updates (`/affiliates/*`, `/payouts/:id/status`).

### Delivery zones — `src/routes/delivery-zone.route.ts`

CRUD-style routes under `/delivery-zones`, store-scoped listing, fee calculation, bulk priority updates.

### Vendor verification — `src/routes/vendor-verification.route.ts`

Vendor submission flow and admin review under `/vendor-verification/*`.

### Exports (CSV) — `src/routes/export.route.ts`

Accounting-oriented **`GET /exports/*`** endpoints (commissions, payouts, orders, streams, tax summary, service fees, financial summary, vendor payouts). Admin/vendor-gated per route implementation.

### Vendor payouts — `src/routes/vendor-payout.route.ts`

Summary, per-store pending/history, manual processing, eligibility, batch processing under `/vendor-payouts/*`.

### Team — `src/routes/team.route.ts`

Invitations (create, token lookup, accept, decline, delete), store members, roles under `/team/*`.

### Promotions (enhanced) — `src/routes/promotion-enhanced.route.ts`

Validate, redeem, user history, analytics, eligibility, active promotions per store (`/promotions/*`, `/stores/:storeId/promotions/active`).

### Order cancellation — `src/routes/order-cancellation.route.ts`

Cancel flow, eligibility, reasons, stats (`/orders/cancel`, `/orders/:id/can-cancel`, etc.).

### Favorites & reorder — `src/routes/favorites.route.ts`

Favorite stores/items and **`POST /orders/reorder`**, **`GET /orders/me/history`** (alongside generic `/orders` from CRUD).

---

## In-process services (`apps/server`)

| Service | File | Responsibility |
| --- | --- | --- |
| **Realtime broker** | `src/services/realtime.broker.ts` | In-memory pub/sub for WebSocket clients; **`publish`** used when order/tip services broadcast via `setOrderServiceBroadcast` / `setTipServiceBroadcast` from `@packages/db` in `index.ts`. |

**Scaling note:** Comment in broker suggests swapping for Redis pub/sub for multi-instance deployments.

---

## Domain and data layer (outside this app folder)

Business logic for orders, stores, promotions, carts, payments, uploads, etc. lives primarily in **`@packages/db`** and **`@packages/domain`**, invoked from resource `customHooks` and route handlers. Treat this server as the HTTP adapter; deeper behavior is defined there.

---

## Proposals — next steps and fixes

### High priority

1. **River authorization**  
   `river.route.ts` contains TODOs to verify store ownership on posts and comment ownership on delete; closing those gaps reduces privilege escalation risk.

### Medium priority

2. **Realtime scaling**  
   Replace or wrap `InMemoryBroker` with Redis (or similar) so horizontal scaling and reconnect semantics are safe.

3. **OpenAPI completeness**  
   Align Swagger tags/schemas for custom routes with auto-generated resource routes so `/docs` reflects the full surface.

4. **Stripe webhook raw body**  
   Confirm Fastify is configured so `/webhooks/stripe` consistently receives a verifiable raw payload (`rawBody` / `@fastify/raw-body` if needed).

### Lower priority / hygiene

5. **Environment documentation**  
   Keep a single source of truth for optional vs required keys (Stripe, `APP_URL`, `STORAGE_TYPE`, `UPLOAD_DIR`, `GEOCODING_API_KEY`) aligned with `env.ts` and deployment templates.

6. **Rate limiting**  
    Review whether payment and export endpoints need stricter per-route limits than the plugin defaults.

---

*Generated from codebase review of `apps/server` (Fastify app, resources, and routes). Update this file when adding routes or changing registration order.*
