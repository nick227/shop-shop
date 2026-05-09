# Shop-Shop go-live checklist (100 points)

Each item must be **true** before launch. Short statements only; expand in runbooks as needed.

## Infrastructure & environments

1. Production environment exists and is separate from staging.
2. Staging mirrors production topology closely enough to trust releases.
3. Production secrets are stored in a secrets manager or vault, not in git.
4. No default or demo passwords exist on production systems.
5. SSH/API keys for production are rotated and least-privilege scoped.
6. Database runs with backups enabled and a tested restore path.
7. File/object storage for uploads is production-grade and redundantly stored.
8. CDN or static asset hosting is configured for the web app where applicable.
9. Domain DNS records point to the intended production hosts.
10. SSL/TLS certificates are valid, auto-renewing, and cover all public hostnames.

## Application configuration

11. `NODE_ENV` / production mode is enabled for all production servers and builds.
12. Production API base URLs and web origins are correct end-to-end.
13. CORS and allowed origins match production domains only.
14. Cookie flags (Secure, SameSite, HttpOnly where appropriate) are set for production.
15. Session/JWT expiry and rotation policies are defined and deployed.
16. Feature flags for unfinished work are off or safely gated in production.
17. Rate limiting is enabled on public and authenticated APIs.
18. Request body/size limits are configured to prevent abuse.
19. Idempotency or duplicate-submit protection exists for payments and critical writes.
20. Environment-specific config is documented (what differs per env).

## Commerce & money

21. Payment provider is live (not sandbox-only) with verified credentials.
22. Webhooks from the payment provider are verified (signatures) and idempotent.
23. Refund and partial-refund flows are tested on staging with production-like data.
24. Tax calculation rules match your jurisdiction and product categories.
25. Currency display and rounding match backend rules everywhere in the UI.
26. Order totals reconcile with payment captures and internal ledgers.
27. Failed payments surface clear errors without leaking internal details.
28. Subscription or recurring billing (if any) is tested for renewals and failures.
29. Payout or settlement timing for vendors/affiliates is documented and accurate.
30. Chargeback/dispute contact and process are defined.

## Orders & fulfillment

31. Order lifecycle states are consistent between API, DB, and customer/vendor UIs.
32. Customers receive order confirmation emails or in-app confirmations for placed orders.
33. Vendors receive notifications for new orders by the agreed channel.
34. Delivery vs pickup modes behave correctly per store configuration.
35. Address validation or geocoding (if used) works for your primary regions.
36. Driver or courier assignment flows (if any) are tested end-to-end.
37. Cancellation rules (customer, vendor, system) are implemented and communicated.
38. Inventory or availability prevents overselling where the product promises it.
39. Bundle and composite items price and fulfill correctly.
40. Time zones for cutoffs, store hours, and scheduled orders are correct.

## Accounts & access

41. Customer signup, login, password reset, and email verification work in production.
42. Vendor onboarding and approval gates match your policy.
43. Role-based access is enforced server-side for vendor and admin actions.
44. Affiliate signup, approval, and commission visibility match policy.
45. Admin tools are restricted to authorized staff and audited where sensitive.
46. Session invalidation on password change works if required.
47. Account deletion or export requests (if applicable) have a defined path.
48. MFA or step-up auth is enabled for high-risk admin actions if promised.
49. API keys for integrations are scoped, rotatable, and not logged in plain text.
50. Brute-force protection exists on login and sensitive endpoints.

## Data & privacy

51. PII handling complies with your stated privacy policy and applicable law.
52. Consent banners or marketing opt-in reflect actual email/SMS usage.
53. Data retention windows are defined for logs, orders, and user profiles.
54. Database migrations for launch have been applied with a rollback plan.
55. Seed or demo data is absent from production databases.
56. Error pages and logs do not expose stack traces or secrets to end users.
57. Customer-visible URLs do not leak internal IDs unnecessarily (acceptable risk documented).
58. File uploads reject dangerous types and scan or limit size appropriately.
59. Backups exclude unnecessary secrets and are encrypted at rest.
60. Data export for GDPR/CCPA (if required) is feasible operationally.

