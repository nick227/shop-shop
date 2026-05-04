# River — Developer Guide

Practical reference for working on the **River** social feed: code locations, pipeline model, APIs, data shape, and how to extend automation safely.

**Related docs**

| File | Use |
|------|-----|
| `RIVER_ARCHITECTURE.md` | Product/system design: ordering, automation guardrails, wire contract |
| `RIVER_SOCIAL_ROADMAP.md` | Phase 2 social features (likes, comments, graph, etc.) |
| `apps/server/DEVELOPER_BACKEND.md` | Server route inventory and security notes |

---

## 1. What River is (for engineers)

- **River** is the **ordered feed** backed by the Prisma **`Post`** model. Every row is one card (manual vendor post or automated card).
- **Pipeline (MVP):** domain code **inserts or updates `Post` rows**; the API **reads** with `ORDER BY priority DESC, createdAt DESC, id DESC`. There is no separate feed table yet.
- **Pipeline (later):** optional **workers** can subscribe to events, enrich content, or maintain a denormalized projection **without changing** the public feed JSON shape (`RiverFeedPage` / `RiverFeedItem`), if throughput or multi-source fusion demands it.

---

## 2. Repository map

| Area | Location |
|------|----------|
| Prisma schema (`Post`, `PostSource`, `Item.linkedPosts`) | `packages/db/prisma/schema.prisma` |
| Migrations | `packages/db/prisma/migrations/` |
| Feed logic, cursor pagination, creation | `packages/db/src/services/river.service.ts` |
| HTTP routes | `apps/server/src/routes/river.route.ts` |
| Zod DTOs & River wire schemas | `packages/schemas/src/dtos/river.dto.ts` |
| Barrel exports (River types/schemas) | `packages/schemas/src/index.ts` |
| Route tests (when env resolves `@packages/db`) | `apps/server/src/routes/river.route.test.ts` |

---

## 3. Data model (high level)

- **`Post`** — `storeId`, `content`, `mediaUrls` (JSON array of media items), counters, **`priority`** (default `0`), **`layout`** (default `instagram_basic`), **`source`** (`PostSource`), optional **`automationKey`** (unique when set — idempotency), optional **`linkedItemId`** → `Item`.
- **`PostSource`** — `MANUAL`, `AUTO_STORE`, `AUTO_PRODUCT` (Prisma enum; API feed maps these to lowercase snake strings for `RiverFeedItem.source`).
- **Ordering** — All feed reads use **priority first**, then **recency**, then **`id`** for a stable tie-break (see `getRiverFeed` and `getPosts` in `river.service.ts`).

After schema changes: `cd packages/db && npx prisma generate` and apply migrations (`migrate deploy` or `migrate dev` per your environment).

---

## 4. Pipeline: MVP vs future

```text
[MVP]
  Store / Item / Vendor flows ──► insert/update Post ──► GET /river/feed reads Post (+ joins)

[Future — only if needed]
  Events ──► worker ──► optional projection/cache ──► same GET contract
```

- **Today:** implement automation by calling **`createPost`** (or Prisma) in the same transaction or immediately after the business mutation you care about (e.g. store published, item listed).
- **Guardrails** (duplicates, bursts, rate limits) belong in that domain layer — see the table in `RIVER_ARCHITECTURE.md` §5. Use **`automationKey`** for idempotent inserts (e.g. one welcome post per store).

---

## 5. Backend API

### 5.1 Home feed (cursor) — preferred for the app shell / home page

| | |
|--|--|
| **Method / path** | `GET /river/feed` |
| **Query** | `cursor` (opaque, optional), `limit` (optional string coerced to number, clamped **1–50**, default **20**), `storeId` (optional UUID — scope feed to one store) |
| **Response** | `{ items: RiverFeedItem[], nextCursor: string | null }` |
| **Errors** | `400` with `{ error: 'Invalid cursor' }` if cursor cannot be decoded |

Implementation: `getRiverFeed` in `river.service.ts`; cursor payload is base64url JSON `{ p, t, id }` matching `(priority, createdAt ISO, post id)`.

### 5.2 Legacy list (page-based)

| | |
|--|--|
| **Method / path** | `GET /river/posts` |
| **Query** | Parsed via `PostQuerySchema`: `page`, `limit`, plus filters **`storeId`**, **`sortBy`** (`recent` \| `popular` \| `trending`), **`hasMedia`**, **`pageSize`** (alias mapped to page size with `limit`) |
| **Response** | `{ data, total, page, pageSize, hasMore }` — rows include **`priority`**, **`layout`**, **`source`**, **`linkedItemId`** |

### 5.3 Create post

| | |
|--|--|
| **Method / path** | `POST /river/posts` |
| **Auth** | Required; roles per route |
| **Body** | `CreatePostInputSchema` — includes optional **`priority`**, **`layout`**, **`source`**, **`automationKey`**, **`linkedItemId`** |

Ownership checks are still marked TODO on the route file; review `DEVELOPER_BACKEND.md` before production hardening.

---

## 6. Types (shared package)

Import from `@packages/schemas`:

- **`RiverFeedQuerySchema`**, **`RiverFeedItemSchema`**, **`RiverFeedPageSchema`**
- Types: **`RiverFeedQuery`**, **`RiverFeedItem`**, **`RiverFeedPage`**
- **`CreatePostInputSchema`**, **`PostQuerySchema`**, etc.

The **`RiverFeedItem`** shape is the **stable contract** for clients; map DB enums and JSON media to this in the service layer only.

---

## 7. Frontend expectations

- Call **`GET /river/feed`** with **`nextCursor`** until `nextCursor` is null.
- Branch UI on **`layout`** (default **`instagram_basic`**). **`title`** may stay null until a dedicated column exists; **`body`** maps from `Post.content`.
- **`media`** entries are normalized to **`image` \| `video`** for the feed (youtube/link types from storage are mapped in `river.service.ts`).

---

## 8. Extending the system

| Task | Where / how |
|------|-------------|
| New automated card | Insert `Post` with appropriate **`source`**, **`automationKey`** (unique), optional **`linkedItemId`**, **`priority`** as needed |
| Curate / feature | Raise **`priority`** on specific rows (manual SQL, admin API when you add one) |
| New layout | Add a **`layout`** string value and a matching React component switch; optional future **`layoutPayload`** JSON column if the architecture doc is extended |
| New feed source without workers | Still insert **`Post`** rows — keeps one read path |

---

## 9. Quick checklist before merging River changes

1. Prisma schema + migration applied on target DB.
2. `npx prisma generate` committed if generated client changes are tracked in your workflow.
3. **`GET /river/feed`** manually smoke-tested: first page, second page with `cursor`, invalid cursor → 400.
4. Automation paths tested for **duplicate `automationKey`** (expect unique constraint violation or handled upsert).

---

## 10. Document ownership

- **Design intent & guardrails:** `RIVER_ARCHITECTURE.md`
- **This file:** developer onboarding and day-to-day implementation paths
- **Social roadmap (phase 2):** `RIVER_SOCIAL_ROADMAP.md`
