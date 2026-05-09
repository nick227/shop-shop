# Stripe Connect & card checkout — release validation

Use this in **staging** before production. Card checkout depends on **Stripe Connect readiness** and **webhooks** (synchronous checkout does not mark `PAID`; `payment_intent.succeeded` does).

## Automated verification (run locally before staging)

From repo root:

```powershell
pnpm typecheck
pnpm test:stripe-smoke
```

`test:stripe-smoke` runs Connect gate, webhook signature, PI → PAID/PLACED, and checkout route tests in `@apps/server`.

All of the above should pass before you treat staging manual steps as authoritative.

## Staging / test-mode environment

Set on the **API** process (and build-time for web where noted):

| Variable | Role |
|----------|------|
| `STRIPE_SECRET_KEY` | Test secret (`sk_test_…`) for staging |
| `STRIPE_WEBHOOK_SECRET` | Signing secret (`whsec_…`) — must match the webhook endpoint or Stripe CLI forward |
| `APP_URL` or `WEB_URL` | Public **web** origin used to build Connect **return** and **refresh** URLs when overrides are unset (see `resolveStripeConnectUrls`) |
| `STRIPE_CONNECT_RETURN_URL` | Optional; full URL if you cannot derive from `APP_URL` |
| `STRIPE_CONNECT_REFRESH_URL` | Optional; full URL for incomplete onboarding |
| `ENABLE_COD_PAYMENTS` | Server: `'true'` only if COD should appear in API/checkout (`'false'` or omit otherwise) |
| `VITE_ENABLE_COD_PAYMENTS` | Web build: `'true'` only if COD UI should show (must match server policy for production-like tests) |

**API routes (no `/api` prefix):**

- `POST /payments/connect` — starts Express onboarding (auth required).
- `GET /payments/connect/:storeId/status` — syncs Stripe account snapshot (`charges_enabled`, etc.).
- `POST /payments/create-intent` — card checkout (402 when store cannot accept cards).
- `POST /webhooks/stripe` — Stripe events (**HTTPS** in staging/production).

## Prerequisites

- [ ] `npx prisma generate` succeeds (refresh Prisma client after schema/migrations).
- [ ] Web + server typecheck passes for touched packages (`pnpm typecheck` or project script).
- [ ] Migration applied: `Store` has `stripeChargesEnabled`, `stripePayoutsEnabled`, `stripeRequirementsJson`, etc.

## Stripe Dashboard (staging secret key)

- [ ] Webhook endpoint is reachable over **HTTPS**: `POST https://<your-api-host>/webhooks/stripe`
- [ ] Webhook uses **signing secret** matching `STRIPE_WEBHOOK_SECRET`.
- [ ] Events subscribed include at least:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `account.updated`
- [ ] Raw body is preserved server-side (this codebase uses a buffer parser on the webhook route for signature verification).

### Dev / tunnel alternative (Stripe CLI)

If the API is only on localhost, **Dashboard webhooks cannot reach it**. Use Stripe CLI to forward events and put the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` for that shell session:

```powershell
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Use a **test** PaymentIntent and complete payment with [Stripe test cards](https://docs.stripe.com/testing). Confirm events appear in the CLI output and the server logs show processing (no 400 on signature).

## Dedup & observability

- [ ] `PaymentWebhook` rows are created with unique `eventId` (Stripe event id).
- [ ] Failed webhook handling returns **5xx** so Stripe retries (monitor logs).
- [ ] Plan for stuck orders: query orders `PENDING_PAYMENT` + `UNPAID` older than N minutes with `stripePaymentIntentId` set — reconcile against Stripe Dashboard or add a small admin script later.

## Staging smoke run (ordered)

Do this once per staging deploy or before go-live sign-off.

1. **Deploy / run** API + web with test keys and correct `APP_URL` (or explicit Connect URL overrides).
2. **Health:** `GET https://<api>/healthz` → 200.
3. **Vendor:** Log in, open **store settings**, open **Stripe** section — confirm phase copy matches DB state.
4. **Connect:** Click **Connect Stripe**, complete **Express** onboarding in Stripe (test mode).
5. **Return:** Browser lands on `/vendor/connect/success` (or your override) — no blank 404 from the SPA.
6. **Refresh:** If you hit refresh mid-flow, `/vendor/connect/refresh` should load.
7. **Status sync:** Call or trigger **GET /payments/connect/:storeId/status** (vendor UI usually does this) — confirm in DB or API response: `stripeChargesEnabled` true when Stripe shows charges enabled.
8. **Customer:** As a **different** user, add cart items from that store and open checkout.
9. **Blocked path:** Temporarily clear `stripeChargesEnabled` in DB (or use a second store never onboarded) — card flow should return **402** and the customer UI must explain that **online card payments are not available** (not a generic “Payment failed” only).
10. **Happy path:** Restore a **ready** store — pay with card (`4242…`). In Stripe Dashboard → PaymentIntent → confirm **`transfer_data.destination`** is the connected account id.
11. **Webhook / order state:** After `payment_intent.succeeded`, confirm in DB or UI: **`paymentStatus` = PAID**, **`status` = PLACED**, **`stripePaymentIntentId`** set; vendor sees the order; customer sees confirmation/receipt (checkout alone does not mark PAID).
12. **Idempotency:** In Stripe Dashboard → Developers → Events, **resend** the same `payment_intent.succeeded` — order should not duplicate side effects (Vitest also covers this).

## Vendor flow (one test store)

- [ ] Vendor opens **store edit** → sees Stripe section with correct **phase** (not connected / onboarding / charges pending / ready).
- [ ] **Connect Stripe** opens Express onboarding (Account Link).
- [ ] **Return URL** and **refresh URL** load without 404 (`STRIPE_CONNECT_*` or `APP_URL`-derived `/vendor/connect/success`, `/vendor/connect/refresh`).
- [ ] After onboarding, **GET /payments/connect/:storeId/status** updates DB (`stripeChargesEnabled`, etc.).
- [ ] UI shows **cards enabled** when `chargesEnabled` is true.

## Customer checkout

- [ ] **Store without Stripe Connect / card rails not ready:** API returns **402** for card create-intent **and** the customer sees **friendly checkout-blocked copy** (e.g. store not accepting online cards yet), **not** only a generic payment failure.
- [ ] **Connected + charges enabled** test store: customer completes **card** order; PaymentIntent includes **`transfer_data.destination`** (Stripe Dashboard).
- [ ] Webhook **`payment_intent.succeeded`** — staging drift check:
  - [ ] Order **`paymentStatus`** = **PAID**, **`status`** = **PLACED**
  - [ ] **`stripePaymentIntentId`** saved on the order row
  - [ ] Vendor sees the order (list / dashboard)
  - [ ] Customer sees order confirmation / receipt / status

## Idempotency & duplicates

- [ ] Retry **same** `payment_intent.succeeded` webhook: order does **not** double-publish / duplicate side effects.

## COD / flags

- [ ] **COD** hidden when `VITE_ENABLE_COD_PAYMENTS` / `ENABLE_COD_PAYMENTS` not set.
- [ ] **`cod_test`** rejected server-side for card paths.

## Money-side rules

- [ ] **Payout / affiliate / revenue reports** only treat **`paymentStatus: PAID`** (not merely `PLACED`) — COD stays `PLACED` + `UNPAID` until collected offline.

## Bottom line

Do **not** add another payment processor abstraction until this lifecycle is **green in staging**: Connect onboarding → status sync → card PI with destination → webhook → PAID + PLACED → vendor visibility.