## Observability & operations

61. Centralized logging exists for API and critical background jobs.
62. Error tracking (e.g. Sentry-class) is wired for production with sane sampling.
63. Uptime or synthetic checks cover homepage, search, checkout, and login.
64. Alerts exist for payment failures, webhook errors, and database connectivity.
65. On-call rotation or escalation path is assigned for launch week.
66. Runbooks exist for rollback, disable checkout, and maintenance mode.
67. Deployment process is repeatable (CI/CD or scripted) and documented.
68. Database connection pooling and timeouts are tuned for expected load.
69. Background workers/queues are monitored for backlog growth.
70. Third-party status pages are bookmarked for payment and email providers.

## Quality & UX

71. Smoke tests pass on staging against production-like configuration.
72. Critical paths work on latest Chrome, Safari, Firefox, and Edge (mobile + desktop).
73. Checkout completes successfully with a real small-value test in production pre-launch.
74. Search and store discovery return sensible results for flagship stores.
75. Empty states and error messages are human-readable, not raw API errors.
76. Loading and failure states exist for slow networks on key screens.
77. Legal pages (Terms, Privacy, refund policy) are published and linked in footer/checkout.
78. Contact/support channel is visible and monitored.
79. Email templates render correctly and links use production URLs.
80. SMS or push (if used) deliver and deep-link correctly.

## Content & SEO

81. Production `robots.txt` and `sitemap.xml` match launch intent (index/no-index).
82. Canonical URLs and Open Graph tags are correct on marketing and store pages.
83. No staging domains are indexed if they should remain private.
84. Analytics (if used) uses production tags only and respects consent.
85. Affiliate or referral links resolve and attribute correctly in production.

## Security hardening

86. Security headers (CSP, HSTS, X-Frame-Options, etc.) are set per policy.
87. Dependencies are audited; critical CVEs addressed or explicitly accepted.
88. Admin and vendor routes are not enumerable without authentication.
89. CSRF protection matches your auth model (cookies vs tokens).
90. File downloads use signed URLs or auth checks as appropriate.

## Launch readiness

91. Rollback plan for the first release is agreed and rehearsed once.
92. Launch communication (internal and external) is drafted and owner-assigned.
93. Known launch-day limitations are documented for support staff.
94. Customer support macros or FAQs cover payments, orders, and refunds.
95. Vendor training or quick-start doc is available for day-one operations.
96. Affiliate communications (if live) explain commissions and timelines accurately.
97. Performance budget or load test results meet minimum targets for launch traffic.
98. Legal review of promotions, coupons, and affiliate terms is complete if applicable.
99. Final production config review completed by two people (four-eyes).
100. Go/no-go decision recorded with date, participants, and explicit approval.

---

## Readiness matrix (repository snapshot)

Point-in-time audit of the codebase and CI against this list (**not** a substitute for production verification). Update statuses after changes or launch prep.

### Status legend

| Status | Meaning |
|--------|---------|
| **Pass** | Requirement is clearly met in repo (code, config, or CI). |
| **Partial** | Some support exists; needs QA, staging/prod proof, or policy alignment. |
| **Gap** | Not met or clearly incomplete in the product/codebase as reviewed. |
| **External** | Depends on hosting, keys, legal, or process—confirm outside the repo. |

### Infrastructure & environments (1–10)

| # | Status | Notes |
|---|--------|-------|
| 1 | External | Confirm prod and staging are separate deployments. |
| 2 | External | Confirm topology parity with ops. |
| 3 | External | Confirm secrets not committed; use vault in prod. |
| 4 | External | Confirm no demo credentials in prod. |
| 5 | External | Key rotation and IAM outside repo. |
| 6 | External | Backup/restore with provider or DBA. |
| 7 | Partial | `STORAGE_TYPE` / non-local storage must be set for prod uploads. |
| 8 | External | CDN or static hosting config. |
| 9 | External | DNS as deployed. |
| 10 | External | TLS termination and cert renewal. |

