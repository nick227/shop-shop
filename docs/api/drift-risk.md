# API Drift Risk

Last synced: 2026-05-05.

## High Risk

- `GET /orders/{id}` is used by the funnel but is not covered by runtime contract tests.
- Cart and order resource endpoints are used by the funnel but are not modeled in `docs/api/openapi.yaml`.

## Medium Risk

- `POST /carts` is covered by funnel smoke only; response schema is not validated against OpenAPI.
- `/kitchen/*` and search are optional smoke inputs and are not contract-modeled.
- Checkout error paths for `401`, `403`, `404`, and `410` are specified but not yet covered by runtime tests.

## Low Risk

- Checkout happy-path responses are covered by runtime tests.
- Checkout `400` and `409` error envelopes are covered.
- Generated frontend API types are checked against OpenAPI by `check:api:contract`.

## Next Risk Reduction

- Add `/carts`, `/orders`, `/kitchen`, and search to OpenAPI only after implementation behavior is extracted.
- Add runtime fixtures for unauthorized, forbidden, not-found, and expired-session checkout responses.
- Add a contract diff report in PRs when `docs/api/openapi.yaml` changes.

## Current Gaps

- Missing runtime status coverage: `401`, `403`, `404`, `410`, and `500`.
- Missing deterministic fixture: expired checkout session for `410`.
- Funnel smoke coverage proves the money path, but non-checkout funnel APIs remain outside the OpenAPI SSOT by design.
