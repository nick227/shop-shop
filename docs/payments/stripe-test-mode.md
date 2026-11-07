# Stripe test mode: setup, tools, and known gaps

## Which Stripe account is which

| Where | Stripe account | Keys |
|---|---|---|
| Railway (`server`, `web`) | `acct_1TSigsGWPpKyVokM` "shop-shop sandbox" | `sk_test_51TSigs…` / `pk_test_51TSigs…` |
| Local CLI (`stripe login`) and local `.env` | `acct_1LZ9oRK4WL9c8bOc` | `sk_test_51LZ9oR…` / `pk_test_51LZ9oR…` |

Settings, connected accounts and webhook endpoints are per account. Changing Connect or platform settings on one account does
nothing for the other. Railway's settings live on the **shop-shop sandbox**.

## Webhooks

- **Railway:** test-mode endpoint `we_1UZ2lLGWPpKyVokMBE23qY3V` on the sandbox account →
  `https://shop-shop-server.up.railway.app/webhooks/stripe` (`payment_intent.succeeded`, `payment_intent.payment_failed`,
  `account.updated`). Its signing secret is the server's `STRIPE_WEBHOOK_SECRET`. Verified 2026-11-07 with
  `stripe trigger payment_intent.succeeded --api-key <sandbox sk_test>`: the signature passed and the server returned 200.
- **Local:** `stripe listen --forward-to localhost:3005/webhooks/stripe`, and copy the printed `whsec_` into `.env`.
  A `stripe listen` secret only works while that CLI session is forwarding. Never put one on a deployed server.

Without a working webhook, card orders stay `PENDING_PAYMENT` and the vendor is never told; the API warns at startup.

### Known gap: connected-account events

The endpoint above is a platform endpoint. Stripe sends events that happen **on connected accounts** (notably
`account.updated` when a vendor finishes onboarding or loses `charges_enabled`) only to a **Connect** endpoint
(`connect: true`), and that endpoint has its own signing secret. The server verifies a single `STRIPE_WEBHOOK_SECRET`, so:

- a store's `stripeChargesEnabled` / `stripeOnboarded` does not update by itself when Stripe changes the account;
- it is refreshed when the vendor opens the payout settings, an admin refreshes the store, or `stripe:test-vendor` runs.

This does not block checkout: destination-charge `payment_intent.*` events belong to the platform and arrive on the
platform endpoint. Closing the gap means adding a Connect endpoint and accepting a second signing secret in
`verifyWebhookSignature`.

## Platform loss liability (blocks card checkout on Railway as of 2026-11-07)

> **Decision (2026-11-07):** move to direct charges with application fees. See [ADR 001](adr-001-direct-charges.md).
> Card checkout is paused until then. Option 1 below is not being pursued.

Checkout uses **destination charges**: `transfer_data.destination` + `application_fee_amount`
(`packages/db/src/adapters/payments.adapter.ts`). Stripe supports those only when the **platform** is the losses collector.

Stripe's current default for new Connect platforms is Managed Risk (Stripe is the losses collector). Under it:

- connected accounts must be onboarded through Stripe-hosted or embedded onboarding. The API route that
  `stripe:test-vendor` uses (a platform-controlled account filled in with Stripe's test identity values) is refused;
- destination charges are not compatible (the `on_behalf_of` variant is private preview). Only direct charges are.

To test this app's checkout as built, choose one:

1. **Keep destination charges (no code change):** in the Stripe dashboard for the account in use, go to
   Settings → Connect → Platform profile, and complete the loss-liability acknowledgement (platform as losses collector).
   Then `stripe:test-vendor <store>` can create a test account that takes charges. This is a business decision: the
   platform carries negative balances on connected accounts.
2. **Move to direct charges (code change):** create PaymentIntents on the connected account with
   `application_fee_amount`, onboard vendors through hosted onboarding (the app already has the Connect onboarding flow),
   and add the Connect webhook endpoint, because payment events then occur on the connected account.

## Tools

- `pnpm --filter @packages/db stripe:test-vendor <store>`: creates a test connected account with Stripe's documented
  test values and links it. It needs `sk_test_` and the platform-liability setup above.
  `--account acct_…` links an account that already finished Stripe onboarding, only if Stripe reports
  `charges_enabled`. `--list` shows the stores. Against Railway's database, run from the repo root:
  `railway run --service server -- env DATABASE_URL=<MySQL public URL> pnpm --filter @packages/db stripe:test-vendor <store>`.
- `pnpm --filter @apps/server smoke:order -- <store> [--card pm_card_visa | declined] [--cod] [--delivery] [--cancel] [--remote]`:
  runs checkout and every vendor step, asserting that the shopper's and the vendor's live channels both get each update.
  `--card declined` checks that the order stays unpaid and inactive and that the vendor is never told.
  `--remote` targets a deployed **test** environment (requires `sk_test_`).