### Application configuration (11–20)

| # | Status | Notes |
|---|--------|-------|
| 11 | Partial | `NODE_ENV` / prod build paths exist; confirm deploy sets production. |
| 12 | Partial | `VITE_API_URL` required in prod web build; validate real URLs. |
| 13 | Partial | `CORS_ORIGINS` list; localhost origins allowed in server (dev-friendly). |
| 14 | Partial | Auth uses Bearer JWT (not http-only cookies); document threat model for XSS. |
| 15 | Partial | JWT expiry in `env`; refresh/rotation policy should match product. |
| 16 | Gap | No feature-flag mechanism found in codebase. |
| 17 | Partial | `@fastify/rate-limit` + per-route limits (auth, payments, search); not every route. |
| 18 | Pass | Multipart max size set (e.g. 50MB). |
| 19 | Pass | Stripe webhook signature + idempotent `eventId`; guarded checkout/order creation. |
| 20 | Partial | Server `env.ts` documents core vars; full env matrix not in repo. |

### Commerce & money (21–30)

| # | Status | Notes |
|---|--------|-------|
| 21 | External | Live Stripe keys and dashboard config. |
| 22 | Pass | Webhook verification + duplicate handling in handler. |
| 23 | External | Test refunds on staging with prod-like data. |
| 24 | External | Validate tax rules vs jurisdiction. |
| 25 | External | UI vs API rounding review. |
| 26 | External | Reconcile orders vs Stripe vs ledger in staging. |
| 27 | Partial | Prod errors sanitized; client error formatting helpers exist. |
| 28 | External | Recurring billing only if product uses it. |
| 29 | External | Payout policy and copy for vendors/affiliates. |
| 30 | External | Chargeback process and contact. |

### Orders & fulfillment (31–40)

| # | Status | Notes |
|---|--------|-------|
| 31 | Partial | Order model and transitions exist; cross-UI consistency needs QA. |
| 32 | Partial | In-app success paths; transactional email not verified in repo. |
| 33 | Partial | Realtime/publish after payment exists; channel matches ops expectation. |
| 34 | Partial | Delivery/pickup in domain and checkout; store-level QA. |
| 35 | Partial | Geocoding routes exist; validate primary regions. |
| 36 | External | E2E driver flows if used in launch scope. |
| 37 | Partial | Cancellation routes/services exist; publish policy to users. |
| 38 | External | Inventory rules vs business promise. |
| 39 | Partial | Bundles supported in order/resource layer; test flagship cases. |
| 40 | External | Timezone behavior for hours and cutoffs. |

### Accounts & access (41–50)

| # | Status | Notes |
|---|--------|-------|
| 41 | External | Prod smoke for signup, reset, verification. |
| 42 | Partial | Vendor onboarding and readiness routes exist; match written policy. |
| 43 | Partial | Server-side `requireRole` / RBAC patterns present. |
| 44 | Partial | Affiliate flows and pages exist; policy alignment external. |
| 45 | Partial | Admin routes gated by role; audit trail partial by feature. |
| 46 | External | Password-change session invalidation if required by policy. |
| 47 | Partial | CSV exports for ops; consumer deletion/export process largely external. |
| 48 | Gap | No MFA surfaced for admin in codebase review. |
| 49 | External | Integration API keys rotation and logging hygiene. |
| 50 | Partial | Login rate limit; extend review to other sensitive mutations. |

### Data & privacy (51–60)

| # | Status | Notes |
|---|--------|-------|
| 51 | External | Privacy policy and practices vs actual data use. |
| 52 | Gap | Cookie/consent banner not evidenced for marketing/analytics. |
| 53 | External | Retention policy and implementation. |
| 54 | Partial | Prisma migrations exist; rollback plan per release external. |
| 55 | External | Confirm prod DB has no seed/demo data. |
| 56 | Partial | Prod 500 responses hide internals; validation details gated in prod. |
| 57 | External | URL design and ID exposure review. |
| 58 | Partial | Upload size limits; MIME/extension policies should be confirmed for abuse. |
| 59 | External | Backup encryption and scope with provider. |
| 60 | Partial | Operational exports exist; full GDPR/CCPA program if legally required. |

