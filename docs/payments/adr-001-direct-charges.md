# ADR 001: Stripe Connect direct charges with application fees

- **Status:** Accepted, 2026-11-07. Not implemented yet. Card checkout is paused until it is.
- **Supersedes:** destination charges (`transfer_data` + `application_fee_amount`), the current implementation.

## Context

Shop-Shop's vendors are independent local merchants selling their own products. Shop-Shop provides discovery,
checkout and order management, and earns a configurable commission (default 3%). Each order belongs to one vendor.

Checkout today uses **destination charges**: the payment belongs to the platform, which transfers the vendor's share.
The Railway Stripe sandbox (`acct_1TSigsGWPpKyVokM`) uses Stripe's default Managed Risk configuration, where Stripe is the
losses collector. Under it, destination charges aren't supported (the `on_behalf_of` variant is private preview).
Making them work would mean Shop-Shop accepting liability for every vendor's negative balance, just to run test checkout.
See [stripe-test-mode.md](stripe-test-mode.md).

## Decision

Use **direct charges with `application_fee_amount`**. The vendor's connected account is the merchant of record and owns
the payment. Shop-Shop collects its commission as an application fee.

| | Direct charges (chosen) | Destination charges (current) |
|---|---|---|
| Payment belongs to | Vendor | Platform |
| Vendor receives funds | Directly | Through a platform transfer |
| Shop-Shop commission | Application fee | Application fee or retained amount |
| Refunds debit | Vendor balance | Platform balance |
| Chargebacks debit | Vendor balance | Platform balance |
| Stripe processing fees | Depend on the Connect fee configuration | Platform |
| Works with Managed Risk | Yes | No (except a private preview) |
| Code today | Needs changes | Implemented |

## Consequences: future implementation requirements

1. **PaymentIntents on the connected account.** Create, confirm and retrieve with the `stripeAccount` request option.
   Drop `transfer_data`, and keep `application_fee_amount` from `platformApplicationFee()`.
   Files: `packages/db/src/adapters/payments.adapter.ts`, `packages/db/src/services/payment.service.ts`.
2. **Keep the commission math.** `serviceFeeAmount` / `vendorCommissionAmount` / `netToVendor` stay as they are, and the
   application fee still equals the platform's share.
   Files: `packages/db/src/services/payment.service.ts` (`platformApplicationFee`) and the pricing in
   `apps/server/src/services/checkout.service.ts`.
3. **Checkout in the vendor's payment context.** Stripe.js and Elements must load with the connected account
   (`loadStripe(pk, { stripeAccount })`), so the PaymentMethod is created on that account. The checkout response must
   return the account id. Files: `apps/web/src/features/checkout/lib/stripeClient.ts`,
   `apps/web/src/features/checkout/components/StripePaymentFields.tsx`, `PaymentSection/PaymentSection.tsx`,
   `apps/web/src/pages/shared/Checkout.page.tsx`, `apps/server/src/services/checkout.service.ts`.
4. **Connected-account webhooks.** Payment events for direct charges happen on the connected account and go only to a
   **Connect** endpoint, which has its own signing secret. The server must verify both secrets (platform and Connect) and
   route on `event.account`, using the order's `storeId` → `stripeAccountId` to reject events from the wrong account.
   Lookups by PaymentIntent id stay unique per order. Files: `apps/server/src/routes/stripe-webhook.route.ts`,
   `packages/db/src/adapters/payments.adapter.ts` (`verifyWebhookSignature`), the env schema, and Railway configuration.
   This also closes the `account.updated` gap described in stripe-test-mode.md.
5. **Refunds, disputes, idempotency, reconciliation.** Refunds are created on the connected account (no
   `reverse_transfer`; set `refund_application_fee` deliberately). Disputes debit the vendor; the platform's dispute
   handling only records them. Idempotency keys must include the account. Exports must stop expecting
   `stripeTransferId`, and read application fees from the connected account's charges.
   Files: `packages/db/src/adapters/payments.adapter.ts` (`createRefund`, `retrieveOrderRefund`),
   `packages/db/src/services/order-operations-worker.ts`, `packages/db/src/services/accounting-export.service.ts`,
   `packages/db/src/services/tip.service.ts` (it records `transfer_data.destination` today),
   `apps/web/src/pages/admin/OrderDetail.page.tsx`.
6. **Stripe-hosted vendor onboarding.** Create accounts with Stripe as the losses collector, onboard them through
   Account Links, and require `card_payments` active / `charges_enabled` before a store takes cards (the gate in
   `storeAcceptsOnlineCardPayments` stays). Files: `packages/db/src/services/payment.service.ts` (Connect operations),
   `apps/server/src/routes/payment.route.ts`, `packages/db/scripts/stripe-test-vendor.ts` (move it to hosted onboarding,
   or link-only with `--account`).
7. **Tax and merchant of record.** With the vendor as merchant of record, decide whose Stripe Tax registration the
   tax calculation and reporting use, and whether the calculation runs in the connected-account context.
   File: `apps/server/src/commerce/tax.ts`.
8. **Historical records.** Don't migrate or rewrite existing orders or charges. Orders paid as destination charges keep
   their `stripePaymentIntentId` / `stripeTransferId`, and refunds of those orders keep using the destination-charge path.
   Branch on whether the order has a `stripeTransferId`, or record the charge model on the order going forward.
9. **Verify before building.** Confirm on the exact account (the Railway sandbox first, then production) that Connect
   is enabled, that direct charges with application fees are allowed, and that the losses collector and fee payer are
   the intended ones.

## Not decided here

- Who pays Stripe processing fees (the vendor or Shop-Shop) under the Connect fee configuration.
- Whether vendors get the Express or the full Stripe Dashboard.
- Multi-vendor carts. One order still means one vendor and one connected account.
