# Railway deployment guide

Deploy the Shop-Shop monorepo to [Railway](https://railway.com) as **three services**: API (`server`), frontend (`web`), and **River ingest** (scheduled worker).

Railway loads **one** config-as-code file per service ([Config as code](https://docs.railway.com/guides/config-as-code)). This repo keeps per-service files under `infra/railway/` and uses root `railway.toml` as the default **API** template.

---

## 1. Repository layout

| Path | Purpose |
|------|--------|
| `railway.toml` | Default **server** build/start (same as `infra/railway/server.toml`). |
| `infra/railway/server.toml` | API: `pnpm` build + `pnpm --filter @apps/server start`, `/healthz`. |
| `infra/railway/web.toml` | Web: Vite build + `vite preview` on `$PORT`. |
| `infra/railway/river-ingest.toml` | **River cron**: `pnpm ingest:river`, `cronSchedule` every **10** minutes (UTC). |

In each Railway service → **Settings → Config as code**, set the file path to the matching row (e.g. `/infra/railway/web.toml`). Use the **repository root** as the service root directory.

---

## 2. Create services in Railway

1. **Project** → connect this GitHub/GitLab repo.
2. Add **three** deployable services from the same repo (duplicate service → change name and config path):
   - **server** — Config file: `/infra/railway/server.toml` (or rely on root `railway.toml`).
   - **web** — Config file: `/infra/railway/web.toml`.
   - **river-ingest** — Config file: `/infra/railway/river-ingest.toml`. Treat as a **Cron**-style workload (short process that exits); Railway runs `startCommand` on `cronSchedule` ([Cron jobs](https://docs.railway.com/reference/cron-jobs)).

3. Add a **database** plugin (or external DB) and attach **`DATABASE_URL`** to all three services that need it.

---

## 3. Environment variables

Set variables in Railway per service (or share via Railway references).

### Server (`server`)

```
DATABASE_URL=${{ your-mysql-or-postgres.DATABASE_URL }}
JWT_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
NODE_ENV=production
PORT=3005
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GEOCODING_API_KEY=<your provider key>
REDIS_URL=${{ Redis.REDIS_URL }}
```

Optional River automation tuning (also read by `@packages/db` when ingest runs):

```
RIVER_AUTO_PRODUCT_COOLDOWN_HOURS=24
RIVER_INGEST_RESTOCK=false
```

### Web (`web`)

```
VITE_API_URL=https://<your-server-service>.up.railway.app
VITE_WS_URL=wss://<your-server-service>.up.railway.app/realtime
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Use your real public API base URL (include `https://`, no trailing slash unless your app expects it).

### River ingest (`river-ingest`)

```
DATABASE_URL=${{ your-mysql-or-postgres.DATABASE_URL }}
NODE_ENV=production
```

Same `DATABASE_URL` as the server. The CLI loads the repo root `.env` when present locally; on Railway, variables come from the service environment.

**Note:** Prisma in this repo is configured for **`mysql`** in `packages/db/prisma/schema.prisma`. Use a MySQL-compatible `DATABASE_URL` (PlanetScale, Railway MySQL, etc.), or change the datasource if you intentionally use PostgreSQL.

---

## 4. Database migrations

Run migrations against production from CI or a one-off Railway shell, for example:

```bash
pnpm db:migrate
```

(`pnpm db:migrate` runs `prisma migrate deploy` in `@packages/db`.) Do **not** rely on the River cron service for migrations.

---

## 5. River ingest cron

- **Schedule:** `infra/railway/river-ingest.toml` sets `cronSchedule = "*/10 * * * *"` (every **10** minutes, UTC). Railway’s minimum interval is **5** minutes.
- **Behavior:** each tick runs `pnpm ingest:river` → `runRiverIngestion(prisma)` then exits (see `packages/db/src/cli/river-ingest-run.ts`).
- **Scaling:** keep **one** `river-ingest` service (no replicas) so you do not double-scan the catalog unless you add distributed locking later.

Adjust schedule or command in `infra/railway/river-ingest.toml` and redeploy.

---

## 6. Health checks

- **Server:** `GET /healthz` → `{ ok: true }`. Timeout is set to **60** (seconds) in TOML to match Railway’s [reference](https://docs.railway.com/config-as-code/reference).
- **Web / river-ingest:** no HTTP health check in config; cron jobs must exit cleanly (ingest disconnects Prisma in `finally`).

---

## 7. URLs after deploy

- **Frontend:** Railway public URL for the `web` service.
- **Backend:** public URL for the `server` service (Fastify, e.g. port **3005** internally; Railway maps `$PORT` externally as needed).

---

## 8. Procfile (optional, Heroku-style)

For platforms that read a `Procfile` from the repo root:

```procfile
server: pnpm --filter @apps/server start
web: pnpm --filter @apps/web exec vite preview --host 0.0.0.0 --port $PORT
river-ingest: pnpm ingest:river
```

Railway primarily uses **start command** from config-as-code, not Procfile, unless you configure otherwise.

---

## 9. Troubleshooting

| Issue | What to check |
|--------|----------------|
| Build fails | `pnpm install --frozen-lockfile` at repo root; Node version in Railway matches local. |
| Server DB errors | `DATABASE_URL` format matches Prisma provider (`mysql://…`). |
| River cron never runs | Service has `cronSchedule` in config or Railway UI; previous run must **exit** (stuck run skips the next tick). |
| Ingest errors | Logs for `pnpm ingest:river`; optional `RIVER_INGEST_RESTOCK=true`. |
| Web blank API | `VITE_API_URL` points at the deployed **server** URL. |

---

## 10. Local parity

```bash
pnpm setup:local   # or pnpm db:setup && pnpm gen:all
pnpm dev           # server + web
pnpm ingest:river  # same command as production worker
```

---

## 11. Security

- Production JWT and Stripe **live** keys only on `server`.
- Never expose `DATABASE_URL` or `STRIPE_SECRET_KEY` to the `web` build env (Vite inlines `VITE_*` only).