### Observability & operations (61–70)

| # | Status | Notes |
|---|--------|-------|
| 61 | Partial | Structured logging (e.g. Fastify/pino); central aggregation external. |
| 62 | Partial | Optional client reporting + server `ERROR_ENDPOINT`; not full Sentry deployment in repo. |
| 63 | External | Synthetic uptime checks with vendor. |
| 64 | External | Alerting on payments, webhooks, DB. |
| 65 | External | On-call and escalation for launch. |
| 66 | External | Runbooks for rollback and maintenance. |
| 67 | Pass | CI workflow: install, build, test, E2E, audit gates. |
| 68 | External | Pool/timeouts tuned for expected load. |
| 69 | External | Queue/worker monitoring if applicable. |
| 70 | External | Bookmark vendor status pages operationally. |

### Quality & UX (71–80)

| # | Status | Notes |
|---|--------|-------|
| 71 | Partial | CI runs integration and Playwright E2E; staging smoke external. |
| 72 | Partial | Stripe Payment Element + PaymentMethod → checkout; run real card smoke in staging/prod. |
| 73 | External | Real small-value prod transaction before cutover. |
| 74 | External | Search/discovery QA with real catalog. |
| 75 | Partial | `readHttpError` / summarized messages; spot-check raw errors in UI. |
| 76 | Partial | Loading states vary by screen; spot-check slow 3G. |
| 77 | Partial | `/terms`, `/privacy`, `/refund-policy` routes + checkout/cart links; replace placeholder copy with counsel-reviewed text. |
| 78 | External | Support contact visibility and mailbox/chat monitoring. |
| 79 | External | Email templates and prod URLs in notifications if sent. |
| 80 | External | SMS/push only if product uses them. |

### Content & SEO (81–85)

| # | Status | Notes |
|---|--------|-------|
| 81 | Partial | `public/robots.txt` + `sitemap.xml` added; replace `YOUR-PRODUCTION-DOMAIN` in sitemap before launch. |
| 82 | Partial | Basic HTML meta; OG/canonical not verified across marketing/store pages. |
| 83 | External | Staging `noindex` and robots policy with hosting. |
| 84 | External | Analytics tags and consent alignment. |
| 85 | Partial | Referral/affiliate routes exist; prod attribution testing external. |

### Security hardening (86–90)

| # | Status | Notes |
|---|--------|-------|
| 86 | Partial | `@fastify/helmet` registered (CSP disabled for JSON API); tune policy with reverse proxy if needed. |
| 87 | Partial | `pnpm audit` in CI; triage findings explicitly. |
| 88 | Partial | Swagger UI served only when `NODE_ENV !== production`. |
| 89 | Pass | Bearer token API; CSRF not required for same typical SPA model. |
| 90 | Partial | Media/download paths should be reviewed for auth or signed URLs. |

### Launch readiness (91–100)

| # | Status | Notes |
|---|--------|-------|
| 91 | External | Rollback rehearsal and owner. |
| 92 | External | Comms plan and owners. |
| 93 | External | Launch-day limitations doc for support. |
| 94 | External | Support macros/FAQs. |
| 95 | External | Vendor training materials. |
| 96 | External | Affiliate comms if applicable. |
| 97 | External | Load/performance evidence for expected traffic. |
| 98 | External | Legal review of promos and affiliate terms. |
| 99 | External | Four-eyes production config review. |
| 100 | External | Recorded go/no-go decision. |

### Quick counts (this snapshot)

| Status | Count |
|--------|-------|
| Pass | 5 |
| Partial | 40 |
| Gap | 3 |
| External | 52 |

*Treat this list as a gate: anything unchecked is either done before launch or explicitly waived with owner and risk noted.*

