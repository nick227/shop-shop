# River ingestion worker — MVP proposal

Background worker that materializes **`Post`** rows for the River feed from **store** and **item** state. Complements `createPost` / `GET /river/feed` in `packages/db` and `apps/server`.

---

## 1. MVP rules (three ingest types)

### 1.1 Store publish → post

| Field | Value |
|--------|--------|
| **Trigger** | `Store.isPublished === true` |
| **`automationKey`** | `auto_store:{storeId}` |
| **`PostSource`** | `AUTO_STORE` |
| **Media** | Build `mediaUrls` from store **`MediaAsset`** (first by `sortIndex`); if none → **skip** (see guardrails) |

Idempotency: same key as today’s `createPost` path — duplicate insert returns existing post on unique constraint (`P2002`) for `AUTO_STORE`.

### 1.2 New item (with media) → post

| Field | Value |
|--------|--------|
| **Trigger** | `Item.isActive === true` **and** at least one **image** (e.g. `MediaAsset` with `itemId`, `kind === IMAGE`, or any agreed rule) |
| **`automationKey`** | `item_live:{itemId}` |
| **`PostSource`** | `AUTO_PRODUCT` |
| **Include** | `linkedItemId` = `itemId` |
| **Media** | From item **`MediaAsset`** (required; else skip) |

### 1.3 (Optional) Restock → post

| Field | Value |
|--------|--------|
| **Trigger** | `Item.isSoldOut` becomes **`false`** (restock signal) |
| **`automationKey`** | `item_restock:{itemId}` |
| **`PostSource`** | `AUTO_PRODUCT` (same enum as new item; distinguish in **`layout`** or copy if needed) |
| **Include** | `linkedItemId` = `itemId` when product-shaped |
| **Media** | Require **non-empty** `mediaUrls` — reuse item imagery |

---

## 2. How the worker runs

| Aspect | MVP choice |
|--------|------------|
| **Schedule** | Cron **every 5+ minutes** (Railway minimum **5**; repo default **10** in `infra/railway/river-ingest.toml`) |
| **State** | **Stateless** — no `lastRun`, **no** event bus, **no** queue table |
| **Logic** | For each candidate entity, compute **`automationKey`**. **If no `Post` exists with that key** → call **`createPost`** (or `prisma.post.create` with the same guardrails). If one exists → **no-op** |
| **Discovery** | Each run queries current DB truth (e.g. published stores, active items with media, items matching restock policy). “Catch-up” is implicit: anything matching rules eventually gets a post when key is free |

**Note:** Stateless polling scans eligible rows each tick; cost scales with catalog size — acceptable for MVP until volume grows.

---

## 3. Guardrails (must have)

| Rule | Implementation |
|------|----------------|
| **Media required** | Do not insert automation without **`mediaUrls.length >= 1`** — aligns with `createPost` → `RiverAutomationRejected` / skip |
| **Throttle `AUTO_PRODUCT`** | **Max 1** `AUTO_PRODUCT` post **per store** per **12–24h** (use env e.g. `RIVER_AUTO_PRODUCT_COOLDOWN_HOURS`, tune 12–24) — **existing** `assertRiverAutomationAllowed` in `river.service.ts` |
| **Idempotency** | Unique **`automationKey`**; keys **`≤ 128`** chars per schema |

**Restock vs new item:** Both use **`AUTO_PRODUCT`** today — cooldown applies to **both** in aggregate per store. If restock should not consume the slot, split cooldown logic later (worker-level or new `PostSource`).

---

## 4. Feed control (simple)

| Lever | Purpose |
|-------|---------|
| **`priority`** | Controls **order** in feed (`ORDER BY priority DESC, createdAt DESC, id DESC`) |
| **`publishAt`** (optional) | Controls **when** a row becomes visible — **not** on `Post` yet |

### `publishAt` (implemented)

- **`Post.publishAt`** nullable — null or past ⇒ visible on **`GET /river/feed`**, **`getPosts`**, **`getPostById`**; future ⇒ hidden from public reads.
- **`POST /river/posts`** accepts optional **`publishAt`** (ISO / JSON date).
- Worker leaves **`publishAt`** unset for immediate ingest.

---

## 5. Key / source quick reference

| Rule | Key | Source |
|------|-----|--------|
| Store publish | `auto_store:{storeId}` | `AUTO_STORE` |
| New item (with media) | `item_live:{itemId}` | `AUTO_PRODUCT` + `linkedItemId` |
| Restock (optional) | `item_restock:{itemId}` | `AUTO_PRODUCT` + `linkedItemId` |

---

## 6. Future expansion (non-MVP)

Bundles (`Bundle`), promotions (`Promotion`), verification (`VendorVerification`), milestones from **`Order`** aggregates, etc. — same pattern: **unique `automationKey`**, **`mediaUrls`**, **`priority`**, optional **`publishAt`** after schema support.

---

## 7. Implementation (in repo)

| | |
|--|--|
| **API** | `runRiverIngestion(prisma)` in `@packages/db` — `river-ingest.runner.ts` (re-exported from `river-ingest.service.ts`) |
| **CLI** | From repo root: `pnpm ingest:river` or `pnpm --filter @packages/db ingest:river` (`packages/db/src/cli/river-ingest-run.ts`, loads root `.env`, prints JSON result) |
| **Restock** | Off unless `RIVER_INGEST_RESTOCK=true` or `runRiverIngestion(db, { enableRestock: true })` |
| **Production (Railway)** | Separate **`river-ingest`** service: config file `infra/railway/river-ingest.toml` (`cronSchedule` + `pnpm ingest:river`). See **`RAILWAY_DEPLOYMENT.md` §5**. |
| **Cron (local / other)** | Run the same CLI on an interval (e.g. systemd timer, GitHub Actions, or `while sleep` in dev only). |

---

## References

- `packages/db/prisma/schema.prisma` — `Post`, `PostSource`, `Store`, `Item`, `MediaAsset`  
- `packages/db/src/services/river.service.ts` — `createPost`, `getRiverFeed`, automation guards  
- `packages/db/src/services/river.constants.ts` — `RIVER_AUTO_PRODUCT_COOLDOWN_HOURS`  
- `RIVER_ARCHITECTURE.md` — pipeline philosophy  
