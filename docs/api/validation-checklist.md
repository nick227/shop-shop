# Validation Checklist

- OpenAPI matches implemented checkout routes.
- Generated frontend types match OpenAPI.
- Funnel-critical client code avoids raw API fetches.
- Runtime checkout responses match required contract fields.
- Checkout status, cart status, order status, payment status, and delivery type enums are valid.
- Idempotency keys are sent for checkout mutations.
- API client retries only safe requests.
- API client normalizes all contract errors as `ApiContractError`.
- Slow contract requests fail with a clear timeout error.
- `check:api`, `check:api:contract`, and `check:api:usage` pass before merge.