---

## Delivery regression checklist (manual QA)

Use after shipping delivery-related changes (DoorDash, in-house, tracking UI).

### DoorDash path

| Step | Verify |
|------|--------|
| Quote | Checkout quote returns ETA/fee when DoorDash / third-party mode selected. |
| Checkout | Order creates with `deliveryMode` `THIRD_PARTY_PROVIDER`, coords + paid path OK. |
| READY | Vendor marks order READY; dispatch enabled. |
| Dispatch | `POST …/dispatch` with `DOORDASH_DRIVE` returns 201 + job + optional tracking URL. |
| Webhook | Provider webhook updates `DeliveryJob` + order status (`OUT_FOR_DELIVERY` / `DELIVERED`) as configured. |
| Delivered | Customer order tracking shows terminal state + external tracking link when present. |

### In-house path

| Step | Verify |
|------|--------|
| READY | Store-managed delivery order READY with coords. |
| Dispatch | `IN_HOUSE` dispatch with valid driver assignment. |
| Status | Order transitions to `OUT_FOR_DELIVERY` then `DELIVERED` via provider/webhook or internal actions as implemented. |
| Tracking API | `GET /api/delivery/tracking/:orderId` returns latest job for `DELIVERY` orders (Bearer required). |

### Customer tracking

| Step | Verify |
|------|--------|
| Auth | Tracking endpoint rejects unauthenticated callers (`401`). |
| Ownership | Customer A cannot load tracking JSON for customer B’s order (`403`). |
| Vendor | Team member with deliveries scope can load tracking for their store’s orders. |
| Realtime | WebSocket events scoped by `orderId` + `userId`; when disconnected, UI shows polling interval. |

### Admin / ops

| Step | Verify |
|------|--------|
| Jobs list | `GET /api/admin/delivery/jobs` admin-only. |
| Events | `GET /api/admin/delivery/events` shows webhook audit trail for investigations. |

### Failure modes

| Step | Verify |
|------|--------|
| Failed / canceled job | Customer UI shows destructive alert; status badge matches job row. |
| No coords | Map card hidden when store geo missing; rest of page still works. |

---

## DoorDash sandbox smoke

Prove end-to-end (sandbox or staging): **quote → checkout → READY → dispatch → `providerExternalId` / `trackingUrl` → webhook → delivered**, then verify UI surfaces.

### Automated smoke (canonical — uses mock adapter + real webhook route in tests)

Run from repo root:

```bash
pnpm --dir apps/server run test:stripe-smoke
```

This bundle covers, among other things:

| Proof | Test / area |
|-------|----------------|
| Dispatch creates job + `providerExternalId` + `trackingUrl` | `delivery-dispatch-lifecycle.test.ts` |
| Webhook accepts payload, audit/dedupe, order transition | `doordash-webhook.integration.test.ts` |
| Webhook auth modes | `doordash-webhook-auth.test.ts`, `env.schema.doordash.test.ts` |
| Customer tracking API auth | `delivery-tracking.route.test.ts` |

The legacy file `tests/doordash-sandbox-smoke.test.ts` is **not** maintained against the current Prisma schema; do not rely on it until rewritten. Prefer the server smoke command above.

### Live DoorDash sandbox API (optional)

When exercising **real** DoorDash sandbox credentials (developer dashboard keys, sandbox base URL):

1. Configure env vars from `.env.example` (`DOORDASH_*` client IDs/secrets as applicable to your integration).
2. Run quote → checkout → mark **READY** → vendor **dispatch** (`DOORDASH_DRIVE`).
3. Confirm `DeliveryJob` rows show non-null `providerExternalId` and `trackingUrl`.
4. Trigger or simulate provider webhooks against your **public HTTPS** webhook URL (see Production webhook & env).

### Manual UI verification (after automated smoke + optional live sandbox)

| Surface | Verify |
|---------|--------|
| **Admin delivery event viewer** | New webhook rows appear; payloads auditable; dedupe behavior matches expectations. |
| **Customer tracking** | Order tracking page / `GET /api/delivery/tracking/:orderId` reflects job status after webhook (poll + realtime when enabled). |
| **Vendor dispatch panel** | Status updates after dispatch and after webhook-driven transitions (`DoorDashDispatchPanel` / vendor order UX). |
| **Failed / canceled** | Provider failure/cancel events map to `DeliveryJob` + UI (destructive state, not stuck “in progress”). |

### Staging delivery runbook pass (environment-only gate)

Everything below requires a **real environment**: staging URL, **DoorDash sandbox** credentials in that env, and a **public HTTPS** webhook endpoint that DoorDash can reach (confirm delivery in their dashboard or your server logs).

Do these in order on staging:

| # | Step | What “good” looks like |
|---|------|-------------------------|
| 1 | **Quote** | Delivery quote succeeds for an eligible cart + dropoff address. |
| 2 | **Checkout** | Order completes and is eligible for provider dispatch (paid/COD per policy). |
| 3 | **Mark READY** | Order reaches **READY** through normal vendor flow. |
| 4 | **Dispatch** | Vendor dispatch runs; job has `providerExternalId` and `trackingUrl`. |
| 5 | **Webhook / status** | Provider sends webhook to your HTTPS URL; order/job status updates match the event. |
| 6 | **Customer tracking** | Customer tracking UI (and/or API) reflects status after webhook-driven updates. |
| 7 | **Admin event viewer** | Provider/webhook events appear in the admin delivery event viewer. |
| 8 | **Failed / canceled** | Run or simulate failure/cancel; UI shows the destructive/canceled path correctly (no fake “still delivering”). |

**Milestone when complete:** **Delivery Provider Platform: staging-proven** — feature correctness for the provider path is validated outside CI.

After staging-proven, remaining **production readiness** is **ops**: repeat credential/URL validation on production, confirm **Delivery monitoring / alerts**, and run the same UI spots once on prod if policy requires it.

---

## Production webhook & environment validation

Before production deploy, confirm:

| Item | Notes |
|------|--------|
| `DOORDASH_WEBHOOK_AUTH_MODE` | Must be `basic` or `hmac` in production (never `none`). |
| Basic auth | If `basic`: `DOORDASH_WEBHOOK_BASIC_USER` / `DOORDASH_WEBHOOK_BASIC_PASSWORD` set and match DoorDash dashboard. |
| HMAC | If `hmac`: `DOORDASH_WEBHOOK_SECRET` set; header name aligned (`DOORDASH_WEBHOOK_SIGNATURE_HEADER`). |
| `STRIPE_WEBHOOK_SECRET` | Set for Stripe signature verification. |
| Public HTTPS URLs | DoorDash webhook URL and Stripe webhook URL reachable from the internet (no localhost-only callbacks). |
| `ENABLE_COD_PAYMENTS` | `false` unless COD is intentionally enabled in prod. |

See `.env.example` for variable names and comments.

---

## Delivery monitoring / alerts

- [ ] Alert on DoorDash quote failures above threshold
- [ ] Alert on DoorDash dispatch failures above threshold
- [ ] Alert on webhook auth failures
- [ ] Alert on webhook processing failures
- [ ] Alert on `DeliveryJob` stuck in `DISPATCHED` / `OUT_FOR_DELIVERY` too long
- [ ] Alert on READY orders awaiting dispatch too long
- [ ] Alert on failed/canceled delivery spike
- [ ] Admin delivery event viewer verified in production
- [ ] Manual refresh works for stuck provider deliveries
- [ ] Raw provider payloads remain admin-only

---

## Manual QA matrix (delivery hardening)

Use **Delivery regression checklist** above for step-by-step scenarios. CI smoke (`test:stripe-smoke`) covers correctness in isolation; **staging delivery runbook pass** is the gate for real URLs and sandbox credentials. After **staging-proven**, open questions are **production ops** (webhooks, secrets, monitoring), not feature gaps, unless staging finds a bug.
